# Generate Pipeline Complete

**Run:** 7
**Date:** 2026-03-29
**Pipeline:** pipeline-generate.yaml

---

## Files Written

| File | Status |
|------|--------|
| design-docs/drafts/use-cases-p0-proposed.md | Written — Run 7 |
| design-docs/drafts/use-cases-p1-proposed.md | Written — Run 7 |
| design-docs/drafts/tech-requirements-proposed.md | Written — Run 7 |
| design-docs/drafts/asset-list-proposed.md | Written — Run 7 |

---

## Changes from Run 6

### OQ-054 — Admin walk-up booking: full account creation
- **UC-021:** Main flow updated — admin creates User + Learner for walk-up customers (not GuestCheckout). Walk-up customers get a full account from their first visit.
- **TR-021:** `POST /api/v1/users` added to API changes. Note confirms Booking CHECK constraint `(learnerId IS NOT NULL)` is satisfied.
- Gap Analysis item 16 added: `POST /api/v1/users` absent from api-design.md.

### OQ-055 — `in_progress` removed from Booking.status
- **UC-009:** Main flow step 2 now queries `status = confirmed` only (was `{confirmed, in_progress}`).
- **UC-010:** Precondition updated — `status = confirmed` (was `confirmed or in_progress`); postcondition clarified.
- **UC-012:** Precondition updated — `confirmed or completed` (was `in_progress or completed`).
- **UC-013:** Precondition updated — `confirmed` only (was `in_progress or confirmed`). OQ-055 note added.
- **TR-009:** API filter updated to `status=confirmed`. OQ-055 note added.
- **TR-010:** OQ-055 note carried forward.
- **TR-012:** OQ-055 note added.
- **TR-013:** OQ-055 note added.
- **asset-list:** BookingCard — `in_progress` variant removed. Instructor Today's Schedule — `in_progress` state removed.
- **Schema Changes Summary:** `Booking.status in_progress REMOVED` row retained.

### OQ-056 — void_pending compensation state
- **UC-003 / UC-004:** Void retry policy fully specified: 4 retries at 100ms intervals; silently set `Payment.status = void_pending` if all fail.
- **TR-003 / TR-004:** Retry semantics section updated with explicit void_pending path.

### OQ-057 — Language defaults to browser geolocation
- **UC-003:** Step 2 — preferredLanguage explicitly noted as defaulting to browser geolocation.
- **UC-005:** Step 2 — same note added.
- **TR-003:** Schema change annotation updated to `DEFAULT 'en'` with note that UI defaults to browser geolocation.
- **TR-022:** Note added referencing OQ-057 and storage location.
- **asset-list:** Authentication Gate — language selector description updated.

### OQ-058 — Instructor can cancel own lessons
- **UC-006:** Persona updated to include `Instructor (own lessons per OQ-058)`. Preconditions and alternate flows updated.
- **TR-006:** Auth updated to include `instructor` role for own bookings. OQ-058 note carried forward.
- **asset-list:** Instructor Today's Schedule — cancel CTA noted as present for own lessons. CancellationModal — instructor surface added.

---

## Known Gaps Carried Forward (api-design.md not updated)

The following 16 gaps exist between the current api-design.md and the full P0 TR requirements. These are tracked in TR gap analysis and await a dedicated api-design update pass:

1. `GET /api/v1/bookings/:id/notes`
2. `POST /api/v1/slot-reservations`
3. `PATCH /api/v1/bookings/:id/checkin`
4. `POST /api/v1/cancellation-policies`
5. `PATCH /api/v1/cancellation-policies/:id`
6. `PATCH /api/v1/cancellation-policies/:id/default`
7. `POST /api/v1/bookings/bulk-cancel`
8. `POST /api/v1/auth/register` — extended fields undocumented
9. Real-time push mechanism for Admin Schedule View (SSE vs WebSocket vs polling)
10. `PATCH /api/v1/bookings/:id/reassign`
11. `POST /api/v1/instructors/:id/certifications`
12. `DELETE /api/v1/households/:id/learners/:learnerId` — 409 error code undocumented
13. `booking.completed` notification event
14. `PATCH /api/v1/bookings/:id/complete`
15. `PATCH /api/v1/bookings/:id/no-show`
16. `POST /api/v1/guest-checkouts`
17. `POST /api/v1/users` (new in Run 7 — OQ-054 walk-up path)

---

## Source Document Status

| Document | Status |
|----------|--------|
| design-docs/overview.md | Unchanged — note: §Non-Goals still lacks explicit mention that pricing floors are out of scope (OQ-042 context) |
| design-docs/ux-flows.md | Unchanged — stale references: Google Calendar (§3), Tips (§3), Pricing floors (§5) |
| design-docs/open-questions.md | Promoted — all 58 OQs resolved |
| design-docs/data-model.md | Promoted — v0.5 |
| design-docs/api-design.md | Not updated — 17 known gaps (see above) |
