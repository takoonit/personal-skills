#!/usr/bin/env python3
"""Unit tests for content changed/added in this PR:

- README.md (skills table)
- skills/shape-system-work/SKILL.md and its agents/openai.yaml
- skills/ship-sound-code/SKILL.md and its agents/openai.yaml (new skill)

These tests treat the Markdown/YAML skill packages as data: they assert on
frontmatter, required structure, and cross-file consistency. They reuse the
repository's existing ``scripts/validate_skills.py`` helpers (unchanged by
this PR) purely as an assertion mechanism to confirm the *new* content is
well-formed, rather than testing that script's own logic.
"""

from __future__ import annotations

import importlib.util
import re
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"


def _load_validate_skills_module():
    spec = importlib.util.spec_from_file_location(
        "validate_skills", ROOT / "scripts" / "validate_skills.py"
    )
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


validate_skills = _load_validate_skills_module()


class ReadmeSkillsTableTests(unittest.TestCase):
    """Covers the README.md table changes in this PR."""

    def setUp(self):
        self.text = (ROOT / "README.md").read_text(encoding="utf-8")

    def test_shape_system_work_row_has_updated_purpose(self):
        self.assertIn(
            "| [`shape-system-work`](skills/shape-system-work/SKILL.md) | "
            "Decide system direction before coding and hand off a delivery brief. |",
            self.text,
        )

    def test_ship_sound_code_row_added(self):
        self.assertIn(
            "| [`ship-sound-code`](skills/ship-sound-code/SKILL.md) | "
            "Implement defined code changes with YAGNI, DX, UX, and verification gates. |",
            self.text,
        )

    def test_clear_tactful_writing_row_still_present(self):
        # Unrelated existing row must survive the edit untouched.
        self.assertIn(
            "| [`clear-tactful-writing`](skills/clear-tactful-writing/SKILL.md) | "
            "Draft direct, fact-grounded Thai and English messages with appropriate tact. |",
            self.text,
        )

    def test_old_shape_system_work_purpose_text_removed(self):
        self.assertNotIn(
            "Turn ambiguous product ideas into grounded architecture and "
            "risk-first delivery slices.",
            self.text,
        )

    def test_table_links_resolve_to_existing_files(self):
        links = re.findall(r"\]\((skills/[^)]+)\)", self.text)
        self.assertTrue(links, "expected at least one skills/ link in the README table")
        for link in links:
            with self.subTest(link=link):
                self.assertTrue((ROOT / link).is_file(), f"{link} should exist on disk")

    def test_table_lists_exactly_the_known_skills(self):
        for skill_name in ("shape-system-work", "clear-tactful-writing", "ship-sound-code"):
            with self.subTest(skill=skill_name):
                self.assertIn(f"skills/{skill_name}/SKILL.md", self.text)


