import importlib.util
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT/'skills/work-item-delivery/vendor/work-item-runtime'


def installer_skills():
    spec = importlib.util.spec_from_file_location('installer', ROOT/'scripts/install-work-item-delivery.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.SKILLS


class PhaseChainTests(unittest.TestCase):
    def test_every_routed_phase_has_a_card_and_a_chained_skill(self):
        source = (RUNTIME/'lib/workflow-context.mjs').read_text()
        routed = set(re.findall(r':\s*\["([a-z-]+)", "', source)) | {'approved-action'}
        cards = {path.stem for path in (RUNTIME/'docs/phases').glob('*.md')}
        self.assertTrue(routed <= cards, routed - cards)
        chain = (ROOT/'skills/work-item-delivery/references/chain.md').read_text()
        for phase in sorted(cards):
            skill = ROOT/'skills'/f'work-item-{phase}/SKILL.md'
            self.assertTrue(skill.is_file(), skill)
            text = skill.read_text()
            self.assertIn('../work-item-delivery/references/chain.md', text)
            self.assertIn(f'docs/phases/{phase}.md', text)
            self.assertIn(f'`work-item-{phase}`', chain)
            self.assertIn(f'work-item-{phase}', installer_skills())

    def test_chain_lists_no_phase_without_a_card(self):
        chain = (ROOT/'skills/work-item-delivery/references/chain.md').read_text()
        cards = {path.stem for path in (RUNTIME/'docs/phases').glob('*.md')}
        listed = set(re.findall(r'`docs/phases/([a-z-]+)\.md`', chain))
        self.assertEqual(listed, cards)


if __name__ == '__main__':
    unittest.main()
