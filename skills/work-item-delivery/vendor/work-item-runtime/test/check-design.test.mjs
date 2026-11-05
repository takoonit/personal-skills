import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, readdir, stat, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { Delivery } from "../lib/delivery.mjs";
import { checkDesign } from "../scripts/check-design.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const pair = row => sha(JSON.stringify({sketch:row.sketch.sha256,rationale:row.rationale.sha256}));
const script = new URL("../scripts/check-design.mjs", import.meta.url).pathname;

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "design-check-"));
  t.after(() => rm(root, {recursive:true,force:true}));
  const models = join(root,"models.md"), planFile = join(root,"plan.json"), file = join(root,"review.json");
  await writeFile(models,"architect runners: model-a @high, model-b, model-c\narena cross-judge pool: model-b, model-c\ninterrogate reviewers: model-a, model-b, model-c\n");
  const source = join(root,"source.txt");
  await writeFile(source,"Synthetic fixture requirements; never human approval.");
  const plan = {schema:"work-item-delivery.plan.v2",sources:[{id:"fixture",status:"read",snapshot:source}],repositories:[]};
  await writeFile(planFile,JSON.stringify(plan));
  const context = {plan_hash:await new Delivery(root).fingerprint(plan),models_sha256:sha(await readFile(models))};
  const artifact = async name => {
    await writeFile(join(root,name),"Synthetic evidence for " + name);
    return {path:name,sha256:sha(await readFile(join(root,name)))};
  };
  const candidates = [];
  for (const [index,model] of ["model-a","model-b","model-c"].entries()) candidates.push({
    seat:`architect-${index+1}`,model,...context,shape:index===1?"plan-input":"ledger",
    sketch:await artifact(`candidate-${index}.md`),rationale:await artifact(`candidate-rationale-${index}.md`),
  });
  const selected = {base_seat:"architect-1",sketch:await artifact("selected.md"),rationale:await artifact("rationale.md")};
  const subject = pair(selected);
  const reviewers = [];
  for (const [index,model] of ["model-a","model-b","model-c"].entries()) reviewers.push({
    seat:`reviewer-${index+1}`,model,...context,outcome:"completed",subject_sha256:subject,
    report:await artifact(`report-${index}.md`),findings:index===0?[{id:"R1",summary:"Fixture caveat"}]:[],
  });
  const manifest = {schema:"work-item-delivery.design.v1",...context,architect:{grounding:[await artifact("how.md")],candidates,
    cross_judge:{model:"model-b",...context,report:await artifact("judge.md"),candidates:candidates.map(row=>({seat:row.seat,digest:pair(row)}))},selected},
    interrogate:{subject_sha256:subject,reviewers,judgment:await artifact("lead.md"),findings:[{reviewer:"reviewer-1",finding:"R1",bucket:"Noted",rationale:"Fixture already explains its limit"}]}};
  const save = () => writeFile(file,JSON.stringify(manifest));
  await save();
  return {root,models,planFile,file,source,plan,manifest,context,subject,save,
    check:async()=>{await save();return checkDesign(planFile,file,models);}};
}

test("design checker validates expected hashes and real CLI is read-only and repeatable", async t => {
  const f = await fixture(t);
  const before = {};
  for (const name of await readdir(f.root)) before[name] = [(await readFile(join(f.root,name))).toString("hex"),(await stat(join(f.root,name))).mtimeMs];
  const expected = {status:"DESIGN_CHECKED",...f.context,subject_sha256:f.subject};
  assert.deepEqual(await checkDesign(f.planFile,f.file,f.models),expected);
  for (let run=0;run<2;run++) {
    const result = spawnSync(process.execPath,[script,"--plan",f.planFile,"--file",f.file,"--models",f.models],{encoding:"utf8"});
    assert.equal(result.status,0,result.stderr);
    assert.deepEqual(JSON.parse(result.stdout),expected);
  }
  const after = {};
  for (const name of await readdir(f.root)) after[name] = [(await readFile(join(f.root,name))).toString("hex"),(await stat(join(f.root,name))).mtimeMs];
  assert.deepEqual(after,before);
});

test("design checker detects corruption or deletion of every claimed evidence artifact", async t => {
  const f = await fixture(t);
  const paths = (await readdir(f.root)).filter(name=>name.endsWith(".md")&&name!=="models.md");
  for (const name of paths) {
    const path = join(f.root,name), original = await readFile(path);
    await writeFile(path,"corruption");
    await assert.rejects(f.check(),/artifact bytes changed/);
    await unlink(path);
    await assert.rejects(f.check(),/ENOENT/);
    await writeFile(path,original);
  }
});

