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

async function sectionFixture(t, {prior=false,marked=false}={}) {
  const f=await fixture(t,{uninitialized:true});
  for(const key of ["A","B"]) {
    const snapshot=join(f.root,"section-"+key+".txt");
    await writeFile(snapshot,"Original ticket section "+key);
    f.plan.sources.push({...f.plan.sources[0],id:"ticket-"+key,section:"Case "+key,revision:"section-1",snapshot});
    f.plan.units.find(u=>u.id===key).source_refs=["ticket-"+key,"spec"];
    f.plan.cases.find(c=>c.id===key).source_refs=["ticket-"+key,"spec"];
  }
  if(prior) await admitPriorFixture(new Delivery(f.run),f.plan,f.root,{marked});
  else await admitFixture(new Delivery(f.run),f.plan,f.root);
  const initialized=await call(f)("init",f.plan);
  await call(f)("approvePlan",initialized.plan_hash,f.approval);
  return f;
}

for(const changeB of [false,true]) test("ticket revision refresh preserves section A report and implementation"+(changeB?" while B changes":""),async t=>{
  const f=await sectionFixture(t),run=call(f);
  await f.implement("A");await f.implement("B");
  const before=await run("load"),manifest=await read(join(f.run,"investigation.json"));
  f.plan.work_item.revision="8";
  if(changeB) {
    const source=f.plan.sources.find(s=>s.id==="ticket-B");
    source.revision="section-2";
    await writeFile(source.snapshot,"Changed ticket section B");
  }
  const view=await run("investigate",definitionFixture(f.plan,manifest.revision));
  assert.deepEqual(view.pending_tasks,changeB?["B"]:[]);
  const refreshed=await read(join(f.run,"investigation.json"));
  assert.deepEqual(refreshed.reports.A,manifest.reports.A);
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan),after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  if(changeB) assert.equal(after.units.B.state,"pending"); else assert.deepEqual(after.units.B,before.units.B);
  assert.deepEqual(result.changed,changeB?["B"]:[]);
  assert.deepEqual(result.preserved,changeB?["A"]:["A","B"]);
  assert.equal(after.approval,null);
  assert.notEqual(after.plan_hash,before.plan_hash);
  const event=after.events.findLast(event=>event.type==="replanned");
  assert.deepEqual(event.changed,result.changed);
  assert.deepEqual(event.preserved,result.preserved);
});

for(const mutation of ["revision","bytes","acceptance","unknown-work-item"]) test("ticket refresh still invalidates A for substantive "+mutation,async t=>{
  const f=await sectionFixture(t),run=call(f);await f.implement("A");
  f.plan.work_item.revision="8";
  const source=f.plan.sources.find(s=>s.id==="ticket-A");
  if(mutation==="revision") source.revision="new-section-revision";
  if(mutation==="bytes") await writeFile(source.snapshot,"Changed section A bytes");
  if(mutation==="acceptance") f.plan.units[0].acceptance.push("New acceptance for A");
  if(mutation==="unknown-work-item") f.plan.work_item.extra_contract={version:2};
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan);
  assert.ok(result.changed.includes("A"));
  assert.equal((await run("load")).units.A.state,"pending");
});


for(const marked of [false,true]) for(const changeB of [false,true]) test((marked?"marked":"unmarked")+" prior v1 dossier migrates v2 implementation"+(changeB?" with B source drift":" after a global revision-only refresh"),async t=>{
  const f=await sectionFixture(t,{prior:true,marked}),run=call(f);
  await f.implement("A");await f.implement("B");
  const before=await run("load"),oldDossier=await run("checkedDossier",before.plan.admission.dossier);
  assert.equal(oldDossier.definition.task_identity_version,marked?1:undefined);
  const originalManifest=await read(join(f.run,"investigation.json"));
  assert.equal((await run("investigationView")).phase,"plan-ready");
  before.unit_inputs=await priorUnitInputs(before.plan,oldDossier);
  await writeFile(join(f.run,"delivery.json"),JSON.stringify(before));
  f.plan.work_item.revision="8";
  if(changeB) {
    const b=f.plan.sources.find(source=>source.id==="ticket-B");
    b.revision="section-2";await writeFile(b.snapshot,"Changed B source bytes");
  }
  const view=await run("investigate",definitionFixture(f.plan,originalManifest.revision));
  assert.deepEqual(view.pending_tasks,["A","B"]);
  assert.deepEqual(await run("checkedDossier",before.plan.admission.dossier),oldDossier);
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan),after=await run("load");
  assert.deepEqual(after.units.A,before.units.A);
  if(changeB) assert.equal(after.units.B.state,"pending"); else assert.deepEqual(after.units.B,before.units.B);
  assert.equal(after.unit_inputs.A.version,3);
  assert.ok(result.migrations.some(row=>row.unit==="A"&&row.from==="v2"&&row.to===3));
  if(changeB) assert.ok(result.migration_gaps.some(row=>row.unit==="B"&&/like-for-like/.test(row.reason)));
  else assert.deepEqual(result.migration_gaps,[]);
  const newManifest=await read(join(f.run,"investigation.json"));
  assert.notDeepEqual(newManifest.reports.A,originalManifest.reports.A);
  assert.equal(oldDossier.definition.work_item.revision,"7");
  assert.equal((await run("checkedDossier",after.plan.admission.dossier)).definition.work_item.revision,"8");
});

