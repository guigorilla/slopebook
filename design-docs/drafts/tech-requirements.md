# Slopebook — Technical Requirements

**Document Status:** Draft
**Last Updated:** 2026-03-26
**Author:** Tech Lead Agent
**Pipeline Run:** Run 3 (2026-03-26)

---

## Resolved Open Questions Reflected in This Document

| OQ | Decision Summary |
|---|---|
| OQ-023 | Tip/rating submitted via `POST /api/v1/bookings/:id/review` — separate post-lesson flow, not in booking payload. `reservationId` (UUID, nullable) and `sessionToken` (string, nullable) added to booking payload. |
| OQ-024 | Starter = Stripe-only. Shift4 requires Growth tier minimum. Three credential schemas defined (see TR-039). No platform MID or PayFac in v1.0. |
| OQ-025 | Expired package credits are forfeited. Admin can manually extend `LessonPackage.expiresAt`. |
| OQ-026 | Right-to-erasure scope fully defined per entity (see TR-037). |
| OQ-027 | Platform fee (1.5%) charged at package purchase time. Tips excluded from fee base for standard bookings. Platform fee applies to tip charges. |
| OQ-028 | Ratings are internal-only. Platform-admin moderation only. No minimum booking count. Rating available immediately after `booking.status = completed`. |
| OQ-029 | Smartwaiver is the e-signature provider. Provides API and mobile-compatible embed. |

**Unresolved Open Questions Affecting This Document:**

| OQ | Status | Impact |
|---|---|---|
| OQ-030 | UNRESOLVED | Whether FR is suppressed on Starter tier for `customer` and `instructor` apps. Until resolved, FR is treated as available on all tiers for those surfaces. |
| OQ-031 | UNRESOLVED | Whether school-block billing (single payment for a group session) is in scope. `Payment.groupSessionId` FK must not be implemented until resolved. |
| OQ-032 | UNRESOLVED | Whether `parentalConsentGiven boolean` and `parentalConsentAt timestamp` should be added to `Learner`. These fields must be schema-frozen before Beta. |

---

## Release Scope Summary

| Phase | Target | Key Deliverables |
|---|---|---|
| Alpha | Q2 2026 | Core booking engine, Stripe + Shift4 abstraction, instructor availability, admin scheduler, EN/FR on customer + instructor apps |
| Beta | Q3 2026 | Group lessons, lesson packages, household accounts, card-on-file, waitlist, earnings dashboard, post-lesson tip + rating, EN/FR on admin + operator apps |
| v1.0 GA | Q4 2026 | White-label widget, operator portal, revenue analytics, full public launch |

---

## TR-001 — Browse and Select a Lesson Type

**Use Case:** UC-001
**Affected Services:** Catalog & Lesson Service, Scheduling & Availability Service
**API Changes Required:**
  - `GET /api/v1/lesson-types` must suppress `category = group` lessons for Starter-tier tenants. Tenant tier is resolved from JWT (or from embed context for unauthenticated requests); group lesson types must not be returned when `Tenant.subscriptionTier = starter`.
  - `GET /api/v1/availability?lessonTypeId=&date=&skillLevel=` is already defined. No new endpoint needed.
**Data Model Changes Required:**
  - None beyond v0.2. `LessonType.category`, `LessonType.skillLevels`, and `Tenant.subscriptionTier` are all already in v0.2.
**Auth & Permissions:** Public (unauthenticated) for the widget. `school_admin` and `operator` for lesson type management endpoints.
**Multi-tenancy Notes:** `GET /api/v1/lesson-types` must be scoped to the tenant resolved from the widget embed context or JWT. Tenant must never be accepted as a raw query parameter from the client.
**i18n Notes:** `LessonType.nameEn` and `LessonType.nameFr` both returned. Client selects the appropriate field. Fallback to the available variant when only one is populated (UC-001 alternate flow 3a).
**Performance Notes:** `GET /api/v1/availability` must respond within 2 seconds at p95. Index on `(tenantId, lessonTypeId, startAt)` on `Availability` required.
**Open Technical Questions:** OQ-030 (unresolved) — if FR is suppressed on Starter tier for the customer app, the language toggle must also be suppressed here. Until resolved, render toggle for all tiers.

---

## TR-002 — Browse Instructor Profiles

**Use Case:** UC-002
**Affected Services:** Instructor Service
**API Changes Required:**
  - `GET /api/v1/instructors` must accept `lessonTypeId` and `skillLevel` query parameters to return only eligible instructors. These filters are currently undocumented in api-design.md. Add them formally to the API contract.
  - Response must include: `photoUrl`, `displayName`, `bioEn`, `bioFr`, `languagesSpoken`, certifications (body + level), `ratingAvg`, `ratingCount`.
  - Individual `InstructorRating` records must NOT be exposed via any public-facing API endpoint. Only denormalised aggregates (`ratingAvg`, `ratingCount`) are returned in public responses.
**Data Model Changes Required:**
  - `Instructor.ratingAvg decimal(3,2) nullable` and `Instructor.ratingCount integer default 0`: absent from data-model.md v0.2. Must be added. (SC-001, SC-002 — Additive to v0.2.)
  - `InstructorRating` entity: absent from data-model.md v0.2. Must be added. (SC-003 — see Gap Analysis GAP-001.)
**Auth & Permissions:** Public (unauthenticated) for the booking widget. Aggregate rating values (`ratingAvg`, `ratingCount`) are included in public responses per OQ-028. Individual rating records are internal-only with no public endpoint. Platform admins only for moderation and removal.
**Multi-tenancy Notes:** Instructor list scoped to instructors with `InstructorTenant.tenantId = [current tenant]` and `InstructorTenant.onboardingStatus = approved`.
**i18n Notes:** `bioEn` and `bioFr` both returned; client selects. Fallback to available language if only one is populated.
**Performance Notes:** Index on `(tenantId, onboardingStatus)` on `InstructorTenant` required. Instructor list for a tenant with 50+ instructors must respond within 2 seconds at p95.
**Open Technical Questions:** None. OQ-028 resolved.

---

## TR-003 — Select a Date and Time Slot (with Soft Hold)

**Use Case:** UC-003
**Affected Services:** Scheduling & Availability Service, Booking Engine
**API Changes Required:**
  - New endpoint: `POST /api/v1/slot-reservations` — creates a `SlotReservation`. Request: `{ lessonTypeId, instructorId, startAt, endAt }`. Response: `{ reservationId: uuid, sessionToken: string, expiresAt: timestamp }`.
  - New endpoint: `DELETE /api/v1/slot-reservations/:id` — explicit release on guest abandonment (sets `status = released`).
  - `GET /api/v1/availability` already handles slot enumeration. No change needed.
**Data Model Changes Required:**
  - `SlotReservation` entity is already defined in v0.2 as a new entity (CRT-H-001). Covered by v0.2.
  - TTL is 15 minutes platform constant (OQ-011). `SlotReservation.expiresAt = now() + 15 minutes`. Not configurable per tenant.
  - `sessionToken` is an opaque cryptographically random string generated server-side. Unique partial index on `(instructorId, startAt, endAt) WHERE status = active` prevents duplicate holds at the DB layer.
**Auth & Permissions:** Unauthenticated guests may create a `SlotReservation`. `tenantId` is resolved from embed context, not client-supplied.
**Multi-tenancy Notes:** `SlotReservation.tenantId` set server-side from embed context.
**i18n Notes:** Countdown timer display is UI-only. No i18n impact at the service layer.
**Performance Notes:** Slot reservation creation must be inside a serialisable transaction or use SELECT FOR UPDATE. Background sweep runs at least every 5 minutes to expire stale holds. Redis TTL key recommended as a fast-path signal alongside the DB record.
**Open Technical Questions:** None. OQ-011 resolved (15-minute constant). OQ-023 resolved (`reservationId` and `sessionToken` field spec confirmed).

---

## TR-004 — Complete Guest Checkout (No Account)

**Use Case:** UC-004
**Affected Services:** Booking Engine, Payment Service, Account & Identity Service, Notification Service
**API Changes Required:**
  - `POST /api/v1/bookings` payload additions confirmed in OQ-023: `reservationId (uuid, nullable)`, `sessionToken (string, nullable)`. The `tipAmountCents` field is NOT in this payload — tips are submitted post-lesson via `POST /api/v1/bookings/:id/review`.
  - For guest checkout: the payload carries `guestCheckout: { email, firstName, lastName, phone? }` in place of a `learnerId`.
  - Booking response must include: confirmed booking record, payment capture confirmation, instructor details, `.ics` attachment URL, and confirmation email/SMS trigger.
**Data Model Changes Required:**
  - `GuestCheckout` entity (new entity CRT-H-003), `Booking.guestCheckoutId`, `Booking.learnerId` nullable, and `Payment.guestCheckoutId` are all Covered by v0.2.
  - Right-to-erasure disposition confirmed in OQ-026: pseudonymise `GuestCheckout.firstName/lastName/email/phone` to "ERASED"; nullify `Payment.guestCheckoutId` FK; retain all financial fields.
**Auth & Permissions:** No JWT required for guest checkout path. `tenantId` resolved from `reservationId` lookup or embed context.
**Multi-tenancy Notes:** `GuestCheckout.tenantId` is set server-side. A guest booking at two resorts creates two separate `GuestCheckout` records.
**i18n Notes:** Confirmation email sent in `GuestCheckout.preferredLanguage` (captured from browser locale at checkout). `.ics` content in same language.
**Performance Notes:** `POST /api/v1/bookings` including payment capture must complete end-to-end within 5 seconds at p95, excluding processor network latency. Booking + payment write must be atomic in a single DB transaction.
**Open Technical Questions:** None. OQ-023 and OQ-026 resolved.

---

## TR-005 — Create an Account and Book a Lesson

**Use Case:** UC-005
**Affected Services:** Account & Identity Service, Booking Engine, Payment Service, Notification Service
**API Changes Required:**
  - `POST /api/v1/auth/register` already defined. Must support mid-checkout registration without requiring a page reload; the `SlotReservation` and its `sessionToken` must remain valid across the registration step.
  - `POST /api/v1/payment-methods` to store card token if the user opts in.
  - The `sessionToken` and `reservationId` issued pre-registration are carried forward and included in the booking payload unchanged.
