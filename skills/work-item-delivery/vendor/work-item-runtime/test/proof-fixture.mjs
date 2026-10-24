import { admitFixture } from "./investigation-fixture.mjs";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { Delivery } from "../lib/delivery.mjs";

export const digest = bytes => createHash("sha256").update(bytes).digest("hex");
export const git = (path,...args) => execFileSync("git",["-C",path,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
// Node otherwise skips nested test runs inherited from this fixture's parent runner.
const testArgv = file => ["env","-u","NODE_TEST_CONTEXT",process.execPath,"--test","--test-reporter=tap",file];

export async function proofFixture(t, {verify = true, parent = tmpdir()} = {}) {
  const root=await mkdtemp(join(parent,"proof-fixture-"));
  if(t) t.after(()=>rm(root,{recursive:true,force:true}));
  const repo=join(root,"repo"),run=join(root,"run"),scopeFile=join(root,"scope.json");
  await mkdir(repo);
  git(repo,"init","-b","develop");git(repo,"config","user.name","Synthetic Fixture");git(repo,"config","user.email","fixture@example.invalid");
  await writeFile(join(repo,"app.mjs"),"export const select = items => items.map(item => item.id);\n");
  await writeFile(join(repo,"unit.test.mjs"),"import test from 'node:test'; import assert from 'node:assert/strict'; import {select} from './app.mjs'; test('active item is returned',()=>assert.deepEqual(select([{id:'A',active:true}]),['A']));\n");
  await writeFile(join(repo,"regression.test.mjs"),"import test from 'node:test'; import assert from 'node:assert/strict'; import {select} from './app.mjs'; test('inactive item is excluded',()=>assert.deepEqual(select([{id:'A',active:true},{id:'B',active:false}]),['A']));\n");
  git(repo,"add",".");git(repo,"commit","-m","synthetic faulty baseline");
  const baseline=git(repo,"rev-parse","HEAD");git(repo,"checkout","-b","fix/100-proof-fixture");
  const source=join(root,"source.txt"),approval=join(root,"approval.txt");
  await writeFile(source,"Synthetic test-tool fixture requirements, not a live Work Item.");
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
  await call("start","U1","fixture");
  await writeFile(join(repo,"app.mjs"),"export const select = items => items.filter(item => item.active).map(item => item.id);\n");
  git(repo,"add","app.mjs");git(repo,"commit","-m","exclude inactive items");
  await call("finish","U1","fixture",source);
  const receipt=async path=>({path,sha256:digest(await readFile(path))});
  const scope={schema:"work-item-delivery.proof.v1",repository:"backend",plan_hash:initialized.plan_hash,environment:"local-fixture",
    checks:[{unit:"U1",check:"unit",kind:"unit",format:"tap",case_ids:["C1"]},
      {unit:"U1",check:"regression",kind:"regression",format:"tap",case_ids:["C2"]}],
    blast_radius:{fact:"Inactive items never reach the consumer",checks:[{unit:"U1",check:"regression"}],references:["app.mjs:1"],risks:[],cleared:["Active-item behavior remains covered by the unit check"]},
    observations:[{case_id:"C2",phase:"before",environment:"local-fixture",head:baseline,expected:"Only A",actual:"A,B",artifact:await receipt(before),test:await receipt(testSnapshot)}]};
  if(verify) {
    const result=await call("verify","backend");assert.equal(result.passed,true);
    scope.observations.push({case_id:"C2",phase:"after",environment:"local-fixture",head:result.head,expected:"Only A",actual:"Only A",
      artifact:result.results.find(row=>row.check==="regression").evidence,test:await receipt(testSnapshot)});
  }
  await writeFile(scopeFile,JSON.stringify(scope,null,2)+"\n");
  return {root,repo,run,scopeFile,scope,source,plan,call,baseline,saveScope:()=>writeFile(scopeFile,JSON.stringify(scope,null,2)+"\n")};
}
