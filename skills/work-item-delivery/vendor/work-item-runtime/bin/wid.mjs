#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFile, mkdir, copyFile, writeFile } from "node:fs/promises";
import { resolve, join, basename } from "node:path";
import { Delivery, sha, validatePlan } from "../lib/delivery.mjs";
import { nextCursorAction } from "../lib/cursor-workflow.mjs";

const help = `work-item-delivery <command> --run <directory> [options]

intake                 Preserve an exact source snapshot: --file --url --revision
investigate            Begin/revise durable questions from --file; revisions require expected_revision
investigation-brief    Issue independent, challenge or arbitration inputs: --task
investigation-report   Import a report bound to the issued input digest: --task --file
arbitrate              Reconcile every claim, gap and challenge from --file
design-context         Print exact plan and projected design hashes: --file\ninit                   Admit v3 plan from --file <plan.json> with reconciled dossier and design
status / next          Show ready units, blockers, repo publication holds
cursor                 Print the next action; reuse approval and check only new blockers
plan                   Render the case/spec/task/dependency plan as Markdown
approve-plan           Record human approval: --hash --evidence
replan                 Replace scope/baseline from --file; branch rename also needs --evidence; invalidates approval
bind                   Bind an approved branch/worktree: --repo --path
start                  Claim the repo writer and emit a brief: --unit --owner
finish                 Record committed implementation: --unit --owner --evidence
block                  Park a clean unit: --unit --reason --owner --unblock --evidence
unblock                Resolve --blocker with --evidence
verify                 Run approved checks and retain logs: --repo
capture                Record actual Playwright artifacts/observations: --file
recover-verification   Recover a dead verifier: --repo --evidence
review                 Ingest standards/specification reports: --repo --file
stage-publication      Freeze exact PR payload and attachments: --repo --file
approve-publication    Record human approval: --repo --hash --evidence
published              Verify direct PR read-back: --repo --file
approve-action         Record approval already given for publish/approve-and-merge: --repo --file --evidence
check-action           Record one live check for new blockers: --repo --file
action-completed       Record the authorized action's direct read-back: --repo --file

Local runtime bookkeeping only, except verify runs the approved command argv.
Forge reads/writes and Git changes are performed by the agent through its tools.
The system does not merge PRs or deploy.
`;
const options = Object.fromEntries(
  [
    "run",
    "file",
    "url",
    "revision",
    "hash",
    "evidence",
    "repo",
    "path",
    "unit",
    "owner",
    "reason",
    "unblock",
    "blocker",
    "unblock-owner",
    "task",
  ].map((k) => [k, { type: "string" }]),
);
try {
  const { values, positionals } = parseArgs({
    options,
    allowPositionals: true,
  });
  const command = positionals[0];
  if (!command || command === "help") {
    console.log(help);
    process.exit(0);
  }
  if (!values.run) throw new Error("--run is required");
  const directory = resolve(values.run);
  const run = new Delivery(directory);
  const v = values;
  let result;
  switch (command) {
    case "intake": {
      if (!v.file || !v.url || !v.revision)
        throw new Error("intake needs --file, --url and --revision");
      const bytes = await readFile(v.file);
      const digest = sha(bytes);
      await mkdir(join(directory, "sources"), { recursive: true });
      const path = join(directory, "sources", `${digest}-${basename(v.file)}`);
      await copyFile(v.file, path);
      const metadata = {
        path,
        sha256: digest,
        url: v.url,
        revision: v.revision,
        captured_at: new Date().toISOString(),
      };
      await writeFile(
        path + ".meta.json",
        JSON.stringify(metadata, null, 2) + "\n",
        { flag: "wx", mode: 0o600 },
      ).catch((e) => {
        if (e.code !== "EEXIST") throw e;
      });
      result = metadata;
      break;
    }
    case "investigate":
      result = await run.investigate(JSON.parse(await readFile(v.file,"utf8")));
      break;
    case "investigation-brief":
      result = await run.investigationBrief(v.task);
      break;
    case "investigation-report":
      result = await run.investigationReport(v.task,v.file);
      break;
    case "arbitrate":
      result = await run.arbitrate(v.file);
      break;
    case "design-context":
      result = await run.designContext(JSON.parse(await readFile(v.file,"utf8")));
      break;
    case "init":
      result = await run.init(
        validatePlan(JSON.parse(await readFile(v.file, "utf8"))),
      );
      break;
    case "replan":
      result = await run.replan(JSON.parse(await readFile(v.file, "utf8")), v.evidence);
      break;
    case "status":
    case "next":
      result = await run.status();
      break;
    case "cursor":
      result = nextCursorAction(await run.status());
      break;
    case "plan": {
      const status = await run.status();
      const s = await run.load();
      const lines = [
        `# Work Item ${s.plan.work_item.id}: execution plan`,
        "",
        `Source: ${s.plan.work_item.url} (revision ${s.plan.work_item.revision})`,
        `Plan SHA-256: ${status.plan_hash}`,
        `Approved: ${status.approved}`,
        `Work Item type: ${s.plan.work_item.type ?? "MISSING: branch policy approval held"}; branches: ${s.plan.repositories.map(r=>r.branch).join(", ")}`,
        "",
        "## Cases and source traceability",
        "",
        "| Case | Related tasks | Expected behavior | Evidence/specification |",
        "|---|---|---|---|",
      ];
      const clean = (x) =>
        String(x).replaceAll("|", "\\|").replaceAll("\n", " ");
      for (const c of s.plan.cases)
        lines.push(
          `| ${clean(c.id + ": " + c.title)} | ${clean(c.task_ids.join(", "))} | ${clean(c.expected)} | ${c.source_refs
            .map((id) => {
              const source = s.plan.sources.find((s) => s.id === id);
              return `[${clean(source.id)}](${source.url}) § ${clean(source.section)} r${clean(source.revision)} (${source.status})`;
            })
            .join("; ")} |`,
        );
      if (s.plan.knowledge) {
        lines.push("", "## Business context and citations");
        for (const provider of ["second_brain", "confluence"]) {
          const research = s.plan.knowledge[provider];
          lines.push("", `- ${provider}: ${research.status}; ${research.summary}${research.gap ? "; gap: " + research.gap : ""}`);
        }
        for (const flow of s.plan.knowledge.business_flows) {
          lines.push("", `### ${flow.id}: ${flow.case_ids.join(", ")}`, "", `${flow.actor}: ${flow.trigger}. Preconditions: ${flow.preconditions.join("; ") || "none recorded"}.`);
          for (const step of flow.steps) lines.push(`- ${step.action} → ${step.business_rule}. ${step.source_refs.map(key => { const ref = s.plan.sources.find(s => s.id === key); return `[${ref.id}](${ref.url}) § ${ref.section} (${ref.revision})`; }).join("; ")}`);
          lines.push("", `Outcome: ${flow.outcome}`);
        }
        lines.push("", "## Browser evidence plan");
        for (const capture of s.plan.capture_plan) lines.push("", `- ${capture.id} (${capture.case_ids.join(", ")}, ${capture.repo}): ${capture.tool}; ${capture.reason ?? `${capture.environment} ${capture.url}; before/after; ${capture.assertions.join("; ")}`}`);
      }
      lines.push("", "## Unit tests and evidence completion gates");
      for (const unit of s.plan.units) {
        const tests = unit.unit_test_plan;
        lines.push("", `### ${unit.id}: ${unit.case_ids.join(", ")}`);
        lines.push(tests?.reason ? `Unit tests not applicable: ${tests.reason}` : tests ?
          `Unit-test assertions: ${tests.assertions.join("; ")}. Before: ${tests.before}. After: ${tests.after}.` :
          "MISSING unit-test plan: approval is held until assertions and before/after checks or a justified non-applicability reason are recorded.");
        for (const check of unit.checks) lines.push(`- Check ${check.id}: ${check.purpose}; argv: ${JSON.stringify(check.argv)}; timeout ${check.timeout_ms} ms.`);
      }
      lines.push("", "Retain actual failing-before/passing-after logs, exit codes, counts/skips and source identity. UI cases require the planned before/after artifacts; label fixtures and separate developer proof from QA-owned environment acceptance. Every case needs expected/actual results and evidence paths; a planned check is not a pass.");
      lines.push(
        "",
        "## Implementation order and repo ownership",
        "",
        "| Unit | Repo | Depends on | Current flow / finding / change | Acceptance and checks |",
        "|---|---|---|---|---|",
      );
      for (const u of s.plan.units)
        lines.push(
          `| ${u.id} (${u.case_ids.join(", ")}) | ${u.repo} | ${clean(u.depends_on.map((d) => d.unit + " @ " + d.stage + ": " + d.reason).join("; ") || "none")} | ${clean(u.current_flow + " / " + u.finding_status + ": " + u.finding + " / " + u.change)} | ${clean(u.acceptance.join("; ") + "; " + u.checks.map((c) => JSON.stringify(c.argv)).join("; "))} |`,
        );
      lines.push("", "## Baselines and grouped PRs");
      for (const r of s.plan.repositories)
        lines.push(
          "",
          `- ${r.id}: ${r.base_ref} @ ${r.base_sha}; branch ${r.branch}; one PR covering ${s.plan.units
            .filter((u) => u.repo === r.id)
            .flatMap((u) => u.case_ids)
            .join(", ")}.`,
        );
      lines.push(
        "",
        "## Dependency layers (repo writers remain serialized)",
        ...status.dependency_layers.map(
          (layer, index) => `- ${index + 1}: ${layer.join(", ")}`,
        ),
      );
      lines.push(
        "",
        "## Ready now",
        ...(status.ready_to_implement.length
          ? status.ready_to_implement
          : status.candidates_before_approval
        ).map(
          (u) =>
            `- ${u.id}: ${status.approved ? "execution ready" : "candidate; plan approval required"}`,
        ),
        "",
        "## Blockers and release holds",
      );
      for (const b of status.open_blockers)
        lines.push(
          `- ${b.id}: ${b.reason}. Units: ${b.units.join(", ")}. Owner: ${b.owner}. Unblock when: ${b.unblock_when}.`,
        );
      for (const p of status.publication)
        lines.push(
          `- ${p.repo}: publication ${p.ready ? "eligible for exact-content approval" : "held"}; unfinished cases: ${p.blocked_units.join(", ") || "none; inspect current-head checks/reviews"}.`,
        );
      lines.push(
        "",
        "Independent implementation does not authorize independent release under the one-PR-per-repo policy. Proposed exceptions require an explicit owner decision.",
      );
      console.log(lines.join("\n"));
      process.exit(0);
    }
    case "approve-plan":
      result = await run.approvePlan(v.hash, v.evidence);
      break;
    case "bind":
      result = await run.bind(v.repo, v.path);
      break;
    case "start":
      result = await run.start(v.unit, v.owner);
      break;
    case "finish":
      result = await run.finish(v.unit, v.owner, v.evidence);
      break;
    case "block":
      result = await run.block(
        v.unit,
        v.reason,
        v.owner,
        v.unblock,
        v.evidence,
        v["unblock-owner"],
      );
      break;
    case "unblock":
      result = await run.unblock(v.blocker, v.evidence);
      break;
    case "verify":
      result = await run.verify(v.repo);
      break;
    case "capture":
      result = await run.recordCapture(v.file);
      break;
    case "recover-verification":
      result = await run.recoverVerification(v.repo, v.evidence);
      break;
    case "review":
      result = await run.review(v.repo, v.file);
      break;
    case "stage-publication":
      result = await run.stagePublication(v.repo, v.file);
      break;
    case "approve-publication":
      result = await run.approvePublication(v.repo, v.hash, v.evidence);
      break;
    case "approve-action":
      result = await run.approveAction(v.repo, v.file, v.evidence);
      break;
    case "check-action":
      result = await run.checkAction(v.repo, v.file);
      break;
    case "action-completed":
      result = await run.completeAction(v.repo, v.file);
      break;
    case "published":
      result = await run.published(v.repo, v.file);
      break;
    default:
      throw new Error(`unknown command ${command}\n${help}`);
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ error: error.message }));
  process.exitCode = 1;
}