**Data Model Changes Required:**
  - No new entities beyond v0.2. `User.preferredLanguage` captures the language selected during registration.
**Auth & Permissions:** Registration is public. JWT is issued immediately on successful registration and used for the booking and payment-method calls that follow.
**Multi-tenancy Notes:** New `User.tenantId` set from the current tenant context. A `Household` is created automatically for the new user on first registration.
**i18n Notes:** Language preference set during registration stored in `User.preferredLanguage`. All subsequent communications use this value.
**Performance Notes:** JWT issuance must complete within 500 ms. The full registration-to-booking flow must not add more than 2 seconds to the checkout experience.
**Open Technical Questions:** None.

---

## TR-006 — Sign In and Book with Card on File

**Use Case:** UC-006
**Affected Services:** Account & Identity Service, Booking Engine, Payment Service
**API Changes Required:**
  - `POST /api/v1/auth/login`, `GET /api/v1/payment-methods`, `POST /api/v1/bookings` with `paymentMethodId` — all already defined.
  - On charge failure: `PaymentMethod.isValid` must be set to `false` when the processor confirms the token is invalid. API must surface a `PAYMENT_METHOD_INVALID` error code. Household must be notified to re-add payment details (OQ-004).
**Data Model Changes Required:**
  - `PaymentMethod.isValid boolean` is Covered by v0.2 (new field CRT-H-007).
**Auth & Permissions:** Guest role. Booking `learnerId` must belong to the authenticated user's household. Cross-household booking returns HTTP 403.
**Multi-tenancy Notes:** `PaymentMethod` records scoped to `householdId`. Processor switch atomically sets all household `PaymentMethod` records to `isValid = false`.
**i18n Notes:** Confirmation email in `User.preferredLanguage`.
**Performance Notes:** One-tap card-on-file checkout must complete within 5 seconds at p95.
**Open Technical Questions:** None. OQ-004 resolved: cross-processor vault migration deferred to v1.5.

---

## TR-007 — View Booking History and Receipts

**Use Case:** UC-007
**Affected Services:** Booking Engine
**API Changes Required:**
  - `GET /api/v1/bookings?learnerId=&status=&from=&to=` already defined. Must return only bookings where `Booking.learnerId` belongs to any learner in the authenticated user's household.
  - Response must include `BookingNote` records where `isSharedWithGuest = true`. This filter must be enforced at the API response layer, not only in the UI.
  - Guest-checkout bookings (no account at time of booking) are not visible in account history (UC-007 alternate flow 4b). Accessible only via the confirmation email link.
**Data Model Changes Required:**
  - `BookingNote.isSharedWithGuest boolean` — Covered by v0.2.
**Auth & Permissions:** Guest role. Restricted to the authenticated user's household learners.
**Multi-tenancy Notes:** Standard tenant scoping via JWT `tenantId`.
**i18n Notes:** None for data layer. Email receipts in `User.preferredLanguage`.
**Performance Notes:** Index on `(tenantId, learnerId, status)` on `Booking`. p95 < 2 seconds.
**Open Technical Questions:** None.

---

## TR-008 — Modify or Cancel an Upcoming Booking (Guest)

**Use Case:** UC-008
**Affected Services:** Booking Engine, Payment Service, Notification Service
**API Changes Required:**
  - `PATCH /api/v1/bookings/:id/cancel` already defined. Must: (a) apply `CancellationPolicy` snapshotted in `Booking.cancellationPolicyId` at booking time, (b) calculate and return refund amount before confirmation, (c) set `Booking.status = cancelled`, `cancelledAt`, `cancellationReason`, (d) release slot to inventory, (e) initiate refund, (f) dispatch cancellation notification.
  - No in-place modification endpoint — cancel-and-rebook is the only path in v1.0 (UC-008 alternate flow 2a). No `reschedule` endpoint.
  - Refund failure must not block booking cancellation. On processor failure: booking still transitions to `cancelled`; booking flagged for admin review; admin alert dispatched.
**Data Model Changes Required:**
  - `CancellationPolicy`, `Booking.cancellationPolicyId` (snapshot FK), `Booking.cancelledAt`, `Booking.cancellationReason`, `Payment.refundedAmountCents` — all Covered by v0.2.
**Auth & Permissions:** Guest role for own bookings. `school_admin` for any tenant booking.
**Multi-tenancy Notes:** Cancellation policy applied is the one snapshotted at booking time, not the current tenant default.
**i18n Notes:** Cancellation confirmation email in guest's language. EN and FR templates required for policy explanation text.
**Performance Notes:** Cancellation including refund initiation within 5 seconds at p95. Processor-side refund is async, reconciled via webhook.
**Open Technical Questions:** None. OQ-014 resolved: default policy is non-refundable.

---

## TR-009 — Switch Language Preference

**Use Case:** UC-009
**Affected Services:** Account & Identity Service, Notification Service
**API Changes Required:**
  - `PATCH /api/v1/me` to update `User.preferredLanguage`. Already defined. Must persist immediately.
**Data Model Changes Required:**
  - `User.preferredLanguage enum(en, fr)` — in baseline data model.
**Auth & Permissions:** Any authenticated user (guest role and above).
**Multi-tenancy Notes:** Language preference is user-level, not tenant-level. Applies across all tenant contexts for multi-tenant instructors.
**i18n Notes:** All notification services must read `User.preferredLanguage` at dispatch time (not at preference-change time) to handle mid-session changes correctly.
**Performance Notes:** Preference update must reflect immediately. p95 < 500 ms.
**Open Technical Questions:** OQ-030 (unresolved) — FR suppression on Starter tier. Render toggle for all tiers on the `customer` app until OQ-030 is resolved.

---

## TR-010 — Submit a Post-Lesson Tip and Rating

**Use Case:** UC-010
**Affected Services:** Booking Engine, Payment Service, Instructor Service, Notification Service
**API Changes Required:**
  - `POST /api/v1/bookings/:id/review` — the endpoint is listed in api-design.md (OQ-023 resolved). Accepts: `{ rating: integer 1–5 (optional), tipAmountCents: integer >= 0 (optional, only if tipsEnabled) }`.
  - Must validate `Booking.status = completed` before accepting submission.
  - Must validate `Tenant.tipsEnabled = true` before accepting `tipAmountCents`.
  - On rating submission: create `InstructorRating` record; update `Instructor.ratingAvg` and `Instructor.ratingCount` atomically.
  - On tip submission: initiate a separate charge via Payment Service. Platform fee (1.5%) does NOT apply to this charge — `Payment.platformFeeCents` must be 0 on tip-only payment records (OQ-027). Tip flows 100% to instructor.
  - Guest-checkout users without a stored card: endpoint must accept a one-time card token for the tip charge.
  - Rating submission and tip submission are independent — a rating failure must not roll back a submitted tip, and vice versa.
**Data Model Changes Required:**
  - `InstructorRating` entity: absent from v0.2. Must be added. (SC-003, GAP-001.)
  - `Instructor.ratingAvg` and `Instructor.ratingCount`: absent from v0.2. Must be added. (SC-001, SC-002, GAP-002.)
  - `Payment.paymentType enum(standard, package_purchase, tip) default standard`: absent from v0.2. Must be added. (SC-007, GAP-004.)
  - `Tenant.tipsEnabled boolean default false` and `Payment.tipAmountCents integer nullable` — Covered by v0.2.
**Auth & Permissions:** Guest role (authenticated, own completed bookings). Guest-checkout users access via a one-time review token embedded in the post-lesson email link. `platform_admin` only for rating moderation and removal — `school_admin` cannot edit or remove ratings (OQ-028).
**Multi-tenancy Notes:** Rating visible to guests browsing instructors within the same tenant. Not exposed via any public search-engine-indexed endpoint.
**i18n Notes:** Post-lesson email prompt in guest's language. Review flow UI in EN/FR.
**Performance Notes:** Rating write and denormalised field update must be atomic. p95 < 1 second.
**Open Technical Questions:** None. OQ-023, OQ-027, OQ-028 all resolved.

---

## TR-011 — Set Up a Household Account with Learner Sub-Profiles

**Use Case:** UC-011
**Affected Services:** Account & Identity Service
**API Changes Required:**
  - `POST /api/v1/households/:id/learners` already defined. Must enforce minimum age of 5 years from `dateOfBirth`. Must accept `parentalConsentGiven boolean` for under-18 learners (blocked pending OQ-032 schema resolution).
  - Skill-level override at checkout does NOT update `Learner.skillLevel` on the sub-profile. Override captured in `Booking.skillLevelAtBooking` only.
**Data Model Changes Required:**
  - `Learner.parentalConsentGiven boolean default false` and `Learner.parentalConsentAt timestamp nullable`: absent from v0.2. Must be added before Beta schema freeze once OQ-032 is resolved. (SC-010, SC-011, GAP-017.)
  - When added, these fields must be explicitly flagged as erasure-exempt in the right-to-erasure tool (legal consent record).
  - `Booking.skillLevelAtBooking` — Covered by v0.2.
**Auth & Permissions:** Guest role. Users can only create learners under their own household.
**Multi-tenancy Notes:** `Household.tenantId` scopes all learner operations.
**i18n Notes:** Age-gate guidance message must have EN and FR variants.
**Performance Notes:** Learner creation is low-frequency. No specific performance concern.
**Open Technical Questions:** OQ-032 (unresolved) — must be resolved before Beta schema freeze.

---

## TR-012 — Book a Lesson on Behalf of a Household Member

**Use Case:** UC-012
**Affected Services:** Account & Identity Service, Booking Engine, Payment Service
**API Changes Required:**
  - `POST /api/v1/bookings` with `learnerId` referencing a learner in the authenticated user's household. Booking engine validates `Booking.learnerId` belongs to the authenticated household. Cross-household booking returns HTTP 403.
  - Inline learner add during checkout: `POST /api/v1/households/:id/learners` called within the booking flow. Soft-hold timer continues during this inline step.
**Data Model Changes Required:**
  - No new entities beyond v0.2.
**Auth & Permissions:** Guest role. Head of Household may book for any learner in their household.
**Multi-tenancy Notes:** Standard tenant scoping.
**i18n Notes:** Confirmation email to Head of Household in their `User.preferredLanguage`.
**Performance Notes:** Inline learner creation must not add more than 1 second to the checkout flow.
**Open Technical Questions:** None.

