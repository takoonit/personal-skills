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

export async function preparation(t, {gap=false, challenge=false}={}) {
  const f=await fixture(t,{uninitialized:true}),call=raw(f),definition=definitionFixture(f.plan);
  await call("investigate",definition);
  for (const unit of f.plan.units) {
    const brief=await call("investigationBrief",unit.id),report=reportFixture(brief,unit);
    if(gap&&unit.id==="A") report.gaps.push({id:"missing",statement:"Unknown requirement",case_ids:["A"],source_refs:["ticket"],limitations:[],owner:"BA",unblock_when:"BA supplies a cited answer"});
    await call("investigationReport",unit.id,await write(join(f.root,unit.id+".json"),report));
  }
  const cb=await call("investigationBrief","challenge");
  await call("investigationReport","challenge",await write(join(f.root,"challenge.json"),{task:"challenge",input_hash:cb.input_hash,artifacts:[],
    challenges:challenge?[{id:"counter",statement:"Case A may disagree",case_ids:["A"],source_refs:["ticket"],claim_ids:["A/finding"],limitations:[],kind:"counterexample"}]:[]}));
  const brief=await call("investigationBrief","arbitration");
  const arbitration={input_hash:brief.input_hash,
    claims:f.plan.units.map(u=>({id:u.id+"/finding",status:"accepted",rationale:"Supported by the cited fixture."})),
    gaps:gap?[{id:"A/missing",status:"unresolved",rationale:"Missing authority remains."}]:[],
    challenges:challenge?[{id:"challenge/counter",status:"unresolved",rationale:"Counterexample needs evidence."}]:[],
    bindings:f.plan.units.map(u=>{
      u.investigation={claim_ids:[u.id+"/finding"]};
      return {unit:u.id,...u.investigation,...Object.fromEntries(["case_ids","source_refs","finding","finding_status","acceptance"].map(k=>[k,u[k]])),cases:f.plan.cases.filter(c=>u.case_ids.includes(c.id))};
    })};
  const reconcile=async()=>{
    const view=await call("arbitrate",await write(join(f.root,"arbitration.json"),arbitration));
    f.plan.schema="work-item-delivery.plan.v3";f.plan.admission={dossier:view.dossier};
    await designFixture(new Delivery(f.run),f.plan,f.root);
    return view;
  };
  return {...f,call,definition,arbitration,reconcile};
}
