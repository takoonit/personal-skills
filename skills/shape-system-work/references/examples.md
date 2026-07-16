# Worked examples

## Rule-based personalised report product

**Request:** Build a domain-reading website with user birth data, a calculation engine, static profiles, AI-personalised reports, and follow-up chat.

**Reframed decision:** Enable a buyer to receive a credible, reproducible personal report at a price that covers generation cost, without making AI the authority for deterministic rules.

**Key finding:** Accuracy and provenance are the product foundation. Chat is not automatically valuable and creates an unbounded variable cost.

**Recommended boundaries:**

- deterministic engine: normalise inputs and calculate canonical results;
- versioned knowledge: rules, mappings, citations, and editorial review;
- report composer: select validated facts and construct a bounded generation brief;
- delivery: render, store, and version the purchased report;
- optional follow-up: customer-provided model access or a tightly metered add-on.

**Risk-first slices:**

1. Golden test set for input normalisation and deterministic output.
2. One end-to-end report for a single supported case, including provenance.
3. Versioned mapping and editorial correction workflow.
4. Paid generation with cost, retry, and idempotency controls.
5. Expand profile coverage only after accuracy and willingness-to-pay checks.

**Do not build yet:** Open-ended chat, premature microservices, or hundreds of profiles before validating the rule model.

## Enterprise API change

**Request:** Add a new partner operation through an API gateway to existing services.

**Reframed decision:** Expose the operation safely without allowing partner traffic or deployment mistakes to degrade existing consumers.

**Architecture focus:** Contract and authentication at the gateway; business rules in the service; idempotency for retryable writes; correlation IDs and sanitised logs across the path; explicit timeout and fallback behaviour.

**Risk-first slices:**

1. Contract example and dependency probe against a non-production target.
2. Walking skeleton with authentication, routing, and trace correlation.
3. Happy path plus contract tests.
4. Timeout, duplicate request, invalid credential, and dependency-failure tests.
5. Deployment checklist, rollback evidence, dashboards, and alerts.

**Hidden trap:** A technically correct proxy can still fail in production when downstream retesting and rollback ownership are vague.

## Suggested invocation prompts

- `Use @shape-system-work to turn this product idea into a realistic architecture and risk-first backlog.`
- `Use @shape-system-work to challenge this proposed design. Separate facts from assumptions and tell me what not to build.`
- `Use @shape-system-work to convert this PRD into vertical slices with acceptance evidence and dependencies.`
- `Use @shape-system-work to compare a modular monolith with services for this team and recommend a revisit trigger.`
