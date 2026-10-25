#!/usr/bin/env python3
"""Re-pin the exported runtime after a reviewed document change.

Updates start-safety coverage.json and provenance export_sha256 for files they already pin,
drops deleted files, and adds only paths named with --add. source-sha256.json records the
upstream source and is never changed. Run the start-safety check (normal and --self-test)
afterwards; never re-pin to hide a mismatch you have not reviewed.
"""
import argparse
import hashlib
import json
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]/'skills/work-item-delivery'
RUNTIME = SKILL/'vendor/work-item-runtime'
COVERAGE = '.agents/skills/work-item-start-safety/coverage.json'


def digest(name):
    return hashlib.sha256((RUNTIME/name).read_bytes()).hexdigest()


def repin(pins, added):
    names = (set(pins) | set(added))
    return {name: digest(name) for name in sorted(names) if (RUNTIME/name).is_file()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--add', nargs='*', default=[], help='runtime-relative files to start pinning')
    args = parser.parse_args()
    coverage_file = RUNTIME/COVERAGE
    coverage = json.loads(coverage_file.read_text())
    before = dict(coverage['files'])
    coverage['files'] = repin(coverage['files'], [name for name in args.add if name != COVERAGE])
    coverage_file.write_text(json.dumps(coverage, indent=2)+'\n')
    provenance_file = SKILL/'references/provenance.json'
    provenance = json.loads(provenance_file.read_text())
    source = json.loads((SKILL/'references'/provenance['source_sha256_file']).read_text())
    provenance['export_sha256'] = repin(provenance['export_sha256'], args.add)
    provenance['adapted_files'] = sorted(name for name, value in provenance['export_sha256'].items() if source.get(name) != value)
    provenance_file.write_text(json.dumps(provenance, indent=2)+'\n')
    changed = sorted(name for name in set(before) | set(coverage['files']) if before.get(name) != coverage['files'].get(name))
    print(json.dumps({'coverage_changed': changed, 'adapted_files': provenance['adapted_files']}, indent=2))


if __name__ == '__main__':
    main()
