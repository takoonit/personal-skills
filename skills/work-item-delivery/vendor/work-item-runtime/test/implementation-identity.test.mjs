import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Delivery } from "../lib/delivery.mjs";
import { unitInputHash, unitSourceIds, sha } from "../lib/delivery-common.mjs";
import { admitPriorFixture, priorUnitInputs } from "./prior-identity-fixture.mjs";
import { fixture } from "./delivery-fixture.mjs";
import { admitFixture, designFixture, definitionFixture } from "./investigation-fixture.mjs";

const read = async path => JSON.parse(await readFile(path,"utf8"));
const call = f => (method,...args) => new Delivery(f.run)[method](...args);

async function reword(f) {
  const run=new Delivery(f.run), m=await read(join(f.run,"investigation.json"));
  const d=await read(join(f.run,"evidence","sha256",m.definition.sha256));
  for (const source of d.sources) if(source.blob) {
    source.snapshot=join(f.run,"evidence","sha256",source.blob.sha256); delete source.blob;
  }
  d.expected_revision=m.revision; d.revision_note="Coordinator clarifies prose.";
  await run.investigate(d);
  const cb=await call(f)("investigationBrief","challenge");
  const file=join(f.root,"reword.json");
  await writeFile(file,JSON.stringify({task:"challenge",input_hash:cb.input_hash,artifacts:[],challenges:[]}));
  await call(f)("investigationReport","challenge",file);
  const ab=await call(f)("investigationBrief","arbitration");
  const old=await read(join(f.run,"evidence","sha256",m.dossier.sha256));
  const {raw,...a}=old.arbitration;
  a.input_hash=ab.input_hash; a.claims.forEach(row=>row.rationale="Same supported finding, clarified wording.");
  await writeFile(file,JSON.stringify(a));
  f.plan.admission={dossier:(await call(f)("arbitrate",file)).dossier};
  await designFixture(new Delivery(f.run),f.plan,f.root);
}

test("re-arbitration prose preserves completed heads and reports while exact approval renews",async t=>{
  const f=await fixture(t),run=call(f);await f.approve();await f.implement("A");
  const before=await run("load");
  await reword(f);
  const result=await run("replan",f.plan),after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  assert.equal(after.approval,null);
  assert.notEqual(after.plan_hash,before.plan_hash);
  assert.ok(result.preserved.includes("A"));
});

test("changing B preserves A while dependency consumers reset",async t=>{
  const f=await fixture(t),run=call(f);await f.approve();await f.implement("A");await f.implement("B");
  const before=await run("load");
  f.plan.units[1].finding="New substantive finding for B";
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan),after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  assert.equal(after.units.B.state,"pending");
  assert.ok(result.changed.includes("B"));
});

test("legacy opaque inputs migrate unchanged progress with an explicit historical limitation",async t=>{
  const f=await fixture(t,{legacy:true}),run=call(f);await f.approve();await f.implement("A");
  const before=await run("load");
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan),after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  assert.equal(after.unit_inputs.A.version,3);
  assert.match(result.migrations.find(row=>row.unit==="A").limitation,/historical.*investigation/i);
  assert.deepEqual((await run("status")).unit_input_migrations,after.unit_input_migrations);
  assert.equal(after.approval,null);
});

test("legacy source drift is a migration gap rather than inferred unchanged history",async t=>{
  const f=await fixture(t,{legacy:true}),run=call(f);await f.approve();await f.implement("A");
  await writeFile(f.source,"Changed historical source bytes");
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan);
  assert.equal((await run("load")).units.A.state,"pending");
  assert.ok(result.migration_gaps.some(row=>row.unit==="A"));
  assert.deepEqual((await run("status")).unit_input_migration_gaps,result.migration_gaps);
});

test("legacy exact hash verification prevents a damaged opaque input from preserving work",async t=>{
  const f=await fixture(t,{legacy:true}),run=call(f);await f.approve();await f.implement("A");
  const state=await run("load");
  assert.equal(state.unit_inputs.A,await unitInputHash(state.plan,state.plan.units[0]));
  state.unit_inputs.A="0".repeat(64);
  await writeFile(join(f.run,"delivery.json"),JSON.stringify(state));
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan);
  assert.equal((await run("load")).units.A.state,"pending");
  assert.ok(result.migration_gaps.some(row=>row.unit==="A"));
});

