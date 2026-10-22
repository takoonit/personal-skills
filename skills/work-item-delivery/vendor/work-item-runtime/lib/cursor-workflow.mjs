// Advises the Cursor session. The CLI ledger remains the authority; this does not approve, edit, or publish.
const IMPLEMENTED = new Set(["implemented", "verified", "reviewed", "published"]);

function repos(status) {
  return status.publication ?? [];
}

function units(status, repo) {
  return (status.units ?? []).filter((unit) => unit.repo === repo);
}

export function nextCursorAction(status) {
  if (!status?.plan_hash)
    return {
      action: "intake",
      actor: "cursor",
      detail: "No initialized plan. Read the Work Item, sources, and flows, then intake and init.",
    };
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
    if (row.published === "read-back-verified" || !row.ready) continue;
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
