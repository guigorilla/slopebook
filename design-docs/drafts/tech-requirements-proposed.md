# Slopebook — Technical Requirements (P0)

**Document Status:** Draft — Generate Pipeline Run 6
**Last Updated:** 2026-03-28
**Author:** Tech-Lead Agent
**Source:** use-cases-p0-proposed.md (Run 6), data-model-proposed.md (v0.4), api-design.md
**Scope:** P0 (Alpha) use cases only

---

## TR-001 — Browse available lesson slots

**Use Case:** UC-001
**Services:** Scheduling & Availability, Catalog & Lesson, Instructor
**API Changes:**
- `GET /api/v1/availability?lessonTypeId=&date=&skillLevel=` — return slots with available instructor list; existing endpoint, add skillLevel filter
- `GET /api/v1/instructors/:id` — return bioEn/bioFr based on Accept-Language header
- `GET /api/v1/availability?lessonTypeId=&date=&age=&skillLevel=` — add required `age` (integer) and `skillLevel` (enum) params; filters slots to eligible instructors only
**Schema Changes:** None
**Auth:** Public (no JWT required for availability query)
**Flags:** i18n, multi-tenant
**Open Technical Questions:** None

---

## TR-002 — Reserve a slot (soft hold)

**Use Case:** UC-002
**Services:** Booking Engine, Scheduling & Availability
**API Changes:**
- `POST /api/v1/slot-reservations` — create SlotReservation; return sessionToken and expiresAt; new endpoint
**Schema Changes:** None (SlotReservation schema complete in v0.4)
**Auth:** Public (guest path); guest or JWT for authenticated path
**Flags:** multi-tenant, performance
**Open Technical Questions:** None

---

## TR-003 — Guest checkout booking

**Use Case:** UC-003
**Services:** Booking Engine, Payment, Account & Identity, Notification
**API Changes:**
- `POST /api/v1/bookings` — `age` and `skillLevel` carried in payload from browse stage; collected at TR-001, not re-prompted at checkout
- `POST /api/v1/guest-checkouts` — create GuestCheckout; required fields: email, firstName, lastName, learnerDateOfBirth, skillLevel; conditional: parentalConsentGiven (required if age < 18)
- `POST /api/v1/bookings` — create Booking from GuestCheckout; links guestCheckoutId
- `POST /api/v1/payments/charge` — called once; payment captured before booking DB write
- `POST /api/v1/payments/:id/refund` — called if all 3 DB write retries fail (void full amount)
**Schema Changes:**
- `GuestCheckout.learnerDateOfBirth date NOT NULL` — required per OQ-032
- `GuestCheckout.skillLevel enum(beginner, intermediate, advanced)` — required per OQ-032
- `GuestCheckout.parentalConsentGiven boolean nullable` — required when age < 18 (OQ-032)
- `GuestCheckout.parentalConsentAt timestamp nullable` — consent timestamp (OQ-032)
**Auth:** Public (no JWT); sessionToken from SlotReservation validates hold
**Flags:** PCI, i18n, multi-tenant
**Retry semantics (OQ-053):** Payment captured once; retries are DB-write-only using the existing Payment record. Idempotency key on `POST /api/v1/bookings` scoped to reservationId. On 3rd DB write failure, `POST /api/v1/payments/:id/refund` voids the captured payment.
**Smartwaiver (OQ-052):** Deferred. No API call at booking confirmation. GuestCheckout.waiverToken remains null for P0.

---

## TR-004 — Authenticated user booking

**Use Case:** UC-004
**Services:** Booking Engine, Payment, Account & Identity, Notification
**API Changes:**
- `POST /api/v1/bookings` — learnerId required for authenticated path; validates Learner belongs to caller's Household
- `POST /api/v1/payments/charge` — card-on-file path uses stored PaymentMethod.processorTokenId [PCI: encrypted]
- `POST /api/v1/payments/:id/refund` — called if all 3 DB write retries fail
**Schema Changes:** None beyond TR-003 GuestCheckout additions
**Auth:** `guest` role minimum; Learner must be in caller's Household
**Flags:** PCI, i18n, multi-tenant
**Retry semantics (OQ-053):** Same as TR-003 — DB-write-only retries; payment not re-charged.
**Smartwaiver (OQ-052):** Deferred. Learner.waiverToken remains null for P0.

