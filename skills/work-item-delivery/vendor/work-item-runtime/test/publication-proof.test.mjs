import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { uiFixture, git, reviewedFixture } from "./delivery-fixture.mjs";

async function proofFixture(t) {
  const f = await uiFixture(t);
  f.plan.cases[0].expected = "แสดงเฉพาะแผนสิทธิประโยชน์ที่พนักงานเลือกได้";
  await f.call("replan",f.plan);
  await f.call("approvePlan",(await f.call("status")).plan_hash,f.approval);
  const capture = f.capture;
  f.capture = (phase,outcome,overrides = {}) => capture(phase,outcome,{viewport:{width:1,height:1},...overrides});
  await f.capture("before", "observed", { artifacts: [{ kind: "screenshot", path: f.image, framing: "viewport" }] });
  await f.implement("A"); await f.implement("B");
  await f.capture("after", "passed", { artifacts: [{ kind: "screenshot", path: f.image, framing: "full-page" }] });
  const state = await f.call("load"), head = git(f.repos[0].path, "rev-parse", "HEAD");
  const phase = (name) => {
    const capture = state.captures.find(c => c.phase === name);
    return { capture_id: capture.capture_id, evidence_sha256: capture.evidence.sha256,
      environment: capture.environment, head: capture.git_head, executor: "agent fixture; authored synthetic observation",
      image: { path: f.image, sha256: capture.artifacts[0].sha256, href: `attachment:${name}.png` } };
  };
  const publication_proof = { schema: "work-item-delivery.publication-proof.v1", cases: [{
    case_id: "A", flow_id: "fixture-flow", title: "Case A", role: "Fixture user", setup: "Local fixture record",
    actions: ["Open choices", "Select plan and search"], expected: "Only eligible choices appear",
    before: { ...phase("before"), observed: "Unrelated choices appeared" },
    after: { ...phase("after"), observed: "Only eligible choices appear" },
  }], supporting: ["Native Vitest: 2 passed; synthetic local fixture", {text:"Vitest log",href:"https://example.invalid/log?run=(1)"}] };
  const request = { operation: "publish", action: "create", url: "https://example.invalid/prs", repository_id: "fixture-be",
    title: "Fix choices", head, source_branch: f.repos[0].branch, target_branch: "develop", is_draft: true,
    work_item_ids: ["100"], publication_proof,
    attachments: ["before", "after"].map(name => ({ name: `${name}.png`, path: f.image })) };
  const file = join(f.root, "proof-publication.json");
  const save = async () => writeFile(file, JSON.stringify(request));
  return { ...f, state, request, file, save };
}

test("UI admissions reject counts-only and missing images", async t => {
  const f = await proofFixture(t);
  await reviewedFixture(f, "be");
  f.request.description = "## Proof of Works\n2 tests passed; evidence.zip";
  delete f.request.publication_proof;
  await f.save();
  await assert.rejects(f.call("approveAction", "be", f.file, f.approval), /publication proof/i);
  await assert.rejects(f.call("stagePublication", "be", f.file), /publication proof/i);
});

test("UI admissions reject hidden proof", async t => {
  const f = await proofFixture(t);
  const { renderPublicationProof } = await import("../lib/publication-proof.mjs");
  await reviewedFixture(f, "be");
  const prefixes = {
    "backtick fence": "```markdown\n",
    "bare CR backtick fence": "```\rtext\n",
    "bare CR tilde fence": "~~~\rtext\n",
    "Unicode fence info": "```\u2028text\n",
    "Unicode tilde info": "~~~\u2029text\n",
    "Unicode fence closer": "```\ntext\n```\u2028\n",
    "tilde fence": "~~~~markdown\n~~~\n",
    "HTML comment": "<!--\n",
    "inline HTML comment": "Insight <!-- unfinished\n",
    "pre block": "<pre>\n",
    "script block": "<SCRIPT type=\"text/plain\">\n",
    "style block": "<style>\n",
    "textarea block": "<textarea>\n",
    "HTML block tag": "<div>\n",
    "standalone HTML tag": "<custom-tag>\n",
    "quoted HTML attribute": "<custom-tag title=\">\">\n",
    "processing instruction": "<?example\n",
    "declaration": "<!DOCTYPE\n",
    "CDATA": "<![CDATA[\n",
    "paragraph prefix": "Insight ",
    "indented code prefix": "    ",
    "blockquote prefix": "> ",
    "list prefix": "- ",
    "ordered list prefix": "1. ",
  };
  for (const [label, prefix] of Object.entries(prefixes)) {
    f.request.description = prefix + renderPublicationProof(f.request.publication_proof);
    await f.save();
    for (const admission of ["stagePublication", "approveAction"]) await t.test(`${label}: ${admission}`, async () => {
      await assert.rejects(f.call(admission, "be", f.file, f.approval), /Proof of Works.*visible.*top-level/i);
    });
  }
});

