#!/usr/bin/env python3
"""Check the exported snapshot and wizard statically; run real offline runtime tests."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT/'skills/work-item-delivery'
RUNTIME = SKILL/'vendor/work-item-runtime'
OWN = ['work-item-delivery', 'work-item-investigate', 'work-item-design', 'work-item-align',
       'work-item-implement', 'work-item-verify', 'work-item-review',
       'work-item-publish', 'work-item-approved-action', 'work-item-report',
       'work-item-start-safety', 'proof-of-work',
       'azure-pr-format', 'azure-pr-write', 'azure-pr-review',
       'azure-commit-message', 'azure-change-record']
WINDOWS_OWN = ['wiki-query', 'think']
PRIVATE = re.compile(r'/home/[a-z0-9_.-]+/|gh[pousr]_[A-Za-z0-9]{30,}')


def check(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path)
    parser.add_argument('--formal', action='store_true')
    parser.add_argument('--privacy-pattern-file', type=Path, help='Optional private, external one-regex-per-line denylist; never commit it')
    args = parser.parse_args()
    out = args.out.resolve() if args.out else Path(tempfile.mkdtemp(prefix='work-item-package-'))
    check(out != ROOT and ROOT not in out.parents, 'Keep check output outside this checkout')
    out.mkdir(parents=True, exist_ok=True)
    provenance = json.loads((SKILL/'references/provenance.json').read_text())
    for name, digest in provenance['export_sha256'].items():
        check(hashlib.sha256((RUNTIME/name).read_bytes()).hexdigest() == digest, 'Export drift: '+name)
    patterns = [PRIVATE]
    if args.privacy_pattern_file:
        patterns += [re.compile(line) for line in args.privacy_pattern_file.read_text().splitlines() if line.strip()]
    candidates = [file for folder in OWN for file in (ROOT/'skills'/folder).rglob('*')]
    candidates += [file for folder in WINDOWS_OWN for file in (ROOT/'windows/skills'/folder).rglob('*')]
    candidates += list((ROOT/'claude/agents').rglob('*'))
    candidates += [ROOT/'scripts'/name for name in ['check-work-item-package.py', 'install-work-item-delivery.py', 'setup-work-item-delivery.sh', 'test_install_work_item_delivery.py', 'test_claude_session_resume.py', 'test_work_item_chain.py', 'test_run_conflicts.py', 'test_red_lock.py']]
    for file in candidates:
            if not file.is_file() or '__pycache__' in file.parts:
                continue
            content = file.read_text(encoding='utf-8')
            check(not any(pattern.search(content) for pattern in patterns), 'Private source marker in '+str(file.relative_to(ROOT)))
    wizard = ROOT/'scripts/setup-work-item-delivery.sh'
    script = wizard.read_text()
    metadata = json.loads((SKILL/'references/wizard-template.json').read_text())
    library = script.split('# STAGES: author this section.', 1)[0]
    check(hashlib.sha256(library.encode()).hexdigest() == metadata['library_sha256_lf'], 'Wizard library changed')
    check(len(re.findall(r'^\s*stage "', script, re.M)) == metadata['stages'] == 5, 'Wizard stage count mismatch')
    check('TOTAL_STAGES=5' in script and script.endswith('run_wizard "$@"; exit\n'), 'Wizard lifecycle mismatch')
    check(wizard.stat().st_mode & 0o111, 'Wizard must be executable')
    ignore = (ROOT/'.gitignore').read_text()
    check('.work-item-setup.env' in ignore, 'Private setup settings must be ignored')
    results = {}

    def run(name, argv, cwd=ROOT):
        result = subprocess.run(argv, cwd=cwd, capture_output=True, text=True)
        payload = result.stdout+result.stderr
        (out/(name+'.log')).write_text(payload)
        results[name] = {'exit': result.returncode, 'sha256': hashlib.sha256(payload.encode()).hexdigest()}
        check(result.returncode == 0, name+' failed; inspect '+str(out/(name+'.log')))
        return payload

    run('wizard-syntax', ['bash', '-n', str(wizard)])
    if shutil.which('shellcheck'):
        run('shellcheck', ['shellcheck', '-S', 'warning', str(wizard)])
    else:
        results['shellcheck'] = {'status': 'NOT_RUN', 'reason': 'not installed'}
    run('skills', ['python3', 'scripts/validate_skills.py'])
    node = run('runtime-tests', ['node', '--test', '--test-reporter=tap', *map(str, sorted((RUNTIME/'test').glob('*.test.mjs')))], RUNTIME)
    run('spec-tests', ['python3', '-B', '-m', 'unittest', 'discover', '-s', 'test', '-p', 'test_draft_spec.py', '-v'], RUNTIME)
    if args.formal:
        run('formal', ['python3', '.agents/skills/work-item-start-safety/scripts/check.py'], RUNTIME)
    result = {'status': 'PASS', 'out': str(out), 'runtime_tests': int(re.search(r'^# tests (\d+)$', node, re.M)[1]),
              'results': results, 'limits': 'Offline synthetic tests and static wizard checks; no interactive wizard, live connector, host/plugin/model execution, real Work Item or deployment verification.'}
    (out/'result.json').write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
