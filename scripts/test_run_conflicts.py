import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT/'skills/work-item-delivery/scripts/run-conflicts.mjs'


class RunConflictTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='run-conflicts-')
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.checkout = self.root/'backend'
        self.checkout.mkdir()
        self.registry = self.root/'active-runs.json'

    def run_dir(self, name, path, states):
        run = self.root/name
        run.mkdir()
        units = {f'U{i}': {'state': state} for i, state in enumerate(states)}
        plan = {'units': [{'id': unit, 'repo': 'be'} for unit in units]}
        (run/'delivery.json').write_text(json.dumps({'repos': {'be': {'path': str(path)}}, 'units': units, 'plan': plan}))
        return run

    def check(self, *args):
        result = subprocess.run(['node', str(SCRIPT), '--path', str(self.checkout), *args], capture_output=True, text=True,
                                env={**os.environ, 'WORK_ITEM_RUN_REGISTRY': str(self.registry)})
        return result.returncode, json.loads(result.stdout) if result.stdout else result.stderr

    def test_another_runs_active_writer_in_the_same_checkout_is_a_conflict(self):
        other = self.run_dir('wi-200', self.checkout, ['active'])
        code, report = self.check('--runs', str(other))
        self.assertEqual((code, report['status']), (1, 'CONFLICT'))
        self.assertEqual(report['conflicts'][0]['run'], str(other))

    def test_own_run_and_finished_or_other_checkouts_are_clear(self):
        own = self.run_dir('wi-100', self.checkout, ['active'])
        finished = self.run_dir('wi-300', self.checkout, ['finished'])
        elsewhere = self.run_dir('wi-400', self.root/'other-worktree', ['active'])
        code, report = self.check('--run', str(own), '--runs', f'{own},{finished},{elsewhere}')
        self.assertEqual((code, report['status'], report['conflicts']), (0, 'CLEAR', []))
        self.assertEqual(report['shared'], [str(finished)])

    def test_symlinked_path_to_the_same_checkout_still_conflicts(self):
        link = self.root/'backend-link'
        link.symlink_to(self.checkout, target_is_directory=True)
        other = self.run_dir('wi-200', link, ['active'])
        code, report = self.check('--runs', str(other))
        self.assertEqual((code, report['status']), (1, 'CONFLICT'))

    def test_registered_runs_are_checked_without_listing_them(self):
        other = self.run_dir('wi-200', self.checkout, ['active'])
        self.registry.write_text(json.dumps({'/some/project': str(other)}))
        code, report = self.check()
        self.assertEqual((code, report['status']), (1, 'CONFLICT'))

    def test_unreadable_run_is_reported_not_treated_as_clear(self):
        code, report = self.check('--runs', str(self.root/'missing-run'))
        self.assertEqual((code, report['status']), (1, 'UNKNOWN'))
        self.assertTrue(report['unreadable'])


if __name__ == '__main__':
    unittest.main()
