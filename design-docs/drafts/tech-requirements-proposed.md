# Slopebook — Technical Requirements (P0)

**Document Status:** Draft — Generate Pipeline Run 8
**Last Updated:** 2026-04-04
**Author:** Tech-Lead Agent
**Source:** use-cases-p0-proposed.md (Run 8), data-model.md (v0.5), api-design.md, decisions.md
**Scope:** P0 (Alpha) use cases only

---

## TR-001 — Browse available lesson slots

**Use Case:** UC-001
**Services:** Scheduling & Availability, Catalog & Lesson, Instructor
**API Changes:**
- `GET /api/v1/availability?lessonTypeId=&date=&age=&skillLevel=` — add required `age` (integer) and `skillLevel` (enum) params; filters slots to eligible instructors only
- `GET /api/v1/instructors/:id` — return bioEn/bioFr based on Accept-Language header
**Schema Changes:** None
**Auth:** Public (no JWT required for availability query)
**Flags:** i18n, multi-tenant

---

## TR-002 — Reserve a slot (soft hold)

**Use Case:** UC-002
**Services:** Booking Engine, Scheduling & Availability
**API Changes:**
- `POST /api/v1/slot-reservations` — create SlotReservation; return sessionToken and expiresAt; new endpoint
**Schema Changes:** None (SlotReservation schema complete in v0.5)
**Auth:** Public (guest path); guest or JWT for authenticated path
**Flags:** multi-tenant, performance

---

## TR-003 — Guest checkout booking

**Use Case:** UC-003
**Services:** Booking Engine, Payment, Account & Identity, Notification
**API Changes:**
- `POST /api/v1/guest-checkouts` — create GuestCheckout; required fields: email, firstName, lastName, learnerDateOfBirth, skillLevel, preferredLanguage (defaults to browser geolocation, OQ-057); conditional: parentalConsentGiven (required if age < 18, OQ-032)
- `POST /api/v1/bookings` — create Booking from GuestCheckout; links guestCheckoutId; idempotency key scoped to reservationId
- `POST /api/v1/payments/charge` — called once; payment captured before booking DB write
- `POST /api/v1/payments/:id/refund` — called if all 3 DB write retries fail; void with 4 retries at 100ms intervals; on all retries exhausted set Payment.status = void_pending (OQ-056)
**Schema Changes:**
- `GuestCheckout.learnerDateOfBirth date NOT NULL` — required per OQ-032
- `GuestCheckout.skillLevel enum(beginner, intermediate, advanced)` — required per OQ-032
- `GuestCheckout.parentalConsentGiven boolean nullable` — required when age < 18 (OQ-032)
- `GuestCheckout.parentalConsentAt timestamp nullable` — consent timestamp (OQ-032)
- `GuestCheckout.preferredLanguage enum(en, fr) DEFAULT 'en'` — OQ-057; UI defaults to browser geolocation
- `Payment.status void_pending` — added for void compensation state (OQ-056)
**Auth:** Public (no JWT); sessionToken from SlotReservation validates hold
**Flags:** PCI, i18n, multi-tenant
**Retry semantics (OQ-053):** Payment captured once; retries are DB-write-only using the existing Payment record. On 3rd DB write failure, void attempted with 4 retries at 100ms intervals; if void fails after all retries, set Payment.status = void_pending and alert ops.

---

## TR-004 — Authenticated user booking

**Use Case:** UC-004
**Services:** Booking Engine, Payment, Account & Identity, Notification
**API Changes:**
- `POST /api/v1/bookings` — learnerId required for authenticated path; validates Learner belongs to caller's Household
- `POST /api/v1/payments/charge` — card-on-file path uses stored PaymentMethod.processorTokenId [PCI: encrypted]
- `POST /api/v1/payments/:id/refund` — called if all 3 DB write retries fail; same void retry semantics as TR-003 (OQ-056)
**Schema Changes:** None beyond TR-003 additions
**Auth:** `guest` role minimum; Learner must be in caller's Household
**Flags:** PCI, i18n, multi-tenant
**Retry semantics (OQ-053):** Same as TR-003 — DB-write-only retries; payment not re-charged.

---

## TR-005 — Create account with self-Learner

**Use Case:** UC-005
**Services:** Account & Identity
**API Changes:**
- `POST /api/v1/auth/register` — accept additional required fields: dateOfBirth, skillLevel, preferredLanguage (defaults to browser geolocation, OQ-057); atomically create User + Household + self-Learner sub-profile (OQ-048); conditional: parentalConsentGiven (required if age < 18, OQ-032)
**Schema Changes:** None (Learner.parentalConsentGiven/At active in v0.5)
**Auth:** Public (no JWT)
**Flags:** i18n, multi-tenant

