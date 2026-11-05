import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { validatePlan } from "../lib/delivery.mjs";
import { git, fixture, approveCurrent } from "./delivery-fixture.mjs";

test("Bug approval rejects codex branches even if a stale plan asks for that prefix", async t => {
  const f = await fixture(t);
  f.plan.work_item.type = "Bug";
  await f.call("replan", f.plan);
  await assert.rejects(approveCurrent(f), /Bug branch must use fix\//);
  await assert.rejects(f.call("start", "A", "worker"), /Bug branch must use fix\//);
  delete f.plan.work_item.type;
  await f.call("replan", f.plan);
  await assert.rejects(approveCurrent(f), /Work Item type for branch policy/);
});

test("a human-approved unpublished branch rename preserves the source and withdraws certification", async t => {
  const f = await fixture(t);
  await f.approve(); await f.implement("A"); await f.call("verify", "be");
  const repo = f.plan.repositories[0], head = git(repo.path, "rev-parse", "HEAD");
  git(repo.path, "branch", "-m", "fix/100-be");
  repo.branch = "fix/100-be"; f.plan.work_item.type = "Bug";
  await assert.rejects(f.call("replan", f.plan), /explicit human approval evidence/);
  await f.call("replan", f.plan, f.approval);
  const state = await f.call("load");
  assert.equal(state.approval, null);
  assert.equal(state.repos.be.verification, null);
  assert.equal(state.events.at(-1).branch_rename[0].branch, "fix/100-be");
  assert.equal(git(repo.path, "rev-parse", "HEAD"), head);
  await approveCurrent(f);
});

test("branch-name reconciliation refuses an unrecorded source commit", async t => {
  const f = await fixture(t); await f.approve(); await f.implement("A");
  const repo = f.plan.repositories[0];
  git(repo.path, "branch", "-m", "fix/100-be");
  repo.branch = "fix/100-be"; f.plan.work_item.type = "Bug";
  await writeFile(join(repo.path, "app.txt"), "unrecorded source");
  git(repo.path, "add", "."); git(repo.path, "commit", "-m", "unrecorded");
  await assert.rejects(f.call("replan", f.plan, f.approval), /preserve the recorded source head/);
});

test("approval requires an explicit executable unit-test plan or a justified exception", async t => {
  const f = await fixture(t);
  delete f.plan.units[0].unit_test_plan;
  await f.call("replan", f.plan);
  await assert.rejects(approveCurrent(f), /explicit unit-test plan/);
  const rendered = execFileSync(process.execPath, [new URL("../bin/wid.mjs", import.meta.url).pathname,
    "plan", "--run", f.run], {encoding:"utf8"});
  assert.match(rendered, /MISSING unit-test plan/);
  assert.match(rendered, /Check regression/);
  f.plan.units[0].unit_test_plan = {check_ids:["missing"], assertions:["case A"], before:"red", after:"green"};
  await f.call("replan", f.plan);
  await assert.rejects(approveCurrent(f), /explicit unit-test plan/);
  f.plan.units[0].unit_test_plan.check_ids = ["regression"];
  await f.call("replan", f.plan);
  await approveCurrent(f);
  const complete = execFileSync(process.execPath, [new URL("../bin/wid.mjs", import.meta.url).pathname,
    "plan", "--run", f.run], {encoding:"utf8"});
  assert.match(complete, /Unit-test assertions: case A/);
});

test("execution starts clean without discarding existing tracked or untracked work", async t => {
  const f = await fixture(t);
  await f.approve();
  const repo = f.repos[0].path;
  const app = join(repo, "app.txt");
  await writeFile(app, "unrelated existing work\n");
  await assert.rejects(f.call("start", "A", "worker"), /working changes first/);
  assert.equal(await readFile(app, "utf8"), "unrelated existing work\n");
  git(repo, "add", "app.txt");
  await assert.rejects(f.call("start", "A", "worker"), /working changes first/);
  git(repo, "restore", "--source=HEAD", "--staged", "--worktree", "--", "app.txt");
  const untracked = join(repo, "existing-note.txt");
  await writeFile(untracked, "keep this note\n");
  await assert.rejects(f.call("start", "A", "worker"), /working changes first/);
  assert.equal(await readFile(untracked, "utf8"), "keep this note\n");
  assert.equal((await f.call("load")).units.A.state, "pending");
  await rm(untracked);
  await writeFile(join(repo, ".git", "info", "exclude"), "local-runtime.cache\n");
  await writeFile(join(repo, "local-runtime.cache"), "legitimate ignored local state\n");
  await f.call("start", "A", "worker");
  assert.equal((await f.call("load")).units.A.state, "active");
  assert.equal(await readFile(join(repo, "local-runtime.cache"), "utf8"), "legitimate ignored local state\n");
});

test("changed cited repository conventions invalidate approval before coding", async t => {
  const f = await fixture(t);
  const convention = join(f.root, "repository-conventions.md");
  await writeFile(convention, "Service classifies business errors.\n");
  f.plan.sources.push({id:"repo-conventions",kind:"repository-convention",url:"https://example.invalid/repo/docs/conventions/patterns.md",revision:"fixture-head",section:"Service error classification",status:"read",snapshot:convention});
  f.plan.units[0].source_refs.push("repo-conventions");
  await f.call("replan", f.plan);
  await approveCurrent(f);
  await writeFile(convention, "Revised repository rule changes the approved implementation.\n");
  await assert.rejects(f.call("start", "A", "worker"), /review and approve this exact plan first/);
  assert.equal((await f.call("load")).units.A.state, "pending");
});

test("case coverage, source references and same-repo PR grouping are structural", async (t) => {
  const f = await fixture(t);
  const plan = structuredClone(f.plan);
  plan.cases.push({
    id: "D",
    title: "unmapped",
    expected: "D",
    task_ids: [],
    source_refs: ["ticket"],
  });
  assert.throws(() => validatePlan(plan), /unmapped case/);
  const duplicate = structuredClone(f.plan);
  duplicate.repositories.push({
    ...duplicate.repositories[0],
    id: "other",
    branch: "codex/other",
  });
  assert.throws(() => validatePlan(duplicate), /duplicate repository paths/);
  const missing = structuredClone(f.plan);
  missing.units[0].source_refs = ["missing"];
  assert.throws(() => validatePlan(missing), /unknown source/);
});

test("real dependency cycles and same-repo publication dependencies are rejected", async (t) => {
  const f = await fixture(t);
  const dep = (unit, stage = "implemented") => ({
    unit,
    stage,
    reason: "actual prerequisite",
    source_refs: ["ticket"],
  });
  const cycle = structuredClone(f.plan);
  cycle.units[0].depends_on = [dep("B")];
  cycle.units[1].depends_on = [dep("A")];
  assert.throws(() => validatePlan(cycle), /cycle/);
  const deadlock = structuredClone(f.plan);
  deadlock.units[1].depends_on = [dep("A", "published")];
  assert.throws(() => validatePlan(deadlock), /deadlocks/);
});

test("blocked sibling does not block independent implementation but holds grouped PR", async (t) => {
  const f = await fixture(t, { blocked: true });
  let s = await f.call("status");
  assert.equal(s.approved, false);
  assert.equal(s.ready_to_implement.length, 0);
  await assert.rejects(f.call("start", "A", "worker"), /approve/);
  await f.approve();
  s = await f.call("status");
  assert.deepEqual(
    s.ready_to_implement.map((u) => u.id),
    ["A"],
  );
  await f.implement("A");
  await f.call("verify", "be");
  s = await f.call("status");
  assert.equal(s.units.find((u) => u.id === "A").state, "verified");
  assert.equal(s.publication[0].ready, false);
  assert.deepEqual(s.publication[0].blocked_units, ["B"]);
});

test("source snapshots are bound to the approved plan content", async (t) => {
  const f = await fixture(t);
  await f.approve();
  await writeFile(f.source, "changed requirement");
  await assert.rejects(f.call("start", "A", "worker"), /approve/);
});

test("only one writer per repo, while another repo can progress", async (t) => {
  const f = await fixture(t, { twoRepos: true });
  await f.approve();
  await f.call("start", "A", "writer-a");
  await assert.rejects(f.call("start", "B", "writer-b"), /writer-active/);
  await f.call("start", "C", "writer-c");
  const state = await f.call("status");
  assert.equal(state.units.filter((u) => u.state === "active").length, 2);
  await assert.rejects(f.call("finish", "A", "other", f.source), /owned/);
});

test("uncommitted partial changes cannot be released onto a shared branch", async (t) => {
  const f = await fixture(t);
  await f.approve();
  await f.call("start", "A", "writer");
  await writeFile(join(f.repos[0].path, "app.txt"), "partial");
  const parked = await f.call(
    "block",
    "A",
    "blocked midway",
    "writer",
    "resolve schema",
    f.source,
  );
  assert.equal(parked.writer_retained, true);
  assert.match(parked.reason, /uncommitted/);
  assert.equal((await f.call("status")).open_blockers.length, 1);
  assert.equal((await f.call("status")).units[0].state, "active");
});

test("moving target baseline blocks affected repo only", async (t) => {
  const f = await fixture(t, { twoRepos: true });
  await f.approve();
  const r = f.repos[0];
  git(r.path, "checkout", "develop");
  await writeFile(join(r.path, "app.txt"), "new develop");
  git(r.path, "add", ".");
  git(r.path, "commit", "-m", "develop moved");
  git(r.path, "checkout", r.branch);
  const state = await f.call("status");
  assert.equal(state.units.find((u) => u.id === "A").reason, "baseline-moved");
  assert.equal(state.units.find((u) => u.id === "C").ready, true);
  await assert.rejects(f.call("start", "A", "worker"), /baseline-moved/);
});

test("failed executed checks remain failed, never certify implementation", async (t) => {
  const f = await fixture(t, { failing: true });
  await f.approve();
  await f.implement("A");
  const checks = await f.call("verify", "be");
  assert.equal(checks.passed, false);
  assert.equal(checks.results[0].exit_code, 1);
  assert.match(
    await readFile(checks.results[0].evidence.path, "utf8"),
    /EXIT 1/,
  );
});

test("cross-repo verification prerequisite is satisfied only by current-head checks", async (t) => {
  const f = await fixture(t, { twoRepos: true });
  f.plan.units[2].depends_on = [
    {
      unit: "A",
      stage: "verified",
      reason: "requires backend contract",
      source_refs: ["spec"],
    },
  ];
  await f.call("replan", f.plan);
  const status = await f.call("status");
  await f.call("approvePlan", status.plan_hash, f.approval);
  await assert.rejects(f.call("start", "C", "worker"), /dependency/);
  await f.implement("A");
  await f.call("verify", "be");
  assert.equal(
    (await f.call("status")).units.find((u) => u.id === "C").ready,
    true,
  );
  await f.call("start", "B", "worker");
  assert.equal(
    (await f.call("status")).units.find((u) => u.id === "C").ready,
    false,
  );
});
