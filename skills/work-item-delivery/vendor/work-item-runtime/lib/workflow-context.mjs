import { lstat, readFile, readdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assert, canonical, git, sha, unitSourceIds, businessFlows } from "./delivery-common.mjs";
import { nextCursorAction, legalCursorCandidates } from "./cursor-workflow.mjs";
import { prDraftPath } from "./pr-draft.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const ROOT_SKILL = ".agents/skills/work-item-delivery/SKILL.md";
const routes = {
  intake: ["investigate", "coordinator", ["work-item-start-safety", "pstack:how", "pstack:why"]],
  investigate: ["investigate", "investigator", ["work-item-start-safety", "pstack:how", "pstack:why"]],
  challenge: ["investigate", "challenger", ["pstack:interrogate"]],
  arbitrate: ["investigate", "arbiter", ["pstack:interrogate"]],
  "author-plan": ["design", "designer", ["pstack:architect", "pstack:interrogate"]],
  "reconcile-correction": ["align", "coordinator", []],
  "await-human": ["align", "coordinator", []],
  "start-unit": ["implement", "writer", ["pstack:principle-guard-the-context-window", "pstack:deslop"]],
  "continue-writer": ["implement", "existing-owner", ["pstack:principle-guard-the-context-window", "pstack:deslop"]],
  verify: ["verify", "verifier", ["proof-of-work"]],
  "verification-failed": ["verify", "writer", ["proof-of-work"]],
  review: ["review", "reviewer", ["mattpocock-skills:code-review"]],
  "stage-publication": ["publish", "coordinator", ["azure-pr-write"]],
  report: ["report", "coordinator", []],
  blocked: ["align", "coordinator", []],
};
const approved = new Set(["check-new-blockers", "execute-approved-action", "read-back-approved-action", "publish-readback"]);
export function contextRoute(action) {
  const [phase, role, skills] = approved.has(action.action) || (action.action === "blocked" && action.phase === "blocked")
    ? ["approved-action", "approved-action-operator", []]
    : routes[action.action] ?? routes.blocked;
  return {phase, role, skills, workflow_root:root, read: [ROOT_SKILL, `docs/phases/${phase}.md`].map(path=>resolve(root,path)),
    instructions_required:true,
    conditional_skills: phase === "implement" ? ["pstack:tdd only when explicitly requested", "pstack:principle-fix-root-causes when a behavioral failure requires diagnosis"]
      : phase === "investigate" ? ["pstack:principle-fix-root-causes for bugs", "SecondBrain wiki-query/think and browser skills when required by sources", "challenge/arbitrate invoke pstack:interrogate for their assigned report"]
      : phase === "design" ? ["pstack:architect invokes its configured pstack:arena"]
      : phase === "verify" ? ["Read the available browser skill before UI capture when the approved scenario requires a browser"]
      : phase === "report" ? ["pstack:show-me-your-work and its required independent trail review"]
      : phase === "review" ? ["Use the available code/spec review skill fitting scope, as the phase card requires"] : []};
}
async function regular(path, optional = false) {
  try {
    const entry = await lstat(path);
    assert(entry.isFile() && !entry.isSymbolicLink(), `context file must be a regular file: ${path}`);
    const bytes = await readFile(path);
    return {path: resolve(path), sha256: sha(bytes), bytes: bytes.length};
  } catch (error) {
    if (optional && error.code === "ENOENT") return {path: resolve(path), missing: true};
    throw error;
  }
}
async function snapshot(run) {
  let state;
  try { state = await run.load(); } catch (error) { if (error.code !== "ENOENT") throw error; }
  let investigation;
  try { investigation = await run.investigationView(); } catch(error) { investigation={phase:"integrity-hold",error:error.message}; }
  const status = state ? {...await run.summarize(state), investigation} : {investigation,corrections:await run.correctionView(null)};
  return {state, status};
}
async function importedBindings(directory,plan,packet) {
  const bindings=[],seen=new Set();
  const gap=(path,kind,error)=>packet.context_gaps.push({path,kind,...(error?{error:error.message}: {})});
  async function cas(ref,role) {
    if(!ref)return;
    const path=join(directory,"evidence","sha256",String(ref.sha256));
    try {
      assert(/^[a-f0-9]{64}$/.test(ref.sha256)&&Number.isInteger(ref.bytes),"invalid imported evidence receipt");
      if(seen.has(`${role}:${ref.sha256}`))return;seen.add(`${role}:${ref.sha256}`);
      for(const parent of [join(directory,"evidence"),join(directory,"evidence","sha256")]) {
        const entry=await lstat(parent);assert(entry.isDirectory()&&!entry.isSymbolicLink(),"imported evidence directory is redirected");
      }
      const actual=await regular(path,true);bindings.push({...actual,role,expected_sha256:ref.sha256});
      if(actual.missing){gap(path,"missing");return;}
      if(actual.sha256!==ref.sha256||actual.bytes!==ref.bytes){gap(path,"integrity",new Error("imported evidence bytes differ"));return;}
      if(role==="opaque")return;
      let value;try {value=JSON.parse(await readFile(path,"utf8"));}
      catch(error){gap(path,"parse",error);return;}
      await owned(value,role);
      return value;
    }catch(error){gap(path,"integrity",error);}
  }
  async function owned(value,role) {
    if(role==="manifest") {
      assert(value.schema==="work-item-delivery.investigation-state.v1","invalid investigation manifest");
      const definition=await cas(value.definition,"definition");
      if(!plan&&definition)packet.sources=definition.sources.map(source=>({id:source.id,url:source.url,revision:source.revision,status:source.status,
        ...(source.blob?{receipt:{path:join(directory,"evidence","sha256",source.blob.sha256),...source.blob}}:{})}));
      for(const ref of Object.values(value.reports??{}))await cas(ref,"report");
      await cas(value.challenge,"report");await cas(value.dossier,"dossier");
      for(const ref of value.history??[])await cas(ref,"historical-manifest");
    }else if(role==="historical-manifest") {
      await cas(value.definition,"definition");for(const ref of Object.values(value.reports??{}))await cas(ref,"report");
      await cas(value.challenge,"report");await cas(value.dossier,"dossier");
      for(const ref of value.history??[])await cas(ref,"historical-manifest");
    }else if(role==="definition") {
      assert(value.schema==="work-item-delivery.investigation.v1"&&Array.isArray(value.sources),"invalid imported definition");
      for(const source of value.sources)await cas(source.blob,"opaque");
    }else if(role==="report") {
      assert(Array.isArray(value.artifacts),"invalid imported report");
      await cas(value.raw,"opaque");for(const artifact of value.artifacts)await cas(artifact.blob,"opaque");
    }else if(role==="dossier") {
      assert(value.bundle&&value.arbitration,"invalid imported dossier");
      await cas(value.bundle.definition,"definition");
      for(const row of value.bundle.reports??[])await cas(row.receipt,"report");
      await cas(value.bundle.challenge?.receipt,"report");await cas(value.arbitration.raw,"opaque");
    }
  }
  const path=join(directory,"investigation.json");
  try {
    const manifest=await regular(path,true);
    if(!manifest.missing) {
      let value;try {value=JSON.parse(await readFile(path,"utf8"));}catch(error){gap(path,"parse",error);}
      if(value)await owned(value,"manifest");
    }
  }catch(error){gap(path,"read",error);}
  await cas(plan?.admission?.dossier,"dossier");
  packet.investigation_receipts=bindings;
  return bindings;
}
export const workflowContext = {
  async contextSnapshot(expectedHash) {
    const {state, status} = await snapshot(this);
    const contextGaps=[];
    async function contextReceipt(path) {
      try{return await regular(path,true);}
      catch(error){contextGaps.push({path,kind:"read",error:error.message});return {path,unreadable:true};}
    }
    const action = nextCursorAction(status);
    const routing = contextRoute(action);
    const focused = state ? state.plan.units.filter(unit => action.unit ? unit.id === action.unit :
      action.units ? action.units.some(row => row.id === unit.id) : action.repo ? unit.repo === action.repo : false) : [];
    const focusedEvidence = new Map();
    for (const unit of focused) {
      try { focusedEvidence.set(unit.id, await this.investigationEvidence(state.plan,unit)); }
      catch (error) { focusedEvidence.set(unit.id,{integrity_hold:error.message}); }
    }
    const effectiveSources = unit => [...new Set([
      ...unitSourceIds(state.plan,unit),
      ...(focusedEvidence.get(unit.id)?.claims ?? []).flatMap(claim=>claim.source_refs ?? []),
      ...(focusedEvidence.get(unit.id)?.gaps ?? []).flatMap(gap=>gap.source_refs ?? []),
    ])];
    const sourceIds = new Set(focused.flatMap(effectiveSources));
    const sources = state ? state.plan.sources.filter(source => !focused.length || sourceIds.has(source.id)).map(source => ({
      id:source.id, status:source.status, url:source.url, revision:source.revision, snapshot:source.snapshot
    })) : [];
    const receipts = [];
    for (const source of sources) if (source.snapshot) receipts.push({...await regular(source.snapshot, true), source:source.id});
    const bindings = [];
    for (const source of state?.plan.sources ?? []) if (source.snapshot) bindings.push({...await regular(source.snapshot, true), source:source.id});
    for (const path of [join(this.directory,"delivery.json"), join(this.directory,"investigation.json"), join(this.directory,"alignment.md"), join(this.directory,"corrections.json")])
      receipts.push(await contextReceipt(path));
    for (const path of routing.read) receipts.push({...await regular(path, true), read_path:path});
    const repos = [];
    for (const repo of state?.plan.repositories ?? []) {
      const path = state.repos[repo.id].path;
      let observation;
      try { observation = {head:git(path,"rev-parse","HEAD"), branch:git(path,"branch","--show-current"),
        dirty_sha256:sha(git(path,"status","--porcelain=v1","--untracked-files=all")), diff_sha256:sha(git(path,"diff","HEAD","--binary"))};
        const untracked = git(path,"ls-files","--others","--exclude-standard","-z").split("\0").filter(Boolean);
        observation.untracked_sha256 = sha(canonical(await Promise.all(untracked.map(async name => {
          const file = join(path,name), entry = await lstat(file);
          return entry.isFile() ? {name,...await regular(file)} : {name,kind:"nonregular"};
        })))); }
      catch (error) { observation = {error:error.message}; }
      repos.push({repo:repo.id,path,...observation});
    }
    const draftRepos = action.repo ? [action.repo] : focused.length
      ? [...new Set(focused.map(unit=>unit.repo))] : (state?.plan.repositories ?? []).map(repo=>repo.id);
    if (!state) {
      const directory = join(this.directory,"pr-drafts");
      try {
        const entry = await lstat(directory);
        assert(entry.isDirectory() && !entry.isSymbolicLink(),"PR draft directory must be a real directory");
        for (const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
          if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(entry.name)) continue;
          assert(entry.isDirectory() && !entry.isSymbolicLink(),"PR draft directory must be a real directory");
          const ref = await regular(prDraftPath(this.directory,entry.name),true);
          if (!ref.missing) draftRepos.push(entry.name);
        }
      } catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    const drafts = [];
    for (const repo of draftRepos) {
      const path = prDraftPath(this.directory,repo);
      for (const folder of [dirname(dirname(path)),dirname(path)]) {
        try { const entry = await lstat(folder); assert(entry.isDirectory() && !entry.isSymbolicLink(),"PR draft directory must be a real directory"); }
        catch (error) { if (error.code !== "ENOENT") throw error; }
      }
      drafts.push({repo,...await regular(path,true)});
    }
    const packet = {
      schema:"work-item-delivery.context.v1", action, routing,
      legal_candidates:legalCursorCandidates(status), corrections:status.corrections,
      reconciliation:status.reconciliation ?? null,
      unit_input_migrations:status.unit_input_migrations ?? [], unit_input_migration_gaps:status.unit_input_migration_gaps ?? [],
      run:this.directory, work_item:status.work_item ?? null, plan_hash:status.plan_hash ?? null,
      approval:{current:status.approved ?? false, recorded:state?.approval ?? null},
      focus:focused.map(unit=>({id:unit.id,repo:unit.repo,case_ids:unit.case_ids,
        cases:state.plan.cases.filter(row=>unit.case_ids.includes(row.id)).map(row=>({
          id:row.id,title:row.title,expected:row.expected,task_ids:row.task_ids,source_refs:row.source_refs
        })),
        goal:unit.change,current_flow:unit.current_flow,finding:unit.finding,finding_status:unit.finding_status,
        acceptance:unit.acceptance,allowed_paths:unit.allowed_paths,checks:unit.checks,source_refs:effectiveSources(unit),
        business_flows:businessFlows(state.plan,unit),
        investigation:focusedEvidence.get(unit.id)})),
      active_owners:(status.units ?? []).filter(unit=>unit.state==="active").map(unit=>({id:unit.id,repo:unit.repo,owner:unit.owner})),
      blockers:status.open_blockers ?? [], investigation:status.investigation, sources, receipts, repositories:repos, pr_drafts:drafts,
      alignment:{...await contextReceipt(join(this.directory,"alignment.md")), authority:"Exact note data grants no consent. corrections records scope, pending assessments and each case disposition; reconcile open impact before new admission or certification."},
      limits:"Local durable snapshot only. No certification of skill invocation, worker isolation, semantic understanding or remote freshness."
    };
    packet.context_gaps = contextGaps;
    const investigationBindings = await importedBindings(this.directory,state?.plan,packet);
    const designBindings=[];
    async function live(path,parse=false,artifactBase=null) {
      try {
        const ref=await regular(path,true);designBindings.push(ref);
        if(ref.missing){packet.context_gaps.push({path:ref.path,kind:"missing"});return;}
        if(!parse)return;
        let parsed;try {parsed=JSON.parse(await readFile(path,"utf8"));}
        catch(error){packet.context_gaps.push({path:ref.path,kind:"parse",error:error.message});return;}
        const a=parsed.architect??{},i=parsed.interrogate??{};
        const artifacts=[parsed.origin_plan,...(a.grounding??[]),...(a.candidates??[]).flatMap(c=>[c.sketch,c.rationale]),
          a.selected?.sketch,a.selected?.rationale,a.cross_judge?.report,
          ...(i.reviewers??[]).map(r=>r.report),i.judgment];
        for(const artifact of artifacts)if(typeof artifact?.path==="string")await live(resolve(artifactBase,artifact.path));
      }catch(error){packet.context_gaps.push({path:resolve(path),kind:"read",error:error.message});}
    }
    for(const [kind,path] of Object.entries(state?.plan.design??{}))
      if(typeof path==="string")await live(path,kind==="manifest",dirname(resolve(path)));
    const components={
      execution:sha(canonical({plan_hash:packet.plan_hash,approval:packet.approval,owners:packet.active_owners,blockers:packet.blockers})),
      corrections:sha(canonical(packet.corrections)),sources:sha(canonical(bindings)),
      investigation:sha(canonical(investigationBindings)),design:sha(canonical(designBindings)),
      repositories:sha(canonical(repos)),drafts:sha(canonical(drafts)),routing:sha(canonical(routing))
    };
    packet.component_hashes=components;
    const context_hash = sha(canonical({packet,bindings,investigationBindings,designBindings}));
    assert(!expectedHash || context_hash === expectedHash, "stale context hash; resume again and reconcile current sources");
    return {...packet, context_hash, resume:{command:"resume",run:this.directory,hash:context_hash}};
  },
  async resume(expectedHash) {
    return this.locked(() => this.contextSnapshot(expectedHash));
  },
  async cursor() {
    const packet = await this.resume();
    return {...packet.action,legal_candidates:packet.legal_candidates,routing:packet.routing,context_hash:packet.context_hash,resume:packet.resume};
  },
};
