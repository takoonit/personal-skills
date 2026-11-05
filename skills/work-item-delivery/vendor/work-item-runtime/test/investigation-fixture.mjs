import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sha, canonical, unitSourceIds, planFingerprint } from "../lib/delivery-common.mjs";

export async function designFixture(delivery, plan, root) {
  plan.design = {manifest:join(root,"design.json"), models:join(root,"models.md")};
  await writeFile(plan.design.models,"architect runners: fixture-a, fixture-b\narena cross-judge pool: fixture-a\ninterrogate reviewers: fixture-a, fixture-b\n");
  const context={plan_hash:await planFingerprint(plan),models_sha256:sha(await readFile(plan.design.models))};
  const artifact=async name=>{
    const path=join(root,name);
    await writeFile(path,"Synthetic design contract fixture for "+name+"; no agent was dispatched.");
    return {path,sha256:sha(await readFile(path))};
  };
  const pair=row=>sha(JSON.stringify({sketch:row.sketch.sha256,rationale:row.rationale.sha256}));
  const candidates=[];
  for (let i=1;i<=2;i++) candidates.push({seat:`architect-${i}`,model:`fixture-${i===1?"a":"b"}`,...context,
    shape:i===1?"immutable dossier":"tagged ledger",sketch:await artifact(`candidate-${i}.md`),rationale:await artifact(`rationale-${i}.md`)});
  const selected={base_seat:"architect-1",sketch:await artifact("selected.md"),rationale:await artifact("rationale.md")};
  const subject=pair(selected),reviewers=[];
  for (let i=1;i<=2;i++) reviewers.push({seat:`reviewer-${i}`,model:`fixture-${i===1?"a":"b"}`,...context,
    outcome:"completed",subject_sha256:subject,report:await artifact(`reviewer-${i}.md`),findings:[]});
  await writeFile(plan.design.manifest,JSON.stringify({schema:"work-item-delivery.design.v1",...context,architect:{
    grounding:[await artifact("grounding.md")],candidates,selected,
    cross_judge:{model:"fixture-a",...context,report:await artifact("judge.md"),candidates:candidates.map(row=>({seat:row.seat,digest:pair(row)}))}},
    interrogate:{subject_sha256:subject,reviewers,judgment:await artifact("judgment.md"),findings:[]}}));
}
export function definitionFixture(plan, revision = 0) {
  return {schema:"work-item-delivery.investigation.v1",work_item:plan.work_item,case_ids:plan.cases.map(c=>c.id),
    sources:plan.sources,independence:{mode:"single-agent",declaration:"Synthetic tests do not establish agent identity or independence."},
    challenge:{required:true},expected_revision:revision,
    revision_note:`Synthetic revision ${revision+1}`,
    tasks:plan.units.map(unit=>({id:unit.id,question:`What evidence establishes behavior for ${unit.case_ids.join(", ")}?`,
      domain:"fixture evidence",assignee:`fixture-${unit.id}`,revision:sha(canonical({finding:unit.finding,cases:unit.case_ids,source_refs:unit.source_refs})),
      case_ids:unit.case_ids,source_refs:unitSourceIds(plan,unit)}))};
}
export function reportFixture(brief,unit) {
  return {task:brief.task,input_hash:brief.input_hash,artifacts:[],claims:[{id:"finding",statement:unit.finding,
    basis:"source-supported",case_ids:unit.case_ids,source_refs:unit.source_refs,limitations:["Synthetic fixture only."]}],gaps:[]};
}
export async function admitFixture(delivery,plan,root) {
  const call=(method,...args)=>new delivery.constructor(delivery.directory)[method](...args);
  let previous;
  try { previous=JSON.parse(await readFile(join(delivery.directory,"investigation.json"),"utf8")); } catch(error) {if(error.code!=="ENOENT")throw error;}
  const definition=definitionFixture(plan,previous?.revision??0);
  const view=await call("investigate",definition);
  for (const task of view.pending_tasks) {
    const brief=await call("investigationBrief",task);
    const file=join(root,`report-${task}.json`);
    await writeFile(file,JSON.stringify(reportFixture(brief,plan.units.find(u=>u.id===task))));
    await call("investigationReport",task,file);
  }
  const challenge=await call("investigationBrief","challenge"),challengeFile=join(root,"challenge.json");
  await writeFile(challengeFile,JSON.stringify({task:"challenge",input_hash:challenge.input_hash,challenges:[],artifacts:[]}));
  await call("investigationReport","challenge",challengeFile);
  const arb=await call("investigationBrief","arbitration");
  const claims=arb.bundle.reports.flatMap(row=>row.report.claims.map(c=>({id:`${row.task}/${c.id}`,status:"accepted",rationale:"Synthetic cited fixture finding."})));
  const bindings=plan.units.map(unit=>{
    unit.investigation={claim_ids:[`${unit.id}/finding`]};
    return {unit:unit.id,...unit.investigation,...Object.fromEntries(["case_ids","source_refs","finding","finding_status","acceptance"].map(key=>[key,unit[key]])),
      cases:plan.cases.filter(c=>unit.case_ids.includes(c.id))};
  });
  const file=join(root,"arbitration.json");
  await writeFile(file,JSON.stringify({input_hash:arb.input_hash,claims,gaps:[],challenges:[],bindings}));
  const reconciled=await call("arbitrate",file);
  plan.schema="work-item-delivery.plan.v3";
  plan.admission={dossier:reconciled.dossier};
  await designFixture(delivery,plan,root);
  return {definition,reconciled};
}
