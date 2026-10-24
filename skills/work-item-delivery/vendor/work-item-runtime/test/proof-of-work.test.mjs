import test from "node:test";
import assert from "node:assert/strict";
import { readFile,writeFile,mkdir,unlink,stat,symlink,chmod } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { collectProof,writeProof } from "../scripts/proof-of-work.mjs";
import { proofFixture,digest,git } from "./proof-fixture.mjs";

const script=new URL("../scripts/proof-of-work.mjs",import.meta.url).pathname;
const readState=async f=>JSON.parse(await readFile(join(f.run,"delivery.json"),"utf8"));
const saveState=(f,state)=>writeFile(join(f.run,"delivery.json"),JSON.stringify(state));
const collect=f=>collectProof(f.run,"backend",f.scopeFile);
const cli=(f,out,...args)=>spawnSync(process.execPath,[script,"--run",f.run,"--repo","backend","--file",f.scopeFile,"--out",out,...args],{encoding:"utf8"});

test("proof collector preserves real red/green evidence and produces literal case/test results",async t=>{
  const f=await proofFixture(t),before=await readFile(join(f.run,"delivery.json"));
  const {index,outputs}=await collect(f);
  assert.equal(index.status,"CHECKS_PASSED");
  assert.deepEqual(index.checks.map(row=>[row.unit,row.check,row.kind,row.report.counts.total,row.report.counts.passed]),[["U1","unit","unit",1,1],["U1","regression","regression",1,1]]);
  assert.deepEqual(index.cases.map(row=>[row.id,row.status]),[["C1","MAPPED_CHECKS_PASSED"],["C2","MAPPED_CHECKS_PASSED"]]);
  assert.equal(index.blast_radius.status,"SUPPORTED_BY_CHECKS");
  assert.match(await readFile(index.observations[0].artifact.path,"utf8"),/\+\s+'B'/);
  assert.equal(index.observations[0].test.sha256,index.observations[1].test.sha256);
  assert.equal(outputs["proof-of-works.md"].toString().split("## ").length,2);
  assert.equal(outputs["proof-of-works.md"].toString().includes("Expected values to be strictly deep-equal"),false);
  assert.deepEqual(await readFile(join(f.run,"delivery.json")),before);
});

test("proof bundle reruns preserve bytes/mtime and detect corruption in each output",async t=>{
  const f=await proofFixture(t),out=join(f.root,"proof"),result=await collect(f);
  await writeProof(result.outputs,out);
  const times=await Promise.all(Object.keys(result.outputs).map(name=>stat(join(out,name)).then(row=>row.mtimeMs)));
  for(const args of [[],["--check"]]) {const run=cli(f,out,...args);assert.equal(run.status,0,run.stderr);}
  assert.deepEqual(await Promise.all(Object.keys(result.outputs).map(name=>stat(join(out,name)).then(row=>row.mtimeMs))),times);
  for(const [name,bytes] of Object.entries(result.outputs)) {
    await writeFile(join(out,name),"known bad output");
    const run=cli(f,out,"--check");assert.equal(run.status,1);assert.match(run.stderr,/Output differs/);
    await writeFile(join(out,name),bytes);
  }
  assert.equal((await stat(join(out,"evidence-index.json"))).mode&0o777,0o600);
});

test("missing duplicate and unknown executed checks cannot reuse a passing flag",async t=>{
  const f=await proofFixture(t),original=await readState(f);
  for(const mutate of [s=>s.repos.backend.verification.results=[],s=>s.repos.backend.verification.results.pop(),
    s=>s.repos.backend.verification.results.push(s.repos.backend.verification.results[0]),
    s=>s.repos.backend.verification.results[0].check="unknown"]) {
    const state=structuredClone(original);mutate(state);await saveState(f,state);
    await assert.rejects(collect(f),/executed check/);
  }
});

test("changed deleted or empty logs and observation artifacts are rejected",async t=>{
  const f=await proofFixture(t),state=await readState(f);
  const paths=[...new Set([...state.repos.backend.verification.results.map(row=>row.evidence.path),f.scope.observations[0].artifact.path,f.scope.observations[0].test.path])];
  for(const path of paths) {
    const original=await readFile(path);
    for(const value of [Buffer.from("changed"),Buffer.alloc(0)]) {await writeFile(path,value);await assert.rejects(collect(f),/artifact bytes/);}
    await unlink(path);await assert.rejects(collect(f),/ENOENT/);await writeFile(path,original);
  }
});

