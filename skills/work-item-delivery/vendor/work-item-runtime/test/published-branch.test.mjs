import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, git, publicationFixture } from "./delivery-fixture.mjs";

test("a published repository branch cannot be renamed even with human evidence", async t => {
  const f = await fixture(t); await f.approve(); await f.implement("A"); await f.implement("B");
  await publicationFixture(f, "be");
  const repo = f.plan.repositories[0];
  git(repo.path, "branch", "-m", "fix/100-be");
  repo.branch = "fix/100-be"; f.plan.work_item.type = "Bug";
  await assert.rejects(f.call("replan", f.plan, f.approval), /published repository branch is immutable/);
});
