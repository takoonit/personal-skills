import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile,writeFile,mkdir,symlink} from "node:fs/promises";
import {join} from "node:path";
import {execFileSync,spawn} from "node:child_process";
import {fixture,actionFiles,git} from "./delivery-fixture.mjs";
import {definitionFixture,reportFixture,admitFixture} from "./investigation-fixture.mjs";
import {Delivery} from "../lib/delivery.mjs";
const cliFile=new URL("../bin/wid.mjs",import.meta.url).pathname;
const cli=(f,command,...args)=>JSON.parse(execFileSync(process.execPath,[cliFile,command,"--run",f.run,...args],{encoding:"utf8",cwd:f.repos[0].path,stdio:["ignore","pipe","pipe"]}));
async function note(f,content,options={},previous) {
 const file=join(f.root,"note.md"); await writeFile(file,content);
 return f.call("alignmentNote",file,previous,options);
}
async function resolve(f,row,request) {
 const file=join(f.root,"resolve.json");
 await writeFile(file,JSON.stringify({id:row.id,expected_revision:row.revision,note_sha256:row.note.sha256,plan_hash:(await f.call("status")).plan_hash,explanation:"Coordinator checked the recorded correction against this persisted plan.",...request}));
 return f.call("reconcileCorrection",file);
}
test("default CLI correction survives restart and blocks direct starts until explicit assessment",async t=>{
 const f=await fixture(t); await f.approve();
 const file=join(f.root,"note.md"); await writeFile(file,"Please change the acceptance.");
 const recorded=cli(f,"alignment-note","--file",file);
 const packet=cli(f,"resume");
 assert.equal(packet.action.action,"reconcile-correction");
 assert.equal(packet.corrections.records[0].state,"pending-assessment");
 await assert.rejects(f.call("start","A","writer"),/correction/);
 const row=packet.corrections.records[0];
 const resolution=join(f.root,"resolution.json");
 await writeFile(resolution,JSON.stringify({id:row.id,expected_revision:row.revision,note_sha256:row.note.sha256,
   plan_hash:packet.plan_hash,disposition:"no-impact",explanation:"The note asks for already satisfied acceptance."}));
 cli(f,"alignment-resolve","--file",resolution);
 assert.equal(cli(f,"resume").action.action,"start-unit");
 assert.equal(recorded.sha256,row.note.sha256);
});
test("CLI preplan pending assessment releases investigation after scope and reconciles after plan admission",async t=>{
 const f=await fixture(t,{uninitialized:true});
 const definition=join(f.root,"definition.json");await writeFile(definition,JSON.stringify(definitionFixture(f.plan)));
 cli(f,"investigate","--file",definition);
 const file=join(f.root,"note.md");await writeFile(file,"Case A needs investigation.");
 cli(f,"alignment-note","--file",file);
 let packet=cli(f,"resume");assert.equal(packet.action.action,"reconcile-correction");
 const row=packet.corrections.records[0],resolution=join(f.root,"resolution.json");
 const request={id:row.id,expected_revision:row.revision,note_sha256:row.note.sha256,plan_hash:null,
  disposition:"scope",case_ids:["A"],explanation:"The coordinator assigns the note to investigation case A."};
 await writeFile(resolution,JSON.stringify(request));cli(f,"alignment-resolve","--file",resolution);
 packet=cli(f,"resume");assert.equal(packet.action.action,"investigate");assert.equal(packet.corrections.records[0].state,"open");
 await admitFixture(new Delivery(f.run),f.plan,f.root);
 assert.equal(cli(f,"resume").action.action,"author-plan");
 await f.call("init",f.plan);
 packet=cli(f,"resume");assert.equal(packet.action.action,"reconcile-correction");
 await writeFile(resolution,JSON.stringify({...request,expected_revision:packet.corrections.records[0].revision,
  plan_hash:packet.plan_hash,disposition:"within-plan"}));
 cli(f,"alignment-resolve","--file",resolution);
 assert.equal(cli(f,"resume").action.action,"await-human");
});
test("CLI no-impact resolves historical open case IDs against current persisted plan with CAS",async t=>{
 const f=await fixture(t,{uninitialized:true});
 const file=join(f.root,"note.md");await writeFile(file,"Old case was split during investigation.");
 cli(f,"alignment-note","--file",file,"--cases","old-A,B");
 await admitFixture(new Delivery(f.run),f.plan,f.root);await f.call("init",f.plan);
 let packet=cli(f,"resume");assert.equal(packet.action.action,"reconcile-correction");
 const row=packet.corrections.records[0],resolution=join(f.root,"resolution.json");
 const request={id:row.id,expected_revision:row.revision,note_sha256:row.note.sha256,plan_hash:packet.plan_hash,
  disposition:"no-impact",case_ids:["old-A"],explanation:"Old case was assessed against admitted A and B; no remaining impact."};
 for(const bad of [{case_ids:["foreign"]},{case_ids:["../old-A"]},{plan_hash:"0".repeat(64)},{disposition:"within-plan"},{disposition:"adopted-plan"}]) {
  await writeFile(resolution,JSON.stringify({...request,...bad}));
  assert.throws(()=>cli(f,"alignment-resolve","--file",resolution));
 }
 await writeFile(resolution,JSON.stringify(request));cli(f,"alignment-resolve","--file",resolution);
 packet=cli(f,"resume");const partial=packet.corrections.records[0];
 assert.equal(partial.state,"open");assert.deepEqual(partial.cases.map(c=>[c.case_id,c.state]),[["B","open"],["old-A","resolved"]]);
 assert.equal(partial.cases[1].plan_hash,packet.plan_hash);assert.equal(partial.cases[1].explanation,request.explanation);
 cli(f,"alignment-resolve","--file",resolution);
 assert.equal(cli(f,"resume").corrections.records[0].revision,partial.revision);
 await writeFile(resolution,JSON.stringify({...request,case_ids:["B"]}));assert.throws(()=>cli(f,"alignment-resolve","--file",resolution));
 await writeFile(resolution,JSON.stringify({...request,case_ids:["B"],expected_revision:partial.revision,disposition:"within-plan"}));
 cli(f,"alignment-resolve","--file",resolution);
 assert.equal(cli(f,"resume").action.action,"await-human");
});
test("two notes preserve partial resolution and allow independent work with stale protection",async t=>{
 const f=await fixture(t,{twoRepos:true}); await f.approve();
 const first=await note(f,"A and B need reconciliation",{case_ids:["A","B"]});
 const second=await note(f,"B needs another correction",{case_ids:["B"]},first.sha256);
 let view=await f.call("correctionView",f.plan);
 assert.equal(view.records.length,2);
 const a=view.records[0];
 await assert.rejects(resolve(f,a,{disposition:"within-plan",case_ids:["A"],note_sha256:"0".repeat(64)}),/stale correction note/);
 await resolve(f,a,{disposition:"within-plan",case_ids:["A"]});
 await assert.rejects(resolve(f,a,{disposition:"within-plan",case_ids:["B"]}),/stale correction/);
 assert.equal((await f.call("readiness",await new Delivery(f.run).load(),f.plan.units[0])).ready,true);
 await assert.rejects(f.call("start","B","blocked-writer"),/correction/);
 await f.call("start","C","independent-writer");
 const packet=await f.call("resume");
 assert.equal(packet.action.action,"continue-writer");
 assert.ok(packet.legal_candidates.some(row=>row.unit==="A"));
 assert.equal(await readFile(first.archive,"utf8"),"A and B need reconciliation");
 assert.notEqual(first.id,second.id);
});
test("new certifications refuse scoped correction while active finish and approved native action survive",async t=>{
 const f=await fixture(t); await f.approve(); await f.implement("A");
 await f.call("start","B","writer");
 await note(f,"A affected",{case_ids:["A"]});
 assert.equal((await f.call("resume")).action.action,"continue-writer");
 await assert.rejects(f.call("verify","be"),/correction/);
 await assert.rejects(f.call("review","be",f.source),/correction/);
 await assert.rejects(f.call("stagePublication","be",f.source),/correction/);
 await writeFile(join(f.repos[0].path,"app.txt"),"completed B while correction remains open");
 git(f.repos[0].path,"add","app.txt");git(f.repos[0].path,"commit","-m","complete admitted owner");
 await f.call("finish","B","writer",f.source);
 const action=await actionFiles(f); await f.call("approveAction","be",action.file,f.approval); await action.observe();
 await writeFile(join(f.run,"corrections.json"),"{bad");
 await writeFile(join(f.run,"investigation.json"),"{bad");
 const packet=await f.call("resume");
 assert.equal(packet.action.action,"execute-approved-action");
 assert.ok(packet.corrections.integrity_hold);
 assert.ok(packet.context_gaps.some(row=>row.kind==="parse"));
});
test("legacy note is pending and adoption resolution requires persisted current exact plan",async t=>{
 const f=await fixture(t); await f.approve();
 await writeFile(join(f.run,"alignment.md"),"legacy correction");
 const row=(await f.call("resume")).corrections.records[0];
 assert.equal(row.state,"pending-assessment");
 await assert.rejects(resolve(f,row,{disposition:"adopted-plan",case_ids:["A"],plan_hash:"0".repeat(64)}),/current persisted plan/);
 await resolve(f,row,{disposition:"scope",case_ids:["A"]});
 const scoped=(await f.call("correctionView",f.plan)).records[0];
 await assert.rejects(resolve(f,scoped,{disposition:"adopted-plan",case_ids:["A"]}),/adopted plan must differ/);
 f.plan.units[0].acceptance.push("corrected acceptance"); await f.call("replan",f.plan);
 assert.equal((await f.call("correctionView",f.plan)).records[0].state,"open");
 await resolve(f,scoped,{disposition:"adopted-plan",case_ids:["A"]});
 assert.equal((await f.call("resume")).approval.current,false);
});

