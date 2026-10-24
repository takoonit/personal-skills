import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { assert, text, array, id, unique, sha, canonical, readJson, atomic, receipt, unitInputHash, unitSourceIds, planFingerprint, unitExecutionHash, designProjection, without, semanticWorkItem } from "./delivery-common.mjs";
import { checkDesign } from "../scripts/check-design.mjs";
import { V3, digest, same, list, refs, sourceIdentity, put, get, object, putObject, manifestPath, optional, definition, taskInput, checkedReport, investigatorBundle, arbitrationBundle, records, claimClosure, validateArbitration, validateReport, relevantRecords, semanticEvidence, historicalInput } from "./investigation-evidence.mjs";

export const investigation = {
  async designContext(plan) {
    const projection=await designProjection(plan);
    return {plan_hash:await planFingerprint(plan),projection_version:projection.version,design_hash:projection.sha256};
  },
  async investigate(input) {
    return this.locked(async()=>{
      assert(input.schema==="work-item-delivery.investigation.v1","unsupported investigation schema");
      const old = await optional(manifestPath(this));
      const before = old ? await definition(this,old) : null;
      const d = structuredClone(input); delete d.expected_revision;
      d.task_identity_version ??= before && same(before.work_item,d.work_item) ? before.task_identity_version : 2;
      assert(d.task_identity_version===undefined || [1,2].includes(d.task_identity_version),"unsupported task identity version");
      text(d.work_item?.id,"Work Item");text(String(d.work_item?.revision??""),"Work Item revision");
      text(d.work_item?.url,"Work Item URL");
      list(d.case_ids,"case IDs",1);unique(d.case_ids,"case IDs");
      for (const key of d.case_ids) id(key,"case ID");
      assert(["independent-host","single-agent"].includes(d.independence?.mode),"declare host independence mode");
      text(d.independence.declaration,"independence declaration");
      assert(typeof d.challenge?.required==="boolean","explicit challenge policy required");
      if (!d.challenge.required) text(d.challenge.reason,"explicit challenge waiver rationale");
      list(d.sources,"sources",1);unique(d.sources.map(s=>s.id),"sources");
      for (const source of d.sources) {
        id(source.id,"source ID");text(source.url,"source locator");text(source.section,"source section");
        text(String(source.revision??""),"source revision");
        assert(["read","unavailable","conflicted"].includes(source.status),"invalid source access");
        if (source.status==="read") {
          source.blob=await put(this,await readFile(source.snapshot));
          delete source.snapshot;
        } else text(source.reason,"source access gap");
      }
      list(d.tasks,"investigator tasks",1);assert(d.tasks.length<=16,"at most 16 bounded investigator tasks");
      unique(d.tasks.map(t=>t.id),"tasks");
      for (const task of d.tasks) {
        id(task.id,"task ID");assert(task.id!=="challenge","reserved challenge task ID");
        text(task.question,"neutral question");text(task.domain,"evidence domain");text(task.assignee,"host assignment");
        refs(task.case_ids,d.case_ids,"assigned cases");refs(task.source_refs,d.sources.map(s=>s.id),"assigned sources");
      }
      assert(d.case_ids.every(key=>d.tasks.some(task=>task.case_ids.includes(key))),"unassigned investigation case");
      const ref=await putObject(this,d);
      if (old?.definition.sha256===ref.sha256) return this.investigationView(old);
      assert(!old || input.expected_revision===old.revision,"stale investigation revision; explicitly revise expected_revision");
      const reports={};
      if (old) {
        for (const task of d.tasks) {
          const prior=before.tasks.find(t=>t.id===task.id);
          if (prior && old.reports[task.id] && same(taskInput(before,prior),taskInput(d,task))) reports[task.id]=old.reports[task.id];
        }
      }
      const m={schema:"work-item-delivery.investigation-state.v1",revision:(old?.revision??0)+1,definition:ref,reports,
        history:[...(old?.history??[]),...(old?[await putObject(this,old)]:[])]};
      await atomic(manifestPath(this),m);
      return this.investigationView(m);
    });
  },
  async investigationView(m = null) {
    try {
      m ??= await optional(manifestPath(this));
      if (!m) return null;
      const d=await definition(this,m);
      await investigatorBundle(this,m,d,{complete:false});
      const pending=d.tasks.filter(task=>!m.reports[task.id]).map(task=>task.id);
      if (m.challenge || m.dossier) {
        const bundle=await arbitrationBundle(this,m,d);
        if (m.dossier) {
          const dossier=await this.checkedDossier(m.dossier);
          assert(same(dossier.definition,d) && same(dossier.bundle,bundle), "dossier differs from current investigation");
        }
      }
      const phase=pending.length?"investigating":d.challenge.required&&!m.challenge?"challenging":!m.dossier?"arbitrating":"plan-ready";
      return {revision:m.revision,phase,pending_tasks:pending,challenge:d.challenge,independence:d.independence,
        ...(m.dossier?{dossier:m.dossier}:{}),next_task:pending[0]??(phase==="challenging"?"challenge":null)};
    } catch (error) {
      return {phase:"integrity-hold",error:error.message};
    }
  },
  async investigationBrief(task) {
    return this.locked(async()=>{
      const m=await readJson(manifestPath(this)),d=await definition(this,m);
      if (task==="challenge" || task==="arbitration") {
        const bundle=task==="challenge"?await investigatorBundle(this,m,d):await arbitrationBundle(this,m,d);
        return {task,input_hash:digest(bundle),bundle,standing_orders:["Assess evidence, counterexamples and missing authority. Preserve limitations. Agent identity and isolation are host attestations."]};
      }
      const assignment=d.tasks.find(t=>t.id===task);assert(assignment,"unknown investigation task");
      const input=taskInput(d,assignment);
      return {task,input_hash:digest(input),...input,
        source_paths:input.sources.filter(s=>s.blob).map(s=>({id:s.id,path:join(this.directory,"evidence","sha256",s.blob.sha256)})),
        standing_orders:["Answer the assigned question independently. Do not read sibling reports or assume a preferred fix. Separate documented, source-supported, executed-test, observed and inferred claims. Return explicit gaps."]};
    });
  },
  async investigationReport(task,file) {
    return this.locked(async()=>{
      const m=await readJson(manifestPath(this)),d=await definition(this,m);
      const bundle=task==="challenge"?await investigatorBundle(this,m,d):null;
      const assignment=d.tasks.find(t=>t.id===task);
      assert(task==="challenge"?d.challenge.required:assignment,"unknown or waived task");
      const bytes=await readFile(file),raw=await put(this,bytes);
      const previous=task==="challenge"?m.challenge:m.reports[task];
      if (previous) {
        const existing=await object(this,previous);
        assert(existing.raw.sha256===raw.sha256,"conflicting report retry; revise investigation/task before replacing");
        return this.investigationView(m);
      }
      const report=await validateReport(this,JSON.parse(bytes),task,d,task==="challenge"?digest(bundle):digest(taskInput(d,assignment)),bundle);
      const ref=await putObject(this,{...report,raw});
      if (task==="challenge") m.challenge=ref; else m.reports[task]=ref;
      delete m.dossier;
      await atomic(manifestPath(this),m);
      return this.investigationView(m);
    });
  },
  async arbitrate(file) {
    return this.locked(async()=>{
      const m=await readJson(manifestPath(this)),d=await definition(this,m),bundle=await arbitrationBundle(this,m,d);
      const bytes=await readFile(file),a=JSON.parse(bytes);
      validateArbitration(a,bundle);
      const raw=await put(this,bytes);
      if (m.dossier) {
        const prior=await object(this,m.dossier);
        assert(prior.arbitration.raw.sha256===raw.sha256,"conflicting arbitration retry; revise investigation");
        return this.investigationView(m);
      }
      m.dossier=await putObject(this,{definition:d,bundle,arbitration:{...a,raw}});
      await atomic(manifestPath(this),m);
      return this.investigationView(m);
    });
  },
  async checkedDossier(ref) {
    const dossier=await object(this,ref),{definition:d,bundle,arbitration:a}=dossier;
    assert(same(await object(this,bundle.definition),d),"dossier definition differs");
    for (const source of d.sources) if (source.blob) await get(this,source.blob);
    for (const row of [...bundle.reports,...(bundle.challenge?[bundle.challenge]:[])]) {
      assert(same(await checkedReport(this,row.receipt),row.report),"dossier report differs");
    }
    const {raw:arbitrationReceipt,...arbitrationFields}=a;
    assert(same(JSON.parse(await get(this,arbitrationReceipt)),arbitrationFields),"raw arbitration differs");
    assert(same(bundle.sources,d.sources),"bundle sources differ");
    assert(bundle.reports.length===d.tasks.length,"dossier investigator coverage differs");
    for (const task of d.tasks) {
      const row=bundle.reports.find(row=>row.task===task.id);
      assert(row && row.report.input_hash===digest(taskInput(d,task)),"dossier report task binding differs");
    }
    const initial={definition:bundle.definition,sources:bundle.sources,reports:bundle.reports};
    if (d.challenge.required) assert(bundle.challenge?.report.input_hash===digest(initial),"dossier challenge binding differs");
    else assert(bundle.waiver===d.challenge.reason,"dossier challenge waiver differs");
    validateArbitration(a,bundle);
    return dossier;
  },
  async admittedDossier(plan) {
    if (plan.schema!==V3) return null;
    const dossier=await this.checkedDossier(plan.admission.dossier),{definition:d,bundle,arbitration:a}=dossier;
    assert(same(plan.work_item,d.work_item),"Work Item differs from admitted dossier");
    assert(same([...plan.cases.map(c=>c.id)].sort(),[...d.case_ids].sort()),"case scope differs from dossier");
    assert(plan.sources.length===d.sources.length,"source scope differs from dossier");
    for (const source of plan.sources) {
      const admitted=d.sources.find(s=>s.id===source.id);
      assert(admitted && same(sourceIdentity(source),sourceIdentity(admitted)),"source metadata differs from dossier");
      if (source.status==="read") assert((await receipt(source.snapshot)).sha256===admitted.blob.sha256,"source bytes differ from dossier");
    }
    const r=records(bundle);
    assert(a.bindings.length===plan.units.length,"unit binding coverage differs");
    for (const unit of plan.units) {
      const b=a.bindings.find(b=>b.unit===unit.id);
      assert(b && same(b.claim_ids,unit.investigation.claim_ids) && same(b.gap_ids??[],unit.investigation.gap_ids??[]),"unit claim binding differs");
      assert(same(b.cases,plan.cases.filter(c=>unit.case_ids.includes(c.id))), unit.id + ": admitted cases differ");
      for (const field of ["case_ids","source_refs","finding","finding_status","acceptance"])
        assert(same(b[field],unit[field]),`${unit.id}: admitted ${field} differs`);
    }
    for (const key of ["claims","gaps","challenges"]) for (const decision of a[key].filter(row=>row.status==="unresolved")) {
      const record=r[key].find(row=>row.id===decision.id);
      for (const unit of plan.units.filter(u=>key==="challenges"?relevantRecords(plan,u,dossier).challenges.some(row=>row.id===record.id):u.case_ids.some(c=>record.case_ids.includes(c))))
        assert(plan.blockers.some(b=>b.units.includes(unit.id)&&b.investigation_refs?.includes(record.id)&&
          (key!=="gaps"||(b.owner===record.owner&&b.unblock_when===record.unblock_when))),`${record.id}: unresolved evidence requires affected-unit blocker`);
    }
    return dossier;
  },
  async admitPlan(plan) {
    assert(plan.schema===V3,"fresh or materially changed plan requires v3 investigation admission");
    const m=await readJson(manifestPath(this));
    assert(same(m.dossier,plan.admission.dossier),"admission must select the current reconciled dossier");
    await this.admittedDossier(plan);
    return this.checkPlanDesign(plan);
  },
  async checkPlanDesign(plan) {
    if (plan.schema!==V3) return null;
    const planBlob=await putObject(this,plan);
    const checked=await checkDesign(join(this.directory,"evidence","sha256",planBlob.sha256),plan.design.manifest,plan.design.models);
    return {...checked,manifest:await receipt(plan.design.manifest),models:await receipt(plan.design.models)};
  },
  async requireDesign(s) {
    if (s.plan.schema!==V3) return;
    const current=await this.checkPlanDesign(s.plan);
    assert(same(current,s.design_receipt),"design receipt changed; explicitly replan before approval or new writer");
  },
  async investigationUnitInputs(plan) {
    const dossier=await this.admittedDossier(plan);
    return Object.fromEntries(await Promise.all(plan.units.map(async unit=>[unit.id,{
      version:3,execution:await unitExecutionHash(plan,unit),evidence:digest(semanticEvidence(plan,unit,dossier)),
      basis:dossier?"admitted-investigation":"historical-without-investigation",
    }])));
  },
  async compareUnitInputs(state, nextPlan, nextInputs) {
    const changed=[],preserved=[],migrations=[],migration_gaps=[];
    let historicalDossier, historicalError;
    const needsMigration=nextPlan.units.some(unit=>state.plan.units.some(old=>old.id===unit.id)&&state.unit_inputs?.[unit.id]?.version!==3);
    if (needsMigration) {
      try {
        historicalDossier=state.plan.schema===V3?await this.checkedDossier(state.plan.admission.dossier):null;
        if (historicalDossier) {
          const archivedPlan=structuredClone(state.plan);
          for (const source of archivedPlan.sources.filter(source=>source.status==="read")) {
            const archived=historicalDossier.definition.sources.find(row=>row.id===source.id);
            assert(archived?.blob,"historical source receipt is missing");
            source.snapshot=join(this.directory,"evidence","sha256",archived.blob.sha256);
          }
          await this.admittedDossier(archivedPlan);
        }
      } catch (error) { historicalError=error.message; }
    }
    for (const unit of nextPlan.units) {
      const priorUnit=state.plan.units.find(old=>old.id===unit.id), stored=state.unit_inputs?.[unit.id], next=nextInputs[unit.id];
      if (!priorUnit) {changed.push(unit.id);continue;}
      let prior=stored;
      if (stored?.version!==3) {
        try {
          assert(!historicalError,historicalError);
          if (stored?.version===2) {
            assert(await unitExecutionHash(state.plan,priorUnit,2)===stored.execution &&
              digest(semanticEvidence(state.plan,priorUnit,historicalDossier,2))===stored.evidence,
              "historical v2 unit inputs cannot be established like-for-like");
          } else if (stored===undefined) {
            await this.admittedDossier(state.plan);
            assert(await this.fingerprint(state.plan)===state.plan_hash,"historical plan bytes cannot be established without stored unit inputs");
          } else {
            assert(typeof stored==="string","unsupported historical unit identity");
            await this.admittedDossier(state.plan);
            assert(await historicalInput(state.plan,priorUnit,historicalDossier)===stored,"historical unit inputs cannot be established like-for-like");
          }
          prior={execution:await unitExecutionHash(state.plan,priorUnit),evidence:digest(semanticEvidence(state.plan,priorUnit,historicalDossier))};
          migrations.push({unit:unit.id,from:stored?.version===2?"v2":stored===undefined?"missing":"opaque-v1",to:3,
            limitation:historicalDossier?"Historical admission receipts were verified; identity projection was migrated.":"Historical implementation has no investigation evidence or independent investigator attestation."});
        } catch (error) {
          changed.push(unit.id);migration_gaps.push({unit:unit.id,reason:error.message});continue;
        }
      }
      const legacyMigration=stored?.version!==3&&!historicalDossier;
      if (prior.execution===next.execution&&(legacyMigration||prior.evidence===next.evidence)) preserved.push(unit.id);
      else changed.push(unit.id);
    }
    return {changed,preserved,migrations,migration_gaps};
  },
  async investigationEvidence(plan,unit) {
    const dossier=await this.admittedDossier(plan);
    if (!dossier) return null;
    const all=records(dossier.bundle);
    return {dossier:plan.admission.dossier,claims:claimClosure(unit.investigation.claim_ids,all.claims),
      gaps:all.gaps.filter(g=>g.case_ids.some(c=>unit.case_ids.includes(c))),
      sources:dossier.definition.sources.filter(s=>unitSourceIds(plan,unit).includes(s.id)),
      independence:dossier.definition.independence};
  },
};
