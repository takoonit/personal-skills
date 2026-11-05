# Audit trail ticket template

Use it for tickets that extend an existing action log into a compliance-ready audit trail. The focus is data completeness, security and traceability: who did what, when, where, and what changed.

For a read or export log, the "state changes" row does not apply, because a view changes nothing. Mark it "not applicable" with that reason.

---

### Summary / Title
[Enhance Audit Trail for {Module/Entity} to include {Specific Details/Fields}]

### Context & Problem Statement
- **Current State:** The system currently logs basic activity (e.g., "User X updated setting Y"), but lacks the granular data required for security compliance, debugging, or forensic audits.
- **Why Now?** (e.g., upcoming security audits, compliance requirements like SOC2/GDPR, or investigating historical data discrepancies).

### Scope of Changes (What to Log)
Specify the exact data points that must be captured for every target action:
- [ ] **Who:** User ID, Email, Role, and IP address / User-Agent.
- [ ] **When:** Exact timestamp (UTC with ISO 8601 format).
- [ ] **What (Action):** Specific event type (e.g., `USER_PERMISSION_MODIFIED`, `RECORD_DELETED`).
- [ ] **State Changes (Diff):** Snapshot of the **Before** and **After** values (JSON diff or structured payload) for updated records.
- [ ] **Context / Metadata:** Affected resource ID, tenant/organization ID, and source service/API endpoint.

### Technical Implementation Notes
- **Storage Strategy:** Where should these logs live? (e.g., dedicated `audit_logs` table in PostgreSQL, append-only log storage, or forwarded to an external SIEM/Log management tool like Datadog/CloudWatch).
- **Data Retention & Immutability:** Confirm that audit logs must be **read-only** (prevented from being updated or deleted by standard application roles).
- **Performance Consideration:** Ensure audit logging is handled asynchronously (e.g., via event emitters, background queues, or message brokers like RabbitMQ/Kafka) so it doesn't block the primary transaction.

### Acceptance Criteria
- [ ] Performing action X triggers an audit log entry automatically without slowing down the primary API response.
- [ ] The audit log database table/collection is strictly secured against manual updates or deletions.
- [ ] Querying the audit log (via internal admin tool or API) correctly displays the full diff (old value vs. new value) for updated entities.
- [ ] Sensitive data (e.g., passwords, API keys, PII) is properly scrubbed/masked before writing to the audit log.