test("imported raw paths and scratch symlinks cannot change resume bindings; imported corruption is visible",async t=>{
 const f=await fixture(t,{uninitialized:true});
 await f.call("investigate",definitionFixture(f.plan));
 const brief=await f.call("investigationBrief","A");
 const artifact=join(f.root,"artifact.json"),scratch=join(f.root,"scratch.json");
 await writeFile(scratch,"scratch bytes");
 await writeFile(artifact,JSON.stringify({path:scratch}));
 const report={...reportFixture(brief,f.plan.units[0]),artifacts:[{id:"trace",path:artifact}]};
 const file=join(f.root,"report.json");await writeFile(file,JSON.stringify(report));
 await f.call("investigationReport","A",file);
 const packet=await f.call("resume");
 await writeFile(scratch,"amended scratch");await writeFile(artifact,"amended old input");
 assert.equal((await f.call("resume",packet.context_hash)).context_hash,packet.context_hash);
 const moved=join(f.root,"moved");await writeFile(moved,"redirect target");
 const {rm}=await import("node:fs/promises");await rm(artifact);await symlink(moved,artifact);
 assert.equal((await f.call("resume",packet.context_hash)).context_hash,packet.context_hash);
 const fromCwd=cli(f,"resume");assert.equal(fromCwd.context_hash,packet.context_hash);
 const manifest=JSON.parse(await readFile(join(f.run,"investigation.json"),"utf8"));
 const imported=join(f.run,"evidence","sha256",manifest.reports.A.sha256);
 await writeFile(imported,"corrupted imported bytes");
 const broken=await f.call("resume");assert.equal(broken.action.action,"blocked");
 assert.ok(broken.context_gaps.some(gap=>gap.kind==="integrity"));
});

