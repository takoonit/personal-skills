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

test("CLI restarts through independent briefs, exact challenge, arbitration, approval and admitted writer",async t=>{
  const f=await fixture(t,{uninitialized:true});
  assert.equal(cli(f,"cursor").action,"intake");
  const d=definitionFixture(f.plan);
  cli(f,"investigate","--file",await write(join(f.root,"definition.json"),d));
  assert.equal(cli(f,"cursor").action,"investigate");
  const first=cli(f,"investigation-brief","--task","A");
  assert.equal(first.bundle,undefined);
  assert.equal(first.reports,undefined);
  for(const u of f.plan.units){
    const brief=cli(f,"investigation-brief","--task",u.id);
    cli(f,"investigation-report","--task",u.id,"--file",await write(join(f.root,u.id+".json"),reportFixture(brief,u)));
  }
  assert.equal(cli(f,"cursor").action,"challenge");
  const cb=cli(f,"investigation-brief","--task","challenge");
  assert.equal(cb.bundle.reports.length,2);
  assert.equal(cb.bundle.reports[0].report.claims[0].statement,f.plan.units[0].finding);
  cli(f,"investigation-report","--task","challenge","--file",await write(join(f.root,"challenge.json"),{task:"challenge",input_hash:cb.input_hash,challenges:[],artifacts:[]}));
  assert.equal(cli(f,"cursor").action,"arbitrate");
  const ab=cli(f,"investigation-brief","--task","arbitration");
  const bindings=f.plan.units.map(u=>{
    u.investigation={claim_ids:[u.id+"/finding"]};
    return {unit:u.id,...u.investigation,...Object.fromEntries(["case_ids","source_refs","finding","finding_status","acceptance"].map(k=>[k,u[k]])),cases:f.plan.cases.filter(c=>u.case_ids.includes(c.id))};
  });
  const result=cli(f,"arbitrate","--file",await write(join(f.root,"arbitration.json"),{input_hash:ab.input_hash,claims:bindings.map(b=>({id:b.claim_ids[0],status:"accepted",rationale:"Synthetic source evidence."})),gaps:[],challenges:[],bindings}));
  assert.equal(cli(f,"cursor").action,"author-plan");
  f.plan.schema="work-item-delivery.plan.v3";f.plan.admission={dossier:result.dossier};
  await designFixture(new Delivery(f.run),f.plan,f.root);
  const initialized=cli(f,"init","--file",await write(join(f.root,"plan.json"),f.plan));
  assert.equal(initialized.approved,false);
  cli(f,"approve-plan","--hash",initialized.plan_hash,"--evidence",f.approval);
  const brief=cli(f,"start","--unit","A","--owner","fixture-writer");
  assert.equal(brief.investigation.claims[0].id,"A/finding");
  assert.deepEqual(brief.investigation.claims[0].limitations,["Synthetic fixture only."]);
  assert.equal(brief.investigation.independence.mode,"single-agent");
  assert.equal(cli(f,"cursor").action,"continue-writer");
});

test("reports reject stale inputs and conflicting retries; explicit revision keeps immutable history",async t=>{
  const f=await fixture(t,{uninitialized:true}),call=raw(f),d=definitionFixture(f.plan);
  const first=await call("investigate",d);
  assert.deepEqual(await call("investigate",d),first);
  const brief=await call("investigationBrief","A"),report=reportFixture(brief,f.plan.units[0]);
  const file=await write(join(f.root,"report.json"),{...report,input_hash:"stale"});
  await assert.rejects(call("investigationReport","A",file),/stale report/);
  await write(file,report);
  await call("investigationReport","A",file);
  const before=await read(join(f.run,"investigation.json"));
  await call("investigationReport","A",file);
  report.claims[0].statement="conflicting retry";await write(file,report);
  await assert.rejects(call("investigationReport","A",file),/conflicting report retry/);
  d.tasks[0].revision="next";
  await assert.rejects(call("investigate",d),/stale investigation revision/);
  d.expected_revision=first.revision;
  await call("investigate",d);
  assert.equal((await read(join(f.run,"investigation.json"))).history.length,1);
  assert.equal(sha(await readFile(join(f.run,"evidence","sha256",before.reports.A.sha256))),before.reports.A.sha256);
  await assert.rejects(call("investigationReport","A",file),/stale report/);
});