async function sharedAdmission(f, revision, changedB=false, challenge=null, options={}) {
  const run=call(f), d=definitionFixture(f.plan,revision-1);
  d.tasks=[{id:"shared",question:"What establishes each case?",domain:"fixture",assignee:"fixture",revision,
    case_ids:["A","B"],source_refs:f.plan.sources.map(s=>s.id)}];
  await run("investigate",d);
  const brief=await run("investigationBrief","shared");
  const claims=f.plan.units.map(u=>({id:u.id,basis:"source-supported",statement:u.id==="B"&&changedB?"Changed evidence for B":u.finding,
    case_ids:u.case_ids,source_refs:u.source_refs,limitations:[]}));
  options.claims?.(claims);
  const file=join(f.root,"shared.json");
  await writeFile(file,JSON.stringify({task:"shared",input_hash:brief.input_hash,claims,gaps:[],artifacts:options.artifacts??[]}));
  await run("investigationReport","shared",file);
  const cb=await run("investigationBrief","challenge");
  await writeFile(file,JSON.stringify({task:"challenge",input_hash:cb.input_hash,artifacts:[],challenges:challenge?[challenge]:[]}));
  await run("investigationReport","challenge",file);
  const ab=await run("investigationBrief","arbitration");
  const bindings=f.plan.units.map(u=>{
    u.investigation={claim_ids:["shared/"+u.id]};
    return {unit:u.id,...u.investigation,...Object.fromEntries(["case_ids","source_refs","finding","finding_status","acceptance"].map(k=>[k,u[k]])),cases:f.plan.cases.filter(c=>u.case_ids.includes(c.id))};
  });
  await writeFile(file,JSON.stringify({input_hash:ab.input_hash,claims:claims.map(c=>({id:"shared/"+c.id,status:"accepted",rationale:"Cited fixture"})),gaps:[],
    challenges:challenge?[{id:"challenge/"+challenge.id,status:"rejected",rationale:"Counterexample resolved with cited evidence"}]:[],bindings}));
  f.plan.schema="work-item-delivery.plan.v3";
  f.plan.admission={dossier:(await run("arbitrate",file)).dossier};
  await designFixture(new Delivery(f.run),f.plan,f.root);
}

test("a changed sibling claim in a shared report preserves unrelated finished A",async t=>{
  const f=await fixture(t,{uninitialized:true}),run=call(f);
  await sharedAdmission(f,1);
  const initialized=await run("init",f.plan);await run("approvePlan",initialized.plan_hash,f.approval);
  await f.implement("A");await f.implement("B");
  const before=await run("load");
  await sharedAdmission(f,2,true);
  await run("replan",f.plan);
  const after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  assert.equal(after.units.B.state,"pending");
});

for(const targeting of ["claim","source"]) test("challenge targeting via "+targeting+" invalidates its consumer despite another case label",async t=>{
  const f=await fixture(t,{uninitialized:true}),run=call(f);
  if(targeting==="claim") f.plan.sources.push({...f.plan.sources[0],id:"B-only"});
  await sharedAdmission(f,1);
  const initialized=await run("init",f.plan);await run("approvePlan",initialized.plan_hash,f.approval);
  await f.implement("A");
  await sharedAdmission(f,2,false,{id:"counter",scope:targeting==="source"?"source":"case",kind:"counterexample",statement:"A relevant challenge",case_ids:["B"],claim_ids:targeting==="claim"?["shared/A"]:[],
    source_refs:targeting==="claim"?["B-only"]:["ticket"],limitations:[]});
  await run("replan",f.plan);
  assert.equal((await run("load")).units.A.state,"pending");
});

