import { resolve, basename } from "node:path";
import { validateApprovedAction, validateActionObservation, approvedActionDecision, validateActionReadback } from "./approved-action.mjs";
import { sha, canonical, assert, text, array, id, readJson, repositoryIdentity, publicationIdentity, receipt } from "./delivery-common.mjs";

export const deliveryPublication = {
  approvedAction(s, repo) {
    const state = s.repos[repo], pub = state.publication;
    if (!state.approved_action && pub?.approval?.hash === pub?.hash && pub &&
        state.published?.head !== pub.head) {
      const request = validateApprovedAction({
        ...pub.payload, operation: "publish",
        ...(pub.payload.action === "update" ? { pr_url: pub.payload.url } : {}),
      });
      state.approved_action = {
        request, hash: sha(canonical(request)), plan_hash: s.plan_hash,
        approval: pub.approval, attachments: pub.attachments ?? [],
        known_blockers: [], preflight: null, completed: null,
      };
    }
    return state.approved_action;
  },
  async approvedActionStatus(s, repo) {
    const record = this.approvedAction(s, repo);
    const blockers = [];
    try {
      assert((await receipt(record.approval.path)).sha256 === record.approval.sha256, "approval evidence changed");
      assert(sha(canonical(record.request)) === record.hash, "approved action changed");
      if (record.completed) {
        assert((await receipt(record.completed.evidence.path)).sha256 === record.completed.evidence.sha256, "action read-back evidence changed");
      } else {
        const r = this.repo(s, repo), path = s.repos[repo].path;
        assert(repositoryIdentity(path) === s.repos[repo].identity, "repository identity changed");
        assert(record.plan_hash === s.plan_hash, "approved scope changed");
        await this.admittedDossier(s.plan);
        assert(record.request.target_branch === r.base_ref.replace(/^origin\//, ""), "approved target branch changed");
        for (const attachment of record.attachments)
          assert((await receipt(attachment.path)).sha256 === attachment.sha256, "approved attachment changed");
        if (record.preflight?.evidence)
          assert((await receipt(record.preflight.evidence.path)).sha256 === record.preflight.evidence.sha256, "preflight evidence changed");
        for (const blocker of s.blockers.filter((b) => !b.resolved && b.units.some((key) => this.unit(s, key).repo === repo)))
          if (!record.known_blockers.includes(sha(canonical(blocker))))
            blockers.push({ id: blocker.id, reason: blocker.reason, owner: blocker.owner });
      }
    } catch (error) { blockers.push({ reason: error.message }); }
    if (blockers.length) return { repo, operation: record.request.operation, phase: "blocked", blockers };
    return { repo, ...approvedActionDecision(record, blockers) };
  },
  async approveAction(repo, file, evidence) {
    return this.locked(async () => {
      const s = await this.load(), r = this.repo(s, repo);
      const request = validateApprovedAction(await readJson(file));
      const path = s.repos[repo].path;
      assert(!s.plan.units.some((u) => u.repo === repo && s.units[u.id].state === "active"), "finish the active writer before approving its external action");
      assert(repositoryIdentity(path) === s.repos[repo].identity, "repository identity changed");
      assert(request.source_branch === r.branch, "wrong approved source branch");
      assert(request.target_branch === r.base_ref.replace(/^origin\//, ""), "wrong approved target branch");
      const identity = publicationIdentity(s.repos[repo]);
      if (identity) {
        assert(request.pr_url === identity.pr_url && (!identity.repository_id || request.repository_id === identity.repository_id), "wrong approved PR identity");
        if (request.operation === "publish") assert(request.action === "update", "update the existing grouped PR rather than creating another");
      }
      if (request.operation === "publish")
        assert(request.work_item_ids.map(String).includes(String(s.plan.work_item.id)), "owning Work Item association is required");
      const attachments = [];
      for (const item of request.attachments ?? [])
        attachments.push({ name: item.name ?? basename(item.path), ...(await receipt(item.path)) });
      s.repos[repo].approved_action = {
        request, hash: sha(canonical(request)), plan_hash: s.plan_hash,
        approval: await receipt(evidence), attachments,
        known_blockers: s.blockers.filter((b) => !b.resolved && b.units.some((key) => this.unit(s, key).repo === repo)).map((b) => sha(canonical(b))),
        preflight: null, completed: null,
      };
      await this.save(s, { type: "action-approved", repo, operation: request.operation,
        request, hash: s.repos[repo].approved_action.hash, evidence: s.repos[repo].approved_action.approval });
      return this.approvedActionStatus(s, repo);
    });
  },
  async checkAction(repo, file) {
    return this.locked(async () => {
      const s = await this.load();
      this.repo(s, repo);
      const record = this.approvedAction(s, repo);
      assert(record && !record.completed, "no pending approved action");
      try {
        const evidence = await receipt(file);
        const observation = validateActionObservation(await readJson(file));
        record.preflight = { evidence, observation };
      } catch (error) {
        record.preflight = { error: error.message };
      }
      await this.save(s, { type: "approved-action-preflight", repo, preflight: record.preflight });
      return this.approvedActionStatus(s, repo);
    });
  },
  async completeAction(repo, file) {
    return this.locked(async () => {
      const s = await this.load();
      this.repo(s, repo);
      const record = this.approvedAction(s, repo);
      assert(record, "approved action required");
      assert((await receipt(record.approval.path)).sha256 === record.approval.sha256, "approval evidence changed");
      assert(sha(canonical(record.request)) === record.hash, "approved action changed");
      const actual = await readJson(file);
      validateActionReadback(record.request, actual);
      if (record.request.operation === "publish")
        assert(canonical((actual.attachments ?? []).map((a) => [a.name, a.sha256, a.bytes]).sort()) ===
          canonical(record.attachments.map((a) => [a.name, a.sha256, a.bytes]).sort()), "attachment read-back differs");
      record.completed = { result: actual, evidence: await receipt(file) };
      s.repos[repo].pr_identity = { pr_url: actual.pr_url, repository_id: actual.repository_id };
      await this.save(s, { type: "approved-action-completed", repo, operation: record.request.operation,
        evidence: record.completed.evidence, result: actual });
      return this.approvedActionStatus(s, repo);
    });
  },
  async stagePublication(repo, file) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      await this.requireNoCorrections(s,s.plan.units.filter(u=>u.repo===repo).map(u=>u.id),"publication certification");
      for (const result of s.repos[repo]?.verification?.results ?? [])
        assert(
          (await receipt(result.evidence.path)).sha256 ===
            result.evidence.sha256,
          "verification evidence changed",
        );
      if (s.repos[repo]?.review?.evidence)
        assert(
          (await receipt(s.repos[repo].review.evidence.path)).sha256 ===
            s.repos[repo].review.evidence.sha256,
          "review receipt changed",
        );
      for (const review of s.repos[repo]?.review?.reviews ?? [])
        assert(
          (await receipt(review.evidence.path)).sha256 ===
            review.evidence.sha256,
          "review evidence changed",
        );
      const ready = (await this.summarize(s)).publication.find(
        (r) => r.repo === repo,
      );
      assert(
        ready?.ready,
        "all grouped cases, current-head verification and reviews must be ready",
      );
      const w = this.workspace(s, repo, { clean: true });
      const payload = await readJson(file);
      text(payload.title, "PR title");
      text(payload.description, "PR description");
      assert(
        payload.description.length <= 4000 &&
          [...payload.description].length <= 4000,
        "PR description exceeds 4000 characters",
      );
      assert(payload.head === w.head, "publication payload head mismatch");
      assert(
        payload.source_branch === this.repo(s, repo).branch,
        "wrong publication branch",
      );
      assert(
        payload.target_branch ===
          this.repo(s, repo).base_ref.replace(/^origin\//, ""),
        "wrong publication target",
      );
      assert(
        payload.is_draft === true || payload.is_draft === false,
        "explicit draft state required",
      );
      assert(
        ["create", "update"].includes(payload.action),
        "publication must explicitly create or update",
      );
      text(payload.url, "publication endpoint or existing PR URL");
      text(payload.repository_id, "publication repository identity");
      const identity = publicationIdentity(s.repos[repo]);
      if (identity)
        assert(
          payload.action === "update" &&
            payload.url === identity.pr_url &&
            (!identity.repository_id || payload.repository_id === identity.repository_id),
          "this repository already has its grouped PR; update that PR instead of creating another",
        );
      array(payload.work_item_ids, "approved work item links");
      assert(
        payload.work_item_ids.map(String).includes(String(s.plan.work_item.id)),
        "owning Work Item association is required",
      );
      const attachments = [];
      for (const a of payload.attachments ?? [])
        attachments.push({
          name: a.name ?? basename(a.path),
          ...(await receipt(a.path)),
        });
      s.repos[repo].publication = {
        head: w.head,
        payload,
        attachments,
        hash: sha(canonical({ payload, attachments })),
        approval: null,
      };
      await this.save(s, { type: "publication-staged", repo });
      return {
        approval_required: s.repos[repo].publication.hash,
        action: payload,
      };
    });
  },
  async approvePublication(repo, hash, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      await this.requireNoCorrections(s,s.plan.units.filter(u=>u.repo===repo).map(u=>u.id),"publication certification");
      assert(
        (await this.summarize(s)).publication.find((row) => row.repo === repo)
          ?.ready,
        "grouped PR readiness changed; resolve blockers/checks/reviews before publishing",
      );
      const pub = s.repos[repo]?.publication;
      assert(pub && hash === pub.hash, "publication payload changed");
      assert(
        this.workspace(s, repo, { clean: true }).head === pub.head,
        "source changed after staging",
      );
      for (const a of pub.attachments)
        assert(
          (await receipt(a.path)).sha256 === a.sha256,
          "attachment changed after staging",
        );
      pub.approval = { hash, ...(await receipt(evidence)) };
      await this.save(s, { type: "publication-approved", repo, hash });
      return {
        approved: hash,
        action: pub.payload,
        instructions:
          "Execute exactly this action with the authenticated forge connector, then ingest its direct read-back using published. Approval does not authorize ticket field edits, merges or deployment.",
      };
    });
  },
  async published(repo, file) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      assert(
        (await this.summarize(s,{approvedContinuation:true})).publication.find((row) => row.repo === repo)
          ?.ready,
        "grouped PR readiness changed; resolve blockers/checks/reviews before publishing",
      );
      const pub = s.repos[repo]?.publication;
      assert(
        pub?.approval?.hash === pub?.hash && pub,
        "exact publication approval required",
      );
      assert(
        this.workspace(s, repo, { clean: true }).head === pub.head,
        "source changed after approval",
      );
      const actual = await readJson(file),
        expected = pub.payload;
      for (const k of [
        "repository_id",
        "title",
        "description",
        "head",
        "source_branch",
        "target_branch",
        "is_draft",
      ])
        assert(
          actual[k] === expected[k],
          `publication read-back differs: ${k}`,
        );
      assert(actual.status === "active", "PR must be active");
      assert(
        canonical(actual.work_item_ids?.map(String).sort()) ===
          canonical(expected.work_item_ids.map(String).sort()),
        "work item associations differ",
      );
      assert(
        canonical(
          (actual.attachments ?? [])
            .map((a) => [a.name, a.sha256, a.bytes])
            .sort(),
        ) ===
          canonical(
            pub.attachments.map((a) => [a.name, a.sha256, a.bytes]).sort(),
          ),
        "attachment hashes differ",
      );
      text(actual.pr_url, "PR URL");
      assert(/^https:\/\//.test(actual.pr_url), "PR URL must be HTTPS");
      const identity = publicationIdentity(s.repos[repo]);
      if (expected.action === "update" || identity) assert(actual.pr_url === (identity?.pr_url ?? expected.url), "publication read-back differs: PR identity");
      s.repos[repo].pr_identity = {pr_url:actual.pr_url,repository_id:actual.repository_id};
      s.repos[repo].published = {
        head: pub.head,
        pr_url: actual.pr_url,
        evidence: await receipt(file),
      };
      const execution = this.approvedAction(s, repo);
      if (execution?.request.operation === "publish" && execution.request.head === actual.head)
        execution.completed = { result: actual, evidence: s.repos[repo].published.evidence };
      for (const u of s.plan.units.filter((u) => u.repo === repo))
        s.units[u.id].state = "published";
      await this.save(s, {
        type: "publication-read-back-verified",
        repo,
        pr_url: actual.pr_url,
      });
      return s.repos[repo].published;
    });
  }
};
