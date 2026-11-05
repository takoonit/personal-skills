import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Delivery } from "../lib/delivery.mjs";
import { sha } from "../lib/delivery-common.mjs";
import { nextCursorAction } from "../lib/cursor-workflow.mjs";
import { fixture, actionFiles, git } from "./delivery-fixture.mjs";
import { definitionFixture, reportFixture, designFixture, admitFixture } from "./investigation-fixture.mjs";

const cliPath=new URL("../bin/wid.mjs",import.meta.url).pathname;
const read=async path=>JSON.parse(await readFile(path,"utf8"));
const write=async(path,value)=>{await writeFile(path,JSON.stringify(value));return path;};
const raw=f=>(method,...args)=>new Delivery(f.run)[method](...args);
const cli=(f,command,...args)=>JSON.parse(execFileSync(process.execPath,[cliPath,command,"--run",f.run,...args],{encoding:"utf8"}));

import { preparation } from "./investigation-flow-fixture.mjs";

test("design bytes bind approval and new writers without preventing active writer completion",async t=>{
  const f=await fixture(t),call=raw(f);await f.approve();
  await call("start","A","owner");
  await writeFile(join(f.root,"selected.md"),"changed selected design");
  await call("finish","A","owner",f.source);
  await assert.rejects(call("start","B","owner"),/artifact bytes changed/);
  await assert.rejects(call("approvePlan",(await call("load")).plan_hash,f.approval),/artifact bytes changed/);
});

test("fresh legacy init is refused; persisted v2 actions and same-input continuation retain authorization",async t=>{
  const fresh=await fixture(t,{uninitialized:true});
  for(const schema of ["work-item-delivery.plan.v1","work-item-delivery.plan.v2"]){
    fresh.plan.schema=schema;
    await assert.rejects(raw(fresh)("init",fresh.plan),/requires v3 investigation admission/);
  }
  const f=await fixture(t,{legacy:true}),call=raw(f);await f.approve();
  const before=await call("load");
  assert.equal((await call("replan",f.plan)).unchanged,true);
  assert.deepEqual((await call("load")).approval,before.approval);
  f.plan.units[0].change="changed material scope";
  await assert.rejects(call("replan",f.plan),/requires v3 investigation admission/);
  const a=await actionFiles(f);await call("approveAction","be",a.file,f.approval);
  const d=definitionFixture(f.plan);
  await call("investigate",d);
  assert.equal(nextCursorAction(await call("status")).action,"check-new-blockers");
  await a.observe();
  assert.equal(nextCursorAction(await call("status")).action,"execute-approved-action");
});

test("persisted v1 active writer finishes without new dossier or design receipts",async t=>{
  const f=await fixture(t,{legacy:true}),call=raw(f);
  const state=await call("load");state.plan.schema="work-item-delivery.plan.v1";
  state.plan_hash=await new Delivery(f.run).fingerprint(state.plan);
  state.approval={hash:state.plan_hash,path:f.approval,sha256:sha(await readFile(f.approval))};
  state.units.A={state:"active",owner:"pre-feature-owner",start_head:git(f.repos[0].path,"rev-parse","HEAD")};
  await write(join(f.run,"delivery.json"),state);
  assert.equal(nextCursorAction(await call("status")).action,"continue-writer");
  assert.equal((await call("finish","A","pre-feature-owner",f.source)).state,"implemented");
  assert.equal((await call("load")).plan.schema,"work-item-delivery.plan.v1");
  await assert.rejects(readFile(join(f.run,"investigation.json")),/ENOENT/);
});

test("revision-only source refresh invalidates consumers after adoption and preserves independent implementation",async t=>{
  const f=await fixture(t,{twoRepos:true}),call=raw(f);
  f.plan.units.forEach(u=>u.source_refs=u.id==="A"?["ticket","spec"]:["ticket"]);
  f.plan.cases.forEach(c=>c.source_refs=c.id==="A"?["ticket","spec"]:["ticket"]);
  f.plan.knowledge.business_flows[0].steps[0].source_refs=["ticket","business"];
  await f.call("replan",f.plan);await f.call("approvePlan",(await call("status")).plan_hash,f.approval);
  await f.implement("A");await f.implement("C");
  f.plan.sources.find(s=>s.id==="spec").revision="new-revision-same-bytes";
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  assert.equal((await call("load")).units.A.state,"implemented");
  await call("replan",f.plan);
  assert.equal((await call("load")).units.A.state,"pending");
  assert.equal((await call("load")).units.C.state,"implemented");
});

