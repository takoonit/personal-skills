import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assert, id, sha } from "./delivery-common.mjs";

export function prDraftPath(directory, repo) {
  id(repo, "PR draft repository");
  return join(directory, "pr-drafts", repo, "PR.md");
}

export async function ensurePrDraft(directory, repo) {
  const path = prDraftPath(directory, repo);
  for (const folder of [join(directory, "pr-drafts"), join(directory, "pr-drafts", repo)]) {
    await mkdir(folder, {recursive: true, mode: 0o700});
    const entry = await lstat(folder);
    assert(entry.isDirectory() && !entry.isSymbolicLink(), "PR draft directory must be a real directory");
  }
  let created = false;
  try {
    const template = await readFile(new URL("../templates/PR.md", import.meta.url));
    await writeFile(path, template, {flag: "wx", mode: 0o600});
    created = true;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  const entry = await lstat(path);
  assert(entry.isFile() && !entry.isSymbolicLink(), "PR draft must be a regular file");
  const content = await readFile(path);
  return {path, created, sha256: sha(content), content: content.toString("utf8"),
    owner: "coordinator", approval: "Working prose only; existing plan and publication approvals still apply"};
}
