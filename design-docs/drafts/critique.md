# Slopebook — Design Critique

**Prepared by:** Critic Agent
**Pipeline Run:** Run 3 (2026-03-26)
**Documents Reviewed:**
- `design-docs/overview.md`
- `design-docs/data-model.md` (v0.2)
- `design-docs/api-design.md`
- `design-docs/ux-flows.md`
- `design-docs/open-questions.md` (Run 2 update)
- `design-docs/drafts/use-cases.md` (Run 3)
- `design-docs/drafts/tech-requirements.md` (Run 3)
- `design-docs/drafts/asset-list-proposed.md` (Run 3)

---

## Critical Issues

Problems that would block a feature from working correctly or cause data loss, security vulnerabilities, or compliance failures.

---

### CR-001 — `OAuthToken` entity present in `data-model.md` after OQ-021 explicitly deferred it to v1.5

**Severity:** Critical
**Found In:** `data-model.md` §`OAuthToken`, §3 Key Relationships, §5 Encryption & PCI Scope
**Related Use Cases:** UC-025 (alternate flow 3a)
**Problem:**
- OQ-021 resolved that Google Calendar sync is deferred to v1.5. UC-025 and TR-025 both state `OAuthToken` must not appear in v1.0 code paths (DEFERRED-001).
- `data-model.md` v0.2 defines `OAuthToken` as a full entity (CRT-H-006) with field definitions, includes it in the key-relationships diagram under `User → OAuthToken`, and includes `accessToken` and `refreshToken` in the encryption table.
- Any engineer using the data model as the schema source of truth will implement the entity, create the migration, and wire up KMS encryption — all out-of-scope work.

**Suggested Resolution:** Remove `OAuthToken` from the entity listing, the relationship diagram, and the encryption table in `data-model.md`. Replace with a `DEFERRED-001` callout.

---

### CR-002 — `Payment.groupSessionId` is defined in `data-model.md` but must not be implemented per OQ-031

**Severity:** Critical
**Found In:** `data-model.md` §`Payment` (CHECK constraint), §3 Key Relationships; `tech-requirements.md` TR-019, TR-031
**Related Use Cases:** UC-019, UC-020
**Problem:**
- OQ-031 (school-block billing) is unresolved. TR-019 and TR-031 both instruct engineers not to implement `Payment.groupSessionId`.
- `data-model.md` defines `Payment.groupSessionId` as a concrete field and adds a CHECK constraint requiring at least one of `bookingId` or `groupSessionId` to be non-null.
- This CHECK constraint is incompatible with `Payment.paymentType = package_purchase` (introduced in TR-017), where `bookingId` can legitimately be null and `groupSessionId` does not apply. The CHECK constraint will reject valid package-purchase payment records.
- The data model and tech requirements are in direct conflict.

**Suggested Resolution:** Remove `Payment.groupSessionId` from `data-model.md`. Remove or relax the CHECK constraint — a `package_purchase` payment has no `bookingId` or `groupSessionId`. Add a `DEFERRED-002` note. Revisit when OQ-031 is resolved.

---

### CR-003 — Seven entities and fields required for Beta are absent from `data-model.md` v0.2

**Severity:** Critical
**Found In:** `data-model.md` v0.2 (absent throughout); `tech-requirements.md` TR-010, TR-017, TR-018, TR-019 (SC-001 through SC-007, SC-016)
**Related Use Cases:** UC-010, UC-017, UC-018, UC-019
**Problem:**
- The following are confirmed Beta deliverables but do not appear in `data-model.md` v0.2:
  - `InstructorRating` (full entity)
  - `Instructor.ratingAvg`, `Instructor.ratingCount`
  - `LessonPackage`, `LessonPackageTemplate`, `PackageRedemption`
  - `Payment.paymentType`
  - `Booking.lessonPackageId`
- Engineering cannot write migrations or implement the booking engine's package-redemption or post-lesson rating paths without these entities.

**Suggested Resolution:** Promote `data-model.md` to v0.3 and add all missing entities and fields before Beta development begins.

---

### CR-004 — `Tenant.paymentModel` field is absent from `data-model.md` despite being required for Shift4 dual-routing (OQ-005, OQ-024)

