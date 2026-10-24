import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

module = importlib.util.spec_from_file_location('draft_spec', Path(__file__).parents[1] / 'scripts/draft_spec.py')
draft = importlib.util.module_from_spec(module)
module.loader.exec_module(draft)


class SpecDraftTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.evidence = self.root / 'evidence.txt'
        self.evidence.write_text('Read source, not fixture approval')
        self.plan = {'schema': 'work-item-delivery.plan.v2',
                     'work_item': {'id': '1', 'revision': '2', 'type': 'Task', 'url': 'https://example.invalid/1'},
                     'cases': [{'id': 'C1', 'expected': 'First behavior', 'source_refs': ['ticket']},
                               {'id': 'C2', 'expected': 'Different behavior', 'source_refs': ['ticket']}],
                     'sources': [{'id': 'ticket', 'status': 'read', 'url': 'https://example.invalid/1',
                                  'revision': '2', 'section': 'Acceptance', 'snapshot': str(self.evidence)}],
                     'blockers': [{'id': 'missing-access'}], 'repositories': [{'path': str(self.root / 'product')}],
                     'estimates': {'remaining_active_ai_hours': [1, 2], 'basis': 'Two small fixture cases',
                                   'confidence': 'low', 'waits': 'Access wait is unknown'}}
        self.brief = {'problem_statement': 'Two observable problems.', 'solution': 'Preserve the public contract.',
                      'user_stories': [{'actor': 'a user', 'want': 'the first behavior', 'benefit': 'one outcome', 'case_ids': ['C1']},
                                       {'actor': 'an operator', 'want': 'the other behavior', 'benefit': 'another outcome', 'case_ids': ['C2']}],
                      'implementation_decisions': ['Reuse the existing module.'],
                      'testing': {'seam': 'The public operation boundary.', 'case_ids': ['C1', 'C2'],
                                  'decisions': ['Observe returned results and emitted diagnostics.']},
                      'out_of_scope': ['Deployment.'], 'further_notes': ['This is a synthetic test fixture.'],
                      'source_refs': ['ticket']}
        self.ticket = {'id': 1, 'rev': 2, 'fields': {'System.Tags': 'team; existing'}}

    def render(self):
        paths = [self.root / name for name in ['plan.json', 'brief.json', 'ticket.json']]
        for path, value in zip(paths, [self.plan, self.brief, self.ticket]):
            path.write_text(json.dumps(value))
        return draft.render(*paths)

    def test_comment_and_tag_preview_preserves_scope_and_no_consent(self):
        outputs = self.render()
        preview = json.loads(outputs['publication-preview.json'])
        self.assertEqual(preview['comment']['text'], outputs['spec.md'].decode())
        self.assertEqual(preview['field_changes'], [{'field': 'System.Tags', 'before': 'team; existing', 'after': 'team; existing; ready-for-agent'}])
        self.assertFalse(preview['implementation_authorized'])
        self.assertEqual(preview['implementation_holds'], self.plan['blockers'])
        self.assertEqual(preview['attachments'], [])
        self.assertEqual(preview['links'], [])

    def test_v3_dossier_plan_renders_without_inventing_implementation_approval(self):
        self.plan['schema'] = 'work-item-delivery.plan.v3'
        self.plan['admission'] = {'dossier': {'sha256': '0' * 64, 'bytes': 1}}
        outputs = self.render()
        preview = json.loads(outputs['publication-preview.json'])
        self.assertFalse(preview['implementation_authorized'])
        self.assertEqual(preview['implementation_holds'], self.plan['blockers'])
        self.assertIn(b'First behavior', outputs['spec.md'])

    def test_idempotence_and_every_output_mutation_is_detected(self):
        outputs = self.render()
        directory = self.root / 'output'
        draft.write_or_check(outputs, directory)
        before = {file: (directory / file).stat().st_mtime_ns for file in outputs}
        draft.write_or_check(self.render(), directory)
        self.assertEqual(before, {file: (directory / file).stat().st_mtime_ns for file in outputs})
        for file in outputs:
            with self.subTest(output=file):
                (directory / file).write_bytes(b'changed')
                with self.assertRaisesRegex(ValueError, 'Output differs'):
                    draft.write_or_check(outputs, directory, check=True)
                (directory / file).write_bytes(outputs[file])

    def test_swapped_case_assignments_with_equal_counts_are_detected(self):
        outputs = self.render()
        directory = self.root / 'output'
        draft.write_or_check(outputs, directory)
        self.brief['user_stories'][0]['case_ids'], self.brief['user_stories'][1]['case_ids'] = ['C2'], ['C1']
        with self.assertRaisesRegex(ValueError, 'Output differs'):
            draft.write_or_check(self.render(), directory, check=True)

    def test_source_byte_drift_is_detected(self):
        outputs = self.render()
        directory = self.root / 'output'
        draft.write_or_check(outputs, directory)
        self.evidence.write_text('Changed source with unchanged locator')
        with self.assertRaisesRegex(ValueError, 'Output differs'):
            draft.write_or_check(self.render(), directory, check=True)

    def test_local_evidence_is_labelled_without_an_unusable_tracker_link(self):
        self.plan['sources'][0]['url'] = 'local://example/probe'
        outputs = self.render()
        text = outputs['spec.md'].decode()
        self.assertIn('local evidence; not attached or accessible from ADO', text)
        self.assertNotIn('](local://', text)
        self.assertEqual(json.loads(outputs['publication-preview.json'])['attachments'], [])

    def test_missing_and_empty_evidence_refuse(self):
        self.evidence.unlink()
        with self.assertRaises(FileNotFoundError):
            self.render()
        self.evidence.write_text('')
        with self.assertRaisesRegex(ValueError, 'Empty input/evidence'):
            self.render()

    def test_missing_or_unknown_case_coverage_refuses(self):
        baseline = copy.deepcopy(self.brief)
        for case_ids in [[], ['C99'], ['C1']]:
            with self.subTest(story_cases=case_ids):
                self.brief = copy.deepcopy(baseline)
                self.brief['user_stories'][1]['case_ids'] = case_ids
                with self.assertRaises(ValueError):
                    self.render()
        self.brief = baseline
        self.brief['testing']['case_ids'] = ['C1']
        with self.assertRaisesRegex(ValueError, 'every case'):
            self.render()

    def test_revision_mismatch_unread_source_and_missing_estimate_refuse(self):
        self.ticket['rev'] = 3
        with self.assertRaisesRegex(ValueError, 'revision differs'):
            self.render()
        self.ticket['rev'] = 2
        self.plan['sources'][0]['status'] = 'unavailable'
        with self.assertRaisesRegex(ValueError, 'Unread source'):
            self.render()
        self.plan['sources'][0]['status'] = 'read'
        del self.plan['estimates']
        with self.assertRaisesRegex(ValueError, 'time range'):
            self.render()

    def test_no_paths_in_implementation_decisions_and_no_duplicate_tag(self):
        self.brief['implementation_decisions'] = ['Change src/example.ts.']
        with self.assertRaisesRegex(ValueError, 'without file paths'):
            self.render()
        self.brief['implementation_decisions'] = ['Reuse existing boundaries.']
        self.ticket['fields']['System.Tags'] = 'team; READY-FOR-AGENT'
        self.assertEqual(json.loads(self.render()['publication-preview.json'])['field_changes'], [])

    def test_absent_or_symlink_output_refuses_check(self):
        outputs = self.render()
        directory = self.root / 'output'
        with self.assertRaisesRegex(ValueError, 'Required output missing'):
            draft.write_or_check(outputs, directory, check=True)
        directory.mkdir()
        (directory / 'spec.md').symlink_to(self.evidence)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            draft.write_or_check(outputs, directory)
        self.assertEqual(self.evidence.read_text(), 'Read source, not fixture approval')

    def test_cli_refuses_product_output_and_missing_required_input(self):
        self.render()
        command = [sys.executable, str(Path(draft.__file__)),
                   '--plan', str(self.root / 'plan.json'), '--brief', str(self.root / 'brief.json'),
                   '--ticket', str(self.root / 'ticket.json'), '--out', str(self.root / 'product' / 'draft')]
        result = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('outside product repositories', result.stderr)
        self.assertFalse((self.root / 'product').exists())
        (self.root / 'brief.json').unlink()
        result = subprocess.run(command, capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('INCOMPLETE', result.stderr)
        self.assertFalse((self.root / 'product').exists())


if __name__ == '__main__':
    unittest.main()