class ShapeSystemWorkSkillMdTests(unittest.TestCase):
    """Covers the rewritten skills/shape-system-work/SKILL.md."""

    DIR = SKILLS / "shape-system-work"

    def setUp(self):
        self.path = self.DIR / "SKILL.md"
        self.text = self.path.read_text(encoding="utf-8")
        self.metadata, self.parse_errors = validate_skills.parse_frontmatter(self.path)

    def test_frontmatter_parses_without_errors(self):
        self.assertEqual(self.parse_errors, [])

    def test_frontmatter_name_matches_directory(self):
        self.assertEqual(self.metadata.get("name"), "shape-system-work")

    def test_full_skill_validation_reports_no_errors(self):
        self.assertEqual(validate_skills.validate_skill(self.DIR), [])

    def test_description_mentions_handoff_to_ship_sound_code(self):
        description = self.metadata.get("description", "")
        self.assertIn("ship-sound-code", description)
        self.assertIn("delivery brief", description)

    def test_description_states_when_not_to_use(self):
        description = self.metadata.get("description", "")
        self.assertIn(
            "Do not use for a defined change in an existing codebase", description
        )

    def test_body_contains_expected_section_headings(self):
        for heading in (
            "## Plan and route",
            "## Frame the real decision",
            "## Pressure-test the proposition",
            "## Choose a proportionate direction",
            "## Produce the delivery brief",
            "## Respond efficiently",
        ):
            with self.subTest(heading=heading):
                self.assertIn(heading, self.text)

    def test_old_numbered_workflow_headings_removed(self):
        for heading in (
            "## Workflow",
            "### 1. Frame the real decision",
            "### 6. Deliver a decision-ready plan",
            "## Quality gate",
        ):
            with self.subTest(heading=heading):
                self.assertNotIn(heading, self.text)

    def test_no_todo_markers(self):
        self.assertNotIn("TODO", self.text)

    def test_references_examples_file_and_it_exists(self):
        self.assertIn("references/examples.md", self.text)
        self.assertTrue((self.DIR / "references" / "examples.md").is_file())

    def test_uses_dollar_skill_reference_syntax_not_at_syntax(self):
        self.assertIn("`$ship-sound-code`", self.text)
        self.assertNotIn("@ship-sound-code", self.text)


class ShapeSystemWorkOpenAiYamlTests(unittest.TestCase):
    """Covers skills/shape-system-work/agents/openai.yaml."""

    def setUp(self):
        path = SKILLS / "shape-system-work" / "agents" / "openai.yaml"
        self.data = yaml.safe_load(path.read_text(encoding="utf-8"))

    def test_top_level_keys(self):
        self.assertEqual(set(self.data.keys()), {"interface", "policy"})

    def test_display_name_unchanged(self):
        self.assertEqual(self.data["interface"]["display_name"], "Shape System Work")

    def test_short_description_updated(self):
        self.assertEqual(
            self.data["interface"]["short_description"],
            "Decide system direction before coding",
        )

    def test_default_prompt_uses_dollar_syntax_for_both_skills(self):
        prompt = self.data["interface"]["default_prompt"]
        self.assertIn("$shape-system-work", prompt)
        self.assertIn("$ship-sound-code", prompt)
        self.assertNotIn("@shape-system-work", prompt)

    def test_policy_products(self):
        self.assertEqual(
            self.data["policy"]["products"], ["chatgpt", "codex", "api", "atlas"]
        )

    def test_allow_implicit_invocation_true(self):
        self.assertIs(self.data["policy"]["allow_implicit_invocation"], True)


class ShipSoundCodeSkillMdTests(unittest.TestCase):
    """Covers the new skills/ship-sound-code/SKILL.md."""

    DIR = SKILLS / "ship-sound-code"

    def setUp(self):
        self.path = self.DIR / "SKILL.md"
        self.text = self.path.read_text(encoding="utf-8")
        self.metadata, self.parse_errors = validate_skills.parse_frontmatter(self.path)

    def test_skill_file_exists(self):
        self.assertTrue(self.path.is_file())

    def test_frontmatter_parses_without_errors(self):
        self.assertEqual(self.parse_errors, [])

    def test_frontmatter_name_matches_directory(self):
        self.assertEqual(self.metadata.get("name"), "ship-sound-code")

    def test_full_skill_validation_reports_no_errors(self):
        self.assertEqual(validate_skills.validate_skill(self.DIR), [])

    def test_description_mentions_routing_back_to_shape_system_work(self):
        description = self.metadata.get("description", "")
        self.assertIn("shape-system-work", description)
        self.assertIn(
            "Do not use for unresolved product, MVP, or architecture direction",
            description,
        )

    def test_body_contains_expected_section_headings(self):
        for heading in (
            "## Accept the hand-off and plan",
            "## Orient in the repository",
            "## Decide locally with YAGNI",
            "## Consult before a material refactor",
            "## Protect UX, DX, and correctness",
            "## Verify and hand over",
        ):
            with self.subTest(heading=heading):
                self.assertIn(heading, self.text)

    def test_no_todo_markers(self):
        self.assertNotIn("TODO", self.text)

    def test_uses_dollar_skill_reference_syntax_not_at_syntax(self):
        self.assertIn("`$shape-system-work`", self.text)
        self.assertNotIn("@shape-system-work", self.text)

    def test_mentions_incident_containment_guidance(self):
        self.assertIn(
            "For active security, data-loss, or production incidents", self.text
        )

    def test_has_no_optional_subdirectories_that_do_not_exist(self):
        # references/ is optional per README layout; if referenced it must exist.
        for match in re.findall(r"\]\(((?:references|scripts|assets)/[^)]+)\)", self.text):
            with self.subTest(match=match):
                self.assertTrue((self.DIR / match).is_file())


