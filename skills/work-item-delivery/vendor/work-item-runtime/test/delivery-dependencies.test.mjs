import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { validatePlan } from "../lib/delivery.mjs";
import { nextCursorAction } from "../lib/cursor-workflow.mjs";
import { git, fixture, approveCurrent, reviewedFixture, publicationFixture } from "./delivery-fixture.mjs";

test("case-only specification revisions and byte changes reset consumers, preserving independent work", async t => {
  const f=await fixture(t,{twoRepos:true});
  f.plan.cases.forEach(c=>c.source_refs=c.id==='A'?["ticket","spec"]:["ticket"]);
  f.plan.units.forEach(u=>u.source_refs=["ticket"]);
  f.plan.knowledge.business_flows[0].steps[0].source_refs=["ticket","business"];
  f.plan.units[1].depends_on=[{unit:"A",stage:"implemented",reason:"Consumes A",source_refs:["ticket"]}];
  await f.call("replan",f.plan);await approveCurrent(f);
  await f.implement("A");await f.implement("B");await f.implement("C");
  const next=join(f.root,"spec-v2.txt");await writeFile(next,"Changed case-A-only specification\n");
  Object.assign(f.plan.sources.find(s=>s.id==='spec'),{revision:"4",snapshot:next});
  await f.call("replan",f.plan);
  let s=await f.call("status");
  assert.deepEqual(s.units.map(u=>[u.id,u.state]),[["A","pending"],["B","pending"],["C","implemented"]]);
  await approveCurrent(f);await f.implement("A");await f.implement("B");
  await writeFile(next,"Changed bytes at the same case-A-only locator\n");
  await f.call("replan",f.plan);s=await f.call("status");
  assert.deepEqual(s.units.map(u=>[u.id,u.state]),[["A","pending"],["B","pending"],["C","implemented"]]);
});

test("symlinks and linked worktrees cannot create a second repository writer identity", async t => {
  const f=await fixture(t);const {symlink}=await import("node:fs/promises");
  const alias=join(f.root,"alias");await symlink(f.repos[0].path,alias);
  const p=structuredClone(f.plan);p.repositories.push({...p.repositories[0],id:"alias",path:alias});p.units[1].repo="alias";
  assert.throws(()=>validatePlan(p),/duplicate Git repository identities/);
  const linked=join(f.root,"linked");git(f.repos[0].path,"worktree","add","-b","codex/linked",linked,"develop");
  Object.assign(p.repositories[1],{path:linked,branch:"codex/linked"});
  assert.throws(()=>validatePlan(p),/duplicate Git repository identities/);
});

test("grouped publication cycles are rejected even when unit dependencies are acyclic", async t => {
  const f=await fixture(t,{twoRepos:true});
  const dep=(unit,stage)=>({unit,stage,reason:"Fixture prerequisite",source_refs:["spec"]});
  f.plan.units[1].depends_on=[dep("C","published")];f.plan.units[2].depends_on=[dep("A","published")];
  assert.throws(()=>validatePlan(f.plan),/grouped publication dependency deadlock/);
  f.plan.units[2].depends_on=[dep("A","verified")];
  assert.doesNotThrow(()=>validatePlan(f.plan),"incremental verified prerequisite permits a valid publication order");
});

test("stale upstream targets withdraw consumer certification and publication readiness", async t => {
  const f=await fixture(t,{twoRepos:true});
  f.plan.units[2].depends_on=[{unit:"A",stage:"verified",reason:"Backend contract",source_refs:["spec"]}];
  await f.call("replan",f.plan);await approveCurrent(f);await f.implement("A");await f.call("verify","be");
  await f.implement("C");await reviewedFixture(f,"fe");
  assert.equal((await f.call("status")).publication.find(r=>r.repo==='fe').ready,true);
  const r=f.repos[0];git(r.path,"checkout","develop");await writeFile(join(r.path,"app.txt"),"upstream develop changed");git(r.path,"add",".");git(r.path,"commit","-m","upstream target moved");git(r.path,"checkout",r.branch);
  const s=await f.call("status");assert.equal(s.units.find(u=>u.id==='C').reason,"dependency");
  assert.equal(s.publication.find(r=>r.repo==='fe').ready,false);
  await assert.rejects(f.call("verify","fe"),/dependency evidence is stale/);
  await assert.rejects(f.call("stagePublication","fe",join(f.root,"unused.json")),/all grouped cases/);
});

