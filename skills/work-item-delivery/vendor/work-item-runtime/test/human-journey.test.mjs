import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fixture, git } from "./delivery-fixture.mjs";
import { Delivery } from "../lib/delivery.mjs";
import { sha } from "../lib/delivery-common.mjs";
import { admitFixture } from "./investigation-fixture.mjs";

const executable = new URL("../bin/wid.mjs", import.meta.url).pathname;
function cli(f, command, ...args) {
  const result = spawnSync(process.execPath, [executable, command, "--run", f.run, ...args], {encoding: "utf8"});
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return command === "plan" ? result.stdout : JSON.parse(result.stdout);
}
function refused(f, command, args, reason) {
  const result = spawnSync(process.execPath, [executable, command, "--run", f.run, ...args], {encoding: "utf8"});
  assert.ifError(result.error);
  assert.equal(result.status, 1, result.stdout);
  assert.match(JSON.parse(result.stderr).error, reason);
}
async function decision(f, instruction) {
  const path = join(f.root, "simulated-human-decision.txt");
  await writeFile(path, "Synthetic journey test. No actual human consent is established.\n" + instruction);
  return path;
}

test("plan remains inspectable when admitted source bytes need repair", async t => {
  const f = await fixture(t);
  await writeFile(f.source, "Changed source after admission");
  const preview = cli(f, "plan");
  assert.match(preview, /Evidence needs repair/);
  assert.match(preview, /source bytes differ from dossier/);
  assert.match(preview, /Cases and source traceability/);
  assert.match(preview, /Case A/);
  assert.match(preview, /A evidence unavailable/);
});

