# Azure DevOps platform notes

Documentation checked 2026-10-16. Recheck current official documentation when platform compatibility affects a new decision, especially Azure DevOps Server versions. Local conventions can be stricter.

- PR description limit: 4,000 characters. [Microsoft REST overview](https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-requests?view=azure-devops-rest-7.1).
- Mermaid support is documented for Markdown file previews in repo browsing and pull requests, not raw diffs or PR descriptions. Put diagrams in the change record. [Sprint 246](https://learn.microsoft.com/en-us/azure/devops/release-notes/2024/sprint-246-update).
- Use `graph` instead of `flowchart` for wiki compatibility; wiki uses `:::mermaid` fences while Markdown file examples may use fenced mermaid blocks. Verify the target surface. Generic Mermaid rendering does not prove Azure compatibility. [Markdown guidance](https://learn.microsoft.com/en-us/azure/devops/project/wiki/markdown-guidance).
- Default template: `.azuredevops/pull_request_template.md`; optional quick template: `.azuredevops/pull_request_template/quick.md`. Templates must be on the default branch. Add a template appends content; remove the original manually or use the documented `?template=quick.md` override when creating a PR. [Templates](https://learn.microsoft.com/en-us/azure/devops/repos/git/pull-request-templates).
- `Fixes #123` resolution depends on repository settings and supported default-branch workflows. The documented PR post-completion workflow excludes squash merges and requires Complete associated work items. Rewriting a squash message is not a guaranteed workaround. [Resolution mentions](https://learn.microsoft.com/en-us/azure/devops/repos/git/resolution-mentions).
- Use `Refs: #123`, not a bare line starting with `#123`: default Git comment cleanup can strip it. Customized comment/cleanup settings may differ.

Skills enforce agent behavior only. Merge blocking requires separately configured branch policies/status checks or build validation. A validator must fetch the current full PR description rather than rely on a truncated list response, reject placeholder-only sections, and honor documented small-change exceptions. Description-only edits need a revalidation path; do not assume commit-triggered builds cover them.
