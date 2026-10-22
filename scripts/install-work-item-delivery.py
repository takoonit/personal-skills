#!/usr/bin/env python3
"""Install the portable workflow without replacing existing skills or launchers."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ('work-item-delivery', 'work-item-start-safety', 'proof-of-work',
          'azure-pr-format', 'azure-pr-write', 'azure-pr-review',
          'azure-commit-message', 'azure-change-record')


def files(directory):
    result = {}
    for path in directory.rglob('*'):
        if path.is_symlink():
            raise ValueError('Refusing existing symlink: ' + str(path))
        if path.is_file():
            result[str(path.relative_to(directory))] = path.read_bytes()
    return result


def settings(path):
    values = {}
    if path:
        for line in path.read_text().splitlines():
            if not line.strip() or line.lstrip().startswith('#'):
                continue
            parts = shlex.split(line)
            if len(parts) != 1 or '=' not in parts[0]:
                raise ValueError('Invalid setup setting; expected one quoted KEY=value')
            key, value = parts[0].split('=', 1)
            values[key] = value
    return values


def install(skills_directory, bin_directory, values):
    skills_directory, bin_directory = skills_directory.resolve(), bin_directory.resolve()
    executable = shutil.which('node')
    if not executable:
        raise ValueError('Node 22+ must be available on PATH')
    version = subprocess.check_output([executable, '--version'], text=True).strip()
    if int(version.lstrip('v').split('.')[0]) < 22:
        raise ValueError('Node 22+ required; found ' + version)
    capability = subprocess.run([executable, '--input-type=module', '-e',
                                 "import {DatabaseSync} from 'node:sqlite'; if(typeof DatabaseSync !== 'function') process.exit(1)"],
                                capture_output=True, text=True)
    if capability.returncode:
        raise ValueError('This Node build lacks node:sqlite; use a current Node 22 or 24 release')
    if not shutil.which('git'):
        raise ValueError('Git must be available on PATH')
    for destination in (skills_directory, bin_directory):
        if destination.exists() and not destination.is_dir():
            raise ValueError('Install destination must be a directory: ' + str(destination))
    source_roots = [(ROOT/'skills'/name).resolve() for name in SKILLS]
    for destination in (skills_directory, bin_directory):
        if any(destination == source or source in destination.parents for source in source_roots):
            raise ValueError('Choose installation directories outside the source skill packages')
    with tempfile.TemporaryDirectory(prefix='work-item-install-') as temporary:
        stage = Path(temporary)
        for name in SKILLS:
            shutil.copytree(ROOT/'skills'/name, stage/name)
        runtime = stage/'work-item-delivery/vendor/work-item-runtime'
        config_file = runtime/'config.json'
        config = json.loads(config_file.read_text())
        for key, field in [('ADO_ORGANIZATION', 'organization'), ('ADO_PROJECT', 'project')]:
            if values.get(key):
                config['tracker'][field] = values[key]
        for key, field in [('CONFLUENCE_SITE', 'confluence_site'), ('KNOWLEDGE_VAULT', 'vault')]:
            if key in values:
                config['knowledge'][field] = values[key]
        config_file.write_text(json.dumps(config, indent=2)+'\n')
        coverage_file = runtime/'.agents/skills/work-item-start-safety/coverage.json'
        coverage = json.loads(coverage_file.read_text())
        coverage['files']['config.json'] = hashlib.sha256(config_file.read_bytes()).hexdigest()
        coverage_file.write_text(json.dumps(coverage, indent=2)+'\n')
        launcher = bin_directory/'work-item-delivery'
        entry = skills_directory/'work-item-delivery/vendor/work-item-runtime/bin/wid.mjs'
        launcher_bytes = ('#!/usr/bin/env bash\nexec node ' + shlex.quote(str(entry)) + ' "$@"\n').encode()
        pending = []
        for name in SKILLS:
            destination = skills_directory/name
            if destination.is_symlink() or (destination.exists() and not destination.is_dir()):
                raise ValueError('Existing install conflicts; preserve it: ' + str(destination))
            if destination.exists():
                if files(destination) != files(stage/name):
                    raise ValueError('Existing skill differs; preserve it and choose a fresh directory: ' + str(destination))
            else:
                pending.append(name)
        if launcher.is_symlink() or (launcher.exists() and (not launcher.is_file() or launcher.read_bytes() != launcher_bytes)):
            raise ValueError('Existing launcher conflicts; preserve it: ' + str(launcher))
        if launcher.exists() and not os.access(launcher, os.X_OK):
            raise ValueError('Existing launcher is not executable: ' + str(launcher))
        skills_directory.mkdir(parents=True, exist_ok=True)
        bin_directory.mkdir(parents=True, exist_ok=True)
        for name in pending:
            shutil.copytree(stage/name, skills_directory/name)
        if not launcher.exists():
            with launcher.open('xb') as handle:
                handle.write(launcher_bytes)
            launcher.chmod(0o755)
        print(json.dumps({'installed_skills': list(SKILLS), 'new_skills': pending,
                          'runtime': str(entry.parent.parent), 'launcher': str(launcher),
                          'scope': 'Local installation only; plugin discovery, authentication and Work Item approval are separate.'}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--skills-dir', type=Path, required=True)
    parser.add_argument('--bin-dir', type=Path, default=Path.home()/'.local/bin')
    parser.add_argument('--settings', type=Path)
    args = parser.parse_args()
    try:
        install(args.skills_dir.expanduser(), args.bin_dir.expanduser(), settings(args.settings))
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, str(error)+'\n')


if __name__ == '__main__':
    main()
