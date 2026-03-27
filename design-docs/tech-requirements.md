# Slopebook — Technical Requirements

**Document Status:** Draft
**Last Updated:** 2026-03-24
**Author:** Tech Lead
**Version:** 0.1

---

## 1. Purpose & Scope

This document translates the product-level intent captured in `design-docs/drafts/use-cases.md` into concrete, numbered technical requirements that engineering teams can implement and verify. It synthesises three source documents:

- **Use Cases** (`design-docs/drafts/use-cases.md`) — behavioural specifications for all five personas across all four application surfaces, covering Alpha through v1.0 GA.
- **Data Model** (`design-docs/data-model.md`) — entity definitions, field types, and relationships.
- **API Design** (`design-docs/api-design.md`) — service boundaries, endpoint catalogue, auth model, and non-functional principles.

### What this document covers

- Functional requirements, numbered TR-F-001 onwards, organised by system area.
- Non-functional requirements, numbered TR-NF-001 onwards.
- A service boundary summary mapping each backend service to its owned data, consumers, and cross-service dependencies.
- Data integrity constraints that must be enforced at both the database and application layers.
- Identified gaps — requirements implied by the use cases that are not yet addressed in the current API design or data model.

### What this document does not cover

- UI/UX specifications (deferred to the UX flow documents).
- Infrastructure provisioning and deployment topology.
- Use cases explicitly deferred beyond v1.0 GA (enumerated in use-cases.md Section 4).

### Relationship to use cases

Every functional requirement below traces to at least one use case (UC-NNN). Where a requirement is inferred from the data model or API design without a direct use case reference, this is noted explicitly.

---

## 2. Functional Requirements

### 2.1 Booking Engine

**Scope:** UC-001, UC-003, UC-004, UC-005, UC-006, UC-008, UC-011, UC-022, UC-023, UC-024, UC-025

---

**TR-F-001** The booking engine MUST perform a real-time availability check combining instructor availability records (`Availability` table), existing confirmed bookings, and lesson type configuration before presenting any bookable time slot to a guest. (UC-001, UC-003)

**TR-F-002** The system MUST enforce a soft-hold mechanism when a guest selects a time slot (UC-003, step 5). The slot MUST be reserved for the duration of the active checkout session. The soft hold MUST expire automatically if the session is abandoned, returning the slot to available inventory. The expiry duration is implementation-defined but MUST be no less than 10 minutes and no more than 30 minutes.

**TR-F-003** The booking engine MUST perform a conflict detection check immediately before committing a booking, verifying that no other confirmed or in-progress booking overlaps the requested `startAt`/`endAt` window for the same instructor. This check MUST occur inside an atomic database transaction. (UC-003, UC-022)

**TR-F-004** Booking creation (POST /api/v1/bookings) MUST be atomic: the booking record creation and payment capture MUST succeed or fail together. If the payment capture fails after a booking record is written, the booking record MUST be rolled back or immediately set to a failed/cancelled status. No booking MUST remain in a confirmed state without a corresponding captured Payment record. (UC-004, UC-006)

**TR-F-005** All POST /api/v1/bookings requests MUST support client-supplied idempotency keys. Re-submitting the same idempotency key within a rolling 24-hour window MUST return the original response without creating a duplicate booking or charging the card twice. (API design non-functional; UC-004)

**TR-F-006** The booking widget availability query (GET /api/v1/availability) MUST accept `lessonTypeId`, `date`, and `skillLevel` as query parameters, and MUST return only slots where: (a) an eligible instructor has an `Availability` record covering that slot, (b) the instructor has no conflicting confirmed booking, (c) the lesson type's `skillLevels` array includes the requested skill level, and (d) the lesson type's `maxCapacity` has not been reached for group/semi-private types. (UC-001, UC-003)

**TR-F-007** When no slots are available for the requested date/lesson type combination, the availability response MUST indicate that the waitlist is available for that combination, enabling the UI to surface UC-014. (UC-003, alternate flow 2a)

**TR-F-008** The system MUST support booking cancellation by both the guest (UC-008) and school admin (UC-023), with the following behaviour: (a) booking status transitions to `cancelled`, (b) the `cancelledAt` timestamp and `cancellationReason` are recorded, (c) the slot is immediately released back to available inventory, (d) any applicable refund is initiated per the school's configured policy (see TR-F-031 for refund requirements), and (e) a cancellation confirmation notification is dispatched.

**TR-F-009** The system MUST support bulk cancellation of all bookings on a given date or subset of lesson types, triggered by a school admin weather cancellation action (UC-024). The operation MUST: (a) identify all affected bookings in a single query scoped to the tenant, (b) cancel each atomically, (c) initiate full refunds for each, (d) dispatch cancellation emails to all affected guests and instructors, and (e) include a rebooking link in guest emails.

**TR-F-010** The system MUST support reassignment of an existing confirmed booking from one instructor to another by a school admin (UC-025). The reassignment MUST: (a) re-run the conflict detection check (TR-F-003) against the new instructor, (b) update the booking's `instructorId`, (c) notify the guest, the original instructor, and the new instructor.

**TR-F-011** When an admin assigns an instructor to a booking (UC-022), the system MUST verify that the instructor's `onboardingStatus` is `approved` before allowing the assignment. Instructors with `pending` or `inactive` status MUST be excluded from the assignment candidate list.

**TR-F-012** The booking engine MUST enforce a skill-level filter: only instructors whose `Instructor.instructorRequirements` (or the `LessonType.instructorRequirements` field on the lesson type) qualifies them for the requested skill level MUST be presented to the guest and to the admin assignment UI. (UC-001, UC-022)

**TR-F-013** The system MUST record a check-in timestamp on the booking when an instructor checks in a student (UC-017). The booking status MUST transition to an in-progress state at that point. The check-in action MUST be available from the instructor PWA only when the booking's `startAt` is within an implementation-defined pre-lesson check-in window (recommended: 30 minutes before `startAt`).

**TR-F-014** The system MUST support marking a booking as `no_show` by the instructor (UC-018). This action MUST: (a) transition the booking status to `no_show`, (b) log the event in `AuditLog`, (c) trigger an alert notification to the school admin.

**TR-F-015** A school admin MUST be able to override a `no_show` status and revert it to its prior state (UC-018, alternate flow 5a). The override MUST be logged in `AuditLog` with the admin's user ID and a reason field.

**TR-F-016** The system MUST support attaching free-form session notes to a completed booking by the instructor (UC-019). Notes MUST have a boolean `shared` flag. When `shared = true`, the notes MUST be visible in the guest/household booking history view. When `shared = false`, notes MUST be visible only to the instructor and school admin. Notes visibility controls MUST be enforced at the API response layer, not only in the UI.

---

### 2.2 Payment Processing