---

## TR-006 — Cancel a booking

**Use Case:** UC-006
**Services:** Booking Engine, Payment
**API Changes:**
- `PATCH /api/v1/bookings/:id/cancel` — set status = cancelled; calculate refund from snapshot cancellationPolicyId; trigger `POST /api/v1/payments/:id/refund` if applicable; accepts `instructor` role for own bookings (OQ-058)
**Schema Changes:** None
**Auth:** `guest` (own bookings only), `school_admin` (any booking in tenant), `instructor` (own bookings per OQ-058)
**Flags:** multi-tenant
**Note (OQ-033):** Guest-checkout users have no JWT; no self-service cancel endpoint available for guest path.
**Note (OQ-058):** Instructors have admin-level access to their own lessons and can cancel them directly.

---

## TR-007 — Submit post-lesson rating and optional tip

**Use Case:** UC-007
**Services:** Booking Engine, Payment
**API Changes:**
- `POST /api/v1/bookings/:id/review` — create InstructorRating; validate Booking.status = completed; one rating per booking (unique constraint); description updated: "Submit rating after lesson completion" (CR-002 fix)
- `POST /api/v1/bookings/:id/tip` — [conditional on tip decision] create tip Payment record linked to bookingId; [PCI] new endpoint; only if tip feature retained after OQ-043 resolution
**Schema Changes:**
- `Payment.bookingId nullable` — decisions.md 2026-03-29: bookingId is nullable; at least one of bookingId or lessonPackageId must be non-null (application-layer enforcement)
- `Payment.lessonPackageId uuid FK → LessonPackage, nullable` — decisions.md 2026-03-29; added for P1 package payments; additive
**Auth:** `guest` role; caller's learnerId must match Booking.learnerId
**Flags:** multi-tenant, PCI (tip endpoint)
**Open Technical Questions:** Tip endpoint depends on OQ-043 conflict resolution. If tips removed: omit `POST /api/v1/bookings/:id/tip` and schema carries no impact beyond already-approved schema changes.

---

## TR-008 — Instructor manages availability

**Use Case:** UC-008
**Services:** Scheduling & Availability
**API Changes:**
- `POST /api/v1/instructors/:id/availability` — create availability slot or RRULE recurrence
- `PATCH /api/v1/instructors/:id/availability/:slotId` — update or override; detect conflict with confirmed bookings
- `DELETE /api/v1/instructors/:id/availability/:slotId` — remove slot
**Schema Changes:** None (Availability.recurrence text field in v0.5)
**Auth:** `instructor` (own availability only), `school_admin` (any instructor in tenant)
**Flags:** multi-tenant

---

## TR-009 — Instructor views today's schedule

**Use Case:** UC-009
**Services:** Booking Engine
**API Changes:**
- `GET /api/v1/bookings?instructorId=&from=&to=&status=confirmed` — filter to confirmed bookings for today; `in_progress` status removed (OQ-055)
**Schema Changes:** None
**Auth:** `instructor` (own bookings only)
**Flags:** i18n, multi-tenant

---

## TR-010 — Instructor checks in a student

**Use Case:** UC-010
**Services:** Booking Engine
**API Changes:**
- `PATCH /api/v1/bookings/:id/checkin` — set Booking.checkedInAt = now; status remains confirmed; new endpoint
**Schema Changes:** None
**Auth:** `instructor` (own bookings only)
**Flags:** multi-tenant
**Note (OQ-052):** Smartwaiver deferred. Check-in sets checkedInAt only.
**Note (OQ-055):** checkedInAt field tracks check-in; status goes confirmed → completed or no_show directly.

---

## TR-011 — Instructor marks student as no-show

**Use Case:** UC-011
**Services:** Booking Engine, Payment
**API Changes:**
- `PATCH /api/v1/bookings/:id/no-show` — set status = no_show; apply noShowPolicy from snapshot CancellationPolicy; trigger refund if applicable
**Schema Changes:** None
**Auth:** `instructor` (own bookings)
**Flags:** multi-tenant

---

## TR-012 — Instructor adds session notes

**Use Case:** UC-012
**Services:** Booking Engine
**API Changes:**
- `POST /api/v1/bookings/:id/notes` — create BookingNote; set authorId, authorRole, isSharedWithGuest
- `GET /api/v1/bookings/:id/notes` — list notes for booking (new endpoint; missing from api-design.md)
**Schema Changes:** None
**Auth:** `instructor` (write own notes), `school_admin` (read all), `guest` (read isSharedWithGuest = true only)
**Flags:** multi-tenant