test("Closed Markdown keeps proof visible", async t => {
  const f = await proofFixture(t);
  const { renderPublicationProof, validatePublicationProof } = await import("../lib/publication-proof.mjs");
  const prefixes = [
    "```markdown\nExample\n```\n\n~~~text\nExample\n~~~\n\n",
    "```\rExample\r```\r\r",
    "~~~\r\nExample\r\n~~~\r\n\r\n",
    "```text\u2028example\nExample\n```\n\n",
    "<!-- closed -->\n\n<pre>Example</pre>\n\n<script>example</script>\n\n<style>example</style>\n\n<textarea>example</textarea>\n\n",
    "<div>\nExample\n</div>\n\n<custom-tag>\n\n<?example?>\n\n<!DOCTYPE html>\n\n<![CDATA[example]]>\n\n",
    "## Insight\nUse `<!--` and `<pre>` as examples, or escaped \\<!-- and \\<pre>.\n\n> Quoted example\n\n- A list item\n\n    Indented example\n\n",
  ];
  for (const prefix of prefixes) {
    f.request.description = prefix + renderPublicationProof(f.request.publication_proof);
    assert.ok(await validatePublicationProof(f.state, "be", f.request));
  }
  f.request.description = prefixes.join("") + renderPublicationProof(f.request.publication_proof);
  await f.save();
  await reviewedFixture(f, "be");
  assert.ok((await f.call("stagePublication", "be", f.file)).approval_required);
  assert.equal((await f.call("approveAction", "be", f.file, f.approval)).phase, "preflight");
});