---

## TR-013 — View All Upcoming Lessons for the Household

**Use Case:** UC-013
**Affected Services:** Booking Engine
**API Changes Required:**
  - `GET /api/v1/bookings?status=confirmed,in_progress&from=[today]` scoped to all learners in the authenticated household. Must support multi-learner household scoping in a single query.
**Data Model Changes Required:**
  - No changes beyond v0.2.
**Auth & Permissions:** Guest role. Scoped to the authenticated user's household.
**Multi-tenancy Notes:** Standard tenant scoping.
**i18n Notes:** None for data layer. UI date/time formatting is locale-dependent.
**Performance Notes:** Index on `(tenantId, learnerId, status, startAt)` on `Booking`. p95 < 2 seconds.
**Open Technical Questions:** None.

---

## TR-014 — Manage Stored Payment Methods

**Use Case:** UC-014
**Affected Services:** Account & Identity Service, Payment Service
**API Changes Required:**
  - `GET /api/v1/payment-methods`, `POST /api/v1/payment-methods`, `DELETE /api/v1/payment-methods/:id`, `PATCH /api/v1/payment-methods/:id/default` — all already defined.
  - `DELETE` response must include `hasUpcomingBookings: boolean` warning flag when deleting a card associated with upcoming bookings.
  - `GET` response must surface `requiresUpdate: true` on cards where `PaymentMethod.isValid = false`.
**Data Model Changes Required:**
  - `PaymentMethod.isValid boolean` — Covered by v0.2.
**Auth & Permissions:** Guest role. Users manage only their own household's payment methods.
**Multi-tenancy Notes:** Processor switch atomically sets all affected `PaymentMethod` records to `isValid = false` within the same transaction.
**i18n Notes:** Warning messages for invalid cards must have EN and FR variants.
**Performance Notes:** p95 < 1 second for list and update operations.
**Open Technical Questions:** None. OQ-004 resolved: cross-processor migration deferred to v1.5.

---

## TR-015 — Join the Waitlist for a Lesson Slot

**Use Case:** UC-015
**Affected Services:** Booking Engine (Waitlist), Notification Service
**API Changes Required:**
  - `POST /api/v1/waitlist` already defined. Request must accept: `{ lessonTypeId, targetDate, mode: "time_slot" | "instructor", targetInstructorId? (required if mode = instructor), learnerId? (authenticated), guestEmail? (unauthenticated) }`.
  - Waitlist confirmation email must state the accept window duration from `Tenant.waitlistAcceptWindowMinutes` dynamically (not hardcoded to 2 hours).
**Data Model Changes Required:**
  - `WaitlistEntry` entity (with `guestEmail nullable`, `learnerId nullable`, `mode`, `targetInstructorId`, `notifiedAt`, `expiresAt`, `status`) — Covered by v0.2.
  - `Tenant.waitlistAcceptWindowMinutes integer default 120` — Covered by v0.2.
  - `WaitlistEntry.guestEmail` index required for efficient erasure tool lookup. Auto-purge of expired/fulfilled entries after 90 days via scheduled job (OQ-026).
**Auth & Permissions:** Guest (authenticated or unauthenticated). No JWT required for unauthenticated waitlist signup.
**Multi-tenancy Notes:** `WaitlistEntry.tenantId` scopes the entry. Unauthenticated entries carry tenant context from embed context.
**i18n Notes:** Waitlist confirmation email in browser locale or `User.preferredLanguage` if authenticated. EN and FR templates required.
**Performance Notes:** Waitlist join is low-frequency. No specific concern beyond standard p95 < 2 seconds.
**Open Technical Questions:** None. OQ-009 resolved.

---

## TR-016 — Accept a Waitlist Notification and Confirm Booking

**Use Case:** UC-016
**Affected Services:** Booking Engine (Waitlist), Payment Service, Notification Service
**API Changes Required:**
  - `POST /api/v1/waitlist/:id/accept` already defined. Must validate `WaitlistEntry.expiresAt > now()` before proceeding to the booking + payment atomic flow.
  - `PATCH /api/v1/waitlist/:id/promote` already defined (admin manual promotion).
  - "Decline" link in notification email maps to `DELETE /api/v1/waitlist/:id` — sets `status = expired` immediately and promotes the next entry.
  - Payment failure on accept: retry once automatically. If second attempt fails, set `WaitlistEntry.status = expired` and promote next entry. User notified of failure.
  - Background expiry sweep runs at least every 5 minutes; promotes next entry on expiry.
**Data Model Changes Required:**
  - `WaitlistEntry.notifiedAt`, `expiresAt`, `status` — all Covered by v0.2. `expiresAt = notifiedAt + Tenant.waitlistAcceptWindowMinutes` computed server-side.
**Auth & Permissions:** Guest role (own waitlist entry via token in email link). `school_admin` for manual promotion.
**Multi-tenancy Notes:** Standard tenant scoping.
**i18n Notes:** All waitlist notifications (slot available, expiry warning) must have EN and FR templates.
**Performance Notes:** Waitlist slot-opening trigger (fired on `booking.cancelled` event) must not block the cancellation transaction. Implement via async event dispatch.
**Open Technical Questions:** None.

---

## TR-017 — Purchase a Lesson Package

**Use Case:** UC-017
**Affected Services:** Booking Engine, Payment Service, Notification Service
**API Changes Required:**
  - New endpoint: `GET /api/v1/lesson-packages/templates` — list available `LessonPackageTemplate` offerings for the tenant.
  - New endpoint: `POST /api/v1/lesson-packages/purchase` — initiates package purchase. Request: `{ packageTemplateId: uuid, paymentMethodId: uuid }`. Response: confirmed `LessonPackage` record with `expiresAt`, `remainingCount`, and payment confirmation.
  - Package purchase creates a `Payment` record with `paymentType = package_purchase`. Platform fee (1.5%) applies at purchase time (OQ-027).
  - Tip charges on package-redeemed bookings are processed via `POST /api/v1/bookings/:id/review`. Platform fee (1.5%) applies to tip charges on package-redeemed bookings (OQ-027).
**Data Model Changes Required:**
  - `LessonPackage`, `LessonPackageTemplate`, `PackageRedemption` entities: absent from v0.2. Must be added. (SC-004, SC-005, SC-006, GAP-003.)
  - `Payment.paymentType`: absent from v0.2. Must be added. (SC-007, GAP-004.)
**Auth & Permissions:** Guest role (authenticated) only. Guest-checkout users cannot purchase packages (requires an account for multi-redemption tracking).
**Multi-tenancy Notes:** Package offerings scoped to tenant. `LessonPackage` records carry `tenantId`.
**i18n Notes:** Package names in `nameEn`/`nameFr`. Confirmation email in user's language.
**Performance Notes:** Package purchase follows the same atomic payment flow as a single-lesson booking. p95 < 5 seconds.
**Open Technical Questions:** None. OQ-025 resolved (forfeiture on expiry; admin extension is only exception). OQ-027 resolved (fee at purchase time).

---

## TR-018 — Redeem a Lesson Package Credit for a Booking

**Use Case:** UC-018
**Affected Services:** Booking Engine, Payment Service
**API Changes Required:**
  - `POST /api/v1/bookings` payload extended with optional `lessonPackageId: uuid`. When present: booking engine validates the package is active and unexpired, no charge is made for the lesson itself, a `PackageRedemption` record is created, and `LessonPackage.remainingCount` is decremented atomically within the booking transaction.
  - If `remainingCount` reaches 0: `LessonPackage.status` transitions to `exhausted` in the same transaction.
  - Multiple active packages: selection defaults to earliest-expiring package. Guest may specify a different `lessonPackageId`.
**Data Model Changes Required:**
  - `PackageRedemption` entity: absent from v0.2. Must be added. (SC-006, GAP-003.)
  - `Booking.lessonPackageId uuid FK → LessonPackage, nullable`: absent from v0.2. Must be added. (SC-016, GAP-009.)
  - `LessonPackage.remainingCount` decrement must use SELECT FOR UPDATE or optimistic locking to prevent race conditions on the last credit.
**Auth & Permissions:** Guest role (authenticated, own packages only).
**Multi-tenancy Notes:** Package and booking must share the same `tenantId`. Cross-tenant redemption returns HTTP 403.
**i18n Notes:** "Package credit applied" confirmation in user's language.
**Performance Notes:** Atomic decrement of `remainingCount` inside the booking transaction. Concurrent last-credit redemption handled by DB-level locking.
**Open Technical Questions:** None.

---

## TR-019 — Book a Spot in a Group Lesson

**Use Case:** UC-019
**Affected Services:** Booking Engine, Catalog & Lesson Service, Payment Service
**API Changes Required:**
  - New endpoint: `GET /api/v1/group-sessions?lessonTypeId=&date=` — list available `GroupSession` records with `currentEnrollment` and `maxCapacity`. Growth+ tenants only.
  - `POST /api/v1/bookings` with `groupSessionId: uuid`. Booking engine must: (a) verify `GroupSession.currentEnrollment < GroupSession.maxCapacity`, (b) verify instructor-to-student ratio not exceeded, (c) increment `GroupSession.currentEnrollment` atomically with booking creation.
  - Starter-tier tenants attempting group session booking must receive HTTP 403.
  - OQ-031 (unresolved): `Payment.groupSessionId` must NOT be implemented. Per-learner billing is the only supported path.
**Data Model Changes Required:**
  - `GroupSession` entity — Covered by v0.2 (new entity CRT-H-005). Note: v0.2 uses `currentCapacity` as the field name; use cases use `currentEnrollment`. Rename to `currentEnrollment` for clarity. (SC-019.)
  - `GroupSession.instructorStudentRatio integer nullable`: absent from v0.2. Must be added. (SC-012, GAP-006.)
  - `LessonType.instructorStudentRatio integer nullable`: absent from v0.2. Must be added. (SC-013, GAP-006.)
**Auth & Permissions:** Public within the widget for booking. `school_admin` for capacity and ratio overrides.
**Multi-tenancy Notes:** `GroupSession.tenantId` scopes all group session data.
**i18n Notes:** Group session content follows the same EN/FR field pattern as `LessonType`.
**Performance Notes:** `GroupSession.currentEnrollment` increment must be atomic inside a serialisable transaction to prevent overbooking.
**Open Technical Questions:** OQ-031 (unresolved) — do not implement `Payment.groupSessionId` until resolved.

