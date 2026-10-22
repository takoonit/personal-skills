import { resolve, isAbsolute } from "node:path";
import { execFileSync } from "node:child_process";
import { validateContext } from "./evidence.mjs";
import { assert, text, array, id, git, unique, repositoryIdentity, unitSourceIds } from "./delivery-common.mjs";

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


export { validatePlan };