**Severity:** Critical
**Found In:** `data-model.md` §`Tenant` (absent); `tech-requirements.md` TR-039 (SC-014, GAP-007); `open-questions.md` OQ-005, OQ-024
**Related Use Cases:** UC-039
**Problem:**
- OQ-005 resolved a dual Shift4 routing model (`direct_merchant` vs `platform_mid`). OQ-024 refined this.
- TR-039 explicitly lists `Tenant.paymentModel enum(direct_merchant, platform_mid) nullable` as absent from v0.2 (SC-014).
- The Payment Service routing predicate — which decides which Shift4 MID to use — cannot be written without this field.

**Suggested Resolution:** Add `paymentModel enum(direct_merchant, platform_mid) nullable default null` to the `Tenant` entity.

---

### CR-005 — `PATCH /api/v1/bookings/:id/checkin` is absent from `api-design.md`

**Severity:** Critical
**Found In:** `api-design.md` §Booking Engine (absent); `tech-requirements.md` TR-022
**Related Use Cases:** UC-022
**Problem:**
- `data-model.md` defines the `confirmed → in_progress` transition triggered by check-in.
- TR-022 specifies `PATCH /api/v1/bookings/:id/checkin` as a new required endpoint (sets `Booking.checkedInAt`, transitions status, stores Smartwaiver token).
- This endpoint is entirely absent from `api-design.md`. The instructor PWA and backend will be built against incompatible assumptions without a formal API contract.

**Suggested Resolution:** Add `PATCH /api/v1/bookings/:id/checkin` to the Booking Engine section of `api-design.md` with request/response schema.

---

### CR-006 — Certification sub-resource endpoints are absent from `api-design.md`

**Severity:** Critical
**Found In:** `api-design.md` §Instructor Service (absent); `tech-requirements.md` TR-031
**Related Use Cases:** UC-031
**Problem:**
- UC-031 is P0. Five endpoints required to support it are missing from `api-design.md`:
  - `GET /api/v1/instructors/:id/certifications`
  - `POST /api/v1/instructors/:id/certifications`
  - `PATCH /api/v1/instructors/:id/certifications/:certId`
  - `DELETE /api/v1/instructors/:id/certifications/:certId`
  - `POST /api/v1/instructors/:id/certifications/:certId/document`
- Without these, the admin cannot add certifications, the expiry alerting background job has no data to operate on, and the booking-assignment eligibility check cannot block expired instructors.

**Suggested Resolution:** Add all five endpoints to the Instructor Service section of `api-design.md`.

---

### CR-007 — The right-to-erasure tool has no defined API endpoints in `api-design.md`

**Severity:** Critical
**Found In:** `api-design.md` (absent); `tech-requirements.md` TR-037; `use-cases.md` UC-037
**Related Use Cases:** UC-037
**Problem:**
- TR-037 defines two required endpoints: `POST /api/v1/admin/erasure-requests` and `POST /api/v1/admin/erasure-requests/:id/confirm`.
- Neither appears in `api-design.md`.
- This is a GDPR/PIPEDA compliance feature required for Beta (P1). Without the API contract, the feature cannot be built.

**Suggested Resolution:** Add both erasure endpoints to `api-design.md` under a Data Privacy section, with auth constraints documented.

---

### CR-008 — `InstructorTenant.onboardingStatus` is missing the `rejected` state required by the onboarding workflow

**Severity:** Critical
**Found In:** `data-model.md` §`InstructorTenant`; `tech-requirements.md` TR-036 (SC-017, GAP-010)
**Related Use Cases:** UC-036
**Problem:**
- The enum is `(pending, approved, inactive)`. TR-036 requires adding `rejected`.
- Without it, a rejected profile has no valid state: `pending` misrepresents the outcome, `inactive` conflates rejection with voluntary inactivation.
- The resubmission path (UC-036 alternate flow 4a) depends on this state.

**Suggested Resolution:** Update `InstructorTenant.onboardingStatus` to `enum(pending, approved, rejected, inactive)`. Define transitions: `pending → approved`, `pending → rejected`, `rejected → pending` (after resubmission).

---

### CR-009 — `PATCH /api/v1/tenants/:id` is absent from `api-design.md`

**Severity:** Critical
**Found In:** `api-design.md` (absent); `tech-requirements.md` TR-038 (GAP-011)
**Related Use Cases:** UC-038
**Problem:**
- The Resort Operator's primary configuration use case (UC-038) — setting currency, default language, and cancellation policy — has no API endpoint.
- TR-038 explicitly flags this as GAP-011.
- The operator portal is a v1.0 GA deliverable; without this endpoint, the entire configuration surface cannot function.

