// Derived from cursor/plugins pstack, Copyright (c) 2026 Lauren Tan. MIT; see LICENSE.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdir, open, readFile, readdir, rename, rm, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
const UNIT_HEADER = "id\ttrack\tstate\tbranch\tpr\tsha\tbrief";
const LEDGER_HEADER = "pr\tsha\tverdict\tevidence\tverifier\tts";
const LOCK_FILE = ".orch.lock";
export class UserError extends Error {
}
export class UsageError extends UserError {
}
export class NotFoundError extends UserError {
    output;
    constructor(message, output){
        super(message), this.output = output;
    }
}
function errorCode(error) {
    if (error !== null && typeof error === "object" && "code" in error && typeof error.code === "string") {
        return error.code;
    }
    return null;
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isUnknownArray(value) {
    return Array.isArray(value);
}
function verdictOrNull(value) {
    switch(value){
        case "live-ui-verified":
        case "unit-test-verified":
        case "type-check-only":
        case "verifier-blocked":
        case "verifier-failed":
            return value;
        default:
            return null;
    }
}
function frontierPrStateOrNull(value) {
    switch(value){
        case "OPEN":
        case "MERGED":
        case "CLOSED":
            return value;
        default:
            return null;
    }
}
export function parseVerdict(value) {
    const verdict = verdictOrNull(value);
    if (verdict === null) {
        throw new UserError("verdict must be live-ui-verified, unit-test-verified, type-check-only, verifier-blocked, or verifier-failed");
    }
    return verdict;
}
function cleanCell(value) {
    const cleaned = value.replace(/[\t\n\r]/g, " ");
    return /^[=+\-@]/.test(cleaned) ? `'${cleaned}` : cleaned;
}
function requiredCell(value, label) {
    const cleaned = cleanCell(value);
    if (cleaned.trim().length === 0) {
        throw new UserError(`${label} must not be empty`);
    }
    return cleaned;
}
function requiredLine(value, label) {
    const cleaned = value.replace(/[\n\r]/g, " ").trim();
    if (cleaned.length === 0) {
        throw new UserError(`${label} must not be empty`);
    }
    return cleaned;
}
function positiveInteger(value, label) {
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new UserError(`${label} must be a positive integer`);
    }
    return value;
}
async function exists(path) {
    try {
        await access(path);
        return true;
    } catch (error) {
        if (errorCode(error) === "ENOENT") {
            return false;
        }
        throw error;
    }
}
async function atomicWrite(path, contents) {
    const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);
    try {
        await writeFile(temporary, contents, {
            flag: "wx"
        });
        await rename(temporary, path);
    } finally{
        await rm(temporary, {
            force: true
        });
    }
}
async function writeIfMissing(path, contents) {
    if (!await exists(path)) {
        await atomicWrite(path, contents);
    }
}
async function requiredFile(path) {
    try {
        return await readFile(path, "utf8");
    } catch (error) {
        if (errorCode(error) === "ENOENT") {
            throw new UserError(`store is not initialized at ${dirname(path)}; run orch init`);
        }
        throw error;
    }
}
function holderIsDead(holder) {
    const pid = Number.parseInt(holder, 10);
    if (!Number.isSafeInteger(pid) || pid <= 0 || String(pid) !== holder) {
        return false;
    }
    try {
        process.kill(pid, 0);
        return false;
    } catch (error) {
        return errorCode(error) === "ESRCH";
    }
}
async function acquireLock(store, options) {
    const path = join(store, LOCK_FILE);
    const pid = String(process.pid);
    const create = async ()=>{
        const handle = await open(path, "wx");
        await handle.writeFile(`${pid}\n`);
        await handle.close();
    };
    const takeOver = async ()=>{
        await unlink(path);
        try {
            await create();
        } catch (retryError) {
            if (errorCode(retryError) === "EEXIST") {
                const retryHolder = (await readFile(path, "utf8")).trim() || "unknown";
                throw new UserError(`store lock held by pid ${retryHolder}`);
            }
            throw retryError;
        }
    };
    try {
        await create();
    } catch (error) {
        if (errorCode(error) !== "EEXIST") {
            throw error;
        }
        let holder = "unknown";
        try {
            holder = (await readFile(path, "utf8")).trim() || "unknown";
        } catch  {
            holder = "unknown";
        }
        if (holderIsDead(holder)) {
            options.onStaleLock?.(holder);
            await takeOver();
        } else if (options.force) {
            options.onLockStolen?.(holder);
            await takeOver();
        } else {
            throw new UserError(`store lock held by pid ${holder}`);
        }
    }
    return async ()=>{
        try {
            if ((await readFile(path, "utf8")).trim() === pid) {
                await unlink(path);
            }
        } catch (error) {
            if (errorCode(error) !== "ENOENT") {
                throw error;
            }
        }
    };
}
async function readTsv(path, header, width) {
    const lines = (await requiredFile(path)).replace(/\r/g, "").split("\n");
    if (lines.shift() !== header) {
        throw new UserError(`${basename(path)} has an invalid header`);
    }
    return lines.filter((value)=>value.length > 0).map((value)=>{
        const cells = value.split("\t");
        if (cells.length !== width) {
            throw new UserError(`${basename(path)} has a malformed row`);
        }
        return cells;
    });
}
async function writeTsv(path, header, rows) {
    const body = rows.map((row)=>row.map(cleanCell).join("\t")).join("\n");
    await atomicWrite(path, `${header}\n${body}${body.length > 0 ? "\n" : ""}`);
}
async function readUnits(store) {
    return (await readTsv(join(store, "units.tsv"), UNIT_HEADER, 7)).map((row)=>({
            id: row[0] ?? "",
            track: row[1] ?? "",
            state: row[2] ?? "",
            branch: row[3] ?? "",
            pr: row[4] ?? "",
            sha: row[5] ?? "",
            brief: row[6] ?? ""
        }));
}
function unitCells(unit) {
    return [
        unit.id,
        unit.track,
        unit.state,
        unit.branch,
        unit.pr,
        unit.sha,
        unit.brief
    ];
}
async function saveUnits(store, rows) {
    await writeTsv(join(store, "units.tsv"), UNIT_HEADER, rows.map(unitCells));
}
async function readLedger(store) {
    return (await readTsv(join(store, "ledger.tsv"), LEDGER_HEADER, 6)).map((row)=>{
        const rawVerdict = row[2] ?? "";
        const verdict = verdictOrNull(rawVerdict);
        if (verdict === null) {
            throw new UserError(`ledger.tsv has invalid verdict ${rawVerdict}`);
        }
        return {
            pr: row[0] ?? "",
            sha: row[1] ?? "",
            verdict,
            evidence: row[3] ?? "",
            verifier: row[4] ?? "",
            ts: row[5] ?? ""
        };
    });
}
function ledgerCells(row) {
    return [
        row.pr,
        row.sha,
        row.verdict,
        row.evidence,
        row.verifier,
        row.ts
    ];
}
async function saveLedger(store, rows) {
    await writeTsv(join(store, "ledger.tsv"), LEDGER_HEADER, rows.map(ledgerCells));
}
function pointerCells(pointer) {
    return [
        pointer.ts,
        pointer.agent,
        pointer.unit,
        pointer.status,
        pointer.report
    ];
}
async function readPointers(directory) {
    let entries;
    try {
        entries = await readdir(directory, {
            withFileTypes: true
        });
    } catch (error) {
        if (errorCode(error) === "ENOENT") {
            throw new UserError(`store is not initialized at ${dirname(directory)}; run orch init`);
        }
        throw error;
    }
    const result = [];
    const files = entries.filter((entry)=>entry.isFile() && entry.name.endsWith(".tsv")).sort((left, right)=>left.name.localeCompare(right.name));
    for (const entry of files){
        const raw = (await readFile(join(directory, entry.name), "utf8")).replace(/\r?\n$/, "");
        const row = raw.split("\t");
        if (/[\r\n]/.test(raw) || row.length !== 5) {
            throw new UserError(`inbox pointer ${entry.name} is malformed`);
        }
        result.push({
            ts: row[0] ?? "",
            agent: row[1] ?? "",
            unit: row[2] ?? "",
            status: row[3] ?? "",
            report: row[4] ?? ""
        });
    }
    return result;
}
function renderGates(rows) {
    if (rows.length === 0) {
        return "";
    }
    const blocks = rows.map((gate)=>{
        const answer = gate.kind === "resolved" ? `\n- Answer: ${gate.answer}` : "";
        return `## ${gate.id}

- Status: ${gate.kind}
- Question: ${gate.question}
- Options: ${gate.options}
- Default: ${gate.defaultAnswer}${answer}`;
    });
    return `# Gates\n\n${blocks.join("\n\n")}\n`;
}
async function readGates(store) {
    const raw = (await requiredFile(join(store, "gates.md"))).replace(/\r/g, "").trim();
    if (raw.length === 0) {
        return [];
    }
    const prefix = "# Gates\n\n## ";
    if (!raw.startsWith(prefix)) {
        throw new UserError("gates.md has an invalid heading");
    }
    const result = [];
    for (const block of raw.slice(prefix.length).split("\n\n## ")){
        const lines = block.split("\n").filter((value)=>value.length > 0);
        const id = lines.shift() ?? "";
        const fields = new Map();
        for (const value of lines){
            const match = /^- ([^:]+): (.*)$/.exec(value);
            if (match === null) {
                throw new UserError(`gates.md has a malformed gate ${id}`);
            }
            fields.set(match[1] ?? "", match[2] ?? "");
        }
        const status = fields.get("Status");
        const question = fields.get("Question");
        const options = fields.get("Options");
        const defaultAnswer = fields.get("Default");
        if (id.length === 0 || question === undefined || options === undefined || defaultAnswer === undefined) {
            throw new UserError(`gates.md has a malformed gate ${id}`);
        }
        if (status === "open") {
            result.push({
                kind: "open",
                id,
                question,
                options,
                defaultAnswer
            });
        } else if (status === "resolved" && fields.has("Answer")) {
            result.push({
                kind: "resolved",
                id,
                question,
                options,
                defaultAnswer,
                answer: fields.get("Answer") ?? ""
            });
        } else {
            throw new UserError(`gates.md has invalid status ${status ?? ""}`);
        }
    }
    if (new Set(result.map((gate)=>gate.id)).size !== result.length) {
        throw new UserError("gates.md has duplicate gate ids");
    }
    return result;
}
function parseFrontier(raw) {
    let value;
    try {
        value = JSON.parse(raw);
    } catch  {
        throw new UserError("frontier.json is not valid JSON");
    }
    if (!isRecord(value)) {
        throw new UserError("frontier.json must contain an object");
    }
    if (Object.keys(value).length === 0) {
        return {
            generation: 0,
            prs: [],
            lowestUnmerged: null
        };
    }
    if (typeof value.generation !== "number" || !Number.isSafeInteger(value.generation) || value.generation < 0 || !isUnknownArray(value.prs) || !(value.lowestUnmerged === null || typeof value.lowestUnmerged === "number" && Number.isSafeInteger(value.lowestUnmerged))) {
        throw new UserError("frontier.json has an invalid shape");
    }
    const prs = [];
    for (const row of value.prs){
        const state = isRecord(row) ? frontierPrStateOrNull(row.state) : null;
        if (!isRecord(row) || typeof row.pr !== "number" || !Number.isSafeInteger(row.pr) || row.pr < 1 || typeof row.branches !== "string" || row.branches.length === 0 || typeof row.sha !== "string" || state === null) {
            throw new UserError("frontier.json has an invalid PR row");
        }
        prs.push({
            pr: row.pr,
            branches: row.branches,
            sha: row.sha,
            state
        });
    }
    return {
        generation: value.generation,
        prs,
        lowestUnmerged: value.lowestUnmerged
    };
}
async function readFrontier(store) {
    return parseFrontier(await requiredFile(join(store, "frontier.json")));
}
async function readStanding(store) {
    const raw = (await requiredFile(join(store, "preferences.md"))).replace(/\r/g, "");
    if (raw.trim().length === 0) {
        return [];
    }
    const result = [];
    for (const value of raw.split("\n").filter((item)=>item.length > 0)){
        const match = /^([1-9]\d*)\. (.+)$/.exec(value);
        const number = Number(match?.[1] ?? 0);
        if (match === null || number !== result.length + 1) {
            throw new UserError("preferences.md has malformed numbering");
        }
        result.push({
            number,
            line: match[2] ?? ""
        });
    }
    return result;
}
function countValues(values) {
    const result = {};
    for (const value of values){
        result[value] = (result[value] ?? 0) + 1;
    }
    return Object.fromEntries(Object.entries(result).sort(([left], [right])=>left.localeCompare(right)));
}
function summarize(unitRows, ledgerRows, currentFrontier, gateRows) {
    return {
        unitStates: countValues(unitRows.map((unit)=>unit.state)),
        ledgerVerdicts: countValues(ledgerRows.map((row)=>row.verdict)),
        frontierGeneration: currentFrontier.generation,
        openGateIds: gateRows.filter((gate)=>gate.kind === "open").map((gate)=>gate.id).sort()
    };
}
function countRecord(value) {
    if (!isRecord(value)) {
        return null;
    }
    const result = {};
    for (const [name, count] of Object.entries(value)){
        if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
            return null;
        }
        result[name] = count;
    }
    return result;
}
function previousSummary(raw) {
    const match = /<!-- orch-summary (.+) -->/.exec(raw);
    if (match === null) {
        return null;
    }
    let value;
    try {
        value = JSON.parse(match[1] ?? "");
    } catch  {
        return null;
    }
    if (!isRecord(value) || typeof value.frontierGeneration !== "number" || !isUnknownArray(value.openGateIds)) {
        return null;
    }
    const unitStates = countRecord(value.unitStates);
    const ledgerVerdicts = countRecord(value.ledgerVerdicts);
    const openGateIds = value.openGateIds.filter((item)=>typeof item === "string");
    if (unitStates === null || ledgerVerdicts === null || openGateIds.length !== value.openGateIds.length) {
        return null;
    }
    return {
        unitStates,
        ledgerVerdicts,
        frontierGeneration: value.frontierGeneration,
        openGateIds
    };
}
function changed(before, after) {
    if (before === null) {
        return "first render";
    }
    const result = [];
    const groups = [
        {
            label: "units",
            oldCounts: before.unitStates,
            newCounts: after.unitStates
        },
        {
            label: "ledger",
            oldCounts: before.ledgerVerdicts,
            newCounts: after.ledgerVerdicts
        }
    ];
    for (const { label, oldCounts, newCounts } of groups){
        const names = [
            ...new Set([
                ...Object.keys(oldCounts),
                ...Object.keys(newCounts)
            ])
        ].sort();
        for (const name of names){
            const oldCount = oldCounts[name] ?? 0;
            const newCount = newCounts[name] ?? 0;
            if (oldCount !== newCount) {
                result.push(`${label} ${name} ${oldCount}->${newCount}`);
            }
        }
    }
    if (before.frontierGeneration !== after.frontierGeneration) {
        result.push(`frontier generation ${before.frontierGeneration}->${after.frontierGeneration}`);
    }
    if (before.openGateIds.join("\0") !== after.openGateIds.join("\0")) {
        result.push(`open gates ${before.openGateIds.length}->${after.openGateIds.length}`);
    }
    return result.length === 0 ? "no derived changes" : result.join("; ");
}
function markdown(value) {
    return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}
