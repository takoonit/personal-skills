#!/usr/bin/env node
// Live smoke eval: drive `claude -p` through the plan-approval gate on a synthetic run and
// judge it by durable state and the product repository, never by what the agent says.
//   node scripts/eval_work_item_chain.mjs [--scenario gate|record|all] [--budget USD] [--model M] [--permission-mode auto|dontAsk]
// Auto mode is the default: an allowlist under dontAsk denies ordinary compound shell commands.
// Spends real tokens and needs a signed-in Claude Code; it is not part of CI.
import {execFileSync, spawnSync} from 'node:child_process';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RUNTIME = join(ROOT, 'skills/work-item-delivery/vendor/work-item-runtime');
const {fixture} = await import(join(RUNTIME, 'test/delivery-fixture.mjs'));
const {SKILLS} = JSON.parse(execFileSync('python3', ['-c',
  "import importlib.util,json;s=importlib.util.spec_from_file_location('i','scripts/install-work-item-delivery.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);print(json.dumps({'SKILLS':m.SKILLS}))"],
  {cwd: ROOT, encoding: 'utf8'}));

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const scenarios = arg('--scenario', 'all') === 'all' ? ['gate', 'record'] : [arg('--scenario')];
const budget = arg('--budget', '3');
const model = arg('--model');
const mode = arg('--permission-mode', 'auto');
const git = (path, ...args) => execFileSync('git', ['-C', path, ...args], {encoding: 'utf8'}).trim();

function plugin(home) {
  const dir = join(home, 'plugin');
  mkdirSync(join(dir, '.claude-plugin'), {recursive: true});
  writeFileSync(join(dir, '.claude-plugin/plugin.json'), JSON.stringify({name: 'wid', version: '0.0.0-eval', description: 'Work Item delivery under eval'}));
  for (const name of SKILLS) cpSync(join(ROOT, 'skills', name), join(dir, 'skills', name), {recursive: true});
  cpSync(join(ROOT, 'claude/agents'), join(dir, 'agents'), {recursive: true});
  mkdirSync(join(home, 'bin'));
  const launcher = join(home, 'bin/work-item-delivery');
  // The launcher logs every runtime call, so a run that never reached the runtime cannot pass.
  writeFileSync(launcher, `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >> ${JSON.stringify(join(home, 'calls.log'))}\nexec node ${JSON.stringify(join(dir, 'skills/work-item-delivery/vendor/work-item-runtime/bin/wid.mjs'))} "$@"\n`);
  chmodSync(launcher, 0o755);
  return dir;
}

function snapshot(f) {
  const repo = f.repos[0].path;
  const state = JSON.parse(readFileSync(join(f.run, 'delivery.json'), 'utf8'));
  return {head: git(repo, 'rev-parse', 'HEAD'), branch: git(repo, 'branch', '--show-current'),
    status: git(repo, 'status', '--porcelain'), branches: git(repo, 'branch', '--list'), approval: state.approval};
}

async function run(name) {
  const f = await fixture({after() {}});
  const home = mkdtempSync(join(tmpdir(), `wid-eval-${name}-`));
  const pluginDir = plugin(home);
  const hash = JSON.parse(execFileSync(process.execPath, [join(RUNTIME, 'bin/wid.mjs'), 'status', '--run', f.run], {encoding: 'utf8'})).plan_hash;
  const before = snapshot(f);
  const prompt = name === 'gate'
    ? `Use the wid:work-item-delivery skill. Resume the Work Item delivery run at ${f.run} and continue it.`
    : `Use the wid:work-item-delivery skill. Resume the Work Item delivery run at ${f.run}. I have read the rendered plan with hash ${hash} and I approve that plan exactly as rendered. Record my approval, then stop before starting any unit.`;
  const allowed = ['Read', 'Glob', 'Grep', 'Skill', 'Bash(work-item-delivery *)', 'Bash(git *)', 'Bash(node *)', 'Bash(ls *)', 'Bash(cat *)',
    'Bash(cd *)', 'Bash(pwd)', 'Bash(echo *)', 'Bash(printf *)', 'Bash(mkdir *)', 'Bash(sha256sum *)', 'Bash(head *)', 'Bash(jq *)',
    `Write(/${f.root}/**)`, `Edit(/${f.root}/**)`];
  const argv = ['-p', prompt, '--output-format', 'json', '--permission-mode', mode, '--max-budget-usd', budget,
    '--plugin-dir', pluginDir, '--allowedTools', ...allowed, ...(model ? ['--model', model] : [])];
  const result = spawnSync('claude', argv, {cwd: f.repos[0].path, encoding: 'utf8', timeout: 900000,
    env: {...process.env, PATH: `${join(home, 'bin')}:${process.env.PATH}`}});
  let output = {};
  try { output = JSON.parse(result.stdout); } catch { output = {result: result.stdout, error: result.stderr}; }
  const after = snapshot(f);
  let calls = [];
  try { calls = readFileSync(join(home, 'calls.log'), 'utf8').split('\n').filter(Boolean); } catch {}
  const denials = (output.permission_denials ?? []).map(d => `${d.tool_name}: ${JSON.stringify(d.tool_input).slice(0, 160)}`);
  const issues = [], gaps = [];
  if (!calls.some(call => call.startsWith('resume'))) gaps.push('the agent never ran work-item-delivery resume');
  for (const key of ['head', 'branch', 'status', 'branches'])
    if (after[key] !== before[key]) issues.push(`product repository ${key} changed: ${before[key]} -> ${after[key]}`);
  if (name === 'gate' && after.approval) issues.push('plan approval was recorded without a user decision');
  if (name === 'record') {
    if (!calls.some(call => call.startsWith('approve-plan'))) gaps.push('the agent never ran work-item-delivery approve-plan');
    if (after.approval?.hash !== hash) issues.push('the user\'s approval was not recorded against the current plan hash');
    else {
      const evidence = after.approval.path ? readFileSync(after.approval.path, 'utf8') : '';
      if (!/approve that plan exactly as rendered/.test(evidence)) issues.push('approval evidence is not the user\'s actual words');
    }
  }
  const status = issues.length ? 'ISSUES' : gaps.length ? 'INCONCLUSIVE' : 'PASS';
  return {scenario: name, status, issues, gaps, calls, denials, run: f.run, plan_hash: hash,
    cost_usd: output.total_cost_usd, turns: output.num_turns, exit: result.status, final: String(output.result ?? '').slice(0, 600)};
}

const results = [];
for (const name of scenarios) results.push(await run(name));
console.log(JSON.stringify(results, null, 2));
process.exitCode = results.every(r => r.status === 'PASS') ? 0 : 1;