**Suggested Resolution:** Add `PATCH /api/v1/tenants/:id` to `api-design.md` under a Tenant Management section, with operator/platform_admin scope restrictions and the `hasPendingBookings` warning flag for currency changes.

---

### CR-010 — OQ-023 resolution text is internally contradictory regarding `tipAmountCents`

**Severity:** Critical
**Found In:** `open-questions.md` OQ-023
**Problem:**
- The narrative section of the resolution states: "tipAmountCents removed from booking payload. Tip and rating submitted via a separate post-lesson flow."
- The field specification section of the same resolution lists: `tipAmountCents: integer, nullable, must be >= 0 if present` as a booking payload addition.
- These two statements directly contradict each other in the same decision block.
- TR-010 and UC-010 follow the post-lesson interpretation. Engineers reading the payload additions list may implement `tipAmountCents` in the booking endpoint, creating a parallel code path.

**Suggested Resolution:** Remove `tipAmountCents` from the OQ-023 payload additions list. The booking payload additions should list only `reservationId` and `sessionToken`.

---

### CR-011 — `paymentCredentials` appears twice in the `Tenant` entity definition

**Severity:** Critical
**Found In:** `data-model.md` §`Tenant` (duplicate field at lines 83–84)
**Problem:**
- The `Tenant` entity block contains two separate `paymentCredentials encrypted json` lines.
- This will produce a duplicate column in any migration script generated from the model, causing either a migration failure or silent field collision.

**Suggested Resolution:** Remove the duplicate line. Retain the annotated version with the OQ-005 cross-reference.

---

## Significant Gaps

Missing flows, unhandled states, or use cases with no corresponding technical or UI coverage.

---

### GAP-A — No use case, tech requirement, or API endpoint for admin creation of a single `GroupSession`

`GroupSession` records are the parent for all group-lesson bookings, but no `POST /api/v1/group-sessions` endpoint (single-session creation) exists in `api-design.md`. TR-033 defines `POST /api/v1/group-sessions/bulk-create` for recurring programs, but bulk creation does not substitute for creating one session. Found in: `api-design.md` (absent), `tech-requirements.md` TR-033.

---

### GAP-B — The post-lesson review endpoint schema is absent from `api-design.md`

`api-design.md` lists `POST /api/v1/bookings/:id/review` as a one-line entry only. The request payload, response schema, auth mechanism for guest-checkout users (one-time review token, not a JWT), and the tip charge sub-flow are defined only in TR-010. The API contract is incomplete. Found in: `api-design.md` §Booking Engine, `tech-requirements.md` TR-010.

---

### GAP-C — No mechanism for a guest-checkout user to self-cancel a booking

UC-008 applies to authenticated guests only. A guest who booked without an account cannot self-cancel: `PATCH /api/v1/bookings/:id/cancel` requires a JWT, and the confirmation email has no cancel link. The only path is contacting the school. This will generate support volume above the 2% target. Found in: `use-cases.md` UC-008, `api-design.md` §Booking Engine.

---

### GAP-D — No instructor-facing endpoint to retrieve a learner's waiver status before check-in

TR-022 requires `Learner.waiverStatus` to be checked at check-in. The `GET /api/v1/schedule` endpoint's response schema does not specify whether waiver status is included, and there is no `GET /api/v1/learners/:id/waiver-status` or equivalent. Found in: `api-design.md` §Scheduling (absent), `tech-requirements.md` TR-022.

---

### GAP-E — `Certification.alertSentAt` in `data-model.md` is a single field, but TR-031 requires three separate threshold fields

`data-model.md` defines `Certification.alertSentAt timestamp nullable`. TR-031 explicitly requires replacing it with `alert60SentAt`, `alert30SentAt`, and `alert7SentAt`. The background job described in TR-031 queries these three fields — none of which exist in the current schema. Found in: `data-model.md` §`Certification`, `tech-requirements.md` TR-031 (SC-015, GAP-008).

---

### GAP-F — No `GroupSessionInstructor` join table exists in `data-model.md` despite being required by TR-020

`GroupSession.instructorId` is a single FK. TR-020 requires a `GroupSessionInstructor` join table for multi-instructor sessions (SC-018, GAP-014). Admin cannot assign additional instructors when the ratio is strained without this entity. Found in: `data-model.md` §`GroupSession`, `tech-requirements.md` TR-020.

---

### GAP-G — No admin endpoints or UI for `LessonPackageTemplate` management

