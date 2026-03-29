# Slopebook — Pipeline Synthesis

**Document Status:** Draft — Run 6
**Date:** 2026-03-28
**Author:** Team Lead Agent
**Pipeline:** pipeline-review.yaml

---

## Consistency Score

**AMBER** — Run 6 drafts are internally consistent; three source documents (data-model.md, ux-flows.md, overview.md) are stale and three new BLOCKERs require resolution before Alpha development can begin.

---

## Blockers

- **CR-001** — UC-003 step ordering: GuestCheckout created after payment capture; contradicts TR-003 which correctly orders POST /api/v1/guest-checkouts before charge
- **CR-002** — UC-021 admin walk-up booking violates Booking CHECK constraint; no path defined for customer with no account (OQ-054)
- **CR-003** — Booking.status = in_progress never triggered; enum value with no defined transition (OQ-055)
- **CR-004** — Payment void failure has no compensation state defined; `void_pending` added to schema in v0.5 but retry policy, alert, and escalation are unspecified (OQ-056)
- **OQ-054** — Admin walk-up booking: GuestCheckout creation path undefined — BLOCKER for UC-021
- **OQ-055** — Booking.status in_progress trigger undefined — BLOCKER for UC-012, UC-013
- **OQ-056** — Payment void failure compensation policy undefined — BLOCKER for TR-003, TR-004

---

## Promote These Files

- drafts/use-cases-p0-proposed.md → design-docs/use-cases-p0.md **[HOLD]** — CR-001 (UC-003 step ordering) must be fixed first
- drafts/use-cases-p1-proposed.md → design-docs/use-cases-p1.md **[READY]** — no critical issues; UC-031a full-refund rule (OQ-051) correctly applied
- drafts/tech-requirements-proposed.md → design-docs/tech-requirements.md **[HOLD]** — OQ-054/055/056 are BLOCKERs; promote after resolution
- drafts/asset-list-proposed.md → design-docs/asset-list.md **[READY]** — no critical issues; Smartwaiver simplification correctly applied
- drafts/data-model-proposed.md → design-docs/data-model.md **[READY]** — v0.5 applies all OQ resolutions through OQ-053 plus CR-004 void_pending; safe to promote
- drafts/open-questions-proposed.md → design-docs/open-questions.md **[HOLD]** — wait for OQ-054/055/056/057/058 decisions before promoting

---

## Open Questions This Run

New: 5 (OQ-054, OQ-055, OQ-056, OQ-057, OQ-058)
Resolved: 3 (OQ-051, OQ-052, OQ-053)
Stale blockers: 0

---

## Next Run Focus

Resolve OQ-054 (admin walk-up booking path), OQ-055 (in_progress trigger), and OQ-056 (void compensation policy) — all three are BLOCKER-class and block UC-021, UC-012/013, and TR-003/004 respectively. Once resolved, run pipeline-generate to fix UC-003 step ordering (CR-001) and add the walk-up path to UC-021, then promote use-cases-p0-proposed.md, tech-requirements-proposed.md, and open-questions-proposed.md. Also update the three stale source documents (ux-flows.md tips/calendar references, overview.md pricing floors) before the next review run to eliminate recurring consistency noise.
