import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { procedureBinding } from "../lib/evidence.mjs";
import { Delivery } from "../lib/delivery.mjs";
import { admitFixture } from "./investigation-fixture.mjs";

export const digest = bytes => createHash("sha256").update(bytes).digest("hex");
export const git = (path,...args) => execFileSync("git",["-C",path,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
// Node otherwise skips nested test runs inherited from this fixture's parent runner.
const testArgv = file => ["env","-u","NODE_TEST_CONTEXT",process.execPath,"--test","--test-reporter=tap",file];

export async function proofFixture(t, {verify = true, parent = tmpdir(), configurePlan = () => {}, productActions = false, ui = false} = {}) {
  const root=await mkdtemp(join(parent,"proof-fixture-"));
  if(t) t.after(()=>rm(root,{recursive:true,force:true}));
  const repo=join(root,"repo"),run=join(root,"run"),scopeFile=join(root,"scope.json");
  await mkdir(repo);
  git(repo,"init","-b","develop");git(repo,"config","user.name","Synthetic Fixture");git(repo,"config","user.email","fixture@example.invalid");
  await writeFile(join(repo,"app.mjs"),"export const select = items => items.map(item => item.id);\n");
  await writeFile(join(repo,"unit.test.mjs"),"import test from 'node:test'; import assert from 'node:assert/strict'; import {select} from './app.mjs'; test('active item is returned',()=>assert.deepEqual(select([{id:'A',active:true}]),['A']));\n");
  await writeFile(join(repo,"regression.test.mjs"),"import test from 'node:test'; import assert from 'node:assert/strict'; import {select} from './app.mjs'; test('inactive item is excluded',()=>assert.deepEqual(select([{id:'A',active:true},{id:'B',active:false}]),['A']));\n");
  await writeFile(join(repo,"consumer.mjs"),"import {select} from './app.mjs'; console.log(JSON.stringify(select(JSON.parse(process.argv[2]))));\n");
  git(repo,"add",".");git(repo,"commit","-m","synthetic faulty baseline");
  const baseline=git(repo,"rev-parse","HEAD");git(repo,"checkout","-b","fix/100-proof-fixture");
  const source=join(root,"source.txt"),approval=join(root,"approval.txt");
  await writeFile(source,"Synthetic selection consumer requirements. Return active A and exclude inactive B. Not a live Work Item.");
  await writeFile(approval,"Synthetic fixture approval, never real user consent.");
  const plan=JSON.parse(await readFile(new URL("../templates/plan.example.json",import.meta.url),"utf8"));
  plan.sources.forEach(row=>row.snapshot=source);
  plan.repositories=[{id:"backend",path:repo,base_ref:"develop",base_sha:baseline,branch:"fix/100-proof-fixture"}];
  plan.units=[{...plan.units[0],case_ids:["C1","C2"],depends_on:[],allowed_paths:["app.mjs"],checks:[
    {id:"unit",argv:testArgv("unit.test.mjs"),purpose:"Active items remain visible",timeout_ms:10000},
    {id:"regression",argv:testArgv("regression.test.mjs"),purpose:"Inactive items never reach the consumer",timeout_ms:10000}],
    unit_test_plan:{check_ids:["unit","regression"],assertions:["A is visible and B is excluded"],before:"Assert expected A versus actual A,B",after:"The unchanged assertion passes after filtering inactive items"}}];
  plan.blockers=[];
  plan.capture_plan=[{id:"fixture",repo:"backend",case_ids:["C1","C2"],tool:"not-applicable",reason:"Synthetic backend test-tool fixture has no UI"}];
  Object.assign(plan.cases.find(row=>row.id==="C1"),{title:"Active items remain visible",expected:"Active A is returned to the consumer"});
  Object.assign(plan.cases.find(row=>row.id==="C2"),{title:"Inactive items are excluded",expected:"Only active A is returned to the consumer"});
  plan.knowledge.business_flows=[{id:"selection",case_ids:["C1","C2"],actor:"Selection consumer",trigger:"Select active items from supplied data",preconditions:["Data contains active A and inactive B"],steps:[{action:"Invoke consumer.mjs with JSON items A active and B inactive",business_rule:"Only A",source_refs:plan.cases.find(row=>row.id==="C2").source_refs}],outcome:"The consumer receives only A"}];
  if(ui) plan.capture_plan=[{id:"fixture",repo:"backend",case_ids:["C1"],tool:"not-applicable",reason:"CLI only"},{id:"selection-ui",repo:"backend",case_ids:["C2"],tool:"playwright",environment:"local-fixture",url:"http://localhost:4000",steps:["Open selection"],assertions:["Only A"]}];
  configurePlan(plan);
  const call=async(method,...args)=>{
    if(method==="replan") await admitFixture(new Delivery(run),args[0],root);
    return new Delivery(run)[method](...args);
  };
  await admitFixture(new Delivery(run),plan,root);
  const initialized=await call("init",plan);
  await call("approvePlan",initialized.plan_hash,approval);
  const argv=testArgv("regression.test.mjs"),red=spawnSync(argv[0],argv.slice(1),{cwd:repo,encoding:"utf8"});
  assert.equal(red.status,1,red.stdout+red.stderr);assert.match(red.stdout,/Expected values to be strictly deep-equal/);assert.match(red.stdout,/\+\s+'B'/);
  const before=join(root,"before.log"),testSnapshot=join(root,"regression-test-snapshot.mjs");
  await writeFile(before,red.stdout+red.stderr);await copyFile(join(repo,"regression.test.mjs"),testSnapshot);
  const productRecords=[];
  const executeProduct=async(phase,head)=>{
    const argv=[process.execPath,"consumer.mjs",JSON.stringify([{id:"A",active:true},{id:"B",active:false}])];
    const result=spawnSync(argv[0],argv.slice(1),{cwd:repo,encoding:"utf8"});assert.equal(result.status,0);
    const actual=JSON.parse(result.stdout).join(",")==="A"?"Only A":JSON.parse(result.stdout).join(",");
    const artifact=join(root,"consumer-"+phase+".log");await writeFile(artifact,result.stdout);
    let row={kind:"product-action",case_id:"C2",phase,environment:"local-fixture",head,expected:"Only A",actual,surface:ui?"ui":"cli",outcome:phase==="before"?"observed":"passed",executor:{kind:"agent",id:"fixture-agent"},procedure:{flow_id:"selection",sha256:await procedureBinding(plan,"backend","C2","selection")},artifact:await receipt(artifact)};
    if(ui) {
      const screenshot=join(root,phase+".png");await writeFile(screenshot,Buffer.from([137,80,78,71,13,10,26,10,0]));
      const input={capture_id:"selection-ui",tool:"playwright",phase,environment:row.environment,url:"http://localhost:4000",captured_at:phase==="before"?"2026-10-24T01:00:00Z":"2026-10-24T02:00:00Z",observed:actual,locale:"en",timezone:"UTC",viewport:{width:800,height:600},steps:["Open selection"],outcome:row.outcome,git_head:head,assertions:phase==="after"?[{expected:"Only A",actual,passed:true}]:[],artifacts:[{kind:"screenshot",path:screenshot}]};
      const captureFile=join(root,"capture-"+phase+".json");await writeFile(captureFile,JSON.stringify(input));
      const capture=await call("recordCapture",captureFile);row.capture_id=input.capture_id;row.capture_receipt=capture.evidence;row.artifact=await receipt(screenshot);
    }
    const execution={schema:"work-item-delivery.product-execution.v1",...Object.fromEntries(["case_id","phase","environment","head","surface","outcome","executor","procedure"].map(key=>[key,row[key]])),actions:[{action:ui?"Open selection in fixture UI":"Invoke consumer.mjs with active A and inactive B",expected:row.expected,actual,argv,exit_code:result.status,stdout:result.stdout,stderr:result.stderr}]};
    const path=join(root,"product-execution-"+phase+".json");await writeFile(path,JSON.stringify(execution));row.execution=await receipt(path);productRecords.push(row);
  };
  const receipt=async path=>({path,sha256:digest(await readFile(path))});
  if(productActions||ui) await executeProduct("before",baseline);
  await call("start","U1","fixture");
  await writeFile(join(repo,"app.mjs"),"export const select = items => items.filter(item => item.active).map(item => item.id);\n");
  git(repo,"add","app.mjs");git(repo,"commit","-m","exclude inactive items");
  await call("finish","U1","fixture",source);
  if(productActions||ui) await executeProduct("after",git(repo,"rev-parse","HEAD"));
  const scope={schema:"work-item-delivery.proof.v1",repository:"backend",plan_hash:initialized.plan_hash,environment:"local-fixture",
    checks:[{unit:"U1",check:"unit",kind:"unit",format:"tap",case_ids:["C1"]},
      {unit:"U1",check:"regression",kind:"regression",format:"tap",case_ids:["C2"]}],
    blast_radius:{fact:"Inactive items never reach the consumer",checks:[{unit:"U1",check:"regression"}],references:["app.mjs:1"],risks:[],cleared:["Active-item behavior remains covered by the unit check"]},
    observations:[{kind:"automated",executor:{kind:"agent",id:"fixture-runner"},case_id:"C2",phase:"before",environment:"local-fixture",head:baseline,expected:"Only A",actual:"A,B",artifact:await receipt(before),test:await receipt(testSnapshot)}]};
  if(verify) {
    const result=await call("verify","backend");assert.equal(result.passed,true);
    scope.observations.push({kind:"automated",executor:{kind:"agent",id:"fixture-runner"},case_id:"C2",phase:"after",environment:"local-fixture",head:result.head,expected:"Only A",actual:"Only A",
      artifact:result.results.find(row=>row.check==="regression").evidence,test:await receipt(testSnapshot)});
  }
  scope.observations.push(...productRecords);
  await writeFile(scopeFile,JSON.stringify(scope,null,2)+"\n");
  return {root,repo,run,scopeFile,scope,source,plan,call,baseline,saveScope:()=>writeFile(scopeFile,JSON.stringify(scope,null,2)+"\n")};
}
