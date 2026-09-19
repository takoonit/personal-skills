#!/usr/bin/env python3
"""Package contracts and validator regressions; no model execution."""
from __future__ import annotations

import importlib.util
import json
import re
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("validate_skills", ROOT / "scripts/validate_skills.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class ValidatorTests(unittest.TestCase):
    def setUp(self):
        scratch = ROOT / ".scratch"
        scratch.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=scratch)
        self.addCleanup(self.temp.cleanup)
        self.skill = Path(self.temp.name) / "sample"
        self.skill.mkdir()
        self.write("---\nname: sample\ndescription: Inspect a sample when a sample review is requested.\n---\n\n# Sample\n")

    def write(self, text):
        (self.skill / "SKILL.md").write_text(text, encoding="utf-8")

    def errors(self):
        return validator.validate_skill(self.skill)

    def test_minimal_package_needs_no_optional_metadata(self):
        self.assertEqual(self.errors(), [])

    def test_missing_entrypoint_is_rejected(self):
        (self.skill / "SKILL.md").unlink()
        self.assertTrue(self.errors())

    def test_directory_and_name_must_match(self):
        self.write("---\nname: other\ndescription: Inspect a sample.\n---\n")
        self.assertTrue(self.errors())

    def test_duplicate_frontmatter_keys_are_rejected(self):
        self.write("---\nname: sample\nname: other\ndescription: Inspect a sample.\n---\n")
        _, errors = validator.parse_frontmatter(self.skill / "SKILL.md")
        self.assertTrue(errors)

    def test_yaml_types_are_checked(self):
        self.write("---\nname: sample\ndescription: [inspect, sample]\n---\n")
        self.assertTrue(self.errors())

    def test_description_limit_is_enforced(self):
        self.write("---\nname: sample\ndescription: " + "x" * 1025 + "\n---\n")
        self.assertTrue(self.errors())

    def test_valid_multiline_and_optional_metadata(self):
        self.write("---\nname: sample\ndescription: >\n  Inspect a sample.\n  Use for sample review.\nmetadata:\n  version: '1.0'\n---\n")
        self.assertEqual(self.errors(), [])

    def test_broken_reference_is_rejected(self):
        with (self.skill / "SKILL.md").open("a", encoding="utf-8") as handle:
            handle.write("\nRead [details](references/missing.md).\n")
        self.assertTrue(self.errors())

    def test_valid_reference_is_accepted(self):
        (self.skill / "references").mkdir()
        (self.skill / "references/details.md").write_text("# Details\n", encoding="utf-8")
        with (self.skill / "SKILL.md").open("a", encoding="utf-8") as handle:
            handle.write("\nRead [details](references/details.md).\n")
        self.assertEqual(self.errors(), [])

    def test_nested_reference_is_checked_from_its_own_directory(self):
        (self.skill / "references").mkdir()
        (self.skill / "references/details.md").write_text("[bad](missing.md)", encoding="utf-8")
        self.assertTrue(self.errors())

    def test_package_reference_cannot_escape(self):
        (self.skill.parent / "outside.md").write_text("outside", encoding="utf-8")
        with (self.skill / "SKILL.md").open("a", encoding="utf-8") as handle:
            handle.write("\nRead [outside](../outside.md).\n")
        self.assertTrue(self.errors())

    def test_agent_policy_is_optional(self):
        (self.skill / "agents").mkdir()
        (self.skill / "agents/openai.yaml").write_text(
            "interface:\n  display_name: Sample\n  default_prompt: Use $sample to inspect this.\n",
            encoding="utf-8",
        )
        self.assertEqual(self.errors(), [])

    def test_stale_agent_prompt_is_rejected(self):
        (self.skill / "agents").mkdir()
        (self.skill / "agents/openai.yaml").write_text(
            "interface:\n  default_prompt: Use $old-name to inspect this.\n", encoding="utf-8",
        )
        self.assertTrue(self.errors())

    def test_policy_requires_boolean_when_present(self):
        (self.skill / "agents").mkdir()
        (self.skill / "agents/openai.yaml").write_text(
            "policy:\n  allow_implicit_invocation: 'false'\n", encoding="utf-8",
        )
        self.assertTrue(self.errors())


class RepositoryTests(unittest.TestCase):
    def test_all_packages_validate(self):
        directories = [p for p in (ROOT / "skills").iterdir() if p.is_dir()]
        self.assertTrue(directories)
        for directory in directories:
            with self.subTest(skill=directory.name):
                self.assertEqual(validator.validate_skill(directory), [])

    def test_readme_catalog_matches_packages(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        listed = set(re.findall(r"\]\(skills/([^/]+)/SKILL\.md\)", readme))
        actual = {p.parent.name for p in (ROOT / "skills").glob("*/SKILL.md")}
        self.assertEqual(listed, actual)

    def test_collection_scenarios_cover_every_skill(self):
        cases = json.loads((ROOT / "tests/skill_cases.json").read_text(encoding="utf-8"))["cases"]
        actual = {p.parent.name for p in (ROOT / "skills").glob("*/SKILL.md")}
        self.assertEqual({case["skill"] for case in cases}, actual)
        self.assertEqual(len({case["id"] for case in cases}), len(cases))
        for name in actual:
            selected = [case for case in cases if case["skill"] == name]
            self.assertGreaterEqual(len(selected), 3)
            self.assertTrue(any(case["should_trigger"] for case in selected))
            self.assertTrue(any(not case["should_trigger"] for case in selected))
        for case in cases:
            with self.subTest(case=case["id"]):
                self.assertIs(type(case["should_trigger"]), bool)
                for field in ("prompt", "context"):
                    self.assertIsInstance(case[field], str)
                    self.assertTrue(case[field].strip())
                for field in ("expected", "forbidden"):
                    self.assertIsInstance(case[field], list)
                    self.assertTrue(case[field])
                    self.assertTrue(all(isinstance(item, str) and item.strip() for item in case[field]))

    def test_existing_ux_cases_remain_valid(self):
        cases = yaml.safe_load((ROOT / "tests/laws_of_ux_eval_cases.yaml").read_text(encoding="utf-8"))["cases"]
        self.assertEqual(len({case["id"] for case in cases}), len(cases))
        actual = {p.parent.name for p in (ROOT / "skills").glob("*/SKILL.md")}
        for case in cases:
            with self.subTest(case=case["id"]):
                self.assertTrue(case["prompt"])
                self.assertIs(type(case["expect"]["trigger"]), bool)
                for key in ("owner", "route"):
                    if key in case["expect"]:
                        self.assertIn(case["expect"][key], actual)

    def test_dexter_migration_has_no_old_active_package(self):
        self.assertTrue((ROOT / "skills/dexter/SKILL.md").is_file())
        self.assertFalse((ROOT / "skills/dextor/SKILL.md").exists())
        for path in (ROOT / "skills").rglob("*"):
            if path.suffix in {".md", ".yaml"}:
                with self.subTest(path=path):
                    self.assertNotIn("dextor", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
