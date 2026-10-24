#!/usr/bin/env python3
"""Render a reviewed investigation into a local to-spec draft and ADO preview; never publish."""
import argparse
import hashlib
import json
from pathlib import Path
import re

HEADINGS = ['Problem Statement', 'Solution', 'User Stories', 'Implementation Decisions',
            'Testing Decisions', 'Out of Scope', 'Further Notes']


def need(condition, message):
    if not condition:
        raise ValueError(message)


def words(value):
    return isinstance(value, str) and bool(value.strip())


def bullets(rows):
    need(isinstance(rows, list) and rows and all(words(row) for row in rows), 'Expected nonempty prose list')
    return '\n'.join('- ' + row for row in rows)


def digest(path):
    content = path.read_bytes()
    need(content, 'Empty input/evidence: ' + str(path))
    return hashlib.sha256(content).hexdigest()


def render(plan_path, brief_path, ticket_path):
    hashes = {key: digest(path) for key, path in [('plan', plan_path), ('brief', brief_path), ('ticket', ticket_path)]}
    plan, brief, ticket = [json.loads(path.read_text()) for path in [plan_path, brief_path, ticket_path]]
    need(plan.get('schema') in ('work-item-delivery.plan.v2', 'work-item-delivery.plan.v3'), 'Use a v2 or v3 investigation plan')
    need(str(ticket['id']) == plan['work_item']['id'], 'Work Item ID differs from plan')
    need(str(ticket['rev']) == str(plan['work_item']['revision']), 'Work Item revision differs; refresh and review')
    estimates = plan.get('estimates', {})
    active = estimates.get('remaining_active_ai_hours')
    need(isinstance(active, list) and len(active) == 2 and all(type(value) in [int, float] for value in active)
         and 0 < active[0] <= active[1], 'Missing/invalid active AI time range')
    need(all(words(estimates.get(key)) for key in ['basis', 'confidence', 'waits']),
         'Estimate needs its basis, confidence and separate waits')
    cases = plan['cases']
    case_ids = {case['id'] for case in cases}
    need(cases and len(case_ids) == len(cases), 'Missing or duplicate cases')
    need(all(words(case.get('expected')) for case in cases), 'Each case needs observable acceptance')
    sources = {source['id']: source for source in plan['sources']}
    need(len(sources) == len(plan['sources']), 'Duplicate source IDs')
    cited = set(brief['source_refs']) | {ref for case in cases for ref in case['source_refs']}
    need(cited, 'Citations are required')
    evidence = {}
    for ref in sorted(cited):
        need(ref in sources, 'Unknown source: ' + ref)
        source = sources[ref]
        need(source.get('status') == 'read', 'Unread source cannot support the spec: ' + ref)
        need(all(words(str(source.get(key, ''))) for key in ['url', 'section', 'revision']), 'Incomplete source: ' + ref)
        evidence[ref] = digest(Path(source['snapshot']))
    stories = brief['user_stories']
    need(isinstance(stories, list) and stories, 'User stories are required')
    covered = set()
    story_lines = []
    for index, story in enumerate(stories, 1):
        need(all(words(story.get(key)) for key in ['actor', 'want', 'benefit']), 'Incomplete user story')
        refs = story['case_ids']
        need(isinstance(refs, list) and refs and set(refs) <= case_ids, 'Story references missing/unknown cases')
        covered.update(refs)
        story_lines.append(f"{index}. As {story['actor']}, I want {story['want']}, so that {story['benefit']}. ({', '.join(refs)})")
    need(covered == case_ids, 'User stories omit cases: ' + ', '.join(sorted(case_ids - covered)))
    testing = brief['testing']
    need(words(testing['seam']), 'Propose one primary observable testing seam')
    need(set(testing['case_ids']) == case_ids, 'Testing seam must cover every case')
    decisions = bullets(brief['implementation_decisions'])
    need(not re.search(r'(?:\b(?:src|test|lib)/|[A-Za-z]:[\\/]|/home/|/mnt/|\b[\w-]+\.(?:ts|tsx|mjs|py)\b)', decisions),
         'Implementation Decisions must describe modules/contracts without file paths or snippets')
    need('```' not in decisions, 'Keep implementation decisions in prose')
    table = ['| Case | Observable acceptance |', '| --- | --- |']
    for case in cases:
        expected = ' '.join(case['expected'].split()).replace('|', '\\|')
        table.append(f"| {case['id']} | {expected} |")
    citations = []
    for ref in sorted(cited):
        source = sources[ref]
        label = (ref + ' (local evidence; not attached or accessible from ADO)'
                 if source['url'].startswith('local://') else f"[{ref}]({source['url']})")
        citations.append(f"- {label}: {source['section']}; revision {source['revision']}.")
    citations = '\n'.join(citations)
    need(words(brief['problem_statement']) and words(brief['solution']), 'Problem and solution are required')
    sections = [brief['problem_statement'], brief['solution'], '\n'.join(story_lines), decisions,
                testing['seam'] + '\n\n' + bullets(testing['decisions']) + '\n\n' + '\n'.join(table),
                bullets(brief['out_of_scope']), bullets(brief['further_notes']) + '\n\nSources:\n\n' + citations]
    spec = '\n\n'.join('## ' + heading + '\n\n' + body.strip() for heading, body in zip(HEADINGS, sections)) + '\n'
    old_tags = ticket['fields'].get('System.Tags', '')
    tags = [tag.strip() for tag in old_tags.split(';') if tag.strip()]
    if 'ready-for-agent' not in {tag.lower() for tag in tags}:
        tags.append('ready-for-agent')
    preview = {
        'status': 'draft-awaiting-seam-and-exact-publication-approval',
        'work_item': plan['work_item'], 'snapshot_only': True,
        'comment': {'format': 'markdown', 'text': spec},
        'field_changes': [{'field': 'System.Tags', 'before': old_tags, 'after': '; '.join(tags)}]
            if '; '.join(tags) != old_tags else [],
        'attachments': [], 'links': [],
        'unchanged': ['title', 'description', 'state', 'assignee', 'relations'],
        'implementation_authorized': False,
        'implementation_holds': plan['blockers'],
        'publication_requirements': ['User confirms the proposed testing seam and exact comment/tag content.',
                                     'Refresh live Work Item revision and tags before any write; changed preview needs renewed approval.',
                                     'The proposed ready-for-agent tag concerns the approved specification, not permission to bypass implementation holds.'],
        'estimates': plan.get('estimates', {}),
        'input_sha256': hashes, 'evidence_sha256': evidence,
    }
    return {'spec.md': spec.encode(), 'publication-preview.json': (json.dumps(preview, indent=2, ensure_ascii=False) + '\n').encode()}


