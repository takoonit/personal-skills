import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha, canonical, assert, without, unitInputHash, unitSourceIds } from "../lib/delivery-common.mjs";
import { definitionFixture, reportFixture, designFixture } from "./investigation-fixture.mjs";

const digest = value => sha(canonical(value));
const qualified = (task, record) => ({...record, id:task+"/"+record.id});
function taskInput(d, task) {
  const assignment=Object.fromEntries(["id","question","domain","case_ids","source_refs","assignee","revision"].filter(key=>task[key]!==undefined).map(key=>[key,task[key]]));
  return {work_item:d.work_item, assignment, independence:{mode:d.independence.mode,declaration:d.independence.declaration},
    sources:d.sources.filter(source => task.source_refs.includes(source.id))};
}
function records(bundle) {
  return {
    claims:bundle.reports.flatMap(row => row.report.claims.map(claim => qualified(row.task, claim))),
    gaps:bundle.reports.flatMap(row => row.report.gaps.map(gap => qualified(row.task, gap))),
    challenges:(bundle.challenge?.report.challenges ?? []).map(row => qualified("challenge",row)),
  };
}
function claimClosure(ids, claims) {
  const result=new Map(), visiting=new Set();
  const visit=key=>{
    assert(!visiting.has(key),"inference premise cycle");
    if(result.has(key)) return;
    const claim=claims.find(c=>c.id===key);
    assert(claim,"unknown inference premise");
    visiting.add(key);
    for(const premise of claim.premises??[]) visit(key.split("/")[0]+"/"+premise);
    visiting.delete(key);result.set(key,claim);
  };
  for(const key of ids) visit(key);
  return [...result.values()];
}
function relevantRecords(plan, unit, dossier) {
  const all=records(dossier.bundle);
  const claims=claimClosure(unit.investigation.claim_ids,all.claims);
  const caseMatch=row=>row.case_ids.some(key=>unit.case_ids.includes(key));
  const gaps=all.gaps.filter(row=>caseMatch(row)||(unit.investigation.gap_ids??[]).includes(row.id));
  const sources=new Set([...unitSourceIds(plan,unit),...claims.flatMap(row=>row.source_refs),...gaps.flatMap(row=>row.source_refs)]);
  const challenges=all.challenges.filter(row=>caseMatch(row)||row.claim_ids.some(key=>claims.some(claim=>claim.id===key))||(row.scope==="source"&&row.source_refs.some(key=>sources.has(key))));
  for (const challenge of challenges) for (const source of challenge.source_refs) sources.add(source);
  return {claims,gaps,challenges,sources};
}
function semanticEvidence(plan, unit, dossier) {
  if (!dossier) return null;
  const selected=relevantRecords(plan,unit,dossier), a=dossier.arbitration;
  const decisions=key=>a[key].filter(row=>selected[key].some(record=>record.id===row.id)).map(row=>without(row,["rationale"]));
  const reports=dossier.bundle.reports.filter(row=>[...selected.claims,...selected.gaps].some(record=>record.id.startsWith(row.task+"/")));
  const artifactRecords=[...selected.claims,...selected.gaps,...selected.challenges];
  const reportEvidence=[...reports,...(selected.challenges.length&&dossier.bundle.challenge?[{task:"challenge",...dossier.bundle.challenge}]:[])].map(row=>{
    const selectedIds=new Set(artifactRecords.filter(record=>record.id.startsWith(row.task+"/")).flatMap(record=>record.artifact_ids??[]));
    const referencedIds=new Set([...row.report.claims??[],...row.report.gaps??[],...row.report.challenges??[]].flatMap(record=>record.artifact_ids??[]));
    return {task:row.task, ...without(row.report,["task","input_hash","raw","claims","gaps","challenges","artifacts"]),
      artifacts:row.report.artifacts.filter(artifact=>selectedIds.has(artifact.id)||!referencedIds.has(artifact.id))};
  });
  const definition=dossier.definition;
  return {
    ...without(definition,["schema","sources","tasks","case_ids","revision_note","challenge"]),
    challenge_policy:without(definition.challenge,["reason"]),
    tasks:definition.tasks.filter(task=>reports.some(row=>row.task===task.id)).map(task=>without(task,["assignee","revision","case_ids","source_refs"])),
    reports:reportEvidence,claims:selected.claims,gaps:selected.gaps,challenges:selected.challenges,
    decisions:decisions("claims"),gap_decisions:decisions("gaps"),challenge_decisions:decisions("challenges"),
    arbitration:without(a,["input_hash","raw","claims","gaps","challenges","bindings"]),
    binding:without(a.bindings.find(row=>row.unit===unit.id),["unit","claim_ids","gap_ids","case_ids","source_refs","finding","finding_status","acceptance","cases"]),
    sources:definition.sources.filter(source=>selected.sources.has(source.id)),
  };
}
const executionUnit = unit => {
  const extensions=without(unit.investigation??{},["claim_ids","gap_ids"]);
  return {...without(unit, ["investigation", "priority", "checks"]),
    ...(Object.keys(extensions).length?{investigation:extensions}:{}),
    checks:unit.checks?.map(check => without(check, ["timeout_ms"])),
  };
};
async function unitExecutionHash(plan, unit) {
  const hash = await unitInputHash(plan, executionUnit(unit));
  const repository = plan.repositories.find(repo => repo.id === unit.repo);
  return sha(canonical({hash, repository:without(repository, ["branch"]),
    work_item:plan.work_item, policy:plan.policy?without(plan.policy,["branch_prefix"]):{},
    knowledge:without(plan.knowledge??{},["business_flows"]),
    captures:(plan.capture_plan??[]).filter(row=>row.case_ids.some(key=>unit.case_ids.includes(key))),
    extensions:without(plan,["schema","work_item","policy","sources","cases","units","repositories","blockers","knowledge","capture_plan","design","admission"]),
  }));
}

