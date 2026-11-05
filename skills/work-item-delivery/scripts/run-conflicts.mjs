#!/usr/bin/env node
// The runtime keeps one writer per repository inside one run. This checks across runs, so two
// Work Items in parallel sessions never write the same checkout:
//   node run-conflicts.mjs --path CHECKOUT [--run OWN_RUN] [--runs RUN_A,RUN_B]
// Runs registered with claude-session-resume.mjs --set are checked too. Prints CLEAR, CONFLICT
// or UNKNOWN; exits 1 unless CLEAR.
import {readFileSync, realpathSync} from 'node:fs';
import {homedir} from 'node:os';
import {join, resolve} from 'node:path';

const REGISTRY = process.env.WORK_ITEM_RUN_REGISTRY || join(homedir(), '.claude/work-item-delivery/active-runs.json');

function option(name) {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : undefined;
}

const real = path => { try { return realpathSync(path); } catch { return resolve(path); } };

try {
  const target = option('--path');
  if (!target) throw new Error('--path CHECKOUT is required');
  const checkout = real(target);
  const own = option('--run') ? real(option('--run')) : null;
  let registered = [];
  try { registered = Object.values(JSON.parse(readFileSync(REGISTRY, 'utf8'))); } catch {}
  const runs = [...new Set([...registered, ...(option('--runs') ?? '').split(',').filter(Boolean)].map(real))].filter(run => run !== own);
  const conflicts = [], shared = [], unreadable = [];
  for (const run of runs) {
    let state;
    try { state = JSON.parse(readFileSync(join(run, 'delivery.json'), 'utf8')); } catch { unreadable.push(run); continue; }
    for (const [repo, record] of Object.entries(state.repos ?? {})) {
      if (!record?.path || real(record.path) !== checkout) continue;
      const writers = (state.plan?.units ?? []).filter(unit => unit.repo === repo && state.units?.[unit.id]?.state === 'active').map(unit => unit.id);
      if (writers.length) conflicts.push({run, repo, active_units: writers});
      else shared.push(run);
    }
  }
  // An unreadable run might hold the checkout, so it never counts as clear.
  const status = conflicts.length ? 'CONFLICT' : unreadable.length ? 'UNKNOWN' : 'CLEAR';
  console.log(JSON.stringify({status, checkout, conflicts, shared, unreadable}, null, 2));
  process.exitCode = status === 'CLEAR' ? 0 : 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
