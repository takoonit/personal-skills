#!/usr/bin/env python3
"""Validate the portable structure of every skill in this repository."""

from __future__ import annotations

import ast
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
README = ROOT / "README.md"
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"
INSTALLER = ROOT / "scripts" / "install-work-item-delivery.py"
EVALS = ROOT / "evals"
CASE_SKILL_PREFIX = "../../../skills/"
# Platform-specific skills, installed only on that platform by the workflow installer.
PLATFORM_SKILLS = ROOT / "windows" / "skills"
BOAT = "boat"
WORK_ITEM = "work-item"
NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def parse_frontmatter(path: Path) -> tuple[dict[str, str], list[str]]:
    errors: list[str] = []
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0] != "---":
        return {}, ["frontmatter must start on the first line"]

    try:
        end = lines.index("---", 1)
    except ValueError:
        return {}, ["frontmatter is missing its closing delimiter"]

    data: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip():
            continue
        if ":" not in line:
            errors.append(f"invalid frontmatter line: {line!r}")
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")

    return data, errors


def validate_skill(directory: Path) -> list[str]:
    errors: list[str] = []
    skill_file = directory / "SKILL.md"

    if not skill_file.is_file():
        return ["missing SKILL.md"]

    metadata, parse_errors = parse_frontmatter(skill_file)
    errors.extend(parse_errors)

    allowed = {"name", "description", "disable-model-invocation"}
    extra = sorted(set(metadata) - allowed)
    if extra:
        errors.append(f"unsupported frontmatter fields: {', '.join(extra)}")

    name = metadata.get("name", "")
    description = metadata.get("description", "")
    if not name:
        errors.append("missing frontmatter name")
    elif not NAME_PATTERN.fullmatch(name):
        errors.append("name must use lowercase letters, digits, and single hyphens")
    elif name != directory.name:
        errors.append(f"directory name must match skill name {name!r}")

    if not description:
        errors.append("missing frontmatter description")

    text = skill_file.read_text(encoding="utf-8")
    if "TODO" in text:
        errors.append("SKILL.md contains TODO text")

    return errors


def installer_skills() -> set[str]:
    """Read the setup wizard's SKILLS tuple without executing the installer."""
    tree = ast.parse(INSTALLER.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id == "SKILLS" for target in node.targets
        ):
            return set(ast.literal_eval(node.value))
    raise ValueError(f"{INSTALLER.name} defines no SKILLS tuple")


def validate_readme(names: list[str]) -> list[str]:
    text = README.read_text(encoding="utf-8")
    return [
        f"README: {name}: not listed under Included skills"
        for name in names
        if f"](skills/{name}/SKILL.md)" not in text
    ]


def marketplace_plugins() -> list[dict]:
    return json.loads(MARKETPLACE.read_text(encoding="utf-8")).get("plugins", [])


def plugin_skills(name: str = BOAT) -> list[str]:
    return [
        Path(entry).name
        for plugin in marketplace_plugins()
        if plugin.get("name") == name
        for entry in plugin.get("skills", [])
    ]


def case_plugins(prompt: Path) -> list[str]:
    """Return the skill names a case's prompt.md frontmatter lists under plugins."""
    lines = prompt.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0] != "---" or "---" not in lines[1:]:
        return []
    end = lines.index("---", 1)
    return [
        line.strip()[2:].removeprefix(CASE_SKILL_PREFIX)
        for line in lines[1:end]
        if line.strip().startswith("- " + CASE_SKILL_PREFIX)
    ]


def validate_evals() -> list[str]:
    """Each case must load exactly the plugin's skills, and each plugin skill needs a case."""
    if not EVALS.is_dir() or not MARKETPLACE.is_file():
        return []

    errors: list[str] = []
    expected = sorted(plugin_skills())
    covered: set[str] = set()
    for prompt in sorted(EVALS.glob("*/*/prompt.md")):
        group = prompt.parent.parent.name
        label = f"evals: {prompt.parent.relative_to(EVALS)}"
        lines = prompt.read_text(encoding="utf-8").splitlines()
        if not lines or lines[0] != "---" or "---" not in lines[1:]:
            errors.append(f"{label}: prompt.md frontmatter must open and close with ---")
            covered.add(group)
            continue
        if sorted(case_plugins(prompt)) != expected:
            errors.append(f"{label}: plugins list differs from the boat plugin's skills")
        if group not in expected:
            errors.append(f"{label}: group {group!r} is not a boat plugin skill")
        covered.add(group)
    errors += [f"evals: {name}: no eval case" for name in expected if name not in covered]
    return errors


def validate_plugin() -> list[str]:
    """Each repository skill ships in exactly one plugin; work-item ships exactly the wizard's set."""
    if not MARKETPLACE.is_file():
        return [f"plugin: missing {MARKETPLACE.relative_to(ROOT)}"]

    errors: list[str] = []
    owned_by_installer = installer_skills()
    shipped: dict[str, str] = {}
    for plugin in marketplace_plugins():
        name = plugin.get("name")
        for entry in plugin.get("skills", []):
            path = (ROOT / entry).resolve()
            label = f"plugin {name}: {entry}"
            if not (path / "SKILL.md").is_file():
                errors.append(f"{label}: no SKILL.md at this path")
            elif path.parent not in (SKILLS, PLATFORM_SKILLS):
                errors.append(f"{label}: must point at a skills/<name> directory")
            elif path.name in shipped:
                errors.append(f"{label}: already shipped by plugin {shipped[path.name]}")
            else:
                shipped[path.name] = name
                if name == BOAT and path.name in owned_by_installer:
                    errors.append(f"{label}: installed by the setup wizard, so it belongs in {WORK_ITEM}")
    work_item = set(plugin_skills(WORK_ITEM))
    errors += [f"plugin {WORK_ITEM}: missing wizard skill {skill}" for skill in sorted(owned_by_installer - work_item)]
    repository = {path.name for path in SKILLS.iterdir() if path.is_dir()}
    errors += [f"plugin: {skill}: shipped by no plugin" for skill in sorted(repository - set(shipped))]
    return errors


def main() -> int:
    if not SKILLS.is_dir():
        print("ERROR: missing skills directory")
        return 1

    directories = sorted(path for path in SKILLS.iterdir() if path.is_dir())
    if PLATFORM_SKILLS.is_dir():
        directories += sorted(path for path in PLATFORM_SKILLS.iterdir() if path.is_dir())
    if not directories:
        print("ERROR: no skills found")
        return 1

    failed = False
    for directory in directories:
        errors = validate_skill(directory)
        if errors:
            failed = True
            for error in errors:
                print(f"ERROR: {directory.name}: {error}")
        else:
            print(f"OK: {directory.name}")

    repository_errors = validate_readme(
        sorted(path.name for path in SKILLS.iterdir() if path.is_dir())
    ) + validate_plugin() + validate_evals()
    for error in repository_errors:
        failed = True
        print(f"ERROR: {error}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

