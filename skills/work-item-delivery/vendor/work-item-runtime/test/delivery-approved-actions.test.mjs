import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { nextCursorAction } from "../lib/cursor-workflow.mjs";
import { git, fixture, actionFiles, reviewedFixture } from "./delivery-fixture.mjs";

test("accepted review and approval survive restart without repeating legacy checks or review", async t => {
  const f = await fixture(t, { blocked: true });
  await f.approve(); await f.implement("A");
  const before = (await f.call("load")).repos.be;
  const a = await actionFiles(f);
  const approved = await f.call("approveAction", "be", a.file, f.approval);
  assert.equal(approved.phase, "preflight");
  assert.equal(nextCursorAction(await f.call("status")).action, "check-new-blockers");
  const checked = await a.observe({ comments: [{ id: "nit", blocking: false, resolved: false }] });
  assert.equal(checked.phase, "ready");
  assert.equal(checked.hash, approved.hash);
  const command = execFileSync(process.execPath, [new URL("../bin/wid.mjs", import.meta.url).pathname,
    "cursor", "--run", f.run], { encoding: "utf8" });
  assert.equal(JSON.parse(command).action, "execute-approved-action");
  const state = await f.call("load");
  assert.deepEqual(state.repos.be.review, before.review);
  assert.deepEqual(state.repos.be.verification, before.verification);
  assert.equal(state.blockers.filter(b => !b.resolved).length, 1);
  assert.equal(state.events.filter(e => e.type === "action-approved").length, 1);
});

test("new blockers pause execution but clearing them keeps the same approval", async t => {
  const f = await fixture(t); const a = await actionFiles(f);
  const approved = await f.call("approveAction", "be", a.file, f.approval);
  assert.equal((await a.observe({ checks: [{ id: "ci", required: true, state: "failed" }] })).phase, "blocked");
  assert.equal(nextCursorAction(await f.call("status")).action, "blocked");
  assert.equal((await a.observe({ checks: [{ id: "ci", required: true, state: "passed" }] })).phase, "ready");
  assert.equal((await f.call("status")).approved_actions[0].hash, approved.hash);
  await f.call("block", "A", "New scoped regression", "owner", "Fix regression", f.source);
  assert.equal((await f.call("status")).approved_actions[0].phase, "blocked");
  const blocker = (await f.call("load")).blockers.find(b => !b.resolved);
  await f.call("unblock", blocker.id, f.source);
  assert.equal((await f.call("status")).approved_actions[0].phase, "ready");
});

test("failed refresh invalidates an earlier clean preflight rather than retaining permission to execute", async t => {
  const f = await fixture(t); const a = await actionFiles(f);
  await f.call("approveAction", "be", a.file, f.approval);
  assert.equal((await a.observe()).phase, "ready");
  const malformed = join(f.root, "broken-preflight.json");
  await writeFile(malformed, "{broken");
  assert.equal((await f.call("checkAction", "be", malformed)).phase, "blocked");
  assert.equal(nextCursorAction(await f.call("status")).action, "blocked");
  assert.equal((await a.observe()).phase, "ready");
});

test("unrelated local work is preserved while live PR head changes remain blockers", async t => {
  const f = await fixture(t); const a = await actionFiles(f);
  await writeFile(join(f.repos[0].path, "app.txt"), "new change");
  await f.call("approveAction", "be", a.file, f.approval); await a.observe();
  assert.equal((await f.call("status")).approved_actions[0].phase, "ready");
  assert.equal(await readFile(join(f.repos[0].path, "app.txt"), "utf8"), "new change");
  git(f.repos[0].path, "add", "app.txt"); git(f.repos[0].path, "commit", "-m", "new patch");
  git(f.repos[0].path, "checkout", "develop");
  assert.equal((await f.call("status")).approved_actions[0].phase, "ready");
  const changed = await a.observe({ head: "d".repeat(40) });
  assert.match(changed.blockers[0].reason, /identity changed: head/);
});

test("a completed merge is recorded without re-reviewing stale legacy state", async t => {
  const f = await fixture(t); const a = await actionFiles(f);
  await f.call("approveAction", "be", a.file, f.approval);
  await a.observe({ status: "completed" });
  assert.equal(nextCursorAction(await f.call("status")).action, "read-back-approved-action");
  const result = join(f.root, "completed.json");
  await writeFile(result, JSON.stringify({ ...a.request, status: "active", approved: true, merge_commit: "c".repeat(40) }));
  await assert.rejects(f.call("completeAction", "be", result), /completed merge/);
  await writeFile(result, JSON.stringify({ ...a.request, status: "completed", approved: true, merge_commit: "c".repeat(40) }));
  assert.equal((await f.call("completeAction", "be", result)).phase, "completed");
  assert.equal(nextCursorAction(await f.call("status")).action, "report");
  assert.equal((await f.call("load")).approval, null);
});

