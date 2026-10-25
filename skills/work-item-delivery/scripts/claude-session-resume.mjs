#!/usr/bin/env node
// Claude Code SessionStart hook: inject the registered run's `resume` packet.
// Register a run:  node claude-session-resume.mjs --set RUN --project DIR
// Forget it:       node claude-session-resume.mjs --clear --project DIR
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const CLI = fileURLToPath(new URL('../vendor/work-item-runtime/bin/wid.mjs', import.meta.url));
const REGISTRY = process.env.WORK_ITEM_RUN_REGISTRY || join(homedir(), '.claude/work-item-delivery/active-runs.json');
// Hook context is capped at 10,000 characters; keep headroom for the framing text.
const LIMIT = 9000;

function readRegistry() {
  try { return JSON.parse(readFileSync(REGISTRY, 'utf8')); } catch { return {}; }
}

function option(name) {
  const index = process.argv.indexOf(name);
  const value = index > 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${name} DIR is required`);
  return resolve(value);
}

function update(change) {
  const runs = readRegistry();
  change(runs);
  mkdirSync(dirname(REGISTRY), {recursive: true});
  writeFileSync(REGISTRY + '.tmp', JSON.stringify(runs, null, 2) + '\n');
  renameSync(REGISTRY + '.tmp', REGISTRY);
}

// The registered run for this directory or its nearest registered ancestor.
function lookup(directory) {
  const runs = readRegistry();
  for (let current = resolve(directory); ; current = dirname(current)) {
    if (runs[current]) return [current, runs[current]];
    if (dirname(current) === current) return [];
  }
}

function hook() {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}
  const project = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const [owner, registered] = process.env.WORK_ITEM_RUN ? [project, process.env.WORK_ITEM_RUN] : lookup(project);
  // `resume` creates a missing run directory, so only an existing one is read.
  if (!registered || !existsSync(registered)) return;
  let packet;
  try {
    packet = execFileSync(process.execPath, [CLI, 'resume', '--run', registered], {encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore']});
  } catch { return; }
  if (packet.length > LIMIT) packet = packet.slice(0, LIMIT) + `\n[truncated; full packet: work-item-delivery resume --run ${registered}]`;
  const context = `Work Item delivery run ${registered} is registered for ${owner}. ` +
    `Session source: ${input.source || 'unknown'}. Its durable resume packet at session start follows; ` +
    `the phase card, corrections and owners in it are current as of this read.\n\n${packet}`;
  process.stdout.write(JSON.stringify({hookSpecificOutput: {hookEventName: 'SessionStart', additionalContext: context}}));
}

try {
  if (process.argv.includes('--set')) {
    const run = option('--set'), project = option('--project');
    update(runs => { runs[project] = run; });
  } else if (process.argv.includes('--clear')) {
    const project = option('--project');
    update(runs => { delete runs[project]; });
  } else {
    hook();
  }
} catch (error) {
  // A hook must never block or pollute an unrelated session; registry commands report errors.
  if (process.argv.includes('--set') || process.argv.includes('--clear')) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}