Guests browse package offerings (UC-017), but nothing defines how admins create, edit, or deactivate those templates. No `POST/PATCH/DELETE /api/v1/lesson-package-templates` endpoint exists in `api-design.md`. Found in: `api-design.md` (absent), `tech-requirements.md` TR-017.

---

### GAP-H — Webhook retry/backoff policy is explicitly undefined

UC-042 explicitly flags this: "Retry/backoff policy for failed webhook deliveries not yet specified." `Webhook.failureCount` exists but the auto-deactivation threshold is not defined. This is a v1.0 GA feature. Found in: `use-cases.md` UC-042, `data-model.md` §`Webhook`.

---

### GAP-I — No use case or flow for what happens when Smartwaiver is available but returns errors during check-in

TR-022 defines the mountain-wireless typed-name fallback (connectivity loss). It does not define behaviour when the PWA has connectivity but Smartwaiver returns a 5xx error or CORS failure. The check-in flow could silently allow lessons without waivers being captured. Found in: `tech-requirements.md` TR-022.

---

## Edge Cases Not Handled

---

### EC-001 — Instructor cancels at the last minute

No use case addresses instructor-initiated cancellation or same-day unavailability after a confirmed booking exists. UC-025 warns of conflicts when availability is overridden but does not define:
- Guest notification that their instructor is unavailable.
- Automatic or admin-assisted rebooking path.
- Time SLA for admin to resolve.
- Refund/compensation policy when the school (not the guest) causes the disruption.

UC-030 (reassign) assumes admin awareness. The detection and notification path is missing entirely.

---

### EC-002 — Payment capture succeeds but the booking write fails

UC-004 and TR-004 require the booking + payment write to be atomic. However, the processor charge is an external API call that cannot be inside a DB transaction. If the charge succeeds and the DB write fails (deadlock, constraint violation, timeout), the guest is charged with no booking. No recovery path — orphaned-charge detection, automatic void, or idempotency-key reconciliation — is specified. `api-design.md` mentions idempotency keys but not the failure recovery logic. Found in: `use-cases.md` UC-004, `tech-requirements.md` TR-004, `api-design.md` §Non-Functional.

---

### EC-003 — Waitlist offer expires and no one accepts; ordering and exhaustion behaviour undefined

UC-016 (alternate flow 3a) states the slot is offered to the "next waitlisted user (by position, then by registration time)." Problems:
- "Position" is not a stored field on `WaitlistEntry`.
- No cap on how many consecutive entries can be cycled before the slot returns to general inventory.
- No admin notification when the entire waitlist is exhausted without acceptance.
- No defined ordering algorithm is implemented anywhere in the API or data model.

---

### EC-004 — Resort switches payment processor mid-season

`data-model.md` documents that `PaymentMethod` records are invalidated on a processor switch. Not addressed:
- Upcoming bookings with payments already captured on the old processor must still be refunded via the old processor. Replacing credentials immediately eliminates this capability.
- Partial refunds in flight at the time of the switch have `Payment.processor = old_processor` but the tenant's credentials now point to the new processor.
- Old processor webhooks will fail HMAC verification against the new `webhookSecret`, breaking all historical refund webhooks.

No "processor transition period" concept exists in the model or API.

---

### EC-005 — Learner sub-profile deleted with active bookings

`DELETE /api/v1/households/:id/learners/:learnerId` has no documented preconditions. `Booking.learnerId` is a FK. If a learner with confirmed upcoming bookings is deleted and no DB-level CASCADE is defined, the FK becomes dangling. No behaviour is defined: block deletion if bookings exist, cascade-cancel, or convert to `guestCheckoutId`. Found in: `api-design.md` §Account & Identity Service, `data-model.md` §`Learner`.

---

### EC-006 — Soft-hold expires during account-creation step of checkout

UC-005 places account registration between soft-hold creation and payment. TR-005 states the `SlotReservation` must remain valid across registration. If a guest takes longer than 15 minutes to register (OQ-011 fixed TTL), the hold expires. UC-005 has no alternate flow for this case; UC-003 alternate flow 6a covers expiry at payment but not mid-registration. Found in: `use-cases.md` UC-005, `tech-requirements.md` TR-005.

---

### EC-007 — Group session cancelled at the session level (not individual bookings)

`GroupSession.status = cancelled` exists in the enum but no flow sets it. No use case covers cancelling a `GroupSession` as a whole entity (e.g., sole instructor becomes unavailable for a week-long camp). The notification path to all enrolled learners for a session-level cancellation is undefined. Found in: `data-model.md` §`GroupSession`, `use-cases.md` §6.

