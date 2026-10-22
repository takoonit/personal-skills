import { readFile, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";

const need = (ok, message) => { if (!ok) throw new Error(message); };
const words = (value) => typeof value === "string" && value.trim();
const list = (value) => Array.isArray(value) && value.length > 0;

export function validateContext(plan) {
  if (plan.schema !== "work-item-delivery.plan.v2") return;
  const sources = new Map(plan.sources.map(s => [s.id, s]));
  const cases = new Set(plan.cases.map(c => c.id));
  const refs = (rows, label) => {
    need(list(rows) && rows.every(key => sources.has(key)), `${label}: cite existing source IDs`);
  };
  for (const provider of ["second_brain", "confluence"]) {
    const search = plan.knowledge?.[provider];
    need(search && ["read", "gap"].includes(search.status), `knowledge.${provider}: record research or explicit gap`);
    need(words(search.query) && words(search.summary), `${provider}: search and business-context summary required`);
    refs(search.source_refs, provider);
    need(search.source_refs.some(key => sources.get(key).kind === provider), `${provider}: source kind must identify the provider`);
    if (search.status === "read") need(search.source_refs.some(key => sources.get(key).kind === provider && sources.get(key).status === "read"), `${provider}: read context requires a read snapshot`);
    if (search.status === "gap") need(words(search.gap), `${provider}: describe missing evidence`);
  }
  const flows = plan.knowledge?.business_flows;
  need(list(flows), "cited business flows are required");
  for (const flow of flows) {
    need(words(flow.id) && words(flow.actor) && words(flow.trigger) && words(flow.outcome), "business flow needs id, actor, trigger and outcome");
    need(list(flow.case_ids) && flow.case_ids.every(id => cases.has(id)), "business flow must map known cases");
    need(Array.isArray(flow.preconditions) && list(flow.steps), "business flow needs preconditions and steps");
    for (const step of flow.steps) {
      need(words(step.action) && words(step.business_rule), "flow step needs action and business rule");
      refs(step.source_refs, "business-flow step");
    }
  }
  const captures = plan.capture_plan;
  need(Array.isArray(captures), "capture_plan is required");
  need(new Set(captures.map(c => c.id)).size === captures.length, "duplicate capture IDs");
  for (const capture of captures) {
    need(words(capture.id) && plan.repositories.some(r => r.id === capture.repo), "capture needs id and known repository");
    need(list(capture.case_ids) && capture.case_ids.every(id => cases.has(id)), "capture must map known cases");
    need(["playwright", "not-applicable"].includes(capture.tool), "capture tool must be playwright or an explicit not-applicable disposition");
    if (capture.tool === "not-applicable") need(words(capture.reason), "non-UI evidence requires a reason");
    else {
      need(words(capture.environment) && words(capture.url), "capture needs environment and URL");
      let local = false;
      try { local = [capture.url,capture.before_url ?? capture.url].every(url => ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)); } catch {}
      need(local && ["local", "local-fixture", "local-real-data"].includes(capture.environment), "browser evidence must run on a local loopback URL with an explicit local data scope");
      need(list(capture.steps) && list(capture.assertions), "capture needs observable steps and assertions");
    }
  }
  for (const id of cases) {
    need(flows.some(f => f.case_ids.includes(id)), `missing business flow for ${id}`);
    need(captures.some(c => c.case_ids.includes(id)), `missing evidence disposition for ${id}`);
  }
}

export async function fileReceipt(path) {
  const absolute = await realpath(path);
  const bytes = await readFile(absolute);
  need(bytes.length > 0, "capture artifact is empty");
  return { path:absolute, bytes:bytes.length, sha256:createHash("sha256").update(bytes).digest("hex") };
}

