# Slopebook — Design Critique

**Prepared by:** Critic Agent
**Pipeline Run:** Run 7 (2026-03-29)
**Documents Reviewed:** overview.md, data-model.md (v0.5), api-design.md, ux-flows.md, open-questions.md (58 resolved), drafts/use-cases-p0-proposed.md (Run 7), drafts/tech-requirements-proposed.md (Run 7), drafts/asset-list-proposed.md (Run 7)

---

## Critical Issues

### CR-001 — Booking API payload missing guestCheckoutId
**Severity:** Critical
**Source:** api-design.md — Booking Engine, Booking request payload
**UC:** UC-003
**Problem:** The booking request payload in api-design.md lists `learnerId` but not `guestCheckoutId`. The Booking entity has a CHECK constraint requiring exactly one of learnerId or guestCheckoutId to be non-null. Without `guestCheckoutId` in the payload, the guest checkout booking path (UC-003) has no way to link the booking to the GuestCheckout record — the API cannot serve guest bookings at all.
**Fix:** Add `"guestCheckoutId": "uuid | null"` to the booking request payload in api-design.md. Enforce server-side: exactly one of learnerId / guestCheckoutId must be non-null.

---

### CR-002 — `POST /api/v1/bookings/:id/review` description references tips
**Severity:** Critical
**Source:** api-design.md — Booking Engine endpoint list
**UC:** UC-007
**Problem:** The endpoint description reads "Submit tip and rating after lesson completion." Tips were removed by OQ-043 (`Payment.tipAmountCents` and `Tenant.tipsEnabled` both deleted). If a developer implements this endpoint from api-design.md as written, they will add tipAmountCents to the payload — a field that does not exist in the Payment schema. This will either cause a runtime error or introduce dead code.
**Fix:** Update description to "Submit rating after lesson completion." Remove any tip-related fields from the endpoint spec.

---

### CR-003 — Payment.bookingId NOT NULL will block P1 package purchase payments
**Severity:** Critical
**Source:** data-model.md — Payment entity, CHECK constraints
**UC:** UC-024 (P1)
**Problem:** `Payment CHECK: bookingId IS NOT NULL`. UC-024 (Beta, P1) creates a payment for a LessonPackage purchase, which has no bookingId at the time of purchase — the package is not linked to a specific booking. This schema constraint will prevent any payment record from being created for package purchases, making the entire package billing flow impossible without a schema migration.
**Fix:** Resolve OQ-059: decide whether to make `Payment.bookingId nullable` (and add a `lessonPackageId` FK), or introduce a separate `PackagePayment` entity. Decision required before P1 development begins.

---

## Significant Gaps

- **api-design.md — 16 missing endpoints**: `POST /api/v1/slot-reservations`, `POST /api/v1/guest-checkouts`, `PATCH /api/v1/bookings/:id/checkin`, `PATCH /api/v1/bookings/:id/reassign`, `PATCH /api/v1/bookings/:id/complete`, `PATCH /api/v1/bookings/:id/no-show`, `GET /api/v1/bookings/:id/notes`, `POST /api/v1/cancellation-policies`, `PATCH /api/v1/cancellation-policies/:id`, `PATCH /api/v1/cancellation-policies/:id/default`, `POST /api/v1/bookings/bulk-cancel`, `POST /api/v1/instructors/:id/certifications`, `POST /api/v1/users`, `POST /api/v1/auth/register` extended fields, `booking.completed` notification event, real-time push mechanism — P0 cannot be built from api-design.md alone.
- **api-design.md — `booking.completed` event missing**: Notification Service event list (api-design.md) does not include `booking.completed`. TR-013 requires this event to trigger the post-lesson review email. Review prompt will never fire without it.
- **ux-flows.md — 3 stale references**: §3 "Sync with Google Calendar (optional)" (deferred v1.5, OQ-021); §3 "Tips (if applicable)" (removed OQ-043); §5 "Pricing floors and seasonal rate cards" (removed OQ-042). These actively mislead developers reading ux-flows.md.
- **overview.md — Non-Goals incomplete**: Does not mention pricing floors removed from v1.0 scope (OQ-042). "AI-based…dynamic pricing" is listed as a v2.0 non-goal but seasonal rate cards are not. Minor inconsistency.
- **No password reset UC or endpoint**: `POST /api/v1/auth/register` and `POST /api/v1/auth/login` exist in api-design.md but no password reset flow is defined anywhere. Accounts will be locked out with no recovery path.
- **UC-013 — no auto-completion fallback**: If an instructor never taps Complete, `Booking.status` stays `confirmed` indefinitely. Student can never submit a rating. booking.completed event never fires. No timeout, ops escalation, or admin override flow is defined (see OQ-060).
- **TR gap analysis Item 11 — 409 error code undocumented**: `DELETE /api/v1/households/:id/learners/:learnerId` returns `409 LEARNER_HAS_ACTIVE_BOOKINGS` (OQ-036) but this error code is not in api-design.md's error format section. All custom error codes should be enumerated.