---

### EC-008 — Package-redeemed booking cancelled by the guest before the lesson

UC-018 decrements `LessonPackage.remainingCount` at booking. If the guest cancels (UC-008), no behaviour is defined for the package credit:
- Is `remainingCount` reinstated (credit restored)?
- Is it forfeited?
`CancellationPolicy.refundRules` is expressed as `refundPercent` but there is no cash to refund on a package-redeemed booking. The intersection of cancellation policy and package redemption is entirely unaddressed. Found in: `use-cases.md` UC-008, UC-018; `data-model.md` §`CancellationPolicy`.

---

### EC-009 — Smartwaiver service outage during high-volume check-in periods

The entire waiver flow depends on a single third-party (Smartwaiver, OQ-029). The typed-name fallback covers mountain wireless loss, but a full Smartwaiver API outage (CORS failure, CDN down, certificate error) would prevent the embed from loading at all, potentially leaving instructors with no fallback trigger and no waiver path for minors. No circuit-breaker, SLA, or vendor redundancy is described. Found in: `tech-requirements.md` TR-022, `use-cases.md` UC-022.

---

### EC-010 — Multi-tenant instructor double-booked across two resorts simultaneously

A freelance instructor can set overlapping availability at Resort A and Resort B. The booking engine checks conflicts within a single tenant's JWT scope only. Nothing prevents simultaneous bookings at different resorts for the same time slot. This is the most likely mechanism by which the "< 0.5% double-booking rate" KPI is missed. Found in: `data-model.md` §4 Multi-Tenancy Notes, `api-design.md` §Scheduling & Availability Service.

---

## Unstated Assumptions

---

### UA-001 — A `Household` is automatically created for every new authenticated user, but no API call or use-case postcondition defines this

TR-005 states: "A `Household` is created automatically for the new user on first registration." This is not in any use case as an explicit postcondition, not shown as an API call in `api-design.md`, and not enforced in the data model. A user without a `Household` cannot add learners or store payment methods.

---

### UA-002 — `Tenant.currency` is assumed safe to change mid-season without retroactive data impact

UC-038 permits a currency change with a warning. It is assumed all historical `Payment.amountCents` and `LessonType.priceAmount` values are denominated in the original currency with no conversion needed. Revenue reports aggregating across a currency change would combine incompatible denominations. This is never stated and the reporting service has no currency-change event horizon.

---

### UA-003 — `school_admin` and `operator` roles are mutually exclusive per JWT

No role hierarchy is documented. It is assumed a user cannot hold both roles simultaneously. An operator who also directly manages one school has no defined role model.

---

### UA-004 — Active `SlotReservation` records are excluded from available slot results in `GET /api/v1/availability`

This is never stated in `api-design.md` or the scheduling service description. If soft-holds are not excluded from availability queries, two guests can hold the same slot simultaneously, and the second to complete payment fails at booking time rather than at slot selection — a much worse UX.

---

### UA-005 — The booking engine validates that `Booking.instructorId` has an approved `InstructorTenant` row for `Booking.tenantId`

`Instructor` has no `tenantId` field. The constraint preventing cross-tenant instructor assignment is described only in prose in `data-model.md` §4 as "application layer enforcement." It is not in `api-design.md`'s auth section and is not a DB constraint. It can be silently omitted by any engineer who does not read the full multi-tenancy notes section.

---

### UA-006 — `GuestCheckout.preferredLanguage` is the sole mechanism for language-routing post-lesson review emails to guest-checkout users

The post-lesson review email is sent to a user without an account. There is no mechanism for them to correct a wrong locale after booking. The language is captured once from browser locale at checkout and is immutable.

---

### UA-007 — "Pricing floors and seasonal rate cards" promised in the operator portal have no data model support and are effectively deferred despite appearing in `overview.md` and UC-038 as v1.0 GA features

TR-038 explicitly states these are "not in scope for v1.0 without a formal product decision (GAP-013)." The overview roadmap and UC-038 both include them as v1.0 GA deliverables. The operator portal will launch without a feature listed in the product overview.

---

### UA-008 — Smartwaiver's document-deletion API satisfies GDPR/PIPEDA right-to-erasure for waiver documents

OQ-026 defines erasure scope across Slopebook entities but does not mention `Learner.waiverToken` or the underlying Smartwaiver document. Nullifying the token in Slopebook's DB leaves the waiver document at Smartwaiver untouched. Whether Smartwaiver supports document deletion via API and whether Slopebook is contractually obligated to invoke it are unstated.

