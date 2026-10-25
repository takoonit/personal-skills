import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT/'skills/work-item-delivery/scripts/red-lock.mjs'


class RedLockTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='red-lock-')
        self.addCleanup(temporary.cleanup)
        self.repo = Path(temporary.name)
        self.git('init', '-q', '-b', 'main')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.git('config', 'user.name', 'Fixture')
        self.commit({'src/app.js': 'export const total = () => 0;\n'}, 'baseline')
        self.red = self.commit({'test/app.test.js': 'assert total() === 3\n'}, 'test(red): total')

    def git(self, *args):
        return subprocess.run(['git', '-C', str(self.repo), *args], check=True, capture_output=True, text=True).stdout.strip()

    def commit(self, files, message):
        for name, text in files.items():
            (self.repo/name).parent.mkdir(parents=True, exist_ok=True)
            (self.repo/name).write_text(text)
        self.git('add', '.')
        self.git('commit', '-q', '-m', message)
        return self.git('rev-parse', 'HEAD')

    def check(self, *tests):
        result = subprocess.run(['node', str(SCRIPT), '--repo', str(self.repo), '--red', self.red,
                                 '--tests', ','.join(tests or ['test/app.test.js'])], capture_output=True, text=True)
        return result.returncode, (json.loads(result.stdout) if result.stdout else result.stderr)

    def test_green_commit_that_leaves_red_tests_alone_passes(self):
        self.commit({'src/app.js': 'export const total = () => 3;\n'}, 'fix: total')
        code, report = self.check()
        self.assertEqual((code, report['status'], report['issues']), (0, 'PASS', []))

    def test_writer_editing_a_locked_test_is_an_issue(self):
        self.commit({'src/app.js': 'export const total = () => 0;\n', 'test/app.test.js': 'assert total() === 0\n'}, 'fix: bless wrong value')
        code, report = self.check()
        self.assertEqual((code, report['status']), (1, 'ISSUES'))
        self.assertIn('test/app.test.js changed after the Red commit', report['issues'][0])

    def test_red_commit_off_the_branch_is_an_issue(self):
        self.git('checkout', '-q', '-b', 'other', 'HEAD~1')
        self.commit({'src/app.js': 'export const total = () => 3;\n'}, 'fix without red')
        code, report = self.check()
        self.assertEqual(code, 1)
        self.assertTrue(any('not an ancestor' in issue for issue in report['issues']))

    def test_locked_path_missing_at_red_is_an_issue(self):
        code, report = self.check('test/missing.test.js')
        self.assertEqual(code, 1)
        self.assertIn('does not exist at the Red commit', report['issues'][0])


if __name__ == '__main__':
    unittest.main()
