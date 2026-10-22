import test from "node:test";
import assert from "node:assert/strict";
import { validateApprovedAction, validateActionObservation, approvedActionDecision, validateActionReadback, PREFLIGHT_MAX_AGE_MS } from "../lib/approved-action.mjs";

const head = "a".repeat(40);
const request = () => ({
  operation: "approve-and-merge", repository_id: "repo-be", head,
  source_branch: "fix/100-bug", target_branch: "develop",
  pr_url: "https://example.invalid/pr/100",
});
const observation = (extra = {}) => ({
  ...request(), observed_at: new Date().toISOString(), status: "active",
  mergeable: true, checks: [], comments: [], blockers: [], ...extra,
});
const record = (extra = {}) => ({ request: request(), hash: "approved-hash", preflight: { observation: observation(extra) } });

test("empty CI results allow execution without claiming a CI pass", () => {
  const result = approvedActionDecision(record());
  assert.equal(result.phase, "ready");
  assert.equal(result.expected_head, head);
  assert.equal(result.request.operation, "approve-and-merge");
});

test("only unresolved blocking comments and required checks hold execution", () => {
  assert.equal(approvedActionDecision(record({
    comments: [{ id: "nit", blocking: false, resolved: false }],
    checks: [{ id: "optional", required: false, state: "failed" }],
  })).phase, "ready");
  for (const state of ["pending", "failed", "unknown"])
    assert.equal(approvedActionDecision(record({
      checks: [{ id: "required-ci", required: true, state }],
    })).phase, "blocked");
  assert.equal(approvedActionDecision(record({
    comments: [{ id: "bug", blocking: true, resolved: false }],
  })).phase, "blocked");
  assert.equal(approvedActionDecision(record({ mergeable: false })).phase, "blocked");
});

test("source, destination and PR identity drift never authorize a different merge", () => {
  for (const delta of [{ head: "b".repeat(40) }, { repository_id: "other" },
    { source_branch: "other" }, { target_branch: "main" }, { pr_url: "https://example.invalid/pr/999" }])
    assert.equal(approvedActionDecision(record(delta)).phase, "blocked");
});

test("a stale live observation requests another check, not another approval", () => {
  const value = record();
  assert.equal(approvedActionDecision(value, [], Date.now() + PREFLIGHT_MAX_AGE_MS + 10).phase, "preflight");
  assert.equal(approvedActionDecision({ ...value, preflight: null }).phase, "preflight");
});

test("already completed merges and existing create targets require read-back, not another write", () => {
  assert.equal(approvedActionDecision(record({ status: "completed" })).phase, "readback");
  assert.equal(approvedActionDecision(record({ status: "completed",
    checks: [{ id: "late-ci", required: true, state: "pending" }] })).phase, "readback");
  const value = record();
  value.request = { ...value.request, operation: "publish", action: "create" };
  assert.equal(approvedActionDecision(value).phase, "readback");
});

test("unknown or malformed live data cannot substitute for checking blockers", () => {
  for (const key of ["checks", "comments", "blockers", "observed_at", "status"])
    assert.throws(() => validateActionObservation(observation({ [key]: undefined })));
  assert.throws(() => validateActionObservation(observation({
    checks: [{ id: "ci", state: "passed" }],
  })), /required flag/);
  assert.throws(() => validateActionObservation(observation({ status: "unknown" })), /unknown PR state/);
  assert.throws(() => validateActionObservation(observation({ pr_url: undefined })), /observed PR URL/);
});

test("publication defaults to ready for review while an explicit Draft is preserved", () => {
  const publish = { ...request(), operation: "publish", action: "create",
    title: "Fix the ticket", description: "Exact reviewed copy", work_item_ids: ["100"] };
  assert.equal(validateApprovedAction(publish).is_draft, false);
  assert.equal(validateApprovedAction({ ...publish, is_draft: true }).is_draft, true);
});

test("completion requires actual approval, Completed state, the approved patch and a merge commit", () => {
  const actual = { ...request(), status: "completed", approved: true, merge_commit: "c".repeat(40) };
  validateActionReadback(request(), actual);
  for (const delta of [{ status: "active" }, { approved: false }, { merge_commit: undefined }, { head: "d".repeat(40) }])
    assert.throws(() => validateActionReadback(request(), { ...actual, ...delta }));
});