test("H1 human journey: withhold, revise, then approve the displayed implementation", async t => {
  const f = await fixture(t);
  const baseline = git(f.repos[0].path, "rev-parse", "HEAD");
  const bytes = await readFile(join(f.repos[0].path, "app.txt"));
  const original = cli(f, "status").plan_hash;
  const preview = cli(f, "plan");
  assert.match(preview, /Your next decision/);
  assert.match(preview, /approve this exact plan, request revisions, or withhold approval/);
  assert.match(preview, /New implementation waits for approval/);
  assert.match(preview, /PR publication, ticket edits, merging and deployment require their own authorization/);
  t.diagnostic("H1 visible decision: " + preview.split("## Your next decision\n\n")[1].split("\n\n## Cases")[0]);
  assert.equal(cli(f, "cursor").hook, "plan-approval");
  refused(f, "start", ["--unit", "A", "--owner", "agent"], /approve this exact plan/);

  const revised = structuredClone(f.plan);
  revised.cases[0].expected = "Preserve the user's selected filter after refresh";
  revised.units[0].acceptance = ["Selected filter remains after refresh"];
  await f.call("replan", revised);
  const current = cli(f, "status").plan_hash;
  assert.notEqual(current, original);
  assert.match(cli(f, "plan"), /Preserve the user's selected filter after refresh/);
  refused(f, "approve-plan", ["--hash", original, "--evidence", f.approval], /changed/);
  refused(f, "start", ["--unit", "A", "--owner", "agent"], /approve this exact plan/);
  assert.equal(git(f.repos[0].path, "rev-parse", "HEAD"), baseline);
  assert.equal(git(f.repos[0].path, "status", "--porcelain"), "");
  assert.deepEqual(await readFile(join(f.repos[0].path, "app.txt")), bytes);

  cli(f, "approve-plan", "--hash", current, "--evidence", await decision(f, "Approve the revised displayed implementation plan " + current));
  assert.match(cli(f, "plan"), /No new plan approval is needed for unchanged scope/);
  assert.equal(cli(f, "cursor").action, "start-unit");
  cli(f, "start", "--unit", "A", "--owner", "agent");
  assert.equal(cli(f, "cursor").action, "continue-writer");
});

test("H2 human journey: unanswered case stays visible while approved independent work proceeds", async t => {
  const f = await fixture(t, {blocked: true});
  f.plan.blockers[0].reason = "For B, should inactive rows be hidden as the ticket says, or visible as specification revision 3 says?";
  f.plan.blockers[0].unblock_when = "BA supplies a cited decision on inactive-row visibility";
  await f.call("replan", f.plan);
  const preview = cli(f, "plan");
  assert.match(preview, /should inactive rows be hidden as the ticket says, or visible as specification revision 3 says/);
  assert.match(preview, /Owner: BA/);
  assert.match(preview, /Unblock when: BA supplies a cited decision on inactive-row visibility/);
  assert.match(preview, /Units: B/);
  t.diagnostic("H2 visible blocker: " + preview.split("\n").find(line => line.startsWith("- ba-answer:")));
  const hash = cli(f, "status").plan_hash;
  cli(f, "approve-plan", "--hash", hash, "--evidence", await decision(f, "Approve the displayed plan; leave B blocked until BA supplies the cited answer. " + hash));
  refused(f, "start", ["--unit", "B", "--owner", "agent"], /blocked/);
  assert.deepEqual(cli(f, "status").ready_to_implement.map(unit => unit.id), ["A"]);
  cli(f, "start", "--unit", "A", "--owner", "agent");
  const publication = cli(f, "status").publication.find(row => row.repo === "be");
  assert.equal(publication.ready, false);
  assert.ok(publication.blocked_units.includes("B"));
});

test("H3 human journey: implementation approval and revised PR publication are separate decisions", async t => {
  const f = await fixture(t);
  const hash = cli(f, "status").plan_hash;
  cli(f, "approve-plan", "--hash", hash, "--evidence", await decision(f, "Approve displayed implementation " + hash));
  await f.implement("A");
  await f.implement("B");
  const verified = cli(f, "verify", "--repo", "be");
  const review = join(f.root, "synthetic-reviews.json");
  await writeFile(review, JSON.stringify({head: verified.head, reviews: ["standards", "specification"].map(axis => ({
    axis, reviewer: "Synthetic journey reviewer", verdict: "pass", report: f.source,
  }))}));
  cli(f, "review", "--repo", "be", "--file", review);
  assert.equal(cli(f, "cursor").action, "stage-publication");
  const payload = {
    repository_id: "fixture-be", action: "create", url: "https://example.invalid/prs",
    title: "Fix filtering for Work Item 100", description: "## What Happened\nPreserve filters.\n## Insight\nSynthetic fixture.\n## Proof of Works\nLocal fixture checks only.",
    head: verified.head, source_branch: f.repos[0].branch, target_branch: "develop", is_draft: true,
    work_item_ids: ["100", "101", "102"], attachments: [{path: f.source}],
  };
  const path = join(f.root, "publication-preview.json");
  await writeFile(path, JSON.stringify(payload));
  const first = cli(f, "stage-publication", "--repo", "be", "--file", path);
  assert.deepEqual(first.action, payload);
  assert.equal(cli(f, "cursor").hook, "publication-approval");
  refused(f, "approve-publication", ["--repo", "be", "--hash", hash, "--evidence", f.approval], /changed/);

  payload.description += "\nQA/SIT acceptance remains with QA.";
  await writeFile(path, JSON.stringify(payload));
  const revised = cli(f, "stage-publication", "--repo", "be", "--file", path);
  assert.notEqual(revised.approval_required, first.approval_required);
  assert.deepEqual(revised.action, payload);
  t.diagnostic("H3 revised publication shown for approval: " + JSON.stringify(revised.action));
  refused(f, "approve-publication", ["--repo", "be", "--hash", first.approval_required, "--evidence", f.approval], /changed/);
  assert.equal(cli(f, "cursor").hook, "publication-approval");

  const allowed = cli(f, "approve-publication", "--repo", "be", "--hash", revised.approval_required,
    "--evidence", await decision(f, "Publish this exact revised PR " + revised.approval_required));
  assert.deepEqual(allowed.action, payload);
  assert.match(allowed.instructions, /does not authorize ticket field edits, merges or deployment/);
  assert.equal(cli(f, "cursor").action, "check-new-blockers");
  assert.equal(cli(f, "cursor").action, "check-new-blockers");
  const snapshot = join(f.root, "simulated-forge-observation.json");
  await writeFile(snapshot, JSON.stringify({...payload, operation: "publish", observed_at: new Date().toISOString(),
    status: "absent", checks: [], comments: [], blockers: []}));
  cli(f, "check-action", "--repo", "be", "--file", snapshot);
  assert.equal(cli(f, "cursor").action, "execute-approved-action");
  const state = JSON.parse(await readFile(join(f.run, "delivery.json"), "utf8"));
  assert.equal(state.repos.be.publication.approval.hash, revised.approval_required);
  assert.equal(state.repos.be.published, undefined);
});

test("H4 human journey: admitted writer is not asked to renew approval to finish under design drift", async t => {
  for (const kind of ["manifest", "models"]) for (const mutation of ["changed", "missing"]) {
    const f = await fixture(t);
    await f.approve();
    cli(f, "start", "--unit", "A", "--owner", "agent");
    const path = f.plan.design[kind];
    if (mutation === "missing") await unlink(path);
    else await writeFile(path, (await readFile(path, "utf8")) + "\n");
    const preview = cli(f, "plan");
    assert.equal(cli(f, "status").approved, false);
    assert.match(preview, /No new approval is needed to finish or safely park that writer/);
    assert.match(preview, /reconcile changed inputs before starting new work/);
    const next = cli(f, "cursor");
    assert.equal(next.action, "continue-writer");
    assert.equal(next.units[0].owner, "agent");
  }
});


test("approval plan shows open corrections preserved work and legacy provenance", async t => {
  const f=await fixture(t,{legacy:true});
  await f.approve();await f.implement("A");
  const note=join(f.root,"correction.md");await writeFile(note,"A needs explicit coordinator reconciliation.");
  const correction=await f.call("alignmentNote",note,undefined,{case_ids:["A"]});
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  await new Delivery(f.run).replan(f.plan);
  const preview=cli(f,"plan");
  assert.match(preview,/Correction reconciliation/);
  assert.ok(preview.includes(correction.id));
  assert.match(preview,/Open cases: A/);
  assert.match(preview,/Preserved units: A, B/);
  assert.match(preview,/Reset units: none/);
  assert.match(preview,/Historical implementation has no investigation evidence/);
  await writeFile(join(f.run,"corrections.json"),"{bad");
  assert.match(cli(f,"plan"),/Correction registry needs repair/);
});

test("approval plan discloses actual origin when verified design panels are reused", async t => {
  const f=await fixture(t),run=(method,...args)=>new Delivery(f.run)[method](...args);
  const before=await run("load"),manifest=JSON.parse(await readFile(f.plan.design.manifest,"utf8"));
  const origin=join(f.root,"original-plan.json");await writeFile(origin,JSON.stringify(before.plan));
  const context=await run("designContext",before.plan);
  Object.assign(manifest,{schema:"work-item-delivery.design.v2",projection_version:2,design_hash:context.design_hash,
    origin_plan:{path:origin,sha256:sha(await readFile(origin))}});
  await writeFile(f.plan.design.manifest,JSON.stringify(manifest));
  f.plan.units[0].priority=2;
  await run("replan",f.plan);
  const preview=cli(f,"plan"),current=await run("load");
  assert.ok(preview.includes("Current design input hash: "+current.design_receipt.plan_hash));
  assert.ok(preview.includes("Original design input hash: "+manifest.plan_hash));
  assert.match(preview,/Design review: reused verified original panels/);
  assert.ok(preview.includes("Projected design hash: "+context.design_hash));
});
