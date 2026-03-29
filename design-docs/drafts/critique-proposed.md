# Slopebook — Design Critique

**Prepared by:** Critic Agent
**Pipeline Run:** Run 6 (2026-03-28)
**Documents Reviewed:** overview.md, data-model.md (v0.3 source), api-design.md, ux-flows.md, open-questions.md, drafts/use-cases-p0-proposed.md, drafts/tech-requirements-proposed.md, drafts/asset-list-proposed.md

---

## Critical Issues

---

### CR-001 — UC-003 GuestCheckout record created after payment capture
**Severity:** Critical
**Source:** use-cases-p0-proposed.md UC-003 Main Flow steps 6–8
**UC:** UC-003
**Problem:** UC-003 step 6 captures payment, step 8 creates the GuestCheckout record. Payment cannot be attributed to a payer who does not yet exist. TR-003 correctly orders the calls (POST /api/v1/guest-checkouts → charge → booking), but the UC contradicts TR-003 and will mislead implementation.
**Fix:** Reorder UC-003 Main Flow: step 2 collects data, step 3 creates GuestCheckout, step 4 validates age/consent, step 5 collects payment details, step 6 captures payment, step 7 retries DB write.

---

### CR-002 — UC-021 admin walk-up booking violates Booking CHECK constraint
**Severity:** Critical
**Source:** use-cases-p0-proposed.md UC-021; data-model-proposed.md v0.4 §Booking
**UC:** UC-021
**Problem:** UC-021 step 2 says "enters customer details (or selects existing Learner)" without defining the path for a walk-up customer with no account. The Booking CHECK constraint requires `(learnerId IS NOT NULL) OR (guestCheckoutId IS NOT NULL)`. An admin booking for a new walk-up customer has neither — no account, no prior GuestCheckout. No mechanism is defined to create a GuestCheckout or ad-hoc Learner on the admin path.
**Fix:** Define the admin walk-up path explicitly: admin creates an ad-hoc GuestCheckout via `POST /api/v1/guest-checkouts` before booking creation, or add an `adminGuestDetails` payload field to `POST /api/v1/bookings` that creates the GuestCheckout inline.

---

### CR-003 — Booking.status = in_progress never triggered
**Severity:** Critical
**Source:** use-cases-p0-proposed.md UC-013 Preconditions; data-model-proposed.md v0.4 §Booking
**Problem:** Booking.status enum includes `in_progress` and UC-013 lists it as a valid precondition state. No P0 use case, TR, or API endpoint defines the transition from `confirmed` to `in_progress`. A time-based job, manual instructor action, or checkin trigger would all be valid approaches — but none is specified. Dead enum value causes undefined runtime state.
**Fix:** Add a UC or TR note specifying when `in_progress` is set: e.g. at `Booking.checkedInAt` set time (UC-010), or a scheduled job at lesson start time. Add the corresponding status transition to TR-010 or a new TR.

---

### CR-004 — Payment void failure is unhandled
**Severity:** Critical
**Source:** tech-requirements-proposed.md TR-003, TR-004; open-questions-proposed.md OQ-047/OQ-053
**UC:** UC-003, UC-004
**Problem:** TR-003/TR-004 specify that on 3rd DB write failure, `POST /api/v1/payments/:id/refund` is called to void the captured payment. No document defines what happens if the void itself fails — e.g., processor timeout, network error, or Stripe/Shift4 decline of the void. A captured payment with no booking and a failed void is unrecoverable without manual intervention and is a direct financial liability.
**Fix:** Define a compensation state: on void failure, write a `Payment.status = void_pending` record and queue for async retry with alerting. Specify maximum retry attempts and escalation path (e.g. ops alert after N hours).

---

## Significant Gaps

- **use-cases-p0-proposed.md UC-003 step 9** — "email sent in guest's preferred language" but GuestCheckout.preferredLanguage is never collected in the guest checkout flow (step 2 collects firstName, lastName, email, phone, DOB, skillLevel — no language). Default behaviour undefined.
- **api-design.md §Notification Service** — `booking.completed` event (emitted by UC-013 / TR-013) is absent from the event list; only `booking.confirmed`, `booking.cancelled`, `waitlist.slot_available`, `booking.reminder`, `lesson.weather_cancel` are defined. Post-lesson review prompt has no event trigger.
- **api-design.md §Booking Engine** — `PATCH /api/v1/bookings/:id` for instructor reassignment (TR-015) is not defined; api-design.md only has specific action endpoints (cancel, complete, no-show); a generic PATCH or a dedicated `PATCH /api/v1/bookings/:id/reassign` is needed.
- **api-design.md §Instructor** — Certification document upload endpoint (`POST /api/v1/instructors/:id/certifications`) absent; no file storage service (S3, CDN) strategy documented anywhere; `documentUrl` origin undefined.
- **tech-requirements-proposed.md TR-014** — Real-time admin schedule push mechanism flagged as "TBD (SSE vs WebSocket vs polling)"; this is an Alpha feature that requires a decision before implementation begins.
- **use-cases-p0-proposed.md** — No UC for instructor-initiated cancellation (instructor calls in sick, cancels own bookings). UC-006 covers customer and admin cancellation only. This is an operational gap that will create support burden from Alpha day one.
- **api-design.md §Account & Identity** — No `DELETE /api/v1/households/:id/learners/:learnerId` 409 error code documented for `LEARNER_HAS_ACTIVE_BOOKINGS` (required by UC-023 P1 and OQ-036); should be added to error format examples.
- **tech-requirements-proposed.md** — `POST /api/v1/slot-reservations` (TR-002) is a new endpoint not in api-design.md; the current booking payload uses `reservationId` field but no slot-reservation endpoint is defined; clarify relationship between `sessionToken` in booking payload and `SlotReservation.sessionToken`.