test("design checker rejects changed inputs even when only wrapper hashes are refreshed", async t => {
  const f = await fixture(t);
  await writeFile(f.source,"Changed requirement at the same source path");
  await assert.rejects(f.check(),/stale plan/);
  f.manifest.plan_hash = await new Delivery(f.root).fingerprint(f.plan);
  await assert.rejects(f.check(),/architect-1: stale/);
  for (const row of f.manifest.architect.candidates) row.plan_hash=f.manifest.plan_hash;
  f.manifest.architect.cross_judge.plan_hash=f.manifest.plan_hash;
  await assert.rejects(f.check(),/reviewer-1: stale/);
  await writeFile(f.models,(await readFile(f.models,"utf8"))+"\ndefault effort: high\n");
  await assert.rejects(f.check(),/Manifest: stale/);
});

test("design checker rejects missing duplicate and altered configured seats", async t => {
  const f = await fixture(t), original=structuredClone(f.manifest);
  for (const mutate of [
    m=>m.architect.candidates.pop(),
    m=>m.architect.candidates[1].seat="architect-1",
    m=>m.architect.candidates[0].model="other",
    m=>m.interrogate.reviewers.pop(),
    m=>m.interrogate.reviewers[1].seat="reviewer-1",
    m=>m.interrogate.reviewers[0].model="other",
  ]) {
    Object.assign(f.manifest,structuredClone(original));mutate(f.manifest);
    await assert.rejects(f.check(),/configured seat|duplicate|incomplete list/);
  }
});

test("design checker rejects collapsed alternatives wrong judges and mismatched subjects", async t => {
  const f = await fixture(t), original=structuredClone(f.manifest);
  for (const [mutate,pattern] of [
    [m=>m.architect.candidates.forEach(row=>row.shape="same"),/distinct/],
    [m=>m.architect.cross_judge.model="outside",/outside/],
    [m=>m.architect.cross_judge.candidates[0].digest="bad",/exact candidate/],
    [m=>m.architect.cross_judge.candidates.reverse(),null],
    [m=>m.architect.selected.base_seat="missing",/Selected base/],
    [m=>m.interrogate.subject_sha256="bad",/Interrogate subject/],
    [m=>m.interrogate.reviewers[0].subject_sha256="bad",/wrong subject/],
    [m=>m.interrogate.reviewers[0].outcome="failed",/incomplete/],
    [m=>m.interrogate.reviewers[1].report=m.interrogate.reviewers[0].report,/report paths: duplicate/],
    [m=>m.architect.candidates[1].sketch=m.architect.candidates[0].sketch,/sketch paths: duplicate/],
  ]) {
    Object.assign(f.manifest,structuredClone(original));mutate(f.manifest);
    if (pattern) await assert.rejects(f.check(),pattern); else await f.check();
  }
});

test("design checker requires every declared finding to retain exactly one valid disposition", async t => {
  const f = await fixture(t), original=structuredClone(f.manifest);
  for (const mutate of [
    m=>m.interrogate.findings=[],
    m=>m.interrogate.findings.push(m.interrogate.findings[0]),
    m=>m.interrogate.findings[0].reviewer="unknown",
    m=>m.interrogate.findings[0].finding="unknown",
    m=>m.interrogate.findings[0].rationale="",
    m=>m.interrogate.findings[0].bucket="resolved",
    m=>{m.interrogate.findings[0].bucket="Act On";m.interrogate.findings[0].resolved=true;},
  ]) {
    Object.assign(f.manifest,structuredClone(original));mutate(f.manifest);
    await assert.rejects(f.check(),/disposition|bucket|Act On/);
  }
});

test("design checker refuses ambiguous configuration empty artifacts and missing CLI inputs", async t => {
  const f = await fixture(t);
  const original = await readFile(f.models);
  await writeFile(f.models,original+"\narchitect runners: model-a, model-b\n");
  await assert.rejects(f.check(),/unambiguous/);
  await writeFile(f.models,original.toString().replace("model-a @high","auto"));
  await assert.rejects(f.check(),/resolve model aliases/);
  await writeFile(f.models,original);
  await writeFile(join(f.root,"judge.md"),"");
  await assert.rejects(f.check(),/empty artifact/);
  for (const args of [[],["--plan",f.planFile,"--file",join(f.root,"absent"),"--models",f.models]]) {
    const result=spawnSync(process.execPath,[script,...args],{encoding:"utf8"});
    assert.equal(result.status,1);
    assert.match(result.stderr,/INCOMPLETE/);
  }
});

