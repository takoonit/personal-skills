import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { assert, text, id, git, atLeast, readJson, receipt } from "./delivery-common.mjs";

export const deliveryVerification = {
  async verify(repo) {
    // Take an immutable verification brief under the lock, then release it while
    // tests run. Other repositories can continue using the same durable store.
    const job = await this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      this.repo(s, repo);
      assert(
        !s.repos[repo].verification_running,
        "verification already running; inspect its recorded PID before recovery",
      );
      assert(
        !s.plan.units.some(
          (u) => u.repo === repo && s.units[u.id].state === "active",
        ),
        "finish active work before combined verification",
      );
      const group = s.plan.units.filter(
        (u) => u.repo === repo && atLeast(s.units[u.id].state, "implemented"),
      );
      assert(group.length, "no implemented units to verify");
      assert(await this.dependenciesReady(s, group, {certifyingRepo:repo}), "dependency evidence is stale or blocked; reconcile prerequisites before verification");
      const w = this.workspace(s, repo, { clean: true }),
        token = randomUUID();
      s.repos[repo].verification_running = {
        token,
        pid: process.pid,
        head: w.head,
      };
      s.repos[repo].verification = null;
      s.repos[repo].review = null;
      s.repos[repo].publication = null;
      await this.save(s, {
        type: "verification-started",
        repo,
        token,
        head: w.head,
      });
      return { ...w, token, group, plan_hash: s.plan_hash };
    });
    const results = [];
    await mkdir(join(this.directory, "evidence"), { recursive: true });
    for (const u of job.group)
      for (const check of u.checks) {
        const result = spawnSync(check.argv[0], check.argv.slice(1), {
          cwd: job.path,
          encoding: "utf8",
          timeout: check.timeout_ms,
          maxBuffer: 8 * 1024 * 1024,
          shell: false,
        });
        const file = join(
          this.directory,
          "evidence",
          `${u.id}-${check.id}-${randomUUID()}.log`,
        );
        await writeFile(
          file,
          `COMMAND ${JSON.stringify(check.argv)}\nEXIT ${result.status}\n${result.stdout ?? ""}\n${result.stderr ?? ""}\n${result.error?.message ?? ""}`,
          { mode: 0o600 },
        );
        results.push({
          unit: u.id,
          check: check.id,
          exit_code: result.status,
          evidence: await receipt(file),
        });
      }
    const continuation = new this.constructor(this.directory);
    return continuation.locked(async () => {
      const s = await continuation.load();
      assert(
        s.repos[repo].verification_running?.token === job.token,
        "verification ownership changed",
      );
      const sourceUnchanged =
        git(job.path, "rev-parse", "HEAD") === job.head &&
        !git(job.path, "status", "--porcelain") &&
        s.plan_hash === job.plan_hash &&
        await continuation.dependenciesReady(s, job.group, {certifyingRepo:repo});
      const passed = sourceUnchanged && results.every((r) => r.exit_code === 0);
      delete s.repos[repo].verification_running;
      s.repos[repo].verification = {
        head: job.head,
        passed,
        source_unchanged: sourceUnchanged,
        results,
      };
      for (const u of job.group)
        if (s.units[u.id].state !== "published") s.units[u.id].state = passed ? "verified" : "implemented";
      await continuation.save(s, {
        type: "repository-verified",
        repo,
        head: job.head,
        passed,
      });
      return s.repos[repo].verification;
    });
  },
  async recoverVerification(repo, evidence) {
    return this.locked(async () => {
      const s = await this.load();
      this.repo(s, repo);
      const job = s.repos[repo].verification_running;
      assert(job, "no interrupted verification");
      let dead = false;
      try {
        process.kill(job.pid, 0);
      } catch (e) {
        dead = e.code === "ESRCH";
      }
      assert(
        dead,
        "recorded verifier process is still alive or its state is unknown",
      );
      const proof = await receipt(evidence);
      delete s.repos[repo].verification_running;
      s.repos[repo].verification = null;
      await this.save(s, {
        type: "interrupted-verification-recovered",
        repo,
        evidence: proof,
      });
      return { repo, verification: "not run; rerun required" };
    });
  },
  async review(repo, file) {
    return this.locked(async () => {
      const s = await this.load();
      await this.requireApproval(s);
      const w = this.workspace(s, repo, { clean: true }),
        report = await readJson(file);
      const group = s.plan.units.filter(u => u.repo === repo && atLeast(s.units[u.id].state, "implemented"));
      assert(await this.dependenciesReady(s, group, {certifyingRepo:repo}), "dependency evidence is stale or blocked before review");
      assert(
        s.repos[repo].verification?.head === w.head &&
          s.repos[repo].verification?.passed,
        "verify this head before review",
      );
      assert(report.head === w.head, "review is for a stale head");
      for (const axis of ["standards", "specification"]) {
        const row = report.reviews?.find((r) => r.axis === axis);
        assert(
          row && row.verdict === "pass",
          "both standards and specification review must pass",
        );
        text(row.reviewer, "reviewer");
        row.evidence = await receipt(row.report);
      }
      s.repos[repo].review = {
        head: w.head,
        reviews: report.reviews,
        evidence: await receipt(file),
      };
      for (const u of s.plan.units.filter(
        (u) => u.repo === repo && atLeast(s.units[u.id].state, "verified"),
      ))
        if (s.units[u.id].state !== "published") s.units[u.id].state = "reviewed";
      await this.save(s, { type: "repository-reviewed", repo, head: w.head });
      return s.repos[repo].review;
    });
  }
};
