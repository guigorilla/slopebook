# Slopebook — Design Critique

**Prepared by:** Critic Agent
**Pipeline Run:** Run 9 (2026-04-04)
**Documents Reviewed:** overview.md, data-model.md (v0.5), data-model-proposed.md (v0.6), api-design-proposed.md (Run 8, post CR-004 fix), ux-flows.md, open-questions.md / open-questions-proposed.md (Run 8), decisions.md, uc-registry.md, use-cases-p0-proposed.md (Run 8), tech-requirements-proposed.md (Run 8), asset-list-proposed.md (Run 8)

**Resolved since Run 8:** CR-001, CR-002, CR-003 (all addressed in data-model-proposed.md v0.6); CR-004 (duplicate guestCheckoutId removed); OQ-059 (nullable bookingId confirmed); OQ-061 (tips in scope, OQ-043 superseded).

---

## Critical Issues

### CR-001 — Booking payload: `learnerId` marked non-nullable despite guest checkout path
**Severity:** Critical
**Source:** api-design-proposed.md — Booking Engine, booking request payload JSON
**UC:** UC-003 (guest checkout), UC-004 (authenticated)
**Problem:** The booking request payload shows `"learnerId": "uuid"` (non-nullable). For the guest checkout path (UC-003), `learnerId` is null and `guestCheckoutId` is set — the server-side rule enforces exactly one of the two must be non-null. Any client reading this spec will treat `learnerId` as required and reject the guest checkout path at client-side validation. This will break all guest bookings at integration time.
**Fix:** Change to `"learnerId": "uuid | null"` and `"paymentMethodId": "uuid | null"` in the booking payload JSON (guest checkout uses processor SDK for payment, not a stored PaymentMethod).

---

### CR-002 — Tip endpoint has no idempotency or uniqueness constraint
**Severity:** Critical
**Source:** api-design-proposed.md — Booking Engine, POST /api/v1/bookings/:id/tip; data-model-proposed.md — Payment entity
**UC:** UC-007
**Problem:** `POST /api/v1/bookings/:id/tip` has no documented uniqueness constraint. Unlike the review endpoint (one InstructorRating per booking via unique constraint), a student can call the tip endpoint multiple times and generate multiple tip Payment records for the same booking. There is no idempotency key specified for this endpoint and no `(bookingId, paymentType = 'tip')` unique constraint on the Payment table. At $10/tip with a double-tap, this creates duplicate charges the processor may not deduplicate.
**Fix:** Add a unique partial index on Payment: `(bookingId, paymentType)` WHERE `paymentType = 'tip'`. Add idempotency key support to `POST /api/v1/bookings/:id/tip`. Document one tip per booking.

---

### CR-003 — Tip endpoint: no time-window or booking-status guard documented
**Severity:** Critical
**Source:** api-design-proposed.md — POST /api/v1/bookings/:id/tip; use-cases-p0-proposed.md UC-007
**UC:** UC-007
**Problem:** The tip endpoint has no documented guard that: (a) the booking is in `completed` status before a tip can be submitted, and (b) the endpoint cannot be called on a `cancelled` or `no_show` booking. Without a status check, a student who cancels a booking could still submit a tip payment for it. More critically, the endpoint is callable indefinitely after completion — there is no time window (e.g. 7 days) beyond which tips are no longer accepted. This leaves an unbound liability for chargebacks.
**Fix:** Document server-side enforcement: `Booking.status = completed` required; add a configurable or fixed tip acceptance window (suggest: 7 days after `Booking.endAt`). Add to api-design-proposed.md endpoint description.

---

## Significant Gaps

