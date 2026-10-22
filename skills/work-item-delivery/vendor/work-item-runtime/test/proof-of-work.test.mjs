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