test("concurrent imports serialize and source revision clears challenge without losing unrelated report",async t=>{
  const f=await fixture(t,{uninitialized:true}),call=raw(f),d=definitionFixture(f.plan);
  await call("investigate",d);
  const files=await Promise.all(f.plan.units.map(async u=>{
    const brief=await call("investigationBrief",u.id);
    return [u.id,await write(join(f.root,u.id+".json"),reportFixture(brief,u))];
  }));
  await Promise.all(files.map(([task,file])=>call("investigationReport",task,file)));
  const before=await read(join(f.run,"investigation.json"));
  const cb=await call("investigationBrief","challenge");
  const challenge=await write(join(f.root,"challenge.json"),{task:"challenge",input_hash:cb.input_hash,challenges:[],artifacts:[]});
  await call("investigationReport","challenge",challenge);
  d.expected_revision=before.revision;d.tasks[0].revision="second-question";
  await call("investigate",d);
  const revised=await read(join(f.run,"investigation.json"));
  assert.deepEqual(revised.reports.B,before.reports.B);
  assert.equal(revised.challenge,undefined);
  await assert.rejects(call("investigationBrief","challenge"),/reports incomplete/);
  const a=await call("investigationBrief","A");
  await call("investigationReport","A",await write(files[0][1],reportFixture(a,f.plan.units[0])));
  await assert.rejects(call("investigationReport","challenge",challenge),/stale report/);
});

test("explicit challenge waiver is recorded and missing required challenge cannot arbitrate",async t=>{
  const f=await fixture(t,{uninitialized:true}),call=raw(f),d=definitionFixture(f.plan);
  await call("investigate",d);
  for(const u of f.plan.units){
    const brief=await call("investigationBrief",u.id);
    await call("investigationReport",u.id,await write(join(f.root,u.id+".json"),reportFixture(brief,u)));
  }
  await assert.rejects(call("investigationBrief","arbitration"),/challenge report required/);
  d.expected_revision=1;d.challenge={required:false,reason:"Synthetic narrow source lookup with explicit reduced assurance."};
  await call("investigate",d);
  assert.equal((await call("investigationBrief","arbitration")).bundle.waiver,d.challenge.reason);
});

test("changed design manifest bytes renew the approval hash even with unchanged semantic plan",async t=>{
  const f=await fixture(t),call=raw(f);await f.approve();
  const before=await call("load");
  await writeFile(f.plan.design.manifest,(await readFile(f.plan.design.manifest,"utf8"))+"\n");
  assert.equal((await call("status")).approved,false);
  const result=await call("replan",f.plan);
  assert.notEqual(result.approval_required,before.plan_hash);
  await call("approvePlan",result.approval_required,f.approval);
  assert.equal((await call("status")).approved,true);
});

test("legacy sealed scope refuses migration without altering published receipts",async t=>{
  const {publicationFixture}=await import("./delivery-fixture.mjs");
  const f=await fixture(t,{legacy:true}),call=raw(f);await f.approve();
  await f.implement("A");await f.implement("B");await publicationFixture(f,"be");
  const before=await readFile(join(f.run,"delivery.json"));
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  await assert.rejects(call("replan",f.plan),/published case\/source scope is immutable/);
  assert.deepEqual(await readFile(join(f.run,"delivery.json")),before);
});


for (const kind of ["manifest", "models"]) for (const mutation of ["changed", "missing"]) {
  test(`active writer completes with ${mutation} design ${kind} but new gates hold`,async t=>{
    const f=await fixture(t),call=raw(f);await f.approve();
    await call("start","A","owner");
    if(mutation==="missing") await unlink(f.plan.design[kind]);
    else await writeFile(f.plan.design[kind],(await readFile(f.plan.design[kind],"utf8"))+"\n");
    assert.equal(nextCursorAction(await call("status")).action,"continue-writer");
    await assert.rejects(call("finish","A","wrong-owner",f.source),/owned by this writer/);
    await call("finish","A","owner",f.source);
    await assert.rejects(call("start","B","owner"));
    await assert.rejects(call("approvePlan",(await call("load")).plan_hash,f.approval));
  });
}

