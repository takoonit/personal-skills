import test from "node:test";
import assert from "node:assert/strict";
import { nextCursorAction } from "../lib/cursor-workflow.mjs";

const repo = (over = {}) => ({
  repo: "be",
  published: "not-published",
  verification: "not-run",
  review: "not-run",
  gate: "open",
  ready: false,
  blocked_units: [],
  baseline_current: true,
  ...over,
});

test("a missing plan stays in intake", () => {
  assert.equal(nextCursorAction({}).action, "intake");
});

test("only pending assessment or corrupt corrections preempt preplan investigation phases", () => {
  for (const [phase, action] of Object.entries({investigating:"investigate",challenging:"challenge",arbitrating:"arbitrate","plan-ready":"author-plan"})) {
    const status={investigation:{phase},corrections:{records:[{state:"open",cases:[{case_id:"A",state:"open"}]}]}};
    assert.equal(nextCursorAction(status).action,action);
    assert.equal(nextCursorAction({...status,corrections:{records:[{state:"pending-assessment"}]}}).action,"reconcile-correction");
    assert.equal(nextCursorAction({...status,corrections:{integrity_hold:"damaged registry",records:[]}}).action,"reconcile-correction");
  }
});

test("an explicitly approved action checks only new blockers before execution", () => {
  const status = {
    plan_hash: "abc",
    approved: true,
    units: [{ id: "A", repo: "be", state: "blocked" }],
    publication: [repo({ verification: "failed", review: "not-run" })],
    approved_actions: [{ repo: "be", operation: "approve-and-merge", phase: "preflight" }],
  };
  assert.equal(nextCursorAction(status).action, "check-new-blockers");
  status.approved_actions[0].phase = "ready";
  assert.equal(nextCursorAction(status).action, "execute-approved-action");
  status.approved_actions[0].phase = "blocked";
  status.approved_actions[0].blockers = [{ reason: "New required CI failure" }];
  const blocked = nextCursorAction(status);
  assert.equal(blocked.action, "blocked");
  assert.deepEqual(blocked.blockers, status.approved_actions[0].blockers);
});

test("recorded action approval is not replaced by a stale plan approval prompt", () => {
  const action = nextCursorAction({
    plan_hash: "abc",
    approved: false,
    approved_actions: [{ repo: "be", operation: "publish", phase: "ready" }],
  });
  assert.equal(action.action, "execute-approved-action");
});

test("completed authorized work reports instead of restarting old gates", () => {
  const action = nextCursorAction({
    plan_hash: "abc",
    approved: false,
    units: [{ id: "A", repo: "be", state: "blocked" }],
    publication: [repo({ verification: "failed", review: "not-run" })],
    approved_actions: [{ repo: "be", operation: "approve-and-merge", phase: "completed" }],
  });
  assert.equal(action.action, "report");
});

test("plan approval is a human stop", () => {
  const action = nextCursorAction({ plan_hash: "abc", approved: false, ready_to_implement: [{ id: "A", repo: "be" }] });
  assert.deepEqual(
    { action: action.action, hook: action.hook, actor: action.actor },
    { action: "await-human", hook: "plan-approval", actor: "human" },
  );
});

test("an active writer is finished before another unit starts", () => {
  const action = nextCursorAction({
    plan_hash: "abc",
    approved: true,
    units: [{ id: "A", repo: "be", state: "active", owner: "coordinator" }],
    ready_to_implement: [{ id: "B", repo: "fe" }],
    publication: [],
  });
  assert.equal(action.action, "continue-writer");
  assert.deepEqual(action.units, [{ id: "A", repo: "be", owner: "coordinator" }]);
});

test("the first ready unit is the next implementation", () => {
  const action = nextCursorAction({
    plan_hash: "abc",
    approved: true,
    units: [],
    ready_to_implement: [{ id: "B", repo: "fe" }, { id: "A", repo: "be" }],
    publication: [],
  });
  assert.deepEqual({ action: action.action, unit: action.unit, repo: action.repo }, { action: "start-unit", unit: "B", repo: "fe" });
  assert.match(action.detail, /primary checkout/);
  assert.match(action.detail, /linked worktree only when/);
});

test("another repo is verified before a failed check is revisited", () => {
  const action = nextCursorAction({
    plan_hash: "abc",
    approved: true,
    units: [
      { id: "A", repo: "be", state: "implemented" },
      { id: "C", repo: "fe", state: "implemented" },
    ],
    ready_to_implement: [],
    publication: [repo({ verification: "failed" }), repo({ repo: "fe" })],
  });
  assert.deepEqual({ action: action.action, repo: action.repo }, { action: "verify", repo: "fe" });
});

test("a passed check moves to review, then the publication stops", () => {
  const base = {
    plan_hash: "abc",
    approved: true,
    units: [{ id: "A", repo: "be", state: "implemented" }],
    ready_to_implement: [],
  };
  assert.equal(nextCursorAction({ ...base, publication: [repo({ verification: "passed" })] }).action, "review");
  assert.equal(
    nextCursorAction({ ...base, publication: [repo({ verification: "passed", review: "passed", ready: true })] }).action,
    "stage-publication",
  );
  const staged = nextCursorAction({
    ...base,
    publication: [repo({ verification: "passed", review: "passed", ready: true, gate: "staged" })],
  });
  assert.equal(staged.hook, "publication-approval");
  assert.equal(
    nextCursorAction({
      ...base,
      publication: [repo({ verification: "passed", review: "passed", ready: true, gate: "approved" })],
    }).action,
    "publish-readback",
  );
});

test("verified read-back ends in a report, and a held repo stays blocked", () => {
  assert.equal(
    nextCursorAction({
      plan_hash: "abc",
      approved: true,
      units: [],
      ready_to_implement: [],
      publication: [repo({ published: "read-back-verified", gate: "published", ready: true })],
    }).action,
    "report",
  );
  const held = nextCursorAction({
    plan_hash: "abc",
    approved: true,
    units: [{ id: "A", repo: "be", state: "blocked" }],
    ready_to_implement: [],
    open_blockers: [{ id: "block-1", owner: "qa" }],
    publication: [repo({ blocked_units: ["A"] })],
  });
  assert.equal(held.action, "blocked");
  assert.equal(held.blockers[0].owner, "qa");
});