test("substantive execution inputs and unknown extensions reset consumers",async t=>{
  for(const mutate of [
    plan=>plan.units[0].acceptance.push("Another acceptance"),
    plan=>plan.units[0].unknown_contract={version:2},
    plan=>plan.units[0].depends_on.push({unit:"B",stage:"implemented",source_refs:["ticket"],reason:"Needs B"}),
    plan=>plan.unknown_contract={revision:"changed"},
  ]) {
    const f=await fixture(t),run=call(f);await f.approve();await f.implement("A");
    mutate(f.plan);
    await admitFixture(new Delivery(f.run),f.plan,f.root);
    await run("replan",f.plan);
    assert.equal((await run("load")).units.A.state,"pending");
  }
});

test("priority and check timeout changes preserve implementation while approval renews",async t=>{
  const f=await fixture(t),run=call(f);await f.approve();await f.implement("A");
  const before=await run("load");
  f.plan.units[0].priority=3;f.plan.units[0].checks[0].timeout_ms=9999;
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  await run("replan",f.plan);
  const after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  assert.equal(after.approval,null);
});

test("a changed dependency invalidates preserved dependent implementation",async t=>{
  const f=await fixture(t,{uninitialized:true}),run=call(f);
  f.plan.units[1].depends_on=[{unit:"A",stage:"implemented",source_refs:["ticket"],reason:"Consumes A"}];
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const initialized=await run("init",f.plan);await run("approvePlan",initialized.plan_hash,f.approval);
  await f.implement("A");await f.implement("B");
  f.plan.units[0].change="Substantively changed implementation";
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan);
  assert.deepEqual(result.changed.sort(),["A","B"]);
  assert.deepEqual(result.preserved,[]);
  const after=await run("load"),event=after.events.findLast(event=>event.type==="replanned");
  assert.deepEqual(event.changed.sort(),["A","B"]);
  assert.deepEqual(event.preserved,[]);
  assert.equal(after.units.B.state,"pending");
});

test("a case-scoped challenge citing a shared source preserves unrelated A",async t=>{
  const f=await fixture(t,{uninitialized:true}),run=call(f);
  await sharedAdmission(f,1);
  const initialized=await run("init",f.plan);await run("approvePlan",initialized.plan_hash,f.approval);
  await f.implement("A");const before=await run("load");
  await sharedAdmission(f,2,false,{id:"counter",kind:"counterexample",statement:"B case counterexample",case_ids:["B"],claim_ids:["shared/B"],source_refs:["ticket"],limitations:[]});
  await run("replan",f.plan);
  assert.deepEqual((await run("load")).units.A,before.units.A);
});

test("challenge scope enum rejects unclear widening at report admission",async t=>{
  const f=await fixture(t,{uninitialized:true});
  await assert.rejects(sharedAdmission(f,1,false,{id:"counter",scope:"all",kind:"counterexample",statement:"Ambiguous scope",case_ids:["B"],claim_ids:[],source_refs:["ticket"],limitations:[]}),/invalid challenge scope/);
});

test("missing legacy unit fingerprints require provable exact historical bytes",async t=>{
  for(const drift of [false,true]){
    const f=await fixture(t,{legacy:true}),run=call(f);await f.approve();await f.implement("A");
    const before=await run("load");delete before.unit_inputs.A;
    await writeFile(join(f.run,"delivery.json"),JSON.stringify(before));
    if(drift) await writeFile(f.source,"Changed historical bytes");
    await admitFixture(new Delivery(f.run),f.plan,f.root);
    const result=await run("replan",f.plan),after=await run("load");
    if(drift){
      assert.equal(after.units.A.state,"pending");assert.ok(result.migration_gaps.some(row=>row.unit==="A"));
    } else {
      assert.deepEqual(after.units.A,before.units.A);assert.ok(result.migrations.some(row=>row.unit==="A"&&row.from==="missing"));
    }
  }
});