test("completion under design drift still enforces source, scope and admitted evidence",async t=>{
  const f=await fixture(t),call=raw(f);await f.approve();await call("start","A","owner");
  await unlink(f.plan.design.manifest);
  const source=await readFile(f.source);
  await writeFile(f.source,"changed source");
  await assert.rejects(call("finish","A","owner",f.approval),/approve this exact plan/);
  await writeFile(f.source,source);
  const state=await call("load"),path=join(f.run,"delivery.json");
  const altered=structuredClone(state);altered.plan.units[0].allowed_paths.push("other.txt");
  await write(path,altered);
  await assert.rejects(call("finish","A","owner",f.approval),/approve this exact plan/);
  await write(path,state);
  const blob=join(f.run,"evidence","sha256",state.plan.admission.dossier.sha256),bytes=await readFile(blob);
  await writeFile(blob,"corrupted");
  await assert.rejects(call("finish","A","owner",f.approval),/immutable evidence bytes changed/);
  await writeFile(blob,bytes);
  await writeFile(join(f.repos[0].path,"other.txt"),"out of scope");
  git(f.repos[0].path,"add",".");git(f.repos[0].path,"commit","-m","outside scope");
  await assert.rejects(call("finish","A","owner",f.approval),/beyond owned paths/);
});

test("dossier-only projections hold missing and corrupt completed evidence without changing state",async t=>{
  const f=await preparation(t);await f.reconcile();
  const manifest=await read(join(f.run,"investigation.json"));
  const dossier=await read(join(f.run,"evidence","sha256",manifest.dossier.sha256));
  const targets=[manifest.definition,dossier.definition.sources[0].blob,manifest.reports.A,
    dossier.bundle.reports[0].report.raw,manifest.challenge,dossier.bundle.challenge.report.raw,
    dossier.arbitration.raw,manifest.dossier];
  const before=await readFile(join(f.run,"investigation.json"));
  for(const ref of targets) for(const mutation of ["corrupt","missing"]){
    const path=join(f.run,"evidence","sha256",ref.sha256),bytes=await readFile(path);
    if(mutation==="missing") await unlink(path);else await writeFile(path,"corrupted");
    const status=await f.call("status");
    assert.equal(status.investigation.phase,"integrity-hold",`${mutation} ${ref.sha256}`);
    assert.equal(nextCursorAction(status).action,"blocked");
    assert.deepEqual(await readFile(join(f.run,"investigation.json")),before);
    await writeFile(path,bytes);
  }
  assert.equal((await f.call("status")).investigation.phase,"plan-ready");
});

test("partial investigation projections verify collected report, raw and artifact bytes",async t=>{
  const f=await fixture(t,{uninitialized:true}),call=raw(f);
  await call("investigate",definitionFixture(f.plan));
  const brief=await call("investigationBrief","A"),report=reportFixture(brief,f.plan.units[0]);
  const artifact=join(f.root,"observation.txt");await writeFile(artifact,"observed fixture");
  report.artifacts=[{id:"observation",path:artifact}];
  await call("investigationReport","A",await write(join(f.root,"partial-report.json"),report));
  const m=await read(join(f.run,"investigation.json"));
  const stored=await read(join(f.run,"evidence","sha256",m.reports.A.sha256));
  for(const ref of [m.reports.A,stored.raw,stored.artifacts[0].blob]) for(const mutation of ["corrupt","missing"]){
    const path=join(f.run,"evidence","sha256",ref.sha256),bytes=await readFile(path);
    if(mutation==="missing")await unlink(path);else await writeFile(path,"corrupted");
    assert.equal((await call("status")).investigation.phase,"integrity-hold");
    await writeFile(path,bytes);
  }
  assert.deepEqual((await call("status")).investigation.pending_tasks,["B"]);
});

function unavailableSpec(plan) {
  Object.assign(plan.sources.find(s=>s.id==="spec"),{status:"unavailable",reason:"Access denied"});
  delete plan.sources.find(s=>s.id==="spec").snapshot;
  Object.assign(plan.knowledge.confluence,{status:"gap",gap:"Access denied"});
  plan.units.forEach(u=>u.source_refs=["ticket"]);
  plan.cases.forEach(c=>c.source_refs=["ticket"]);
  plan.knowledge.business_flows[0].steps[0].source_refs=["ticket","business"];
}

