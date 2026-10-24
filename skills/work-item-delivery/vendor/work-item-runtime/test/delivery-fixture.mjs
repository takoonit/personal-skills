import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Delivery } from "../lib/delivery.mjs";
import { unitInputHash, repositoryIdentity } from "../lib/delivery-common.mjs";
import { admitFixture } from "./investigation-fixture.mjs";

function git(path, ...args) {
  return execFileSync("git", ["-C", path, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function fixture(
  t,
  { blocked = false, twoRepos = false, failing = false, legacy = false, uninitialized = false } = {},
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
  const call = async (method, ...args) => {
    const delivery = new Delivery(run);
    if (method === "replan" && !legacy) await admitFixture(delivery,args[0],root);
    return delivery[method](...args);
  };
  let initialized;
  if (!uninitialized) {
    if (legacy) {
      await mkdir(run);
      const delivery = new Delivery(run), plan_hash = await delivery.fingerprint(plan);
      const state = {
        schema:"work-item-delivery.run.v1",plan,plan_hash,approval:null,
        unit_inputs:Object.fromEntries(await Promise.all(plan.units.map(async u=>[u.id,await unitInputHash(plan,u)]))),
        units:Object.fromEntries(plan.units.map(u=>[u.id,{state:"pending"}])),
        repos:Object.fromEntries(plan.repositories.map(r=>[r.id,{path:r.path,baseline:r.base_sha,identity:repositoryIdentity(r.path)}])),
        blockers:plan.blockers.map(b=>({...b,resolved:false})),captures:[],events:[{type:"initialized",at:"2026-01-01T00:00:00.000Z"}],
      };
      await writeFile(join(run,"delivery.json"),JSON.stringify(state));
      initialized = {plan_hash};
    } else {
      await admitFixture(new Delivery(run),plan,root);
      initialized = await call("init",plan);
    }
  }
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

async function actionFiles(f, operation = "approve-and-merge") {
  const repo = f.repos[0];
  const request = {
    operation, repository_id: "repo-be", head: git(repo.path, "rev-parse", "HEAD"),
    source_branch: repo.branch, target_branch: "develop",
    ...(operation === "approve-and-merge" ? { pr_url: "https://example.invalid/pr/100" } : {}),
    ...(operation === "publish" ? {
      action: "create", title: "Fix100", description: "Reviewed copy", work_item_ids: ["100"],
    } : {}),
  };
  const file = join(f.root, "action.json");
  await writeFile(file, JSON.stringify(request));
  let sequence = 0;
  const observe = async (extra = {}) => {
    const snapshot = join(f.root, "preflight-" + sequence++ + ".json");
    await writeFile(snapshot, JSON.stringify({
      ...request, observed_at: new Date().toISOString(), status: "active",
      mergeable: true, checks: [], comments: [], blockers: [], ...extra,
    }));
    return f.call("checkAction", "be", snapshot);
  };
  return { request, file, observe };
}

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

export { git, fixture, actionFiles, uiFixture, approveCurrent, reviewedFixture, publicationFixture };
