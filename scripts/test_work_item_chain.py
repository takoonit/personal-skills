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
        for phase in sorted(cards):
            skill = ROOT/'skills'/f'work-item-{phase}/SKILL.md'
            self.assertTrue(skill.is_file(), skill)
            text = skill.read_text()
            self.assertIn('](../work-item-delivery/SKILL.md)', text)
            self.assertIn(f'docs/phases/{phase}.md', text)
            self.assertIn(f'work-item-{phase}', installer_skills())


def tokens(path):
    # Same estimate as the 5,000-token pre-commit hook: bytes / 4.
    return len(path.read_bytes()) // 4


ROUTERS = [ROOT/'skills/work-item-delivery/SKILL.md', RUNTIME/'.agents/skills/work-item-delivery/SKILL.md']
PHASES = sorted(path.stem for path in (RUNTIME/'docs/phases').glob('*.md'))


class BudgetTests(unittest.TestCase):
    def test_router_and_runtime_entry_stay_under_400_tokens(self):
        for path in ROUTERS:
            self.assertLessEqual(tokens(path), 400, path)

    def test_phase_skills_stay_under_1200_tokens(self):
        for phase in PHASES:
            path = ROOT/'skills'/f'work-item-{phase}/SKILL.md'
            self.assertLessEqual(tokens(path), 1200, path)

    def test_phase_cards_stay_under_300_tokens_and_name_their_skill(self):
        for phase in PHASES:
            path = RUNTIME/'docs/phases'/f'{phase}.md'
            self.assertLessEqual(tokens(path), 300, path)
            self.assertIn(f'`work-item-{phase}`', path.read_text())

    def test_each_phase_loads_at_most_2300_tokens_before_optional_references(self):
        for phase in PHASES:
            load = sum(map(tokens, ROUTERS)) + tokens(ROOT/'skills'/f'work-item-{phase}/SKILL.md') + tokens(RUNTIME/'docs/phases'/f'{phase}.md')
            self.assertLessEqual(load, 2300, phase)


class LinkTests(unittest.TestCase):
    def test_every_relative_markdown_link_resolves(self):
        roots = [ROOT/'skills'/name for name in installer_skills()] + [ROOT/'claude', ROOT/'README.md']
        files = [file for root in roots for file in ([root] if root.is_file() else root.rglob('*.md'))]
        missing = []
        for file in files:
            for target in re.findall(r'\]\(([^)#\s]+\.md)(?:#[^)]*)?\)', file.read_text()):
                if '://' not in target and not (file.parent/target).resolve().is_file():
                    missing.append(f'{file.relative_to(ROOT)} -> {target}')
        self.assertEqual(missing, [])


PLUGIN_SKILL = re.compile(r'\b((?:pstack|mattpocock-skills|claude-obsidian):[a-z0-9-]+)')
PREREQUISITES = ROOT/'skills/work-item-delivery/references/prerequisites.md'


class DependencyTests(unittest.TestCase):
    def test_declared_plugin_skills_match_the_ones_the_workflow_uses(self):
        files = [file for name in installer_skills() for file in (ROOT/'skills'/name).rglob('*.md')
                 if 'vendor/pstack' not in str(file) and file != PREREQUISITES and file.name != 'pstack-models.example.md']
        files += list((ROOT/'claude').rglob('*.md'))
        files += [RUNTIME/'lib/workflow-context.mjs', ROOT/'scripts/setup-work-item-delivery.sh']
        used = {name for file in files for name in PLUGIN_SKILL.findall(file.read_text())}
        text = PREREQUISITES.read_text()
        section = text.split('## Plugin skills', 1)[1].split('\n## ', 1)[0]
        declared = set(PLUGIN_SKILL.findall(section))
        self.assertEqual({'used but undeclared': sorted(used - declared), 'declared but unused': sorted(declared - used)},
                         {'used but undeclared': [], 'declared but unused': []})


if __name__ == '__main__':
    unittest.main()
