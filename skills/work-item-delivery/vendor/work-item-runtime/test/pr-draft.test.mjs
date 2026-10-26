import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Delivery } from "../lib/delivery.mjs";
import { fixture, git } from "./delivery-fixture.mjs";

const cliPath = new URL("../bin/wid.mjs", import.meta.url).pathname;
const cli = (run, repo) => JSON.parse(execFileSync(process.execPath, [cliPath, "pr-draft", "--run", run, "--repo", repo], {encoding: "utf8"}));

test("working PR draft starts before a plan and resume preserves fresh prose and evidence targets", async t => {
  const root = await mkdtemp(join(tmpdir(), "pr-draft-test-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const run = join(root, "run");
  const first = cli(run, "be");
  assert.equal(first.created, true);
  assert.equal(first.path, join(run, "pr-drafts", "be", "PR.md"));
  assert.deepEqual(first.content.match(/^## .+$/gm), ["## What Happened", "## Insight", "## Proof of Works"]);
  for (const field of ["Role/setup", "Actions", "Expected", "Before", "After"])
    assert.ok(first.content.includes(`**${field}.**`), field);
  assert.match(first.content, /Before\.\*\* Not run\. \[Planned full capture/);
  assert.match(first.content, /After\.\*\* Not run\. \[Planned full capture/);
  assert.match(first.content, /\[Full-size before\]\(attachment:before-full\.png\)/);
  assert.match(first.content, /\[Full-size after\]\(attachment:after-full\.png\)/);
  assert.ok(first.content.indexOf("![Before:") < first.content.indexOf("![After:"));
  assert.ok(first.content.indexOf("![After:") < first.content.indexOf("Supporting automated checks"));
  await assert.rejects(access(join(run, "delivery.json")), {code: "ENOENT"});

  const intake = "## What Happened\n\nWI 75877: HR opens Year for an employee with adjustments only in 2026; unrelated years appear.\n\n";
  const insight = "## Insight\n\nInvestigating whether choices come from the creation window rather than employee history.\n\n";
  const recipe = "## Proof of Works\n\nNot run. Open that employee's Adjustment History and Year. Expected: only 2026. Collect before/after dropdown screenshots showing all choices and the matching adjustment rows.\n";
  await writeFile(first.path, intake + insight + recipe);
  const before = await stat(first.path);
  const reopened = cli(run, "be");
  assert.equal(reopened.created, false);
  assert.equal(reopened.content, intake + insight + recipe);
  assert.equal((await stat(first.path)).mtimeMs, before.mtimeMs);

  const recorded = recipe + "\nObserved before: 2024, 2025, 2026, 2027. After: not run. Evidence: before-year.png (authored scenario fixture, no product UI executed).\n";
  await writeFile(first.path, intake + insight + recorded);
  assert.equal(cli(run, "be").content, intake + insight + recorded);
  const sibling = cli(run, "fe");
  assert.notEqual(sibling.path, first.path);
  assert.equal(cli(run, "be").content, intake + insight + recorded);
});

test("writer brief points to coordinator-owned PR draft without changing approval or source", async t => {
  const f = await fixture(t);
  await f.approve();
  const ledger = await readFile(join(f.run, "delivery.json"));
  const head = git(f.repos[0].path, "rev-parse", "HEAD");
  const draft = cli(f.run, "be");
  await writeFile(draft.path, "## What Happened\nKnown case.\n## Insight\nSupported cause.\n## Proof of Works\nNot run; capture the dropdown and result.\n");
  cli(f.run, "be");
  assert.deepEqual(await readFile(join(f.run, "delivery.json")), ledger);
  assert.equal(git(f.repos[0].path, "rev-parse", "HEAD"), head);
  assert.equal(git(f.repos[0].path, "status", "--porcelain"), "");
  const brief = await f.call("start", "A", "writer");
  assert.equal(brief.pr_draft.path, draft.path);
  assert.equal(brief.pr_draft.owner, "coordinator");
  assert.match(brief.pr_draft.instruction, /before gathering evidence/);
  assert.match(brief.pr_draft.instruction, /without replacing sibling cases/);
  await assert.rejects(f.call("prDraft", "unknown"), /unknown repo/);
});

test("working PR draft refuses redirected paths and concurrent opens preserve one draft", async t => {
  const root = await mkdtemp(join(tmpdir(), "pr-draft-paths-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const run = join(root, "run");
  const results = await Promise.all([new Delivery(run).prDraft("be"), new Delivery(run).prDraft("be")]);
  assert.equal(results.filter(row => row.created).length, 1);
  assert.equal(results[0].sha256, results[1].sha256);
  await assert.rejects(new Delivery(run).prDraft("../outside"), /invalid id/);
  const outside = join(root, "outside.md");
  await writeFile(outside, "Keep original text");
  await rm(results[0].path);
  await symlink(outside, results[0].path);
  await assert.rejects(new Delivery(run).prDraft("be"), /regular file/);
  assert.equal(await readFile(outside, "utf8"), "Keep original text");
  const folder = join(root, "outside-folder");
  await mkdir(folder);
  await symlink(folder, join(run, "pr-drafts", "fe"));
  await assert.rejects(new Delivery(run).prDraft("fe"), /real directory/);
  await assert.rejects(access(join(folder, "PR.md")), {code: "ENOENT"});
});