def write_or_check(outputs, directory, check=False):
    for name, content in outputs.items():
        path = directory / name
        need(not path.is_symlink(), 'Refusing symlink output: ' + str(path))
        if path.exists():
            need(path.read_bytes() == content, 'Output differs: ' + str(path) + '; inspect or choose a new output directory')
        else:
            need(not check, 'Required output missing: ' + str(path))
    if not check:
        directory.mkdir(parents=True, exist_ok=True)
        for name, content in outputs.items():
            path = directory / name
            if not path.exists():
                with path.open('xb') as stream:
                    stream.write(content)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ['plan', 'brief', 'ticket', 'out']:
        parser.add_argument('--' + key, type=Path, required=True)
    parser.add_argument('--check', action='store_true', help='Compare all outputs and evidence with inputs; write nothing')
    args = parser.parse_args()
    try:
        outputs = render(args.plan, args.brief, args.ticket)
        plan = json.loads(args.plan.read_text())
        for repo in plan['repositories']:
            need(not args.out.resolve().is_relative_to(Path(repo['path']).resolve()), 'Keep generated artifacts outside product repositories')
        write_or_check(outputs, args.out, args.check)
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.exit(1, 'INCOMPLETE: ' + str(error) + '\n')
    print(('CHECKED' if args.check else 'DRAFTED') + ': spec.md and publication-preview.json; no tracker writes or implementation approval')


if __name__ == '__main__':
    main()