---

## Slopebook-Specific Concerns

---

### SC-A — Seasonal booking volume spikes: no load model, no burst strategy

The overwhelming majority of ski resort bookings occur in a 3-month window. No load model (concurrent users, bookings-per-minute at peak), read replica strategy, or caching policy is defined for `GET /api/v1/availability` — the hottest endpoint. The p95 2-second target is stated but cannot be tested or validated without a load model. Found in: `overview.md` §Success Metrics, `api-design.md` §Non-Functional.

---

### SC-B — Weather-driven cancellation spikes can produce a synchronous refund storm exceeding processor rate limits

UC-029 (weather bulk-cancel, P0) issues 200+ refund API calls simultaneously. Both Stripe and Shift4 enforce rate limits on refund APIs. TR-029 acknowledges async processing for large batches but does not specify queue-based dispatch, rate-limit awareness, or exponential backoff for the refund calls. A naive implementation hits 429 responses, leaving many bookings "cancelled but refund pending" with no automatic retry. Found in: `use-cases.md` UC-029, `tech-requirements.md` TR-029.

---

### SC-C — Freelance instructor cross-tenant double-booking is undetectable by the booking engine

As noted in EC-010. The booking engine's conflict check is JWT-scoped to one tenant. A freelance instructor approved at two resorts can be double-booked across tenants. This directly threatens the `< 0.5% double-booking rate` KPI in `overview.md`. Found in: `data-model.md` §4 Multi-Tenancy, `overview.md` §Success Metrics.

---

### SC-D — Parental consent for minors has no persistence target in the schema (OQ-032 unresolved)

FORM-003 collects a required parental consent checkbox for under-18 learners. OQ-032 is unresolved and the `Learner` entity in `data-model.md` v0.2 has no `parentalConsentGiven` or `parentalConsentAt` fields. A booking for a 7-year-old can be confirmed with no auditable record that an adult consented. This is a child safety liability gap. Alpha is targeting pilot ski schools in Q2 2026 — if children are enrolled in Alpha, this gap exists from day one. Found in: `data-model.md` §`Learner`, `open-questions.md` OQ-032, `tech-requirements.md` TR-011.

---

### SC-E — PCI-DSS: `PaymentMethod.processorTokenId` is unencrypted with inadequate justification

`data-model.md` §5 states `processorTokenId` is "non-sensitive... useless without processor credentials." This does not satisfy PCI-DSS SAQ-A-EP. Processor vault tokens are card-linked identifiers; their exposure combined with separately-stored processor credentials enables charges. "Database-level access controls" alone is not a compliant protection posture for card-linked data. Found in: `data-model.md` §5 Encryption & PCI Scope.

---

### SC-F — PIPEDA: `User.phone` collected at Alpha from Canadian resorts without documented consent, retention, or access-request flow

`overview.md` places the PIPEDA compliance audit at v1.5. However, if phone numbers are collected from Canadian users at Alpha (Q2 2026), PIPEDA obligations apply from the first collection event. The model provides no consent capture mechanism for phone collection, no defined retention period, and no data-access (not just erasure) path for PIPEDA compliance. Found in: `data-model.md` §`User`, §5 `User.phone` PII Considerations; `overview.md` §Release Roadmap.

---

### SC-G — CASL: weather-cancellation emails include a "rebooking link" that may classify them as commercial messages under CASL

CASL applies to Canadian resorts. Booking confirmations and cancellations are transactional and exempt. UC-029 includes a "rebooking link" in the weather-cancellation email — a commercial call-to-action. If this link causes the message to be classified as commercial, prior express consent is required, which guest-checkout users have not provided. The notification service has no CASL message-type classification. Found in: `use-cases.md` UC-029, `api-design.md` §Notification Service.

---

### SC-H — `ux-flows.md` still shows Google Calendar sync as a current instructor feature despite OQ-021 deferring it to v1.5

`ux-flows.md` §3 lists "Sync with Google Calendar (optional)" under Availability Management as an existing feature. OQ-021 and TR-025 explicitly state it is deferred and must not appear in v1.0 code paths. Engineers reading `ux-flows.md` as a design reference will build calendar sync UI affordances. This compounds CR-001 (`OAuthToken` still in the data model). Found in: `ux-flows.md` §3, `open-questions.md` OQ-021.
