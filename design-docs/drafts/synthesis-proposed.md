# Slopebook — Pipeline Synthesis

**Document Status:** Draft — Review Pipeline Run 7
**Date:** 2026-03-29
**Author:** Team Lead Agent

---

## Consistency Score

**AMBER** — api-design.md is missing 8+ P0-required endpoints and has two stale descriptions (tip reference in review endpoint; guestCheckoutId absent from booking payload); ux-flows.md has 4 stale references contradicting resolved OQs. All Run 7 draft files are internally consistent with each other.

---

## Blockers

- **CR-001** — Booking API payload missing `guestCheckoutId`: guest checkout booking path (UC-003) cannot link booking to GuestCheckout record. api-design.md must add `guestCheckoutId` to booking request payload before API implementation begins.
- **CR-002** — `POST /api/v1/bookings/:id/review` description says "tip and rating" — tips removed by OQ-043. Developers implementing from api-design.md will add tipAmountCents, causing schema mismatch.
- **CR-003** — `Payment.bookingId NOT NULL` will block P1 package purchase payments (UC-024). OQ-059 raised; data-model-proposed.md adopts provisional fix (nullable bookingId + lessonPackageId FK). Needs explicit resolution before P1 development.

---

## Promote These Files

- drafts/use-cases-p0-proposed.md     → design-docs/use-cases-p0.md     **READY**
- drafts/use-cases-p1-proposed.md     → design-docs/use-cases-p1.md     **READY**
- drafts/tech-requirements-proposed.md → design-docs/tech-requirements.md **READY**
- drafts/asset-list-proposed.md       → design-docs/asset-list.md       **READY**
- drafts/data-model-proposed.md       → design-docs/data-model.md       **READY** — v0.6; Payment schema updated for P1 compatibility (OQ-059 provisional)
- drafts/open-questions-proposed.md   → design-docs/open-questions.md   **READY** — 2 new OQs (OQ-059, OQ-060)

All 6 files are READY. AMBER score reflects staleness in **source** docs (api-design.md, ux-flows.md) that have not been updated to reflect resolved OQs, not conflicts within the draft set itself.

---

## Open Questions This Run

New: 2 (OQ-059, OQ-060)
Resolved: 0
Stale blockers: 0

**OQ-059** — Payment.bookingId constraint vs P1 package purchases — blocks UC-024 (P1)
**OQ-060** — Booking auto-completion if instructor never marks complete — blocks UC-007 (rating), booking.completed event, earnings reporting

---

## Next Run Focus

The two new open questions (OQ-059, OQ-060) should be resolved before the next generate run so the data model and use cases can incorporate the decisions. In parallel, api-design.md requires a dedicated update pass to add the 16 missing endpoints, fix the booking payload, correct the review endpoint description, and add the `booking.completed` notification event — this update is the highest-value unblocked work remaining before P0 development can begin from the design docs alone.
