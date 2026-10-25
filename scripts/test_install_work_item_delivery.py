import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
INSTALLER = ROOT/'scripts/install-work-item-delivery.py'
WINDOWS_SKILLS = ['wiki-query', 'think']


class InstallTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='workflow-install-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.skills = self.root/"agent's skills"
        self.bin = self.root/'local bin'
        self.settings = self.root/'setup.env'
        self.settings.write_text("ADO_ORGANIZATION='example-org'\nADO_PROJECT='Example Project'\n")

    def install(self, *extra):
        return subprocess.run(['python3', str(INSTALLER), '--skills-dir', str(self.skills),
                               '--bin-dir', str(self.bin), '--settings', str(self.settings), *extra],
                              capture_output=True, text=True)

    def test_installed_runtime_and_quoted_launcher_work(self):
        source = ROOT/'skills/work-item-delivery/vendor/work-item-runtime/config.json'
        before = source.read_bytes()
        result = self.install()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(json.loads(result.stdout)['installed_skills']), 17)
        runtime = self.skills/'work-item-delivery/vendor/work-item-runtime'
        config = json.loads((runtime/'config.json').read_text())
        self.assertEqual(config['tracker']['project'], 'Example Project')
        self.assertEqual(config['branch_prefixes'], {'Bug': 'fix/'})
        coverage = json.loads((runtime/'.agents/skills/work-item-start-safety/coverage.json').read_text())
        self.assertEqual(coverage['files']['config.json'], hashlib.sha256((runtime/'config.json').read_bytes()).hexdigest())
        self.assertEqual(source.read_bytes(), before)
        run = subprocess.run([str(self.bin/'work-item-delivery'), 'help'], capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertIn('approve-plan', run.stdout)
        self.assertTrue((runtime/'.agents/skills/work-item-start-safety/model/WorkItemStart.tla').is_file())

    def test_windows_vault_skills_are_skipped_on_posix_hosts(self):
        result = self.install('--windows-host', 'no')
        self.assertEqual(result.returncode, 0, result.stderr)
        output = json.loads(result.stdout)
        self.assertEqual(output['windows_skills'], [])
        self.assertEqual(len(output['installed_skills']), 17)
        for name in WINDOWS_SKILLS:
            self.assertFalse((self.skills/name).exists())

    def test_windows_vault_skills_install_for_windows_hosts(self):
        result = self.install('--windows-host', 'yes')
        self.assertEqual(result.returncode, 0, result.stderr)
        output = json.loads(result.stdout)
        self.assertEqual(output['windows_skills'], WINDOWS_SKILLS)
        self.assertEqual(len(output['installed_skills']), 19)
        for name in WINDOWS_SKILLS:
            self.assertEqual((self.skills/name/'SKILL.md').read_bytes(),
                             (ROOT/'windows/skills'/name/'SKILL.md').read_bytes())
        rerun = self.install('--windows-host', 'yes')
        self.assertEqual(rerun.returncode, 0, rerun.stderr)
        self.assertEqual(json.loads(rerun.stdout)['new_skills'], [])

    def test_existing_vault_skill_is_preserved_on_windows_hosts(self):
        existing = self.skills/'wiki-query'
        existing.mkdir(parents=True)
        (existing/'SKILL.md').write_text('my claude-obsidian install')
        result = self.install('--windows-host', 'yes')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Existing skill differs', result.stderr)
        self.assertEqual((existing/'SKILL.md').read_text(), 'my claude-obsidian install')
        self.assertFalse((self.skills/'work-item-delivery').exists())

    def test_claude_agents_install_only_with_agents_dir(self):
        result = self.install()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['claude_agents'], [])
        agents = self.root/'claude agents'
        result = self.install('--agents-dir', str(agents))
        self.assertEqual(result.returncode, 0, result.stderr)
        names = sorted(path.name for path in (ROOT/'claude/agents').glob('*.md'))
        self.assertEqual(json.loads(result.stdout)['new_agents'], names)
        for name in names:
            self.assertEqual((agents/name).read_bytes(), (ROOT/'claude/agents'/name).read_bytes())
        rerun = self.install('--agents-dir', str(agents))
        self.assertEqual(rerun.returncode, 0, rerun.stderr)
        self.assertEqual(json.loads(rerun.stdout)['new_agents'], [])

    def test_existing_agent_definition_is_preserved(self):
        agents = self.root/'agents'
        agents.mkdir()
        (agents/'work-item-reviewer.md').write_text('my reviewer')
        result = self.install('--agents-dir', str(agents))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Existing agent definition conflicts', result.stderr)
        self.assertEqual((agents/'work-item-reviewer.md').read_text(), 'my reviewer')
        self.assertFalse((agents/'work-item-investigator.md').exists())
        self.assertFalse((self.skills/'work-item-delivery').exists())

    def test_windows_host_detection(self):
        spec = importlib.util.spec_from_file_location('installer', INSTALLER)
        installer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(installer)
        self.assertTrue(installer.windows_host('yes', Path('/srv/agent/.claude/skills')))
        self.assertFalse(installer.windows_host('no', Path('/mnt/c/Users/me/.claude/skills')))
        if os.name != 'nt':
            self.assertTrue(installer.windows_host('auto', Path('/mnt/c/Users/me/.claude/skills')))
            self.assertFalse(installer.windows_host('auto', Path('/srv/agent/.claude/skills')))

    def test_rerun_preserves_bytes_and_mtimes(self):
        self.assertEqual(self.install().returncode, 0)
        paths = [self.bin/'work-item-delivery', self.skills/'work-item-delivery/SKILL.md',
                 self.skills/'work-item-delivery/vendor/work-item-runtime/config.json']
        before = [(p.read_bytes(), p.stat().st_mtime_ns) for p in paths]
        result = self.install()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['new_skills'], [])
        self.assertEqual([(p.read_bytes(), p.stat().st_mtime_ns) for p in paths], before)

    def test_existing_skill_conflict_prevents_every_new_install(self):
        existing = self.skills/'azure-pr-review'
        existing.mkdir(parents=True)
        (existing/'mine.txt').write_text('preserve my work')
        result = self.install()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Existing skill differs', result.stderr)
        self.assertEqual((existing/'mine.txt').read_text(), 'preserve my work')
        self.assertFalse((self.skills/'work-item-delivery').exists())
        self.assertFalse((self.bin/'work-item-delivery').exists())

    def test_existing_launcher_conflict_is_found_before_copy(self):
        self.bin.mkdir()
        path = self.bin/'work-item-delivery'
        path.write_text('my existing launcher')
        result = self.install()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(path.read_text(), 'my existing launcher')
        self.assertFalse(self.skills.exists())

    def test_symlink_skill_is_preserved_and_rejected(self):
        self.skills.mkdir()
        existing = self.root/'existing'
        existing.mkdir()
        (self.skills/'proof-of-work').symlink_to(existing, target_is_directory=True)
        self.assertNotEqual(self.install().returncode, 0)
        self.assertTrue((self.skills/'proof-of-work').is_symlink())
        self.assertFalse((self.skills/'work-item-delivery').exists())

    def test_dotenv_is_data_and_never_executed(self):
        marker = self.root/'must-not-exist'
        value = '$(touch '+str(marker)+')'
        self.settings.write_text("ADO_PROJECT='"+value+"'\n")
        result = self.install()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(marker.exists())
        config = json.loads((self.skills/'work-item-delivery/vendor/work-item-runtime/config.json').read_text())
        self.assertEqual(config['tracker']['project'], value)

    def test_changed_settings_do_not_replace_previous_install(self):
        self.assertEqual(self.install().returncode, 0)
        config = self.skills/'work-item-delivery/vendor/work-item-runtime/config.json'
        before = config.read_bytes()
        self.settings.write_text("ADO_PROJECT='Different Project'\n")
        self.assertNotEqual(self.install().returncode, 0)
        self.assertEqual(config.read_bytes(), before)

    def package_copy(self):
        copied = self.root/'package'
        shutil.copytree(ROOT/'skills', copied/'skills')
        shutil.copytree(ROOT/'scripts', copied/'scripts', ignore=shutil.ignore_patterns('__pycache__'))
        shutil.copytree(ROOT/'windows', copied/'windows')
        shutil.copytree(ROOT/'claude', copied/'claude')
        shutil.copy2(ROOT/'.gitignore', copied/'.gitignore')
        return copied

    def check_package(self, copied, *args):
        return subprocess.run(['python3', str(copied/'scripts/check-work-item-package.py'),
                               '--out', str(self.root/'check-output'), *args], capture_output=True, text=True)

    def test_changed_runtime_snapshot_is_rejected(self):
        copied = self.package_copy()
        file = copied/'skills/work-item-delivery/vendor/work-item-runtime/lib/delivery.mjs'
        file.write_text(file.read_text()+'\n// Deliberate drift probe\n')
        result = self.check_package(copied)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Export drift: lib/delivery.mjs', result.stderr)

    def test_private_pattern_list_can_stay_outside_package(self):
        copied = self.package_copy()
        file = copied/'skills/proof-of-work/SKILL.md'
        file.write_text(file.read_text()+'\nAUDIT_FIXTURE_PRIVATE_MARKER\n')
        patterns = self.root/'private-patterns.txt'
        patterns.write_text('AUDIT_FIXTURE_PRIVATE_MARKER\n')
        result = self.check_package(copied, '--privacy-pattern-file', str(patterns))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Private source marker in skills/proof-of-work/SKILL.md', result.stderr)

    def test_wizard_library_drift_is_rejected(self):
        copied = self.package_copy()
        wizard = copied/'scripts/setup-work-item-delivery.sh'
        wizard.write_text(wizard.read_text().replace('set -euo pipefail', 'set -euo pipefail # drift', 1))
        result = self.check_package(copied)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Wizard library changed', result.stderr)


if __name__ == '__main__':
    unittest.main()