---

## TR-013 — Instructor marks lesson complete

**Use Case:** UC-013 (manual path)
**Services:** Booking Engine, Notification
**API Changes:**
- `PATCH /api/v1/bookings/:id/complete` — set status = completed; emit booking.completed event
**Schema Changes:** None
**Auth:** `instructor` (own bookings)
**Flags:** multi-tenant
**Note (OQ-055):** Status transition: confirmed → completed directly.

---

## TR-013a — Booking auto-completion

**Use Case:** UC-013 (auto-completion path)
**Services:** Booking Engine, Notification
**API Changes:** None (internal scheduled job — no new public endpoint)
**Schema Changes:** None
**Auth:** System (no JWT; internal scheduler)
**Flags:** multi-tenant, performance
**Implementation note:** Scheduled job runs every N minutes (interval TBD); queries Bookings where status = confirmed AND endAt < now - 2h; sets status = completed; fires booking.completed event for each. Idempotency: check status = confirmed before each write. Emit AuditLog entry with actorType = system. (decisions.md 2026-03-29)

---

## TR-014 — Admin views the schedule

**Use Case:** UC-014
**Services:** Booking Engine, Scheduling & Availability
**API Changes:**
- `GET /api/v1/schedule?date=&instructorId=` — admin view of all instructor schedules; existing endpoint
- Real-time updates via server-sent events or polling (push mechanism TBD — open design question)
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** multi-tenant, performance

---

## TR-015 — Admin reassigns a booking

**Use Case:** UC-015
**Services:** Booking Engine, Notification
**API Changes:**
- `PATCH /api/v1/bookings/:id/reassign` — update instructorId; validate new instructor availability; emit instructor-change notification; new endpoint
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** multi-tenant

---

## TR-016 — Admin onboards an instructor

**Use Case:** UC-016
**Services:** Instructor
**API Changes:**
- `POST /api/v1/instructors` — create Instructor + InstructorTenant (onboardingStatus = pending)
- `PATCH /api/v1/instructors/:id/approve` — set InstructorTenant.onboardingStatus = approved
- `POST /api/v1/instructors/:id/certifications` — attach Certification with documentUrl; new endpoint
- `GET /api/v1/instructors/:id/certifications` — list certifications; new endpoint
- `PATCH /api/v1/instructors/:id/certifications/:certId` — update expiresAt, documentUrl, alertSentAt; new endpoint
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** multi-tenant

---

## TR-017 — Admin creates or edits a lesson type

**Use Case:** UC-017
**Services:** Catalog & Lesson
**API Changes:**
- `POST /api/v1/lesson-types` — create LessonType
- `PATCH /api/v1/lesson-types/:id` — update LessonType
- `DELETE /api/v1/lesson-types/:id` — deactivate (isActive = false)
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** i18n (nameEn/nameFr), multi-tenant

---

## TR-018 — Admin creates or edits a cancellation policy

**Use Case:** UC-018
**Services:** Catalog & Lesson (Cancellation)
**API Changes:**
- `POST /api/v1/cancellation-policies` — create policy; new endpoint
- `PATCH /api/v1/cancellation-policies/:id` — update policy; new endpoint
- `PATCH /api/v1/cancellation-policies/:id/default` — set as default; enforce unique partial index; new endpoint
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** multi-tenant

---

## TR-019 — Admin bulk-cancels bookings for weather

**Use Case:** UC-019
**Services:** Booking Engine, Payment, Notification
**API Changes:**
- `POST /api/v1/bookings/bulk-cancel` — accept filter params (date, instructorId, lessonTypeId); cancel all matching confirmed bookings; return affected count and total refund; new endpoint
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** multi-tenant, performance
**Note (OQ-044):** Cancellation emails are transactional; no CASL commercial classification.

---

## TR-020 — Admin tracks certification expiry

**Use Case:** UC-020
**Services:** Instructor
**API Changes:**
- `GET /api/v1/instructors` — include certificationStatus computed field (valid/expiring_soon/expired)
- `PATCH /api/v1/instructors/:id/certifications/:certId` — update expiresAt, documentUrl, alertSentAt (covered under TR-016)
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** multi-tenant

---

## TR-021 — Admin creates a manual booking