export async function captureReceipt(plan, input) {
  const capture = plan.capture_plan?.find(c => c.id === input.capture_id && c.tool === "playwright");
  need(capture, "unknown Playwright capture ID");
  need(input.tool === "playwright", "capture must identify Playwright");
  need(["before", "after", "blocker"].includes(input.phase), "invalid capture phase");
  const urls = input.phase === "blocker" ? [capture.url,capture.before_url ?? capture.url] : [input.phase === "before" ? capture.before_url ?? capture.url : capture.url];
  need(input.environment === capture.environment && urls.includes(input.url), "capture environment/URL differs from approved plan");
  need(Number.isFinite(Date.parse(input.captured_at)), "capture timestamp required");
  need(words(input.observed) && words(input.locale) && words(input.timezone), "capture needs observation, locale and timezone");
  need(input.viewport?.width > 0 && input.viewport?.height > 0, "capture viewport required");
  need(list(input.steps) && input.steps.every(words), "record actual browser steps");
  need(["observed", "passed", "failed", "blocked"].includes(input.outcome), "capture outcome required");
  if (input.phase === "blocker" || ["failed", "blocked"].includes(input.outcome)) need(words(input.reason), "capture failure/blocker reason required");
  if (input.phase === "after" && input.outcome === "passed") {
    need(/^[a-f0-9]{40,64}$/.test(input.git_head), "passing after capture must identify the tested Git head");
    need(list(input.assertions) && input.assertions.length === capture.assertions.length && input.assertions.every((a, i) => a.expected === capture.assertions[i] && a.passed === true && words(a.actual)), "record observed passing results for every planned assertion");
  }
  need(list(input.artifacts), "capture artifacts required");
  const artifacts = [];
  for (const artifact of input.artifacts) {
    need(["screenshot", "dom", "trace", "network", "console", "video"].includes(artifact.kind), "unknown capture artifact kind");
    const proof = await fileReceipt(artifact.path);
    if (artifact.kind === "screenshot") {
      const bytes = await readFile(proof.path);
      need(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || (bytes[0] === 255 && bytes[1] === 216), "screenshot must contain PNG/JPEG bytes");
    }
    artifacts.push({kind:artifact.kind,...proof});
  }
  need(input.phase === "blocker" || artifacts.some(a => a.kind === "screenshot"), "Playwright screenshot is required");
  return {...input,artifacts};
}

export async function captureBinding(plan, capture) {
  const cases = plan.cases.filter(c => capture.case_ids.includes(c.id));
  const flows = plan.knowledge.business_flows.filter(f => f.case_ids.some(id => capture.case_ids.includes(id)));
  const ids = new Set([...cases.flatMap(c => c.source_refs), ...flows.flatMap(f => f.steps.flatMap(step => step.source_refs))]);
  const sources = [];
  for (const source of plan.sources.filter(s => ids.has(s.id))) sources.push({...source, ...(source.status === "read" ? {receipt:await fileReceipt(source.snapshot)} : {})});
  return createHash("sha256").update(JSON.stringify({capture,cases,flows,sources})).digest("hex");
}

export async function captureCoverage(state, repo, head, phase = null, caseIds = null) {
  if (state.plan.schema !== "work-item-delivery.plan.v2") return { ready:false, missing:["legacy plan: add business context and evidence contract"] };
  const missing = [];
  for (const capture of state.plan.capture_plan.filter(c => c.repo === repo && c.tool === "playwright" && (!caseIds || c.case_ids.some(id => caseIds.includes(id))))) {
    const contextHash = await captureBinding(state.plan, capture);
    for (const stage of phase ? [phase] : ["before", "after"]) {
      const failure = c => c.phase === "blocker" || ["failed", "blocked"].includes(c.outcome) ? 1 : 0;
      const latest = (state.captures ?? []).filter(c => c.capture_id === capture.id && [stage, "blocker"].includes(c.phase) && c.context_hash === contextHash && (stage === "before" || c.plan_hash === state.plan_hash)).sort((a,b) => Date.parse(a.captured_at) - Date.parse(b.captured_at) || failure(a) - failure(b)).at(-1);
      const candidates = latest && latest.phase === stage && (stage === "before" ? ["observed", "passed"].includes(latest.outcome) : latest.outcome === "passed" && latest.git_head === head) ? [latest] : [];
      let valid = false;
      for (const row of candidates) {
        try {
          const files = [row.evidence, ...row.artifacts];
          valid = (await Promise.all(files.map(async file => (await fileReceipt(file.path)).sha256 === file.sha256))).every(Boolean);
        } catch { valid = false; }
        if (valid) break;
      }
      if (!valid) missing.push(`${capture.id}:${stage}`);
    }
  }
  return {ready:missing.length === 0,missing};
}
