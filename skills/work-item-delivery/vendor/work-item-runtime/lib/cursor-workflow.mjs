// Advises the Cursor session. The CLI ledger remains the authority; this does not approve, edit, or publish.
const IMPLEMENTED = new Set(["implemented", "verified", "reviewed", "published"]);

function repos(status) {
  return status.publication ?? [];
}

function units(status, repo) {
  return (status.units ?? []).filter((unit) => unit.repo === repo);
}

function correctionAction(status) {
  return {action:"reconcile-correction",actor:"cursor",corrections:status.corrections,
    detail:"Coordinator assesses pending scope and reconciles open correction cases against the persisted plan. This grants no approval."};
}
function hasCorrections(status) {
  return status.corrections?.integrity_hold || status.corrections?.records?.some(row=>["pending-assessment","open"].includes(row.state));
}
export function legalCursorCandidates(status) {
  if(!status.approved||status.integrity_hold)return [];
  const completing=new Set((status.approved_actions??[]).map(row=>row.repo));
  return (status.ready_to_implement??[]).filter(row=>!completing.has(row.repo))
    .map(row=>({action:"start-unit",actor:"cursor",unit:row.id,repo:row.repo}));
}
export function nextCursorAction(status) {
  if (!status?.plan_hash && (status?.corrections?.integrity_hold || status?.corrections?.records?.some(row=>row.state==="pending-assessment"))) return correctionAction(status);
  if (!status?.plan_hash && status?.investigation) {
    const view=status.investigation;
    return {action: {investigating:"investigate",challenging:"challenge",arbitrating:"arbitrate","plan-ready":"author-plan","integrity-hold":"blocked"}[view.phase],actor:"cursor",investigation:view,
      detail:"Resume the recorded investigation. Dispatch native tasks with their exact briefs; a reconciled dossier still needs a v3 plan and human approval."};
  }
  if (!status?.plan_hash)
    return {
      action: "intake",
      actor: "cursor",
      detail: "No initialized plan. Read the Work Item and sources, then begin a durable investigation with investigate.",
    };
  const approvedActions = status.approved_actions ?? [];
  const execution = approvedActions.find((row) => row.phase !== "completed");
  if (execution) {
    const actions = {
      preflight: "check-new-blockers",
      ready: "execute-approved-action",
      readback: "read-back-approved-action",
      blocked: "blocked",
    };
    return {
      ...execution,
      action: actions[execution.phase],
      actor: "cursor",
      detail: execution.phase === "ready"
        ? "Execute the authorized action now, guarded by expected_head and repository policies, then record its direct read-back. Do not repeat reviews or request approval again."
        : execution.phase === "preflight"
          ? "Refresh live PR identity, blocking comments, required checks/policies and mergeability once. Record check-action; reuse completed reviews."
          : execution.phase === "readback"
            ? "The requested state may already exist. Read it back and record action-completed; do not repeat the external write."
            : "Resolve only these new blockers. Keep the existing approval; do not restart review or add gates.",
    };
  }
  const completed = new Set(approvedActions.map((row) => row.repo));
  if (completed.size) {
    status = {
      ...status,
      units: (status.units ?? []).filter((row) => !completed.has(row.repo)),
      ready_to_implement: (status.ready_to_implement ?? []).filter((row) => !completed.has(row.repo)),
      publication: repos(status).filter((row) => !completed.has(row.repo)),
    };
    if (!repos(status).length)
      return { action: "report", actor: "cursor", detail: "Authorized actions have verified read-backs. Report the outcome; do not reopen completed gates." };
  }
  if (status.continuing_writer || status.continuing_legacy_writer) return {action:"continue-writer",actor:"cursor",
    units:status.units.filter(unit=>unit.state==="active").map(unit=>({id:unit.id,repo:unit.repo,owner:unit.owner})),
    detail:"Finish or safely park the already admitted owner before reconciling remaining scope."};
  if (status.corrections?.integrity_hold) return correctionAction(status);
  if (status.integrity_hold) return {action:"blocked",actor:"cursor",detail:status.integrity_hold};
  if (!status.approved && hasCorrections(status)) return correctionAction(status);
  if (!status.approved)
    return {
      action: "await-human",
      hook: "plan-approval",
      actor: "human",
      plan_hash: status.plan_hash,
      detail: "Render plan and stop. approve-plan records only the user's decision.",
    };

  const active = (status.units ?? []).filter((unit) => unit.state === "active");
  if (active.length)
    return {
      action: "continue-writer",
      actor: "cursor",
      units: active.map((unit) => ({ id: unit.id, repo: unit.repo, owner: unit.owner })),
      detail: "Finish or block the owned unit. Keep a dirty repo with its writer.",
    };

  const ready = status.ready_to_implement ?? [];
  if (ready.length)
    return {
      action: "start-unit",
      actor: "cursor",
      unit: ready[0].id,
      repo: ready[0].repo,
      detail: "Bind the primary checkout, start this unit, and implement only its brief. Add a linked worktree only when that checkout is dirty, on another branch, or already has this branch checked out.",
    };

  const verify = repos(status).find(
    (row) =>
      !row.correction_holds?.length &&
      row.published !== "read-back-verified" &&
      row.verification !== "passed" &&
      row.verification !== "failed" &&
      units(status, row.repo).some((unit) => IMPLEMENTED.has(unit.state)),
  );
  if (verify)
    return {
      action: "verify",
      actor: "cli",
      repo: verify.repo,
      detail: "Run verify. It executes the approved command and keeps the log.",
    };

  const review = repos(status).find(
    (row) =>
      !row.correction_holds?.length &&
      row.published !== "read-back-verified" &&
      row.verification === "passed" &&
      row.review !== "passed",
  );
  if (review)
    return {
      action: "review",
      actor: "cursor",
      repo: review.repo,
      detail: "Review this head for standards and specification, then record review.",
    };

  for (const row of repos(status)) {
    if (row.published === "read-back-verified" || !row.ready || row.correction_holds?.length) continue;
    if (row.gate === "staged")
      return {
        action: "await-human",
        hook: "publication-approval",
        actor: "human",
        repo: row.repo,
        detail: "Show the staged publication hash and stop. Do not approve it yourself.",
      };
    if (row.gate === "approved")
      return {
        action: "publish-readback",
        actor: "cursor",
        repo: row.repo,
        detail: "Execute that approved payload, then published with a direct read-back.",
      };
    if (row.gate === "open" || row.gate === "stale")
      return {
        action: "stage-publication",
        actor: "cursor",
        repo: row.repo,
        detail: "Stage the exact PR payload. Do not create or update the PR yet.",
      };
  }

  if (hasCorrections(status)) return correctionAction(status);

  const failed = repos(status).find(
    (row) => row.published !== "read-back-verified" && row.verification === "failed",
  );
  if (failed)
    return {
      action: "verification-failed",
      actor: "cursor",
      repo: failed.repo,
      detail: "Fix on the approved branch or block with an owner. A failed check is not a pass.",
    };

  if (repos(status).length && repos(status).every((row) => row.published === "read-back-verified"))
    return {
      action: "report",
      actor: "cursor",
      detail: "Every repo has a verified read-back. Report coverage, PR links, and the QA handoff.",
    };

  return {
    action: "blocked",
    actor: "human",
    blockers: status.open_blockers ?? [],
    publication: repos(status)
      .filter((row) => row.published !== "read-back-verified")
      .map((row) => ({
        repo: row.repo,
        ready: row.ready,
        verification: row.verification,
        review: row.review,
        gate: row.gate,
        blocked_units: row.blocked_units,
        baseline_current: row.baseline_current,
      })),
    detail: "No legal Cursor step. Report the blocker owner and the unblock condition.",
  };
}