**Scope:** UC-004, UC-005, UC-006, UC-008, UC-013, UC-023, UC-024, UC-031, UC-037

---

**TR-F-017** The system MUST implement a payment abstraction layer that routes all charge and refund requests to the resort's configured processor (`Tenant.paymentProcessor`) without exposing processor-specific API details to application-layer code. Switching a tenant's processor MUST require no changes to the booking or cancellation application logic. (UC-037)

**TR-F-018** The system MUST support Stripe and Shift4 as payment processors. The processor integration MUST handle: card tokenization, charge capture, partial and full refunds, and webhook event ingestion. (UC-031, UC-037)

**TR-F-019** Raw card numbers (PAN) MUST never be stored, logged, or transmitted through Slopebook servers. All card data MUST be tokenized client-side using the processor's SDK before any data reaches Slopebook's API. `PaymentMethod` records MUST store only the processor-issued token (`processorTokenId`), masked card number (`last4`), brand, and expiry. (UC-004, PCI scope reduction)

**TR-F-020** Payment credentials (`Tenant.paymentCredentials`) MUST be stored encrypted at rest using an application-layer encryption key (not only database-level encryption). Credentials MUST never be returned in any API response after initial storage. The operator UI MUST display credentials as masked/redacted after saving. (UC-031)

**TR-F-021** The system MUST calculate and record a platform fee of 1.5% of the transaction amount (`Payment.platformFeeCents`) on every captured payment. This fee MUST be reflected separately in the revenue reports. (UC-027, data model)

**TR-F-022** The system MUST present processor errors to end users using a processor-agnostic, user-friendly message. Processor-specific error codes MUST be logged internally but MUST NOT be surfaced in API responses to client applications. (UC-037, alternate flow 3a)

**TR-F-023** When a charge to a card on file fails (UC-006, alternate flow 5a), the system MUST notify the guest to update their payment method. The booking MUST NOT be confirmed until a successful payment capture is recorded.

**TR-F-024** The system MUST support guest checkout (no account) where the card is tokenized once for the transaction and the token is not persisted beyond the booking's payment record. If the guest opts in to save the card, an account MUST be created or the token associated with an existing account. (UC-004, UC-005)

**TR-F-025** The system MUST support storing multiple payment methods per household (`PaymentMethod` table). One card MUST be flaggable as the default (`isDefault = true`). The household MUST be able to add, remove, and change the default card at any time (UC-013). Removing the only card while an upcoming booking's auto-charge is pending MUST trigger a warning to the user before deletion proceeds.

**TR-F-026** The payment service MUST consume Stripe and Shift4 webhooks (POST /api/v1/webhooks/stripe and /api/v1/webhooks/shift4) to reconcile payment status asynchronously. Incoming webhook events MUST be validated using the processor's signature verification mechanism before processing.

**TR-F-027** All refund operations MUST record the refunded amount in `Payment.refundedAmountCents` and update `Payment.status` to `refunded` or `partially_refunded` as appropriate. If a refund fails on the processor side, the system MUST flag the booking for admin review and send an alert notification to the school admin. (UC-008, alternate flow 5a)

**TR-F-028** The system MUST support a configurable cancellation policy per school, expressed as: (a) full refund if cancelled N or more hours before the lesson, (b) partial refund percentage if cancelled within N hours, (c) no refund within M hours or for no-shows. The refund calculation engine MUST apply the correct policy at the time of cancellation and display the calculated refund amount for confirmation before executing. (UC-008, UC-023)

**TR-F-029** School admins MUST be able to override the calculated refund amount when cancelling on behalf of a guest (UC-023, alternate flow 3a). The override amount and the admin's user ID MUST be logged in `AuditLog`.

**TR-F-030** The payment service MUST support POST /api/v1/payments/charge and POST /api/v1/payments/:id/refund with idempotency keys to prevent duplicate charges or duplicate refunds. (API design non-functional)

---

### 2.3 Scheduling & Availability

**Scope:** UC-020, UC-022, UC-025, UC-029

---

**TR-F-031** The system MUST support recurring availability blocks for instructors using RRULE notation stored in `Availability.recurrence`. The scheduling engine MUST expand RRULE patterns into discrete bookable slots when answering availability queries, within a configurable look-ahead window (minimum 90 days). (UC-020)

**TR-F-032** The system MUST support one-off availability blocks (where `Availability.recurrence` is null) as date-specific overrides, including blocking. An `isBlocked = true` availability record MUST suppress any bookable slots in that window, overriding any recurring availability. (UC-020)

**TR-F-033** When an instructor sets a date-specific unavailability override on a date that already has one or more confirmed bookings, the system MUST detect and surface the conflict to the instructor (UC-020, alternate flow 4a). The system MUST NOT silently remove or hide the existing bookings. Resolution requires admin intervention.

**TR-F-034** The schedule query endpoint (GET /api/v1/schedule?date=&instructorId=) MUST return a list of all booking slots for the given date and instructor, including their current status. The admin schedule view MUST be able to query across multiple instructors for a given date. (UC-016, UC-022)

**TR-F-035** The system MUST support instructor availability management from the instructor PWA (UC-020). Changes to availability MUST be reflected in the guest-facing booking calendar in near-real-time (maximum propagation delay: 60 seconds under normal load).

**TR-F-036** The system MUST support calendar sync export: confirmed bookings MUST include a downloadable `.ics` URL in the API response and in confirmation emails. The `.ics` file MUST contain: event title (lesson type name), start/end times, instructor name, and meeting point if available. (UC-004, UC-005, UC-006, UC-015, UC-036)

**TR-F-037** The system MUST record a `Instructor.workdayHandoffAt` timestamp when an instructor triggers the Workday handoff action. The API endpoint POST /api/v1/instructors/:id/workday-handoff MUST be restricted to instructors acting on their own profile and to school admins. The earnings data snapshot used for the handoff MUST be retrievable after the fact. (UC-021, data model)

---

### 2.4 Waitlist System

**Scope:** UC-014, UC-015, UC-028

---

**TR-F-038** The waitlist system MUST support two modes, stored in `WaitlistEntry.mode`: (a) `time_slot` — user wants any available instructor at the specified date/time for the specified lesson type; (b) `instructor` — user wants a specific instructor (recorded in `WaitlistEntry.targetInstructorId`) at the specified date/time. (UC-014)

**TR-F-039** When a booking is cancelled or new instructor availability is added, the system MUST automatically scan the waitlist for entries matching the newly available slot (matching on `lessonTypeId`, `targetDate`, and mode logic). If a match is found, the first eligible waitlist entry in FIFO order MUST be promoted to `notified` status. (UC-015)