test("Full originals support paraphrases and symbolic URLs", async t => {
  const f = await proofFixture(t);
  const { renderPublicationProof, validatePublicationProof, materializePublicationDescription } = await import("../lib/publication-proof.mjs");
  f.request.description = "## What Happened\nFix choices.\n\n## Insight\nFilter scope.\n\n" + renderPublicationProof(f.request.publication_proof);
  const proof = await validatePublicationProof(f.state, "be", f.request);
  assert.ok(proof.dependencies.length >= 3);
  assert.match(f.request.description, /!\[Before/);
  assert.match(f.request.description, /!\[After/);
  assert.ok(f.request.description.indexOf("![After") < f.request.description.indexOf("Supporting"));
  assert.match(f.request.description,/\[Vitest log\]\(<https:\/\/example.invalid\/log\?run=\(1\)>\)/);
  await f.save();
  await reviewedFixture(f, "be");
  assert.ok((await f.call("stagePublication", "be", f.file)).approval_required);
  const approved = await f.call("approveAction", "be", f.file, f.approval);
  assert.equal(approved.phase, "preflight");
  const stored = (await f.call("load")).repos.be.approved_action;
  const uploads = stored.attachments.map(a => ({ name: a.name, bytes: a.bytes, sha256: a.sha256, url: `https://example.invalid/${a.name}` }));
  const description = materializePublicationDescription(f.request, stored.attachments, uploads);
  assert.ok(!description.includes("attachment:"));
  const result = join(f.root, "derived-readback.json");
  const actual = { ...f.request, description, status: "active", pr_url: "https://example.invalid/pr/1", attachments: uploads };
  await writeFile(result, JSON.stringify({ ...actual, description: description + "edited" }));
  await assert.rejects(f.call("completeAction", "be", result), /description/);
  await writeFile(result, JSON.stringify(actual));
  assert.equal((await f.call("completeAction", "be", result)).phase, "completed");
  assert.equal((await f.call("load")).repos.be.approved_action.hash, approved.hash);
});

test("Legacy framing remains readable; new framing is retained", async t => {
  const f = await proofFixture(t);
  assert.equal(f.state.captures[0].artifacts[0].framing, "viewport");
  await f.capture("before");
  assert.equal((await f.call("load")).captures.at(-1).artifacts[0].framing, undefined);
  const { validatePublicationProof, renderPublicationProof } = await import("../lib/publication-proof.mjs");
  f.request.description = renderPublicationProof(f.request.publication_proof);
  await assert.rejects(validatePublicationProof(await f.call("load"), "be", f.request), /latest|full|framing/i);
});

test("Proof drift blocks pending actions", async t => {
  const f = await proofFixture(t);
  const { renderPublicationProof } = await import("../lib/publication-proof.mjs");
  f.request.description = renderPublicationProof(f.request.publication_proof); await f.save();
  await f.call("approveAction", "be", f.file, f.approval);
  const before = await f.call("load");
  const evidence = before.captures[0].evidence.path;
  await writeFile(evidence, (await readFile(evidence, "utf8")) + " ");
  const status = (await f.call("status")).approved_actions[0];
  assert.equal(status.phase, "blocked");
  assert.match(status.blockers[0].reason, /proof dependency changed/);
  const after = await f.call("load");
  assert.deepEqual(after.repos.be.review, before.repos.be.review);
  assert.deepEqual(after.repos.be.verification, before.repos.be.verification);
  assert.equal(after.events.filter(e => e.type === "action-approved").length, 1);
});

test("Journeys require fields, bindings and inline originals", async t => {
  const f = await proofFixture(t);
  const { renderPublicationProof, validatePublicationProof } = await import("../lib/publication-proof.mjs");
  const canonical = value => { value.description = renderPublicationProof(value.publication_proof); return value; };
  const good = canonical(structuredClone(f.request));
  for (const field of ["title", "role", "setup", "expected", "actions"]) {
    const bad = structuredClone(good); delete bad.publication_proof.cases[0][field];
    await assert.rejects(validatePublicationProof(f.state, "be", bad), /required/);
  }
  for (const phase of ["before", "after"]) {
    const bad = structuredClone(good); delete bad.publication_proof.cases[0][phase];
    await assert.rejects(validatePublicationProof(f.state, "be", bad), /observation/);
    const absent = structuredClone(good); absent.publication_proof.cases[0][phase].observed = "";
    await assert.rejects(validatePublicationProof(f.state, "be", absent), /observation/);
    const removed = structuredClone(good); removed.description = removed.description.replace(new RegExp(`!\\[${phase === "before" ? "Before" : "After"}[^\\n]+\\n`), "");
    await reviewedFixture(f, "be");
    Object.assign(f.request, removed); await f.save();
    await assert.rejects(f.call("approveAction", "be", f.file, f.approval), /inline full images/);
    await assert.rejects(f.call("stagePublication", "be", f.file), /inline full images/);
  }
  for (const mutate of [
    p => { p.cases = []; }, p => { p.cases.push(p.cases[0]); }, p => { p.cases[0].case_id = "foreign"; },
    p => { p.cases[0].flow_id = "foreign"; }, p => { p.cases[0].after.capture_id = "foreign"; },
    p => { p.cases[0].after.evidence_sha256 = "0".repeat(64); }, p => { p.cases[0].after.head = "0".repeat(40); },
    p => { p.cases[0].after.image.sha256 = "0".repeat(64); }, p => { p.cases[0].after.environment = "SIT"; },
    p => { p.cases[0].after.image.href = "https://user:secret@example.invalid/image.png"; },
  ]) {
    const bad = structuredClone(good); mutate(bad.publication_proof);
    await assert.rejects(validatePublicationProof(f.state, "be", bad));
  }
  const long = structuredClone(good); long.description = "x".repeat(4001) + good.description;
  await assert.rejects(validatePublicationProof(f.state, "be", long), /4000.*UTF-16/);
  const backend = structuredClone(f.state); backend.plan.capture_plan = [];
  assert.equal(await validatePublicationProof(backend, "be", {description:"Existing API/CLI evidence"}), null);
});

test("Crops, DOM, stale or changed bytes cannot supply proof", async t => {
  const f = await proofFixture(t);
  const { renderPublicationProof, validatePublicationProof } = await import("../lib/publication-proof.mjs");
  const head = git(f.repos[0].path, "rev-parse", "HEAD");
  f.request.description = renderPublicationProof(f.request.publication_proof);
  for (const framing of ["crop", undefined]) {
    await f.capture("after", "passed", {artifacts:[{kind:"screenshot",path:f.image,...(framing ? {framing} : {})}]});
    const state = await f.call("load"), latest = state.captures.at(-1);
    f.request.publication_proof.cases[0].after.evidence_sha256 = latest.evidence.sha256;
    await assert.rejects(validatePublicationProof(state,"be",f.request), /framing/);
  }
  await f.capture("after", "passed", {artifacts:[{kind:"screenshot",path:f.image,framing:"full-page"},{kind:"screenshot",path:f.image,framing:"crop"}]});
  let state = await f.call("load");
  f.request.publication_proof.cases[0].after.evidence_sha256 = state.captures.at(-1).evidence.sha256;
  f.request.description = renderPublicationProof(f.request.publication_proof);
  assert.ok(await validatePublicationProof(state,"be",f.request));
  const stale = structuredClone(f.request); stale.head = "a".repeat(40);
  if (stale.head !== head) await assert.rejects(validatePublicationProof(state,"be",stale), /stale/);
  await assert.rejects(f.capture("after", "passed", {artifacts:[{kind:"dom",path:f.source}]}), /screenshot is required/);
  await f.capture("after", "failed", {reason:"Newer fixture failure",captured_at:new Date(Date.now()+1000).toISOString()});
  await assert.rejects(validatePublicationProof(await f.call("load"),"be",f.request), /latest/);
  await writeFile(f.image,"different original bytes");
  await assert.rejects(validatePublicationProof(state,"be",f.request), /latest/);
});

test("Uploads reject missing, changed or over-budget mappings", async t => {
  const f = await proofFixture(t);
  const { renderPublicationProof, materializePublicationDescription } = await import("../lib/publication-proof.mjs");
  f.request.description = renderPublicationProof(f.request.publication_proof);
  const { fileReceipt } = await import("../lib/evidence.mjs");
  const receipt = await fileReceipt(f.image);
  const attachments = ["before.png","after.png"].map(name => ({name,...receipt}));
  const uploads = attachments.map(a => ({...a,url:`https://example.invalid/${a.name}?query=(sensitive)`}));
  const unchanged = JSON.stringify(f.request);
  const derived = materializePublicationDescription(f.request,attachments,uploads);
  assert.equal(JSON.stringify(f.request),unchanged);
  assert.match(derived,/\(<https:\/\/example.invalid\/before.png\?query=\(sensitive\)>\)/);
  for (const bad of [uploads.slice(0,1),[...uploads,uploads[0]],[...uploads,{...uploads[0],name:"foreign.png"}],
    uploads.map((a,i) => i ? a : {...a,sha256:"0".repeat(64)}),
    uploads.map((a,i) => i ? a : {...a,bytes:a.bytes+1}),
    uploads.map((a,i) => i ? a : {...a,url:"attachment:unresolved.png"}),
    uploads.map((a,i) => i ? a : {...a,url:"https://example.invalid/"+"x".repeat(4000)}),
  ]) assert.throws(() => materializePublicationDescription(f.request,attachments,bad));
});

test("Hosted originals require named bytes and matching destinations", async t => {
  const f = await proofFixture(t);
  const { renderPublicationProof, validatePublicationProof, materializePublicationDescription } = await import("../lib/publication-proof.mjs");
  for (const phase of ["before", "after"]) {
    const image = f.request.publication_proof.cases[0][phase].image;
    image.href = `https://example.invalid/${phase}.png`;
  }
  f.request.description = renderPublicationProof(f.request.publication_proof);
  await assert.rejects(validatePublicationProof(f.state,"be",f.request), /named|attachment/);
  for (const phase of ["before", "after"]) {
    const image = f.request.publication_proof.cases[0][phase].image;
    image.name = `${phase}.png`;
    f.request.attachments.find(a => a.name === image.name).url = image.href;
  }
  assert.ok(await validatePublicationProof(f.state,"be",f.request));
  const {fileReceipt} = await import("../lib/evidence.mjs");
  const approved = await Promise.all(f.request.attachments.map(async a => ({name:a.name,...await fileReceipt(a.path)})));
  const uploads = approved.map(a => ({...a,url:`https://example.invalid/${a.name}`}));
  assert.equal(materializePublicationDescription(f.request,approved,uploads),f.request.description);
  assert.throws(() => materializePublicationDescription(f.request,approved,uploads.map((a,i) => i ? a : {...a,url:"https://example.invalid/crop.png"})), /destination/);
});

test("Symbolic uploads resume with exact read-back", async t => {
  const f = await proofFixture(t);
  const {renderPublicationProof,materializePublicationDescription} = await import("../lib/publication-proof.mjs");
  f.request.description = renderPublicationProof(f.request.publication_proof); await f.save();
  await reviewedFixture(f,"be");
  const staged = await f.call("stagePublication","be",f.file);
  await f.call("approvePublication","be",staged.approval_required,f.approval);
  const before = await f.call("load"), pub = before.repos.be.publication;
  const actual = {...f.request,pr_url:"https://example.invalid/pr/2",status:"active",
    attachments:pub.attachments.map(a => ({name:a.name,sha256:a.sha256,bytes:a.bytes,url:`https://example.invalid/${a.name}`}))};
  const file = join(f.root,"staged-result.json");
  await writeFile(file,JSON.stringify({...actual,attachments:actual.attachments.slice(0,1)}));
  await assert.rejects(f.call("published","be",file), /mapping missing/);
  assert.equal((await f.call("status")).approved_actions[0].phase,"preflight");
  actual.description = materializePublicationDescription(f.request,pub.attachments,actual.attachments);
  await writeFile(file,JSON.stringify({...actual,title:"Unapproved title"}));
  await assert.rejects(f.call("published","be",file), /title/);
  await writeFile(file,JSON.stringify(actual));
  await f.call("published","be",file);
  const after = await f.call("load");
  assert.deepEqual(after.repos.be.publication.approval,pub.approval);
  assert.equal(after.repos.be.publication.hash,pub.hash);
  assert.deepEqual(after.repos.be.review,before.repos.be.review);
  assert.deepEqual(after.repos.be.verification,before.repos.be.verification);
});

test("Full captures need viewport dimensions", async t => {
  const f = await proofFixture(t);
  for (const framing of ["viewport","full-page"]) {
    await assert.rejects(f.capture("before","observed",{viewport:{width:100,height:100},artifacts:[{kind:"screenshot",path:f.image,framing}]}), /smaller than.*viewport/);
  }
  assert.equal(f.state.captures[0].artifacts[0].width,1);
  assert.equal(f.state.captures[0].artifacts[0].height,1);
  await writeFile(f.image,Buffer.from([137,80,78,71,13,10,26,10,0]));
  await assert.rejects(f.capture("before","observed",{artifacts:[{kind:"screenshot",path:f.image,framing:"viewport"}]}), /dimensions|header/);
  await f.capture("before");
  assert.equal((await f.call("load")).captures.at(-1).artifacts[0].framing,undefined);
  const jpeg = Buffer.from([255,216,255,224,0,4,0,0,255,192,0,11,8,0,1,0,1,1,1,17,0,255,217]);
  await writeFile(f.image,jpeg);
  await f.capture("before","observed",{artifacts:[{kind:"screenshot",path:f.image,framing:"viewport"}]});
  assert.equal((await f.call("load")).captures.at(-1).artifacts[0].width,1);
  for (const bytes of [jpeg.subarray(0,13),Buffer.from([255,216,255,192,0,0]),Buffer.from([255,216,255,217])]) {
    await writeFile(f.image,bytes);
    await assert.rejects(f.capture("before","observed",{artifacts:[{kind:"screenshot",path:f.image,framing:"full-page"}]}), /dimensions|header/);
  }
});
