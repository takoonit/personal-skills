import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Delivery, validatePlan } from "../lib/delivery.mjs";
import { git, fixture, uiFixture } from "./delivery-fixture.mjs";

test("v2 requires both research providers, cited case flows and evidence dispositions", async t => {
  const f = await fixture(t);
  const missing = structuredClone(f.plan); delete missing.knowledge.second_brain;
  assert.throws(() => validatePlan(missing), /second_brain/);
  const uncited = structuredClone(f.plan); uncited.knowledge.business_flows[0].steps[0].source_refs = ["unknown"];
  assert.throws(() => validatePlan(uncited), /cite existing/);
  const uncovered = structuredClone(f.plan); uncovered.capture_plan = [];
  assert.throws(() => validatePlan(uncovered), /missing evidence disposition/);
});

test("missing before capture holds only affected UI work; real artifact receipt unlocks it", async t => {
  const f = await uiFixture(t);
  let state = await f.call("status");
  assert.equal(state.units.find(u => u.id === "A").reason, "before-evidence-required");
  assert.equal(state.units.find(u => u.id === "B").ready, true);
  await assert.rejects(f.call("start", "A", "worker"), /before-evidence-required/);
  await f.capture("before");
  state = await f.call("status");
  assert.equal(state.units.find(u => u.id === "A").ready, true);
  await f.implement("A");
});

test("passing after evidence requires the current head and every planned observation", async t => {
  const f = await uiFixture(t); await f.capture("before"); await f.implement("A");
  await assert.rejects(f.capture("after", "passed", {assertions:[]}), /every planned assertion/);
  await f.capture("after");
  assert.equal((await f.call("status")).publication[0].capture_evidence.ready, true);
  await f.implement("B");
  assert.deepEqual((await f.call("status")).publication[0].capture_evidence.missing, ["screen-A:after"]);
});

test("changed screenshot bytes invalidate their recorded capture", async t => {
  const f = await uiFixture(t); await f.capture("before");
  await writeFile(f.image, "tampered artifact");
  assert.equal((await f.call("status")).units.find(u => u.id === "A").ready, false);
});

test("a failed or blocked capture cannot reuse an older passing result", async t => {
  const f = await uiFixture(t); await f.capture("before"); await f.implement("A"); await f.capture("after");
  await f.capture("after", "failed", {reason:"Fixture regression observed",assertions:[{expected:"Case A behavior is visible",actual:"Different fixture result",passed:false}]});
  assert.equal((await f.call("status")).publication[0].capture_evidence.ready, false);
  await f.capture("after"); await f.capture("blocker", "blocked", {reason:"Fixture environment unavailable"});
  assert.equal((await f.call("status")).publication[0].capture_evidence.ready, false);
});

test("business flow changes invalidate implementation assumptions", async t => {
  const f = await fixture(t); await f.approve(); await f.implement("A");
  f.plan.knowledge.business_flows[0].steps[0].business_rule = "Changed acceptance context";
  await f.call("replan", f.plan);
  assert.equal((await f.call("status")).units.find(u => u.id === "A").state, "pending");
});

test("legacy v1 remains readable but cannot bypass the new execution evidence contract", async t => {
  const f = await fixture(t,{legacy:true});
  const file=join(f.run,"delivery.json"), persisted=JSON.parse(await readFile(file,"utf8"));
  persisted.plan.schema="work-item-delivery.plan.v1";delete persisted.plan.knowledge;delete persisted.plan.capture_plan;
  persisted.plan_hash=await new Delivery(f.run).fingerprint(persisted.plan);
  await writeFile(file,JSON.stringify(persisted));
  const state = await f.call("status"); await f.call("approvePlan", state.plan_hash, f.approval);
  assert.equal((await f.call("status")).approved, false);
  await assert.rejects(f.call("start", "A", "worker"), /upgrade the legacy plan/);
});