test("a rehashed log must still match the approved command and recorded exit",async t=>{
  const f=await proofFixture(t),original=await readState(f),path=original.repos.backend.verification.results[0].evidence.path,bytes=await readFile(path);
  for(const value of [bytes.toString().replace(/^COMMAND .*\n/,"COMMAND [\"wrong-command\"]\n"),bytes.toString().replace("\nEXIT 0\n","\nEXIT 7\n")]) {
    const state=structuredClone(original),modified=Buffer.from(value);await writeFile(path,modified);
    Object.assign(state.repos.backend.verification.results[0].evidence,{sha256:digest(modified),bytes:modified.length});await saveState(f,state);
    await assert.rejects(collect(f),/command\/exit contradicts/);
  }
});

test("source snapshot dirty workspace branch and head drift invalidate collected proof",async t=>{
  const f=await proofFixture(t),source=await readFile(f.source),app=await readFile(join(f.repo,"app.mjs"));
  await writeFile(f.source,"changed requirement");await assert.rejects(collect(f),/review and approve/);await writeFile(f.source,source);
  await writeFile(join(f.repo,"app.mjs"),"uncommitted work");await assert.rejects(collect(f),/working changes/);await writeFile(join(f.repo,"app.mjs"),app);
  git(f.repo,"checkout","-b","other-branch");await assert.rejects(collect(f),/approved work branch/);git(f.repo,"checkout","fix/100-proof-fixture");
  git(f.repo,"commit","--allow-empty","-m","new unverified source head");await assert.rejects(collect(f),/stale source head/);
  f.scope.observations=f.scope.observations.filter(row=>row.phase==="before");await f.saveScope();
  await assert.rejects(collect(f),/current source head/);
});

test("explicit case mapping gaps remain visible despite all commands passing",async t=>{
  const f=await proofFixture(t);
  f.scope.checks[1].case_ids=["C1"];await f.saveScope();
  const result=await collect(f);
  assert.equal(result.index.status,"CHECKS_INCOMPLETE");
  assert.equal(result.index.cases.find(row=>row.id==="C2").status,"INCOMPLETE");
  assert.match(result.outputs["proof-of-works.md"].toString(),/Case C2 has incomplete/);
});

test("failed real regression keeps its actual counters and cannot select an older pass",async t=>{
  const f=await proofFixture(t);
  f.scope.observations=f.scope.observations.filter(row=>row.phase==="before");await f.saveScope();
  await writeFile(join(f.repo,"app.mjs"),"export const select = items => items.map(item => item.id);\n");
  git(f.repo,"add","app.mjs");git(f.repo,"commit","-m","reproduce regression");
  assert.equal((await f.call("verify","backend")).passed,false);
  const result=await collect(f),regression=result.index.checks.find(row=>row.check==="regression");
  assert.equal(result.index.status,"CHECKS_INCOMPLETE");assert.equal(regression.exit_code,1);assert.equal(regression.report.counts.failed,1);
});

async function replaceUnitCommand(f,argv) {
  f.plan.units[0].checks[0].argv=argv;await f.call("replan",f.plan);
  const state=await readState(f);await f.call("approvePlan",state.plan_hash,join(f.root,"approval.txt"));
  await f.call("start","U1","fixture");await f.call("finish","U1","fixture",f.source);
  f.scope.plan_hash=state.plan_hash;f.scope.observations=f.scope.observations.filter(row=>row.phase==="before");await f.saveScope();
}

test("zero-exit no-op is command success but never complete unit-test proof",async t=>{
  const f=await proofFixture(t);
  await replaceUnitCommand(f,[process.execPath,"-e","console.log('PRIVATE_NOOP_MARKER')"]);
  assert.equal((await f.call("verify","backend")).passed,true);
  const result=await collect(f);
  assert.equal(result.index.status,"CHECKS_INCOMPLETE");assert.equal(result.index.checks[0].exit_code,0);
  assert.equal(result.index.checks[0].report.counts,null);
  assert.equal(result.outputs["proof-of-works.md"].toString().includes("PRIVATE_NOOP_MARKER"),false);
});

test("live snapshot mutation during a green runtime check is caught by collection",async t=>{
  const f=await proofFixture(t,{verify:false});
  await writeFile(join(f.repo,"unit.test.mjs"),"import test from 'node:test'; import {writeFileSync} from 'node:fs'; test('source mutation fixture',()=>writeFileSync("+JSON.stringify(f.source)+",'changed while tests ran'));\n");
  git(f.repo,"add","unit.test.mjs");git(f.repo,"commit","-m","synthetic external source drift probe");
  assert.equal((await f.call("verify","backend")).passed,true);
  await assert.rejects(collect(f),/review and approve this exact plan/);
});