**TR-F-040** Upon promotion, the system MUST: (a) set `WaitlistEntry.notifiedAt` to the current timestamp, (b) set `WaitlistEntry.expiresAt` to `notifiedAt + 2 hours`, (c) send an email and/or SMS notification to the user with a one-click accept link. (UC-015)

**TR-F-041** The accept link MUST remain valid only until `WaitlistEntry.expiresAt`. After expiry, the entry status MUST automatically transition to `expired`, and the slot MUST be offered to the next waitlist entry. The expiry sweep MUST be implemented as a scheduled background job running at least every 5 minutes. (UC-015, alternate flow 3a)

**TR-F-042** When a notified user clicks the accept link, the system MUST present the booking summary and payment step (UC-015, step 4). The booking creation from the waitlist accept flow MUST follow the same atomic booking+payment requirement as TR-F-004. If payment fails, the system MUST retry once; if the retry also fails, the entry MUST be marked as expired and the next waitlist entry MUST be promoted. (UC-015, alternate flow 5a)

**TR-F-043** School admins MUST be able to manually promote a waitlist entry via PATCH /api/v1/waitlist/:id/promote, triggering the same notification flow as TR-F-040. If no matching slot exists at the time of manual promotion, the API MUST return an error indicating that availability must be created first. (UC-028)

**TR-F-044** Waitlist entries MUST be associated with an authenticated user account where available. For unauthenticated users, the email address collected at waitlist signup MUST be stored and used for notification delivery. (UC-014, step 5)

**TR-F-045** The 2-hour accept window is the platform default. Note: OQ-009 asks whether this should be configurable per resort. If made configurable, a `Tenant`-level field MUST store the configured window duration, and `WaitlistEntry.expiresAt` MUST be computed from that value. Until OQ-009 is resolved, the value is hardcoded at 2 hours.

---

### 2.5 Household & Learner Management

**Scope:** UC-010, UC-011, UC-012, UC-013

---

**TR-F-046** A `Household` record MUST be associated with exactly one owner (`Household.ownerId`), who MUST hold the `guest` or higher role. Multiple `Learner` sub-profiles MAY be linked to a single `Household`. (UC-010)

**TR-F-047** Learner profiles MUST capture: `firstName`, `lastName`, `dateOfBirth`, `skillLevel`, and optional `notes`. The `dateOfBirth` field MUST be used to enforce a minimum age threshold at profile creation (UC-010, step 3a). The specific minimum age value is subject to OQ-007 and MUST be configurable at the platform level pending resolution of that open question.

**TR-F-048** When creating a booking, the booking payload MUST include a `learnerId` referencing a `Learner` record that belongs to the authenticated user's household. Booking `learnerId` MUST be validated against the household of the authenticated user's JWT claims. Cross-household booking MUST be rejected at the API layer. (UC-011)

**TR-F-049** The skill level recorded on a booking (`Booking` record) MUST reflect the value at booking time, which may differ from `Learner.skillLevel` if the head of household overrides it during checkout. The override MUST NOT update the `Learner.skillLevel` persisted profile value. (UC-011, alternate flow 3a)

**TR-F-050** The household upcoming lessons view MUST return all bookings where `Booking.learnerId` belongs to any `Learner` in the authenticated user's household. The API MUST support filtering by `learnerId` and by `status`. (UC-012)

**TR-F-051** A learner MAY be added inline during the checkout flow without requiring a separate navigation step to household management. The inline add MUST invoke the same validation rules as TR-F-047 before allowing the booking to proceed. (UC-011, alternate flow 1a)

---

### 2.6 Notifications

**Scope:** UC-008, UC-009, UC-014, UC-015, UC-024, UC-025, UC-026, UC-036

---

**TR-F-052** The notification service MUST be event-driven and consume the following internal events: `booking.confirmed`, `booking.cancelled`, `booking.reassigned`, `waitlist.slot_available`, `waitlist.accepted`, `booking.reminder`, `lesson.weather_cancel`, `booking.no_show`, `instructor.certification_expiry`. (UC-036, API design)

**TR-F-053** Every notification MUST be rendered in the recipient's preferred language (`User.preferredLanguage` or `Tenant.defaultLanguage` as fallback). Bilingual notification templates MUST exist for all events listed in TR-F-052. (UC-009, UC-035, UC-036)

**TR-F-054** For all booking-related notification events, the email MUST include an `.ics` calendar attachment (as per TR-F-036). (UC-004, UC-015, UC-036)

**TR-F-055** The system MUST dispatch a 24-hour lesson reminder notification to the guest (and optionally the instructor) before each upcoming lesson. This MUST be implemented as a scheduled job that queries confirmed bookings with `startAt` between `now + 23h` and `now + 25h`. (UC-036)

**TR-F-056** Email delivery MUST be retried up to 3 times on transient failure. All delivery failures MUST be logged for admin review. SMS delivery failures MUST be silently skipped if the recipient has no verified phone number on file. (UC-036, alternate flows 3a and 4a)

**TR-F-057** The system MUST send a certification expiry alert to the school admin when an instructor's certification is within 60 days of expiry. A dashboard flag MUST also be set. If the certification expires without renewal, the instructor MUST be blocked from receiving new booking assignments. (UC-026)

**TR-F-058** For weather cancellation bulk events (UC-024), the cancellation notification to guests MUST include a rebooking link that deep-links back into the booking widget pre-populated with the original lesson type and skill level.

**TR-F-059** Webhook delivery to operator-configured external endpoints (UC-034) MUST include the following events: `booking.confirmed`, `booking.cancelled`, `waitlist.promoted`. Webhooks MUST include a signature header for endpoint verification, and the system MUST retry failed webhook deliveries with exponential backoff.

---

### 2.7 Reporting & Analytics

**Scope:** UC-021, UC-027, UC-033

---

**TR-F-060** The revenue report (GET /api/v1/reports/revenue) MUST return: gross revenue, platform fee (1.5%), and net revenue, grouped by the requested `groupBy` parameter (day, week, or month). The report MUST support optional filters by `instructorId` and `lessonTypeId`. All figures MUST be returned in the tenant's configured currency without cross-currency conversion. (UC-027)

**TR-F-061** The utilization report (GET /api/v1/reports/utilization) MUST return booked slots versus total available instructor-hours for the requested period, optionally filtered by `instructorId`. (UC-027, alternate flow 2a)

**TR-F-062** The student analytics report (GET /api/v1/reports/students) MUST be scoped to the authenticated user's tenant. The report MUST support filtering and MUST include at minimum: total students, bookings per learner, and lesson type distribution. (API design)

**TR-F-063** All reports MUST support CSV export via GET /api/v1/reports/export?type=&from=&to=. The exported file MUST be UTF-8 encoded and MUST include a header row. (UC-027, UC-033)

