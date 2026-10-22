const assert = (condition, message) => { if (!condition) throw new Error(message); };
const text = (value, label) => assert(typeof value === "string" && value.trim(), label + " is required");
export const PREFLIGHT_MAX_AGE_MS = 5 * 60 * 1000;

export function validateApprovedAction(input) {
  const request = structuredClone(input);
  assert(["publish", "approve-and-merge"].includes(request.operation), "unsupported approved operation");
  for (const key of ["repository_id", "source_branch", "target_branch"]) text(request[key], key);
  assert(/^[a-f0-9]{40,64}$/.test(request.head), "approved source head is required");
  assert(request.source_branch !== request.target_branch, "source and target must differ");
  if (request.operation === "publish") {
    assert(["create", "update"].includes(request.action), "publication action must be create or update");
    text(request.title, "PR title");
    text(request.description, "PR description");
    assert(request.description.length <= 4000 && [...request.description].length <= 4000, "PR description exceeds 4000 characters");
    request.is_draft ??= false;
    assert(typeof request.is_draft === "boolean", "explicit boolean draft state required");
    assert(Array.isArray(request.work_item_ids), "work_item_ids must be an array");
    request.attachments ??= [];
    assert(Array.isArray(request.attachments), "attachments must be an array");
  }
  if (request.operation === "approve-and-merge" || request.action === "update")
    assert(typeof request.pr_url === "string" && /^https:\/\//.test(request.pr_url), "approved PR URL is required");
  return request;
}

export function validateActionObservation(observation, now = Date.now()) {
  const at = Date.parse(observation.observed_at);
  assert(Number.isFinite(at) && at <= now + 60_000 && now - at <= PREFLIGHT_MAX_AGE_MS, "live preflight observation required");
  for (const key of ["repository_id", "source_branch", "target_branch", "head", "status"]) text(observation[key], key);
  assert(["absent", "active", "completed", "abandoned"].includes(observation.status), "unknown PR state");
  if (observation.status !== "absent")
    assert(typeof observation.pr_url === "string" && /^https:\/\//.test(observation.pr_url), "observed PR URL required");
  for (const key of ["checks", "comments", "blockers"]) assert(Array.isArray(observation[key]), key + " must be an array");
  for (const check of observation.checks) {
    text(check.id, "check id");
    assert(typeof check.required === "boolean", "check required flag must be explicit");
    assert(["passed", "failed", "pending", "not-applicable", "unknown"].includes(check.state), "invalid check state");
  }
  for (const comment of observation.comments)
    assert(typeof comment.blocking === "boolean" && typeof comment.resolved === "boolean", "comment blocking/resolved flags must be explicit");
  for (const blocker of observation.blockers) text(blocker.reason, "blocker reason");
  return observation;
}

export function approvedActionDecision(record, localBlockers = [], now = Date.now()) {
  const base = { operation: record.request.operation, request: record.request, hash: record.hash };
  if (record.completed) return { ...base, phase: "completed", result: record.completed.result };
  const blockers = [...localBlockers];
  const observed = record.preflight?.observation;
  if (record.preflight?.error) blockers.push({ reason: record.preflight.error });
  if (observed) {
    for (const key of ["repository_id", "source_branch", "target_branch", "head"])
      if (observed[key] !== record.request[key]) blockers.push({ reason: "approved action identity changed: " + key });
    if (record.request.pr_url && observed.pr_url !== record.request.pr_url)
      blockers.push({ reason: "approved PR identity changed" });
  }
  if (blockers.length) return { ...base, phase: "blocked", blockers };
  if (!observed || now - Date.parse(observed.observed_at) > PREFLIGHT_MAX_AGE_MS)
    return { ...base, phase: "preflight" };
  if (record.request.operation === "approve-and-merge" && observed.status === "completed")
    return { ...base, phase: "readback" };
  blockers.push(...observed.blockers);
  for (const check of observed.checks)
    if (check.required && !["passed", "not-applicable"].includes(check.state))
      blockers.push({ reason: "required check " + check.id + " is " + check.state });
  for (const comment of observed.comments)
    if (comment.blocking && !comment.resolved)
      blockers.push({ reason: "unresolved blocking review comment", id: comment.id });
  if (observed.status === "abandoned") blockers.push({ reason: "PR was abandoned" });
  if (blockers.length) return { ...base, phase: "blocked", blockers };
  if (record.request.operation === "approve-and-merge") {
    if (observed.status !== "active" || observed.mergeable !== true)
      return { ...base, phase: "blocked", blockers: [{ reason: "PR is not active and mergeable" }] };
  } else if (record.request.action === "create" && observed.pr_url) {
    return { ...base, phase: "readback" };
  } else if (record.request.action === "update" && observed.status !== "active") {
    return { ...base, phase: "blocked", blockers: [{ reason: "publication update requires the existing active PR" }] };
  }
  return { ...base, phase: "ready", expected_head: record.request.head };
}

export function validateActionReadback(request, actual) {
  for (const key of ["repository_id", "source_branch", "target_branch", "head"])
    assert(actual[key] === request[key], "action read-back differs: " + key);
  assert(typeof actual.pr_url === "string" && /^https:\/\//.test(actual.pr_url), "direct PR URL required");
  if (request.pr_url) assert(actual.pr_url === request.pr_url, "action read-back differs: PR URL");
  if (request.operation === "approve-and-merge") {
    assert(actual.status === "completed" && actual.approved === true, "approval and completed merge must be observed");
    assert(/^[a-f0-9]{40,64}$/.test(actual.merge_commit), "merge commit required");
  } else {
    assert(actual.status === "active", "published PR must be active");
    for (const key of ["title", "description", "is_draft"])
      assert(actual[key] === request[key], "publication read-back differs: " + key);
    assert(JSON.stringify([...(actual.work_item_ids ?? [])].map(String).sort()) ===
      JSON.stringify([...request.work_item_ids].map(String).sort()), "work item associations differ");
  }
}
