#!/usr/bin/env node
import { readFile, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { Delivery } from "../lib/delivery.mjs";

const need = (condition, message) => { if (!condition) throw new Error(message); };
const text = value => typeof value === "string" && Boolean(value.trim());
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const list = (value, label, minimum = 0) => {
  need(Array.isArray(value) && value.length >= minimum, `${label}: missing/incomplete list`);
  return value;
};
const unique = (values, label) => need(new Set(values).size === values.length, `${label}: duplicate entries`);
const pairDigest = (sketch, rationale) => sha(JSON.stringify({ sketch: sketch.sha256, rationale: rationale.sha256 }));

function roles(bytes, role) {
  const prefix = role + ":";
  const rows = bytes.toString("utf8").split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith(prefix));
  need(rows.length === 1, `Configuration needs one unambiguous ${role} row`);
  const models = rows[0].slice(prefix.length).split(",").map(entry => entry.trim().split(/\s+@/)[0]);
  need(models.every(model => /^[\w./:-]+$/.test(model) && !["auto", "inherit-parent"].includes(model)),
    `${role}: resolve model aliases in the authoritative configuration snapshot first`);
  return models;
}

export async function checkDesign(planPath, manifestPath, modelsPath) {
  const plan = JSON.parse(await readFile(planPath, "utf8"));
  need(plan?.schema === "work-item-delivery.plan.v2", "Use a v2 investigation plan");
  list(plan.sources, "Plan sources", 1);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  need(manifest?.schema === "work-item-delivery.design.v1", "Unsupported design manifest");
  const modelsBytes = await readFile(modelsPath);
  const modelsHash = sha(modelsBytes);
  const runners = roles(modelsBytes, "architect runners");
  const pool = roles(modelsBytes, "arena cross-judge pool");
  const reviewers = roles(modelsBytes, "interrogate reviewers");
  need(runners.length >= 2, "Architect needs at least two configured candidate seats");
  // fingerprint does not initialize/open the store or write an execution ledger.
  const planHash = await new Delivery(dirname(resolve(planPath))).fingerprint(plan);
  const context = (record, label) => need(record?.plan_hash === planHash && record?.models_sha256 === modelsHash,
    `${label}: stale plan/configuration context; renew stages, not just wrapper hashes`);
  context(manifest, "Manifest");
  const cached = new Map();
  const artifact = async (record, label) => {
    need(record && text(record.path) && /^[a-f0-9]{64}$/.test(record.sha256), `${label}: invalid artifact receipt`);
    const path = await realpath(resolve(dirname(resolve(manifestPath)), record.path));
    if (!cached.has(path)) {
      const bytes = await readFile(path);
      need(bytes.length, `${label}: empty artifact`);
      cached.set(path, sha(bytes));
    }
    need(cached.get(path) === record.sha256, `${label}: artifact bytes changed`);
    return { path, sha256: record.sha256 };
  };
  const pair = async (record, label) => pairDigest(
    await artifact(record.sketch, label + " sketch"), await artifact(record.rationale, label + " rationale"));
  const seats = (records, models, prefix) => {
    list(records, prefix, models.length);
    need(records.length === models.length, `${prefix}: configured seat count differs`);
    unique(records.map(row => row.seat), prefix);
    for (const [index, model] of models.entries()) {
      const seat = prefix + "-" + (index + 1);
      need(records.some(row => row.seat === seat && row.model === model), `${prefix}: missing configured seat ${seat}/${model}`);
    }
  };

  const design = manifest.architect;
  for (const [index, item] of list(design.grounding, "Grounding", 1).entries()) await artifact(item, `Grounding ${index}`);
  seats(design.candidates, runners, "architect");
  need(new Set(design.candidates.map(row => row.shape?.trim())).size >= 2 && design.candidates.every(row => text(row.shape)),
    "Declare at least two structurally distinct candidate shapes");
  const candidates = new Map();
  const candidatePaths = [];
  for (const row of design.candidates) {
    context(row, row.seat);
    candidates.set(row.seat, await pair(row, row.seat));
    candidatePaths.push((await artifact(row.sketch, row.seat)).path);
  }
  unique(candidatePaths, "Candidate sketch paths");
  const judge = design.cross_judge;
  context(judge, "Cross-judge");
  need(pool.includes(judge.model), "Cross-judge model is outside the configured pool");
  await artifact(judge.report, "Cross-judge report");
  const judged = list(judge.candidates, "Cross-judge candidates", candidates.size);
  unique(judged.map(row => row.seat), "Cross-judge candidates");
  need(judged.length === candidates.size && judged.every(row => candidates.has(row.seat) && candidates.get(row.seat) === row.digest),
    "Cross-judge must reference every exact candidate digest");
  need(candidates.has(design.selected.base_seat), "Selected base is not a candidate");
  const subject = await pair(design.selected, "Selected design");

  const review = manifest.interrogate;
  need(review.subject_sha256 === subject, "Interrogate subject differs from selected design");
  seats(review.reviewers, reviewers, "reviewer");
  const declared = new Set();
  const reportPaths = [];
  for (const row of review.reviewers) {
    context(row, row.seat);
    need(row.outcome === "completed" && row.subject_sha256 === subject, `${row.seat}: incomplete review or wrong subject`);
    reportPaths.push((await artifact(row.report, row.seat + " report")).path);
    const findings = list(row.findings, row.seat + " findings");
    unique(findings.map(finding => finding.id), row.seat + " findings");
    for (const finding of findings) {
      need(text(finding.id) && text(finding.summary), `${row.seat}: incomplete declared finding`);
      declared.add(JSON.stringify([row.seat, finding.id]));
    }
  }
  unique(reportPaths, "Reviewer report paths");
  await artifact(review.judgment, "Lead judgment");
  const dispositions = list(review.findings, "Lead dispositions");
  const classified = new Set();
  for (const finding of dispositions) {
    const key = JSON.stringify([finding.reviewer, finding.finding]);
    need(declared.has(key) && !classified.has(key), "Orphan or duplicate finding disposition");
    need(["Act On", "Consider", "Noted", "Dismissed"].includes(finding.bucket) && text(finding.rationale), "Invalid finding bucket/rationale");
    need(finding.bucket !== "Act On", "Unresolved Act On finding; revise the design and renew review");
    classified.add(key);
  }
  need(classified.size === declared.size, "Missing lead disposition for a declared finding");
  return { status: "DESIGN_CHECKED", plan_hash: planHash, models_sha256: modelsHash, subject_sha256: subject };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { plan: { type: "string" }, file: { type: "string" }, models: { type: "string" } } });
    need(values.plan && values.file && values.models, "Required: --plan PLAN --file MANIFEST --models CONFIG");
    console.log(JSON.stringify(await checkDesign(values.plan, values.file, values.models), null, 2));
  } catch (error) {
    console.error("INCOMPLETE: " + error.message);
    process.exitCode = 1;
  }
}