**TR-F-064** The operator-level consolidated revenue report MUST aggregate data across all schools (tenants) under the operator's scope, broken down by school, lesson type, and currency. Multiple currency totals MUST be presented separately; no FX conversion MUST be performed. (UC-033)

**TR-F-065** The instructor earnings dashboard (GET /api/v1/instructors/:id/earnings) MUST return earnings summaries for: today, current week, and current season, with a per-lesson-type breakdown. If tips are enabled by the school, tips MUST appear as a separate line item. The endpoint MUST support a custom `from`/`to` date range query parameter. (UC-021)

---

### 2.8 Operator / White-Label

**Scope:** UC-030, UC-031, UC-032, UC-033, UC-034

---

**TR-F-066** A `Tenant` with `subscriptionTier = enterprise` MUST have access to the white-label configuration feature. The system MUST support a custom domain, custom logo, and custom color scheme for the booking widget. The system MUST generate an iframe embed code and a JS snippet for the operator. (UC-032)

**TR-F-067** The system MUST support custom domain verification. The operator MUST be able to enter a custom domain, and the system MUST provide DNS verification instructions. The domain MUST be set to a verified state before white-label rendering activates. The system MUST poll for DNS propagation with a configurable check interval. (UC-032, alternate flow 2a)

**TR-F-068** Resort-level policies set by the operator (currency, default language, pricing floors, default cancellation policy) MUST propagate to all child schools as defaults. School admins MUST be able to override the cancellation policy at the school level. (UC-030)

**TR-F-069** Changing a tenant's operating currency MUST only affect new bookings created after the change. Existing bookings MUST retain the currency in which they were originally transacted. The system MUST warn the operator before applying a mid-season currency change. (UC-030, alternate flow 2a)

**TR-F-070** The payment processor configuration UI MUST allow the operator to select Stripe or Shift4, enter credentials, and trigger a test transaction before activating the processor. Credentials MUST be encrypted per TR-F-020 and MUST never be returned in any API response. (UC-031)

**TR-F-071** The operator MUST be able to generate and rotate API keys for third-party integrations. Key rotation MUST immediately invalidate the previous key. Operators MUST be able to configure webhook subscriptions per endpoint URL, selecting which event types to receive. (UC-034)

**TR-F-072** API keys generated for operators MUST be scoped to the operator's tenant(s). API requests authenticated with an operator key MUST be subject to the same role-based authorization rules as operator-role JWT claims. (UC-034)

---

### 2.9 Instructor Operations

**Scope:** UC-016, UC-017, UC-018, UC-019, UC-020, UC-021, UC-026, UC-038

---

**TR-F-073** The instructor PWA MUST present a daily schedule view showing all confirmed bookings for the current date, ordered chronologically. Each booking card MUST display: learner name (or household family name), skill level, lesson type, and meeting point. (UC-016)

**TR-F-074** The instructor onboarding workflow MUST enforce the following states via `Instructor.onboardingStatus`: `pending` (submitted, awaiting review), `approved` (active and bookable), `inactive` (suspended or voluntarily inactive). Only `approved` instructors MUST appear in the guest-facing instructor browse view. (UC-038)

**TR-F-075** The school admin MUST be able to approve or reject an instructor submission via PATCH /api/v1/instructors/:id/approve. On rejection, a feedback reason MUST be recorded and an email notification dispatched to the instructor. On approval, the instructor profile MUST immediately become visible in the booking widget. (UC-038)

**TR-F-076** Instructor certification records MUST be stored as structured data in `Instructor.certifications` (JSON), including: certification body (PSIA or CSIA), certification level, and expiry date. The system MUST support expiry tracking and alerting as defined in TR-F-057. (UC-026)

**TR-F-077** The electronic waiver capture requirement at check-in (UC-017, alternate flow 4a) is subject to OQ-008 (jurisdiction-specific rules). The data model MUST reserve space for a waiver signature reference on the booking record, even if the feature is not activated at launch. The check-in endpoint MUST accept an optional `waiverSignatureToken` field.

**TR-F-078** The instructor earnings endpoint and dashboard MUST be accessible only to the instructor themselves (own profile) and to school admins scoped to the same tenant. Platform admins MAY access any tenant's earnings data. (UC-021)

---

### 2.10 Authentication & Authorization

**Scope:** UC-004, UC-005, UC-006, UC-009, UC-022 through UC-034, UC-037, UC-038

---

**TR-F-079** All API endpoints MUST require a valid Bearer JWT except for: POST /api/v1/auth/register, POST /api/v1/auth/login, public availability queries (GET /api/v1/availability), and public lesson type catalogue queries. (API design)

**TR-F-080** JWTs MUST encode the following claims: `sub` (user ID), `tenantId`, `role`, `preferredLanguage`, and `exp`. The `tenantId` claim MUST be used as the primary tenant isolation boundary for all data access. (API design)

**TR-F-081** Token refresh MUST be supported via POST /api/v1/auth/refresh. Access token lifetime MUST be short (recommended: 15 minutes). Refresh tokens MUST be rotated on each use and stored server-side to support revocation. (API design)

**TR-F-082** Role-based access control MUST be enforced at the API gateway and MUST not rely solely on client-side checks. The role hierarchy and access grants are:
- `guest`: own household, own learners, own bookings, own payment methods.
- `instructor`: own profile, own availability, assigned bookings, own earnings.
- `school_admin`: all data within their tenant.
- `operator`: all data within their resort's tenants, plus white-label and processor configuration.
- `platform_admin`: all tenants, all data. (API design auth section)

**TR-F-083** All database queries that access tenant-scoped entities (`Booking`, `Learner`, `Instructor`, `LessonType`, `Availability`, `WaitlistEntry`, `Payment`, `AuditLog`) MUST include a `tenantId` filter derived from the authenticated JWT. Absence of a `tenantId` in the JWT for a tenant-scoped query MUST result in a 403 response.

**TR-F-084** Instructor-facing endpoints that expose student personal data (learner name, skill level, booking notes) MUST be restricted to the instructor's own assigned bookings. An instructor MUST NOT be able to query another instructor's student data within the same tenant. (TR-F-082 elaboration)

**TR-F-085** Guest checkout (no account) MUST follow the unauthenticated booking path, where no JWT is required for the initial booking payload submission. However, payment tokenization MUST still occur client-side, and the booking record MUST be associated with the guest's email address rather than a user ID. (UC-004)

---

### 2.11 i18n & Multi-Currency

**Scope:** UC-009, UC-030, UC-033, UC-035

---

**TR-F-086** The platform MUST support English (en) and French (fr) as user interface languages across all four application surfaces. Language selection priority order MUST be: (1) authenticated user's `User.preferredLanguage`, (2) resort's `Tenant.defaultLanguage`, (3) browser locale. (UC-035)