class ShipSoundCodeOpenAiYamlTests(unittest.TestCase):
    """Covers the new skills/ship-sound-code/agents/openai.yaml."""

    def setUp(self):
        path = SKILLS / "ship-sound-code" / "agents" / "openai.yaml"
        self.data = yaml.safe_load(path.read_text(encoding="utf-8"))

    def test_top_level_keys(self):
        self.assertEqual(set(self.data.keys()), {"interface", "policy"})

    def test_display_name(self):
        self.assertEqual(self.data["interface"]["display_name"], "Ship Sound Code")

    def test_short_description(self):
        self.assertEqual(
            self.data["interface"]["short_description"],
            "Implement defined code changes safely",
        )

    def test_default_prompt_uses_dollar_syntax(self):
        prompt = self.data["interface"]["default_prompt"]
        self.assertIn("$ship-sound-code", prompt)

    def test_policy_products_match_shape_system_work_skill(self):
        shape_path = SKILLS / "shape-system-work" / "agents" / "openai.yaml"
        shape_data = yaml.safe_load(shape_path.read_text(encoding="utf-8"))
        self.assertEqual(
            self.data["policy"]["products"], shape_data["policy"]["products"]
        )

    def test_allow_implicit_invocation_true(self):
        self.assertIs(self.data["policy"]["allow_implicit_invocation"], True)


class CrossSkillConsistencyTests(unittest.TestCase):
    """Consistency checks spanning the two related, co-changed skills."""

    def test_skills_reference_each_other_by_name(self):
        shape_text = (SKILLS / "shape-system-work" / "SKILL.md").read_text(
            encoding="utf-8"
        )
        ship_text = (SKILLS / "ship-sound-code" / "SKILL.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("ship-sound-code", shape_text)
        self.assertIn("shape-system-work", ship_text)

    def test_readme_mentions_both_skills(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("shape-system-work", readme)
        self.assertIn("ship-sound-code", readme)

    def test_short_descriptions_are_distinct_and_non_empty(self):
        shape_yaml = yaml.safe_load(
            (SKILLS / "shape-system-work" / "agents" / "openai.yaml").read_text(
                encoding="utf-8"
            )
        )
        ship_yaml = yaml.safe_load(
            (SKILLS / "ship-sound-code" / "agents" / "openai.yaml").read_text(
                encoding="utf-8"
            )
        )
        shape_short = shape_yaml["interface"]["short_description"]
        ship_short = ship_yaml["interface"]["short_description"]
        self.assertTrue(shape_short)
        self.assertTrue(ship_short)
        self.assertNotEqual(shape_short, ship_short)

    def test_directory_names_match_frontmatter_names_for_both_new_skills(self):
        for skill_name in ("shape-system-work", "ship-sound-code"):
            with self.subTest(skill=skill_name):
                directory = SKILLS / skill_name
                metadata, errors = validate_skills.parse_frontmatter(
                    directory / "SKILL.md"
                )
                self.assertEqual(errors, [])
                self.assertEqual(metadata.get("name"), skill_name)
                self.assertEqual(directory.name, skill_name)


if __name__ == "__main__":
    unittest.main()