test("arbitration requires complete dispositions and rejects rejected claims as implementation authority",async t=>{
  const f=await preparation(t,{challenge:true});
  const claims=f.arbitration.claims;
  f.arbitration.claims=claims.slice(1);
  await assert.rejects(f.reconcile(),/complete claims dispositions/);
  f.arbitration.claims=claims;claims[0].status="rejected";
  await assert.rejects(f.reconcile(),/rejected claim/);
  claims[0].status="accepted";f.arbitration.challenges=[];
  await assert.rejects(f.reconcile(),/complete challenges dispositions/);
});

test("unresolved gaps and challenges block every affected unit while independent work starts",async t=>{
  const f=await preparation(t,{gap:true,challenge:true});
  await f.reconcile();
  await assert.rejects(f.call("init",f.plan),/unresolved evidence requires affected-unit blocker/);
  f.plan.blockers.push({id:"research-A",units:["A"],reason:"Missing authority and counterexample",owner:"BA",unblock_when:"BA supplies a cited answer",source_refs:["ticket"],investigation_refs:["A/missing","challenge/counter"]});
  await designFixture(new Delivery(f.run),f.plan,f.root);
  const started=await f.call("init",f.plan);
  await f.call("approvePlan",started.plan_hash,f.approval);
  await assert.rejects(f.call("start","A","worker"),/blocked/);
  await f.call("start","B","worker");
  await assert.rejects(f.call("unblock","research-A",f.approval),/reconciled evidence/);
});

test("gap-only affected units admit as blocked without inventing an accepted claim",async t=>{
  const f=await preparation(t,{gap:true});
  f.arbitration.claims[0].status="unresolved";
  f.plan.units[0].investigation={claim_ids:[],gap_ids:["A/missing"]};
  Object.assign(f.arbitration.bindings[0],f.plan.units[0].investigation);
  f.plan.blockers.push({id:"research-A",units:["A"],reason:"Missing authority",owner:"BA",unblock_when:"BA supplies a cited answer",source_refs:["ticket"],investigation_refs:["A/missing","A/finding"]});
  await f.reconcile();
  const initialized=await f.call("init",f.plan);
  await f.call("approvePlan",initialized.plan_hash,f.approval);
  assert.deepEqual((await f.call("status")).ready_to_implement.map(u=>u.id),["B"]);
});

test("admission checks structured plan fields and leaves no delivery state on failure",async t=>{
  const f=await preparation(t);await f.reconcile();
  f.plan.units[0].finding="Unsupported changed finding";
  await assert.rejects(f.call("init",f.plan),/admitted finding differs/);
  await assert.rejects(readFile(join(f.run,"delivery.json")),/ENOENT/);
  f.plan.units[0].finding=f.arbitration.bindings[0].finding;
  await f.call("init",f.plan);
  assert.equal((await f.call("status")).approved,false);
});

test("admitted source, report and raw bytes are integrity holds; pending research preserves approval",async t=>{
  const f=await fixture(t),call=raw(f);await f.approve();
  const state=await call("load"),before=await readFile(join(f.run,"delivery.json"));
  const m=await read(join(f.run,"investigation.json"));
  const d=definitionFixture(f.plan,m.revision);d.tasks[0].question="A new neutral question?";
  await call("investigate",d);
  assert.equal((await call("status")).approved,true);
  assert.equal((await call("load")).plan_hash,state.plan_hash);
  assert.equal((await call("load")).approval.hash,state.approval.hash);
  const dossier=await read(join(f.run,"evidence","sha256",state.plan.admission.dossier.sha256));
  const targets=[dossier.definition.sources[0].blob,dossier.bundle.reports[0].receipt,dossier.bundle.reports[0].report.raw];
  for(const ref of targets){
    const path=join(f.run,"evidence","sha256",ref.sha256),bytes=await readFile(path);
    await writeFile(path,"corrupted");
    await assert.rejects(call("start","A","worker"),/immutable evidence bytes changed/);
    assert.equal((await call("status")).approved,false);
    await writeFile(path,bytes);
  }
  assert.equal(JSON.parse(before).plan_hash,(await call("load")).plan_hash);
});