test("same-repo verified prerequisites still allow final combined checks and review", async t => {
  const f=await fixture(t);f.plan.units[1].depends_on=[{unit:"A",stage:"verified",reason:"Verified shared contract",source_refs:["spec"]}];
  await f.call("replan",f.plan);await approveCurrent(f);await f.implement("A");await f.call("verify","be");
  await f.implement("B");await reviewedFixture(f,"be");
  assert.equal((await f.call("status")).publication[0].ready,true);
});

test("re-verification retains PR identity and rejects duplicate create or mismatched update read-back", async t => {
  const f=await fixture(t);await f.approve();await f.implement("A");await f.implement("B");
  const p=await publicationFixture(f,"be");
  // Exercise migration from a run that has a published receipt but no separate identity.
  const stateFile=join(f.run,"delivery.json");const raw=JSON.parse(await readFile(stateFile,"utf8"));delete raw.repos.be.pr_identity;await writeFile(stateFile,JSON.stringify(raw));
  await reviewedFixture(f,"be");
  assert.equal((await f.call("status")).publication[0].pr_identity.pr_url,p.actual.pr_url);
  await assert.rejects(f.call("stagePublication","be",p.file),/already has its grouped PR/);
  p.payload.action="update";p.payload.url=p.actual.pr_url;await writeFile(p.file,JSON.stringify(p.payload));
  const staged=await f.call("stagePublication","be",p.file);await f.call("approvePublication","be",staged.approval_required,f.approval);
  await writeFile(p.readback,JSON.stringify({...p.actual,pr_url:"https://example.invalid/prs/different"}));
  await assert.rejects(f.call("published","be",p.readback),/PR identity/);
  await writeFile(p.readback,JSON.stringify(p.actual));await f.call("published","be",p.readback);
});

test("published repository records survive replanning and completing another repository", async t => {
  const f=await fixture(t,{twoRepos:true});await f.approve();await f.implement("A");await f.implement("B");
  await publicationFixture(f,"be");
  const before=JSON.parse(await readFile(join(f.run,"delivery.json"),"utf8"));
  const r=f.repos.find(r=>r.id==='fe');git(r.path,"checkout","develop");await writeFile(join(r.path,"app.txt"),"new frontend target");git(r.path,"add",".");git(r.path,"commit","-m","frontend target moved");git(r.path,"checkout",r.branch);
  r.base_sha=git(r.path,"rev-parse","develop");f.plan.cases.find(c=>c.id==='C').expected="Updated frontend-only acceptance";
  await f.call("replan",f.plan);
  const after=JSON.parse(await readFile(join(f.run,"delivery.json"),"utf8"));
  assert.deepEqual(after.repos.be,before.repos.be);assert.equal(after.units.A.state,"published");assert.equal(after.approval,null);
  git(r.path,"merge","--ff-only","develop");await approveCurrent(f);await f.implement("C");await reviewedFixture(f,"fe");
  assert.equal((await f.call("status")).publication.find(r=>r.repo==='fe').ready,true);
  const changed=structuredClone(f.plan);changed.cases[0].expected="Change already published acceptance";
  await assert.rejects(f.call("replan",changed),/published case\/source scope is immutable/);
});

test("transient store contention waits for ownership; permanent contention times out without stealing", async t => {
  const f=await fixture(t);const {openStore}=await import("../vendor/pstack/store.mjs");
  const store=openStore(f.run);await store.init();
  const pending=f.call("status");await new Promise(r=>setTimeout(r,150));await store.close();
  assert.equal((await pending).work_item.id,"100");
  const held=openStore(f.run);await held.init();
  try {await assert.rejects(f.call("status"),/contention timed out/);assert.equal((await readFile(join(f.run,".orch.lock"),"utf8")).trim(),String(process.pid));}
  finally {await held.close();}
  assert.equal((await f.call("status")).work_item.id,"100");
});

