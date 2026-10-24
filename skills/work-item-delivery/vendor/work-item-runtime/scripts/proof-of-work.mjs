#!/usr/bin/env node
import { renderProof } from "./proof-markdown.mjs";
import { readFile, writeFile, mkdir, realpath, lstat, stat, access } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, relative, isAbsolute, sep, join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { Delivery, validatePlan } from "../lib/delivery.mjs";
import { procedureBinding, latestCapture } from "../lib/evidence.mjs";
import { parseTestReport } from "./test-report.mjs";

const need=(condition,message)=>{if(!condition) throw new Error(message);};
const text=value=>typeof value==="string"&&Boolean(value.trim());
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const key=row=>JSON.stringify([row.unit,row.check]);
const implemented=new Set(["implemented","verified","reviewed","published"]);
const git=(path,...args)=>execFileSync("git",["-C",path,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
const array=(value,label)=>{need(Array.isArray(value),label+" must be an array");return value;};
const unique=(rows,label)=>need(new Set(rows).size===rows.length,"Duplicate "+label);

async function inputs(run,repo,file) {
  const ledgerPath=join(resolve(run),"delivery.json"),ledgerBytes=await readFile(ledgerPath);
  const state=JSON.parse(ledgerBytes);validatePlan(state.plan);
  const delivery=new Delivery(run);
  await delivery.requireApproval(state);
  const workspace=delivery.workspace(state,repo,{clean:true});
  const units=state.plan.units.filter(unit=>unit.repo===repo);
  need(!state.repos[repo].verification_running&&!units.some(unit=>state.units[unit.id].state==="active"),"Finish active verification/writers before gathering proof");
  need(await delivery.dependenciesReady(state,units.filter(unit=>implemented.has(state.units[unit.id].state)),{certifyingRepo:repo}),"Dependency evidence is stale or blocked");
  const scopeBytes=await readFile(file),scope=JSON.parse(scopeBytes);
  need(scope.schema==="work-item-delivery.proof.v1"&&scope.repository===repo&&scope.plan_hash===state.plan_hash,"Proof scope schema/repository/plan mismatch");
  need(["local","local-fixture","local-real-data"].includes(scope.environment),"Declare the local evidence environment");
  const planned=units.flatMap(unit=>unit.checks.map(check=>({unit:unit.id,check:check.id,definition:check,case_ids:unit.case_ids})));
  unique(planned.map(key),"approved check identity");
  const mapped=array(scope.checks,"Scoped checks");unique(mapped.map(key),"scoped check identity");
  need(mapped.length===planned.length&&mapped.length>0,"Scope must map every approved repository check");
  for(const row of mapped) {
    const expected=planned.find(check=>key(check)===key(row));
    need(expected&&["unit","regression","blast-radius"].includes(row.kind)&&["tap","jest-json"].includes(row.format),"Unknown check/type/report format");
    need(array(row.case_ids,"Check case IDs").length&&row.case_ids.every(id=>expected.case_ids.includes(id)),"Check has missing or foreign case IDs");
    unique(row.case_ids,"mapped case ID");
  }
  if(scope.blast_radius) {
    need(text(scope.blast_radius.fact),"Blast-radius safety fact is required");
    const refs=array(scope.blast_radius.checks,"Blast-radius checks");unique(refs.map(key),"blast-radius check reference");
    need(refs.every(row=>mapped.some(check=>key(row)===key(check))),"Blast-radius references unknown check");
    for(const field of ["references","risks","cleared"]) need(array(scope.blast_radius[field],"Blast-radius "+field).every(text),"Invalid blast-radius prose");
  }
  const caseIds=[...new Set(units.flatMap(unit=>unit.case_ids))];
  for(const row of array(scope.observations??[],"Observations")) {
    need(caseIds.includes(row.case_id)&&["before","after"].includes(row.phase)&&row.environment===scope.environment&&text(row.expected)&&text(row.actual),"Invalid authored observation");
    need(/^[a-f0-9]{40,64}$/.test(row.head),"Observation requires source commit identity");
    git(workspace.path,"merge-base","--is-ancestor",row.head,workspace.head);
    need(row.phase!=="after"||row.head===workspace.head,"After observation is for a stale source head");
    await receipt(row.artifact,"Observation");
    if(row.test) await receipt(row.test,"Observation test snapshot");
    await classifyObservation(row,state,repo,workspace.head);
  }
  return {run,repo,file,ledgerPath,ledgerBytes,scopeBytes,state,delivery,workspace,units,planned,scope,caseIds};
}

async function receipt(record,label) {
  need(record&&text(record.path)&&/^[a-f0-9]{64}$/.test(record.sha256),label+": invalid artifact receipt");
  const path=await realpath(record.path),bytes=await readFile(path);
  need(bytes.length&&sha(bytes)===record.sha256&&(record.bytes===undefined||record.bytes===bytes.length),label+": missing/changed artifact bytes");
  return {path,sha256:record.sha256,bytes:bytes.length,content:bytes.toString("utf8")};
}

async function classifyObservation(row,state,repo,head) {
  if(row.kind===undefined) return {classification:"unclassified",eligible:false,classification_gap:"Legacy observation has no product-action provenance"};
  need(["automated","product-action"].includes(row.kind),"Unknown observation kind");
  if(row.executor!==undefined) need(["agent","human"].includes(row.executor?.kind)&&text(row.executor?.id),"Invalid observation executor");
  if(row.kind==="automated") return row.executor?{classification:"automated",eligible:false}:{classification:"unclassified",eligible:false,classification_gap:"Automated observation has no executor attribution"};
  if(!row.executor||!row.procedure||!row.execution) return {classification:"unclassified",eligible:false,classification_gap:"Product-action attribution, procedure or execution receipt missing"};
  need(["ui","api","cli"].includes(row.surface),"Product-action surface must be ui, api or cli");
  need(row.procedure.sha256===await procedureBinding(state.plan,repo,row.case_id,row.procedure.flow_id),"Product procedure differs from approved case/flow/source contents");
  need(!row.test,"Test snapshots are supporting evidence, not product-action execution");
  const automatedLogs=state.repos[repo].verification?.results?.map(item=>item.evidence.sha256)??[];
  need(!automatedLogs.includes(row.artifact.sha256)&&!automatedLogs.includes(row.execution.sha256),"Automated verification log cannot supply product-action execution");
  const execution=JSON.parse((await receipt(row.execution,"Product execution transcript")).content);
  need(execution.schema==="work-item-delivery.product-execution.v1","Invalid product execution transcript schema");
  for(const field of ["case_id","phase","environment","head","surface","outcome"]) need(execution[field]===row[field],"Product execution transcript differs from observation "+field);
  for(const field of ["executor","procedure"]) need(JSON.stringify(execution[field])===JSON.stringify(row[field]),"Product execution transcript differs from observation "+field);
  need(["observed","passed","failed","blocked"].includes(row.outcome),"Product execution outcome required");
  const actions=array(execution.actions,"Executed product actions");
  need(actions.length>0&&actions.every(action=>text(action.action)&&text(action.expected)&&text(action.actual)),"Record concrete product actions and observed results");
  for(const action of actions) {
    if(row.surface==="cli") {
      need(Array.isArray(action.argv)&&action.argv.length>0&&action.argv.every(text)&&Number.isInteger(action.exit_code)&&typeof action.stdout==="string"&&typeof action.stderr==="string","CLI execution needs actual argv, exit and output");
      need(!action.argv.some(arg=>/^(--test(?:=.*)?|--test-reporter(?:=.*)?|jest|vitest|mocha|tap)$/.test(arg)||/(?:^|\/)(?:jest|vitest|mocha)(?:\.[cm]?js)?$/.test(arg)),"Automated test runner is supporting evidence");
    }
    if(row.surface==="api") need(text(action.method)&&/^https?:\/\//.test(action.url)&&Object.hasOwn(action,"request")&&Number.isInteger(action.status)&&Object.hasOwn(action,"response"),"API execution needs actual request/status/response");
  }
  need(actions.some(action=>action.expected===row.expected&&action.actual===row.actual),"Observation expected/actual must resolve to an executed action");
  if(row.surface==="ui") {
    const capture=state.plan.capture_plan?.find(c=>c.id===row.capture_id&&c.repo===repo&&c.tool==="playwright"&&c.case_ids.includes(row.case_id));
    need(capture,"Product UI observation has no matching approved capture");
    const latest=await latestCapture(state,capture,head,row.phase);
    need(latest&&row.capture_receipt?.sha256===latest.evidence.sha256&&row.capture_receipt?.path===latest.evidence.path,"Product UI observation must resolve to the latest valid capture receipt");
    need(latest.git_head===row.head&&latest.environment===row.environment&&latest.observed===row.actual&&latest.outcome===row.outcome,"Product UI observation differs from capture source/result");
    need(latest.artifacts.some(a=>a.sha256===row.artifact.sha256&&a.path===row.artifact.path),"Product UI artifact differs from capture receipt");
    await receipt(row.capture_receipt,"Product UI capture receipt");
  }
  const eligible=row.phase==="before"?["observed","passed"].includes(row.outcome):row.outcome==="passed";
  return {classification:"product-action",eligible,actions,...(!eligible?{classification_gap:"Outcome "+row.outcome+" does not complete the "+row.phase+" phase"}:{})};
}

export async function collectProof(run,repo,file) {
  const context=await inputs(run,repo,file);
  const {state,scope,planned,units,workspace,caseIds}=context;
  const verification=state.repos[repo].verification;
  need(verification&&verification.head===workspace.head,"No verification for the current source head");
  need(verification.source_unchanged===true,"Source changed while checks ran");
  const expected=planned.filter(row=>implemented.has(state.units[row.unit].state));
  const results=array(verification.results,"Verification results");unique(results.map(key),"executed check identity");
  need(results.length===expected.length&&results.length>0&&results.every(row=>expected.some(check=>key(row)===key(check))),"Missing/unknown executed checks");
  const checks=[];
  for(const item of results) {
    const plan=planned.find(row=>key(row)===key(item)),mapping=scope.checks.find(row=>key(row)===key(item));
    const log=await receipt(item.evidence,"Check log");
    const match=/^COMMAND ([^\n]+)\nEXIT ([^\n]+)\n/.exec(log.content);
    need(match&&JSON.stringify(JSON.parse(match[1]))===JSON.stringify(plan.definition.argv)&&match[2]===String(item.exit_code),"Log command/exit contradicts approved check");
    let report;
    try {report=parseTestReport(log.content.slice(match[0].length),mapping.format);}
    catch(error) {report={status:"INCOMPLETE",counts:null,reason:error.message};}
    if(item.exit_code!==0) report.status="FAILED";
    const {content,...evidence}=log;
    checks.push({...mapping,argv:plan.definition.argv,purpose:plan.definition.purpose,exit_code:item.exit_code,report,evidence});
  }
  const gaps=[];
  if(verification.passed!==true) gaps.push("Recorded verification did not pass");
  for(const unit of units) if(!implemented.has(state.units[unit.id].state)) gaps.push("Unit "+unit.id+" is not implemented");
  for(const blocker of state.blockers.filter(row=>!row.resolved&&row.units.some(id=>units.some(unit=>unit.id===id)))) gaps.push("Unresolved blocker "+blocker.id);
  for(const check of checks) if(check.report.status!=="PASSED") gaps.push("Check "+check.unit+"/"+check.check+" is "+check.report.status);
  for(const kind of ["unit","regression"]) if(!checks.some(row=>row.kind===kind&&row.report.status==="PASSED")) gaps.push("No passing "+kind+" test evidence");
  const cases=caseIds.map(id=>{
    const mapped=checks.filter(row=>row.case_ids.includes(id));
    const passed=mapped.length>0&&mapped.every(row=>row.report.status==="PASSED");
    if(!passed) gaps.push("Case "+id+" has incomplete authored check mapping/results");
    return {id,checks:mapped.map(row=>({unit:row.unit,check:row.check})),status:passed?"MAPPED_CHECKS_PASSED":"INCOMPLETE"};
  });
  let blast_radius={status:"UNPROVEN",fact:null,checks:[],references:[],risks:[],cleared:[]};
  if(scope.blast_radius) {
    const supported=scope.blast_radius.checks.length>0&&scope.blast_radius.checks.every(ref=>checks.some(row=>key(row)===key(ref)&&row.report.status==="PASSED"));
    blast_radius={...scope.blast_radius,status:supported?"SUPPORTED_BY_CHECKS":"UNPROVEN"};
    if(!supported) gaps.push("Blast-radius safety fact remains unproven");
  } else gaps.push("No blast-radius safety fact/check supplied");
  const observations=[];
  for(const row of scope.observations??[]) {
    const {content,...artifact}=await receipt(row.artifact,"Observation");
    let test;
    if(row.test) {const {content,...value}=await receipt(row.test,"Observation test snapshot");test=value;}
    observations.push({...row,artifact,...(test?{test}:{}),...await classifyObservation(row,state,repo,workspace.head)});
  }
  const acceptanceCases=caseIds.map(id=>{
    const requirement=state.plan.cases.find(row=>row.id===id);
    const flows=(state.plan.knowledge?.business_flows??[]).filter(row=>row.case_ids.includes(id));
    const captures=(state.plan.capture_plan??[]).filter(row=>row.repo===repo&&row.case_ids.includes(id));
    const recorded=observations.filter(row=>row.case_id===id&&row.eligible),missing=[];
    if(!flows.length) missing.push("No approved role/action/expected-result procedure recorded");
    for(const phase of ["before","after"]) if(!recorded.some(row=>row.phase===phase)) missing.push("No recorded "+phase+" observation for this case");
    return {id,title:requirement.title,expected:requirement.expected,
      sources:requirement.source_refs.map(id=>{const source=state.plan.sources.find(row=>row.id===id);return {id,url:source.url,section:source.section,revision:source.revision};}),
      flows,captures,observations:recorded,status:missing.length?"INCOMPLETE":"RECORDED_REQUIRES_REVIEW",gaps:missing};
  });
  const acceptance={status:acceptanceCases.some(row=>row.gaps.length)?"INCOMPLETE":"RECORDED_REQUIRES_REVIEW",cases:acceptanceCases};
  const final=await inputs(run,repo,file);
  need(final.ledgerBytes.equals(context.ledgerBytes)&&final.scopeBytes.equals(context.scopeBytes)&&final.workspace.head===workspace.head,"Evidence context changed during collection");
  const index={schema:"work-item-delivery.proof-index.v1",status:gaps.length?"CHECKS_INCOMPLETE":"CHECKS_PASSED",work_item:state.plan.work_item,
    repository:repo,workspace:workspace.path,head:workspace.head,plan_hash:state.plan_hash,environment:scope.environment,
    input_sha256:{ledger:sha(context.ledgerBytes),scope:sha(context.scopeBytes)},checks,cases,blast_radius,observations,gaps,acceptance,
    limits:["Case mappings, safety facts and observations are authored; test quality/acceptance is not certified",
      "Counts are observed runner results, not inferred assertions; skips/todos remain gaps",
      "Local private artifacts are not uploaded PR attachments; review before sharing",
      "SIT/deployment, real model execution and human consent provenance are not certified"]};
  const markdown=renderProof(index);
  index.draft_utf16_units=markdown.length;
  return {index,outputs:{"evidence-index.json":Buffer.from(JSON.stringify(index,null,2)+"\n"),"proof-of-works.md":Buffer.from(markdown)}};
}

async function resolvedDestination(path) {
  try {return await realpath(path);} catch(error) {if(error.code!=="ENOENT") throw error;return join(await resolvedDestination(dirname(path)),relative(dirname(path),path));}
}

async function preflightOutput(directory,state,execute,check) {
  need(!(execute&&check),"--execute and --check are mutually exclusive");
  const destination=await resolvedDestination(resolve(directory));
  for(const root of [...state.plan.repositories.map(row=>row.path),...Object.values(state.repos).map(row=>row.path)]) {
    const relation=relative(await realpath(root),destination);
    need(relation!==""&&(relation===".."||relation.startsWith(".."+sep)||isAbsolute(relation)),"Keep proof outputs outside every product workspace");
  }
  let existing=0;
  for(const name of ["evidence-index.json","proof-of-works.md"]) {
    try {const info=await lstat(join(directory,name));need(info.isFile()&&!info.isSymbolicLink(),"Refusing non-file/symlink output");existing++;}
    catch(error) {if(error.code!=="ENOENT") throw error;}
  }
  need(existing===0||existing===2,"Partial bundle exists; preserve it and choose a new output directory");
  need(!execute||existing===0,"Choose a fresh output directory before --execute");
  if(execute) {
    let parent=destination;
    for(;;) {
      try {need((await stat(parent)).isDirectory(),"Output parent must be a directory");await access(parent,constants.W_OK|constants.X_OK);break;}
      catch(error) {if(error.code!=="ENOENT") throw error;parent=dirname(parent);}
    }
  }
}

export async function writeProof(outputs,directory,check=false) {
  for(const [name,bytes] of Object.entries(outputs)) {
    try {const info=await lstat(join(directory,name));need(info.isFile()&&!info.isSymbolicLink(),"Refusing non-file/symlink output");need((await readFile(join(directory,name))).equals(bytes),"Output differs; inspect it or choose a new output directory: "+name);}
    catch(error) {if(error.code!=="ENOENT") throw error;need(!check,"Required proof output missing: "+name);}
  }
  if(!check) {
    await mkdir(directory,{recursive:true,mode:0o700});
    for(const [name,bytes] of Object.entries(outputs)) {
      try {await writeFile(join(directory,name),bytes,{flag:"wx",mode:0o600});}
      catch(error) {if(error.code!=="EEXIST"||!(await readFile(join(directory,name))).equals(bytes)) throw error;}
    }
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const {values:v}=parseArgs({options:{run:{type:"string"},repo:{type:"string"},file:{type:"string"},out:{type:"string"},execute:{type:"boolean"},check:{type:"boolean"}}});
    need(v.run&&v.repo&&v.file&&v.out,"Required: --run RUN --repo REPO --file SCOPE --out OUTPUT");
    const context=await inputs(v.run,v.repo,v.file);
    await preflightOutput(v.out,context.state,v.execute,v.check);
    if(v.execute) await new Delivery(v.run).verify(v.repo);
    const result=await collectProof(v.run,v.repo,v.file);
    await writeProof(result.outputs,v.out,v.check);
    console.log(JSON.stringify({status:result.index.status,acceptance:result.index.acceptance.status,
      acceptance_gaps:result.index.acceptance.cases.filter(row=>row.gaps.length).map(row=>({case_id:row.id,gaps:row.gaps})),
      head:result.index.head,checks:result.index.checks.length,gaps:result.index.gaps,out:resolve(v.out)}));
    if(result.index.status!=="CHECKS_PASSED") process.exitCode=1;
  } catch(error) {console.error("INCOMPLETE: "+error.message);process.exitCode=1;}
}