test("unavailable business-flow-only citations require blockers for affected units", async t => {
  const f=await fixture(t);
  f.plan.sources.find(s=>s.id==='business').status='unavailable';
  f.plan.knowledge.second_brain.status='gap';f.plan.knowledge.second_brain.gap='Fixture source inaccessible';
  assert.throws(()=>validatePlan(f.plan),/unavailable\/conflicted source/);
  f.plan.blockers=[{id:'business-gap',units:['A','B'],reason:'Fixture business rule missing',owner:'Fixture owner',unblock_when:'Source available',source_refs:['business']}];
  assert.doesNotThrow(()=>validatePlan(f.plan));
});

test("local UI proof is ready without SIT receipts; remote capture targets stay invalid", async t => {
  const f=await uiFixture(t);
  for (const environment of ['local', 'local-fixture', 'local-real-data']) {
    const local=structuredClone(f.plan);
    local.capture_plan[0].environment=environment;
    assert.doesNotThrow(()=>validatePlan(local));
  }
  await f.capture('before');
  assert.equal((await f.call('status')).units.find(unit=>unit.id==='A').ready,true);
  await f.implement('A');
  await f.capture('after');
  assert.equal((await f.call('status')).publication[0].capture_evidence.ready,true);
  const remote=structuredClone(f.plan);
  remote.capture_plan[0].url='https://example.invalid/remote-app';
  assert.throws(()=>validatePlan(remote),/local loopback/);
  remote.capture_plan[0].url='http://127.0.0.1/fixture';remote.capture_plan[0].environment='SIT';
  assert.throws(()=>validatePlan(remote),/local loopback/);
});

test("approved before and after local builds can use different ports", async t => {
  const f=await uiFixture(t);f.plan.capture_plan[0].before_url='http://127.0.0.1:39999/baseline';
  await f.call('replan',f.plan);const s=await f.call('status');await f.call('approvePlan',s.plan_hash,f.approval);
  await f.capture('before','observed',{url:'http://127.0.0.1:39999/baseline'});
  assert.equal((await f.call('status')).units.find(u=>u.id==='A').ready,true);
  await assert.rejects(f.capture('after','passed',{url:'http://127.0.0.1:39999/baseline'}),/differs from approved/);
  f.plan.capture_plan[0].before_url='https://example.invalid/baseline';
  assert.throws(()=>validatePlan(f.plan),/local loopback/);
});

test("unrelated replanning retains intact before evidence but renews after certification", async t => {
  const f=await uiFixture(t);await f.capture('before');await f.implement('A');await f.capture('after');
  f.plan.units.find(u=>u.id==='B').priority=0;
  await f.call('replan',f.plan);
  const s=await f.call('status');
  assert.deepEqual(s.publication[0].capture_evidence.missing,['screen-A:after']);
});

test("delayed older success cannot override a newer observed failure", async t => {
  const f=await uiFixture(t);await f.capture('before');await f.implement('A');
  await f.capture('after','passed',{captured_at:'2026-10-20T00:00:00Z'});
  await f.capture('after','failed',{captured_at:'2026-10-20T01:00:00Z',reason:'Newer observed failure'});
  await f.capture('after','passed',{captured_at:'2026-10-20T00:00:00Z'});
  assert.equal((await f.call('status')).publication[0].capture_evidence.ready,false);
});

test("legacy active writer can finish authorized work before migrating the remaining run", async t => {
  const f=await fixture(t,{legacy:true});await f.approve();await f.call('start','A','worker');
  const file=join(f.run,'delivery.json');const legacy=JSON.parse(await readFile(file,'utf8'));
  legacy.plan.schema='work-item-delivery.plan.v1';delete legacy.plan.knowledge;delete legacy.plan.capture_plan;
  const run=new Delivery(f.run);legacy.plan_hash=await run.fingerprint(legacy.plan);legacy.approval.hash=legacy.plan_hash;
  await writeFile(file,JSON.stringify(legacy));
  await writeFile(join(f.repos[0].path,'app.txt'),'authorized legacy implementation');git(f.repos[0].path,'add','.');git(f.repos[0].path,'commit','-m','complete authorized legacy fixture');
  await f.call('finish','A','worker',f.source);
  const {admitFixture}=await import('./investigation-fixture.mjs');
  await admitFixture(new Delivery(f.run),f.plan,f.root);
  await f.call('replan',f.plan);
  assert.equal((await f.call('status')).approved,false);
});