test("dirty, switched or blocked prerequisites hold an implemented consumer through publication", async t => {
  const f = await fixture(t, {twoRepos:true});
  f.plan.units.find(u => u.id === "C").depends_on = [{unit:"A",stage:"verified",reason:"Fixture contract",source_refs:["ticket"]}];
  await f.call("replan", f.plan); await approveCurrent(f);
  await f.implement("A"); await f.call("verify", "be");
  await f.implement("C"); await reviewedFixture(f, "fe");
  const be = f.repos[0];
  const ready = async () => (await f.call("status")).publication.find(r => r.repo === "fe").ready;
  assert.equal(await ready(), true);
  await writeFile(join(be.path, "app.txt"), "uncommitted provider change\n");
  assert.equal(await ready(), false);
  await assert.rejects(f.call("verify", "fe"), /dependency evidence/);
  git(be.path, "restore", "app.txt");
  git(be.path, "checkout", "develop");
  assert.equal(await ready(), false);
  git(be.path, "checkout", be.branch);
  assert.equal(await ready(), true);
  await f.call("block", "A", "Provider assumption now unresolved", "fixture owner", "Contract confirmed", f.source);
  assert.equal(await ready(), false);
  await assert.rejects(f.call("review", "fe", join(f.root, "review-fe.json")), /dependency evidence/);
  await assert.rejects(f.call("stagePublication", "fe", join(f.root, "unused.json")), /all grouped cases/);
});

test("prerequisite drift during executed checks cannot certify a consumer", async t => {
  const f = await fixture(t, {twoRepos:true});
  const c = f.plan.units.find(u => u.id === "C");
  c.depends_on = [{unit:"A",stage:"verified",reason:"Fixture contract",source_refs:["ticket"]}];
  c.checks[0].argv = [process.execPath,"-e",`require('node:fs').writeFileSync(${JSON.stringify(join(f.repos[0].path,"app.txt"))}, 'provider drift during check')`];
  await f.call("replan", f.plan); await approveCurrent(f);
  await f.implement("A"); await f.call("verify", "be"); await f.implement("C");
  const v = await f.call("verify", "fe");
  assert.equal(v.results[0].exit_code, 0);
  assert.equal(v.passed, false);
  assert.equal(v.source_unchanged, false);
  assert.equal((await f.call("status")).publication.find(r => r.repo === "fe").ready, false);
});

test("incremental review can unlock another repository before a pending sibling is implemented", async t => {
  const f = await fixture(t, {twoRepos:true});
  f.plan.units.find(u => u.id === "B").depends_on = [{unit:"C",stage:"verified",reason:"Verified consumer contract",source_refs:["ticket"]}];
  f.plan.units.find(u => u.id === "C").depends_on = [{unit:"A",stage:"reviewed",reason:"Review shared prerequisite",source_refs:["ticket"]}];
  assert.doesNotThrow(() => validatePlan(f.plan));
  await f.call("replan", f.plan); await approveCurrent(f);
  await f.implement("A"); await reviewedFixture(f, "be");
  assert.equal((await f.call("status")).units.find(u => u.id === "C").ready, true);
  assert.equal((await f.call("status")).publication.find(r => r.repo === "be").ready, false);
  await f.implement("C"); await f.call("verify", "fe");
  await f.implement("B"); await reviewedFixture(f, "be"); await reviewedFixture(f, "fe");
  assert.ok((await f.call("status")).publication.every(r => r.ready));
});

test("cursor follows the ledger from approval through a staged publication", async t => {
  const f = await fixture(t);
  assert.equal(nextCursorAction(await f.call("status")).hook, "plan-approval");
  await f.approve();
  assert.equal(nextCursorAction(await f.call("status")).action, "start-unit");
  await f.call("start", "A", "coordinator");
  assert.equal(nextCursorAction(await f.call("status")).units[0].owner, "coordinator");
  await f.call("finish", "A", "coordinator", f.source);
  await f.implement("B");
  assert.equal(nextCursorAction(await f.call("status")).action, "verify");
  await reviewedFixture(f, "be");
  const ready = await f.call("status");
  assert.equal(ready.publication[0].gate, "open");
  assert.equal(nextCursorAction(ready).action, "stage-publication");
  const payload = {repository_id:"fixture-be",action:"create",url:"https://example.invalid/prs",title:"Synthetic grouped PR",description:"Synthetic read-back only; no forge request.",head:ready.publication[0].head,source_branch:f.repos[0].branch,target_branch:"develop",is_draft:true,work_item_ids:["100"],attachments:[]};
  const file = join(f.root, "cursor-publication.json");
  await writeFile(file, JSON.stringify(payload));
  await f.call("stagePublication", "be", file);
  const staged = await f.call("status");
  assert.equal(staged.publication[0].gate, "staged");
  assert.equal(nextCursorAction(staged).hook, "publication-approval");
});