**TR-F-087** All lesson type names, descriptions, and instructor bios MUST have separate fields for English and French variants (`nameEn`/`nameFr`, `bioEn`/`bioFr`). When only one language variant is populated, the system MUST fall back to the available variant rather than displaying an empty field. (UC-035, alternate flow 3a)

**TR-F-088** All notification templates (email and SMS) MUST exist in both English and French. The language selection for notifications MUST use the recipient's `User.preferredLanguage` at the time of dispatch. (UC-009, UC-036)

**TR-F-089** The platform MUST support USD and CAD as operating currencies. Currency MUST be configured at the tenant (`Tenant.currency`) level. All price amounts MUST be stored and returned in the tenant's configured currency. (UC-030)

**TR-F-090** The system MUST NOT perform any currency conversion. Multi-currency reports MUST present each currency's totals in separate columns or sections. The operator-level consolidated report MUST display each school's revenue in its own currency without aggregation across currencies. (UC-033, alternate flow 4a)

---

## 3. Non-Functional Requirements

### 3.1 Performance

**TR-NF-001** The booking widget availability query (GET /api/v1/availability) MUST respond within 2 seconds at the 95th percentile (p95) when measured over a simulated 4G mobile connection (estimated 50–100 ms added latency). This applies to the full round-trip including server processing. (UC-003)

**TR-NF-002** The daily schedule query for instructors (GET /api/v1/schedule) MUST respond within 1 second at p95 under normal load. The instructor PWA MUST be able to display today's schedule within 3 seconds of app open on a 4G connection. (UC-016)

**TR-NF-003** The booking confirmation flow (POST /api/v1/bookings including payment capture) MUST complete end-to-end within 5 seconds at p95, excluding network latency attributable to the payment processor. (UC-004)

**TR-NF-004** Report generation endpoints MUST respond within 10 seconds at p95 for date ranges up to 12 months. For longer ranges or large datasets, asynchronous generation with a status-polling model is acceptable. (UC-027, UC-033)

**TR-NF-005** The platform MUST maintain the performance targets in TR-NF-001 through TR-NF-003 under a concurrent load of at least 200 simultaneous active booking sessions per tenant during peak season. Peak season is defined as December–March.

---

### 3.2 Scalability

**TR-NF-006** The system MUST enforce complete data isolation between tenants. A query for any tenant-scoped resource MUST never return data from another tenant, regardless of application logic paths. Tenant isolation MUST be tested with dedicated cross-tenant isolation test cases.

**TR-NF-007** The booking engine MUST handle concurrent booking attempts for the same time slot without allowing double-booking. Database-level optimistic or pessimistic locking MUST be used to serialize concurrent writes to the same slot within an atomic transaction. (TR-F-003, TR-F-004)

**TR-NF-008** The platform architecture MUST support horizontal scaling of API services. No service MUST maintain local in-memory state that prevents running multiple instances behind a load balancer. Session state MUST be stored externally (e.g., Redis or equivalent).

**TR-NF-009** Background jobs (24-hour reminder sweep, waitlist expiry sweep, certification expiry alerting) MUST be implemented in a manner that supports exactly-once execution even when multiple job worker instances are running. A distributed lock or job deduplication mechanism MUST be used. (TR-F-041, TR-F-055, TR-F-057)

---

### 3.3 Security

**TR-NF-010** All external communications MUST use TLS 1.3 minimum. TLS 1.2 and earlier MUST be disabled at the API gateway. (API design)

**TR-NF-011** `Tenant.paymentCredentials` MUST be encrypted at the application layer using a key management system (KMS) or equivalent. The encryption key MUST be stored separately from the database. Key rotation MUST be supported without downtime. (TR-F-020)

**TR-NF-012** The system MUST reduce its PCI DSS scope to SAQ A-EP or SAQ A by ensuring that: (a) raw PANs never traverse Slopebook servers (TR-F-019), (b) the payment page uses processor-hosted fields or processor JS SDKs, (c) `PaymentMethod` records contain only processor tokens, last4, brand, and expiry. (UC-004, UC-037)

**TR-NF-013** All mutating operations (create, update, delete, status transitions, admin overrides) on bookings, payments, instructors, learners, and lesson types MUST produce an `AuditLog` record capturing: `tenantId`, `actorId`, `action`, `targetType`, `targetId`, and `metadata` (before/after values where relevant). (API design, UC-023, UC-018, UC-015)

**TR-NF-014** Passwords MUST be stored as hashes using a memory-hard hashing algorithm (bcrypt with cost factor >= 12, or Argon2id). Plaintext passwords MUST never be logged or stored. (data model: `User.passwordHash`)

**TR-NF-015** API keys issued to operators (TR-F-071) MUST be hashed before storage, following the same pattern as passwords. The raw key MUST be shown to the operator only once at generation time. Revocation MUST take effect immediately without cache delay.

---

### 3.4 Reliability

**TR-NF-016** Booking creation and payment capture MUST be atomic, using a database transaction that encompasses both operations. Partial failure states (booking created but payment not captured, or payment captured but booking not confirmed) MUST be detected and resolved by a reconciliation job running at least every 5 minutes. (TR-F-004)

**TR-NF-017** Idempotency keys on POST /api/v1/bookings and POST /api/v1/payments/charge MUST be stored and checked server-side. Re-use of a key within the valid window MUST return the original response (including the original status code) and MUST NOT trigger a second database write or payment charge. (API design, TR-F-005, TR-F-030)

**TR-NF-018** The soft-hold mechanism (TR-F-002) MUST have a guaranteed TTL enforced server-side. Client-side disconnection or browser closure MUST not leave holds orphaned beyond the TTL.

**TR-NF-019** All external processor webhook deliveries MUST be acknowledged with an HTTP 2xx response within the processor's timeout window. Processing of webhook payloads MUST be decoupled from the HTTP response (i.e., process asynchronously after acknowledging receipt) to avoid timeouts under load.

**TR-NF-020** The system MUST implement retry logic with exponential backoff for outbound notifications (email, SMS) and outbound webhooks. A dead-letter queue or equivalent MUST capture events that exhaust retries for manual inspection.

---

### 3.5 Observability

**TR-NF-021** Every API request and response MUST carry an `X-Request-ID` header. If the client provides the header, the value MUST be propagated through all downstream service calls. If absent, the gateway MUST generate a UUID and attach it. All log entries for a given request MUST include the `X-Request-ID`. (API design)

**TR-NF-022** All API error responses MUST follow a consistent JSON envelope:
```json
{
  "error": {
    "code": "<machine-readable-code>",
    "message": "<human-readable-message>",
    "requestId": "<X-Request-ID>"
  }
}
```
Processor-specific error codes MUST be mapped to internal codes before inclusion. (API design, TR-F-022)