test("dependent scope holds and idempotent intake/resolution keep unrelated approval intact",async t=>{
 const f=await fixture(t,{twoRepos:true});
 f.plan.units[1].depends_on=[{unit:"A",stage:"implemented",reason:"B consumes A behavior",source_refs:["spec"]}];
 await f.call("replan",f.plan);await f.call("approvePlan",(await f.call("status")).plan_hash,f.approval);
 const before=await readFile(join(f.run,"delivery.json"));
 const n=await note(f,"A correction",{case_ids:["A"]});
 assert.equal((await note(f,"A correction",{case_ids:["A"]})).id,n.id);
 assert.equal((await f.call("correctionView",f.plan)).records.length,1);
 const holds=await f.call("correctionHolds",f.plan,["A","B","C"]);
 assert.deepEqual(holds[0].units,["A","B"]);
 assert.equal((await f.call("resume")).action.unit,"C");
 const row=(await f.call("correctionView",f.plan)).records[0];
 const resolved=await resolve(f,row,{disposition:"within-plan",case_ids:["A"]});
 assert.equal((await resolve(f,row,{disposition:"within-plan",case_ids:["A"]})).revision,resolved.revision);
 assert.deepEqual(await readFile(join(f.run,"delivery.json")),before);
});
test("durable registry survives crash before latest publication and exact approved payload still binds",async t=>{
 const f=await fixture(t);await f.approve();
 const action=await actionFiles(f,"publish");await f.call("approveAction","be",action.file,f.approval);await action.observe({status:"absent",pr_url:undefined});
 const first=await note(f,"first correction");
 const second=await note(f,"second correction",{},first.sha256);
 await writeFile(join(f.run,"alignment.md"),"first correction");
 const pending=await f.call("correctionView",f.plan);assert.equal(pending.records.length,2);
 const retry=await note(f,"second correction",{},first.sha256);assert.equal(retry.id,second.id);
 assert.equal(await readFile(join(f.run,"alignment.md"),"utf8"),"second correction");
 assert.equal((await f.call("resume")).action.action,"execute-approved-action");
 const bad=join(f.root,"bad-readback.json");
 await writeFile(bad,JSON.stringify({...action.request,title:"Changed without approval",status:"active",pr_url:"https://example.invalid/pr/100"}));
 await assert.rejects(f.call("completeAction","be",bad),/title|read.back differs/);
});
test("approved native route remains inspectable through a redirected current manifest",async t=>{
 const f=await fixture(t);const action=await actionFiles(f);
 await f.call("approveAction","be",action.file,f.approval);await action.observe();
 const {rm}=await import("node:fs/promises");const path=join(f.run,"investigation.json"),target=join(f.root,"outside.json");
 await writeFile(target,"bad manifest");await rm(path);await symlink(target,path);
 const packet=await f.call("resume");
 assert.equal(packet.action.action,"execute-approved-action");
 assert.ok(packet.context_gaps.some(gap=>gap.path===path&&gap.kind==="read"));
});