test("execute preflight rejects unsafe scopes and outputs without altering ledger",async t=>{
  const f=await proofFixture(t),state=await readState(f);
  state.repos.backend.review={marker:"preserve"};state.repos.backend.publication={marker:"preserve"};await saveState(f,state);
  const ledger=await readFile(join(f.run,"delivery.json")),out=join(f.root,"proof");
  const invalidMode=cli(f,out,"--execute","--check");assert.equal(invalidMode.status,1);assert.deepEqual(await readFile(join(f.run,"delivery.json")),ledger);
  const original=structuredClone(f.scope);f.scope.checks[0].check="foreign";await f.saveScope();
  assert.equal(cli(f,out,"--execute").status,1);assert.deepEqual(await readFile(join(f.run,"delivery.json")),ledger);
  Object.assign(f.scope,original);await f.saveScope();
  for(const path of [f.scope.observations[0].artifact.path,f.scope.observations[0].test.path]) {
    const bytes=await readFile(path);await unlink(path);
    assert.equal(cli(f,out,"--execute").status,1);assert.deepEqual(await readFile(join(f.run,"delivery.json")),ledger);
    await writeFile(path,bytes);
  }
  await symlink(f.repo,join(f.root,"alias"));assert.equal(cli(f,join(f.root,"alias","proof"),"--execute").status,1);
  assert.deepEqual(await readFile(join(f.run,"delivery.json")),ledger);
  const locked=join(f.root,"locked");await mkdir(locked,{mode:0o500});
  try {assert.equal(cli(f,join(locked,"proof"),"--execute").status,1);assert.deepEqual(await readFile(join(f.run,"delivery.json")),ledger);}
  finally {await chmod(locked,0o700);}
  await mkdir(out);await writeFile(join(out,"evidence-index.json"),"partial");
  assert.equal(cli(f,out,"--execute").status,1);assert.deepEqual(await readFile(join(f.run,"delivery.json")),ledger);
});

