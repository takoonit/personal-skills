import { randomUUID } from "node:crypto";
import { captureReceipt, captureBinding } from "./evidence.mjs";
import { assert, text, id, git, readJson, receipt } from "./delivery-common.mjs";

export const deliveryExecution = {
  async recordCapture(file) {
    return this.locked(async () => {
      const s = await this.load();
      assert(s.plan.schema === "work-item-delivery.plan.v2", "capture requires a v2 evidence plan");
      const input = await readJson(file);
      const record = await captureReceipt(s.plan, input);
      record.evidence = await receipt(file);
      record.plan_hash = s.plan_hash;
      s.captures ??= [];
      s.captures.push(record);
      const definition = s.plan.capture_plan.find(c => c.id === record.capture_id);
      record.context_hash = await captureBinding(s.plan, definition);
      s.repos[definition.repo].publication = null;
      await this.save(s, {type:"browser-evidence-recorded",capture:record.capture_id,phase:record.phase,outcome:record.outcome});
      return {capture:record.capture_id,phase:record.phase,outcome:record.outcome,evidence:record.evidence};
    });
  },
  async start(unit, owner) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      const u = this.unit(s, unit);
      text(owner, "writer owner");
      assert(s.units[unit].state === "pending", "unit is not pending");
      const ready = await this.readiness(s, u);
      assert(ready.ready, JSON.stringify(ready));
      const w = this.workspace(s, u.repo, { clean: true });
      s.units[unit] = { state: "active", owner, start_head: w.head };
      s.repos[u.repo].verification = null;
      s.repos[u.repo].review = null;
      s.repos[u.repo].publication = null;
      await this.save(s, { type: "unit-started", unit, owner, head: w.head });
      return this.brief(s, u, owner);
    });
  },
  brief(s, u, owner) {
    const business = (s.plan.knowledge?.business_flows ?? []).filter(flow => flow.case_ids.some(id => u.case_ids.includes(id)));
    const contextIds = new Set([...u.source_refs, ...business.flatMap(flow => flow.steps.flatMap(step => step.source_refs))]);
    return {
      goal: u.change,
      scope: {
        repo: u.repo,
        path: s.repos[u.repo].path,
        branch: this.repo(s, u.repo).branch,
        allowed_paths: u.allowed_paths,
        owner,
      },
      cases: s.plan.cases.filter((c) => u.case_ids.includes(c.id)),
      context: s.plan.sources.filter((ref) => contextIds.has(ref.id)),
      business_flows: business,
      capture_plan: (s.plan.capture_plan ?? []).filter(capture => capture.repo === u.repo && capture.case_ids.some(id => u.case_ids.includes(id))),
      flow: u.current_flow,
      finding: { status: u.finding_status, text: u.finding },
      acceptance: u.acceptance,
      verify: u.checks,
      upstream: u.depends_on.map((d) => ({
        dependency: d,
        result: s.units[d.unit],
      })),
      standing_orders: [
        "Use the approved shared branch; one writer per repository.",
        "Stay inside owned paths and scoped cases.",
        "No PR creation, ticket mutation, merge, deployment or branch topology change without the applicable approval.",
        "Report actual tests and blockers; do not infer verification from implementation.",
      ],
    };
  },
  async finish(unit, owner, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s, {legacyCompletion:true});
      const u = this.unit(s, unit),
        row = s.units[unit];
      assert(
        row.state === "active" && row.owner === owner,
        "unit is not owned by this writer",
      );
      const w = this.workspace(s, u.repo, { clean: true });
      const changed = git(w.path, "diff", "--name-only", row.start_head, w.head)
        .split("\n")
        .filter(Boolean);
      assert(
        changed.every((p) =>
          u.allowed_paths.some(
            (a) => p === a || p.startsWith(a.replace(/\/$/, "") + "/"),
          ),
        ),
        "changes extend beyond owned paths",
      );
      row.state = "implemented";
      row.head = w.head;
      row.report = await receipt(evidence);
      delete row.owner;
      await this.store.inbox.push({
        agent: owner,
        unit,
        status: "implemented",
        report: row.report.path,
      });
      await this.save(s, {
        type: "unit-implemented",
        unit,
        head: w.head,
        evidence: row.report,
      });
      return { unit, state: row.state, head: w.head };
    });
  },
  async block(unit, reason, owner, unblock, evidence, unblockOwner = owner) {
    return this.locked(async () => {
      const s = await this.load();
      const u = this.unit(s, unit);
      text(reason, "blocker reason");
      text(owner, "unblock owner");
      text(unblock, "unblock condition");
      const proof = await receipt(evidence);
      if (s.units[unit].state === "active")
        assert(
          s.units[unit].owner === owner,
          "only the active writer can park its work",
        );
      assert(
        s.units[unit].state !== "published",
        "published units require an explicit follow-up plan",
      );
      const partial = git(s.repos[u.repo].path, "status", "--porcelain");
      const committedPartial =
        s.units[unit].state === "active" &&
        git(s.repos[u.repo].path, "rev-parse", "HEAD") !==
          s.units[unit].start_head;
      s.blockers.push({
        id: `block-${randomUUID()}`,
        units: [unit],
        reason,
        owner: unblockOwner,
        unblock_when: unblock,
        evidence: proof,
        resolved: false,
      });
      s.repos[u.repo].publication = null;
      if (partial || committedPartial) {
        assert(
          s.units[unit].state === "active",
          "a dirty repository needs its active owner to record a recovery plan",
        );
        await this.save(s, {
          type: "unit-blocked-writer-retained",
          unit,
          evidence: proof,
        });
        return {
          unit,
          state: "active",
          writer_retained: true,
          reason: partial
            ? "uncommitted partial changes"
            : "committed partial changes",
          warning:
            "Blocker recorded; retain this repo writer until an explicit safe recovery/isolation plan resolves partial work. Other repositories may continue.",
        };
      }
      s.units[unit].previous_state = s.units[unit].state;
      s.units[unit].state = "blocked";
      delete s.units[unit].owner;
      await this.save(s, { type: "unit-blocked", unit, evidence: proof });
      return {
        unit,
        state: "blocked",
        warning:
          "Independent units may continue; this repository PR remains held while the case is blocked.",
      };
    });
  },
  async unblock(blocker, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      const b = s.blockers.find((b) => b.id === blocker);
      assert(b && !b.resolved, "open blocker not found");
      b.resolution = await receipt(evidence);
      b.resolved = true;
      for (const key of b.units)
        if (
          !s.blockers.some((x) => !x.resolved && x.units.includes(key)) &&
          s.units[key].state === "blocked"
        )
          s.units[key].state = "pending";
      await this.save(s, {
        type: "blocker-resolved",
        blocker,
        evidence: b.resolution,
      });
      return { blocker, resolved: true };
    });
  }
};