---

## TR-005 — Create account with self-Learner

**Use Case:** UC-005
**Services:** Account & Identity
**API Changes:**
- `POST /api/v1/auth/register` — accept additional required fields: dateOfBirth, skillLevel, preferredLanguage; atomically create User + Household + self-Learner sub-profile (OQ-048); conditional: parentalConsentGiven (required if age < 18, OQ-032)
**Schema Changes:** None (Learner.parentalConsentGiven/At already in v0.4)
**Auth:** Public (no JWT)
**Flags:** i18n, multi-tenant
**Open Technical Questions:** None

---

## TR-006 — Cancel a booking

**Use Case:** UC-006
**Services:** Booking Engine, Payment
**API Changes:**
- `PATCH /api/v1/bookings/:id/cancel` — set status = cancelled; calculate refund from snapshot cancellationPolicyId; trigger `POST /api/v1/payments/:id/refund` if applicable
**Schema Changes:** None
**Auth:** `guest` (own bookings only), `school_admin` (any booking in tenant)
**Flags:** multi-tenant
**Open Technical Questions:** None
**Note (OQ-033):** Guest-checkout users have no JWT; no self-service cancel endpoint available for guest path. School must cancel on their behalf.

---

## TR-007 — Rate an instructor after a lesson

**Use Case:** UC-007
**Services:** Booking Engine
**API Changes:**
- `POST /api/v1/bookings/:id/review` — create InstructorRating; validate Booking.status = completed; one rating per booking (unique constraint)
**Schema Changes:** None (InstructorRating entity in v0.4)
**Auth:** `guest` role; caller's learnerId must match Booking.learnerId
**Flags:** multi-tenant

---

## TR-008 — Instructor manages availability

**Use Case:** UC-008
**Services:** Scheduling & Availability
**API Changes:**
- `POST /api/v1/instructors/:id/availability` — create availability slot or RRULE recurrence
- `PATCH /api/v1/instructors/:id/availability/:slotId` — update or override; detect conflict with confirmed bookings
- `DELETE /api/v1/instructors/:id/availability/:slotId` — remove slot
**Schema Changes:** None (Availability.recurrence text field in v0.4)
**Auth:** `instructor` (own availability only), `school_admin` (any instructor in tenant)
**Flags:** multi-tenant

---

## TR-009 — Instructor views today's schedule

**Use Case:** UC-009
**Services:** Booking Engine
**API Changes:**
- `GET /api/v1/bookings?instructorId=&from=&to=&status=confirmed,in_progress` — existing endpoint; add date-range filter support
**Schema Changes:** None
**Auth:** `instructor` (own bookings only)
**Flags:** i18n, multi-tenant

---

## TR-010 — Instructor checks in a student

**Use Case:** UC-010
**Services:** Booking Engine
**API Changes:**
- `PATCH /api/v1/bookings/:id/checkin` — set Booking.checkedInAt = now; new endpoint
**Schema Changes:** None
**Auth:** `instructor` (own bookings only)
**Flags:** multi-tenant
**Smartwaiver (OQ-052):** Deferred. Check-in is confirmation only. No waiverToken lookup or Smartwaiver embed in P0. waiverStatus field not populated by this endpoint in P0.

---

## TR-011 — Instructor marks student as no-show

**Use Case:** UC-011
**Services:** Booking Engine, Payment
**API Changes:**
- `PATCH /api/v1/bookings/:id/no-show` — set status = no_show; apply noShowPolicy from snapshot CancellationPolicy; trigger refund if noShowPolicy = partial_refund or full_refund
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

**Use Case:** UC-013
**Services:** Booking Engine, Notification
**API Changes:**
- `PATCH /api/v1/bookings/:id/complete` — set status = completed; emit booking.completed event
**Schema Changes:** None
**Auth:** `instructor` (own bookings)
**Flags:** multi-tenant

---

## TR-014 — Admin views the schedule

**Use Case:** UC-014
**Services:** Booking Engine, Scheduling & Availability
**API Changes:**
- `GET /api/v1/schedule?date=&instructorId=` — admin view of all instructor schedules; existing endpoint
- Real-time updates via server-sent events or polling (push mechanism TBD)
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** multi-tenant, performance