function table(headers, rows) {
    if (rows.length === 0) {
        return "(none)";
    }
    return [
        `| ${headers.join(" | ")} |`,
        `| ${headers.map(()=>"---").join(" | ")} |`,
        ...rows.map((row)=>`| ${row.map(markdown).join(" | ")} |`)
    ].join("\n");
}
function statusMarkdown(unitRows, ledgerRows, currentFrontier, gateRows, currentSummary) {
    return `# Orchestrate status

Generated: ${new Date().toISOString()}

## Units

States: ${countLine(currentSummary.unitStates)}

${table([
        "ID",
        "Track",
        "State",
        "Branch",
        "PR",
        "SHA",
        "Brief"
    ], unitRows.map(unitCells))}

## Verification ledger

Verdicts: ${countLine(currentSummary.ledgerVerdicts)}

${table([
        "PR",
        "SHA",
        "Verdict",
        "Evidence",
        "Verifier",
        "Timestamp"
    ], ledgerRows.map(ledgerCells))}

## Frontier

Generation: ${currentFrontier.generation}
Lowest unmerged: ${currentFrontier.lowestUnmerged ?? "none"}

${table([
        "Branch",
        "PR",
        "SHA",
        "State"
    ], currentFrontier.prs.map((row)=>[
            row.branches,
            String(row.pr),
            row.sha,
            row.state
        ]))}

## Gates

${table([
        "ID",
        "Status",
        "Question",
        "Options",
        "Default",
        "Answer"
    ], gateRows.map((gate)=>[
            gate.id,
            gate.kind,
            gate.question,
            gate.options,
            gate.defaultAnswer,
            gate.kind === "resolved" ? gate.answer : ""
        ]))}

<!-- orch-summary ${JSON.stringify(currentSummary)} -->
`;
}
function countLine(value) {
    const entries = Object.entries(value);
    return entries.length === 0 ? "none" : entries.map(([name, count])=>`${name}=${count}`).join(", ");
}
const FORGE_PULL_REQUEST_QUERIES = {
    gh: {
        stateField: "state",
        headField: "headRefName",
        baseField: "baseRefName",
        states: new Map([
            [
                "OPEN",
                "OPEN"
            ],
            [
                "MERGED",
                "MERGED"
            ],
            [
                "CLOSED",
                "CLOSED"
            ]
        ])
    },
    origin: {
        stateField: "status",
        headField: "headRef",
        baseField: "baseRef",
        states: new Map([
            [
                "open",
                "OPEN"
            ],
            [
                "draft",
                "OPEN"
            ],
            [
                "merged",
                "MERGED"
            ],
            [
                "closed",
                "CLOSED"
            ]
        ])
    }
};
export function parseForge(value) {
    if (value === "gh" || value === "origin") {
        return value;
    }
    throw new UserError("forge must be gh or origin");
}
function runTool({ command, args, repo }) {
    try {
        return execFileSync(command, args, {
            cwd: repo,
            encoding: "utf8",
            env: process.env,
            stdio: [
                "ignore",
                "pipe",
                "pipe"
            ]
        });
    } catch (error) {
        throw new UserError(`${command} ${args.join(" ")} failed: ${errorMessage(error)}`);
    }
}
function listPullRequests({ filter, branch, forge, repo }) {
    const query = FORGE_PULL_REQUEST_QUERIES[forge];
    const command = `${forge} pr list ${filter} ${branch}`;
    const raw = runTool({
        command: forge,
        args: [
            "pr",
            "list",
            filter,
            branch,
            "--state",
            "all",
            "--json",
            [
                "number",
                query.stateField,
                query.headField,
                query.baseField
            ].join(",")
        ],
        repo
    });
    let value;
    try {
        value = JSON.parse(raw);
    } catch  {
        throw new UserError(`${command} output is not valid JSON`);
    }
    if (!isUnknownArray(value)) {
        throw new UserError(`${command} output is not a JSON array`);
    }
    return value.map((row)=>{
        const status = isRecord(row) ? row[query.stateField] : undefined;
        const state = typeof status === "string" ? query.states.get(status) ?? null : null;
        const head = isRecord(row) ? row[query.headField] : undefined;
        const base = isRecord(row) ? row[query.baseField] : undefined;
        if (!isRecord(row) || typeof row.number !== "number" || !Number.isSafeInteger(row.number) || row.number < 1 || state === null || typeof head !== "string" || head.length === 0 || typeof base !== "string" || base.length === 0) {
            throw new UserError(`${command} output has an invalid PR row`);
        }
        return {
            pr: row.number,
            state,
            branch: head,
            base
        };
    });
}
function branchPullRequest({ branch, forge, repo }) {
    const rows = listPullRequests({
        filter: "--head",
        branch,
        forge,
        repo
    });
    const row = rows[0];
    if (row === undefined) {
        throw new UserError(`branch ${branch} has no pull request; open one with ${forge} pr create, or resolve the frontier from a branch whose chain is fully submitted`);
    }
    if (rows.length > 1) {
        throw new UserError(`branch ${branch} has multiple pull requests (${rows.map((item)=>`#${item.pr}`).join(", ")}); close the stale ones first`);
    }
    return row;
}
function openChildren({ branch, forge, repo }) {
    return listPullRequests({
        filter: "--base",
        branch,
        forge,
        repo
    }).filter((row)=>row.state === "OPEN");
}
function runGit({ args, repo }) {
    return runTool({
        command: "git",
        args,
        repo
    }).trim();
}
function branchSha({ branch, repo }) {
    const sha = runGit({
        args: [
            "rev-parse",
            branch
        ],
        repo
    });
    if (!/^[0-9a-f]{40,64}$/i.test(sha)) {
        throw new UserError(`git rev-parse ${branch} returned an invalid SHA`);
    }
    return sha;
}
function currentBranch(repo) {
    return runGit({
        args: [
            "symbolic-ref",
            "--short",
            "HEAD"
        ],
        repo
    });
}
function trunkBranch(repo) {
    try {
        return runGit({
            args: [
                "symbolic-ref",
                "--short",
                "refs/remotes/origin/HEAD"
            ],
            repo
        }).replace(/^origin\//, "");
    } catch  {
        return "main";
    }
}
function resolveFrontier(repo, forge) {
    const trunk = trunkBranch(repo);
    const current = currentBranch(repo);
    if (current === trunk) {
        return [];
    }
    const seen = new Set([
        current
    ]);
    let bottom = branchPullRequest({
        branch: current,
        forge,
        repo
    });
    const chain = [
        bottom
    ];
    while(bottom.base !== trunk){
        if (seen.has(bottom.base)) {
            throw new UserError(`pull request base chain loops at branch ${bottom.base}`);
        }
        seen.add(bottom.base);
        bottom = branchPullRequest({
            branch: bottom.base,
            forge,
            repo
        });
        chain.unshift(bottom);
    }
    let tip = current;
    for(;;){
        const children = openChildren({
            branch: tip,
            forge,
            repo
        });
        const child = children[0];
        if (child === undefined) {
            break;
        }
        if (children.length > 1) {
            throw new UserError(`stack is not linear: branches ${children.map((row)=>row.branch).join(", ")} all target ${tip}`);
        }
        if (seen.has(child.branch)) {
            throw new UserError(`pull request base chain loops at branch ${child.branch}`);
        }
        seen.add(child.branch);
        chain.push(child);
        tip = child.branch;
    }
    if (new Set(chain.map((row)=>row.pr)).size !== chain.length) {
        throw new UserError("pull request base chain contains duplicate pull requests");
    }
    return chain.map((row)=>({
            pr: row.pr,
            branches: row.branch,
            sha: branchSha({
                branch: row.branch,
                repo
            }),
            state: row.state
        }));
}
function validateFrontierPin({ actual, expected }) {
    if (actual.length === expected.length && actual.every((pr, index)=>pr === expected[index])) {
        return;
    }
    const actualSet = new Set(actual);
    const expectedSet = new Set(expected);
    const missing = expected.filter((pr)=>!actualSet.has(pr));
    const extra = actual.filter((pr)=>!expectedSet.has(pr));
    const drift = [];
    if (missing.length > 0) {
        drift.push(`missing from resolved chain: ${missing.join(",")}`);
    }
    if (extra.length > 0) {
        drift.push(`extra in resolved chain: ${extra.join(",")}`);
    }
    if (missing.length === 0 && extra.length === 0) {
        drift.push(`order differs: expected ${expected.join(",")}; resolved ${actual.join(",")}`);
    }
    throw new UserError(`frontier pin mismatch: ${drift.join("; ")}`);
}
export function openStore(directory, options = {}) {
    const store = resolve(directory);
    let closed = false;
    let releaseLock = null;
    let lockRequest = null;
    const ensureOpen = ()=>{
        if (closed) {
            throw new UserError("store is closed");
        }
    };
    const ensureLock = async ()=>{
        ensureOpen();
        if (releaseLock !== null) {
            return;
        }
        if (lockRequest === null) {
            lockRequest = acquireLock(store, options).then((release)=>{
                releaseLock = release;
            });
        }
        try {
            await lockRequest;
        } catch (error) {
            lockRequest = null;
            throw error;
        }
    };
    const beginWrite = async ()=>{
        ensureOpen();
        if (!await exists(store)) {
            throw new UserError(`store is not initialized at ${store}; run orch init`);
        }
        await ensureLock();
    };
    return {
        units: {
            add: async (params)=>{
                await beginWrite();
                const row = {
                    id: requiredCell(params.id, "unit id"),
                    track: requiredCell(params.track, "track"),
                    state: "pending",
                    branch: "",
                    pr: "",
                    sha: "",
                    brief: params.brief === undefined ? "" : requiredCell(params.brief, "brief")
                };
                const rows = [
                    ...await readUnits(store)
                ];
                if (rows.some((unit)=>unit.id === row.id)) {
                    throw new UserError(`unit ${row.id} already exists`);
                }
                rows.push(row);
                await saveUnits(store, rows);
                return row;
            },
            set: async (params)=>{
                await beginWrite();
                const id = requiredCell(params.id, "unit id");
                const state = requiredCell(params.state, "state");
                const rows = [
                    ...await readUnits(store)
                ];
                const index = rows.findIndex((unit)=>unit.id === id);
                const old = rows[index];
                if (index < 0 || old === undefined) {
                    throw new NotFoundError(`unit ${id} not found`);
                }
                const row = {
                    ...old,
                    state,
                    branch: params.branch === undefined ? old.branch : requiredCell(params.branch, "branch"),
                    pr: params.pr === undefined ? old.pr : String(positiveInteger(params.pr, "PR")),
                    sha: params.sha === undefined ? old.sha : requiredCell(params.sha, "SHA")
                };
                rows[index] = row;
                await saveUnits(store, rows);
                return row;
            },
            get: async (id)=>{
                ensureOpen();
                const cleanId = requiredCell(id, "unit id");
                const row = (await readUnits(store)).find((unit)=>unit.id === cleanId);
                if (row === undefined) {
                    throw new NotFoundError(`unit ${cleanId} not found`);
                }
                return row;
            },
            list: async (params = {})=>{
                ensureOpen();
                const state = params.state === undefined ? undefined : requiredCell(params.state, "state");
                const track = params.track === undefined ? undefined : requiredCell(params.track, "track");
                return (await readUnits(store)).filter((unit)=>(state === undefined || unit.state === state) && (track === undefined || unit.track === track));
            },
            counts: async ()=>{
                ensureOpen();
                return countValues((await readUnits(store)).map((unit)=>unit.state));
            }
        },
        ledger: {
            record: async (params)=>{
                await beginWrite();
                const verdict = parseVerdict(params.verdict);
                const row = {
                    pr: String(positiveInteger(params.pr, "PR")),
                    sha: requiredCell(params.sha, "SHA"),
                    verdict,
                    evidence: requiredCell(params.evidence, "evidence"),
                    verifier: params.verifier === undefined ? "" : requiredCell(params.verifier, "verifier"),
                    ts: new Date().toISOString()
                };
                const rows = [
                    ...await readLedger(store)
                ];
                const index = rows.findIndex((old)=>old.pr === row.pr && old.sha === row.sha);
                if (index < 0) {
                    rows.push(row);
                } else {
                    rows[index] = row;
                }
                await saveLedger(store, rows);
                return row;
            },
            check: async (params)=>{
                ensureOpen();
                const pr = String(positiveInteger(params.pr, "PR"));
                const sha = requiredCell(params.sha, "SHA");
                const row = (await readLedger(store)).find((value)=>value.pr === pr && value.sha === sha);
                if (row === undefined) {
                    throw new NotFoundError("NOT-VERIFIED", {
                        compact: "NOT-VERIFIED",
                        json: {
                            pr,
                            sha,
                            verdict: "NOT-VERIFIED"
                        }
                    });
                }
                return row;
            },
            summary: async ()=>{
                ensureOpen();
                return countValues((await readLedger(store)).map((row)=>row.verdict));
            }
        },
        inbox: {
            push: async (params)=>{
                await beginWrite();
                const pointer = {
                    ts: new Date().toISOString(),
                    agent: requiredCell(params.agent, "agent"),
                    unit: requiredCell(params.unit, "unit"),
                    status: requiredCell(params.status, "status"),
                    report: params.report === undefined ? "" : requiredCell(params.report, "report")
                };
                const inbox = join(store, "inbox");
                if (!await exists(inbox)) {
                    throw new UserError(`store is not initialized at ${store}; run orch init`);
                }
                const timestamp = pointer.ts.replace(/[:.]/g, "-");
                const filename = `${timestamp}-${process.pid}-${randomUUID()}.tsv`;
                const contents = `${pointerCells(pointer).map(cleanCell).join("\t")}\n`;
                await atomicWrite(join(inbox, filename), contents);
                return {
                    pointer,
                    filename
                };
            },
            drain: async ()=>{
                await beginWrite();
                const inbox = join(store, "inbox");
                const rows = await readPointers(inbox);
                const drained = join(store, `.inbox-drain-${process.pid}-${randomUUID()}`);
                await rename(inbox, drained);
                try {
                    await mkdir(inbox);
                } catch (error) {
                    await rename(drained, inbox);
                    throw error;
                }
                await rm(drained, {
                    recursive: true,
                    force: true
                });
                return rows;
            },
            peek: async ()=>{
                ensureOpen();
                return readPointers(join(store, "inbox"));
            },
            count: async ()=>{
                ensureOpen();
                return (await readPointers(join(store, "inbox"))).length;
            }
        },
        gates: {
            park: async (params)=>{
                await beginWrite();
                const gate = {
                    kind: "open",
                    id: requiredLine(params.id, "gate id"),
                    question: requiredLine(params.question, "question"),
                    options: requiredLine(params.options, "options"),
                    defaultAnswer: requiredLine(params.defaultAnswer, "default")
                };
                const rows = [
                    ...await readGates(store)
                ];
                const index = rows.findIndex((old)=>old.id === gate.id);
                if (index < 0) {
                    rows.push(gate);
                } else {
                    rows[index] = gate;
                }
                await atomicWrite(join(store, "gates.md"), renderGates(rows));
                return gate;
            },
            list: async ()=>{
                ensureOpen();
                return (await readGates(store)).filter((gate)=>gate.kind === "open");
            },
            resolve: async (params)=>{
                await beginWrite();
                const id = requiredLine(params.id, "gate id");
                const rows = [
                    ...await readGates(store)
                ];
                const index = rows.findIndex((gate)=>gate.id === id);
                const old = rows[index];
                if (index < 0 || old === undefined) {
                    throw new NotFoundError(`gate ${id} not found`);
                }
                const gate = {
                    kind: "resolved",
                    id: old.id,
                    question: old.question,
                    options: old.options,
                    defaultAnswer: old.defaultAnswer,
                    answer: requiredLine(params.answer, "answer")
                };
                rows[index] = gate;
                await atomicWrite(join(store, "gates.md"), renderGates(rows));
                return gate;
            }
        },
        frontier: {
            set: async (params)=>{
                await beginWrite();
                const repo = resolve(requiredLine(params.repo, "repo directory"));
                const forge = parseForge(params.forge ?? "gh");
                const pin = params.prs === undefined ? undefined : params.prs.map((pr)=>positiveInteger(pr, "PR"));
                if (pin !== undefined && new Set(pin).size !== pin.length) {
                    throw new UserError("--prs must not contain duplicates");
                }
                const old = await readFrontier(store);
                const prs = resolveFrontier(repo, forge);
                if (pin !== undefined) {
                    validateFrontierPin({
                        actual: prs.map((row)=>row.pr),
                        expected: pin
                    });
                }
                const value = {
                    generation: old.generation + 1,
                    prs,
                    lowestUnmerged: prs.find((row)=>row.state === "OPEN")?.pr ?? null
                };
                await atomicWrite(join(store, "frontier.json"), `${JSON.stringify(value, null, 2)}\n`);
                return value;
            },
            show: async ()=>{
                ensureOpen();
                return readFrontier(store);
            }
        },
        standing: {
            show: async ()=>{
                ensureOpen();
                return readStanding(store);
            },
            add: async (params)=>{
                await beginWrite();
                const rows = [
                    ...await readStanding(store)
                ];
                const item = {
                    number: rows.length + 1,
                    line: requiredLine(params.line, "standing order")
                };
                rows.push(item);
                await atomicWrite(join(store, "preferences.md"), `${rows.map((row)=>`${row.number}. ${row.line}`).join("\n")}\n`);
                return item;
            }
        },
        status: {
            render: async ()=>{
                await beginWrite();
                const unitRows = await readUnits(store);
                const ledgerRows = await readLedger(store);
                const currentFrontier = await readFrontier(store);
                const gateRows = await readGates(store);
                const currentSummary = summarize(unitRows, ledgerRows, currentFrontier, gateRows);
                const path = join(store, "status.md");
                const before = await exists(path) ? previousSummary(await readFile(path, "utf8")) : null;
                const change = changed(before, currentSummary);
                await atomicWrite(path, statusMarkdown(unitRows, ledgerRows, currentFrontier, gateRows, currentSummary));
                return {
                    units: unitRows,
                    ledger: ledgerRows,
                    frontier: currentFrontier,
                    gates: gateRows,
                    summary: currentSummary,
                    changed: change
                };
            }
        },
        init: async ()=>{
            ensureOpen();
            await mkdir(store, {
                recursive: true
            });
            await ensureLock();
            await writeIfMissing(join(store, "units.tsv"), `${UNIT_HEADER}\n`);
            await writeIfMissing(join(store, "ledger.tsv"), `${LEDGER_HEADER}\n`);
            await mkdir(join(store, "inbox"), {
                recursive: true
            });
            await writeIfMissing(join(store, "gates.md"), "");
            await writeIfMissing(join(store, "preferences.md"), "");
            await writeIfMissing(join(store, "frontier.json"), "{}\n");
            return {
                store
            };
        },
        close: async ()=>{
            if (closed) {
                return;
            }
            if (lockRequest !== null) {
                try {
                    await lockRequest;
                } catch  {}
            }
            const release = releaseLock;
            releaseLock = null;
            closed = true;
            if (release !== null) {
                await release();
            }
        }
    };
}