export async function priorUnitInputs(plan, dossier) {
  return Object.fromEntries(await Promise.all(plan.units.map(async unit=>[unit.id,{
    version:2,execution:await unitExecutionHash(plan,unit),evidence:digest(semanticEvidence(plan,unit,dossier)),
    basis:"admitted-investigation",
  }])));
}

export async function admitPriorFixture(delivery, plan, root, {marked=false}={}) {
  const directory=join(delivery.directory,"evidence","sha256");
  await mkdir(directory,{recursive:true});
  const put=async value=>{
    const bytes=Buffer.from(typeof value==="string"?value:canonical(value));
    const ref={sha256:sha(bytes),bytes:bytes.length};
    await writeFile(join(directory,ref.sha256),bytes);
    return ref;
  };
  const d=structuredClone(definitionFixture(plan));
  delete d.expected_revision;
  if(marked) d.task_identity_version=1;
  for(const source of d.sources.filter(source=>source.status==="read")) {
    source.blob=await put(await readFile(source.snapshot,"utf8"));delete source.snapshot;
  }
  const definition=await put(d),reports=[];
  for(const unit of plan.units) {
    const task=d.tasks.find(task=>task.id===unit.id);
    const raw=reportFixture({task:task.id,input_hash:digest(taskInput(d,task))},unit);
    const report={...raw,raw:await put(raw)};
    reports.push({task:task.id,report,receipt:await put(report)});
  }
  const initial={definition,sources:d.sources,reports};
  const rawChallenge={task:"challenge",input_hash:digest(initial),challenges:[],artifacts:[]};
  const report={...rawChallenge,raw:await put(rawChallenge)};
  const challenge={report,receipt:await put(report)};
  const bundle={...initial,challenge};
  const bindings=plan.units.map(unit=>{
    unit.investigation={claim_ids:[unit.id+"/finding"]};
    return {unit:unit.id,...unit.investigation,...Object.fromEntries(["case_ids","source_refs","finding","finding_status","acceptance"].map(key=>[key,unit[key]])),
      cases:plan.cases.filter(c=>unit.case_ids.includes(c.id))};
  });
  const rawArbitration={input_hash:digest(bundle),
    claims:plan.units.map(unit=>({id:unit.id+"/finding",status:"accepted",rationale:"Synthetic cited fixture finding."})),
    gaps:[],challenges:[],bindings};
  const dossier={definition:d,bundle,arbitration:{...rawArbitration,raw:await put(rawArbitration)}};
  const dossierRef=await put(dossier);
  await writeFile(join(delivery.directory,"investigation.json"),JSON.stringify({
    schema:"work-item-delivery.investigation-state.v1",revision:1,definition,
    reports:Object.fromEntries(reports.map(row=>[row.task,row.receipt])),challenge:challenge.receipt,dossier:dossierRef,history:[],
  }));
  plan.schema="work-item-delivery.plan.v3";plan.admission={dossier:dossierRef};
  await designFixture(delivery,plan,root);
  return dossier;
}
