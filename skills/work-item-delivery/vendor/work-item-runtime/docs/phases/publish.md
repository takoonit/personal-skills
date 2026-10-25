# Stage an exact publication

**Procedure:** the `work-item-publish` skill.

**Input:** resume `stage-publication`, a certified current head, grouped-case readiness and the working PR draft.

**Output:** the staged payload and hash, evidence links and attachments, and the user's actual approval or the missing decision.

**Stop:** while approval or a grouped publication hold is missing; a local draft is not a published PR.

**Runtime enforces:** grouped-case holds, exact payload and attachment byte binding, and invalidation when a blocker appears after staging.