**Use Case:** UC-021
**Services:** Booking Engine, Account & Identity, Payment
**API Changes:**
- `POST /api/v1/users` — admin creates a User account for walk-up customer (OQ-054); new endpoint
- `POST /api/v1/households/:id/learners` — admin creates a Learner profile for walk-up customer
- `POST /api/v1/bookings` — admin path; learnerId required
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** PCI, multi-tenant
**Note (OQ-054):** Admin creates full User + Learner record for walk-up customers. Satisfies Booking CHECK `(learnerId IS NOT NULL)`.

---

## TR-022 — User changes language preference

**Use Case:** UC-022
**Services:** Account & Identity
**API Changes:**
- `PATCH /api/v1/me` — update User.preferredLanguage; existing endpoint
**Schema Changes:** None
**Auth:** Any authenticated role
**Flags:** i18n
**Note (OQ-030):** FR available on all tiers including Starter.
**Note (OQ-057):** Language selector in registration and guest checkout UI defaults to browser geolocation.

---

## Gap Analysis

1. `GET /api/v1/bookings/:id/notes` — required by TR-012; absent from api-design.md
2. `POST /api/v1/slot-reservations` — required by TR-002; absent from api-design.md
3. `PATCH /api/v1/bookings/:id/checkin` — required by TR-010; absent from api-design.md
4. `POST /api/v1/cancellation-policies` and `PATCH /api/v1/cancellation-policies/:id` — required by TR-018; absent from api-design.md
5. `PATCH /api/v1/cancellation-policies/:id/default` — required by TR-018; absent from api-design.md
6. `POST /api/v1/bookings/bulk-cancel` — required by TR-019; absent from api-design.md
7. `POST /api/v1/auth/register` — must accept dateOfBirth, skillLevel, preferredLanguage, parentalConsentGiven; current spec underdocumented
8. Real-time push mechanism for Admin Schedule View (TR-014) — SSE vs WebSocket vs polling decision needed
9. `PATCH /api/v1/bookings/:id/reassign` — required by TR-015; absent from api-design.md
10. `POST /api/v1/instructors/:id/certifications` — required by TR-016; absent from api-design.md
11. `GET /api/v1/instructors/:id/certifications` — required by TR-016; absent from api-design.md
12. `PATCH /api/v1/instructors/:id/certifications/:certId` — required by TR-020; absent from api-design.md
13. `DELETE /api/v1/households/:id/learners/:learnerId` — 409 LEARNER_HAS_ACTIVE_BOOKINGS error code not documented in api-design.md error format section
14. `booking.completed` notification event — required by TR-013; absent from api-design.md Notification Service event list
15. `POST /api/v1/guest-checkouts` — required by TR-003; absent from api-design.md
16. `POST /api/v1/users` — required by TR-021 (admin walk-up path, OQ-054); absent from api-design.md
17. `POST /api/v1/bookings/:id/tip` — required by TR-007 (conditional on OQ-043 resolution); absent from api-design.md
18. Password reset flow — no `POST /api/v1/auth/forgot-password` or `POST /api/v1/auth/reset-password` defined anywhere; accounts will be locked without recovery path

---

## Schema Changes Summary

| Entity.field | Type | Additive/Destructive | TR Reference |
|---|---|---|---|
| `GuestCheckout.learnerDateOfBirth` | date, NOT NULL | Destructive (was nullable) | TR-003 |
| `GuestCheckout.skillLevel` | enum(beginner, intermediate, advanced) | Additive | TR-003 |
| `GuestCheckout.parentalConsentGiven` | boolean, nullable | Additive | TR-003 |
| `GuestCheckout.parentalConsentAt` | timestamp, nullable | Additive | TR-003 |
| `GuestCheckout.preferredLanguage` | enum(en, fr), DEFAULT 'en' | Additive | TR-003, OQ-057 |
| `Learner.parentalConsentGiven` | boolean, nullable (active) | Additive | TR-005 |
| `Learner.parentalConsentAt` | timestamp, nullable (active) | Additive | TR-005 |
| `Payment.groupSessionId` | REMOVED | Destructive | OQ-031 |
| `Payment.status void_pending` | enum value added | Additive | TR-003, OQ-056 |
| `Payment.bookingId` | now nullable (was NOT NULL) | Destructive (constraint change) | TR-007, decisions.md 2026-03-29 |
| `Payment.lessonPackageId` | uuid FK → LessonPackage, nullable | Additive | TR-007, decisions.md 2026-03-29 |
| `PaymentMethod.processorTokenId` | string, encrypted [PCI] | Annotation change | TR-004 |
| `WaitlistEntry.position` | integer, nullable | Additive | P1 |
| `Booking.status in_progress` | REMOVED from enum | Destructive | OQ-055 |