---

## TR-020 — View and Manage Group Session Enrollment (Admin)

**Use Case:** UC-020
**Affected Services:** Booking Engine, Catalog & Lesson Service
**API Changes Required:**
  - New endpoint: `GET /api/v1/group-sessions/:id` — returns session with enrolled students, capacity, instructor-to-student ratio.
  - New endpoint: `PATCH /api/v1/group-sessions/:id` — admin override of `maxCapacity` and `instructorStudentRatio`. Override logged in `AuditLog`.
  - `PATCH /api/v1/bookings/:id/cancel` for admin removal of an enrolled student (existing cancellation + refund flow).
  - New endpoint: `POST /api/v1/group-sessions/:id/instructors` — assign additional instructors when ratio is strained.
**Data Model Changes Required:**
  - `GroupSession.instructorStudentRatio` — see TR-019, SC-012, GAP-006.
  - Multiple instructors per group session: `GroupSession.instructorId` in v0.2 is a single FK. A `GroupSessionInstructor` join table is required to support additional instructors (SC-018, GAP-014).
**Auth & Permissions:** `school_admin` for all management operations. Instructors can view their assigned sessions only.
**Multi-tenancy Notes:** Standard tenant scoping.
**i18n Notes:** Admin app in EN/FR at Beta (OQ-001).
**Performance Notes:** Enrollment list for a large group session must return within 1 second.
**Open Technical Questions:** `GroupSessionInstructor` join table scope — whether `GroupSession.instructorId` becomes the "lead" FK with additional instructors in the join table. Requires schema decision before Beta.

---

## TR-021 — View Today's Schedule (Instructor)

**Use Case:** UC-021
**Affected Services:** Scheduling & Availability Service, Booking Engine
**API Changes Required:**
  - `GET /api/v1/schedule?date=[today]&instructorId=[self]` already defined. Response must include: learner name/household, skill level, lesson type, meeting point, booking status. For group sessions: all enrolled students in the expanded view.
  - Response should include prior session `BookingNote` records (where `isSharedWithGuest = false`, visible to instructor) for each learner's past sessions with this instructor.
**Data Model Changes Required:**
  - No new entities beyond v0.2. `Booking.meetingPoint` and `BookingNote` Covered by v0.2.
**Auth & Permissions:** Instructor role. Scoped to the authenticated instructor's own assigned bookings only. Cross-instructor data must not be returned.
**Multi-tenancy Notes:** Multi-tenant instructors must select a tenant context at login. Schedule scoped to `InstructorTenant.tenantId` for the active context.
**i18n Notes:** `instructor` app is EN/FR at Alpha (OQ-001). Lesson type names served in instructor's language preference.
**Performance Notes:** Daily schedule query must respond within 1 second at p95. Instructor PWA must display schedule within 3 seconds of app open on a 4G connection.
**Open Technical Questions:** None.

---

## TR-022 — Check In a Student

**Use Case:** UC-022
**Affected Services:** Booking Engine, Instructor Service
**API Changes Required:**
  - New endpoint: `PATCH /api/v1/bookings/:id/checkin` — sets `Booking.status = in_progress`, records `Booking.checkedInAt`. Optionally accepts `waiverSignatureToken: string` from the Smartwaiver API.
  - Smartwaiver integration: instructor PWA embeds the Smartwaiver signing interface. On completion, Smartwaiver returns a token. PWA submits the token to this endpoint, which stores it in `Learner.waiverToken` along with `waiverSignedAt` and `waiverVersion`.
  - Typed-name fallback (mountain wireless): PWA presents a typed-name field. Typed name stored as a `BookingNote` with `authorRole = system`, `isSharedWithGuest = false`. Legal equivalence of typed-name fallback must be validated before Beta.
  - Check-in window: only available within 30 minutes before `Booking.startAt` (platform constant, not per-tenant configurable in v1.0).
**Data Model Changes Required:**
  - `Booking.checkedInAt timestamp nullable` and `Booking.status = in_progress` — Covered by v0.2.
  - `Learner.waiverToken string nullable`: absent from v0.2. Must be added. (SC-008, GAP-005.)
  - `Learner.waiverStatus enum(not_required, pending, signed, expired) nullable`: absent from v0.2. Must be added. (SC-009, GAP-005.)
  - v0.2 `Learner` has `waiverSignedAt` and `waiverVersion` already.
**Auth & Permissions:** Instructor role. Restricted to bookings assigned to the authenticated instructor.
**Multi-tenancy Notes:** Standard tenant scoping.
**i18n Notes:** Smartwaiver document language must match the learner's preferred language; pass language preference to the Smartwaiver embed at initialisation.
**Performance Notes:** Check-in must complete within 2 seconds at p95. Typed-name fallback must function on degraded mountain wireless connections.
**Open Technical Questions:** Legal equivalence of typed-name fallback under US/Canadian liability law — must be validated by legal before Beta.

---

## TR-023 — Mark a Student as No-Show

**Use Case:** UC-023
**Affected Services:** Booking Engine, Notification Service
**API Changes Required:**
  - `PATCH /api/v1/bookings/:id/no-show` already defined. Must set `Booking.status = no_show`, log in `AuditLog`, and trigger admin alert notification.
  - Admin override: `PATCH /api/v1/bookings/:id` to revert `no_show` status. Override logged in `AuditLog` with admin user ID and reason.
  - No-show refund policy applied automatically per `Booking.cancellationPolicyId` snapshot.
**Data Model Changes Required:**
  - `Booking.status = no_show` — Covered by v0.2 enum.
**Auth & Permissions:** Instructor role for marking no-show. `school_admin` for overriding.
**Multi-tenancy Notes:** Standard tenant scoping.
**i18n Notes:** Admin alert email in admin's language. EN and FR templates required.
**Performance Notes:** p95 < 1 second.
**Open Technical Questions:** None.

---

## TR-024 — Add Session Notes for a Student

**Use Case:** UC-024
**Affected Services:** Booking Engine
**API Changes Required:**
  - `POST /api/v1/bookings/:id/notes` already defined. Request: `{ content: string, isSharedWithGuest: boolean }`.
  - Instructors may only create notes on their own assigned bookings. Admins may create notes on any tenant booking. Only admins may delete notes.
  - Guest-facing booking history endpoint must filter `BookingNote` records to `isSharedWithGuest = true`. Enforced at the API response layer.
  - OQ-026 erasure: `BookingNote` FK replaced with `ERASED_GUEST` placeholder on right-to-erasure. Content retained. Notes older than 2 years auto-purged by scheduled job.
**Data Model Changes Required:**
  - `BookingNote` entity (with `isSharedWithGuest`, `authorRole`, `authorId`) — Covered by v0.2.
**Auth & Permissions:** Instructor role (own bookings, no delete). `school_admin` (any tenant booking, can delete).
**Multi-tenancy Notes:** Notes scoped via `Booking.tenantId`.
**i18n Notes:** Notes are free-form text. No translation. Notes written in French stored as-is.
**Performance Notes:** Note submission p95 < 1 second.
**Open Technical Questions:** None.

---

## TR-025 — Manage Weekly Availability (Instructor)

**Use Case:** UC-025
**Affected Services:** Scheduling & Availability Service
**API Changes Required:**
  - `POST /api/v1/instructors/:id/availability`, `PATCH /api/v1/instructors/:id/availability/:slotId`, `DELETE /api/v1/instructors/:id/availability/:slotId` — all already defined.
  - When an override conflicts with a confirmed booking: API returns a warning in the response body (not a blocking error). Availability change is saved; existing bookings are not auto-cancelled. Admin intervention required to resolve.
  - RRULE strings must be validated on write with an RFC 5545-compliant library. Invalid RRULE values rejected with HTTP 422.
  - Google Calendar sync is explicitly deferred to v1.5 (OQ-021). No `OAuthToken` references in v1.0 code paths (DEFERRED-001).
**Data Model Changes Required:**
  - `Availability.recurrence text nullable` (RRULE string) — Covered by v0.2 (modified from `json`, CRT-L-002).
**Auth & Permissions:** Instructor role for own availability. `school_admin` can view all instructor availability.
**Multi-tenancy Notes:** `Availability.tenantId` scopes records. Instructor availability at Resort A is invisible to Resort B.
**i18n Notes:** None for availability data.
**Performance Notes:** Availability changes must propagate to the booking calendar within 60 seconds. RRULE expansion for 90-day look-ahead within 2 seconds.
**Open Technical Questions:** None.

---

## TR-026 — View Earnings Dashboard (Instructor)

**Use Case:** UC-026
**Affected Services:** Reporting Service, Instructor Service, Payment Service
**API Changes Required:**
  - `GET /api/v1/instructors/:id/earnings?from=&to=` already defined. Must return: today / current week / current season summaries; per-lesson-type breakdown; tips as a separate line item if `Tenant.tipsEnabled = true`.
  - Must accept a `tenantId` query parameter for multi-tenant instructors, restricted to tenants where the instructor has an approved `InstructorTenant` row.
  - Earnings fully isolated per tenant — no cross-tenant roll-up (OQ-015).
**Data Model Changes Required:**
  - `WorkdayHandoff` entity and `Payment.tipAmountCents` — Covered by v0.2.
**Auth & Permissions:** Instructor role (own earnings). `school_admin` (any instructor within their tenant). `platform_admin` (any tenant).
**Multi-tenancy Notes:** Earnings scoped to `tenantId` from JWT or explicit validated `tenantId` query parameter.
**i18n Notes:** Currency displayed per `Tenant.currency`. No FX conversion.
**Performance Notes:** Earnings aggregation for a full season (12 months) must respond within 2 seconds. Consider a materialised view for season totals.
**Open Technical Questions:** None. OQ-006, OQ-015, OQ-018 all resolved.

---

## TR-027 — Assign an Instructor to a Booking (Admin)

**Use Case:** UC-027
**Affected Services:** Booking Engine, Scheduling & Availability Service, Notification Service
**API Changes Required:**
  - `PATCH /api/v1/bookings/:id` to update `instructorId`. Booking engine re-runs conflict detection before committing.
  - Instructor must have `InstructorTenant.onboardingStatus = approved` to appear in the assignment candidate list.
  - Admin conflict override: explicit confirmation required; override logged in `AuditLog` with reason.
  - On assignment: dispatch instructor notification (email + PWA push if permission granted).