## Edge Cases Not Handled

- Instructor last-minute cancellation — **COVERED**: UC-006 alternate flow (OQ-058); instructor cancels own lesson, student notified, admin alerted.
- Payment capture succeeds but booking write fails — **COVERED**: UC-003 step 8 (OQ-053/056); 3 DB retries, then void with 4 retries at 100ms, void_pending if all fail.
- Waitlist offer expires unaccepted — **COVERED**: UC-029 alternate flow (OQ-034); slot moves to next FIFO entry.
- Resort switches processor mid-season — **COVERED**: UC-025 (P1, OQ-035); in-flight transactions resolved manually.
- Learner sub-profile deleted with active bookings — **COVERED**: UC-023 (P1, OQ-036); 409 LEARNER_HAS_ACTIVE_BOOKINGS.
- Weather cancellation during peak booking window — **COVERED**: UC-019; bulk cancel with refund; CASL transactional (OQ-044).
- Instructor freelancing across two tenants simultaneously — **COVERED**: OQ-041; no cross-tenant conflict detection in v1.0.
- Child waiver not signed at time of booking — **COVERED**: OQ-052; Smartwaiver deferred for P0; waiverToken=null.

---

## Slopebook Domain Risks

- **PCI scope not defined**: api-design.md states "PCI" flag on relevant TRs and PaymentMethod.processorTokenId is encrypted (OQ-046), but there is no statement of PCI DSS compliance scope (SAQ A, SAQ A-EP, or SAQ D). Stripe Elements and Shift4 embed both reduce scope, but the exact SAQ applicable to Slopebook is unstated. If either processor requires merchant-side tokenization handling, SAQ A does not apply and scope expands significantly.
- **PIPEDA gap for P0 guest data**: Right-to-erasure (UC-026) is P1. P0 will begin accumulating GuestCheckout PII with no erasure mechanism in production until P1 ships. If a guest requests erasure during Alpha, there is no supported workflow — only manual DB intervention.
- **Seasonal load — no capacity planning**: api-design.md mentions rate limiting "per tenant and per IP" but specifies no thresholds. Ski resort booking spikes (opening day, powder days) are extreme and predictable. No load target or autoscaling strategy is defined.
- **Child safety — client-supplied DOB not verified**: `Learner.dateOfBirth` and `GuestCheckout.learnerDateOfBirth` are self-reported and application-layer-only. A user submitting a false DOB bypasses the parentalConsentGiven requirement (OQ-032). No server-side age verification or audit trail for age claims exists.

---

## Minor Issues

- **ux-flows.md §3**: "optional digital signature" at Check-In is listed as a step — this is the Smartwaiver embed, deferred by OQ-052. Should be struck from ux-flows.md.
- **api-design.md — Authorization table**: Lists roles `guest`, `instructor`, `school_admin`, `operator`, `platform_admin` but does not describe the unauthenticated (public) path used by `POST /api/v1/slot-reservations` and `POST /api/v1/guest-checkouts`. Auth column is blank for public endpoints.
- **generate-summary-proposed.md (Run 7)**: Gap list counts 17 items but TR gap analysis in tech-requirements-proposed.md numbers only 16. Item 17 (`POST /api/v1/guest-checkouts`) is present in TR but labeled as item 15; `POST /api/v1/users` is item 16. The summary's numbering is off by one on the last two items.
- **UC-002 note**: References OQ-011 (15-minute TTL) but OQ-011 is in the resolved table and need not be cited per-step — it reads as unnecessary noise.
- **InstructorRating.rating**: CHECK constraint `rating >= 1 AND rating <= 5` exists in data-model.md but the asset-list RatingForm component says "1–5 star rating" — consistent. No issue.