test("approved publication retains exact content and defaults to ready for review", async t => {
  const f = await fixture(t); const a = await actionFiles(f, "publish");
  await f.call("approveAction", "be", a.file, f.approval);
  assert.equal((await a.observe({ pr_url: undefined, status: "absent" })).phase, "ready");
  const result = join(f.root, "published.json");
  await writeFile(result, JSON.stringify({ ...a.request, pr_url: "https://example.invalid/pr/100", status: "active", is_draft: true }));
  await assert.rejects(f.call("completeAction", "be", result), /is_draft/);
  await writeFile(result, JSON.stringify({ ...a.request, pr_url: "https://example.invalid/pr/100", status: "active", is_draft: false }));
  assert.equal((await f.call("completeAction", "be", result)).phase, "completed");
});

test("approved actions use one live preflight through the real CLI without another approval hook", async t => {
  const f = await fixture(t); const a = await actionFiles(f);
  const cli = (command, ...args) => JSON.parse(execFileSync(process.execPath,
    [new URL("../bin/wid.mjs", import.meta.url).pathname, command, "--run", f.run, ...args],
    { encoding: "utf8" }));
  assert.equal(cli("approve-action", "--repo", "be", "--file", a.file, "--evidence", f.approval).phase, "preflight");
  const snapshot = join(f.root, "live.json");
  await writeFile(snapshot, JSON.stringify({ ...a.request, observed_at: new Date().toISOString(),
    status: "active", mergeable: true, checks: [], comments: [], blockers: [] }));
  assert.equal(cli("check-action", "--repo", "be", "--file", snapshot).phase, "ready");
  assert.equal(cli("cursor").action, "execute-approved-action");
  const result = join(f.root, "done.json");
  await writeFile(result, JSON.stringify({ ...a.request, status: "completed", approved: true, merge_commit: "b".repeat(40) }));
  assert.equal(cli("action-completed", "--repo", "be", "--file", result).phase, "completed");
  assert.equal(cli("cursor").action, "report");
});

test("unrelated target advancement does not discard the accepted patch review", async t => {
  const f = await fixture(t); const a = await actionFiles(f);
  await f.call("approveAction", "be", a.file, f.approval);
  const path = f.repos[0].path;
  git(path, "checkout", "develop");
  await writeFile(join(path, "unrelated.txt"), "independent target change");
  git(path, "add", "unrelated.txt"); git(path, "commit", "-m", "independent change");
  git(path, "checkout", a.request.source_branch);
  assert.equal((await a.observe()).phase, "ready");
  const status = await f.call("status");
  assert.equal(status.publication[0].baseline_current, false);
  assert.equal(nextCursorAction(status).action, "execute-approved-action");
});

test("existing exact publication approval is reused without requesting it again", async t => {
  const f = await fixture(t);
  await f.approve(); await f.implement("A"); await f.implement("B");
  const head = await reviewedFixture(f, "be");
  const review = structuredClone((await f.call("load")).repos.be.review);
  const payload = { action: "create", url: "https://example.invalid/prs",
    repository_id: "fixture-be", title: "Fix100", description: "Reviewed",
    head, source_branch: f.repos[0].branch, target_branch: "develop",
    is_draft: false, work_item_ids: ["100"], attachments: [] };
  const file = join(f.root, "publication.json");
  await writeFile(file, JSON.stringify(payload));
  const staged = await f.call("stagePublication", "be", file);
  await f.call("approvePublication", "be", staged.approval_required, f.approval);
  assert.equal(nextCursorAction(await f.call("status")).action, "check-new-blockers");
  const snapshot = join(f.root, "live-publication.json");
  await writeFile(snapshot, JSON.stringify({ ...payload, observed_at: new Date().toISOString(),
    status: "absent", checks: [], comments: [], blockers: [] }));
  assert.equal((await f.call("checkAction", "be", snapshot)).phase, "ready");
  assert.deepEqual((await f.call("load")).repos.be.review, review);
  const readback = join(f.root, "readback.json");
  await writeFile(readback, JSON.stringify({ ...payload, status: "active", pr_url: "https://example.invalid/prs/100" }));
  await f.call("published", "be", readback);
  assert.equal(nextCursorAction(await f.call("status")).action, "report");
});

test("changed approved evidence and attachment bytes cannot authorize another external write", async t => {
  const f = await fixture(t); const a = await actionFiles(f, "publish");
  const attachment = join(f.root, "proof.txt");
  await writeFile(attachment, "approved bytes");
  a.request.attachments = [{ name: "proof.txt", path: attachment }];
  await writeFile(a.file, JSON.stringify(a.request));
  await f.call("approveAction", "be", a.file, f.approval);
  await a.observe({ pr_url: undefined, status: "absent" });
  await writeFile(attachment, "changed bytes");
  assert.match((await f.call("status")).approved_actions[0].blockers[0].reason, /attachment changed/);
  await writeFile(attachment, "approved bytes");
  assert.equal((await f.call("status")).approved_actions[0].phase, "ready");
  await writeFile(f.approval, "different instruction");
  assert.match((await f.call("status")).approved_actions[0].blockers[0].reason, /approval evidence changed/);
});
