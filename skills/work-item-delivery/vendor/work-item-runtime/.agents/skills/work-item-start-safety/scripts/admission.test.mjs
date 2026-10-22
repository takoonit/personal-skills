import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Delivery } from "../../../../lib/delivery.mjs";
import { nextCursorAction } from "../../../../lib/cursor-workflow.mjs";

test("start safety adviser covers all 16 admission combinations", () => {
  let checked = 0;
  for (const initialized of [false, true]) {
    for (const approved of [false, true]) {
      for (const active of [false, true]) {
        for (const ready of [false, true]) {
          const action = nextCursorAction({
            ...(initialized ? { plan_hash: "offline-plan" } : {}),
            approved,
            units: active ? [{ id: "A", repo: "offline", state: "active", owner: "fixture" }] : [],
            ready_to_implement: ready ? [{ id: "B", repo: "offline" }] : [],
            publication: [],
          });
          const expected = !initialized ? "intake" : !approved ? "await-human" :
            active ? "continue-writer" : ready ? "start-unit" : "blocked";
          assert.equal(action.action, expected, JSON.stringify({ initialized, approved, active, ready }));
          checked += 1;
        }
      }
    }
  }
  assert.equal(checked, 16);
});

test("start safety approval guard rejects missing mismatched and stale fingerprints", async t => {
  const root = await mkdtemp(join(tmpdir(), "wid-start-approval-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, "offline-source.txt");
  await writeFile(source, "Offline fixture requirement revision 1");
  const delivery = new Delivery(join(root, "unused-offline-run"));
  const plan = {
    schema: "work-item-delivery.plan.v2",
    work_item: { id: "100", type: "Bug", revision: "1" },
    policy: { pr_grouping: "one-per-repo" },
    repositories: [{ branch: "fix/100-offline" }],
    sources: [{ id: "offline", status: "read", snapshot: source }],
  };
  const hash = await delivery.fingerprint(plan);
  const state = { plan, plan_hash: hash, approval: null };
  await assert.rejects(delivery.requireApproval(state), /review and approve this exact plan first/);
  state.approval = { hash: "different-offline-plan" };
  await assert.rejects(delivery.requireApproval(state), /review and approve this exact plan first/);
  state.approval = { hash };
  await delivery.requireApproval(state);
  await writeFile(source, "Offline fixture requirement revision 2");
  await assert.rejects(delivery.requireApproval(state), /review and approve this exact plan first/);
});
