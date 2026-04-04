# Slopebook — Pipeline Synthesis

**Document Status:** Draft — Review Pipeline Run 9
**Last Updated:** 2026-04-04
**Pipeline:** pipeline-review.yaml

---

## Consistency Score

**AMBER** — Two actionable contradictions within the proposed documents remain unresolved: (1) CR-001 Run 9: `learnerId` non-nullable in the booking payload despite guest checkout path requiring `learnerId = null` — direct integration-time breakage; (2) CR-003 Run 9: tip endpoint has no booking-status guard or acceptance time window — unbound chargeback liability. Three stale references in ux-flows.md persist. Score reaches GREEN once CR-001 and CR-003 are fixed in api-design-proposed.md and ux-flows.md stale refs are corrected.

---

## Blockers Resolved This Run

- **OQ-059** — nullable bookingId + lessonPackageId FK on Payment confirmed; data-model-proposed.md v0.7 authoritative. **Resolved.**
- **OQ-061** — tips in scope as optional post-lesson payment; OQ-043 superseded; data-model-proposed.md v0.7 adds unique partial index `(bookingId, paymentType) WHERE paymentType = 'tip'`. **Resolved.**
- **CR-002 Run 9** — tip uniqueness constraint added to data-model-proposed.md v0.7. **Resolved at schema level.** API-level idempotency key for POST /api/v1/bookings/:id/tip still needs documentation in api-design-proposed.md.
- **CR-004 (Run 8)** — duplicate `guestCheckoutId` in booking payload fixed by user before this run. **Resolved.**

## Remaining Blockers

- **CR-001 Run 9** — `learnerId: "uuid"` (non-nullable) in api-design-proposed.md booking payload; must be `"uuid | null"` to support guest checkout path. Fix required in api-design-proposed.md before promotion.
- **CR-003 Run 9** — POST /api/v1/bookings/:id/tip has no documented `Booking.status = completed` guard and no tip acceptance time window. Fix required in api-design-proposed.md before promotion.
- **OQ-066** — PATCH /api/v1/bookings/:id/reassign has no request or response payload documented. Endpoint cannot be implemented. Fix required in api-design-proposed.md before promotion.

---

## Promote These Files

| Draft | Target | Status |
|---|---|---|
| drafts/use-cases-p0-proposed.md | design-docs/use-cases-p0.md | **READY** — OQ-061 resolved; UC-007 tip steps confirmed in scope; all 4 previously unchecked P0 registry items now covered |
| drafts/use-cases-p1-proposed.md | design-docs/use-cases-p1.md | **READY** — no blocking issues in P1/P2 use cases |
| drafts/tech-requirements-proposed.md | design-docs/tech-requirements.md | **READY** — TR-007 tip endpoint confirmed in scope; TR gap #18 (password reset) still pending OQ-062 but non-blocking for existing TRs |
| drafts/api-design-proposed.md | design-docs/api-design.md | **HOLD** — CR-001 Run 9 (learnerId non-nullable); CR-003 Run 9 (tip endpoint no status/time guard); OQ-066 (reassign payload undocumented) |
| drafts/asset-list-proposed.md | design-docs/asset-list.md | **READY** — tips confirmed in scope; post-lesson review screen tip section valid; password reset screen absent pending OQ-062 but non-blocking for other assets |
| drafts/data-model-proposed.md | design-docs/data-model.md | **READY** — OQ-059 and OQ-061 resolved; v0.7 adds unique partial index for tip; Payment.paymentType DEFAULT 'booking_charge' added; PasswordResetToken promotion gated on OQ-062 but schema addition is non-breaking |
| drafts/open-questions-proposed.md | design-docs/open-questions.md | **READY** — OQ-059 and OQ-061 moved to resolved; OQ-063 tip misplacement cleaned up; 5 active questions accurately reflect current state |

---

## Open Questions This Run

New: 0
Resolved: 2 (OQ-059, OQ-061)
Active remaining: 5 (OQ-062, OQ-063, OQ-064, OQ-065, OQ-066)

---

## UC Registry Status

46 P0 items — all now covered in use-cases-p0-proposed.md (pending promotion):
- `[x]` Student submits rating after lesson is marked complete → UC-007 ✓
- `[x]` Student submits tip after lesson is marked complete (optional) → UC-007 steps 4–5 ✓ (OQ-061 resolved)
- `[x]` Post-lesson flow unlocked when booking status changes to completed → UC-013 ✓
- `[x]` Post-lesson flow accessible via confirmation email link → UC-007 alternate flow ✓

---

## Next Run Focus

Three targeted fixes gate api-design-proposed.md promotion:

1. **Fix CR-001**: Change `"learnerId": "uuid"` to `"learnerId": "uuid | null"` in the booking payload JSON; add note that `paymentMethodId` is also nullable for guest checkout (processor SDK path).
2. **Fix CR-003**: Add booking-status guard and tip acceptance time window to POST /api/v1/bookings/:id/tip endpoint description; add idempotency key documentation.
3. **Fix OQ-066**: Document PATCH /api/v1/bookings/:id/reassign request payload and response payload.

Secondary: resolve OQ-062 (password reset P0 vs P1) to determine whether PasswordResetToken and password-reset endpoints are in scope for Alpha. Resolve OQ-063 (real-time push mechanism) to unblock TR-014 and admin Schedule View implementation. Once these three API fixes land, re-run pipeline-generate to produce a clean api-design draft, then pipeline-review to confirm promotion.