- **api-design-proposed.md** — OQ-063 (real-time push mechanism for admin schedule view) placed a tip-resolution decision inside the OQ-063 block; the actual push mechanism (SSE / WebSocket / polling) remains undecided and unspecified; TR-014 cannot be implemented until this is resolved
- **api-design-proposed.md — POST /api/v1/users** — no response payload documented; admin walk-up flow (UC-021, TR-021) creates User + Household + Learner atomically — implementer has no spec for what the response contains or what IDs to use in the subsequent booking call
- **api-design-proposed.md — PATCH /api/v1/bookings/:id/reassign** — no request payload documented (OQ-066); at minimum needs `instructorId`; no response payload either; implementer has nothing to work from
- **api-design-proposed.md Notification Service** — `booking.completed` event description says "one-click rating link" only; now that tips are confirmed in scope, the post-lesson email should prompt for both rating (required) and tip (optional); description needs updating
- **uc-registry.md** — "Bulk create lessons for group programs" — UC-017 alternate flow covers this in one line; no dedicated API endpoint (`POST /api/v1/lesson-types/bulk` or equivalent) exists in api-design-proposed.md or tech-requirements-proposed.md; cannot be implemented
- **data-model-proposed.md — Instructor.averageRating** — update strategy relies on "application layer recomputes on InstructorRating insert/update" but no TR or endpoint spec documents this as a side effect of `POST /api/v1/bookings/:id/review`; TR-007 must explicitly list this as an API change side effect
- **ux-flows.md** — three stale references persist unedited: §3 "Sync with Google Calendar (optional)" (deferred v1.5, OQ-021), §3 "Tips (if applicable)" in Earnings Dashboard (tips now in scope but as a separate post-lesson flow, not as an Earnings Dashboard line item), §3 "optional digital signature" at check-in (Smartwaiver deferred OQ-052); all three will mislead developers reading ux-flows.md

---

## Edge Cases Not Handled

- Instructor last-minute cancellation — **COVERED**: UC-006 alternate flow (OQ-058)
- Payment capture succeeds but booking write fails — **COVERED**: UC-003 step 8 (OQ-053/056)
- Waitlist offer expires unaccepted — **COVERED**: UC-029 alternate flow (OQ-034)
- Resort switches processor mid-season — **COVERED**: UC-025 (P1, OQ-035)
- Learner sub-profile deleted with active bookings — **COVERED**: 409 LEARNER_HAS_ACTIVE_BOOKINGS (OQ-036)
- Weather cancellation during peak booking window — **COVERED**: UC-019; CASL transactional (OQ-044)
- Instructor freelancing across two tenants simultaneously — **COVERED**: OQ-041; no cross-tenant conflict detection v1.0
- Child waiver not signed at time of booking — **COVERED**: OQ-052; waiverToken = null for P0

---

## Slopebook Domain Risks

- **PCI scope still undefined** (OQ-064, unresolved since Run 7): SAQ type not documented. `processorTokenId` encrypted at rest, but whether the architecture qualifies as SAQ A vs A-EP requires processor compliance team confirmation before building payment infrastructure.
- **PIPEDA gap for P0 guest PII** (unresolved): UC-026 right-to-erasure is P1. Alpha will accumulate GuestCheckout PII with no production erasure path. Canadian guest erasure requests during Alpha require manual DB intervention.
- **Seasonal load — no capacity targets**: Rate-limiting thresholds and autoscaling strategy remain unspecified. Opening-day booking spikes at ski resorts are extreme and predictable.
- **Child safety — client-supplied DOB not server-verified**: `Learner.dateOfBirth` and `GuestCheckout.learnerDateOfBirth` are self-reported with no server-side age verification. False DOB bypasses parental consent requirement silently.

---

## Minor Issues

- **api-design-proposed.md** — `booking.completed` Notification Service event description should be updated from "one-click rating link" to "rating and optional tip prompt link" now that tips are confirmed in scope
- **ux-flows.md §3 Earnings Dashboard** — "Tips (if applicable)" is now in scope but as a **post-lesson payment flow** triggered from the customer app, not displayed in the instructor's Earnings Dashboard; the ux-flows.md reference is misleading — instructor sees tip income in earnings but does not submit tips from that screen
- **open-questions-proposed.md** — OQ-063 block contains a tip resolution decision (status "Resolved") but the OQ-063 question is about the real-time push mechanism, not tips; the block needs cleanup to separate the tip decision (which resolves OQ-061) from the push mechanism question (which remains OQ-063 unresolved)
- **data-model-proposed.md** — `Payment.paymentType` column does not have a DEFAULT value specified; existing rows at migration time need a backfill strategy (all existing = 'booking_charge'); migration notes in v0.6 do cover this but the schema block itself should show `default 'booking_charge'`