test("historical v3 opaque hashes compare like-for-like before prose-neutral migration",async t=>{
  const f=await fixture(t),run=call(f);await f.approve();await f.implement("A");
  const before=await run("load"),dossier=await read(join(f.run,"evidence","sha256",before.plan.admission.dossier.sha256));
  before.unit_inputs={};
  for(const unit of before.plan.units){
    const task=unit.id,row=dossier.bundle.reports.find(row=>row.task===task);
    const claims=row.report.claims.map(claim=>({...claim,id:task+"/"+claim.id}));
    const evidence={claims,reports:[{task,receipt:row.receipt}],
      decisions:dossier.arbitration.claims.filter(row=>claims.some(claim=>claim.id===row.id)),
      gaps:[],challenges:[],gap_decisions:[],challenge_decisions:[],
      sources:dossier.definition.sources.filter(source=>unitSourceIds(before.plan,unit).includes(source.id))};
    before.unit_inputs[unit.id]=await unitInputHash(before.plan,unit,evidence);
  }
  await writeFile(join(f.run,"delivery.json"),JSON.stringify(before));
  await reword(f);
  const result=await run("replan",f.plan),after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  assert.equal(after.unit_inputs.A.version,3);
  assert.match(result.migrations.find(row=>row.unit==="A").limitation,/Historical admission receipts were verified/);
  assert.deepEqual(result.migration_gaps,[]);
});

test("transitive premise changes invalidate selected claim consumers",async t=>{
  const f=await fixture(t,{uninitialized:true}),run=call(f);
  const options=statement=>({claims:claims=>{
    const a=claims[0];a.basis="inferred";a.premises=["middle"];
    claims.push({...a,id:"middle",premises:["base"]},{...a,id:"base",basis:"source-supported",premises:[],statement});
  }});
  await sharedAdmission(f,1,false,null,options("Original premise"));
  const initialized=await run("init",f.plan);await run("approvePlan",initialized.plan_hash,f.approval);await f.implement("A");
  await sharedAdmission(f,2,false,null,options("Changed premise"));
  await run("replan",f.plan);assert.equal((await run("load")).units.A.state,"pending");
});

test("artifact changes invalidate only the claim consumers referencing them",async t=>{
  const f=await fixture(t,{uninitialized:true}),run=call(f),artifact=join(f.root,"B-observation.txt");
  await writeFile(artifact,"Original B observation");
  const options={artifacts:[{id:"observation-B",path:artifact}],claims:claims=>{
    Object.assign(claims[1],{basis:"observed",environment:"fixture",artifact_ids:["observation-B"]});
  }};
  await sharedAdmission(f,1,false,null,options);
  const initialized=await run("init",f.plan);await run("approvePlan",initialized.plan_hash,f.approval);
  await f.implement("A");await f.implement("B");const before=await run("load");
  await writeFile(artifact,"Changed B observation");
  await sharedAdmission(f,2,false,null,options);
  await run("replan",f.plan);const after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);assert.equal(after.units.B.state,"pending");
});

test("verified neutral design reuse preserves work and historical stages but renews exact approval",async t=>{
  const f=await fixture(t),run=call(f);await f.approve();await f.implement("A");
  const before=await run("load"),manifest=await read(f.plan.design.manifest),originalStages=structuredClone(manifest.architect);
  const origin=join(f.root,"origin-plan.json");
  await writeFile(origin,JSON.stringify(before.plan));
  const context=await run("designContext",before.plan);
  Object.assign(manifest,{schema:"work-item-delivery.design.v2",projection_version:2,design_hash:context.design_hash,
    origin_plan:{path:origin,sha256:sha(await readFile(origin))}});
  await writeFile(f.plan.design.manifest,JSON.stringify(manifest));
  f.plan.units[0].priority=2;f.plan.units[0].checks[0].timeout_ms=9000;
  const result=await run("replan",f.plan),after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  assert.equal(after.design_receipt.reused,true);
  assert.equal(after.design_receipt.origin_plan_hash,manifest.plan_hash);
  assert.deepEqual((await read(f.plan.design.manifest)).architect,originalStages);
  assert.equal(after.approval,null);
  await assert.rejects(run("start","B","writer"),/approve this exact plan/);
  await run("approvePlan",result.approval_required,f.approval);
  await run("start","B","writer");
  await assert.rejects(run("replan",{...f.plan,policy:{...f.plan.policy,branch_prefix:"new/"}}),/active writers/);
});
