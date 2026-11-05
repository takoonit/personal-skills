import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assert, text, array, id, unique, sha, canonical, readJson, atomic, receipt, unitInputHash, unitSourceIds, planFingerprint, unitExecutionHash, designProjection, without, semanticWorkItem } from "./delivery-common.mjs";

const V3 = "work-item-delivery.plan.v3";
const digest = value => sha(canonical(value));
const same = (a, b) => canonical(a) === canonical(b);
const list = (rows, label, minimum = 0) => {
  array(rows, label);
  assert(rows.length >= minimum, `${label}: incomplete`);
  return rows;
};
const refs = (rows, allowed, label, minimum = 1) => {
  list(rows, label, minimum);
  unique(rows, label);
  assert(rows.every(key => allowed.includes(key)), `${label}: unknown reference`);
};
const qualified = (task, record) => ({...record, id:`${task}/${record.id}`});
const sourceIdentity = ({snapshot, blob, ...source}) => source;

async function put(run, bytes) {
  assert(bytes.length,"empty evidence bytes");
  const hash = sha(bytes), path = join(run.directory, "evidence", "sha256", hash);
  await mkdir(join(run.directory, "evidence", "sha256"), {recursive:true});
  try { await writeFile(path, bytes, {flag:"wx", mode:0o600}); }
  catch (error) { if (error.code !== "EEXIST") throw error; }
  assert(sha(await readFile(path)) === hash, "immutable evidence bytes changed");
  return {sha256:hash, bytes:bytes.length};
}
async function get(run, ref) {
  assert(ref && /^[a-f0-9]{64}$/.test(ref.sha256), "invalid evidence digest");
  const bytes = await readFile(join(run.directory, "evidence", "sha256", ref.sha256));
  assert(bytes.length === ref.bytes && sha(bytes) === ref.sha256, "immutable evidence bytes changed");
  return bytes;
}
const object = async (run, ref) => JSON.parse(await get(run, ref));
const putObject = (run, value) => put(run, Buffer.from(canonical(value)));
const manifestPath = run => join(run.directory, "investigation.json");
async function optional(path) {
  try { return await readJson(path); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
async function definition(run, manifest) {
  const d = await object(run, manifest.definition);
  for (const source of d.sources) if (source.blob) await get(run, source.blob);
  return d;
}
function taskInput(d, task) {
  const version=d.task_identity_version??1;
  assert([1,2].includes(version),"unsupported task identity version");
  const assignment=Object.fromEntries(["id","question","domain","case_ids","source_refs","assignee","revision"].filter(key=>task[key]!==undefined).map(key=>[key,task[key]]));
  return {work_item:version===1?d.work_item:semanticWorkItem(d.work_item), assignment, independence:{mode:d.independence.mode,declaration:d.independence.declaration},
    sources:d.sources.filter(source => task.source_refs.includes(source.id))};
}
async function checkedReport(run, ref) {
  const report = await object(run, ref);
  const raw = JSON.parse(await get(run, report.raw));
  const {raw:unused, artifacts, ...normalized} = report;
  const {artifacts:rawArtifacts, ...rawFields} = raw;
  assert(same(normalized, rawFields), "raw report content differs");
  assert(rawArtifacts.length === artifacts.length && rawArtifacts.every((artifact,index) => artifact.id === artifacts[index].id), "raw artifact bindings differ");
  for (const artifact of artifacts) await get(run, artifact.blob);
  return report;
}
async function investigatorBundle(run, m, d, {complete = true} = {}) {
  if (complete) assert(d.tasks.every(task => m.reports[task.id]), "investigator reports incomplete");
  assert(Object.keys(m.reports).every(key => d.tasks.some(task => task.id === key)), "unknown investigator report");
  const reports = [];
  for (const task of d.tasks) {
    const ref = m.reports[task.id];
    if (!ref) continue;
    const report = await checkedReport(run, ref);
    assert(report.task === task.id && report.input_hash === digest(taskInput(d, task)), "stale investigator report");
    reports.push({task:task.id, receipt:ref, report});
  }
  return {definition:m.definition, sources:d.sources, reports};
}
async function arbitrationBundle(run, m, d) {
  const bundle = await investigatorBundle(run, m, d);
  if (d.challenge.required) {
    assert(m.challenge, "challenge report required");
    const report = await checkedReport(run, m.challenge);
    assert(report.task === "challenge" && report.input_hash === digest(bundle), "stale challenge report");
    return {...bundle, challenge:{receipt:m.challenge,report}};
  }
  return {...bundle, waiver:d.challenge.reason};
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
function dispositions(rows, records, label) {
  list(rows,label);
  unique(rows.map(row => row.id),label);
  assert(rows.length === records.length && records.every(record => rows.some(row => row.id === record.id)), `complete ${label} dispositions required`);
  for (const row of rows) {
    assert(["accepted","rejected","unresolved"].includes(row.status), `invalid ${label} disposition`);
    text(row.rationale, "evidence-based disposition rationale");
  }
}
function validateArbitration(a, bundle) {
  assert(a.input_hash === digest(bundle), "stale arbitration bundle");
  const r = records(bundle);
  for (const key of ["claims","gaps","challenges"]) dispositions(a[key],r[key],key);
  for(const decision of a.claims.filter(row=>row.status==="accepted"))
    for(const premise of claimClosure([decision.id],r.claims))
      assert(a.claims.some(row=>row.id===premise.id&&row.status==="accepted"),"accepted inference requires accepted premises");
  list(a.bindings,"unit bindings",1);
  unique(a.bindings.map(row => row.unit),"unit bindings");
  for (const b of a.bindings) {
    id(b.unit,"bound unit");
    refs(b.claim_ids,r.claims.map(c=>c.id),"binding claims",0);
    refs(b.gap_ids??[],r.gaps.map(g=>g.id),"binding gaps",0);
    assert(b.claim_ids.length+(b.gap_ids??[]).length>0,"binding requires claims or explicit gaps");
    assert(b.claim_ids.every(key=>a.claims.some(row=>row.id===key && row.status!=="rejected")), "rejected claim cannot authorize implementation");
    for (const field of ["case_ids","source_refs","acceptance"]) list(b[field],field,1);
    text(b.finding,"bound finding");
    assert(["confirmed","hypothesis","unknown"].includes(b.finding_status),"invalid bound finding status");
    list(b.cases,"bound case records",1);
    const claims = [...claimClosure(b.claim_ids,r.claims),...r.gaps.filter(g=>(b.gap_ids??[]).includes(g.id))];
    assert(b.case_ids.every(key=>claims.some(c=>c.case_ids.includes(key))),"binding case lacks accepted claim");
    assert(claims.every(c=>c.source_refs.every(key=>b.source_refs.includes(key))),"binding omits claim source");
  }
  return r;
}
async function validateReport(run, input, task, d, expected, bundle) {
  assert(input.task === task && input.input_hash === expected,"stale report task/input digest");
  const report = structuredClone(input);
  list(report.artifacts,"report artifacts");
  for (const artifact of report.artifacts) {
    id(artifact.id,"artifact id"); text(artifact.path,"artifact path");
    artifact.blob = await put(run, await readFile(artifact.path));
    delete artifact.path;
  }
  unique(report.artifacts.map(row=>row.id),"artifact IDs");
  const artifactIds = report.artifacts.map(row=>row.id);
  const assignment = d.tasks.find(row=>row.id===task);
  const cases = assignment?.case_ids ?? d.case_ids;
  const sources = assignment?.source_refs ?? d.sources.map(row=>row.id);
  const validateRecord = row => {
    id(row.id,"record id"); text(row.statement,"record statement");
    refs(row.case_ids,cases,"affected cases");
    refs(row.source_refs,sources,"record sources");
    list(row.limitations,"limitations");
    assert(row.limitations.every(value=>typeof value==="string"),"invalid limitation");
  };
  if (task === "challenge") {
    list(report.challenges,"challenges");
    unique(report.challenges.map(row=>row.id),"challenge IDs");
    for (const row of report.challenges) {
      validateRecord(row);
      assert(row.scope===undefined||["case","source"].includes(row.scope),"invalid challenge scope");
      refs(row.claim_ids,records(bundle).claims.map(c=>c.id),"challenged claims",0);
      assert(["counterexample","missing-evidence","conflicting-authority","scope"].includes(row.kind),"invalid challenge kind");
    }
  } else {
    for (const key of ["claims","gaps"]) {
      list(report[key],key); unique(report[key].map(row=>row.id),key);
      for (const row of report[key]) validateRecord(row);
    }
    assert(report.claims.length+report.gaps.length>0,"report needs a claim or explicit gap");
    assert(cases.every(key=>[...report.claims,...report.gaps].some(row=>row.case_ids.includes(key))),"report leaves assigned case unanswered");
    for (const claim of report.claims) {
      assert(["documented","source-supported","executed-test","observed","inferred"].includes(claim.basis),"invalid evidence basis");
      if (claim.basis==="executed-test") {
        list(claim.command,"executed command",1); text(claim.outcome,"test outcome");
        refs(claim.artifact_ids,artifactIds,"test artifacts");
      }
      if (claim.basis==="observed") {
        text(claim.environment,"observation environment");
        refs(claim.artifact_ids,artifactIds,"observation artifacts");
      }
      if (claim.basis==="inferred") refs(claim.premises,report.claims.filter(row=>row.id!==claim.id).map(row=>row.id),"inference premises");
    }
    for (const gap of report.gaps) { text(gap.owner,"gap owner");text(gap.unblock_when,"gap unblock condition"); }
  }
  return report;
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
function semanticEvidence(plan, unit, dossier, version = 3) {
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
    ...without(definition,["schema","sources","tasks","case_ids","revision_note","challenge",...(version===3?["task_identity_version"]:[])]),
    ...(version===3?{work_item:semanticWorkItem(definition.work_item)}:{}),
    challenge_policy:without(definition.challenge,["reason"]),
    tasks:definition.tasks.filter(task=>reports.some(row=>row.task===task.id)).map(task=>without(task,["assignee","revision","case_ids","source_refs"])),
    reports:reportEvidence,claims:selected.claims,gaps:selected.gaps,challenges:selected.challenges,
    decisions:decisions("claims"),gap_decisions:decisions("gaps"),challenge_decisions:decisions("challenges"),
    arbitration:without(a,["input_hash","raw","claims","gaps","challenges","bindings"]),
    binding:without(a.bindings.find(row=>row.unit===unit.id),["unit","claim_ids","gap_ids","case_ids","source_refs","finding","finding_status","acceptance","cases"]),
    sources:definition.sources.filter(source=>selected.sources.has(source.id)),
  };
}
async function historicalInput(plan, unit, dossier) {
  let evidence;
  if (dossier) {
    const all=records(dossier.bundle),a=dossier.arbitration;
    const claims=claimClosure(unit.investigation.claim_ids,all.claims);
    const relevant=rows=>rows.filter(row=>row.case_ids.some(key=>unit.case_ids.includes(key)));
    const tasks=new Set([...claims,...relevant(all.gaps)].map(row=>row.id.split("/")[0]));
    evidence={claims,reports:dossier.bundle.reports.filter(row=>tasks.has(row.task)).map(row=>({task:row.task,receipt:row.receipt})),decisions:a.claims.filter(row=>claims.some(c=>c.id===row.id)),
      gaps:relevant(all.gaps),challenges:relevant(all.challenges),
      gap_decisions:a.gaps.filter(row=>relevant(all.gaps).some(g=>g.id===row.id)),
      challenge_decisions:a.challenges.filter(row=>relevant(all.challenges).some(c=>c.id===row.id)),
      sources:dossier.definition.sources.filter(s=>unitSourceIds(plan,unit).includes(s.id))};
  }
  return unitInputHash(plan,unit,evidence);
}

export { V3, digest, same, list, refs, sourceIdentity, put, get, object, putObject, manifestPath, optional, definition, taskInput, checkedReport, investigatorBundle, arbitrationBundle, records, claimClosure, validateArbitration, validateReport, relevantRecords, semanticEvidence, historicalInput };
