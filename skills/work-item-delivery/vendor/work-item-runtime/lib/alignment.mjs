import {readFile,writeFile,mkdir,lstat,rename} from "node:fs/promises";
import {join} from "node:path";
import {randomUUID} from "node:crypto";
import {assert,sha,canonical,atomic,text} from "./delivery-common.mjs";

const SCHEMA="work-item-delivery.corrections.v1";
const digest=value=>sha(canonical(value));
async function bytesAt(path,optional=false) {
 try {
  const entry=await lstat(path);
  assert(entry.isFile()&&!entry.isSymbolicLink(),`correction file must be a regular file: ${path}`);
  return await readFile(path);
 } catch(error) {if(optional&&error.code==="ENOENT")return null;throw error;}
}
async function archive(run,bytes) {
 const directory=join(run.directory,"alignments");
 await mkdir(directory,{recursive:true,mode:0o700});
 const entry=await lstat(directory);
 assert(entry.isDirectory()&&!entry.isSymbolicLink(),"alignment archive directory must be a real directory");
 const note={sha256:sha(bytes),bytes:bytes.length},path=join(directory,`${note.sha256}.md`);
 try {await writeFile(path,bytes,{flag:"wx",mode:0o600});} catch(error) {if(error.code!=="EEXIST")throw error;}
 assert(sha(await bytesAt(path))===note.sha256,"immutable alignment archive differs");
 return {...note,path};
}
function makeRecord(note,planHash,previous,options={}) {
 const scope=[...(options.case_ids??[])].sort();
 const identity={note:note.sha256,previous,case_ids:scope,metadata_only:options.metadata_only===true};
 return {id:`correction-${digest(identity).slice(0,24)}`,revision:1,note,intake_plan_hash:planHash,
  previous_note_sha256:previous,state:options.metadata_only?"metadata-only":scope.length?"open":"pending-assessment",
  cases:scope.map(case_id=>({case_id,state:"open"})),history:[],intake:identity};
}
async function storedPlan(run) {
 try {return await run.load();} catch(error) {if(error.code==="ENOENT")return null;throw error;}
}
async function registry(run,planHash=null) {
 const raw=await bytesAt(join(run.directory,"corrections.json"),true);
 const result=raw?JSON.parse(raw):{schema:SCHEMA,revision:0,records:[]};
 assert(result.schema===SCHEMA&&Number.isInteger(result.revision)&&result.revision>=0&&Array.isArray(result.records),"invalid correction registry");
 const ids=new Set();
 for(const row of result.records) {
  assert(typeof row.id==="string"&&!ids.has(row.id)&&Number.isInteger(row.revision)&&row.revision>0,"invalid correction identity/revision");ids.add(row.id);
  assert(["pending-assessment","open","resolved","metadata-only","no-impact"].includes(row.state),"invalid correction state");
  assert(row.note&&/^[a-f0-9]{64}$/.test(row.note.sha256)&&Number.isInteger(row.note.bytes),"invalid correction note");
  assert(Array.isArray(row.cases)&&Array.isArray(row.history),"invalid correction case history");
  assert(row.cases.every(c=>typeof c.case_id==="string"&&["open","resolved"].includes(c.state))&&new Set(row.cases.map(c=>c.case_id)).size===row.cases.length,"invalid correction cases");
  assert(row.state!=="open"||row.cases.some(c=>c.state==="open"),"open correction has unknown scope");
  assert(row.state!=="resolved"||(row.cases.length&&row.cases.every(c=>c.state==="resolved")),"invalid resolved correction");
  assert(!["pending-assessment","metadata-only","no-impact"].includes(row.state)||row.cases.length===0,"invalid unscoped correction");
  const directory=await lstat(join(run.directory,"alignments"));
  assert(directory.isDirectory()&&!directory.isSymbolicLink(),"alignment archive directory must be a real directory");
  const path=join(run.directory,"alignments",`${row.note.sha256}.md`),bytes=await bytesAt(path);
  assert(row.note.path===path&&sha(bytes)===row.note.sha256&&bytes.length===row.note.bytes,"immutable correction note differs");
 }
 const latest=await bytesAt(join(run.directory,"alignment.md"),true);
 if(latest&&!result.records.some(row=>row.note.sha256===sha(latest))) {
  const note={path:join(run.directory,"alignments",`${sha(latest)}.md`),sha256:sha(latest),bytes:latest.length};
  result.records.push({...makeRecord(note,planHash,null),legacy:true});
 }
 return result;
}
async function persist(run,store) {
 for(const row of store.records)if(row.legacy) {
  const bytes=await bytesAt(join(run.directory,"alignment.md"));
  assert(sha(bytes)===row.note.sha256,"legacy correction changed");
  await archive(run,bytes);delete row.legacy;
 }
 store.revision++;
 await atomic(join(run.directory,"corrections.json"),store);
}
function checkScope(cases,plan) {
 assert(Array.isArray(cases)&&cases.length>0&&new Set(cases).size===cases.length,"correction case_ids must be a nonempty unique array");
 assert(cases.every(key=>typeof key==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(key)),"invalid correction case ID");
 if(plan)assert(cases.every(key=>plan.cases.some(row=>row.id===key)),"unknown correction case ID");
}
export const alignment={
 async alignmentNote(file,expectedHash,options={}) {
  return this.locked(async()=>{
   assert(file,"alignment note --file is required");
   const bytes=await bytesAt(file);assert(bytes.length,"alignment note is empty");
   assert(options.metadata_only===undefined||typeof options.metadata_only==="boolean","metadata_only must be boolean");
   assert(!(options.metadata_only&&options.case_ids?.length),"metadata-only cannot carry correction scope");
   const state=await storedPlan(this);
   if(options.case_ids!==undefined)checkScope(options.case_ids,state?.plan);
   const store=await registry(this,state?.plan_hash??null);
   const latest=join(this.directory,"alignment.md"),prior=await bytesAt(latest,true),previous=prior?sha(prior):null;
   const candidate=makeRecord({sha256:sha(bytes),bytes:bytes.length},state?.plan_hash??null,expectedHash??null,options);
   const retry=store.records.find(row=>row.id===candidate.id);
   if(retry) {
    assert(previous===retry.note.sha256||previous===retry.previous_note_sha256,"stale alignment retry");
    if(retry.legacy)await persist(this,store);
    const temporary=join(this.directory,`alignment.${randomUUID()}.tmp`);
    await writeFile(temporary,bytes,{flag:"wx",mode:0o600});await rename(temporary,latest);
    return {id:retry.id,revision:retry.revision,path:latest,sha256:retry.note.sha256,archive:retry.note.path,state:retry.state};
   }
   if(prior)assert(expectedHash===previous,"replacement requires current alignment --hash");
   else assert(!expectedHash,"stale alignment hash: no previous note");
   const note=await archive(this,bytes),row=makeRecord(note,state?.plan_hash??null,previous,options);
   store.records.push(row);await persist(this,store);
   const temporary=join(this.directory,`alignment.${randomUUID()}.tmp`);
   await writeFile(temporary,bytes,{flag:"wx",mode:0o600});await rename(temporary,latest);
   return {id:row.id,revision:row.revision,path:latest,sha256:note.sha256,archive:note.path,state:row.state,
    authority:"Correction intake grants no approval. Reconcile recorded impact against the persisted plan."};
  });
 },
 async correctionView(plan) {
  try {
   const state=await storedPlan(this),store=await registry(this,state?.plan_hash??null);
   const unknown=store.records.filter(row=>row.state==="pending-assessment"||row.cases.some(c=>c.state==="open"&&plan&&!plan.cases.some(p=>p.id===c.case_id)));
   return {...store,unknown_scope:unknown.map(row=>row.id),integrity_hold:null};
  } catch(error) {return {schema:SCHEMA,records:[],unknown_scope:["correction-integrity"],integrity_hold:error.message};}
 },
 async correctionHolds(plan,unitIds) {
  const view=await this.correctionView(plan),requested=new Set(unitIds),holds=[];
  if(view.integrity_hold)return [{id:"correction-integrity",reason:view.integrity_hold,units:[...requested]}];
  for(const row of view.records) {
   if(["resolved","no-impact","metadata-only"].includes(row.state))continue;
   const unknown=view.unknown_scope.includes(row.id);
   const cases=new Set(row.cases.filter(c=>c.state==="open").map(c=>c.case_id));
   const affected=new Set(unknown?(plan?.units??[]).map(u=>u.id):(plan?.units??[]).filter(u=>u.case_ids.some(c=>cases.has(c))).map(u=>u.id));
   let changed=true;
   while(changed) {changed=false;for(const u of plan?.units??[])if(!affected.has(u.id)&&u.depends_on.some(d=>affected.has(d.unit))){affected.add(u.id);changed=true;}}
   const units=[...requested].filter(id=>affected.has(id));
   if(units.length||(!plan&&unknown))holds.push({id:row.id,reason:unknown?"correction pending scope assessment":"unresolved correction cases",case_ids:[...cases],units});
  }
  return holds;
 },
 async requireNoCorrections(state,unitIds,operation) {
  const holds=await this.correctionHolds(state.plan,unitIds);
  assert(!holds.length,`${operation}: correction reconciliation required: ${JSON.stringify(holds)}`);
 },
 async reconcileCorrection(file) {
  return this.locked(async()=>{
   const request=JSON.parse(await bytesAt(file)),state=await storedPlan(this),store=await registry(this,state?.plan_hash??null);
   const row=store.records.find(row=>row.id===request.id);assert(row,"unknown correction ID");
   assert(request.note_sha256===row.note.sha256,"stale correction note");
   const requestHash=digest(request);
   if(row.history.at(-1)?.request_sha256===requestHash)return row;
   assert(request.expected_revision===row.revision,"stale correction revision");
   assert(request.plan_hash===(state?.plan_hash??null),"correction resolution requires the current persisted plan hash");
   if(state)assert(await this.fingerprint(state.plan)===state.plan_hash,"current persisted plan inputs changed; adopt the plan before correction resolution");
   text(request.explanation,"correction explanation");
   const disposition=request.disposition;
   assert(["scope","no-impact","metadata-only","within-plan","adopted-plan"].includes(disposition),"invalid correction disposition");
   assert(["pending-assessment","open"].includes(row.state),"correction already resolved");
   if(disposition==="scope") {
    assert(row.state==="pending-assessment","correction scope already assessed");checkScope(request.case_ids,state?.plan);
    row.cases=request.case_ids.map(case_id=>({case_id,state:"open"}));row.state="open";
   } else if(disposition==="metadata-only"||(disposition==="no-impact"&&row.state==="pending-assessment")) {
    assert(row.state==="pending-assessment","scoped corrections require per-case dispositions");row.state=disposition;
   } else {
    assert(state,"correction reconciliation requires a persisted plan");
    checkScope(request.case_ids,disposition==="no-impact"?null:state.plan);
    assert(row.state==="open","assess correction scope before resolving cases");
    assert(request.case_ids.every(id=>row.cases.some(c=>c.case_id===id&&c.state==="open")),"correction case is not open");
    if(disposition==="adopted-plan")assert(state.plan_hash!==row.intake_plan_hash,"adopted plan must differ from correction intake plan");
    for(const c of row.cases)if(request.case_ids.includes(c.case_id))Object.assign(c,{state:"resolved",disposition,plan_hash:state.plan_hash,explanation:request.explanation});
    row.state=row.cases.every(c=>c.state==="resolved")?"resolved":"open";
   }
   row.revision++;
   row.history.push({revision:row.revision,request_sha256:requestHash,request});
   await persist(this,store);return row;
  });
 }
};