test("a correction arriving during verification prevents a new pass receipt",async t=>{
 const f=await fixture(t);
 f.plan.units[0].checks[0].argv=[process.execPath,"-e","setTimeout(()=>process.exit(0),1200)"];
 await f.call("replan",f.plan);await f.call("approvePlan",(await f.call("status")).plan_hash,f.approval);
 await f.implement("A");
 await f.implement("B");
 const child=spawn(process.execPath,[cliFile,"verify","--run",f.run,"--repo","be"],{stdio:["ignore","pipe","pipe"]});
 let output="",errors="";child.stdout.on("data",chunk=>output+=chunk);child.stderr.on("data",chunk=>errors+=chunk);
 const finished=new Promise((resolve,reject)=>{child.on("error",reject);child.on("close",code=>resolve(code));});
 const deadline=Date.now()+5000;let running=false;
 while(Date.now()<deadline) {
  const state=await new Delivery(f.run).load();
  if(state.repos.be.verification_running){running=true;break;}
  await new Promise(resolve=>setTimeout(resolve,20));
 }
 assert.ok(running,"real CLI verifier admitted before note intake");
 await note(f,"A changed while verifier runs",{case_ids:["A"]});
 const code=await finished;
 assert.equal(code,0,errors);
 const result=JSON.parse(output);assert.equal(result.passed,false);assert.equal(result.correction_holds.length,1);
 assert.ok(result.results.every(row=>row.exit_code===0));
 const state=await new Delivery(f.run).load();assert.equal(state.units.A.state,"implemented");assert.equal(state.repos.be.verification_running,undefined);
 let packet=cli(f,"resume");assert.equal(cli(f,"status").publication[0].verification,"held");assert.equal(packet.action.action,"reconcile-correction");
 await resolve(f,packet.corrections.records[0],{disposition:"within-plan",case_ids:["A"]});
 packet=cli(f,"resume");assert.equal(cli(f,"status").publication[0].verification,"held");assert.equal(packet.action.action,"verify");
 const fresh=cli(f,"verify","--repo","be");assert.equal(fresh.passed,true);
 assert.equal(cli(f,"resume").action.action,"review");
});
test("a real failing check remains failed when it also records a correction",async t=>{
 const f=await fixture(t),file=join(f.root,"during-check.md");await writeFile(file,"Assess A after check execution.");
 f.plan.units[0].checks[0].argv=[process.execPath,"-e",
  `require("node:child_process").execFileSync(${JSON.stringify(process.execPath)},${JSON.stringify([cliFile,"alignment-note","--run",f.run,"--file",file,"--cases","A"])});process.exit(1)`];
 await f.call("replan",f.plan);await f.call("approvePlan",(await f.call("status")).plan_hash,f.approval);
 await f.implement("A");await f.implement("B");
 const result=cli(f,"verify","--repo","be");
 assert.equal(result.passed,false);assert.equal(result.correction_holds.length,1);
 assert.equal(result.results[0].exit_code,1);assert.equal(cli(f,"status").publication[0].verification,"failed");
 const packet=cli(f,"resume");await resolve(f,packet.corrections.records[0],{disposition:"within-plan",case_ids:["A"]});
 assert.equal(cli(f,"resume").action.action,"verification-failed");
});