**Data Model Changes Required:**
  - No new entities beyond v0.2.
**Auth & Permissions:** `school_admin` only.
**Multi-tenancy Notes:** Admin can only assign instructors with an approved `InstructorTenant` row for their tenant.
**i18n Notes:** Instructor assignment notification email in EN and FR.
**Performance Notes:** Conflict detection within 1 second. Drag-and-drop scheduler must respond sub-200ms for conflict highlighting.
**Open Technical Questions:** None.

---

## TR-028 — Cancel a Booking and Apply Refund Policy (Admin)

**Use Case:** UC-028
**Affected Services:** Booking Engine, Payment Service, Notification Service
**API Changes Required:**
  - `PATCH /api/v1/bookings/:id/cancel` already defined. Admin variant adds: `refundOverrideAmountCents: integer (optional)`. Override logged in `AuditLog` with admin user ID and reason.
  - Cancellation policy from `Booking.cancellationPolicyId` snapshot applied. Default is non-refundable (OQ-014).
  - On processor refund failure: booking still transitions to `cancelled`; flagged for manual review; admin alert dispatched.
**Data Model Changes Required:**
  - No new entities beyond v0.2. `AuditLog` entry captures `refundOverrideAmountCents`, `originalCalculatedRefundCents`, `reason`.
**Auth & Permissions:** `school_admin` for refund override capability.
**Multi-tenancy Notes:** Standard tenant scoping.
**i18n Notes:** Cancellation email to guest in their language.
**Performance Notes:** Same as TR-008.
**Open Technical Questions:** None.

---

## TR-029 — Execute a Weather Cancellation (Bulk)

**Use Case:** UC-029
**Affected Services:** Booking Engine, Payment Service, Notification Service
**API Changes Required:**
  - New endpoint: `POST /api/v1/bookings/bulk-cancel` — accepts `{ date: date, lessonTypeIds?: uuid[], reason: "weather" }`. Returns count of affected bookings and total refund amount for admin confirmation before execution.
  - Each booking + refund is its own transaction. A single refund failure must not block remaining cancellations. Admin sees a post-execution summary of any failures.
  - Booking status for weather cancellations: use `Booking.status = cancelled` + `Booking.cancellationReason = "weather"`. Do not add a `cancelled_weather` enum value — use the `cancellationReason` tag to avoid enum proliferation.
  - Notification to each guest: weather-closure explanation, full refund confirmation, and rebooking link pre-filled with lesson type and skill level. Instructor notifications in parallel.
**Data Model Changes Required:**
  - `Booking.cancellationReason string nullable` — Covered by v0.2. Used to tag weather cancellations.
**Auth & Permissions:** `school_admin` only. Scoped strictly to admin's tenant.
**Multi-tenancy Notes:** Bulk cancel cannot affect other tenants.
**i18n Notes:** Bulk cancellation email templates in EN and FR. Rebooking link locale-aware.
**Performance Notes:** For 200+ bookings on a single day, bulk cancel should complete within 30 seconds. Consider async processing with a progress indicator for very large batches.
**Open Technical Questions:** None.

---

## TR-030 — Reassign a Booking to a Different Instructor (Admin)

**Use Case:** UC-030
**Affected Services:** Booking Engine, Scheduling & Availability Service, Notification Service
**API Changes Required:**
  - `PATCH /api/v1/bookings/:id` to update `instructorId`. Same mechanics as TR-027.
  - Notifications dispatched to three parties: guest (instructor change), original instructor (removed), new instructor (added).
  - If no eligible replacement: API returns error code `NO_ELIGIBLE_INSTRUCTOR`.
  - `AuditLog` entry: `action = "booking.instructor_reassigned"` capturing original and new `instructorId`.
**Data Model Changes Required:**
  - No new entities beyond v0.2.
**Auth & Permissions:** `school_admin` only. New instructor must have an approved `InstructorTenant` row for the same tenant.
**Multi-tenancy Notes:** Standard tenant scoping.
**i18n Notes:** All three notification emails (guest, original instructor, new instructor) in EN and FR.
**Performance Notes:** p95 < 2 seconds.
**Open Technical Questions:** None.

---

## TR-031 — Manage Instructor Certification Records (Admin)

**Use Case:** UC-031
**Affected Services:** Instructor Service, Notification Service
**API Changes Required:**
  - Certification sub-resource endpoints (not currently in api-design.md): `GET /api/v1/instructors/:id/certifications`, `POST /api/v1/instructors/:id/certifications`, `PATCH /api/v1/instructors/:id/certifications/:certId`, `DELETE /api/v1/instructors/:id/certifications/:certId`. Must be added to the API contract.
  - Document upload: `POST /api/v1/instructors/:id/certifications/:certId/document` — stores URL in `Certification.documentUrl`.
  - Expiry alerting: background job queries `WHERE expiresAt <= now() + N days AND alert[N]SentAt IS NULL`. Sends alert email to admin. Re-alerts at 30 days and 7 days.
  - When certification expires: instructor blocked from new booking assignment (checked at assignment time via `Certification.expiresAt < now()`). Existing bookings are NOT auto-cancelled; flagged for admin review.
**Data Model Changes Required:**
  - `Certification` entity — Covered by v0.2 (new entity CRT-M-004).
  - Multi-threshold alert tracking: replace `Certification.alertSentAt` with `alert60SentAt`, `alert30SentAt`, `alert7SentAt` timestamp fields. (SC-015, GAP-008.)
**Auth & Permissions:** `school_admin` for CRUD on certifications. Instructors can view their own certifications.
**Multi-tenancy Notes:** Certifications are instructor-level. Expiry alerts dispatched to admins of all tenants where the instructor is approved.
**i18n Notes:** Expiry alert email in admin's language. EN/FR at Beta for admin app.
**Performance Notes:** Certification expiry job runs daily at minimum, hourly for the 7-day window. Index on `(expiresAt, alert60SentAt)` recommended.
**Open Technical Questions:** None.

---

## TR-032 — Extend a Lesson Package Expiry (Admin)

**Use Case:** UC-032
**Affected Services:** Booking Engine, Notification Service
**API Changes Required:**
  - New endpoint: `PATCH /api/v1/lesson-packages/:id/extend` — accepts `{ newExpiresAt: date }`. Validates `newExpiresAt > today` and `LessonPackage.remainingCount > 0`. Logs in `AuditLog`. Sends guest notification.
  - Admin search: `GET /api/v1/lesson-packages?email=&guestName=&status=` for lookup.
**Data Model Changes Required:**
  - `LessonPackage` entity: absent from v0.2 (see TR-017, GAP-003, SC-005). Must be added before this endpoint is implemented.
  - `AuditLog` entry: `action = "lesson_package.expiry_extended"`, `metadata = { oldExpiresAt, newExpiresAt, reason }`.
**Auth & Permissions:** `school_admin` only.
**Multi-tenancy Notes:** Admin can only extend packages within their tenant.
**i18n Notes:** Extension confirmation email to guest in their language.
**Performance Notes:** p95 < 1 second.
**Open Technical Questions:** None. OQ-025 resolved.

---

## TR-033 — Configure Lesson Types and Pricing (Admin)

**Use Case:** UC-033
**Affected Services:** Catalog & Lesson Service
**API Changes Required:**
  - `POST /api/v1/lesson-types`, `PATCH /api/v1/lesson-types/:id`, `DELETE /api/v1/lesson-types/:id` — already defined.
  - Missing translation warning: API response includes `translationWarnings: ["nameFr missing"]` array (not a blocking error).
  - Bulk session creation: new endpoint `POST /api/v1/group-sessions/bulk-create` for recurring group programs. Creates all `GroupSession` records in a single transaction.
**Data Model Changes Required:**
  - `LessonType.instructorStudentRatio integer nullable` — must be added (SC-013, GAP-006).
**Auth & Permissions:** `school_admin` only.
**Multi-tenancy Notes:** `LessonType.tenantId` scopes all lesson types.
**i18n Notes:** `nameEn` and `nameFr` both accepted. Missing one triggers a warning, not a validation error.
**Performance Notes:** Lesson type activation must propagate to the booking widget immediately. p95 < 500 ms for save.
**Open Technical Questions:** None.

---

## TR-034 — Generate a Revenue and Utilization Report (Admin)

**Use Case:** UC-034
**Affected Services:** Reporting Service
**API Changes Required:**
  - `GET /api/v1/reports/revenue?from=&to=&instructorId=&lessonTypeId=&groupBy=` already defined. Must include: gross revenue, platform fee (1.5%), net revenue, and tip amounts as a separate column.
  - `GET /api/v1/reports/utilization?from=&to=&instructorId=` already defined.
  - `GET /api/v1/reports/export?type=revenue|utilization|students&from=&to=` already defined. CSV must be UTF-8 encoded with a header row.
**Data Model Changes Required:**
  - No new entities. All revenue data from `Payment` and `Booking` records. `Payment.paymentType` (SC-007) enables filtering by payment type in reports.
**Auth & Permissions:** `school_admin` and `operator` roles.
**Multi-tenancy Notes:** Revenue report strictly scoped to admin's tenant.
**i18n Notes:** Admin app in EN/FR at Beta. Report labels in EN/FR. Currency per `Tenant.currency` with no FX conversion.
**Performance Notes:** Reports for up to 12 months within 10 seconds at p95. Async generation with polling acceptable for larger ranges.
**Open Technical Questions:** None.

---

## TR-035 — Manage the Waitlist Panel (Admin)

**Use Case:** UC-035
**Affected Services:** Booking Engine (Waitlist)
**API Changes Required:**
  - `GET /api/v1/waitlist?mode=&date=&status=` already defined with required filters.
  - `PATCH /api/v1/waitlist/:id/promote` already defined. Returns `NO_AVAILABLE_SLOT` error when no matching availability exists.
  - Notification history per entry (when `notifiedAt` was set, whether accepted) must be included in the response.
**Data Model Changes Required:**
  - No changes beyond v0.2.
**Auth & Permissions:** `school_admin` only for admin panel access.
**Multi-tenancy Notes:** Waitlist panel scoped to admin's tenant.
**i18n Notes:** Admin app in EN/FR at Beta.
**Performance Notes:** Waitlist panel with up to 500 entries must load within 2 seconds.
**Open Technical Questions:** None.

