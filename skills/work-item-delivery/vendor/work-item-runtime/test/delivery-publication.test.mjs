import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { git, fixture } from "./delivery-fixture.mjs";

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
