import { setTimeout as delay } from "node:timers/promises";
import { readFile, rename } from "node:fs/promises";
import { resolve, join } from "node:path";
import { openStore } from "../vendor/pstack/store.mjs";
import { sha, canonical, assert, text, id, git, readJson, repositoryIdentity, unitInputHash, publicationIdentity, atomic, receipt } from "./delivery-common.mjs";
import { validatePlan } from "./delivery-plan.mjs";
import { deliveryReadiness } from "./delivery-readiness.mjs";
import { deliveryExecution } from "./delivery-execution.mjs";
import { deliveryVerification } from "./delivery-verification.mjs";
import { deliveryPublication } from "./delivery-publication.mjs";

export class Delivery {
  constructor(directory) {
    this.directory = resolve(directory);
    this.store = openStore(this.directory);
  }
  async locked(fn) {
    try {
      const deadline = Date.now() + 5000;
      for (;;) {
        try { await this.store.init(); break; }
        catch (error) {
          if (!/^store lock held by pid /.test(error.message)) throw error;
          if (Date.now() >= deadline) throw new Error(`store contention timed out after 5000 ms; ${error.message}; retry after the owner completes`);
          await delay(25);
        }
      }
      return await fn();
    } finally {
      await this.store.close();
    }
  }
  async load() {
    const state = await readJson(join(this.directory, "delivery.json"));
    validatePlan(state.plan);
    for (const r of Object.values(state.repos))
      if (!r.pr_identity && r.published) r.pr_identity = publicationIdentity(r);
    return state;
  }
  async fingerprint(plan) {
    const inputs = [];
    for (const source of plan.sources.filter((s) => s.status === "read"))
      inputs.push({ id: source.id, ...(await receipt(source.snapshot)) });
    return sha(canonical({ plan, inputs }));
  }
  async save(state, event) {
    if (event) {
      state.events.push({ at: new Date().toISOString(), ...event });
      await atomic(join(this.directory, "delivery.json"), state);
    }
    // pstack's units/status/inbox are recoverable projections. delivery.json is authoritative.
    const existing = new Set((await this.store.units.list()).map((u) => u.id));
    for (const u of state.plan.units) {
      if (!existing.has(u.id))
        await this.store.units.add({
          id: u.id,
          track: u.repo,
          brief: `case:${u.case_ids.join(",")}`,
        });
      const row = state.units[u.id];
      await this.store.units.set({
        id: u.id,
        state: row.state,
        branch: state.plan.repositories.find((r) => r.id === u.repo).branch,
        ...(row.head ? { sha: row.head } : {}),
      });
    }
    const openGates = new Map(
      (await this.store.gates.list()).map((g) => [g.id, g]),
    );
    const pending = [
      ...state.blockers
        .filter((b) => !b.resolved)
        .map((b) => ({
          id: b.id,
          question: b.reason,
          options: `Owner: ${b.owner}; unblock when: ${b.unblock_when}`,
          defaultAnswer: "hold affected units; continue independent work",
        })),
    ];
    if (state.approval?.hash !== state.plan_hash)
      pending.push({
        id: "approve-plan",
        question: `Approve plan ${state.plan_hash}?`,
        options: "approve exact hash with human evidence; or revise",
        defaultAnswer: "hold implementation",
      });
    for (const [repo, value] of Object.entries(state.repos))
      if (value.publication && !value.publication.approval)
        pending.push({
          id: `publish-${repo}`,
          question: `Approve exact PR package ${value.publication.hash}?`,
          options: "approve exact hash with human evidence; or revise",
          defaultAnswer: "hold external writes",
        });
    for (const gate of pending) await this.store.gates.park(gate);
    for (const [key] of openGates)
      if (!pending.some((g) => g.id === key))
        await this.store.gates.resolve({
          id: key,
          answer:
            "resolved; see authoritative delivery.json event/approval receipt",
        });
    await this.store.status.render();
  }
  async init(plan) {
    return this.locked(async () => {
      validatePlan(plan);
      try {
        await readFile(join(this.directory, "delivery.json"));
        throw new Error("run already exists; use replan");
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      for (const r of plan.repositories)
        assert(
          git(r.path, "rev-parse", r.base_ref) === r.base_sha,
          `${r.id}: baseline is stale`,
        );
      const state = {
        schema: "work-item-delivery.run.v1",
        plan,
        plan_hash: await this.fingerprint(plan),
        unit_inputs: Object.fromEntries(await Promise.all(plan.units.map(async u => [u.id, await unitInputHash(plan,u)]))),
        approval: null,
        units: Object.fromEntries(
          plan.units.map((u) => [u.id, { state: "pending" }]),
        ),
        repos: Object.fromEntries(
          plan.repositories.map((r) => [
            r.id,
            { path: r.path, baseline: r.base_sha, identity:repositoryIdentity(r.path) },
          ]),
        ),
        blockers: plan.blockers.map((b) => ({ ...b, resolved: false })),
        captures: [],
        events: [],
      };
      await this.save(state, { type: "initialized" });
      return { plan_hash: state.plan_hash, ...(await this.summarize(state)) };
    });
  }
  async approvePlan(hash, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireBranchPolicy(s.plan);
      for (const unit of s.plan.units) {
        const tests = unit.unit_test_plan;
        assert(tests && ((typeof tests.reason === "string" && tests.reason.trim()) ||
          (Array.isArray(tests.check_ids) && tests.check_ids.length &&
           tests.check_ids.every(key => unit.checks.some(check => check.id === key)) &&
           Array.isArray(tests.assertions) && tests.assertions.length &&
           tests.assertions.every(value => typeof value === "string" && value.trim()) &&
           typeof tests.before === "string" && tests.before.trim() &&
           typeof tests.after === "string" && tests.after.trim())),
          `${unit.id}: explicit unit-test plan or justified non-applicability required before approval`);
      }
      assert(
        hash === s.plan_hash && hash === (await this.fingerprint(s.plan)),
        "plan hash changed; inspect the new scope",
      );
      s.approval = { hash, ...(await receipt(evidence)) };
      await this.save(s, { type: "plan-approved", evidence: s.approval });
      return { approved: hash };
    });
  }
  async requireBranchPolicy(plan) {
    text(plan.work_item.type, "Work Item type for branch policy");
    const config = await readJson(new URL("../config.json", import.meta.url));
    const prefix = config.branch_prefixes?.[plan.work_item.type] ?? plan.policy.branch_prefix;
    text(prefix, "configured or explicitly approved branch prefix");
    for (const repo of plan.repositories)
      assert(repo.branch.startsWith(prefix) && repo.branch.length > prefix.length,
        `${repo.id}: ${plan.work_item.type} branch must use ${prefix}; got ${repo.branch}`);
  }
  async replan(plan, branchEvidence = null) {
    return this.locked(async () => {
      const s = await this.load();
      validatePlan(plan);
      const sealed = new Set(s.plan.repositories.filter(r => publicationIdentity(s.repos[r.id])).map(r => r.id));
      assert(
        !Object.values(s.units).some((u) => u.state === "active") &&
          !Object.values(s.repos).some((r) => r.verification_running),
        "finish or park active writers/verifiers before replanning",
      );
      assert(
        plan.work_item.id === s.plan.work_item.id,
        "cannot change owning Work Item",
      );
      assert(
        s.plan.repositories.every((r) =>
          plan.repositories.some(
            (n) => n.id === r.id && n.path === r.path,
          ),
        ),
        "replan must retain existing repo identities",
      );
      const renamed = plan.repositories.filter(r => s.plan.repositories.some(old => old.id === r.id && old.branch !== r.branch));
      let branchReceipt;
      if (renamed.length) {
        assert(branchEvidence, "branch rename requires explicit human approval evidence");
        branchReceipt = await receipt(branchEvidence);
        await this.requireBranchPolicy(plan);
        for (const repo of renamed) {
          assert(!sealed.has(repo.id), "published repository branch is immutable");
          const path = s.repos[repo.id].path;
          assert(git(path, "branch", "--show-current") === repo.branch && !git(path, "status", "--porcelain"),
            "bind the renamed clean branch before reconciling");
          const heads = [s.repos[repo.id].verification?.head, repo.base_sha,
            ...s.plan.units.filter(u => u.repo === repo.id).map(u => s.units[u.id].head)];
          assert(heads.includes(git(path, "rev-parse", "HEAD")), "branch rename must preserve the recorded source head");
        }
      }
      assert(
        s.plan.units.every((u) => plan.units.some((n) => n.id === u.id)),
        "case removals need an explicit disposition; keep scoped units and blockers visible",
      );
      for (const r of plan.repositories) {
        const previous = s.plan.repositories.find(old => old.id === r.id);
        if (sealed.has(r.id)) assert(canonical(previous) === canonical(r), "published repository scope/baseline is immutable; plan its follow-up explicitly");
        else assert(git(r.path, "rev-parse", r.base_ref) === r.base_sha, "replan baseline is stale");
      }
      const inputs = Object.fromEntries(await Promise.all(plan.units.map(async u => [u.id, await unitInputHash(plan,u)])));
      const previousInputs = s.unit_inputs ?? Object.fromEntries(await Promise.all(s.plan.units.map(async u => [u.id, await unitInputHash(s.plan,u)])));
      const changed = new Set(plan.units.filter(u => inputs[u.id] !== previousInputs[u.id]).map(u => u.id));
      // Older runs lack per-unit byte fingerprints. Conservatively reconcile all
      // units if their old snapshot bytes changed before this migration.
      if (!s.unit_inputs && (await this.fingerprint(s.plan)) !== s.plan_hash)
        for (const u of plan.units) changed.add(u.id);
      let expanded = true;
      while (expanded) {
        expanded = false;
        for (const u of plan.units)
          if (
            !changed.has(u.id) &&
            u.depends_on.some((d) => changed.has(d.unit))
          ) {
            changed.add(u.id);
            expanded = true;
          }
      }
      for (const u of plan.units.filter(u => sealed.has(u.repo))) {
        assert(!changed.has(u.id) && s.units[u.id], "published case/source scope is immutable; plan its follow-up explicitly");
        assert(canonical(plan.blockers.filter(b => b.units.includes(u.id))) === canonical(s.plan.blockers.filter(b => b.units.includes(u.id))), "cannot replan blockers for published cases");
      }
      for (const u of plan.units)
        if (changed.has(u.id) || !s.units[u.id])
          s.units[u.id] = { state: "pending" };
      for (const r of plan.repositories) {
        if (sealed.has(r.id)) continue;
        s.repos[r.id] = {
          ...s.repos[r.id],
          path: s.repos[r.id]?.path ?? r.path,
          baseline: r.base_sha,
          identity:repositoryIdentity(r.path),
          verification: null,
          review: null,
          publication: null,
        };
      }
      s.plan = plan;
      s.unit_inputs = inputs;
      s.plan_hash = await this.fingerprint(plan);
      s.approval = null;
      const previousBlockers = s.blockers;
      s.blockers = plan.blockers.map(b => ({...b, resolved:false}));
      // A replan cannot silently drop a blocker discovered during execution.
      s.blockers.push(...previousBlockers.filter(b => b.evidence && !b.resolved && !s.blockers.some(n => n.id === b.id)));
      for (const unit of Object.values(s.units))
        if (["verified", "reviewed"].includes(unit.state))
          unit.state = "implemented";
      await this.save(s, { type: "replanned", ...(branchReceipt ? {branch_rename:renamed.map(r=>({repo:r.id,branch:r.branch})),evidence:branchReceipt} : {}) });
      return { approval_required: s.plan_hash };
    });
  }
}

Object.defineProperties(Delivery.prototype, Object.fromEntries(
  Object.entries({ ...deliveryReadiness, ...deliveryExecution, ...deliveryVerification, ...deliveryPublication }).map(
    ([name, value]) => [name, { value, writable: true, configurable: true }],
  ),
));

export { validatePlan, sha, canonical };
