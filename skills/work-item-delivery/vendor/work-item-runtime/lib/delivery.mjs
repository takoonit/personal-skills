import { readFile, writeFile, rename, mkdir, realpath } from "node:fs/promises";
import { resolve, join, isAbsolute, basename } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { openStore } from "../vendor/pstack/store.mjs";
import { validateContext, captureReceipt, captureCoverage, captureBinding } from "./evidence.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const text = (value, label) =>
  assert(typeof value === "string" && value.trim(), `${label} is required`);
const array = (value, label) =>
  assert(Array.isArray(value), `${label} must be an array`);
const id = (value, label) =>
  assert(
    typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value),
    `${label}: invalid id`,
  );
const git = (path, ...args) =>
  execFileSync("git", ["-C", path, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const atLeast = (actual, stage) =>
  [
    "pending",
    "active",
    "implemented",
    "verified",
    "reviewed",
    "published",
  ].indexOf(actual) >=
  ["implemented", "verified", "reviewed", "published"].indexOf(stage) + 2;
const unique = (rows, label) =>
  assert(new Set(rows).size === rows.length, `duplicate ${label}`);
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const repositoryIdentity = path => realpathSync(git(path, "rev-parse", "--path-format=absolute", "--git-common-dir"));
const businessFlows = (plan, unit) => (plan.knowledge?.business_flows ?? []).filter(flow => flow.case_ids.some(id => unit.case_ids.includes(id)));
const unitSourceIds = (plan, unit) => [...new Set([
  ...unit.source_refs,
  ...plan.cases.filter(c => unit.case_ids.includes(c.id)).flatMap(c => c.source_refs),
  ...unit.depends_on.flatMap(dep => dep.source_refs),
  ...businessFlows(plan, unit).flatMap(flow => flow.steps.flatMap(step => step.source_refs)),
])];
async function unitInputHash(plan, unit) {
  const inputs = [];
  for (const key of unitSourceIds(plan, unit).sort()) {
    const source = plan.sources.find(s => s.id === key);
    inputs.push({...source, ...(source.status === "read" ? {receipt:await receipt(source.snapshot)} : {})});
  }
  return sha(canonical({unit, cases:plan.cases.filter(c => unit.case_ids.includes(c.id)), flows:businessFlows(plan, unit), inputs}));
}
const publicationIdentity = repo => repo.pr_identity ?? (repo.published ? {
  pr_url:repo.published.pr_url,
  repository_id:repo.publication?.payload.repository_id,
} : null);
function publicationGate(repo, head) {
  const staged = repo.publication;
  if (repo.published?.head === head) return "published";
  if (staged?.head === head && staged.approval?.hash === staged.hash) return "approved";
  if (staged?.head === head) return "staged";
  if (staged || repo.published) return "stale";
  return "open";
}
async function atomic(path, data) {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  await rename(temporary, path);
}
async function receipt(path) {
  text(path, "evidence file");
  const absolute = await realpath(path);
  const bytes = await readFile(absolute);
  assert(bytes.length > 0, "evidence file is empty");
  return { path: absolute, sha256: sha(bytes), bytes: bytes.length };
}
function validatePlan(plan) {
  assert(
    ["work-item-delivery.plan.v1", "work-item-delivery.plan.v2"].includes(plan.schema),
    "unsupported plan schema",
  );
  text(plan.work_item?.id, "owning Work Item id");
  text(plan.work_item?.url, "owning Work Item URL");
  text(String(plan.work_item?.revision ?? ""), "owning Work Item revision");
  assert(
    plan.policy?.pr_grouping === "one-per-repo",
    "policy must explicitly be one-per-repo; exceptions require a reviewed revised plan",
  );
  for (const field of ["sources", "cases", "repositories", "units", "blockers"])
    array(plan[field], field);
  assert(
    plan.cases.length && plan.units.length && plan.repositories.length,
    "plan needs cases, units and repositories",
  );
  for (const field of [
    "sources",
    "cases",
    "repositories",
    "units",
    "blockers",
  ]) {
    unique(
      plan[field].map((x) => x.id),
      field,
    );
    for (const row of plan[field]) id(row.id, `${field} id`);
  }
  const sources = new Set(plan.sources.map((s) => s.id));
  const cases = new Set(plan.cases.map((c) => c.id));
  const repos = new Map(plan.repositories.map((r) => [r.id, r]));
  const units = new Map(plan.units.map((u) => [u.id, u]));
  const refs = (refs, label) => {
    array(refs, label);
    assert(refs.length, `${label}: source references required`);
    for (const ref of refs)
      assert(sources.has(ref), `${label}: unknown source ${ref}`);
  };
  for (const source of plan.sources) {
    text(source.url, "source locator");
    text(source.section, "source section");
    text(String(source.revision ?? ""), "source revision");
    assert(
      ["read", "unavailable", "conflicted"].includes(source.status),
      "invalid source status",
    );
    if (source.status === "read") text(source.snapshot, "read source snapshot");
  }
  for (const c of plan.cases) {
    text(c.title, "case title");
    text(c.expected, "case expected behavior");
    array(c.task_ids, "case task ids");
    refs(c.source_refs, "case references");
  }
  unique(
    plan.repositories.map((r) => resolve(r.path)),
    "repository paths",
  );
  for (const r of plan.repositories) {
    text(r.path, "repository path");
    assert(isAbsolute(r.path), "repository paths must be absolute");
    text(r.base_ref, "base ref");
    assert(/^[a-f0-9]{40,64}$/.test(r.base_sha), "invalid base SHA");
    text(r.branch, "branch");
    assert(!r.branch.startsWith("-"), "invalid branch");
    assert(
      r.branch !== r.base_ref && `origin/${r.branch}` !== r.base_ref,
      "work branch must differ from target",
    );
    execFileSync("git", ["check-ref-format", "--branch", r.branch], {
      stdio: "pipe",
    });
  }
  unique(plan.repositories.map(r => repositoryIdentity(r.path)), "Git repository identities (aliases/worktrees share one repository)");
  for (const u of plan.units) {
    assert(repos.has(u.repo), `unknown repository ${u.repo}`);
    array(u.case_ids, "unit cases");
    assert(u.case_ids.length, "unit has no cases");
    for (const c of u.case_ids) assert(cases.has(c), `unknown case ${c}`);
    refs(u.source_refs, "unit source refs");
    text(u.current_flow, "current flow");
    text(u.finding, "finding");
    assert(
      ["confirmed", "hypothesis", "unknown"].includes(u.finding_status),
      "invalid finding status",
    );
    if (u.priority !== undefined)
      assert(
        Number.isInteger(u.priority) && u.priority >= 0 && u.priority <= 3,
        "priority must be 0..3, lower first",
      );
    text(u.change, "proposed change");
    array(u.acceptance, "acceptance");
    assert(u.acceptance.length, "acceptance is empty");
    array(u.allowed_paths, "allowed paths");
    assert(u.allowed_paths.length, "allowed paths required");
    for (const p of u.allowed_paths)
      assert(
        typeof p === "string" &&
          p &&
          !isAbsolute(p) &&
          !p.split("/").includes(".."),
        "allowed paths must be relative and confined",
      );
    array(u.checks, "checks");
    assert(u.checks.length, "each unit needs at least one observable check");
    for (const check of u.checks) {
      id(check.id, "check id");
      array(check.argv, "check argv");
      assert(
        check.argv.length &&
          check.argv.every((a) => typeof a === "string" && a),
        "check command must be argv",
      );
      text(check.purpose, "check purpose");
      assert(
        Number.isInteger(check.timeout_ms) &&
          check.timeout_ms > 0 &&
          check.timeout_ms <= 3600000,
        "check timeout must be 1..3600000 ms",
      );
    }
    array(u.depends_on, "dependencies");
    for (const dep of u.depends_on) {
      assert(
        units.has(dep.unit) && dep.unit !== u.id,
        `invalid dependency ${dep.unit}`,
      );
      assert(
        ["implemented", "verified", "reviewed", "published"].includes(
          dep.stage,
        ),
        "invalid dependency stage",
      );
      text(dep.reason, "dependency reason");
      refs(dep.source_refs, "dependency sources");
    }
  }
  for (const c of cases)
    assert(
      plan.units.some((u) => u.case_ids.includes(c)),
      `unmapped case ${c}`,
    );
  for (const r of repos.keys())
    assert(
      plan.units.some((u) => u.repo === r),
      `unused repository ${r}`,
    );
  for (const b of plan.blockers) {
    array(b.units, "blocked units");
    assert(b.units.length, "blocker needs affected units");
    for (const u of b.units) assert(units.has(u), `unknown blocked unit ${u}`);
    text(b.reason, "blocker reason");
    text(b.owner, "unblock owner");
    text(b.unblock_when, "unblock condition");
    refs(b.source_refs, "blocker evidence");
  }
  validateContext(plan);
  for (const u of plan.units)
    for (const ref of unitSourceIds(plan, u)) {
      const s = plan.sources.find((s) => s.id === ref);
      if (s.status !== "read")
        assert(
          plan.blockers.some((b) => b.units.includes(u.id)),
          `${u.id}: unavailable/conflicted source must block this unit`,
        );
    }
  const visiting = new Set(),
    visited = new Set();
  const visit = (key) => {
    assert(
      !visiting.has(key),
      "dependency cycle: reframe the contract or prerequisite",
    );
    if (visited.has(key)) return;
    visiting.add(key);
    for (const dep of units.get(key).depends_on) visit(dep.unit);
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of units.keys()) visit(key);
  // One grouped PR cannot be published before a sibling unit it contains.
  for (const u of plan.units)
    for (const dep of u.depends_on)
      if (dep.stage === "published")
        assert(
          units.get(dep.unit).repo !== u.repo,
          "same-repo published dependency deadlocks a grouped PR; use an implementation/verification dependency",
        );
  // Stage nodes model incremental verification and the grouped publication boundary.
  const graph = new Map();
  for (const u of plan.units) {
    graph.set(`implemented:${u.id}`, u.depends_on.map(dep => dep.stage === "published" ? `published:${units.get(dep.unit).repo}` : `${dep.stage}:${dep.unit}`));
    graph.set(`verified:${u.id}`, [`implemented:${u.id}`]);
    graph.set(`reviewed:${u.id}`, [`verified:${u.id}`]);
  }
  for (const repo of plan.repositories) graph.set(`published:${repo.id}`, plan.units.filter(u => u.repo === repo.id).map(u => `reviewed:${u.id}`));
  const activeStages = new Set(), completeStages = new Set();
  const visitStage = key => {
    assert(!activeStages.has(key), "grouped publication dependency deadlock: revise prerequisite stages before approval");
    if (completeStages.has(key)) return;
    activeStages.add(key);
    for (const prerequisite of graph.get(key)) visitStage(prerequisite);
    activeStages.delete(key); completeStages.add(key);
  };
  for (const key of graph.keys()) visitStage(key);
  return plan;
}

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
  async requireApproval(s, {legacyCompletion = false} = {}) {
    if (!legacyCompletion) await this.requireBranchPolicy(s.plan);
    assert(legacyCompletion || s.plan.schema === "work-item-delivery.plan.v2", "upgrade the legacy plan with cited business context and an evidence contract before execution");
    assert(
      s.approval?.hash === s.plan_hash &&
        s.plan_hash === (await this.fingerprint(s.plan)),
      "review and approve this exact plan first",
    );
  }
  repo(s, id) {
    const r = s.plan.repositories.find((r) => r.id === id);
    assert(r, `unknown repo ${id}`);
    return r;
  }
  unit(s, id) {
    const u = s.plan.units.find((u) => u.id === id);
    assert(u, `unknown unit ${id}`);
    return u;
  }
  workspace(s, repo, { clean = false } = {}) {
    const r = this.repo(s, repo),
      path = s.repos[repo].path;
    const identity = repositoryIdentity(r.path);
    assert(identity === (s.repos[repo].identity ?? identity) && repositoryIdentity(path) === identity, `${repo}: Git repository identity changed; reconcile the workspace`);
    assert(
      git(path, "branch", "--show-current") === r.branch,
      `${repo}: bind the approved work branch before execution`,
    );
    assert(
      git(r.path, "rev-parse", r.base_ref) === s.repos[repo].baseline,
      `${repo}: target baseline moved; inspect its impact and replan before continuing`,
    );
    try {
      execFileSync(
        "git",
        [
          "-C",
          path,
          "merge-base",
          "--is-ancestor",
          s.repos[repo].baseline,
          "HEAD",
        ],
        { stdio: "pipe" },
      );
    } catch {
      throw new Error(
        `${repo}: integrate the approved target baseline before continuing`,
      );
    }
    if (clean)
      assert(
        !git(path, "status", "--porcelain"),
        `${repo}: commit or account for working changes first`,
      );
    return { path, head: git(path, "rev-parse", "HEAD") };
  }
  async bind(repo, path) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      const r = this.repo(s, repo);
      assert(
        !s.plan.units.some(
          (u) => u.repo === repo && s.units[u.id].state === "active",
        ) && !s.repos[repo].verification_running,
        "repository has an active writer/verifier",
      );
      assert(
        repositoryIdentity(path) === (s.repos[repo].identity ?? repositoryIdentity(r.path)),
        "worktree is not from the planned repository",
      );
      assert(
        git(path, "branch", "--show-current") === r.branch,
        "wrong work branch",
      );
      execFileSync(
        "git",
        ["-C", path, "merge-base", "--is-ancestor", r.base_sha, "HEAD"],
        { stdio: "pipe" },
      );
      s.repos[repo].path = await realpath(path);
      await this.save(s, { type: "workspace-bound", repo, path });
      return { repo, path };
    });
  }
  async dependencyReady(s, dep, {certifyingRepo = null} = {}) {
    const unit = this.unit(s, dep.unit),
      row = s.units[dep.unit],
      repo = s.repos[unit.repo];
    const combined = unit.repo === certifyingRepo;
    if (!atLeast(row.state, combined ? "implemented" : dep.stage)) return false;
    if ((!combined && repo.verification_running) || s.plan.units.some(u => u.repo === unit.repo && s.units[u.id].state === "active") || s.blockers.some(b => !b.resolved && b.units.includes(unit.id))) return false;
    let workspace;
    try {
      workspace = this.workspace(s, unit.repo, {clean:true});
      execFileSync("git", ["-C", workspace.path, "merge-base", "--is-ancestor", row.head, workspace.head], {stdio:"pipe"});
    } catch { return false; }
    for (const upstream of unit.depends_on) if (!(await this.dependencyReady(s, upstream, {certifyingRepo}))) return false;
    if (!combined && ["verified", "reviewed", "published"].includes(dep.stage)) {
      const head = git(repo.path, "rev-parse", "HEAD");
      if (repo.verification?.head !== head || !repo.verification.passed)
        return false;
      if (
        ["reviewed", "published"].includes(dep.stage) &&
        repo.review?.head !== head
      )
        return false;
      if (dep.stage === "published" && repo.published?.head !== head)
        return false;
    }
    return true;
  }
  async dependenciesReady(s, units, options = {}) {
    for (const unit of units)
      for (const dep of unit.depends_on)
        if (!(await this.dependencyReady(s, dep, options))) return false;
    return true;
  }
  async readiness(s, u) {
    const blockers = s.blockers.filter(
      (b) => !b.resolved && b.units.includes(u.id),
    );
    if (blockers.length)
      return {
        ready: false,
        reason: "blocked",
        blockers: blockers.map((b) => b.id),
      };
    const waiting = [];
    for (const dep of u.depends_on)
      if (!(await this.dependencyReady(s, dep)))
        waiting.push(`${dep.unit}:${dep.stage}`);
    if (waiting.length) return { ready: false, reason: "dependency", waiting };
    if (s.repos[u.repo].verification_running)
      return { ready: false, reason: "repository-verification-active" };
    if (
      s.plan.units.some(
        (v) =>
          v.repo === u.repo &&
          v.id !== u.id &&
          s.units[v.id].state === "active",
      )
    )
      return { ready: false, reason: "repository-writer-active" };
    const r = this.repo(s, u.repo);
    if (git(r.path, "rev-parse", r.base_ref) !== s.repos[u.repo].baseline)
      return { ready: false, reason: "baseline-moved" };
    if (s.plan.schema === "work-item-delivery.plan.v2" && s.units[u.id].state === "pending") {
      const captures = await captureCoverage(s, u.repo, null, "before", u.case_ids);
      if (!captures.ready) return { ready:false, reason:"before-evidence-required", missing:captures.missing };
    }
    return { ready: true };
  }
  async summarize(s) {
    const rows = [];
    for (const u of s.plan.units)
      rows.push({
        id: u.id,
        repo: u.repo,
        cases: u.case_ids,
        state: s.units[u.id].state,
        ...(s.units[u.id].owner ? { owner: s.units[u.id].owner } : {}),
        ...(await this.readiness(s, u)),
      });
    const approved =
      s.plan.schema === "work-item-delivery.plan.v2" &&
      s.approval?.hash === s.plan_hash &&
      s.plan_hash === (await this.fingerprint(s.plan));
    const ready = rows
      .filter((r) => r.state === "pending" && r.ready)
      .sort(
        (a, b) =>
          (this.unit(s, a.id).priority ?? 2) -
          (this.unit(s, b.id).priority ?? 2),
      );
    const publication = [];
    for (const r of s.plan.repositories) {
      const group = s.plan.units.filter((u) => u.repo === r.id);
      let head;
      try {
        head = git(s.repos[r.id].path, "rev-parse", "HEAD");
      } catch {
        head = null;
      }
      const capture_evidence = await captureCoverage(s, r.id, head);
      const dependencies_current = await this.dependenciesReady(s, group);
      publication.push({
        repo: r.id,
        branch: r.branch,
        case_ids: [...new Set(group.flatMap((u) => u.case_ids))],
        head,
        capture_evidence,
        dependencies_current,
        pr_identity:publicationIdentity(s.repos[r.id]),
        baseline_current:
          git(r.path, "rev-parse", r.base_ref) === s.repos[r.id].baseline,
        verification: s.repos[r.id].verification
          ? s.repos[r.id].verification.head === head
            ? s.repos[r.id].verification.passed
              ? "passed"
              : "failed"
            : "stale"
          : "not-run",
        review: s.repos[r.id].review
          ? s.repos[r.id].review.head === head
            ? "passed"
            : "stale"
          : "not-run",
        published: s.repos[r.id].published
          ? s.repos[r.id].published.head === head
            ? "read-back-verified"
            : "stale"
          : "not-published",
        gate: publicationGate(s.repos[r.id], head),
        ready:
          approved &&
          dependencies_current &&
          capture_evidence.ready &&
          git(r.path, "rev-parse", r.base_ref) === s.repos[r.id].baseline &&
          group.every((u) => atLeast(s.units[u.id].state, "implemented")) &&
          !s.blockers.some(
            (b) =>
              !b.resolved && b.units.some((k) => group.some((u) => u.id === k)),
          ) &&
          s.repos[r.id].verification?.head === head &&
          s.repos[r.id].verification?.passed === true &&
          s.repos[r.id].review?.head === head,
        blocked_units: group
          .filter((u) => !atLeast(s.units[u.id].state, "implemented"))
          .map((u) => u.id),
      });
    }
    const remaining = new Set(s.plan.units.map((u) => u.id)),
      layers = [];
    while (remaining.size) {
      const layer = s.plan.units
        .filter(
          (u) =>
            remaining.has(u.id) &&
            u.depends_on.every((d) => !remaining.has(d.unit)),
        )
        .sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
      layers.push(layer.map((u) => u.id));
      for (const u of layer) remaining.delete(u.id);
    }
    return {
      work_item: s.plan.work_item,
      plan_hash: s.plan_hash,
      approved,
      dependency_layers: layers,
      ready_to_implement: approved ? ready : [],
      candidates_before_approval: approved ? [] : ready,
      units: rows,
      publication,
      open_blockers: s.blockers.filter((b) => !b.resolved),
    };
  }
  async status() {
    return this.locked(async () => {
      const s = await this.load();
      await this.save(s, null);
      return this.summarize(s);
    });
  }
  async recordCapture(file) {
    return this.locked(async () => {
      const s = await this.load();
      assert(s.plan.schema === "work-item-delivery.plan.v2", "capture requires a v2 evidence plan");
      const input = await readJson(file);
      const record = await captureReceipt(s.plan, input);
      record.evidence = await receipt(file);
      record.plan_hash = s.plan_hash;
      s.captures ??= [];
      s.captures.push(record);
      const definition = s.plan.capture_plan.find(c => c.id === record.capture_id);
      record.context_hash = await captureBinding(s.plan, definition);
      s.repos[definition.repo].publication = null;
      await this.save(s, {type:"browser-evidence-recorded",capture:record.capture_id,phase:record.phase,outcome:record.outcome});
      return {capture:record.capture_id,phase:record.phase,outcome:record.outcome,evidence:record.evidence};
    });
  }
  async start(unit, owner) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      const u = this.unit(s, unit);
      text(owner, "writer owner");
      assert(s.units[unit].state === "pending", "unit is not pending");
      const ready = await this.readiness(s, u);
      assert(ready.ready, JSON.stringify(ready));
      const w = this.workspace(s, u.repo, { clean: true });
      s.units[unit] = { state: "active", owner, start_head: w.head };
      s.repos[u.repo].verification = null;
      s.repos[u.repo].review = null;
      s.repos[u.repo].publication = null;
      await this.save(s, { type: "unit-started", unit, owner, head: w.head });
      return this.brief(s, u, owner);
    });
  }
  brief(s, u, owner) {
    const business = (s.plan.knowledge?.business_flows ?? []).filter(flow => flow.case_ids.some(id => u.case_ids.includes(id)));
    const contextIds = new Set([...u.source_refs, ...business.flatMap(flow => flow.steps.flatMap(step => step.source_refs))]);
    return {
      goal: u.change,
      scope: {
        repo: u.repo,
        path: s.repos[u.repo].path,
        branch: this.repo(s, u.repo).branch,
        allowed_paths: u.allowed_paths,
        owner,
      },
      cases: s.plan.cases.filter((c) => u.case_ids.includes(c.id)),
      context: s.plan.sources.filter((ref) => contextIds.has(ref.id)),
      business_flows: business,
      capture_plan: (s.plan.capture_plan ?? []).filter(capture => capture.repo === u.repo && capture.case_ids.some(id => u.case_ids.includes(id))),
      flow: u.current_flow,
      finding: { status: u.finding_status, text: u.finding },
      acceptance: u.acceptance,
      verify: u.checks,
      upstream: u.depends_on.map((d) => ({
        dependency: d,
        result: s.units[d.unit],
      })),
      standing_orders: [
        "Use the approved shared branch; one writer per repository.",
        "Stay inside owned paths and scoped cases.",
        "No PR creation, ticket mutation, merge, deployment or branch topology change without the applicable approval.",
        "Report actual tests and blockers; do not infer verification from implementation.",
      ],
    };
  }
  async finish(unit, owner, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s, {legacyCompletion:true});
      const u = this.unit(s, unit),
        row = s.units[unit];
      assert(
        row.state === "active" && row.owner === owner,
        "unit is not owned by this writer",
      );
      const w = this.workspace(s, u.repo, { clean: true });
      const changed = git(w.path, "diff", "--name-only", row.start_head, w.head)
        .split("\n")
        .filter(Boolean);
      assert(
        changed.every((p) =>
          u.allowed_paths.some(
            (a) => p === a || p.startsWith(a.replace(/\/$/, "") + "/"),
          ),
        ),
        "changes extend beyond owned paths",
      );
      row.state = "implemented";
      row.head = w.head;
      row.report = await receipt(evidence);
      delete row.owner;
      await this.store.inbox.push({
        agent: owner,
        unit,
        status: "implemented",
        report: row.report.path,
      });
      await this.save(s, {
        type: "unit-implemented",
        unit,
        head: w.head,
        evidence: row.report,
      });
      return { unit, state: row.state, head: w.head };
    });
  }
  async block(unit, reason, owner, unblock, evidence, unblockOwner = owner) {
    return this.locked(async () => {
      const s = await this.load();
      const u = this.unit(s, unit);
      text(reason, "blocker reason");
      text(owner, "unblock owner");
      text(unblock, "unblock condition");
      const proof = await receipt(evidence);
      if (s.units[unit].state === "active")
        assert(
          s.units[unit].owner === owner,
          "only the active writer can park its work",
        );
      assert(
        s.units[unit].state !== "published",
        "published units require an explicit follow-up plan",
      );
      const partial = git(s.repos[u.repo].path, "status", "--porcelain");
      const committedPartial =
        s.units[unit].state === "active" &&
        git(s.repos[u.repo].path, "rev-parse", "HEAD") !==
          s.units[unit].start_head;
      s.blockers.push({
        id: `block-${randomUUID()}`,
        units: [unit],
        reason,
        owner: unblockOwner,
        unblock_when: unblock,
        evidence: proof,
        resolved: false,
      });
      s.repos[u.repo].publication = null;
      if (partial || committedPartial) {
        assert(
          s.units[unit].state === "active",
          "a dirty repository needs its active owner to record a recovery plan",
        );
        await this.save(s, {
          type: "unit-blocked-writer-retained",
          unit,
          evidence: proof,
        });
        return {
          unit,
          state: "active",
          writer_retained: true,
          reason: partial
            ? "uncommitted partial changes"
            : "committed partial changes",
          warning:
            "Blocker recorded; retain this repo writer until an explicit safe recovery/isolation plan resolves partial work. Other repositories may continue.",
        };
      }
      s.units[unit].previous_state = s.units[unit].state;
      s.units[unit].state = "blocked";
      delete s.units[unit].owner;
      await this.save(s, { type: "unit-blocked", unit, evidence: proof });
      return {
        unit,
        state: "blocked",
        warning:
          "Independent units may continue; this repository PR remains held while the case is blocked.",
      };
    });
  }
  async unblock(blocker, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      const b = s.blockers.find((b) => b.id === blocker);
      assert(b && !b.resolved, "open blocker not found");
      b.resolution = await receipt(evidence);
      b.resolved = true;
      for (const key of b.units)
        if (
          !s.blockers.some((x) => !x.resolved && x.units.includes(key)) &&
          s.units[key].state === "blocked"
        )
          s.units[key].state = "pending";
      await this.save(s, {
        type: "blocker-resolved",
        blocker,
        evidence: b.resolution,
      });
      return { blocker, resolved: true };
    });
  }
  async verify(repo) {
    // Take an immutable verification brief under the lock, then release it while
    // tests run. Other repositories can continue using the same durable store.
    const job = await this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      this.repo(s, repo);
      assert(
        !s.repos[repo].verification_running,
        "verification already running; inspect its recorded PID before recovery",
      );
      assert(
        !s.plan.units.some(
          (u) => u.repo === repo && s.units[u.id].state === "active",
        ),
        "finish active work before combined verification",
      );
      const group = s.plan.units.filter(
        (u) => u.repo === repo && atLeast(s.units[u.id].state, "implemented"),
      );
      assert(group.length, "no implemented units to verify");
      assert(await this.dependenciesReady(s, group, {certifyingRepo:repo}), "dependency evidence is stale or blocked; reconcile prerequisites before verification");
      const w = this.workspace(s, repo, { clean: true }),
        token = randomUUID();
      s.repos[repo].verification_running = {
        token,
        pid: process.pid,
        head: w.head,
      };
      s.repos[repo].verification = null;
      s.repos[repo].review = null;
      s.repos[repo].publication = null;
      await this.save(s, {
        type: "verification-started",
        repo,
        token,
        head: w.head,
      });
      return { ...w, token, group, plan_hash: s.plan_hash };
    });
    const results = [];
    await mkdir(join(this.directory, "evidence"), { recursive: true });
    for (const u of job.group)
      for (const check of u.checks) {
        const result = spawnSync(check.argv[0], check.argv.slice(1), {
          cwd: job.path,
          encoding: "utf8",
          timeout: check.timeout_ms,
          maxBuffer: 8 * 1024 * 1024,
          shell: false,
        });
        const file = join(
          this.directory,
          "evidence",
          `${u.id}-${check.id}-${randomUUID()}.log`,
        );
        await writeFile(
          file,
          `COMMAND ${JSON.stringify(check.argv)}\nEXIT ${result.status}\n${result.stdout ?? ""}\n${result.stderr ?? ""}\n${result.error?.message ?? ""}`,
          { mode: 0o600 },
        );
        results.push({
          unit: u.id,
          check: check.id,
          exit_code: result.status,
          evidence: await receipt(file),
        });
      }
    const continuation = new Delivery(this.directory);
    return continuation.locked(async () => {
      const s = await continuation.load();
      assert(
        s.repos[repo].verification_running?.token === job.token,
        "verification ownership changed",
      );
      const sourceUnchanged =
        git(job.path, "rev-parse", "HEAD") === job.head &&
        !git(job.path, "status", "--porcelain") &&
        s.plan_hash === job.plan_hash &&
        await continuation.dependenciesReady(s, job.group, {certifyingRepo:repo});
      const passed = sourceUnchanged && results.every((r) => r.exit_code === 0);
      delete s.repos[repo].verification_running;
      s.repos[repo].verification = {
        head: job.head,
        passed,
        source_unchanged: sourceUnchanged,
        results,
      };
      for (const u of job.group)
        if (s.units[u.id].state !== "published") s.units[u.id].state = passed ? "verified" : "implemented";
      await continuation.save(s, {
        type: "repository-verified",
        repo,
        head: job.head,
        passed,
      });
      return s.repos[repo].verification;
    });
  }
  async recoverVerification(repo, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      this.repo(s, repo);
      const job = s.repos[repo].verification_running;
      assert(job, "no interrupted verification");
      let dead = false;
      try {
        process.kill(job.pid, 0);
      } catch (e) {
        dead = e.code === "ESRCH";
      }
      assert(
        dead,
        "recorded verifier process is still alive or its state is unknown",
      );
      const proof = await receipt(evidence);
      delete s.repos[repo].verification_running;
      s.repos[repo].verification = null;
      await this.save(s, {
        type: "interrupted-verification-recovered",
        repo,
        evidence: proof,
      });
      return { repo, verification: "not run; rerun required" };
    });
  }
  async review(repo, file) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      const w = this.workspace(s, repo, { clean: true }),
        report = await readJson(file);
      const group = s.plan.units.filter(u => u.repo === repo && atLeast(s.units[u.id].state, "implemented"));
      assert(await this.dependenciesReady(s, group, {certifyingRepo:repo}), "dependency evidence is stale or blocked before review");
      assert(
        s.repos[repo].verification?.head === w.head &&
          s.repos[repo].verification?.passed,
        "verify this head before review",
      );
      assert(report.head === w.head, "review is for a stale head");
      for (const axis of ["standards", "specification"]) {
        const row = report.reviews?.find((r) => r.axis === axis);
        assert(
          row && row.verdict === "pass",
          "both standards and specification review must pass",
        );
        text(row.reviewer, "reviewer");
        row.evidence = await receipt(row.report);
      }
      s.repos[repo].review = {
        head: w.head,
        reviews: report.reviews,
        evidence: await receipt(file),
      };
      for (const u of s.plan.units.filter(
        (u) => u.repo === repo && atLeast(s.units[u.id].state, "verified"),
      ))
        if (s.units[u.id].state !== "published") s.units[u.id].state = "reviewed";
      await this.save(s, { type: "repository-reviewed", repo, head: w.head });
      return s.repos[repo].review;
    });
  }
  async stagePublication(repo, file) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      for (const result of s.repos[repo]?.verification?.results ?? [])
        assert(
          (await receipt(result.evidence.path)).sha256 ===
            result.evidence.sha256,
          "verification evidence changed",
        );
      if (s.repos[repo]?.review?.evidence)
        assert(
          (await receipt(s.repos[repo].review.evidence.path)).sha256 ===
            s.repos[repo].review.evidence.sha256,
          "review receipt changed",
        );
      for (const review of s.repos[repo]?.review?.reviews ?? [])
        assert(
          (await receipt(review.evidence.path)).sha256 ===
            review.evidence.sha256,
          "review evidence changed",
        );
      const ready = (await this.summarize(s)).publication.find(
        (r) => r.repo === repo,
      );
      assert(
        ready?.ready,
        "all grouped cases, current-head verification and reviews must be ready",
      );
      const w = this.workspace(s, repo, { clean: true });
      const payload = await readJson(file);
      text(payload.title, "PR title");
      text(payload.description, "PR description");
      assert(
        payload.description.length <= 4000 &&
          [...payload.description].length <= 4000,
        "PR description exceeds 4000 characters",
      );
      assert(payload.head === w.head, "publication payload head mismatch");
      assert(
        payload.source_branch === this.repo(s, repo).branch,
        "wrong publication branch",
      );
      assert(
        payload.target_branch ===
          this.repo(s, repo).base_ref.replace(/^origin\//, ""),
        "wrong publication target",
      );
      assert(
        payload.is_draft === true || payload.is_draft === false,
        "explicit draft state required",
      );
      assert(
        ["create", "update"].includes(payload.action),
        "publication must explicitly create or update",
      );
      text(payload.url, "publication endpoint or existing PR URL");
      text(payload.repository_id, "publication repository identity");
      const identity = publicationIdentity(s.repos[repo]);
      if (identity)
        assert(
          payload.action === "update" &&
            payload.url === identity.pr_url &&
            (!identity.repository_id || payload.repository_id === identity.repository_id),
          "this repository already has its grouped PR; update that PR instead of creating another",
        );
      array(payload.work_item_ids, "approved work item links");
      assert(
        payload.work_item_ids.map(String).includes(String(s.plan.work_item.id)),
        "owning Work Item association is required",
      );
      const attachments = [];
      for (const a of payload.attachments ?? [])
        attachments.push({
          name: a.name ?? basename(a.path),
          ...(await receipt(a.path)),
        });
      s.repos[repo].publication = {
        head: w.head,
        payload,
        attachments,
        hash: sha(canonical({ payload, attachments })),
        approval: null,
      };
      await this.save(s, { type: "publication-staged", repo });
      return {
        approval_required: s.repos[repo].publication.hash,
        action: payload,
      };
    });
  }
  async approvePublication(repo, hash, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      assert(
        (await this.summarize(s)).publication.find((row) => row.repo === repo)
          ?.ready,
        "grouped PR readiness changed; resolve blockers/checks/reviews before publishing",
      );
      const pub = s.repos[repo]?.publication;
      assert(pub && hash === pub.hash, "publication payload changed");
      assert(
        this.workspace(s, repo, { clean: true }).head === pub.head,
        "source changed after staging",
      );
      for (const a of pub.attachments)
        assert(
          (await receipt(a.path)).sha256 === a.sha256,
          "attachment changed after staging",
        );
      pub.approval = { hash, ...(await receipt(evidence)) };
      await this.save(s, { type: "publication-approved", repo, hash });
      return {
        approved: hash,
        action: pub.payload,
        instructions:
          "Execute exactly this action with the authenticated forge connector, then ingest its direct read-back using published. Approval does not authorize ticket field edits, merges or deployment.",
      };
    });
  }
  async published(repo, file) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      assert(
        (await this.summarize(s)).publication.find((row) => row.repo === repo)
          ?.ready,
        "grouped PR readiness changed; resolve blockers/checks/reviews before publishing",
      );
      const pub = s.repos[repo]?.publication;
      assert(
        pub?.approval?.hash === pub?.hash && pub,
        "exact publication approval required",
      );
      assert(
        this.workspace(s, repo, { clean: true }).head === pub.head,
        "source changed after approval",
      );
      const actual = await readJson(file),
        expected = pub.payload;
      for (const k of [
        "repository_id",
        "title",
        "description",
        "head",
        "source_branch",
        "target_branch",
        "is_draft",
      ])
        assert(
          actual[k] === expected[k],
          `publication read-back differs: ${k}`,
        );
      assert(actual.status === "active", "PR must be active");
      assert(
        canonical(actual.work_item_ids?.map(String).sort()) ===
          canonical(expected.work_item_ids.map(String).sort()),
        "work item associations differ",
      );
      assert(
        canonical(
          (actual.attachments ?? [])
            .map((a) => [a.name, a.sha256, a.bytes])
            .sort(),
        ) ===
          canonical(
            pub.attachments.map((a) => [a.name, a.sha256, a.bytes]).sort(),
          ),
        "attachment hashes differ",
      );
      text(actual.pr_url, "PR URL");
      assert(/^https:\/\//.test(actual.pr_url), "PR URL must be HTTPS");
      const identity = publicationIdentity(s.repos[repo]);
      if (expected.action === "update" || identity) assert(actual.pr_url === (identity?.pr_url ?? expected.url), "publication read-back differs: PR identity");
      s.repos[repo].pr_identity = {pr_url:actual.pr_url,repository_id:actual.repository_id};
      s.repos[repo].published = {
        head: pub.head,
        pr_url: actual.pr_url,
        evidence: await receipt(file),
      };
      for (const u of s.plan.units.filter((u) => u.repo === repo))
        s.units[u.id].state = "published";
      await this.save(s, {
        type: "publication-read-back-verified",
        repo,
        pr_url: actual.pr_url,
      });
      return s.repos[repo].published;
    });
  }
}
export { validatePlan, sha, canonical };