**TR-NF-023** The `AuditLog` table MUST be treated as append-only. No record MUST ever be updated or deleted. Audit log writes MUST not be deferred: they MUST be committed in the same transaction as the action they record wherever possible, or via a reliable outbox pattern otherwise. (TR-NF-013)

**TR-NF-024** The system MUST expose structured logs (JSON format) for all API requests, background job executions, and payment events. Log entries MUST include at minimum: timestamp, `X-Request-ID`, `tenantId`, `actorId` (if authenticated), service name, endpoint or job name, duration, and status code or outcome.

---

### 3.6 Rate Limiting & Abuse Prevention

**TR-NF-025** The API gateway MUST enforce rate limits on a per-tenant AND per-IP basis. Exceeding the rate limit MUST return HTTP 429 with a `Retry-After` header. Rate limit thresholds MUST be configurable per subscription tier. (API design)

**TR-NF-026** The booking endpoint (POST /api/v1/bookings) MUST apply stricter rate limiting than read endpoints to prevent seat-holding abuse. Repeated booking attempts for the same slot from the same IP or user MUST trigger a temporary block with a logged event.

**TR-NF-027** Webhook ingestion endpoints (POST /api/v1/webhooks/stripe and /shift4) MUST validate the processor's HMAC or signature header before processing. Requests failing signature validation MUST be rejected with HTTP 400 and logged. (TR-F-026)

---

## 4. Service Boundary Summary

The following table describes each service's owned data, its direct consumers, and its cross-service dependencies.

---

### 4.1 Account & Identity Service