test("transitive inference premises require source coverage and block unavailable consumers",async t=>{
  const f=await fixture(t,{uninitialized:true}),call=raw(f);unavailableSpec(f.plan);
  const d=definitionFixture(f.plan);d.tasks[0].source_refs.push("spec");
  await call("investigate",d);
  for(const u of f.plan.units){
    const brief=await call("investigationBrief",u.id),report=reportFixture(brief,u);
    if(u.id==="A") {
      report.claims[0].basis="inferred";report.claims[0].premises=["middle"];
      report.claims.push({...report.claims[0],id:"middle",premises:["premise"]},
        {...report.claims[0],id:"premise",basis:"source-supported",premises:[],source_refs:["spec"]});
    }
    await call("investigationReport",u.id,await write(join(f.root,u.id+".json"),report));
  }
  const cb=await call("investigationBrief","challenge");
  await call("investigationReport","challenge",await write(join(f.root,"challenge.json"),{task:"challenge",input_hash:cb.input_hash,artifacts:[],challenges:[]}));
  const ab=await call("investigationBrief","arbitration");
  const bindings=f.plan.units.map(u=>{
    u.investigation={claim_ids:[u.id+"/finding"]};
    return {unit:u.id,...u.investigation,...Object.fromEntries(["case_ids","source_refs","finding","finding_status","acceptance"].map(k=>[k,u[k]])),cases:f.plan.cases.filter(c=>u.case_ids.includes(c.id))};
  });
  const a={input_hash:ab.input_hash,claims:ab.bundle.reports.flatMap(row=>row.report.claims.map(c=>({id:row.task+"/"+c.id,status:"accepted",rationale:"Synthetic accepted premise."}))),gaps:[],challenges:[],bindings};
  const file=join(f.root,"arbitration.json");
  await assert.rejects(call("arbitrate",await write(file,a)),/binding omits claim source/);
  f.plan.units[0].source_refs.push("spec");
  const result=await call("arbitrate",await write(file,a));
  f.plan.schema="work-item-delivery.plan.v3";f.plan.admission={dossier:result.dossier};
  await designFixture(new Delivery(f.run),f.plan,f.root);
  await assert.rejects(call("init",f.plan),/unavailable\/conflicted source must block/);
  f.plan.blockers=[{id:"missing-spec",units:["A"],reason:"Access denied",owner:"BA",unblock_when:"Read authority",source_refs:["spec"]}];
  await designFixture(new Delivery(f.run),f.plan,f.root);
  const initialized=await call("init",f.plan);await call("approvePlan",initialized.plan_hash,f.approval);
  await assert.rejects(call("start","A","owner"),/blocked/);
  assert.deepEqual((await call("status")).ready_to_implement.map(u=>u.id),["B"]);
  const evidence=await new Delivery(f.run).investigationEvidence(f.plan,f.plan.units[0]);
  assert.deepEqual(evidence.claims.map(c=>c.id),["A/premise","A/middle","A/finding"]);
  assert.equal(evidence.sources.find(s=>s.id==="spec").status,"unavailable");
  await call("start","B","owner");
});

test("source blockers need actual source reconciliation while execution blockers still resolve",async t=>{
  const f=await fixture(t,{uninitialized:true}),call=raw(f);unavailableSpec(f.plan);
  f.plan.units[0].source_refs.push("spec");
  f.plan.blockers=[{id:"missing-spec",units:["A"],reason:"Access denied",owner:"BA",unblock_when:"Read authority",source_refs:["spec"]}];
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const initialized=await call("init",f.plan);await call("approvePlan",initialized.plan_hash,f.approval);
  await assert.rejects(call("unblock","missing-spec",f.source),/reconciled evidence/);
  await assert.rejects(call("start","A","owner"),/blocked/);
  const source=f.plan.sources.find(s=>s.id==="spec");Object.assign(source,{status:"read",snapshot:f.source,revision:"refreshed"});delete source.reason;
  Object.assign(f.plan.knowledge.confluence,{status:"read"});delete f.plan.knowledge.confluence.gap;
  f.plan.blockers=[];
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const replanned=await call("replan",f.plan);await call("approvePlan",replanned.approval_required,f.approval);
  await call("start","A","owner");
  await call("block","A","Temporary execution issue","owner","Execution recovered",f.source);
  const blocker=(await call("load")).blockers.find(b=>!b.resolved);
  await call("unblock",blocker.id,f.source);
  await call("start","A","owner");
});