---

## TR-015 — Admin reassigns a booking

**Use Case:** UC-015
**Services:** Booking Engine, Notification
**API Changes:**
- `PATCH /api/v1/bookings/:id` — update instructorId; validate new instructor availability; emit instructor-change notification
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
- Document upload: `POST /api/v1/instructors/:id/certifications` — attach Certification with documentUrl
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
- `PATCH /api/v1/cancellation-policies/:id` — update policy
- `PATCH /api/v1/cancellation-policies/:id/default` — set as default; enforce unique partial index
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
- `GET /api/v1/instructors` — include certificationStatus computed field (valid/expiring_soon/expired) based on Certification.expiresAt
- `PATCH /api/v1/instructors/:id/certifications/:certId` — update expiresAt, documentUrl, alertSentAt
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** multi-tenant

---

## TR-021 — Admin creates a manual booking

**Use Case:** UC-021
**Services:** Booking Engine, Payment
**API Changes:**
- `POST /api/v1/bookings` — admin path accepts learnerId or ad-hoc customer info; same endpoint as customer path
**Schema Changes:** None
**Auth:** `school_admin`
**Flags:** PCI, multi-tenant

---

## TR-022 — User changes language preference

**Use Case:** UC-022
**Services:** Account & Identity
**API Changes:**
- `PATCH /api/v1/me` — update User.preferredLanguage; existing endpoint
**Schema Changes:** None
**Auth:** Any authenticated role
**Flags:** i18n
**Note (OQ-030):** FR available on all tiers including Starter. No tier-based suppression logic required.

---

## Gap Analysis

1. `GET /api/v1/bookings/:id/notes` — required by TR-012 but absent from api-design.md
2. `POST /api/v1/slot-reservations` — required by TR-002; absent from api-design.md
3. `PATCH /api/v1/bookings/:id/checkin` — required by TR-010; absent from api-design.md
4. `POST /api/v1/cancellation-policies` and `PATCH /api/v1/cancellation-policies/:id` — required by TR-018; absent from api-design.md
5. `PATCH /api/v1/cancellation-policies/:id/default` — required by TR-018; absent from api-design.md
6. `POST /api/v1/bookings/bulk-cancel` — required by TR-019; absent from api-design.md
7. `POST /api/v1/auth/register` — must accept dateOfBirth, skillLevel, parentalConsentGiven; current spec has none of these fields documented
8. Real-time push mechanism for Admin Schedule View (TR-014) — not specified; SSE vs WebSocket vs polling decision needed
9. `PATCH /api/v1/bookings/:id` (instructor reassignment, TR-015) — not documented in api-design.md; only per-field PATCH endpoints are implied
10. Certification upload endpoint `POST /api/v1/instructors/:id/certifications` — absent from api-design.md; file storage strategy not defined
11. `DELETE /api/v1/households/:id/learners/:learnerId` — must return 409 LEARNER_HAS_ACTIVE_BOOKINGS; error code not documented in api-design.md

---

## Schema Changes Summary

| Entity.field | Type | Additive/Destructive | TR Reference |
|---|---|---|---|
| `GuestCheckout.learnerDateOfBirth` | date, NOT NULL | Destructive (was nullable) | TR-003 |
| `GuestCheckout.skillLevel` | enum(beginner, intermediate, advanced) | Additive | TR-003 |
| `GuestCheckout.parentalConsentGiven` | boolean, nullable | Additive | TR-003 |
| `GuestCheckout.parentalConsentAt` | timestamp, nullable | Additive | TR-003 |
| `Learner.parentalConsentGiven` | boolean, nullable (active) | Additive | TR-005 |
| `Learner.parentalConsentAt` | timestamp, nullable (active) | Additive | TR-005 |
| `Payment.groupSessionId` | REMOVED | Destructive | OQ-031 |
| `PaymentMethod.processorTokenId` | string, encrypted [PCI] | Destructive (annotation change) | TR-004 |
| `WaitlistEntry.position` | integer, nullable | Additive | P1 TR-027 |
| `GuestCheckout.waiverToken` | string, nullable (deferred, null in P0) | Additive | OQ-052 |
