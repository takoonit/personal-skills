# Set up the Work Item workflow

Clone this repository, then run the repeatable setup wizard from Linux or WSL Bash:

```sh
git clone https://github.com/takoonit/personal-skills.git
cd personal-skills
bash scripts/setup-work-item-delivery.sh
```

Until the publishing branch is merged, check out the branch named in the accompanying pull request before running setup. The wizard has five stages: choose host/install directories; enable prerequisites and handle native trust; connect work/specification sources; choose models/routing; install, run offline tests and reload the host. Its library comes from `mattpocock-skills:wizard` 1.3.1; only the stages are authored here, and CRLF line endings are normalized to LF for Bash.

Read [prerequisites](prerequisites.md) first. The wizard's captured values are:

| Value | Where it comes from | Destination | Sensitivity |
| --- | --- | --- | --- |
| `AGENT_HOST` | Your chosen Codex, Claude or Cursor host | Ignored `.work-item-setup.env` | Non-secret |
| `AGENT_SKILLS_DIR`, `WORK_ITEM_BIN_DIR` | Your selected absolute Linux/WSL directories | Same settings file; local installation destinations | Local private paths |
| `ADO_ORGANIZATION`, `ADO_PROJECT` | Organization/project segments of an accessible Work Item URL | Same settings file and installed runtime `config.json` | Non-secret organization metadata; keep local |
| `CONFLUENCE_SITE`, `KNOWLEDGE_VAULT` | Actual linked source URL or local knowledge-vault location; optional | Same settings file and installed runtime config | Local/private source metadata |
| `SESSION_ROUTING` | Your on/off choice, applied through setup-pstack in the host | Same settings file records intent; the host owns its real routing setting | Non-secret; not proof the hook ran |
| `WORK_ITEM_DELIVERY_ROOT` | Computed installed runtime path | Same settings file | Local private path |
| Model names/effort and connector credentials | Host-native setup and authentication | Host-owned configuration/credential store, never this repository | Credentials are secret and are never requested by this script |

The default settings file is gitignored. To store it elsewhere, set `WORK_ITEM_SETUP_ENV` to an absolute private path before running the wizard. Do not put tokens or passwords in it. The installer parses settings as data and never sources shell text.

For agent-capable installation without interactive stages:

```sh
python3 scripts/install-work-item-delivery.py \
  --skills-dir /absolute/path/to/agent/skills \
  --bin-dir /absolute/path/to/local/bin \
  --settings /absolute/private/setup.env
```

`--settings` is optional; without it, public placeholder discovery defaults remain. On a Windows host it also installs the native `wiki-query` and `think` replacements from `windows/skills/` (see [Windows and WSL](windows.md); override with `--windows-host yes|no`). The installer copies all seventeen owned skills, including the nine [chained phase skills](chain.md), renders only local discovery fields into the installed runtime, and writes a quoted executable launcher. It updates that local config's verification hash because discovery fields changed; it does not change the guarded runtime or branch-policy logic. Run the guard checker again before interpreting the installed snapshot's formal coverage.

Identical reruns preserve bytes and mtimes. Existing conflicting skills, symlinks or launchers are refused before copying; no automatic backup, replacement or cleanup occurs. To migrate an existing installation, inspect differences and retain the old install until a reviewed migration is chosen. A different source version or changed settings is intentionally a conflict, not an automatic upgrade.

Add the chosen bin directory to your shell PATH or invoke its `work-item-delivery` launcher by absolute path. In a new agent session, request `work-item-delivery` with a Work Item URL; it investigates and shows a developer plan before implementation. Use `proof-of-work` for repeatable human-verification journeys and evidence. The actual runtime is inside the installed `work-item-delivery/vendor/work-item-runtime`; derive `WORK_ITEM_DELIVERY_ROOT` from that location before using commands in its docs. Do not assume the setup environment file has been exported into the shell.

The runtime owns local state only. A real plan uses actual source snapshots and verified refs outside product source control. Setup does not initialize a delivery run, approve a plan, publish a PR, schedule unattended work or prove SIT/deployment. Missing connector, specification, browser or reviewer access remains an explicit case/stage gap.

Validate a source checkout with:

```sh
python3 scripts/validate_skills.py
python3 -m unittest discover -s scripts -p test_install_work_item_delivery.py -v
python3 scripts/check-work-item-package.py
```

The package check is static for the interactive wizard: it checks Bash syntax, five stages and the unchanged normalized library hash. It does not drive browsers, enter confirmations or authenticate on your behalf. The runtime tests use temporary Git repositories and synthetic approvals; those fixtures do not establish human consent or live Azure integration.