---

## TR-036 — Instructor Onboarding and Approval Workflow

**Use Case:** UC-036
**Affected Services:** Instructor Service, Notification Service
**API Changes Required:**
  - `POST /api/v1/instructors`, `PATCH /api/v1/instructors/:id/approve` — already defined.
  - Rejection: response must include `feedbackReason: string`. Instructor notified with feedback. Profile transitions to a `rejected` status (pending SC-017 enum addition).
  - Certification document upload: `POST /api/v1/instructors/:id/certifications/:certId/document`.
  - On approval: `InstructorTenant.onboardingStatus = approved`. Profile immediately bookable. Notification dispatched.
**Data Model Changes Required:**
  - `InstructorTenant.onboardingStatus`: add `rejected` value. (SC-017, GAP-010.)
  - `Certification.documentUrl string nullable` — Covered by v0.2.
**Auth & Permissions:** `school_admin` for approval/rejection. Instructor role for self-submission.
**Multi-tenancy Notes:** Approval state is per-tenant via `InstructorTenant`. Instructor approved at Resort A may be `pending` at Resort B.
**i18n Notes:** Approval/rejection notification email in instructor's language. Instructor PWA is EN/FR at Alpha.
**Performance Notes:** Approval propagation to the booking widget within 60 seconds.
**Open Technical Questions:** None.

---

## TR-037 — Perform a Right-to-Erasure Request (Admin)

**Use Case:** UC-037
**Affected Services:** Account & Identity Service, Booking Engine, Payment Service
**API Changes Required:**
  - New endpoint: `POST /api/v1/admin/erasure-requests` — accepts `{ email: string }` or `{ guestCheckoutId: uuid }`. Returns preview of all PII-bearing records in scope for admin confirmation.
  - New endpoint: `POST /api/v1/admin/erasure-requests/:id/confirm` — executes the erasure.
  - Erasure scope and disposition per entity (OQ-026 resolved):
    - `GuestCheckout.firstName`, `lastName`, `email`, `phone` — pseudonymised to `"ERASED"`. All other fields retained.
    - `Payment.guestCheckoutId` FK — set to `null`. All financial fields retained (7yr US / 6yr CA tax retention).
    - `WaitlistEntry` (where `guestEmail = erased email`) — record deleted entirely.
    - `BookingNote` (FK links to erased record) — FK replaced with `ERASED_GUEST` placeholder; content retained; notes older than 2 years auto-purged.
    - `AuditLog` — retained in full. Legal basis: fraud prevention, financial compliance. Max retention 3 years. Future logs must contain `userId` only, never raw email addresses.
  - If guest has both a `GuestCheckout` record AND an authenticated `User` account (same email), both record sets are included in the erasure scope. Admin shown a combined view.
  - Erasure action logged in `AuditLog`.
**Data Model Changes Required:**
  - No new entities needed for the erasure tool. Relies on existing v0.2 entities.
  - `WaitlistEntry.guestEmail` index required (already noted in v0.2).
  - OQ-032 (unresolved): when `Learner.parentalConsentGiven` and `parentalConsentAt` are added, these fields must be explicitly flagged as erasure-exempt in the erasure tool implementation.
**Auth & Permissions:** `school_admin` only. `platform_admin` can execute erasure across tenants.
**Multi-tenancy Notes:** Erasure scoped to admin's tenant. Cross-tenant records require separate erasure requests per tenant.
**i18n Notes:** Erasure confirmation UI in admin's language. EN/FR at Beta.
**Performance Notes:** Erasure preview within 5 seconds. Actual erasure should be async with a confirmation response.
**Open Technical Questions:** OQ-032 (unresolved) — parental consent fields erasure exemption.

---

## TR-038 — Configure Resort-Level Policies (Operator)

**Use Case:** UC-038
**Affected Services:** Account & Identity Service, Catalog & Lesson Service
**API Changes Required:**
  - `PATCH /api/v1/tenants/:id` — not currently in api-design.md. Must be added. Scoped to `operator` and `platform_admin` roles. (GAP-011.)
  - Currency change warning: when `Tenant.currency` is changed with active bookings, the API must return a `hasPendingBookings: boolean` warning flag. Operator must explicitly confirm.
  - Child schools inherit resort defaults. `school_admin` can override `CancellationPolicy` at the school level.
**Data Model Changes Required:**
  - `Tenant` entity — Covered by v0.2.
  - Pricing floors and seasonal rate cards: not modelled in v0.2 and not in scope for v1.0 without a formal product decision. (GAP-013.)
**Auth & Permissions:** `operator` role for resort-level policy. `school_admin` cannot change resort-level currency or processor.
**Multi-tenancy Notes:** Tenant configuration changes affect all child schools within the operator's scope.
**i18n Notes:** Operator app in EN/FR at Beta.
**Performance Notes:** Policy changes must propagate to all surfaces within 60 seconds.
**Open Technical Questions:** Whether pricing floors and seasonal rate cards are in scope for v1.0 GA. Product Lead must clarify before operator portal implementation begins.

---

## TR-039 — Configure Payment Processor (Operator)

**Use Case:** UC-039
**Affected Services:** Payment Service
**API Changes Required:**
  - New endpoint: `POST /api/v1/tenants/:id/payment-config` — accepts `{ processor: "stripe" | "shift4", credentials: {...} }`. Credentials encrypted via AWS KMS before storage and never returned in any subsequent API response.
  - New endpoint: `POST /api/v1/tenants/:id/payment-config/test` — runs a test transaction to verify credentials before activation.
  - Starter tier attempting Shift4 selection: HTTP 403 with `TIER_UPGRADE_REQUIRED` error code (OQ-024 resolved).
  - Processor switch side-effect: all `PaymentMethod` records for the tenant set `isValid = false` atomically in the same transaction. Affected households notified.
**Data Model Changes Required:**
  - `Tenant.paymentModel enum(direct_merchant, platform_mid) nullable`: absent from v0.2. Must be added. (SC-014, GAP-007.)
  - Credential schemas per OQ-024:
    - Stripe (any tier): `{ secretKey: string (required), webhookSecret: string (required) }`.
    - Shift4/Growth+: `{ model: "direct" (required), apiKey: string (required), merchantId: string (required), webhookSecret: string (required) }`.
    - Shift4/Starter: NOT SUPPORTED in v1.0.
  - All credential fields encrypted via AWS KMS envelope encryption. Per-tenant DEK; KEK managed in AWS KMS (OQ-022). Encrypted values include key version identifier for rotation.
**Auth & Permissions:** `operator` role only. Credentials never visible in API responses to any role.
**Multi-tenancy Notes:** Payment credentials per-tenant and strictly isolated.
**i18n Notes:** Operator app in EN/FR at Beta. Diagnostic error messages in user's language.
**Performance Notes:** KMS decryption adds ~100 ms per transaction. Acceptable overhead.
**Open Technical Questions:** None. OQ-022 and OQ-024 both resolved.

**PCI / Security Note:** `Tenant.paymentCredentials` is the highest-sensitivity field in the system. Requirements: (a) access logging on every read, (b) KMS key rotation policy documented and enforced, (c) field must never appear in any log line, (d) test transaction must not leave a traceable charge on the processor account beyond the immediate refund.

---

## TR-040 — Set Up White-Label Booking Widget (Operator)

**Use Case:** UC-040
**Affected Services:** Account & Identity Service, Catalog & Lesson Service
**API Changes Required:**
  - New endpoints: `POST /api/v1/tenants/:id/white-label` and `PATCH /api/v1/tenants/:id/white-label`. Gated on `Tenant.subscriptionTier = enterprise`.
  - DNS verification: `GET /api/v1/tenants/:id/white-label/verify` — checks DNS propagation and sets `WhiteLabelConfig.domainVerified = true`.
  - Embed code (iframe and JS snippet) included in `WhiteLabelConfig` record response.
  - Non-Enterprise tenants: HTTP 403 with `TIER_UPGRADE_REQUIRED`.
**Data Model Changes Required:**
  - `WhiteLabelConfig` entity — Covered by v0.2 (new entity CRT-M-007).
**Auth & Permissions:** `operator` role (Enterprise tier only). `platform_admin` may manage any tenant's config.
**Multi-tenancy Notes:** `WhiteLabelConfig.tenantId` is unique. Custom domain must be validated as unique across all tenants.
**i18n Notes:** Booking widget rendered via white-label must fully support EN/FR.
**Performance Notes:** DNS polling rate-limited to max once per 5 minutes per domain to prevent enumeration abuse.
**Open Technical Questions:** None.

---

## TR-041 — View Consolidated Resort Revenue Report (Operator)

**Use Case:** UC-041
**Affected Services:** Reporting Service
**API Changes Required:**
  - `GET /api/v1/reports/revenue` with `operator` role must aggregate across all schools in the operator's scope. Already defined with operator access.
  - Multi-currency: schools in different currencies presented with separate totals. No FX conversion applied.
  - CSV export includes: school, lesson type, currency, gross revenue, platform fee, net revenue, tips columns.
**Data Model Changes Required:**
  - No new entities. Aggregates `Payment` records across multiple `Tenant` records within operator's scope.
**Auth & Permissions:** `operator` role. Scoped to operator's managed tenants.
**Multi-tenancy Notes:** Operator sees aggregated data across their managed tenants only. No cross-operator leakage.
**i18n Notes:** Operator app in EN/FR at Beta.
**Performance Notes:** Cross-tenant aggregation for 10+ schools over 12 months may be slow. Async generation with polling acceptable.
**Open Technical Questions:** None.

---

## TR-042 — Manage API Keys and Webhook Configuration (Operator)

**Use Case:** UC-042
**Affected Services:** Account & Identity Service, Notification Service
**API Changes Required:**
  - API key: `POST /api/v1/api-keys` (generate; raw key returned once only), `DELETE /api/v1/api-keys/:id` (revoke). Already implied by data model.
  - Webhook: `POST /api/v1/webhooks`, `PATCH /api/v1/webhooks/:id`, `DELETE /api/v1/webhooks/:id`, `POST /api/v1/webhooks/:id/test`.
  - Retry/backoff policy: exponential backoff schedule (1 min, 5 min, 15 min, 30 min, 1 hr, 2 hr). Auto-deactivation and operator notification after 10 consecutive failures.
  - Supported outbound events: `booking.confirmed`, `booking.cancelled`, `waitlist.promoted`, `lesson.completed`. Note: `lesson.completed` is not currently listed in api-design.md's Notification Service event catalogue. Must be added. (GAP-012.)
