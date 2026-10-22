import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Delivery, validatePlan } from "../lib/delivery.mjs";
import { nextCursorAction } from "../lib/cursor-workflow.mjs";

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

function git(path, ...args) {
  return execFileSync("git", ["-C", path, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

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

export async function fixture(
  t,
  { blocked = false, twoRepos = false, failing = false } = {},
) {
  const root = await mkdtemp(join(tmpdir(), "wid-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, "source.txt");
  await writeFile(
    source,
    "Fixture: cases A, B and C, expected behavior; not a live Work Item.",
  );
  const approval = join(root, "human-approval.txt");
  await writeFile(approval, "Synthetic approval for test fixtures only.");
  const repos = [];
  for (const key of twoRepos ? ["be", "fe"] : ["be"]) {
    const path = join(root, key);
    await mkdir(path);
    git(path, "init", "-b", "develop");
    git(path, "config", "user.email", "fixture@example.invalid");
    git(path, "config", "user.name", "Fixture");
    await writeFile(join(path, "app.txt"), "baseline\n");
    git(path, "add", ".");
    git(path, "commit", "-m", "fixture baseline");
    const base = git(path, "rev-parse", "HEAD");
    git(path, "checkout", "-b", `codex/100-${key}`);
    repos.push({
      id: key,
      path,
      base_ref: "develop",
      base_sha: base,
      branch: `codex/100-${key}`,
    });
  }
  const cases = ["A", "B", ...(twoRepos ? ["C"] : [])].map((id) => ({
    id,
    title: `Case ${id}`,
    expected: `behavior ${id}`,
    task_ids: [id === "A" ? "101" : "102"],
    source_refs: ["ticket", "spec"],
  }));
  const units = cases.map((c, i) => ({
    id: c.id,
    repo: twoRepos && i === 2 ? "fe" : "be",
    case_ids: [c.id],
    source_refs: ["ticket", "spec"],
    current_flow: "user → request → service → row",
    finding: "fixture cause",
    finding_status: "confirmed",
    change: `fix ${c.id}`,
    acceptance: [`case ${c.id} passes`],
    unit_test_plan: {reason:"Synthetic scheduler fixture; command execution is the behavior under test. Product regression planning is tested separately."},
    allowed_paths: ["app.txt"],
    checks: [
      {
        id: "regression",
        argv: [
          process.execPath,
          "-e",
          failing ? "process.exit(1)" : "process.exit(0)",
        ],
        purpose: "fixture command actually executes",
        timeout_ms: 5000,
      },
    ],
    depends_on: [],
  }));
  const plan = {
    schema: "work-item-delivery.plan.v2",
    work_item: {
      id: "100",
      type: "Task",
      url: "https://example.invalid/workitems/100",
      revision: "7",
    },
    policy: { pr_grouping: "one-per-repo", branch_prefix:"codex/" },
    sources: [
      {
        id: "ticket",
        url: "https://example.invalid/workitems/100",
        revision: "7",
        section: "Expected",
        status: "read",
        snapshot: source,
      },
      {
        id: "spec",
        kind: "confluence",
        url: "https://example.invalid/spec",
        revision: "3",
        section: "Filtering",
        status: "read",
        snapshot: source,
      },
      { id:"business", kind:"second_brain", url:"https://example.invalid/wiki", revision:"fixture", section:"Synthetic business context", status:"read", snapshot:source },
    ],
    cases,
    repositories: repos,
    units,
    blockers: blocked
      ? [
          {
            id: "ba-answer",
            units: ["B"],
            reason: "ambiguous requirement",
            owner: "BA",
            unblock_when: "a confirmed answer is available",
            source_refs: ["ticket"],
          },
        ]
      : [],
    knowledge: {
      second_brain:{status:"read",query:"fixture context",summary:"Synthetic context; no live vault claim.",source_refs:["business"]},
      confluence:{status:"read",query:"fixture specification",summary:"Synthetic specification.",source_refs:["spec"]},
      business_flows:[{id:"fixture-flow",case_ids:cases.map(c=>c.id),actor:"Fixture user",trigger:"Test scenario",preconditions:[],steps:[{action:"Execute fixture",business_rule:"Observe the fixture acceptance",source_refs:["business","spec"]}],outcome:"Recorded fixture result"}],
    },
    capture_plan:cases.map(c=>({id:`fixture-${c.id}`,repo:units.find(u=>u.case_ids.includes(c.id)).repo,case_ids:[c.id],tool:"not-applicable",reason:"Synthetic orchestration fixture has no product UI; browser evidence is tested separately."})),
  };
  const run = join(root, "run");
  const call = (method, ...args) => new Delivery(run)[method](...args);
  const initialized = await call("init", plan);
  const approve = () => call("approvePlan", initialized.plan_hash, approval);
  const implement = async (unit) => {
    await call("start", unit, "worker");
    const repo = repos.find(
      (r) => r.id === units.find((u) => u.id === unit).repo,
    );
    await writeFile(join(repo.path, "app.txt"), `fix ${unit}\n`);
    git(repo.path, "add", "app.txt");
    git(repo.path, "commit", "-m", `fix case ${unit}`);
    return call("finish", unit, "worker", source);
  };
  return {
    root,
    source,
    approval,
    plan,
    run,
    call,
    approve,
    implement,
    repos,
    initialized,
  };
}

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
test("local pilot: implementation → real checks → review → exact approval → PR read-back", async (t) => {
  const f = await fixture(t);
  await f.approve();
  await f.implement("A");
  await f.implement("B");
  const verified = await f.call("verify", "be");
  assert.equal(verified.results.length, 2);
  assert.equal(verified.passed, true);
  const reviewFile = join(f.root, "reviews.json");
  await writeFile(
    reviewFile,
    JSON.stringify({
      head: verified.head,
      reviews: [
        {
          axis: "standards",
          reviewer: "fixture reviewer 1",
          verdict: "pass",
          report: f.source,
        },
        {
          axis: "specification",
          reviewer: "fixture reviewer 2",
          verdict: "pass",
          report: f.source,
        },
      ],
    }),
  );
  await f.call("review", "be", reviewFile);
  const pr = {
    repository_id: "fixture-be",
    action: "create",
    url: "https://example.invalid/prs",
    title: "Fix all cases for Work Item 100",
    description:
      "## What Happened\nFix A and B.\n## Insight\nFixture flow.\n## Proof of Works\nControlled local pilot.",
    head: verified.head,
    source_branch: f.repos[0].branch,
    target_branch: "develop",
    is_draft: true,
    work_item_ids: ["100", "101", "102"],
    attachments: [{ path: f.source }],
  };
  const payload = join(f.root, "pr.json");
  await writeFile(payload, JSON.stringify(pr));
  const staged = await f.call("stagePublication", "be", payload);
  await assert.rejects(
    f.call("approvePublication", "be", "wrong", f.approval),
    /changed/,
  );
  await f.call(
    "approvePublication",
    "be",
    staged.approval_required,
    f.approval,
  );
  const actual = {
    ...pr,
    status: "active",
    pr_url: "https://example.invalid/prs/1",
    attachments: [
      {
        name: "source.txt",
        bytes: (await readFile(f.source)).length,
        sha256: (await import("../lib/delivery.mjs")).sha(
          await readFile(f.source),
        ),
      },
    ],
  };
  const readback = join(f.root, "readback.json");
  await writeFile(
    readback,
    JSON.stringify({ ...actual, description: "changed without approval" }),
  );
  await assert.rejects(f.call("published", "be", readback), /description/);
  await writeFile(readback, JSON.stringify(actual));
  await f.call("published", "be", readback);
  assert.ok(
    (await f.call("status")).units.every((u) => u.state === "published"),
  );
  assert.match(await readFile(join(f.run, "units.tsv"), "utf8"), /published/);
  assert.match(await readFile(join(f.run, "status.md"), "utf8"), /published/);
});

test("replanning changed acceptance resets affected units and their dependents", async (t) => {
  const f = await fixture(t);
  await f.approve();
  await f.implement("A");
  f.plan.units[1].depends_on = [
    {
      unit: "A",
      stage: "implemented",
      reason: "uses confirmed helper",
      source_refs: ["spec"],
    },
  ];
  await f.call("replan", f.plan);
  let state = await f.call("status");
  await f.call("approvePlan", state.plan_hash, f.approval);
  await f.implement("B");
  const changed = structuredClone(f.plan);
  changed.cases[0].expected = "new confirmed acceptance";
  await f.call("replan", changed);
  state = await f.call("status");
  assert.equal(state.approved, false);
  assert.ok(state.units.every((u) => u.state === "pending"));
});
test("committed partial work cannot silently release the shared repo writer", async (t) => {
  const f = await fixture(t);
  await f.approve();
  await f.call("start", "A", "writer");
  const repo = f.repos[0];
  await writeFile(join(repo.path, "app.txt"), "committed partial");
  git(repo.path, "add", ".");
  git(repo.path, "commit", "-m", "partial fixture");
  const parked = await f.call(
    "block",
    "A",
    "needs API answer",
    "writer",
    "contract confirmed",
    f.source,
  );
  assert.equal(parked.writer_retained, true);
  assert.match(parked.reason, /committed partial/);
  assert.equal(
    (await f.call("status")).units.find((u) => u.id === "B").reason,
    "repository-writer-active",
  );
});
test("a later head rejects an earlier review receipt", async (t) => {
  const f = await fixture(t);
  await f.approve();
  await f.implement("A");
  const verified = await f.call("verify", "be");
  await f.implement("B");
  const file = join(f.root, "stale-review.json");
  await writeFile(file, JSON.stringify({ head: verified.head, reviews: [] }));
  await assert.rejects(f.call("review", "be", file), /verify this head/);
});
test("repository ownership is enforced across independent CLI processes", async (t) => {
  const f = await fixture(t);
  await f.approve();
  const { spawn } = await import("node:child_process");
  const cli = new URL("../bin/wid.mjs", import.meta.url).pathname;
  const start = (unit, owner) =>
    new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        [cli, "start", "--run", f.run, "--unit", unit, "--owner", owner],
        { stdio: ["ignore", "pipe", "pipe"] },
      );
      let stderr = "";
      child.stderr.on("data", (c) => (stderr += c));
      child.on("close", (code) => resolve({ code, stderr }));
    });
  const results = await Promise.all([start("A", "one"), start("B", "two")]);
  assert.equal(results.filter((r) => r.code === 0).length, 1);
  assert.equal(
    (await f.call("status")).units.filter((u) => u.state === "active").length,
    1,
  );
});
test("the shared store is available while another process runs long checks", async (t) => {
  const f = await fixture(t, { twoRepos: true });
  f.plan.units[0].checks[0].argv = [
    process.execPath,
    "-e",
    "setTimeout(()=>{},1500)",
  ];
  await f.call("replan", f.plan);
  let state = await f.call("status");
  await f.call("approvePlan", state.plan_hash, f.approval);
  await f.implement("A");
  const { spawn } = await import("node:child_process");
  const cli = new URL("../bin/wid.mjs", import.meta.url).pathname;
  const child = spawn(
    process.execPath,
    [cli, "verify", "--run", f.run, "--repo", "be"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let errors = "";
  child.stderr.on("data", (c) => (errors += c));
  const ended = new Promise((resolve) =>
    child.on("close", (code) => resolve(code)),
  );
  let running = false;
  for (let i = 0; i < 50 && !running; i++) {
    await new Promise((r) => setTimeout(r, 20));
    const raw = JSON.parse(
      await readFile(join(f.run, "delivery.json"), "utf8"),
    );
    running = !!raw.repos.be.verification_running;
  }
  assert.ok(running, "verifier should expose its in-flight receipt");
  await f.call("start", "C", "frontend-writer");
  assert.equal(await ended, 0, errors);
  assert.equal(
    (await f.call("status")).units.find((u) => u.id === "C").state,
    "active",
  );
});

test("CLI preserves intake snapshots and renders task/spec links and blocked decisions", async (t) => {
  const f = await fixture(t, { blocked: true });
  const cli = new URL("../bin/wid.mjs", import.meta.url).pathname;
  const command = (...args) =>
    execFileSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  const intake = JSON.parse(
    command(
      "intake",
      "--run",
      f.run,
      "--file",
      f.source,
      "--url",
      "https://example.invalid/source",
      "--revision",
      "7",
    ),
  );
  assert.equal(
    await readFile(intake.path, "utf8"),
    await readFile(f.source, "utf8"),
  );
  const rendered = command("plan", "--run", f.run);
  assert.match(rendered, /https:\/\/example.invalid\/spec/);
  assert.match(rendered, /BA/);
  assert.match(rendered, /dependency|Dependency/);
  assert.match(rendered, /approval required/);
  const before = JSON.parse(
    await readFile(join(f.run, "delivery.json"), "utf8"),
  ).events.length;
  command("status", "--run", f.run);
  const after = JSON.parse(await readFile(join(f.run, "delivery.json"), "utf8"))
    .events.length;
  assert.equal(
    after,
    before,
    "read-only status must not append authoritative events",
  );
});

test("a blocker discovered after staging invalidates the publication package", async (t) => {
  const f = await fixture(t);
  await f.approve();
  await f.implement("A");
  await f.implement("B");
  const verified = await f.call("verify", "be");
  const report = join(f.root, "review.json");
  await writeFile(
    report,
    JSON.stringify({
      head: verified.head,
      reviews: [
        {
          axis: "standards",
          reviewer: "fixture reviewer 1",
          verdict: "pass",
          report: f.source,
        },
        {
          axis: "specification",
          reviewer: "fixture reviewer 2",
          verdict: "pass",
          report: f.source,
        },
      ],
    }),
  );
  await f.call("review", "be", report);
  const payload = join(f.root, "pr.json");
  await writeFile(
    payload,
    JSON.stringify({
      repository_id: "fixture-be",
      action: "create",
      url: "https://example.invalid/prs",
      title: "Fixture",
      description: "Fixture only",
      head: verified.head,
      source_branch: f.repos[0].branch,
      target_branch: "develop",
      is_draft: true,
      work_item_ids: ["100"],
      attachments: [],
    }),
  );
  const staged = await f.call("stagePublication", "be", payload);
  await f.call(
    "block",
    "B",
    "new requirement conflict",
    "BA",
    "confirm interpretation",
    f.source,
  );
  await assert.rejects(
    f.call("approvePublication", "be", staged.approval_required, f.approval),
    /readiness changed/,
  );
});

async function uiFixture(t) {
  const f = await fixture(t);
  const image = join(f.root, "fixture.png");
  await writeFile(image, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6OMsAAAAASUVORK5CYII=", "base64"));
  f.plan.capture_plan[0] = {id:"screen-A",repo:"be",case_ids:["A"],tool:"playwright",environment:"local-fixture",url:"http://127.0.0.1/fixture",steps:["Open fixture"],assertions:["Case A behavior is visible"]};
  await f.call("replan", f.plan);
  const state = await f.call("status");
  await f.call("approvePlan", state.plan_hash, f.approval);
  const capture = async (phase, outcome = phase === "after" ? "passed" : "observed", overrides = {}) => {
    const file = join(f.root, `${phase}-${Date.now()}.json`);
    const input = {capture_id:"screen-A",tool:"playwright",phase,outcome,environment:"local-fixture",url:"http://127.0.0.1/fixture",captured_at:new Date().toISOString(),locale:"en",timezone:"UTC",viewport:{width:100,height:100},observed:"Synthetic browser receipt for orchestration tests only.",steps:["Open fixture"],git_head:git(f.repos[0].path,"rev-parse","HEAD"),assertions:[{expected:"Case A behavior is visible",actual:"Fixture assertion observed",passed:true}],artifacts:[{kind:"screenshot",path:image}],...overrides};
    await writeFile(file, JSON.stringify(input));
    return f.call("recordCapture", file);
  };
  return {...f,image,capture};
}
test("v2 requires both research providers, cited case flows and evidence dispositions", async t => {
  const f = await fixture(t);
  const missing = structuredClone(f.plan); delete missing.knowledge.second_brain;
  assert.throws(() => validatePlan(missing), /second_brain/);
  const uncited = structuredClone(f.plan); uncited.knowledge.business_flows[0].steps[0].source_refs = ["unknown"];
  assert.throws(() => validatePlan(uncited), /cite existing/);
  const uncovered = structuredClone(f.plan); uncovered.capture_plan = [];
  assert.throws(() => validatePlan(uncovered), /missing evidence disposition/);
});
test("missing before capture holds only affected UI work; real artifact receipt unlocks it", async t => {
  const f = await uiFixture(t);
  let state = await f.call("status");
  assert.equal(state.units.find(u => u.id === "A").reason, "before-evidence-required");
  assert.equal(state.units.find(u => u.id === "B").ready, true);
  await assert.rejects(f.call("start", "A", "worker"), /before-evidence-required/);
  await f.capture("before");
  state = await f.call("status");
  assert.equal(state.units.find(u => u.id === "A").ready, true);
  await f.implement("A");
});
test("passing after evidence requires the current head and every planned observation", async t => {
  const f = await uiFixture(t); await f.capture("before"); await f.implement("A");
  await assert.rejects(f.capture("after", "passed", {assertions:[]}), /every planned assertion/);
  await f.capture("after");
  assert.equal((await f.call("status")).publication[0].capture_evidence.ready, true);
  await f.implement("B");
  assert.deepEqual((await f.call("status")).publication[0].capture_evidence.missing, ["screen-A:after"]);
});
test("changed screenshot bytes invalidate their recorded capture", async t => {
  const f = await uiFixture(t); await f.capture("before");
  await writeFile(f.image, "tampered artifact");
  assert.equal((await f.call("status")).units.find(u => u.id === "A").ready, false);
});
test("a failed or blocked capture cannot reuse an older passing result", async t => {
  const f = await uiFixture(t); await f.capture("before"); await f.implement("A"); await f.capture("after");
  await f.capture("after", "failed", {reason:"Fixture regression observed",assertions:[{expected:"Case A behavior is visible",actual:"Different fixture result",passed:false}]});
  assert.equal((await f.call("status")).publication[0].capture_evidence.ready, false);
  await f.capture("after"); await f.capture("blocker", "blocked", {reason:"Fixture environment unavailable"});
  assert.equal((await f.call("status")).publication[0].capture_evidence.ready, false);
});
test("business flow changes invalidate implementation assumptions", async t => {
  const f = await fixture(t); await f.approve(); await f.implement("A");
  f.plan.knowledge.business_flows[0].steps[0].business_rule = "Changed acceptance context";
  await f.call("replan", f.plan);
  assert.equal((await f.call("status")).units.find(u => u.id === "A").state, "pending");
});
test("legacy v1 remains readable but cannot bypass the new execution evidence contract", async t => {
  const f = await fixture(t);
  f.plan.schema = "work-item-delivery.plan.v1"; delete f.plan.knowledge; delete f.plan.capture_plan;
  await f.call("replan", f.plan);
  const state = await f.call("status"); await f.call("approvePlan", state.plan_hash, f.approval);
  assert.equal((await f.call("status")).approved, false);
  await assert.rejects(f.call("start", "A", "worker"), /upgrade the legacy plan/);
});
test("unavailable business-flow-only citations require blockers for affected units", async t => {
  const f=await fixture(t);
  f.plan.sources.find(s=>s.id==='business').status='unavailable';
  f.plan.knowledge.second_brain.status='gap';f.plan.knowledge.second_brain.gap='Fixture source inaccessible';
  assert.throws(()=>validatePlan(f.plan),/unavailable\/conflicted source/);
  f.plan.blockers=[{id:'business-gap',units:['A','B'],reason:'Fixture business rule missing',owner:'Fixture owner',unblock_when:'Source available',source_refs:['business']}];
  assert.doesNotThrow(()=>validatePlan(f.plan));
});
test("browser captures use local builds and explicit local data scope", async t => {
  const f=await uiFixture(t);const remote=structuredClone(f.plan);
  remote.capture_plan[0].url='https://example.invalid/remote-app';
  assert.throws(()=>validatePlan(remote),/local loopback/);
  remote.capture_plan[0].url='http://127.0.0.1/fixture';remote.capture_plan[0].environment='SIT';
  assert.throws(()=>validatePlan(remote),/local loopback/);
});
test("approved before and after local builds can use different ports", async t => {
  const f=await uiFixture(t);f.plan.capture_plan[0].before_url='http://127.0.0.1:39999/baseline';
  await f.call('replan',f.plan);const s=await f.call('status');await f.call('approvePlan',s.plan_hash,f.approval);
  await f.capture('before','observed',{url:'http://127.0.0.1:39999/baseline'});
  assert.equal((await f.call('status')).units.find(u=>u.id==='A').ready,true);
  await assert.rejects(f.capture('after','passed',{url:'http://127.0.0.1:39999/baseline'}),/differs from approved/);
  f.plan.capture_plan[0].before_url='https://example.invalid/baseline';
  assert.throws(()=>validatePlan(f.plan),/local loopback/);
});
test("unrelated replanning retains intact before evidence but renews after certification", async t => {
  const f=await uiFixture(t);await f.capture('before');await f.implement('A');await f.capture('after');
  f.plan.units.find(u=>u.id==='B').priority=0;
  await f.call('replan',f.plan);
  const s=await f.call('status');
  assert.deepEqual(s.publication[0].capture_evidence.missing,['screen-A:after']);
});
test("delayed older success cannot override a newer observed failure", async t => {
  const f=await uiFixture(t);await f.capture('before');await f.implement('A');
  await f.capture('after','passed',{captured_at:'2026-10-20T00:00:00Z'});
  await f.capture('after','failed',{captured_at:'2026-10-20T01:00:00Z',reason:'Newer observed failure'});
  await f.capture('after','passed',{captured_at:'2026-10-20T00:00:00Z'});
  assert.equal((await f.call('status')).publication[0].capture_evidence.ready,false);
});
test("legacy active writer can finish authorized work before migrating the remaining run", async t => {
  const f=await fixture(t);await f.approve();await f.call('start','A','worker');
  const file=join(f.run,'delivery.json');const legacy=JSON.parse(await readFile(file,'utf8'));
  legacy.plan.schema='work-item-delivery.plan.v1';delete legacy.plan.knowledge;delete legacy.plan.capture_plan;
  const run=new Delivery(f.run);legacy.plan_hash=await run.fingerprint(legacy.plan);legacy.approval.hash=legacy.plan_hash;
  await writeFile(file,JSON.stringify(legacy));
  await writeFile(join(f.repos[0].path,'app.txt'),'authorized legacy implementation');git(f.repos[0].path,'add','.');git(f.repos[0].path,'commit','-m','complete authorized legacy fixture');
  await f.call('finish','A','worker',f.source);
  await f.call('replan',f.plan);
  assert.equal((await f.call('status')).approved,false);
});

async function approveCurrent(f) {
  await f.call("approvePlan", (await f.call("status")).plan_hash, f.approval);
}
async function reviewedFixture(f, repo) {
  const verified = await f.call("verify", repo);
  assert.equal(verified.passed, true);
  const file = join(f.root, `review-${repo}.json`);
  await writeFile(file, JSON.stringify({head:verified.head,reviews:[
    {axis:"standards",reviewer:"Synthetic standards fixture",verdict:"pass",report:f.source},
    {axis:"specification",reviewer:"Synthetic specification fixture",verdict:"pass",report:f.source},
  ]}));
  await f.call("review", repo, file);
  return verified.head;
}
async function publicationFixture(f, repo) {
  const head = await reviewedFixture(f, repo);
  const payload = {repository_id:`fixture-${repo}`,action:"create",url:"https://example.invalid/prs",title:"Synthetic grouped PR",description:"Synthetic read-back only; no forge request.",head,source_branch:f.repos.find(r=>r.id===repo).branch,target_branch:"develop",is_draft:true,work_item_ids:["100"],attachments:[]};
  const file = join(f.root, `publication-${repo}.json`);
  const readback = join(f.root, `readback-${repo}.json`);
  await writeFile(file, JSON.stringify(payload));
  const staged = await f.call("stagePublication", repo, file);
  await f.call("approvePublication", repo, staged.approval_required, f.approval);
  const actual = {...payload,status:"active",pr_url:`https://example.invalid/prs/${repo}`};
  await writeFile(readback, JSON.stringify(actual));
  await f.call("published", repo, readback);
  return {payload,file,readback,actual};
}
test("case-only specification revisions and byte changes reset consumers, preserving independent work", async t => {
  const f=await fixture(t,{twoRepos:true});
  f.plan.cases.forEach(c=>c.source_refs=c.id==='A'?["ticket","spec"]:["ticket"]);
  f.plan.units.forEach(u=>u.source_refs=["ticket"]);
  f.plan.knowledge.business_flows[0].steps[0].source_refs=["ticket","business"];
  f.plan.units[1].depends_on=[{unit:"A",stage:"implemented",reason:"Consumes A",source_refs:["ticket"]}];
  await f.call("replan",f.plan);await approveCurrent(f);
  await f.implement("A");await f.implement("B");await f.implement("C");
  const next=join(f.root,"spec-v2.txt");await writeFile(next,"Changed case-A-only specification\n");
  Object.assign(f.plan.sources.find(s=>s.id==='spec'),{revision:"4",snapshot:next});
  await f.call("replan",f.plan);
  let s=await f.call("status");
  assert.deepEqual(s.units.map(u=>[u.id,u.state]),[["A","pending"],["B","pending"],["C","implemented"]]);
  await approveCurrent(f);await f.implement("A");await f.implement("B");
  await writeFile(next,"Changed bytes at the same case-A-only locator\n");
  await f.call("replan",f.plan);s=await f.call("status");
  assert.deepEqual(s.units.map(u=>[u.id,u.state]),[["A","pending"],["B","pending"],["C","implemented"]]);
});
test("symlinks and linked worktrees cannot create a second repository writer identity", async t => {
  const f=await fixture(t);const {symlink}=await import("node:fs/promises");
  const alias=join(f.root,"alias");await symlink(f.repos[0].path,alias);
  const p=structuredClone(f.plan);p.repositories.push({...p.repositories[0],id:"alias",path:alias});p.units[1].repo="alias";
  assert.throws(()=>validatePlan(p),/duplicate Git repository identities/);
  const linked=join(f.root,"linked");git(f.repos[0].path,"worktree","add","-b","codex/linked",linked,"develop");
  Object.assign(p.repositories[1],{path:linked,branch:"codex/linked"});
  assert.throws(()=>validatePlan(p),/duplicate Git repository identities/);
});
test("grouped publication cycles are rejected even when unit dependencies are acyclic", async t => {
  const f=await fixture(t,{twoRepos:true});
  const dep=(unit,stage)=>({unit,stage,reason:"Fixture prerequisite",source_refs:["spec"]});
  f.plan.units[1].depends_on=[dep("C","published")];f.plan.units[2].depends_on=[dep("A","published")];
  assert.throws(()=>validatePlan(f.plan),/grouped publication dependency deadlock/);
  f.plan.units[2].depends_on=[dep("A","verified")];
  assert.doesNotThrow(()=>validatePlan(f.plan),"incremental verified prerequisite permits a valid publication order");
});
test("stale upstream targets withdraw consumer certification and publication readiness", async t => {
  const f=await fixture(t,{twoRepos:true});
  f.plan.units[2].depends_on=[{unit:"A",stage:"verified",reason:"Backend contract",source_refs:["spec"]}];
  await f.call("replan",f.plan);await approveCurrent(f);await f.implement("A");await f.call("verify","be");
  await f.implement("C");await reviewedFixture(f,"fe");
  assert.equal((await f.call("status")).publication.find(r=>r.repo==='fe').ready,true);
  const r=f.repos[0];git(r.path,"checkout","develop");await writeFile(join(r.path,"app.txt"),"upstream develop changed");git(r.path,"add",".");git(r.path,"commit","-m","upstream target moved");git(r.path,"checkout",r.branch);
  const s=await f.call("status");assert.equal(s.units.find(u=>u.id==='C').reason,"dependency");
  assert.equal(s.publication.find(r=>r.repo==='fe').ready,false);
  await assert.rejects(f.call("verify","fe"),/dependency evidence is stale/);
  await assert.rejects(f.call("stagePublication","fe",join(f.root,"unused.json")),/all grouped cases/);
});
test("same-repo verified prerequisites still allow final combined checks and review", async t => {
  const f=await fixture(t);f.plan.units[1].depends_on=[{unit:"A",stage:"verified",reason:"Verified shared contract",source_refs:["spec"]}];
  await f.call("replan",f.plan);await approveCurrent(f);await f.implement("A");await f.call("verify","be");
  await f.implement("B");await reviewedFixture(f,"be");
  assert.equal((await f.call("status")).publication[0].ready,true);
});
test("re-verification retains PR identity and rejects duplicate create or mismatched update read-back", async t => {
  const f=await fixture(t);await f.approve();await f.implement("A");await f.implement("B");
  const p=await publicationFixture(f,"be");
  // Exercise migration from a run that has a published receipt but no separate identity.
  const stateFile=join(f.run,"delivery.json");const raw=JSON.parse(await readFile(stateFile,"utf8"));delete raw.repos.be.pr_identity;await writeFile(stateFile,JSON.stringify(raw));
  await reviewedFixture(f,"be");
  assert.equal((await f.call("status")).publication[0].pr_identity.pr_url,p.actual.pr_url);
  await assert.rejects(f.call("stagePublication","be",p.file),/already has its grouped PR/);
  p.payload.action="update";p.payload.url=p.actual.pr_url;await writeFile(p.file,JSON.stringify(p.payload));
  const staged=await f.call("stagePublication","be",p.file);await f.call("approvePublication","be",staged.approval_required,f.approval);
  await writeFile(p.readback,JSON.stringify({...p.actual,pr_url:"https://example.invalid/prs/different"}));
  await assert.rejects(f.call("published","be",p.readback),/PR identity/);
  await writeFile(p.readback,JSON.stringify(p.actual));await f.call("published","be",p.readback);
});
test("published repository records survive replanning and completing another repository", async t => {
  const f=await fixture(t,{twoRepos:true});await f.approve();await f.implement("A");await f.implement("B");
  await publicationFixture(f,"be");
  const before=JSON.parse(await readFile(join(f.run,"delivery.json"),"utf8"));
  const r=f.repos.find(r=>r.id==='fe');git(r.path,"checkout","develop");await writeFile(join(r.path,"app.txt"),"new frontend target");git(r.path,"add",".");git(r.path,"commit","-m","frontend target moved");git(r.path,"checkout",r.branch);
  r.base_sha=git(r.path,"rev-parse","develop");f.plan.cases.find(c=>c.id==='C').expected="Updated frontend-only acceptance";
  await f.call("replan",f.plan);
  const after=JSON.parse(await readFile(join(f.run,"delivery.json"),"utf8"));
  assert.deepEqual(after.repos.be,before.repos.be);assert.equal(after.units.A.state,"published");assert.equal(after.approval,null);
  git(r.path,"merge","--ff-only","develop");await approveCurrent(f);await f.implement("C");await reviewedFixture(f,"fe");
  assert.equal((await f.call("status")).publication.find(r=>r.repo==='fe').ready,true);
  const changed=structuredClone(f.plan);changed.cases[0].expected="Change already published acceptance";
  await assert.rejects(f.call("replan",changed),/published case\/source scope is immutable/);
});
test("transient store contention waits for ownership; permanent contention times out without stealing", async t => {
  const f=await fixture(t);const {openStore}=await import("../vendor/pstack/store.mjs");
  const store=openStore(f.run);await store.init();
  const pending=f.call("status");await new Promise(r=>setTimeout(r,150));await store.close();
  assert.equal((await pending).work_item.id,"100");
  const held=openStore(f.run);await held.init();
  try {await assert.rejects(f.call("status"),/contention timed out/);assert.equal((await readFile(join(f.run,".orch.lock"),"utf8")).trim(),String(process.pid));}
  finally {await held.close();}
  assert.equal((await f.call("status")).work_item.id,"100");
});

test("dirty, switched or blocked prerequisites hold an implemented consumer through publication", async t => {
  const f = await fixture(t, {twoRepos:true});
  f.plan.units.find(u => u.id === "C").depends_on = [{unit:"A",stage:"verified",reason:"Fixture contract",source_refs:["ticket"]}];
  await f.call("replan", f.plan); await approveCurrent(f);
  await f.implement("A"); await f.call("verify", "be");
  await f.implement("C"); await reviewedFixture(f, "fe");
  const be = f.repos[0];
  const ready = async () => (await f.call("status")).publication.find(r => r.repo === "fe").ready;
  assert.equal(await ready(), true);
  await writeFile(join(be.path, "app.txt"), "uncommitted provider change\n");
  assert.equal(await ready(), false);
  await assert.rejects(f.call("verify", "fe"), /dependency evidence/);
  git(be.path, "restore", "app.txt");
  git(be.path, "checkout", "develop");
  assert.equal(await ready(), false);
  git(be.path, "checkout", be.branch);
  assert.equal(await ready(), true);
  await f.call("block", "A", "Provider assumption now unresolved", "fixture owner", "Contract confirmed", f.source);
  assert.equal(await ready(), false);
  await assert.rejects(f.call("review", "fe", join(f.root, "review-fe.json")), /dependency evidence/);
  await assert.rejects(f.call("stagePublication", "fe", join(f.root, "unused.json")), /all grouped cases/);
});

test("prerequisite drift during executed checks cannot certify a consumer", async t => {
  const f = await fixture(t, {twoRepos:true});
  const c = f.plan.units.find(u => u.id === "C");
  c.depends_on = [{unit:"A",stage:"verified",reason:"Fixture contract",source_refs:["ticket"]}];
  c.checks[0].argv = [process.execPath,"-e",`require('node:fs').writeFileSync(${JSON.stringify(join(f.repos[0].path,"app.txt"))}, 'provider drift during check')`];
  await f.call("replan", f.plan); await approveCurrent(f);
  await f.implement("A"); await f.call("verify", "be"); await f.implement("C");
  const v = await f.call("verify", "fe");
  assert.equal(v.results[0].exit_code, 0);
  assert.equal(v.passed, false);
  assert.equal(v.source_unchanged, false);
  assert.equal((await f.call("status")).publication.find(r => r.repo === "fe").ready, false);
});

test("incremental review can unlock another repository before a pending sibling is implemented", async t => {
  const f = await fixture(t, {twoRepos:true});
  f.plan.units.find(u => u.id === "B").depends_on = [{unit:"C",stage:"verified",reason:"Verified consumer contract",source_refs:["ticket"]}];
  f.plan.units.find(u => u.id === "C").depends_on = [{unit:"A",stage:"reviewed",reason:"Review shared prerequisite",source_refs:["ticket"]}];
  assert.doesNotThrow(() => validatePlan(f.plan));
  await f.call("replan", f.plan); await approveCurrent(f);
  await f.implement("A"); await reviewedFixture(f, "be");
  assert.equal((await f.call("status")).units.find(u => u.id === "C").ready, true);
  assert.equal((await f.call("status")).publication.find(r => r.repo === "be").ready, false);
  await f.implement("C"); await f.call("verify", "fe");
  await f.implement("B"); await reviewedFixture(f, "be"); await reviewedFixture(f, "fe");
  assert.ok((await f.call("status")).publication.every(r => r.ready));
});

test("cursor follows the ledger from approval through a staged publication", async t => {
  const f = await fixture(t);
  assert.equal(nextCursorAction(await f.call("status")).hook, "plan-approval");
  await f.approve();
  assert.equal(nextCursorAction(await f.call("status")).action, "start-unit");
  await f.call("start", "A", "coordinator");
  assert.equal(nextCursorAction(await f.call("status")).units[0].owner, "coordinator");
  await f.call("finish", "A", "coordinator", f.source);
  await f.implement("B");
  assert.equal(nextCursorAction(await f.call("status")).action, "verify");
  await reviewedFixture(f, "be");
  const ready = await f.call("status");
  assert.equal(ready.publication[0].gate, "open");
  assert.equal(nextCursorAction(ready).action, "stage-publication");
  const payload = {repository_id:"fixture-be",action:"create",url:"https://example.invalid/prs",title:"Synthetic grouped PR",description:"Synthetic read-back only; no forge request.",head:ready.publication[0].head,source_branch:f.repos[0].branch,target_branch:"develop",is_draft:true,work_item_ids:["100"],attachments:[]};
  const file = join(f.root, "cursor-publication.json");
  await writeFile(file, JSON.stringify(payload));
  await f.call("stagePublication", "be", file);
  const staged = await f.call("status");
  assert.equal(staged.publication[0].gate, "staged");
  assert.equal(nextCursorAction(staged).hook, "publication-approval");
});
