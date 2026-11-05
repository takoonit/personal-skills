import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
HOOK = ROOT/'skills/work-item-delivery/scripts/claude-session-resume.mjs'


class SessionResumeHookTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='claude-resume-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.project = self.root/'product repo'
        (self.project/'src').mkdir(parents=True)
        self.run_dir = self.root/'runs/WI 42'
        self.env = {**os.environ, 'WORK_ITEM_RUN_REGISTRY': str(self.root/'registry/active-runs.json')}
        self.env.pop('WORK_ITEM_RUN', None)
        self.env.pop('CLAUDE_PROJECT_DIR', None)

    def node(self, *args, stdin='', **env):
        return subprocess.run(['node', str(HOOK), *args], input=stdin, capture_output=True, text=True,
                              env={**self.env, **env})

    def hook(self, cwd, **env):
        return self.node(stdin=json.dumps({'cwd': str(cwd), 'source': 'compact', 'hook_event_name': 'SessionStart'}), **env)

    def test_unregistered_project_is_silent(self):
        result = self.hook(self.project)
        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, '', ''))

    def test_missing_run_directory_is_silent_and_not_created(self):
        self.assertEqual(self.node('--set', str(self.run_dir), '--project', str(self.project)).returncode, 0)
        result = self.hook(self.project)
        self.assertEqual((result.returncode, result.stdout), (0, ''))
        self.assertFalse(self.run_dir.exists())

    def test_registered_run_injects_resume_packet_from_a_subdirectory(self):
        self.run_dir.mkdir(parents=True)
        self.assertEqual(self.node('--set', str(self.run_dir), '--project', str(self.project)).returncode, 0)
        result = self.hook(self.project/'src')
        self.assertEqual(result.returncode, 0, result.stderr)
        output = json.loads(result.stdout)['hookSpecificOutput']
        self.assertEqual(output['hookEventName'], 'SessionStart')
        context = output['additionalContext']
        self.assertLess(len(context), 10000)
        self.assertIn(str(self.run_dir), context)
        self.assertIn('Session source: compact', context)
        self.assertIn('Routed phase skill: work-item-investigate.', context)
        packet = json.loads(context.split('\n\n', 1)[1])
        self.assertEqual(packet['schema'], 'work-item-delivery.context.v1')
        self.assertEqual(packet['action']['action'], 'intake')

    def test_clear_forgets_the_run(self):
        self.run_dir.mkdir(parents=True)
        self.node('--set', str(self.run_dir), '--project', str(self.project))
        self.assertEqual(self.node('--clear', '--project', str(self.project)).returncode, 0)
        self.assertEqual(self.hook(self.project).stdout, '')

    def test_environment_run_overrides_registry(self):
        self.run_dir.mkdir(parents=True)
        result = self.hook(self.project, WORK_ITEM_RUN=str(self.run_dir))
        self.assertIn(str(self.run_dir), json.loads(result.stdout)['hookSpecificOutput']['additionalContext'])

    def test_oversize_packet_keeps_hashes_and_names_dropped_keys(self):
        script = (f"import {{fit}} from {json.dumps(HOOK.as_uri())};"
                  "const packet={action:{action:'start-unit'},sources:'x'.repeat(5000),receipts:'y'.repeat(5000),"
                  "context_hash:'abc',resume:{hash:'abc'}};"
                  "process.stdout.write(fit(JSON.stringify(packet,null,2),'/run',9000));")
        result = subprocess.run(['node', '--input-type=module', '-e', script], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertLessEqual(len(result.stdout), 9000)
        kept = json.loads(result.stdout)
        self.assertEqual((kept['context_hash'], kept['resume']['hash']), ('abc', 'abc'))
        self.assertEqual(kept['action']['action'], 'start-unit')
        self.assertEqual(kept['omitted'], ['sources', 'receipts'])
        self.assertIn('resume --run /run', kept['full_packet'])

    def test_registry_command_without_project_fails_loudly(self):
        result = self.node('--set', str(self.run_dir))
        self.assertEqual(result.returncode, 1)
        self.assertIn('--project DIR is required', result.stderr)


if __name__ == '__main__':
    unittest.main()