**Data Model Changes Required:**
  - `ApiKey` entity (CRT-M-008) and `Webhook` entity (CRT-M-008) — Covered by v0.2.
**Auth & Permissions:** `operator` role. API keys scoped to operator's tenants. Requests authenticated with operator keys subject to same RBAC as `operator` JWT role.
**Multi-tenancy Notes:** `ApiKey.tenantId` and `Webhook.tenantId` scope all records.
**i18n Notes:** Operator app in EN/FR at Beta.
**Performance Notes:** API key validation at gateway (hash and compare) must complete within 50 ms.
**Open Technical Questions:** None. Retry policy defined above.

---

## TR-043 — Language Selection and Bilingual Content Delivery

**Use Case:** UC-043
**Affected Services:** All services (cross-cutting)
**API Changes Required:**
  - Language priority resolution: (1) `User.preferredLanguage` from JWT, (2) `Tenant.defaultLanguage`, (3) browser `Accept-Language` header. API returns bilingual content fields (`nameEn`/`nameFr`, `bioEn`/`bioFr`) and lets the client select; or accepts `Accept-Language` header and returns relevant variant.
  - Phase schedule: `customer` and `instructor` apps EN/FR at Alpha. `admin` and `operator` apps EN/FR at Beta.
**Data Model Changes Required:**
  - No new entities. All content entities already carry EN/FR field pairs in v0.2.
**Auth & Permissions:** Cross-cutting. No special permission required.
**Multi-tenancy Notes:** `Tenant.defaultLanguage` is the fallback for unauthenticated widget sessions.
**i18n Notes:** All notification templates in EN and FR at Alpha for user-facing events. Admin/operator templates in FR at Beta. Fallback to available language when only one variant is populated.
**Performance Notes:** Language resolution adds no meaningful latency.
**Open Technical Questions:** OQ-030 (unresolved) — FR suppression on Starter tier. FR available on all tiers for `customer` and `instructor` surfaces until resolved.

---

## TR-044 — Notification Delivery (Email and SMS)

**Use Case:** UC-044
**Affected Services:** Notification Service
**API Changes Required:**
  - No new client-facing endpoints. Notification service is event-driven.
  - Full internal event catalogue: `booking.confirmed`, `booking.cancelled`, `booking.reassigned`, `waitlist.slot_available`, `waitlist.accepted`, `booking.reminder`, `lesson.weather_cancel`, `booking.no_show`, `instructor.certification_expiry`, `lesson.completed` (add per GAP-012).
  - SendGrid is the email provider (OQ-016). `User.emailOptOut` respected. Transactional booking confirmations sent regardless of `emailOptOut` (guests must receive booking confirmations).
  - SMS: dispatched only if `User.phoneVerified = true AND User.smsOptOut = false`.
  - Retry: up to 3 attempts on transient failure. Dead-letter queue for exhausted retries.
  - `.ics` calendar attachment in all booking-related confirmation emails.
**Data Model Changes Required:**
  - `User.emailOptOut`, `User.smsOptOut`, `User.phone`, `User.phoneVerified` — all Covered by v0.2.
**Auth & Permissions:** Notification service is internal. No client-facing auth.
**Multi-tenancy Notes:** Notifications scoped to the tenant of the triggering event.
**i18n Notes:** All templates in EN and FR. Language selected from `User.preferredLanguage` or `GuestCheckout.preferredLanguage` at dispatch time.
**Performance Notes:** Notification dispatch must be async (not blocking the triggering transaction).
**Open Technical Questions:** None. OQ-016 resolved (SendGrid confirmed).

---

## TR-045 — Payment Processing Abstraction

**Use Case:** UC-045
**Affected Services:** Payment Service
**API Changes Required:**
  - `POST /api/v1/payments/charge` (internal only), `POST /api/v1/payments/:id/refund`, `GET /api/v1/payments/:id`, `GET /api/v1/payments` — already defined.
  - `POST /api/v1/webhooks/stripe` and `POST /api/v1/webhooks/shift4` — already defined. Must validate HMAC signature before processing. Acknowledge HTTP 200 before async payload processing.
  - Abstraction layer reads `Tenant.paymentProcessor` and `Tenant.paymentModel` to route. Decrypts `Tenant.paymentCredentials` via AWS KMS per request.
  - Platform fee: 1.5% of `Payment.amountCents` only. `tipAmountCents` excluded from fee base (OQ-027). `Payment.platformFeeCents = 0` on tip-only payment records.
  - KMS unavailability: return HTTP 503, queue retry, no partial charge.
**Data Model Changes Required:**
  - `Tenant.paymentModel`: absent from v0.2. Must be added. (SC-014, GAP-007.)
  - `Payment.paymentType`: absent from v0.2. Must be added. (SC-007, GAP-004.)
**Auth & Permissions:** Payment service is internal-only. Never called directly by client apps.
**Multi-tenancy Notes:** All payment operations strictly scoped to a single tenant's processor credentials.
**i18n Notes:** User-facing payment error messages in EN and FR. Raw processor error codes never surfaced.
**Performance Notes:** KMS decryption adds ~100 ms. Total application-layer payment processing (excluding processor network) within 2 seconds.
**Open Technical Questions:** None. OQ-022, OQ-024, OQ-027 all resolved.

**PCI Note:** Raw PANs must never traverse Slopebook servers. Payment page must use processor-hosted fields or processor JS SDK. `PaymentMethod` stores only `processorTokenId`, `last4`, `brand`, and expiry. PCI scope target: SAQ A-EP or SAQ A.

---

## Gap Analysis

The following capabilities are implied by the use cases but are not currently covered by data-model.md v0.2 or api-design.md.

### GAP-001: `InstructorRating` Entity Missing from Data Model
**Source:** UC-002, UC-010, OQ-028
**Description:** `InstructorRating` is referenced throughout the use cases as the entity holding post-lesson star ratings. Absent from data-model.md v0.2.
**Proposed Entity:**
```
InstructorRating
  id                uuid, PK
  tenantId          uuid, FK → Tenant
  bookingId         uuid, FK → Booking, UNIQUE     -- one rating per booking
  instructorId      uuid, FK → Instructor
  submittedById     uuid, FK → User, nullable      -- null for guest-checkout submitters
  guestCheckoutId   uuid, FK → GuestCheckout, nullable
  rating            integer, CHECK (rating BETWEEN 1 AND 5)
  createdAt         timestamp
```
**Impact:** Additive to v0.2.

### GAP-002: `Instructor.ratingAvg` and `Instructor.ratingCount` Missing
**Source:** UC-002, UC-010, OQ-028
**Description:** Denormalised rating aggregate fields referenced in use cases but absent from the `Instructor` entity in v0.2.
**Proposed Addition:** `ratingAvg decimal(3,2) nullable` and `ratingCount integer default 0` on `Instructor`. Updated atomically when `InstructorRating` record is created.
**Impact:** Additive to v0.2.

### GAP-003: `LessonPackage`, `LessonPackageTemplate`, `PackageRedemption` Entities Missing
**Source:** UC-017, UC-018, UC-032, OQ-019, OQ-025
**Description:** The lesson packages feature (confirmed Beta deliverable per OQ-019) requires three new entities. None appear in data-model.md v0.2.

**`LessonPackageTemplate`** (admin-configured offering):
```
LessonPackageTemplate
  id              uuid, PK
  tenantId        uuid, FK → Tenant
  nameEn          string
  nameFr          string
  lessonCount     integer
  priceAmount     decimal
  currency        enum(USD, CAD)
  validityDays    integer
  isActive        boolean
  createdAt       timestamp
  updatedAt       timestamp
```