for(const mutation of ["execution","evidence","source"]) test("prior v2 "+mutation+" drift is a migration gap",async t=>{
  const f=await sectionFixture(t,{prior:true}),run=call(f);await f.implement("A");
  const before=await run("load"),dossier=await run("checkedDossier",before.plan.admission.dossier);
  before.unit_inputs=await priorUnitInputs(before.plan,dossier);
  if(mutation==="source") await writeFile(f.plan.sources.find(source=>source.id==="ticket-A").snapshot,"Changed A source bytes");
  else before.unit_inputs.A[mutation]="0".repeat(64);
  await writeFile(join(f.run,"delivery.json"),JSON.stringify(before));
  f.plan.work_item.revision="8";
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan);
  assert.equal((await run("load")).units.A.state,"pending");
  assert.ok(result.migration_gaps.some(row=>row.unit==="A"&&/like-for-like/.test(row.reason)));
  assert.ok(result.preserved.includes("B"));
});


test("a global revision refresh still needs exact dossier and approval renewal",async t=>{
  const f=await sectionFixture(t),run=call(f),before=await readFile(join(f.run,"delivery.json"));
  f.plan.work_item.revision="8";
  await assert.rejects(run("replan",f.plan),/Work Item differs from admitted dossier/);
  assert.deepEqual(await readFile(join(f.run,"delivery.json")),before);
});

for(const field of ["id","type","url","unknown_contract"]) test("task identity retains Work Item "+field,async t=>{
  const f=await sectionFixture(t),run=call(f),manifest=await read(join(f.run,"investigation.json"));
  f.plan.work_item[field]=field==="unknown_contract"?{revision:2}:"changed-"+field;
  const view=await run("investigate",definitionFixture(f.plan,manifest.revision));
  assert.deepEqual(view.pending_tasks,["A","B"]);
});

test("whole-ticket source bytes remain substantive for every consumer",async t=>{
  const f=await fixture(t),run=call(f);await f.approve();await f.implement("A");await f.implement("B");
  f.plan.work_item.revision="8";
  await writeFile(f.source,"A new whole-ticket snapshot including changed case B");
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  const result=await run("replan",f.plan);
  assert.deepEqual(result.changed,["A","B"]);
  assert.deepEqual(result.preserved,[]);
});


test("unchanged Work Item retains legacy task format and unaffected reports",async t=>{
  for(const marked of [false,true]) for(const change of ["new-task","B-source"]) {
    const f=await sectionFixture(t,{prior:true,marked}),run=call(f);
    await f.implement("A");
    const before=await read(join(f.run,"investigation.json"));
    if(change==="B-source") {
      const source=f.plan.sources.find(row=>row.id==="ticket-B");
      source.revision="section-2";await writeFile(source.snapshot,"Only B source changed; Work Item is unchanged");
    }
    const d=definitionFixture(f.plan,before.revision);
    if(change==="new-task") d.tasks.push({...d.tasks[1],id:"additional-B",question:"What independent detail remains for B?"});
    const view=await run("investigate",d),after=await read(join(f.run,"investigation.json"));
    assert.deepEqual(view.pending_tasks,[change==="new-task"?"additional-B":"B"]);
    assert.deepEqual(after.reports.A,before.reports.A);
    assert.equal((await read(join(f.run,"evidence","sha256",after.definition.sha256))).task_identity_version,marked?1:undefined);
    assert.equal((await run("load")).units.A.state,"implemented");
  }
});


test("identical legacy investigation retry preserves revision challenge and dossier without a new token",async t=>{
  for(const marked of [false,true]) {
    const f=await sectionFixture(t,{prior:true,marked}),run=call(f);
    const before=await readFile(join(f.run,"investigation.json"));
    const original=JSON.parse(before),input=definitionFixture(f.plan);delete input.expected_revision;
    const view=await run("investigate",input);
    assert.equal(view.phase,"plan-ready");
    assert.equal(view.revision,original.revision);
    assert.deepEqual(await readFile(join(f.run,"investigation.json")),before);
    assert.deepEqual((await read(join(f.run,"investigation.json"))).dossier,original.dossier);
    assert.deepEqual((await read(join(f.run,"investigation.json"))).challenge,original.challenge);
  }
});
