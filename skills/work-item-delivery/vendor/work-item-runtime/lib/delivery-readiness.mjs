import { realpath } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { captureCoverage } from "./evidence.mjs";
import { assert, id, git, atLeast, repositoryIdentity, publicationIdentity, publicationGate, unitSourceIds } from "./delivery-common.mjs";

export const deliveryReadiness = {
  async requireApproval(s, {legacyCompletion = false} = {}) {
    if (!legacyCompletion) await this.requireBranchPolicy(s.plan);
    assert(legacyCompletion || ["work-item-delivery.plan.v2","work-item-delivery.plan.v3"].includes(s.plan.schema), "upgrade the legacy plan with cited business context and an evidence contract before execution");
    assert(
      s.approval?.hash === s.plan_hash &&
        s.plan_hash === (await this.fingerprint(s.plan, legacyCompletion ? s.design_receipt : null)),
      "review and approve this exact plan first",
    );
    await this.admittedDossier(s.plan);
  },
  repo(s, id) {
    const r = s.plan.repositories.find((r) => r.id === id);
    assert(r, `unknown repo ${id}`);
    return r;
  },
  unit(s, id) {
    const u = s.plan.units.find((u) => u.id === id);
    assert(u, `unknown unit ${id}`);
    return u;
  },
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
  },
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
  },
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
  },
  async dependenciesReady(s, units, options = {}) {
    for (const unit of units)
      for (const dep of unit.depends_on)
        if (!(await this.dependencyReady(s, dep, options))) return false;
    return true;
  },
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
    if (s.plan.schema === "work-item-delivery.plan.v3") {
      const unavailable = s.plan.sources.filter(source => unitSourceIds(s.plan,u).includes(source.id) && source.status !== "read");
      if (unavailable.length) return {ready:false,reason:"source-evidence-blocked",sources:unavailable.map(source=>source.id)};
    }
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
    if (["work-item-delivery.plan.v2","work-item-delivery.plan.v3"].includes(s.plan.schema) && s.units[u.id].state === "pending") {
      const captures = await captureCoverage(s, u.repo, null, "before", u.case_ids);
      if (!captures.ready) return { ready:false, reason:"before-evidence-required", missing:captures.missing };
    }
    return { ready: true };
  },
  async summarize(s, {approvedContinuation = false} = {}) {
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
    let integrity_hold = null;
    try { await this.admittedDossier(s.plan); } catch (error) { integrity_hold = error.message; }
    let approved = false, continuing_writer = false;
    if (!integrity_hold) {
      try {
        approved = ["work-item-delivery.plan.v2","work-item-delivery.plan.v3"].includes(s.plan.schema) &&
          s.approval?.hash === s.plan_hash && s.plan_hash === await this.fingerprint(s.plan);
      } catch {}
      if (rows.some(row=>row.state==="active")) {
        try {
          await this.requireApproval(s,{legacyCompletion:true});
          continuing_writer = true;
        } catch {}
      }
    }
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
    const reconciliation=s.events.findLast(event=>event.type==="replanned");
    return {
      reconciliation: Array.isArray(reconciliation?.changed)&&Array.isArray(reconciliation?.preserved)
        ? {changed:reconciliation.changed,preserved:reconciliation.preserved} : null,
      unit_input_migrations: s.unit_input_migrations ?? [],
      unit_input_migration_gaps: s.unit_input_migration_gaps ?? [],
      work_item: s.plan.work_item,
      plan_hash: s.plan_hash,
      approved,
      integrity_hold,
      continuing_writer,
      continuing_legacy_writer: s.plan.schema === "work-item-delivery.plan.v1" &&
        s.approval?.hash === s.plan_hash && s.plan_hash === await this.fingerprint(s.plan) &&
        rows.some(row=>row.state==="active"),
      dependency_layers: layers,
      ready_to_implement: approved ? ready : [],
      candidates_before_approval: approved ? [] : ready,
      units: rows,
      publication,
      approved_actions: await Promise.all(s.plan.repositories
        .filter((r) => this.approvedAction(s, r.id))
        .map((r) => this.approvedActionStatus(s, r.id))),
      open_blockers: s.blockers.filter((b) => !b.resolved),
    };
  },
  async status() {
    return this.locked(async () => {
      let s;
      try { s = await this.load(); }
      catch (error) { if (error.code !== "ENOENT") throw error; return {investigation:await this.investigationView()}; }
      await this.save(s, null);
      const summary = await this.summarize(s);
      let investigation;
      try { investigation = await this.investigationView(); }
      catch (error) { investigation = {phase:"integrity-hold",error:error.message}; }
      return {...summary, investigation};
    });
  }
};