| Attribute | Detail |
|---|---|
| **Owned Data** | `User`, `Household`, `Learner`, `PaymentMethod` |
| **Consumers** | All four application surfaces (customer, instructor, admin, operator) for authentication; Booking Engine for learner and household validation; Payment Service for payment method token retrieval |
| **Endpoints** | POST /api/v1/auth/*, GET+PATCH /api/v1/me, GET+POST+PATCH /api/v1/households/:id, CRUD /api/v1/households/:id/learners/:learnerId, CRUD /api/v1/payment-methods |
| **Cross-Service Dependencies** | Notification Service (dispatches registration confirmation and password reset emails); Payment Service (payment method tokens are passed to Payment Service on booking; Account & Identity does not call the payment processor directly) |
| **Notes** | Tenant resolution is handled by the API gateway from JWT claims; this service does not re-validate tenantId on every call but does enforce household-ownership rules on learner and payment-method queries |

---

### 4.2 Instructor Service

| Attribute | Detail |
|---|---|
| **Owned Data** | `Instructor` (profile, certifications, photo, bio, onboarding status, workdayHandoffAt) |
| **Consumers** | Admin app (staff roster, approval workflow, certification management); Instructor PWA (own profile); Booking Engine (instructor eligibility checks); Operator app (staff visibility) |
| **Endpoints** | GET+POST+PATCH /api/v1/instructors, GET+PATCH /api/v1/instructors/:id, PATCH /api/v1/instructors/:id/approve, POST /api/v1/instructors/:id/workday-handoff, GET /api/v1/instructors/:id/earnings |
| **Cross-Service Dependencies** | Scheduling & Availability Service (for earnings calculation, completed bookings are queried); Notification Service (approval/rejection and certification expiry alerts); Reporting Service (earnings data feed) |

---

### 4.3 Catalog & Lesson Service

| Attribute | Detail |
|---|---|
| **Owned Data** | `LessonType` (name, description, category, duration, price, capacity, skill levels, upsells) |
| **Consumers** | Customer app (booking widget lesson type browse); Admin app (lesson configuration); Booking Engine (validates lesson type on booking creation); Scheduling & Availability Service (availability filtered by lesson type) |
| **Endpoints** | GET+POST+PATCH+DELETE /api/v1/lesson-types |
| **Cross-Service Dependencies** | None (it is a dependency provider, not a consumer of other domain services) |

---

### 4.4 Scheduling & Availability Service

| Attribute | Detail |
|---|---|
| **Owned Data** | `Availability` (instructor availability windows, RRULE recurrence, blocking) |
| **Consumers** | Customer app (slot availability display); Admin app (schedule view, conflict detection); Instructor PWA (availability management) |
| **Endpoints** | GET /api/v1/availability, GET+POST+PATCH+DELETE /api/v1/instructors/:id/availability/:slotId, GET /api/v1/schedule |
| **Cross-Service Dependencies** | Booking Engine (reads confirmed bookings to detect conflicts; this is a read dependency — Scheduling service does not write bookings); Catalog & Lesson Service (applies lesson type capacity and skill-level filters to availability queries); Waitlist System (triggers waitlist slot-available events when new availability is created) |

---

### 4.5 Booking Engine

| Attribute | Detail |
|---|---|
| **Owned Data** | `Booking` (full booking lifecycle: confirmed, cancelled, completed, waitlisted, no_show) |
| **Consumers** | Customer app (booking creation and management); Admin app (assignment, cancellation, no-show, reassignment, session notes, bulk weather cancel); Instructor PWA (check-in, no-show, session notes); Operator app (consolidated booking visibility) |
| **Endpoints** | POST /api/v1/bookings, GET /api/v1/bookings/:id, PATCH /api/v1/bookings/:id/cancel|complete|no-show, GET /api/v1/bookings (filtered), POST /api/v1/bookings/:id/notes, GET+POST+DELETE /api/v1/waitlist, POST /api/v1/waitlist/:id/accept, PATCH /api/v1/waitlist/:id/promote |
| **Cross-Service Dependencies** | Account & Identity Service (validate learner + household ownership); Catalog & Lesson Service (validate lesson type); Scheduling & Availability Service (availability and conflict checks); Payment Service (charge on booking creation, refund on cancellation); Notification Service (all booking lifecycle events) |

---

### 4.6 Payment Service

| Attribute | Detail |
|---|---|
| **Owned Data** | `Payment`, `PaymentMethod` (token management side — token storage owned by Account & Identity but processor calls go through Payment Service) |
| **Consumers** | Booking Engine (charge on create, refund on cancel); Admin app (refund initiation, payment status display); Operator app (processor configuration) |
| **Endpoints** | POST /api/v1/payments/charge (internal), POST /api/v1/payments/:id/refund, GET /api/v1/payments/:id, GET /api/v1/payments (filtered), POST /api/v1/webhooks/stripe|shift4 |
| **Cross-Service Dependencies** | External: Stripe API, Shift4 API; Notification Service (dispatches refund confirmation and payment failure alerts); Booking Engine (updates booking status on payment events via event bus, not direct call) |
| **Notes** | Payment Service endpoints are marked internal-only in the API design; no application surface calls them directly except through the Booking Engine or via admin-initiated refund actions |

---

### 4.7 Notification Service

| Attribute | Detail |
|---|---|
| **Owned Data** | No persistent domain entities; notification delivery logs stored for observability |
| **Consumers** | All services emit events that this service processes |
| **Endpoints** | No public-facing endpoints; event-driven via internal message bus |
| **Cross-Service Dependencies** | Account & Identity Service (resolves recipient email, phone number, language preference); Booking Engine (booking event payloads); Payment Service (payment event payloads); External: email delivery provider (e.g., SendGrid or SES), SMS provider (e.g., Twilio) |

---

### 4.8 Reporting Service

| Attribute | Detail |
|---|---|
| **Owned Data** | No primary ownership; reads from Payment, Booking, Instructor, LessonType, and Availability tables |
| **Consumers** | Admin app (revenue, utilization, student reports, CSV export); Instructor PWA (earnings); Operator app (consolidated multi-school report) |
| **Endpoints** | GET /api/v1/reports/revenue, GET /api/v1/reports/utilization, GET /api/v1/reports/students, GET /api/v1/reports/export, GET /api/v1/instructors/:id/earnings |
| **Cross-Service Dependencies** | Read-only cross-service dependency on Payment Service, Booking Engine, Instructor Service, Catalog & Lesson Service, and Scheduling & Availability Service data stores; reporting MUST query via service APIs or a read-optimised replica, never directly against primary write stores of other services |

---

## 5. Data Integrity Constraints

### 5.1 Database-Layer Constraints

**TR-DC-001** `Tenant.slug` MUST have a UNIQUE constraint. No two tenants may share the same slug.

**TR-DC-002** `User.email` MUST have a UNIQUE constraint across the entire users table (global uniqueness, not per-tenant).

**TR-DC-003** `Booking.instructorId` + time overlap MUST be enforced by the application layer (TR-F-003) since most relational databases do not natively support range-overlap exclusion without extensions. If using PostgreSQL, an exclusion constraint using `tsrange` on (`instructorId`, `[startAt, endAt)`) MUST be added where possible, with status filter excluding `cancelled` and `no_show`.

**TR-DC-004** `Learner.householdId` MUST be a non-nullable FK to `Household.id`. Deleting a household MUST be blocked if any `Learner` records reference it (restrict-on-delete).

**TR-DC-005** `Booking.instructorId` and `Booking.lessonTypeId` are non-nullable FKs. A booking MUST always reference a valid instructor and lesson type. `Booking.learnerId` is nullable to support guest checkout (CRT-H-003, `data-model-proposed.md`); when `learnerId IS NULL`, `Booking.guestCheckoutId` MUST be non-null. A CHECK constraint MUST enforce `(learnerId IS NOT NULL OR guestCheckoutId IS NOT NULL)` at the database layer. The booking engine MUST reject any request that provides neither field.

**TR-DC-006** `Payment.amountCents` MUST be a positive integer. `Payment.refundedAmountCents` MUST NOT exceed `Payment.amountCents`. Both constraints MUST be enforced with CHECK constraints at the database layer.

**TR-DC-007** `WaitlistEntry.expiresAt` MUST be greater than `WaitlistEntry.notifiedAt`. This MUST be enforced by a CHECK constraint or application-layer validation.

**TR-DC-008** `PaymentMethod.isDefault` — at most one record per `householdId` SHOULD have `isDefault = true`. This is a soft constraint; the application layer MUST enforce it by clearing the previous default when a new default is set. A partial unique index on (`householdId`, `isDefault`) WHERE `isDefault = true` is recommended.

**TR-DC-009** `LessonType.priceAmount` MUST be a positive decimal value. A CHECK constraint at the database layer MUST prevent zero or negative prices.

**TR-DC-010** Instructor tenant associations MUST be managed through the `InstructorTenant` join table; `Instructor` no longer carries a direct `tenantId` FK (CRT-H-004, `data-model-proposed.md`). On creation of an `InstructorTenant` record, the application layer MUST verify that the referenced instructor's `User` account is either platform-level (`User.tenantId IS NULL`) or already associated with the same tenant. A `User` bound to a different tenant MUST NOT be added to a second tenant without first being converted to a multi-tenant user (`User.tenantId` set to null). All tenant-scoped queries that previously joined through `Instructor.tenantId` MUST be updated to join through `InstructorTenant.tenantId`.

### 5.2 Application-Layer Constraints

**TR-DC-011** All queries on tenant-scoped tables MUST include a `tenantId` condition derived from the JWT. No cross-tenant data leak is acceptable under any code path. The full list of tenant-scoped tables (updated to reflect `data-model-proposed.md`) is: `Booking`, `Learner`, `Instructor` (via `InstructorTenant.tenantId`), `LessonType`, `Availability`, `WaitlistEntry`, `Payment`, `AuditLog`, `GuestCheckout`, `GroupSession`, `SlotReservation`, `CancellationPolicy`, `WhiteLabelConfig`, `ApiKey`, `Webhook`, `WorkdayHandoff`.

**TR-DC-012** PAN must never be stored (TR-F-019). Automated tests MUST include a check that no `Payment` or `PaymentMethod` field accepts or persists a value matching a Luhn-valid 13–19 digit number.

**TR-DC-013** A `Booking` in `confirmed` status MUST have exactly one associated `Payment` record in `captured` status. The `Payment.bookingId FK → Booking` relationship (added in `data-model-proposed.md`, CRT-M-005) enables enforcement at the database layer via a UNIQUE partial index on `(Payment.bookingId)` WHERE `status = 'captured'`. The booking engine MUST additionally enforce this invariant at the application layer before returning a success response on booking creation.

**TR-DC-014** `Booking.startAt` MUST be before `Booking.endAt`. This MUST be enforced by both a database CHECK constraint and application-layer validation.

**TR-DC-015** `Learner` records associated with bookings MUST belong to the same household as the authenticated user. The application layer MUST validate `Learner.householdId` against the authenticated user's `Household.ownerId` on every booking creation call.

**TR-DC-016** `LessonType.isActive = false` records MUST NOT be returned in public availability queries. The booking engine MUST filter out inactive lesson types at query time.

**TR-DC-017** `Availability` records with `isBlocked = true` MUST be treated as blocking all bookable slots in the covered time range. The application layer MUST apply this filter when computing available slots, overriding any overlapping non-blocked availability window.

**TR-DC-018** `AuditLog` records MUST be immutable. No UPDATE or DELETE statement MUST be permitted on the `audit_logs` table. This MUST be enforced by database-level row-security or trigger policies in addition to application-layer controls.

---

## 6. Technical Requirements Gaps

The following requirements are implied by the use cases but are not yet addressed — or are only partially addressed — in the current API design (`design-docs/api-design.md`) or data model (`design-docs/data-model.md`). These are candidates for future work or open questions to be resolved before implementation.

---

**GAP-001: Soft-Hold / Slot Reservation Mechanism**
The API design defines a booking creation endpoint but does not describe how temporary slot holds (UC-003, step 5) are implemented. There is no `SlotReservation` entity in the data model and no endpoint for creating or releasing a hold. A hold model (in-memory with TTL, Redis key, or database table) must be designed and documented before the booking engine can be implemented.

**GAP-002: Booking Status — In-Progress State**
UC-017 (check-in) requires the booking status to transition to an "in progress" state. The current `Booking.status` enum (`confirmed`, `cancelled`, `completed`, `waitlisted`, `no_show`) does not include an `in_progress` value. The data model must be updated to add this state or document how check-in is represented without it.

**GAP-003: Session Notes Sharing Flag**
UC-019 requires session notes to have a `shared` boolean flag. The current data model stores `notes text` on the `Booking` entity with no sharing flag. Either a separate `SessionNote` entity with a `isShared` boolean is needed, or the `Booking` entity must be extended with `sessionNotes text` and `sessionNotesShared boolean` fields.

**GAP-004: Cancellation Policy Configuration**
UC-008 and UC-023 require the system to apply a configured cancellation policy to calculate refund amounts. Neither the data model nor the API design defines a `CancellationPolicy` entity or configuration structure. The policy parameters (refund windows, percentages) must be modelled — either as a new entity or as a JSON field on `Tenant` or a new `SchoolPolicy` entity.

**GAP-005: Meeting Point Field**
UC-016 (instructor schedule view) references a "meeting point" for each lesson. No `meetingPoint` field exists on `Booking`, `LessonType`, or any other entity in the current data model. This field must be added, most likely to `LessonType` (configurable default) with an optional override on `Booking`.

**GAP-006: Instructor-to-Booking Assignment Endpoint**
UC-022 (admin assigns instructor to booking) requires updating a booking's `instructorId`. While PATCH /api/v1/bookings/:id/cancel|complete|no-show is defined, there is no PATCH /api/v1/bookings/:id/assign or equivalent endpoint for instructor assignment. This must be added to the API design.

**GAP-007: Bulk Weather Cancellation Endpoint**
UC-024 requires a bulk cancellation action scoped to a date and optionally a lesson type subset. No bulk cancellation endpoint is defined in the current API design. A dedicated endpoint (e.g., POST /api/v1/bookings/bulk-cancel) with a date filter and optional lesson type filter must be designed.

**GAP-008: Booking Reassignment Endpoint**
UC-025 (admin reassigns booking to a different instructor) requires a distinct endpoint or action, separate from the assignment endpoint in GAP-006, that handles mid-lifecycle reassignment including notifications to all three parties. This is not present in the current API design.

**GAP-009: Instructor Certification Expiry Alerting**
UC-026 requires the system to send certification expiry alerts 60 days before expiry and to block new assignment after expiry. No scheduled job or alert mechanism is described in the API design. A background job, a `certificationAlertSentAt` field (or equivalent state) on the `Instructor.certifications` JSON, and an "assignment blocked" enforcement rule must be designed.

**GAP-010: White-Label / Custom Domain Verification State**
UC-032 requires custom domain DNS verification with a polling mechanism. No `CustomDomain` entity or verification-state field is present in the data model. A `Tenant`-level field or a new `TenantWhiteLabel` entity is needed to store: `customDomain string`, `domainVerified boolean`, `domainVerifiedAt timestamp`, `logoUrl string`, `primaryColor string`, and `embedCodeGeneratedAt timestamp`.

**GAP-011: Operator API Key Management**
UC-034 requires operator-managed API keys with labels, rotation, and webhook endpoint configuration. No `ApiKey` or `WebhookEndpoint` entity exists in the current data model. These entities — with fields for hashed key value, label, tenantId, createdAt, revokedAt, and selected event types — must be added.

**GAP-012: Rebooking Link in Weather Cancellation Emails**
UC-024 requires cancellation emails to include a rebooking link pre-populated with the original lesson type and skill level. The notification service's event model must be extended to include `lessonTypeId` and `skillLevel` in the `lesson.weather_cancel` event payload so the notification template can generate the correct deep link.

**GAP-013: Unauthenticated Guest Waitlist**
UC-014 (step 5) allows unauthenticated users to join the waitlist by providing an email address. `WaitlistEntry` has a `learnerId` FK but no `guestEmail` or equivalent field for unauthenticated entries. The data model must either make `learnerId` nullable (with a `guestEmail` field as an alternative) or require a lightweight guest account creation before waitlist entry.

**GAP-014: Processor Test Transaction**
UC-031 (step 5) requires the system to run a test transaction to verify processor credentials. No test-transaction endpoint or mechanism is described in the API design. An endpoint such as POST /api/v1/operator/payment-processor/test must be designed, along with a safe mechanism (e.g., $0 auth or a processor sandbox) for executing the test.

**GAP-015: Skill Self-Assessment Flow**
UC-001 (alternate flow 4a) requires the system to present a skill self-assessment when the guest has not selected a skill level. No self-assessment question set or data structure is defined in the API design or data model. This flow must be specified, even if it is implemented entirely client-side.

**GAP-016: Electronic Waiver Storage**
UC-017 (alternate flow 4a) and OQ-008 imply the need for electronic waiver capture and storage at check-in. No waiver entity or signature-reference field exists on `Booking` in the current data model. Pending resolution of OQ-008, a `waiverSignatureToken string` (nullable) field should be reserved on `Booking`, and a retention policy must be established.

**GAP-017: Instructor Push Notifications**
UC-022 states the instructor is notified of new booking assignment via "push notification or email." The notification service event model in the API design only enumerates email/SMS events. A push notification channel (e.g., web push for the instructor PWA) must be scoped, including a `PushSubscription` entity or field to store instructor PWA subscription tokens.

**GAP-018: Tips Feature**
UC-021 references a tips line item in the instructor earnings dashboard "if tips are enabled by the school." There is no `tip` field on `Payment` or `Booking`, and no `tipsEnabled` configuration field on `Tenant` or `LessonType`. If tips are in scope for v1.0, these additions must be modelled.

**GAP-019: No-Show Refund Policy Configuration**
UC-018 states that "refund policy is applied per school configuration (typically no refund for no-show)." The cancellation policy structure is already flagged as missing (GAP-004), and the same gap applies to no-show policy. The `CancellationPolicy` structure must include a no-show clause.

**GAP-020: Learner Minimum Age — Platform-Level Configuration**
TR-F-047 requires the minimum learner age to be configurable at the platform level pending resolution of OQ-007. No platform-level configuration entity or settings table is present in the current data model. A `PlatformSettings` entity or environment configuration mechanism must be defined.
