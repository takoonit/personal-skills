import { readFile, writeFile, rename, realpath } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const text = (value, label) =>
  assert(typeof value === "string" && value.trim(), `${label} is required`);
const array = (value, label) =>
  assert(Array.isArray(value), `${label} must be an array`);
const id = (value, label) =>
  assert(
    typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value),
    `${label}: invalid id`,
  );
const git = (path, ...args) =>
  execFileSync("git", ["-C", path, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const atLeast = (actual, stage) =>
  [
    "pending",
    "active",
    "implemented",
    "verified",
    "reviewed",
    "published",
  ].indexOf(actual) >=
  ["implemented", "verified", "reviewed", "published"].indexOf(stage) + 2;
const unique = (rows, label) =>
  assert(new Set(rows).size === rows.length, `duplicate ${label}`);
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const repositoryIdentity = path => realpathSync(git(path, "rev-parse", "--path-format=absolute", "--git-common-dir"));
const businessFlows = (plan, unit) => (plan.knowledge?.business_flows ?? []).filter(flow => flow.case_ids.some(id => unit.case_ids.includes(id)));
const unitSourceIds = (plan, unit) => [...new Set([
  ...unit.source_refs,
  ...plan.cases.filter(c => unit.case_ids.includes(c.id)).flatMap(c => c.source_refs),
  ...unit.depends_on.flatMap(dep => dep.source_refs),
  ...businessFlows(plan, unit).flatMap(flow => flow.steps.flatMap(step => step.source_refs)),
])];
async function planFingerprint(plan) {
  const inputs = [];
  for (const source of plan.sources.filter(s=>s.status==="read")) inputs.push({id:source.id,...await receipt(source.snapshot)});
  return sha(canonical({plan,inputs}));
}
async function unitInputHash(plan, unit, evidence) {
  const inputs = [];
  for (const key of unitSourceIds(plan, unit).sort()) {
    const source = plan.sources.find(s => s.id === key);
    inputs.push({...source, ...(source.status === "read" ? {receipt:await receipt(source.snapshot)} : {})});
  }
  return sha(canonical({unit, evidence, cases:plan.cases.filter(c => unit.case_ids.includes(c.id)), flows:businessFlows(plan, unit), inputs}));
}
const without = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
const executionUnit = unit => {
  const extensions=without(unit.investigation??{},["claim_ids","gap_ids"]);
  return {...without(unit, ["investigation", "priority", "checks"]),
    ...(Object.keys(extensions).length?{investigation:extensions}:{}),
    checks:unit.checks?.map(check => without(check, ["timeout_ms"])),
  };
};
const semanticWorkItem = workItem => without(workItem, ["revision"]);
async function unitExecutionHash(plan, unit, version = 3) {
  const hash = await unitInputHash(plan, executionUnit(unit));
  const repository = plan.repositories.find(repo => repo.id === unit.repo);
  return sha(canonical({hash, repository:without(repository, ["branch"]),
    work_item:version===2?plan.work_item:semanticWorkItem(plan.work_item), policy:plan.policy?without(plan.policy,["branch_prefix"]):{},
    knowledge:without(plan.knowledge??{},["business_flows"]),
    captures:(plan.capture_plan??[]).filter(row=>row.case_ids.some(key=>unit.case_ids.includes(key))),
    extensions:without(plan,["schema","work_item","policy","sources","cases","units","repositories","blockers","knowledge","capture_plan","design","admission"]),
  }));
}
async function designProjection(plan) {
  const projected = structuredClone(plan);
  if (projected.design) {
    projected.design = without(projected.design, ["manifest", "models"]);
    if (!Object.keys(projected.design).length) delete projected.design;
  }
  if (projected.policy) {
    projected.policy = without(projected.policy, ["branch_prefix"]);
    if (!Object.keys(projected.policy).length) delete projected.policy;
  }
  if (projected.repositories) projected.repositories = projected.repositories.map(repo => without(repo, ["branch"]));
  if (projected.units) projected.units = projected.units.map(unit => ({
    ...without(unit, ["priority", "checks"]),
    ...(unit.checks ? {checks:unit.checks.map(check => without(check, ["timeout_ms"]))} : {}),
  }));
  return {version:2, sha256:await planFingerprint(projected)};
}
const publicationIdentity = repo => repo.pr_identity ?? (repo.published ? {
  pr_url:repo.published.pr_url,
  repository_id:repo.publication?.payload.repository_id,
} : null);
function publicationGate(repo, head) {
  const staged = repo.publication;
  if (repo.published?.head === head) return "published";
  if (staged?.head === head && staged.approval?.hash === staged.hash) return "approved";
  if (staged?.head === head) return "staged";
  if (staged || repo.published) return "stale";
  return "open";
}
async function atomic(path, data) {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  await rename(temporary, path);
}
async function receipt(path) {
  text(path, "evidence file");
  const absolute = await realpath(path);
  const bytes = await readFile(absolute);
  assert(bytes.length > 0, "evidence file is empty");
  return { path: absolute, sha256: sha(bytes), bytes: bytes.length };
}
export { semanticWorkItem, designProjection, unitExecutionHash, without, planFingerprint, sha, canonical, assert, text, array, id, git, atLeast, unique, readJson, repositoryIdentity, businessFlows, unitSourceIds, unitInputHash, publicationIdentity, publicationGate, atomic, receipt };