---

## Edge Cases Not Handled

- **Instructor last-minute cancellation:** No UC, no endpoint, no defined notification flow. Booking remains confirmed with no instructor. Admin sees conflict only at next schedule refresh.
- **Payment capture succeeds / void fails:** Handled as CR-004. No compensation state documented.
- **Waitlist offer expires unaccepted:** UC-028/029 cover FIFO exhaustion per OQ-034. Handled.
- **Resort switches processor mid-season:** OQ-035 resolved as manual. Handled with documented limitation.
- **Learner deletion with active bookings:** OQ-036 resolved block; 409 error code not in api-design.md (Significant Gap above).
- **Weather cancellation during peak window:** UC-019 bulk cancel covers this. Handled.
- **Instructor freelancing across two tenants:** OQ-041 accepted no detection. Handled.
- **Concurrent SlotReservation race condition:** Two guests simultaneously completing `POST /api/v1/slot-reservations` for the same slot — only the unique partial index `(instructorId, startAt, endAt) WHERE status = active` prevents double-booking; the second request receives a DB constraint violation, but the API error response and client-side handling for this race are not documented.
- **Pre-existing Learner records missing dateOfBirth:** OQ-032 now requires dateOfBirth for booking. Accounts created before enforcement have Learners without DOB. No backfill or prompt strategy is documented for this migration scenario.
- **GuestCheckout created, payment fails before booking write:** GuestCheckout record exists with no corresponding Booking. Orphaned GuestCheckout records are not discussed — no cleanup job or TTL defined.

---

## Slopebook Domain Risks

- **PIPEDA / child data:** `GuestCheckout.learnerDateOfBirth` is NOT NULL in v0.4 — mandatory collection of minor DOB as PII with no documented retention period or lawful basis statement. Heightened protection required under PIPEDA for data about minors.
- **PCI-DSS:** `PaymentMethod.processorTokenId` correctly marked `encrypted` in data-model-proposed.md v0.4, but design-docs/data-model.md (source) still has the old annotation. If engineers read the source before promotion, PCI gap reappears.
- **Payment void risk:** CR-004 documents a financial liability path with no compensation state. At Alpha scale (2 pilot schools), manual recovery is feasible; at Beta scale (10 customers), it is not.
- **Seasonal load:** Admin bulk cancel (UC-019) could affect hundreds of bookings simultaneously during a weather event at Christmas. No rate-limit or async processing strategy is defined for the bulk operation.
- **Orphaned GuestCheckout PII:** GuestCheckout records created during failed checkouts contain DOB and consent data with no defined TTL or cleanup process.

---

## Minor Issues

- **use-cases-p0-proposed.md UC-013** — `booking.completed` event named in step 3 but absent from api-design.md Notification Service event list (also flagged in Significant Gaps).
- **data-model-proposed.md v0.4 §GuestCheckout and §Learner** — `waiverToken` and `waiverStatus` fields present but will be null for all P0 records (OQ-052 deferred). Fields are harmless but add schema noise; document explicitly that these are reserved for post-P0 Smartwaiver integration.
- **api-design.md §Booking Engine** — Booking request payload shows `"sessionToken": "string | null"` — this appears to be `SlotReservation.sessionToken`, but TR-003 refers to it as `reservationId` (idempotency key scoped to reservationId). The field name is inconsistent across documents.
- **use-cases-p0-proposed.md UC-005 step 3** — validates "age ≥ 5" but this duplicates UC-003 step 3; the ≥5 minimum age check should be documented once in a shared precondition or a dedicated TR note, not duplicated across UCs.
- **overview.md §v1.0 GA** — still lists "Pricing floors and seasonal rate cards" as a GA deliverable; conflicts with OQ-042 removal decision. Source document needs update.
