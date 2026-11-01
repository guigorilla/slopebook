# Slopebook — Pipeline Synthesis

**Document Status:** Draft — Review Pipeline Run 10
**Last Updated:** 2026-11-01
**Pipeline:** pipeline-review.yaml

---

## Consistency Score

**RED** — Seven contradictions remain across the overlay and Booking Core drafts, led by payment fields, privacy gate coverage, overlay identity and tenant resolution.

---

## Blockers

Critique Critical items:

- **CR-001** — The privacy gate does not cover real POS customer data imported in Phase 1. `POST /imports` is ungated and writes a gated LearnerProfile.
- **CR-002** — Overlay waitlist ordering reuses Booking Core `/promote` and `/accept`, which lead to payment and confirmation. This breaks the rule that an offer never confirms or takes payment.
- **CR-003** — Phase 2 consent, export and erasure depend on Phase 3 accounts. Overlay guests hold only tokens, so the gate cannot open.
- **CR-004** — Guest booking and tip payloads have no field for the card token or payment intent.

Further RED consistency findings:

- **CD-5** — Phase 1 console endpoints need a JWT, but auth is Phase 2.
- **CD-6** — "Tenant resolved from JWT only" contradicts every public endpoint.
- **SA-1** — Browse collects an integer age, but GuestCheckout requires `learnerDateOfBirth`.

Run 9 blockers:

- **CR-001 Run 9** (nullable `learnerId`) — partly fixed. Nullability is done, but the guest path still can't pay (CR-004 above).
- **CR-003 Run 9** (tip guard) — fixed in the API draft.
- **OQ-066** (reassign payload) — fixed in the API draft. UC-014, UC-057 and TR-015 still call it unresolved.

---

## Promote These Files

- drafts/use-cases-p0-proposed.md      → design-docs/use-cases-p0.md      [HOLD] — RED findings
- drafts/use-cases-p1-proposed.md      → design-docs/use-cases-p1.md      [HOLD] — consistency score is RED; no RED finding of its own
- drafts/tech-requirements-proposed.md → design-docs/tech-requirements.md [HOLD] — RED findings
- drafts/api-design-proposed.md        → design-docs/api-design.md        [HOLD] — RED findings
- drafts/asset-list-proposed.md        → design-docs/asset-list.md        [HOLD] — RED findings
- drafts/data-model-proposed.md        → design-docs/data-model.md        [HOLD] — RED findings
- drafts/open-questions-proposed.md    → design-docs/open-questions.md    [HOLD] — consistency score is RED; no RED finding of its own

---

## Open Questions This Run

New: 72 (OQ-067 to OQ-138)
Resolved: 2 (OQ-009, OQ-066; OQ-066 is effective on promotion of the API draft)
Stale blockers: 4 (OQ-062, OQ-063, OQ-064, OQ-065)

---

## UC Registry Status

74 / 74 non-deferred P0 items covered (21 Overlay Scope, 53 Alpha Scope), per uc-validation-proposed.md.
Unchecked items: the Overlay Scope items and the post-lesson items remain `[ ]` in uc-registry.md although use cases now exist. The registry is human-maintained and was not changed.

---

## Next Run Focus

Most RED findings are product decisions, not draft errors. Settle these first and record them in decisions.md: how the privacy gate treats imported POS data and how it splits by phase (OQ-067, OQ-068), how the Phase 1 console is accessed (OQ-069), and how overlay guests are identified for consent and erasure (OQ-091, CR-003). Separate overlay waitlist endpoints from Booking Core, and add the payment token fields, tenant source and age or date of birth rule, which are design fixes. Then rerun pipeline-generate and pipeline-review.
