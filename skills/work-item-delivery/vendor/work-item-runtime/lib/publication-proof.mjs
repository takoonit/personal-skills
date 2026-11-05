import { fileReceipt, latestCapture } from "./evidence.mjs";
import { git } from "./delivery-common.mjs";

const need = (ok, message) => { if (!ok) throw new Error(message); };
const words = value => typeof value === "string" && value.trim();
const md = value => String(value).replace(/[\\`*_{}\[\]<>#|]/g, "\\$&").replace(/\s+/g, " ").trim();
const full = artifact => artifact.kind === "screenshot" && ["viewport", "full-page"].includes(artifact.framing);
const symbolic = href => /^attachment:([A-Za-z0-9._-]+)$/.exec(href ?? "")?.[1];
// After is required; Before is shown only when the case supplies it.
const phases = row => row.before === undefined ? ["after"] : ["before", "after"];

function destination(href) {
  if (symbolic(href)) return href;
  let url;
  try { url = new URL(href); } catch { throw new Error("proof image requires HTTPS or attachment:NAME"); }
  need(url.protocol === "https:" && !url.username && !url.password, "proof image requires credential-free HTTPS");
  return url.href.replace(/[<>\\]/g, char => "%" + char.charCodeAt(0).toString(16).toUpperCase());
}

function supporting(value) {
  if (words(value)) return md(value);
  need(value && words(value.text) && words(value.href) && !symbolic(value.href), "supporting proof requires text or a named HTTPS link");
  return `[${md(value.text)}](<${destination(value.href)}>)`;
}

export function assertPublicationSize(description) {
  need(description.length <= 4000 && [...description].length <= 4000,
    `PR description exceeds 4000 characters (${description.length} UTF-16 units, ${[...description].length} codepoints)`);
}

export function renderPublicationProof(proof) {
  const lines = ["## Proof of Works"];
  for (const row of proof.cases ?? []) {
    lines.push("", `### ${md(row.case_id)}: ${md(row.title)}`, `${md(row.role)}. ${md(row.setup)}.`,
      `Actions: ${(row.actions ?? []).map(md).join(" → ")}. Expected: ${md(row.expected)}.`);
    for (const phase of phases(row)) {
      const value = row[phase], label = phase === "before" ? "Before" : "After";
      lines.push("", `**${label}:** ${md(value.observed)}`,
        `Scope: ${md(value.environment)}; head ${md(value.head)}; executor ${md(value.executor)}.`,
        `![${label} ${md(row.case_id)}](<${destination(value.image.href)}>)`,
        `[Full-size ${label.toLowerCase()}](<${destination(value.image.href)}>)`);
    }
  }
  if (proof.supporting?.length) lines.push("", "**Supporting automated checks**", ...proof.supporting.map(supporting));
  return lines.join("\n");
}

