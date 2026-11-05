import test from "node:test";
import assert from "node:assert/strict";
import { readFile,writeFile,mkdir,unlink,stat,symlink,chmod } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { collectProof,writeProof } from "../scripts/proof-of-work.mjs";
import { proofFixture,digest,git } from "./proof-fixture.mjs";

const script=new URL("../scripts/proof-of-work.mjs",import.meta.url).pathname;
const readState=async f=>JSON.parse(await readFile(join(f.run,"delivery.json"),"utf8"));
const saveState=(f,state)=>writeFile(join(f.run,"delivery.json"),JSON.stringify(state));
const collect=f=>collectProof(f.run,"backend",f.scopeFile);
const cli=(f,out,...args)=>spawnSync(process.execPath,[script,"--run",f.run,"--repo","backend","--file",f.scopeFile,"--out",out,...args],{encoding:"utf8"});

test("generated proof leads with Work Item expectation and repeatable actions before supporting counts",async t=>{
  const f=await proofFixture(t,{configurePlan(plan){
    plan.cases.find(row=>row.id==="C2").expected="Inactive B must not reach the consumer; active A remains visible";
    plan.knowledge.business_flows=[{id:"selection",case_ids:["C1","C2"],actor:"API consumer",trigger:"requests the active selection",
      preconditions:["Fixture data contains active A and inactive B"],steps:[{action:"Run the approved regression with active A and inactive B",
        business_rule:"Return only active A",source_refs:plan.cases[0].source_refs}],outcome:"The consumer receives only A"}];
  }});
  const {index,outputs}=await collect(f),markdown=outputs["proof-of-works.md"].toString();
  assert.equal(index.status,"CHECKS_PASSED");
  assert.match(markdown,/Work Item expectation: Inactive B must not reach the consumer; active A remains visible/);
  assert.match(markdown,/Role and starting action \(planned\): API consumer; requests the active selection/);
  assert.match(markdown,/Preconditions \(planned\): Fixture data contains active A and inactive B/);
  assert.match(markdown,/Action: Run the approved regression with active A and inactive B\. Expected: Return only active A/);
  const caseProof=index.acceptance.cases.find(row=>row.id==="C2");
  assert.equal(caseProof.status,"INCOMPLETE");
  assert.deepEqual(caseProof.observations,[]);
  assert.equal(index.observations.length,2);
  assert.ok(markdown.includes(encodeURI(index.observations[0].artifact.path)));
  assert.ok(markdown.includes(encodeURI(index.observations[1].artifact.path)));
  assert.match(markdown,/\| Only A \| A,B \| \[artifact\]/);
  assert.match(markdown,/\| Only A \| Only A \| \[artifact\]/);
  assert.ok(markdown.indexOf("Work Item expectation:")<markdown.indexOf("Supporting automated checks"));
  assert.match(markdown,/does not establish human execution or acceptance/);
  assert.equal(index.acceptance.cases.find(row=>row.id==="C1").status,"INCOMPLETE");
});

test("passing check counts cannot fill missing per-case product-action observations or hide acceptance gaps",async t=>{
  const f=await proofFixture(t),out=join(f.root,"proof-without-observations");
  f.scope.observations=[];await f.saveScope();
  const run=cli(f,out);assert.equal(run.status,0,run.stderr);
  const result=JSON.parse(run.stdout);
  assert.equal(result.status,"CHECKS_PASSED");
  assert.equal(result.acceptance,"INCOMPLETE");
  assert.deepEqual(result.acceptance_gaps.map(row=>row.case_id),["C1","C2"]);
  const index=JSON.parse(await readFile(join(out,"evidence-index.json")));
  assert.ok(index.acceptance.cases.every(row=>row.gaps.some(gap=>gap.includes("before"))&&row.gaps.some(gap=>gap.includes("after"))));
  const markdown=await readFile(join(out,"proof-of-works.md"),"utf8");
  assert.match(markdown,/Product-action records: INCOMPLETE/);
  assert.match(markdown,/Not recorded for this case/);
  assert.match(markdown,/Acceptance evidence gaps:/);
  assert.match(markdown,/Test execution: CHECKS_PASSED/);
});

test("proof artifact and check links preserve literal local path characters",async t=>{
  const f=await proofFixture(t),state=await readState(f);
  const artifact=join(f.root,"before#case?proof(1)|.log"),log=join(f.root,"unit#case?proof(2)|.log");
  await writeFile(artifact,await readFile(f.scope.observations[0].artifact.path));
  f.scope.observations[0].artifact.path=artifact;await f.saveScope();
  const result=state.repos.backend.verification.results[0];
  await writeFile(log,await readFile(result.evidence.path));result.evidence.path=log;await saveState(f,state);
  const {outputs}=await collect(f);
  const paths=[...outputs["proof-of-works.md"].toString().matchAll(/\[(?:artifact|log)\]\(([^)]+)\)/g)].map(match=>{
    const url=new URL(match[1],"https://private.invalid");
    assert.equal(url.hash,"");assert.equal(url.search,"");
    return decodeURIComponent(url.pathname);
  });
  assert.ok(paths.includes(artifact));assert.ok(paths.includes(log));
});
