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
