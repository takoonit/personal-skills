#!/usr/bin/env python3
"""Verify Work Item implementation admission using the current local workflow."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import urllib.request

SKILL = Path(__file__).resolve().parents[1]
ROOT = SKILL.parents[2]
JAVA_IMAGE = "apache/kafka@sha256:77e3df9054047a88b520d0cc46e16696d3b22022e1d580aeccd2632df6532837"
JAR_SHA256 = "936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88"
SELF_TEST_FILE = ".agents/skills/work-item-start-safety/scripts/admission.test.mjs"


def run(command, root, log):
    result = subprocess.run(command, cwd=root, text=True, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, timeout=120)
    log.write_text(result.stdout)
    return result


def tests(root, names, log):
    pattern = "^(?:" + "|".join(re.escape(name) for name in names) + ")$"
    suites = [str(path.relative_to(root)) for path in sorted((root / "test").glob("*.test.mjs"))]
    return run(["node", "--test", "--test-reporter=tap", "--test-concurrency=1",
                "--test-name-pattern", pattern, *suites, SELF_TEST_FILE], root, log)


def require_tests(result, names):
    if result.returncode:
        raise SystemExit("Gate tests failed. Inspect the test log.")
    for name in names:
        if not re.search(r"^ok \d+ - " + re.escape(name) + r"$", result.stdout, re.M):
            raise SystemExit("Required test was missing or skipped: " + name)


def model(jar, directory, log):
    arguments = ["-XX:+UseParallelGC", "-Xmx768m", "-cp", str(jar), "tlc2.TLC",
                 "-workers", "1", "-metadir", str(log.parent / (log.stem + "-states")),
                 "-config", str(directory / "WorkItemStart.cfg"), "WorkItemStart.tla"]
    if shutil.which("java"):
        command = ["java", *arguments]
    else:
        arguments[3] = "/tlc.jar"
        arguments[8] = "/output/" + log.stem + "-states"
        arguments[10] = "/model/WorkItemStart.cfg"
        command = ["docker", "run", "--rm", "--network", "none", "--entrypoint", "java",
                   "-v", str(jar) + ":/tlc.jar:ro", "-v", str(directory) + ":/model:ro",
                   "-v", str(log.parent) + ":/output", "--workdir", "/model",
                   JAVA_IMAGE, *arguments]
    return run(command, directory, log)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true",
                        help="also check deliberate source and model breaks in temporary copies")
    args = parser.parse_args()
    coverage = json.loads((SKILL / "coverage.json").read_text())
    drift = [name for name, digest in coverage["files"].items()
             if not (ROOT / name).is_file()
             or hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != digest]
    if drift:
        raise SystemExit("DRIFT: reconcile the verification with the current workflow: " + ", ".join(drift))
    proof_root = Path.home() / ".local/share/work-item-delivery/verification/work-item-start-safety"
    proof_root.mkdir(parents=True, exist_ok=True)
    output = Path(tempfile.mkdtemp(prefix="check-", dir=proof_root))
    print("Evidence directory: " + str(output), flush=True)
    (output / "baseline.json").write_text(json.dumps(coverage, indent=2) + "\n")
    names = json.loads((SKILL / "checks.json").read_text())["tests"]
    cache = Path.home() / ".cache/benefit-verification"
    cache.mkdir(parents=True, exist_ok=True)
    jar = cache / "tla2tools-1.7.4.jar"
    if not jar.exists():
        urllib.request.urlretrieve("https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar", jar)
    if hashlib.sha256(jar.read_bytes()).hexdigest() != JAR_SHA256:
        raise SystemExit("TLC jar checksum mismatch.")
    checked = model(jar, SKILL / "model", output / "model.log")
    if checked.returncode or "Model checking completed. No error has been found." not in checked.stdout:
        raise SystemExit("Admission model failed. Inspect model.log.")
    print("PASS: bounded admission model.", flush=True)
    normal = tests(ROOT, names, output / "gate-tests.tap")
    require_tests(normal, names)
    print("PASS: all " + str(len(names)) + " required real-code tests ran; adviser covered 16 combinations.", flush=True)

    if args.self_test:
        mutations = [
            ("approval", "lib/delivery-execution.mjs", "async start(unit, owner)", "async finish(",
             "await this.requireApproval(s);", "",
             "blocked sibling does not block independent implementation but holds grouped PR", "Missing expected rejection"),
            ("readiness", "lib/delivery-execution.mjs", "async start(unit, owner)", "async finish(",
             "assert(ready.ready, JSON.stringify(ready));", "",
             "missing before capture holds only affected UI work; real artifact receipt unlocks it", "Missing expected rejection"),
            ("workspace", "lib/delivery-execution.mjs", "async start(unit, owner)", "async finish(",
             "const w = this.workspace(s, u.repo, { clean: true });",
             "const w = this.workspace(s, u.repo, { clean: false });",
             "execution starts clean without discarding existing tracked or untracked work", "Missing expected rejection"),
            ("writer", "lib/delivery-readiness.mjs", "async readiness(s, u)", "async summarize(",
             's.units[v.id].state === "active"', 's.units[v.id].state === "never-active"',
             "only one writer per repo, while another repo can progress", "Missing expected rejection"),
            ("adviser", "lib/cursor-workflow.mjs", "export function nextCursorAction", None,
             "if (!status.approved)", "if (false)",
             "start safety adviser covers all 16 admission combinations", "await-human"),
        ]
        for name, file, first, last, old, new, test_name, expected in mutations:
            with tempfile.TemporaryDirectory(prefix="wid-start-mutant-") as temporary:
                scratch = Path(temporary)
                for directory in ["lib", "bin", "vendor", "templates", "test", "scripts"]:
                    shutil.copytree(ROOT / directory, scratch / directory)
                for file_name in ["package.json", "config.json"]:
                    shutil.copy2(ROOT / file_name, scratch / file_name)
                shutil.copytree(SKILL, scratch / ".agents/skills/work-item-start-safety")
                path = scratch / file
                source = path.read_text()
                begin = source.index(first)
                end = source.index(last, begin) if last else len(source)
                section = source[begin:end]
                if section.count(old) != 1:
                    raise SystemExit("Missing or ambiguous mutation anchor: " + name)
                path.write_text(source[:begin] + section.replace(old, new) + source[end:])
                result = tests(scratch, [test_name], output / (name + "-mutant.tap"))
                failed_test = re.search(r"^not ok \d+ - " + re.escape(test_name) + r"$", result.stdout, re.M)
                if result.returncode == 0 or not failed_test or expected not in result.stdout:
                    raise SystemExit("Mutant did not fail its expected behavioral assertion: " + name)
                print("PASS: scratch runtime mutation detected: " + name, flush=True)
        for flag, invariant in [("GuardApproval", "ApprovedAdmission"),
                                ("GuardReady", "ReadyAdmission"),
                                ("GuardWorkspace", "WorkspaceAdmission"),
                                ("GuardWriter", "SingleWriter")]:
            directory = output / flag
            shutil.copytree(SKILL / "model", directory)
            cfg = directory / "WorkItemStart.cfg"
            source = cfg.read_text().replace(flag + " = TRUE", flag + " = FALSE")
            source = source[:source.index("INVARIANTS")] + "INVARIANT " + invariant + "\nCHECK_DEADLOCK FALSE\n"
            cfg.write_text(source)
            result = model(jar, directory, output / (flag + ".log"))
            if result.returncode == 0 or "Invariant " + invariant + " is violated" not in result.stdout:
                raise SystemExit("Model mutant did not violate the intended invariant: " + flag)
            print("PASS: model mutation detected: " + invariant, flush=True)
        restored = tests(ROOT, names, output / "restored-gate-tests.tap")
        require_tests(restored, names)
        print("PASS: original runtime still passes after scratch mutations.", flush=True)
    after_drift = [name for name, digest in coverage["files"].items()
                   if not (ROOT / name).is_file()
                   or hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != digest]
    if after_drift:
        raise SystemExit("Source changed during verification; result is stale: " + ", ".join(after_drift))
    (output / "result.json").write_text(json.dumps({
        "passed": True, "required_tests": len(names), "adviser_combinations": 16,
        "source_mutants": 5 if args.self_test else 0,
        "model_mutants": 4 if args.self_test else 0,
        "scope": "offline workflow gate verification; no live Work Item readiness claim",
    }, indent=2) + "\n")
    print("PASS: workflow admission checks; no live Work Item was approved or started.", flush=True)


if __name__ == "__main__":
    main()