**`LessonPackage`** (guest's purchased instance):
```
LessonPackage
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  householdId         uuid, FK → Household
  packageTemplateId   uuid, FK → LessonPackageTemplate
  status              enum(active, exhausted, expired)
  totalCount          integer
  remainingCount      integer
  purchasePaymentId   uuid, FK → Payment
  purchasedAt         timestamp
  expiresAt           timestamp
  createdAt           timestamp
  updatedAt           timestamp
```

**`PackageRedemption`** (links one credit to one booking):
```
PackageRedemption
  id                uuid, PK
  lessonPackageId   uuid, FK → LessonPackage
  bookingId         uuid, FK → Booking, UNIQUE   -- one redemption per booking
  redeemedAt        timestamp
```
**Impact:** Additive to v0.2. Three new tables.

### GAP-004: `Payment.paymentType` Missing
**Source:** UC-010 (tip-only payment), UC-017 (package purchase), UC-045
**Description:** Use cases reference `paymentType = package_purchase` and tip-only payment type. `Payment` entity in v0.2 has no `paymentType` field.
**Proposed Addition:** `paymentType enum(standard, package_purchase, tip) default standard` on `Payment`. Existing rows backfilled to `standard`.
**Impact:** Additive to v0.2.

### GAP-005: `Learner.waiverToken` and `Learner.waiverStatus` Missing
**Source:** UC-022, OQ-029
**Description:** UC-022 references `Learner.waiverToken` (Smartwaiver document reference) and `Learner.waiverStatus`. The v0.2 `Learner` entity has `waiverSignedAt` and `waiverVersion` but neither `waiverToken` nor `waiverStatus`.
**Proposed Addition:**
  - `waiverToken string nullable` on `Learner` (opaque Smartwaiver document token).
  - `waiverStatus enum(not_required, pending, signed, expired) nullable` on `Learner`.
**Impact:** Additive to v0.2.

### GAP-006: `GroupSession.instructorStudentRatio` and `LessonType.instructorStudentRatio` Missing
**Source:** UC-019, UC-020, OQ-013
**Description:** The three-level instructor-to-student ratio hierarchy (platform default → `LessonType.instructorStudentRatio` → `GroupSession.instructorStudentRatio`) is specified in use cases and resolved open questions but neither field appears in data-model.md v0.2.
**Proposed Addition:** `instructorStudentRatio integer nullable` on both `GroupSession` and `LessonType`.
**Impact:** Additive to v0.2.

### GAP-007: `Tenant.paymentModel` Missing from `Tenant` Entity Definition
**Source:** UC-039, UC-045, OQ-005, OQ-024
**Description:** `Tenant.paymentModel` is referenced in open-questions.md and use-cases.md but absent from the `Tenant` entity definition in data-model.md v0.2.
**Proposed Addition:** `paymentModel enum(direct_merchant, platform_mid) nullable` on `Tenant`. Null is appropriate for Starter tier (Stripe-only; no model distinction needed in v1.0).
**Impact:** Additive to v0.2.

### GAP-008: Certification Multi-Threshold Alert Tracking
**Source:** UC-031
**Description:** UC-031 specifies expiry alerts at 60 days, 30 days, and 7 days. `Certification.alertSentAt` in v0.2 tracks only one alert dispatch. Multiple escalating alerts require additional tracking.
**Proposed Change:** Replace `alertSentAt timestamp nullable` with three fields: `alert60SentAt timestamp nullable`, `alert30SentAt timestamp nullable`, `alert7SentAt timestamp nullable` on `Certification`. Existing `alertSentAt` values migrated to `alert60SentAt`.
**Impact:** Modifies v0.2 (additive replacement). One migration step.

### GAP-009: `Booking.lessonPackageId` FK Missing
**Source:** UC-018
**Description:** To identify package-redeemed bookings and prevent double-counting in revenue reports, `Booking` should carry an optional FK to `LessonPackage`.
**Proposed Addition:** `lessonPackageId uuid FK → LessonPackage, nullable` on `Booking`.
**Impact:** Additive to v0.2.

### GAP-010: `InstructorTenant.onboardingStatus` Missing `rejected` Value
**Source:** UC-036
**Description:** UC-036 describes an instructor profile being rejected with feedback and remaining in a state pending resubmission. The current enum `(pending, approved, inactive)` has no `rejected` state to distinguish "awaiting resubmission" from "suspended."
**Proposed Addition:** Add `rejected` to `InstructorTenant.onboardingStatus` enum.
**Impact:** Additive to v0.2 enum.

### GAP-011: No Tenant Configuration API Endpoint Defined
**Source:** UC-038
**Description:** `PATCH /api/v1/tenants/:id` is implied by the operator portal but does not appear in api-design.md. Without it, resort-level policy changes (currency, default language, cancellation policy defaults) have no API path.
**Proposed Addition:** `GET /api/v1/tenants/:id` and `PATCH /api/v1/tenants/:id` restricted to `operator` and `platform_admin` roles.

### GAP-012: `lesson.completed` Event Missing from Notification Service Event Catalogue
**Source:** UC-042
**Description:** UC-042 lists `lesson.completed` as a subscribable webhook event. This event does not appear in the Notification Service event list in api-design.md.
**Proposed Addition:** Add `lesson.completed` to the Notification Service internal event catalogue and to the `Webhook.events` supported values list.

### GAP-013: Pricing Floors and Seasonal Rate Cards Not Modelled
**Source:** UC-038
**Description:** UC-038 step 4 references "pricing floors and seasonal rate cards" as operator-configured settings. These concepts are not modelled in data-model.md v0.2 and no endpoint exists for them.
**Recommendation:** Product Lead must clarify whether pricing floors are in scope for v1.0 GA. If yes, a `PriceFloorConfig` entity and admin CRUD endpoints are required before the operator portal is built. If deferred, explicitly remove from the use case to avoid dead implementation paths.

### GAP-014: `GroupSession` Multi-Instructor Support
**Source:** UC-020
**Description:** UC-020 step 5 allows an admin to "assign an additional instructor" when ratio is strained. `GroupSession.instructorId` in v0.2 is a single FK, supporting only one instructor per session.
**Proposed Addition:** `GroupSessionInstructor` join table:
```
GroupSessionInstructor
  groupSessionId    uuid, FK → GroupSession
  instructorId      uuid, FK → Instructor
  role              enum(lead, support)
  PRIMARY KEY       (groupSessionId, instructorId)
```
The original `GroupSession.instructorId` FK becomes the lead instructor shortcut reference; additional instructors are in the join table.
**Impact:** Additive to v0.2.

### GAP-015: `OAuthToken` Entity in v0.2 Conflicts with DEFERRED-001
**Source:** OQ-021
**Description:** Data-model.md v0.2 includes the `OAuthToken` entity for Google Calendar sync. OQ-021 resolved: Google Calendar sync is deferred to v1.5. The `OAuthToken` entity must not be referenced in any v1.0 application code paths (DEFERRED-001).
**Action Required:** The table may exist in the schema as reserved infrastructure, but a CI-enforced lint rule must prevent any v1.0 application code from importing or referencing `OAuthToken`. Remove all v1.0 UI references to calendar sync.

### GAP-016: `POST /api/v1/bookings/:id/review` Endpoint
**Source:** OQ-023, UC-010
**Description:** This endpoint is listed in api-design.md as `POST /api/v1/bookings/:id/review` (the last line item in the Booking Engine section). Confirmed present. No gap.

### GAP-017: `Learner.parentalConsentGiven` and `parentalConsentAt` Missing (OQ-032 Unresolved)
**Source:** UC-011, UC-037, OQ-032
**Description:** OQ-032 is unresolved. Once resolved, `parentalConsentGiven boolean default false` and `parentalConsentAt timestamp nullable` must be added to `Learner`. These fields must be explicitly flagged as erasure-exempt in the right-to-erasure tool implementation.
**Status:** Blocked pending OQ-032 resolution. Must be added before Beta schema freeze.

---

## Schema Changes Summary

All data-model.md changes needed across all use cases. Marked as **Covered by v0.2**, **Additive to v0.2**, or **Modifies v0.2**.

| SC# | Entity | Change | Type | TR Ref | Gap Ref |
|---|---|---|---|---|---|
| SC-001 | `Instructor` | Add `ratingAvg decimal(3,2) nullable` | Additive to v0.2 | TR-002, TR-010 | GAP-002 |
| SC-002 | `Instructor` | Add `ratingCount integer default 0` | Additive to v0.2 | TR-002, TR-010 | GAP-002 |
| SC-003 | `InstructorRating` | New entity (schema in GAP-001) | Additive to v0.2 | TR-010 | GAP-001 |
| SC-004 | `LessonPackageTemplate` | New entity (admin-configured package offering) | Additive to v0.2 | TR-017 | GAP-003 |
| SC-005 | `LessonPackage` | New entity (guest's purchased package instance) | Additive to v0.2 | TR-017, TR-018, TR-032 | GAP-003 |
| SC-006 | `PackageRedemption` | New entity (links package credit to booking) | Additive to v0.2 | TR-018 | GAP-003 |
| SC-007 | `Payment` | Add `paymentType enum(standard, package_purchase, tip) default standard` | Additive to v0.2 | TR-010, TR-017, TR-045 | GAP-004 |
| SC-008 | `Learner` | Add `waiverToken string nullable` | Additive to v0.2 | TR-022 | GAP-005 |
| SC-009 | `Learner` | Add `waiverStatus enum(not_required, pending, signed, expired) nullable` | Additive to v0.2 | TR-022 | GAP-005 |
| SC-010 | `Learner` | Add `parentalConsentGiven boolean default false` (blocked on OQ-032) | Additive to v0.2 | TR-011 | GAP-017 |
| SC-011 | `Learner` | Add `parentalConsentAt timestamp nullable` (blocked on OQ-032) | Additive to v0.2 | TR-011, TR-037 | GAP-017 |
| SC-012 | `GroupSession` | Add `instructorStudentRatio integer nullable` | Additive to v0.2 | TR-019, TR-020 | GAP-006 |
| SC-013 | `LessonType` | Add `instructorStudentRatio integer nullable` | Additive to v0.2 | TR-019, TR-033 | GAP-006 |
| SC-014 | `Tenant` | Add `paymentModel enum(direct_merchant, platform_mid) nullable` | Additive to v0.2 | TR-039, TR-045 | GAP-007 |
| SC-015 | `Certification` | Replace `alertSentAt` with `alert60SentAt`, `alert30SentAt`, `alert7SentAt` | Modifies v0.2 | TR-031 | GAP-008 |
| SC-016 | `Booking` | Add `lessonPackageId uuid FK → LessonPackage, nullable` | Additive to v0.2 | TR-018 | GAP-009 |
| SC-017 | `InstructorTenant` | Add `rejected` to `onboardingStatus` enum | Additive to v0.2 | TR-036 | GAP-010 |
| SC-018 | `GroupSessionInstructor` | New join table for multi-instructor group sessions | Additive to v0.2 | TR-020 | GAP-014 |
| SC-019 | `GroupSession` | Rename `currentCapacity` to `currentEnrollment` for alignment with use cases | Modifies v0.2 | TR-019 | — |
| SC-020 | `OAuthToken` | Entity in v0.2 schema; must be code-gated via DEFERRED-001 (no v1.0 code paths) | v0.2 constraint | — | GAP-015 |

**All other entities** (`SlotReservation`, `GuestCheckout`, `CancellationPolicy`, `BookingNote`, `WorkdayHandoff`, `Certification`, `InstructorTenant`, `WhiteLabelConfig`, `ApiKey`, `Webhook`, `AuditLog`, and all other modifications to `Tenant`, `User`, `Booking`, `Payment`, `Learner`, `WaitlistEntry`, `PaymentMethod`, `Availability`, `LessonType`) are **Covered by v0.2** as specified in data-model.md.

---

## Unresolved Open Questions Requiring Action Before Beta

| OQ | Blocker For | Action Required |
|---|---|---|
| OQ-030 | TR-001, TR-009, TR-043 | Product Lead must rule on FR suppression for Starter tier on `customer` and `instructor` apps. Until resolved: FR rendered for all tiers on those surfaces. |
| OQ-031 | TR-019 | Product Lead must confirm whether school-block billing is in v1.0 scope. Do NOT implement `Payment.groupSessionId` until resolved. |
| OQ-032 | TR-011, TR-037, SC-010, SC-011 | Product Lead must confirm `parentalConsentGiven` and `parentalConsentAt` fields on `Learner`. Legal must confirm erasure-exempt status. Must be resolved before Beta schema freeze. |