function assertProofContext(prefix) {
  prefix = prefix.replace(/\r\n?/g, "\n");
  const message = "publication Proof of Works must start in visible top-level Markdown";
  need(!prefix || prefix.endsWith("\n"), message);
  let fence, html;
  const lines = prefix.split(/\r?\n/);
  if (prefix.endsWith("\n")) lines.pop();
  for (let line of lines) {
    if (fence) {
      const closing = /^ {0,3}(`+|~+)[ \t]*$/.exec(line)?.[1];
      if (closing?.[0] === fence[0] && closing.length >= fence.length) fence = undefined;
      continue;
    }
    if (html) {
      if (html === "block") { if (!line.trim()) html = undefined; continue; }
      const closing = html.exec(line);
      if (!closing) continue;
      line = line.slice(closing.index + closing[0].length); html = undefined;
    }
    const opening = /^ {0,3}(`{3,}|~{3,})([\s\S]*)$/.exec(line);
    if (opening && (opening[1][0] !== "`" || !opening[2].includes("`"))) { fence = opening[1]; continue; }
    line = line.replace(/(`+)(.*?)\1(?!`)/g, "");
    const tokens = /<!--|<\?|<!\[CDATA\[|<![A-Z]|<(pre|script|style|textarea)(?=[\s>])/ig;
    for (let token; (token = tokens.exec(line));) {
      if ((/\\+$/.exec(line.slice(0, token.index))?.[0].length ?? 0) % 2) continue;
      const end = token[1] ? new RegExp(`</${token[1]}\\s*>`, "i")
        : token[0] === "<!--" ? /-->/ : token[0] === "<?" ? /\?>/ : token[0] === "<![CDATA[" ? /\]\]>/ : />/;
      const closing = end.exec(line.slice(tokens.lastIndex));
      if (!closing) { html = end; break; }
      tokens.lastIndex += closing.index + closing[0].length;
    }
    const blockTag = /^ {0,3}<\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?=[\s/>])/i;
    const completeTag = /^ {0,3}(?:<[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z_:][A-Za-z0-9_.:-]*(?:\s*=\s*(?:[^ "'=<>`]+|'[^']*'|"[^"]*"))?)*\s*\/?>|<\/[A-Za-z][A-Za-z0-9-]*\s*>)[ \t]*$/;
    if (!html && (blockTag.test(line) || completeTag.test(line))) html = "block";
  }
  need(!fence && !html, message);
}

export async function validatePublicationProof(state, repo, request) {
  const captures = (state.plan.capture_plan ?? []).filter(c => c.repo === repo && c.tool === "playwright");
  if (!captures.length) return null;
  need(git(state.repos[repo].path, "rev-parse", "HEAD") === request.head, "publication proof source head is stale");
  const proof = request.publication_proof;
  need(proof?.schema === "work-item-delivery.publication-proof.v1" && Array.isArray(proof.cases), "UI publication proof is required");
  const caseIds = [...new Set(captures.flatMap(c => c.case_ids))];
  need(proof.cases.length === caseIds.length && new Set(proof.cases.map(c => c.case_id)).size === caseIds.length &&
    proof.cases.every(c => caseIds.includes(c.case_id)), "publication proof must cover every UI case exactly once");
  need(proof.supporting === undefined || Array.isArray(proof.supporting), "supporting proof must be an array");
  for (const value of proof.supporting ?? []) supporting(value);
  const dependencies = new Map(), images = [];
  const remember = async file => {
    const actual = await fileReceipt(file.path);
    need(actual.sha256 === file.sha256 && (file.bytes === undefined || actual.bytes === file.bytes), "publication proof dependency changed");
    dependencies.set(actual.path, actual);
  };
  for (const row of proof.cases) {
    for (const field of ["title", "role", "setup", "expected"]) need(words(row[field]), `publication proof ${row.case_id}: ${field} required`);
    need(Array.isArray(row.actions) && row.actions.length && row.actions.every(words), "publication proof actions required");
    const flow = state.plan.knowledge?.business_flows?.find(f => f.id === row.flow_id && f.case_ids.includes(row.case_id));
    need(flow, "publication proof must bind an approved case/flow");
    for (const phase of phases(row)) {
      const value = row[phase];
      need(value && words(value.observed) && words(value.executor), `publication proof ${phase} observation and executor required`);
      need(/^[a-f0-9]{40,64}$/.test(value.head), "publication proof source head required");
      const planned = captures.find(c => c.id === value.capture_id && c.case_ids.includes(row.case_id));
      need(planned, "publication proof capture/case differs from approved plan");
      const latest = await latestCapture(state, planned, request.head, phase);
      need(latest && latest.evidence.sha256 === value.evidence_sha256, `publication proof requires latest valid ${phase} capture`);
      need(value.environment === latest.environment && value.head === latest.git_head, "publication proof environment/source head differs from capture");
      const image = latest.artifacts.find(a => a.path === value.image?.path && a.sha256 === value.image?.sha256 && full(a));
      need(image && full(image), "publication proof requires full viewport or full-page framing; crop/unknown cannot be primary");
      destination(value.image.href);
      const name = symbolic(value.image.href) ?? value.image.name;
      need(words(name), "proof image must bind one named attachment");
      const attachments = (request.attachments ?? []).filter(a => a.name === name);
      need(attachments.length === 1, "proof image must bind one named attachment");
      const attachment = await fileReceipt(attachments[0].path);
      need(attachment.path === image.path && attachment.sha256 === image.sha256 && attachment.bytes === image.bytes, "proof attachment path/bytes differ from image");
      if (!symbolic(value.image.href)) need(destination(attachments[0].url) === destination(value.image.href), "approved hosted image attachment destination differs");
      images.push({ href: value.image.href, name, ...image });
      for (const file of [latest.evidence, ...latest.artifacts]) await remember(file);
    }
    const requirement = state.plan.cases.find(c => c.id === row.case_id);
    const refs = new Set([...requirement.source_refs, ...flow.steps.flatMap(step => step.source_refs)]);
    for (const source of state.plan.sources.filter(s => refs.has(s.id) && s.status === "read")) {
      const actual = await fileReceipt(source.snapshot); dependencies.set(actual.path, actual);
    }
  }
  const rendered = renderPublicationProof(proof);
  const proofStart = typeof request.description === "string" ? request.description.indexOf("## Proof of Works") : -1;
  need(proofStart >= 0 && request.description.slice(proofStart) === rendered,
    "publication Proof of Works must match the compact case journeys and inline full images");
  assertPublicationSize(request.description);
  assertProofContext(request.description.slice(0, proofStart));
  return { dependencies: [...dependencies.values()], images };
}

export function materializePublicationDescription(request, attachments, uploads) {
  let description = request.description;
  const images = (request.publication_proof?.cases ?? []).flatMap(row => phases(row).map(phase => row[phase]?.image));
  need(images.every(image => words(symbolic(image?.href) ?? image?.name)), "proof image requires a named attachment");
  const names = [...new Set(images.map(image => symbolic(image?.href) ?? image?.name).filter(Boolean))];
  if (names.length) need(new Set(uploads.map(a => a.name)).size === uploads.length && uploads.every(a => attachments.some(b => a.name === b.name)), "proof upload mapping duplicate or foreign attachment");
  for (const name of names) {
    const approved = attachments.filter(a => a.name === name), actual = uploads.filter(a => a.name === name);
    need(approved.length === 1 && actual.length === 1, "proof upload mapping missing or duplicate attachment");
    need(actual[0].sha256 === approved[0].sha256 && actual[0].bytes === approved[0].bytes, "proof upload mapping attachment bytes differ");
    const bound = images.filter(image => (symbolic(image?.href) ?? image?.name) === name);
    need(bound.every(image => image.sha256 === approved[0].sha256 && image.path === approved[0].path), "proof upload mapping image identity differs");
    const url = destination(actual[0].url);
    need(!symbolic(url), "proof upload destination must be HTTPS");
    need(bound.every(image => symbolic(image.href) || destination(image.href) === url), "hosted proof upload destination differs");
    if (!bound.some(image => symbolic(image.href))) continue;
    const slot = `(<attachment:${name}>)`, replacement = `(<${url}>)`;
    const count = images.filter(image => symbolic(image?.href) === name).length * 2;
    need(description.split(slot).length - 1 === count, "approved symbolic proof image slots differ");
    description = description.replaceAll(slot, replacement);
  }
  need(!/\(<attachment:/.test(description), "unresolved proof image destination");
  assertPublicationSize(description);
  return description;
}