test("projected design reuses a verified origin for enumerated operational changes",async t=>{
  const f=await fixture(t),run=new Delivery(f.root);
  const origin=join(f.root,"origin-plan.json");
  await writeFile(origin,JSON.stringify(f.plan));
  const context=await run.designContext(f.plan);
  f.manifest.schema="work-item-delivery.design.v2";
  f.manifest.origin_plan={path:origin,sha256:sha(await readFile(origin))};
  f.manifest.projection_version=context.projection_version;
  f.manifest.design_hash=context.design_hash;
  const oldStages=JSON.stringify(f.manifest.architect);
  f.plan.policy={branch_prefix:"codex/"};
  await writeFile(f.planFile,JSON.stringify(f.plan));
  const checked=await f.check();
  assert.equal(checked.origin_plan_hash,f.context.plan_hash);
  assert.equal(checked.reused,true);
  assert.equal(JSON.stringify(f.manifest.architect),oldStages);
  f.plan.acceptance=["New substantive acceptance"];
  await writeFile(f.planFile,JSON.stringify(f.plan));
  await assert.rejects(f.check(),/design.*context|projection/i);
});

test("projected design cannot reuse changed sources configuration or original stage hashes",async t=>{
  const f=await fixture(t),run=new Delivery(f.root);
  const origin=join(f.root,"origin-plan.json");
  await writeFile(origin,JSON.stringify(f.plan));
  Object.assign(f.manifest,{schema:"work-item-delivery.design.v2",origin_plan:{path:origin,sha256:sha(await readFile(origin))}},await run.designContext(f.plan));
  await f.check();
  const original=await readFile(f.source);
  await writeFile(f.source,"Changed bytes");
  await assert.rejects(f.check(),/stale|projection/);
  await writeFile(f.source,original);
  f.manifest.architect.candidates[0].plan_hash="0".repeat(64);
  await assert.rejects(f.check(),/architect-1: stale/);
});

test("design projection enumerates neutral fields and retains unknown baseline and acceptance fields",async t=>{
  const f=await fixture(t),run=new Delivery(f.root);
  f.plan.repositories=[{id:"repo",path:"/original",branch:"old",base_sha:"baseline"}];
  f.plan.policy={branch_prefix:"old/"};
  f.plan.design={manifest:"old.json",models:"old.md"};
  f.plan.units=[{id:"A",priority:1,checks:[{id:"check",argv:["node","test"],timeout_ms:100}],acceptance:["Works"]}];
  const original=await run.designContext(f.plan);
  f.plan.repositories[0].branch="new";
  f.plan.policy.branch_prefix="new/";
  f.plan.design={manifest:"new.json",models:"new.md"};
  f.plan.units[0].priority=9; f.plan.units[0].checks[0].timeout_ms=200;
  const neutral=await run.designContext(f.plan);
  assert.equal(neutral.design_hash,original.design_hash);
  assert.notEqual(neutral.plan_hash,original.plan_hash);
  for(const mutate of [
    plan=>plan.repositories[0].path="/different",
    plan=>plan.repositories[0].base_sha="new-baseline",
    plan=>plan.units[0].acceptance.push("New acceptance"),
    plan=>plan.units[0].unrecognized="substantive",
    plan=>plan.design.unrecognized="substantive",
    plan=>plan.policy.unrecognized="substantive",
  ]) {
    const plan=structuredClone(f.plan);mutate(plan);
    assert.notEqual((await run.designContext(plan)).design_hash,neutral.design_hash);
  }
});

test("projected reuse still validates original bytes models and every artifact",async t=>{
  const f=await fixture(t),run=new Delivery(f.root),origin=join(f.root,"origin-plan.json");
  await writeFile(origin,JSON.stringify(f.plan));
  Object.assign(f.manifest,{schema:"work-item-delivery.design.v2",origin_plan:{path:origin,sha256:sha(await readFile(origin))}},await run.designContext(f.plan));
  await f.check();
  for(const path of [origin,join(f.root,"selected.md"),join(f.root,"judge.md"),f.models]){
    const original=await readFile(path);
    await writeFile(path,original+"\nchanged");
    await assert.rejects(f.check(),/artifact bytes changed|stale/);
    await writeFile(path,original);
  }
});
