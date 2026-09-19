#!/usr/bin/env python3
"""Validate skill packages and local documentation links without running models."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

import yaml

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
LINK_PATTERN = re.compile(r'\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)')


class UniqueKeyLoader(yaml.SafeLoader):
    """Reject duplicate keys instead of silently replacing earlier instructions."""


def unique_mapping(loader, node, deep=False):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in mapping:
            raise yaml.constructor.ConstructorError(
                "while reading a mapping", node.start_mark,
                f"duplicate key: {key!r}", key_node.start_mark,
            )
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


UniqueKeyLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping,
)


def read_mapping(text: str) -> tuple[dict, list[str]]:
    try:
        data = yaml.load(text, Loader=UniqueKeyLoader)
    except (yaml.YAMLError, TypeError, ValueError) as error:
        return {}, [f"invalid YAML: {error}"]
    if not isinstance(data, dict):
        return {}, ["YAML must contain a mapping"]
    return data, []


def parse_frontmatter(path: Path) -> tuple[dict, list[str]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0] != "---":
        return {}, ["frontmatter must start on the first line"]
    try:
        end = lines.index("---", 1)
    except ValueError:
        return {}, ["frontmatter is missing its closing delimiter"]
    return read_mapping("\n".join(lines[1:end]))


def local_link_errors(path: Path, boundary: Path) -> list[str]:
    """Check inline Markdown link targets; external URLs and anchors are not fetched."""
    errors = []
    for match in LINK_PATTERN.finditer(path.read_text(encoding="utf-8")):
        raw = match.group(1) or match.group(2)
        try:
            url = urlsplit(raw)
        except ValueError:
            errors.append(f"{path.name}: invalid link {raw!r}")
            continue
        if url.scheme or url.netloc or not url.path:
            continue
        target = (path.parent / unquote(url.path)).resolve()
        if not target.is_relative_to(boundary.resolve()):
            errors.append(f"{path.name}: link escapes package: {raw}")
        elif not target.exists():
            errors.append(f"{path.name}: missing link target: {raw}")
    return errors


def agent_metadata_errors(directory: Path) -> list[str]:
    path = directory / "agents/openai.yaml"
    if not path.exists():
        return []
    data, errors = read_mapping(path.read_text(encoding="utf-8"))
    if errors:
        return [f"agents/openai.yaml: {error}" for error in errors]
    interface = data.get("interface", {})
    if not isinstance(interface, dict):
        errors.append("agents/openai.yaml: interface must be a mapping")
    else:
        for key in ("display_name", "short_description", "default_prompt"):
            if key in interface and (
                not isinstance(interface[key], str) or not interface[key].strip()
            ):
                errors.append(f"agents/openai.yaml: {key} must be a non-empty string")
        prompt = interface.get("default_prompt")
        if isinstance(prompt, str) and not re.search(
            rf"(?<!\w)[$@]{re.escape(directory.name)}(?![a-z0-9-])", prompt,
        ):
            errors.append("agents/openai.yaml: default_prompt must mention this skill by its canonical name")
    policy = data.get("policy", {})
    if not isinstance(policy, dict):
        errors.append("agents/openai.yaml: policy must be a mapping")
    elif "allow_implicit_invocation" in policy and type(policy["allow_implicit_invocation"]) is not bool:
        errors.append("agents/openai.yaml: allow_implicit_invocation must be a boolean")
    return errors


def validate_skill(directory: Path) -> list[str]:
    path = directory / "SKILL.md"
    if not path.is_file():
        return ["missing SKILL.md"]
    metadata, errors = parse_frontmatter(path)
    if errors:
        return errors

    allowed = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}
    extra = set(metadata) - allowed
    if extra:
        errors.append(f"unsupported frontmatter fields: {', '.join(sorted(map(str, extra)))}")

    name = metadata.get("name")
    if not isinstance(name, str) or not 1 <= len(name) <= 64 or not NAME_PATTERN.fullmatch(name):
        errors.append("name must be 1–64 lowercase letters, digits, and single hyphens")
    elif name != directory.name:
        errors.append(f"directory name must match skill name {name!r}")

    description = metadata.get("description")
    if not isinstance(description, str) or not description.strip() or len(description) > 1024:
        errors.append("description must be a non-empty string of at most 1024 characters")

    for key in ("license", "compatibility", "allowed-tools"):
        if key in metadata and (
            not isinstance(metadata[key], str) or not metadata[key].strip()
        ):
            errors.append(f"{key} must be a non-empty string")
    compatibility = metadata.get("compatibility")
    if isinstance(compatibility, str) and len(compatibility) > 500:
        errors.append("compatibility must be at most 500 characters")
    if "metadata" in metadata:
        values = metadata["metadata"]
        if not isinstance(values, dict) or not all(
            isinstance(key, str) and isinstance(value, str) for key, value in values.items()
        ):
            errors.append("metadata must map strings to strings")

    for document in directory.rglob("*.md"):
        errors.extend(local_link_errors(document, directory))
    errors.extend(agent_metadata_errors(directory))
    return errors


def main() -> int:
    if not SKILLS.is_dir():
        print("ERROR: missing skills directory")
        return 1
    directories = sorted(path for path in SKILLS.iterdir() if path.is_dir())
    if not directories:
        print("ERROR: no skills found")
        return 1

    failures = []
    for directory in directories:
        errors = validate_skill(directory)
        failures.extend(f"{directory.name}: {error}" for error in errors)
        if not errors:
            print(f"OK: {directory.name}")

    for document in [ROOT / "README.md", ROOT / "CONTRIBUTING.md", *sorted((ROOT / "docs").glob("*.md"))]:
        if document.is_file():
            failures.extend(local_link_errors(document, ROOT))
    for error in failures:
        print(f"ERROR: {error}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

