#!/usr/bin/env node
// Prove the code writer left the locked Red tests unchanged:
//   node red-lock.mjs --repo PATH --red RED_SHA --tests a.test.ts,b.test.ts [--head SHA]
// Prints {status: PASS|ISSUES, ...}; exits 1 on ISSUES or bad input.
import {execFileSync} from 'node:child_process';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  const value = index > 0 ? process.argv[index + 1] : fallback;
  if (value === undefined) throw new Error(`${name} is required`);
  return value;
}

const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();

try {
  const repo = option('--repo');
  const tests = option('--tests').split(',').map(path => path.trim()).filter(Boolean);
  if (!tests.length) throw new Error('--tests needs at least one path');
  const red = git(repo, 'rev-parse', '--verify', option('--red') + '^{commit}');
  const head = git(repo, 'rev-parse', '--verify', option('--head', 'HEAD') + '^{commit}');
  const issues = [];
  try { git(repo, 'merge-base', '--is-ancestor', red, head); } catch { issues.push(`Red commit ${red} is not an ancestor of ${head}`); }
  for (const path of tests) {
    try { git(repo, 'cat-file', '-e', `${red}:${path}`); } catch { issues.push(`${path} does not exist at the Red commit`); }
  }
  const changed = git(repo, 'diff', '--name-only', red, head, '--', ...tests).split('\n').filter(Boolean);
  for (const path of changed) issues.push(`${path} changed after the Red commit; the writer must not edit locked tests`);
  console.log(JSON.stringify({status: issues.length ? 'ISSUES' : 'PASS', repo, red, head, tests, issues}, null, 2));
  process.exitCode = issues.length ? 1 : 0;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