test("execute mode runs approved real checks and check mode only compares the bundle",async t=>{
  const f=await proofFixture(t,{verify:false}),out=join(f.root,"proof");
  const run=cli(f,out,"--execute");assert.equal(run.status,0,run.stderr);
  const index=JSON.parse(await readFile(join(out,"evidence-index.json")));
  assert.equal(index.status,"CHECKS_PASSED");assert.equal(index.checks[1].report.counts.passed,1);
  const ledger=await readFile(join(f.run,"delivery.json"));
  assert.equal(cli(f,out,"--execute").status,1);assert.deepEqual(await readFile(join(f.run,"delivery.json")),ledger);
  assert.equal(cli(f,out,"--check").status,0);assert.deepEqual(await readFile(join(f.run,"delivery.json")),ledger);
});

 test("automated and legacy observations never supply product-action phases",async t=>{
  const f=await proofFixture(t);
  for(const classified of [false,true]) {
    for(const row of f.scope.observations) {if(classified) Object.assign(row,{kind:"automated",executor:{kind:"human",id:"fixture tester"}});else {delete row.kind;delete row.executor;}}
    await f.saveScope();const {index}=await collect(f);
    assert.equal(index.status,"CHECKS_PASSED");
    assert.equal(index.acceptance.status,"INCOMPLETE");
    assert.ok(index.acceptance.cases.every(row=>row.observations.length===0&&row.gaps.length===2));
    assert.equal(index.observations.length,2);
  }
 });

 test("real product CLI actions close only their matching case and retain automated red/green support",async t=>{
  const f=await proofFixture(t,{productActions:true});
  const {index,outputs}=await collect(f),caseProof=index.acceptance.cases.find(row=>row.id==="C2");
  assert.equal(caseProof.status,"RECORDED_REQUIRES_REVIEW");
  assert.deepEqual(caseProof.observations.map(row=>[row.phase,row.actual]),[["before","A,B"],["after","Only A"]]);
  assert.ok(caseProof.observations.every(row=>row.executor.kind==="agent"&&row.surface==="cli"&&!row.capture_id&&!row.capture_receipt));
  assert.equal(index.acceptance.cases.find(row=>row.id==="C1").status,"INCOMPLETE");
  assert.equal(index.observations.filter(row=>row.classification==="automated").length,2);
  assert.match(outputs["proof-of-works.md"].toString(),/Executed by agent fixture-agent/);
 });
 test("missing product execution remains supporting; foreign procedure, source, phase and stale head never close gaps",async t=>{
  const f=await proofFixture(t,{productActions:true});
  const original=structuredClone(f.scope.observations);
  const product=()=>f.scope.observations.find(row=>row.kind==="product-action"&&row.phase==="after");
  delete product().execution;await f.saveScope();
  assert.equal((await collect(f)).index.acceptance.cases.find(row=>row.id==="C2").status,"INCOMPLETE");
  for(const mutate of [row=>row.procedure.sha256="0".repeat(64),row=>row.procedure.flow_id="foreign",row=>row.phase="before",row=>row.head=f.baseline]) {
    f.scope.observations=structuredClone(original);mutate(product());await f.saveScope();
    await assert.rejects(collect(f),/procedure|transcript|stale source head/i);
  }
 });
 test("a blocked CLI result does not close the after journey",async t=>{
  const f=await proofFixture(t,{productActions:true});
  const row=f.scope.observations.find(row=>row.kind==="product-action"&&row.phase==="after");
  const execution=JSON.parse(await readFile(row.execution.path,"utf8"));row.outcome=execution.outcome="blocked";
  await writeFile(row.execution.path,JSON.stringify(execution));row.execution.sha256=digest(await readFile(row.execution.path));await f.saveScope();
  const {index}=await collect(f);assert.equal(index.status,"CHECKS_PASSED");
  assert.deepEqual(index.acceptance.cases.find(row=>row.id==="C2").gaps,["No recorded after observation for this case"]);
 });

 test("UI observations resolve actual recordCapture receipts and latest blockers",async t=>{
  const f=await proofFixture(t,{ui:true});
  assert.equal((await collect(f)).index.acceptance.cases.find(row=>row.id==="C2").status,"RECORDED_REQUIRES_REVIEW");
  const original=structuredClone(f.scope.observations),state=await readState(f);
  const after=()=>f.scope.observations.find(row=>row.kind==="product-action"&&row.phase==="after");
  for(const mutate of [row=>delete row.capture_receipt,row=>row.capture_id="foreign",row=>row.capture_receipt=f.scope.observations.find(item=>item.kind==="product-action"&&item.phase==="before").capture_receipt,row=>row.artifact=f.scope.observations[0].artifact]) {
    f.scope.observations=structuredClone(original);mutate(after());await f.saveScope();
    await assert.rejects(collect(f),/capture|artifact/i);
  }
  f.scope.observations=structuredClone(original);await f.saveScope();
  const blocker=JSON.parse(await readFile(join(f.root,"capture-after.json"),"utf8"));
  Object.assign(blocker,{phase:"blocker",outcome:"blocked",reason:"Fixture login blocked",captured_at:"2026-10-24T03:00:00Z"});
  const path=join(f.root,"capture-blocker.json");await writeFile(path,JSON.stringify(blocker));await f.call("recordCapture",path);
  await assert.rejects(collect(f),/latest valid capture receipt/);
  await saveState(f,state);
  for(const mutate of [row=>row.context_hash="0".repeat(64),row=>row.observed="fabricated without changing original capture input"]) {
    const changed=structuredClone(state);mutate(changed.captures.find(row=>row.phase==="after"));await saveState(f,changed);
    await assert.rejects(collect(f),/latest valid capture receipt/);
  }
  await saveState(f,state);
  const originalArtifact=await readFile(after().artifact.path);await writeFile(after().artifact.path,Buffer.from([137,80,78,71,13,10,26,10,1]));
  await assert.rejects(collect(f),/artifact bytes/);await writeFile(after().artifact.path,originalArtifact);
  state.captures.find(row=>row.phase==="after").git_head=f.baseline;await saveState(f,state);
  await assert.rejects(collect(f),/latest valid capture receipt/);
 });
 test("verification logs and runner invocations cannot be relabeled as product actions",async t=>{
  const f=await proofFixture(t,{productActions:true});
  const row=f.scope.observations.find(row=>row.kind==="product-action"&&row.phase==="after"),original=structuredClone(row);
  row.artifact=f.scope.observations.find(row=>row.kind==="automated"&&row.phase==="after").artifact;await f.saveScope();
  await assert.rejects(collect(f),/Automated verification log/);Object.assign(row,original);
  const execution=JSON.parse(await readFile(row.execution.path,"utf8"));execution.actions[0].argv=[process.execPath,"--test","regression.test.mjs"];
  await writeFile(row.execution.path,JSON.stringify(execution));row.execution.sha256=digest(await readFile(row.execution.path));await f.saveScope();
  await assert.rejects(collect(f),/Automated test runner/);
 });

 test("procedure identity changes with approved flow, case and cited source bytes",async t=>{
  const {procedureBinding}=await import("../lib/evidence.mjs");
  const f=await proofFixture(t),binding=()=>procedureBinding(f.plan,"backend","C2","selection"),original=await binding();
  f.plan.knowledge.business_flows[0].steps[0].action+=" differently";assert.notEqual(await binding(),original);
  f.plan.knowledge.business_flows[0].steps[0].action=f.plan.knowledge.business_flows[0].steps[0].action.replace(" differently","");
  f.plan.cases.find(row=>row.id==="C2").expected+=" differently";assert.notEqual(await binding(),original);
  f.plan.cases.find(row=>row.id==="C2").expected=f.plan.cases.find(row=>row.id==="C2").expected.replace(" differently","");
  await writeFile(f.source,"Changed cited requirements");assert.notEqual(await binding(),original);
 });
