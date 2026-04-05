# Slopebook — Technical Requirements (P0)

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-04-04
**Pipeline:** pipeline-generate.yaml
**Sources:** use-cases-p0-proposed.md (Run 10), data-model.md (v0.7), api-design.md

---

## TR-001 — Browse availability with age and skill level filtering

**Use Case:** UC-001
**Services:** Scheduling & Availability Service
**API Changes:** GET /api/v1/availability — add `?age=` and `?skillLevel=` query params; filter by LessonType.skillLevels and compute learner age from age param to enforce OQ-007 (min age 5)
**Schema Changes:** None (LessonType.skillLevels and age computation at query time)
**Auth:** [PUBLIC] — no JWT required
**Flags:** i18n (lesson type names returned in EN + FR), performance
**Open Technical Questions:** age param should be integer (years) or date — recommend integer for privacy

---

## TR-002 — Soft-hold mechanism (SlotReservation)

**Use Case:** UC-001
**Services:** Booking Engine, Scheduling & Availability Service
**API Changes:** POST /api/v1/slot-reservations — create SlotReservation; return reservationId, sessionToken, expiresAt (TTL = 15 min)
**Schema Changes:** SlotReservation entity exists in v0.7 schema; no changes needed
**Auth:** [PUBLIC] — slot reservation precedes authentication
**Flags:** performance (concurrent reservation race; unique partial index on active slots)

---

## TR-003 — Guest checkout flow

**Use Case:** UC-003
**Services:** Booking Engine, Account & Identity Service, Payment Service
**API Changes:** POST /api/v1/guest-checkouts — create GuestCheckout record; POST /api/v1/bookings — learnerId nullable, guestCheckoutId set, paymentMethodId null
**Schema Changes:** GuestCheckout entity in v0.7; Booking.learnerId nullable; Booking CHECK (learnerId IS NOT NULL OR guestCheckoutId IS NOT NULL)
**Auth:** [PUBLIC] — guest checkout precedes account creation
**Flags:** PCI (card capture via processor SDK embed), i18n (preferredLanguage on GuestCheckout), multi-tenant

---

## TR-004 — Booking creation with payment capture

**Use Case:** UC-003, UC-004, UC-005
**Services:** Booking Engine, Payment Service
**API Changes:** POST /api/v1/bookings — full payload per api-design-proposed; SlotReservation.sessionToken validated; Payment created atomically
**Schema Changes:** Booking.softReservationId FK → SlotReservation; Payment.paymentType = booking_charge DEFAULT; Payment.platformFeeCents computed as 1.5% amountCents
**Auth:** guest (authenticated) or [PUBLIC] (guest checkout)
**Flags:** PCI, multi-tenant
**Open Technical Questions:** 3 DB-write retries on payment capture success (OQ-047); void payment on final failure (OQ-056)

---

## TR-005 — Payment processor abstraction (Stripe + Shift4)

**Use Case:** UC-003, UC-004
**Services:** Payment Service
**API Changes:** POST /api/v1/webhooks/stripe [PUBLIC]; POST /api/v1/webhooks/shift4 [PUBLIC] — webhook receivers for payment events
**Schema Changes:** Tenant.paymentProcessor enum(stripe, shift4); Tenant.paymentCredentials encrypted json (OQ-024)
**Auth:** [PUBLIC] for webhooks; internal-only for charge endpoint
**Flags:** PCI — processorTokenId encrypted at rest via AWS KMS (OQ-046); Shift4 requires Growth+ tier (OQ-005)

---

## TR-006 — Card-on-file storage and one-click checkout

**Use Case:** UC-004, UC-005
**Services:** Account & Identity Service, Payment Service
**API Changes:** POST /api/v1/payment-methods [PCI]; GET /api/v1/payment-methods; DELETE /api/v1/payment-methods/:id; PATCH /api/v1/payment-methods/:id/default
**Schema Changes:** PaymentMethod.processorTokenId encrypted via KMS; PaymentMethod.isValid boolean (false on processor switch)
**Auth:** guest role
**Flags:** PCI

---

## TR-007 — Post-lesson review submission

**Use Case:** UC-007
**Services:** Booking Engine
**API Changes:** POST /api/v1/bookings/:id/review — requires Booking.status = completed; returns BOOKING_NOT_COMPLETED if not; RATING_ALREADY_SUBMITTED if InstructorRating exists
**Schema Changes:** InstructorRating entity in v0.7 (bookingId unique constraint; rating 1–5 CHECK); side effect: Instructor.averageRating recomputed on insert
**Auth:** guest role (own bookings only)
**Flags:** None

---

## TR-008 — Post-lesson tip submission

**Use Case:** UC-007
**Services:** Booking Engine, Payment Service
**API Changes:** POST /api/v1/bookings/:id/tip [PCI] — requires Booking.status = completed (BOOKING_NOT_COMPLETED if not); window = 48h after Booking.endAt (TIP_WINDOW_EXPIRED if outside); Idempotency-Key header required; TIP_ALREADY_SUBMITTED if tip exists
**Schema Changes:** Payment.paymentType = tip; unique partial index on Payment(bookingId, paymentType) WHERE paymentType = 'tip' — enforces one tip per booking at DB layer
**Auth:** guest role (own bookings only)
**Flags:** PCI
**Open Technical Questions:** tip via stored card only (paymentMethodId required); no guest-only tip path without stored card — guest checkout users must create account or use link-based tokenized payment

---

## TR-009 — Waitlist join and accept

**Use Case:** UC-008
**Services:** Booking Engine
**API Changes:** POST /api/v1/waitlist [PUBLIC or authenticated]; POST /api/v1/waitlist/:id/accept; DELETE /api/v1/waitlist/:id; PATCH /api/v1/waitlist/:id/promote (school_admin)
**Schema Changes:** WaitlistEntry entity in v0.7; CHECK (learnerId IS NOT NULL OR guestEmail IS NOT NULL); position field for FIFO (OQ-034)
**Auth:** [PUBLIC or authenticated] for join; guest for accept/delete; school_admin for promote
**Flags:** i18n (waitlist notification in preferredLanguage), multi-tenant

---

## TR-010 — Session notes read endpoint

**Use Case:** UC-009, UC-012
**Services:** Booking Engine
**API Changes:** GET /api/v1/bookings/:id/notes — list BookingNotes for booking; scoped by role (instructor sees all notes on own bookings; guest sees only isSharedWithGuest = true)
**Schema Changes:** BookingNote entity in v0.7; no changes
**Auth:** instructor (own bookings); guest (isSharedWithGuest = true only); school_admin (all)
**Flags:** None

---

## TR-011 — Student check-in endpoint

**Use Case:** UC-010
**Services:** Booking Engine
**API Changes:** PATCH /api/v1/bookings/:id/checkin — sets Booking.checkedInAt = now; Booking.status remains confirmed; idempotent
**Schema Changes:** Booking.checkedInAt timestamp nullable (in v0.7)
**Auth:** instructor (own assigned bookings only)
**Flags:** None

---

## TR-012 — Cancellation and refund

**Use Case:** UC-006
**Services:** Booking Engine, Payment Service
**API Changes:** PATCH /api/v1/bookings/:id/cancel — evaluates CancellationPolicy.refundRules; calls Payment Service internally; updates Booking.status = cancelled
**Schema Changes:** Booking.cancelledAt and cancellationReason in v0.7; CancellationPolicy entity in v0.7
**Auth:** guest (own bookings); instructor (own lessons per OQ-058); school_admin (all tenant bookings)
**Flags:** PCI (refund via payment processor), i18n (cancellation notice in preferredLanguage)

---

## TR-013 — Manual lesson completion

**Use Case:** UC-013
**Services:** Booking Engine, Notification Service
**API Changes:** PATCH /api/v1/bookings/:id/complete — sets Booking.status = completed; Booking.autoCompletedAt = null; fires booking.completed event
**Schema Changes:** Booking.autoCompletedAt timestamp nullable (v0.7); Booking.status enum excludes in_progress (OQ-055)
**Auth:** instructor (own assigned bookings); school_admin
**Flags:** i18n (post-lesson email in student's preferredLanguage)

---

## TR-013a — Auto-completion scheduled job

**Use Case:** UC-013
**Services:** Booking Engine (background job)
**API Changes:** None — internal job; no HTTP endpoint
**Schema Changes:** Booking.autoCompletedAt set by job; AuditLog entry with actorType = system
**Auth:** system (no JWT; internal process)
**Flags:** performance (job must handle peak-day volume efficiently)
**Open Technical Questions:** OQ-065 — scheduler interval TBD (5 min recommended; 15 min acceptable; event-driven most precise but requires job queue)

---

## TR-014 — Admin schedule view and real-time updates

**Use Case:** UC-014
**Services:** Scheduling & Availability Service, Booking Engine
**API Changes:** GET /api/v1/schedule?date=&instructorId= — admin schedule view; push mechanism for real-time updates TBD (OQ-063)
**Schema Changes:** None
**Auth:** school_admin
**Flags:** performance (opening-day booking spike; must handle concurrent schedule refreshes)
**Open Technical Questions:** OQ-063 — SSE vs WebSocket vs polling; must be resolved before implementing schedule view real-time updates

---

## TR-015 — Instructor reassignment

**Use Case:** UC-014
**Services:** Booking Engine
**API Changes:** PATCH /api/v1/bookings/:id/reassign — payload: { instructorId, reason }; response: updated Booking; validates no conflict on new instructor; AuditLog entry records previous instructorId and reason
**Schema Changes:** None (AuditLog captures metadata json with previousInstructorId and reason)
**Auth:** school_admin
**Flags:** None

---

## TR-016 — Bulk cancel

**Use Case:** UC-014, UC-019
**Services:** Booking Engine, Payment Service, Notification Service
**API Changes:** POST /api/v1/bookings/bulk-cancel — payload: { date, instructorId: null|uuid, lessonTypeId: null|uuid }; returns cancelled count + total refund; fires lesson.weather_cancel per cancelled booking
**Schema Changes:** None
**Auth:** school_admin
**Flags:** performance (potentially hundreds of cancellations + refunds in one call), i18n

---

## TR-017 — Admin walk-up customer account creation

**Use Case:** UC-021
**Services:** Account & Identity Service
**API Changes:** POST /api/v1/users (school_admin) — atomically creates User + Household + Learner; returns { userId, householdId, learnerId } for immediate use in booking flow
**Schema Changes:** None (User + Household + Learner entities in v0.7)
**Auth:** school_admin
**Flags:** i18n (preferredLanguage collected at creation), multi-tenant

---

## TR-018 — Certification management

**Use Case:** UC-015
**Services:** Instructor Service
**API Changes:** GET /api/v1/instructors/:id/certifications; POST /api/v1/instructors/:id/certifications; PATCH /api/v1/instructors/:id/certifications/:certId
**Schema Changes:** Certification entity in v0.7 (body, level, expiresAt, alertSentAt, documentUrl)
**Auth:** school_admin (write); instructor (read own); [PUBLIC] for certificationStatus computed field on instructor listing
**Flags:** None

---

## TR-019 — Cancellation policy management

**Use Case:** UC-017
**Services:** Catalog & Lesson Service
**API Changes:** GET /api/v1/cancellation-policies; POST /api/v1/cancellation-policies; PATCH /api/v1/cancellation-policies/:id; PATCH /api/v1/cancellation-policies/:id/default
**Schema Changes:** CancellationPolicy entity in v0.7; UNIQUE partial index (tenantId, isDefault) WHERE isDefault = true
**Auth:** school_admin
**Flags:** multi-tenant (all policies scoped to tenantId)

---

## TR-020 — Notification events and .ics attachment

**Use Case:** UC-020
**Services:** Notification Service
**API Changes:** No HTTP endpoint; internal event system consumed by Notification Service
**Schema Changes:** None (all notification trigger data available from Booking, GuestCheckout, WaitlistEntry)
**Auth:** system internal
**Flags:** i18n (all notifications in preferredLanguage); booking.confirmed must include .ics calendar attachment; booking.completed triggers post-lesson rating + tip link
**Open Technical Questions:** None; SendGrid is confirmed notification provider (OQ-016)

---

## TR-021 — Password reset endpoints

**Use Case:** OQ-062 (P0 vs P1 unresolved)
**Services:** Account & Identity Service
**API Changes:** POST /api/v1/auth/forgot-password [PUBLIC]; POST /api/v1/auth/reset-password [PUBLIC]
**Schema Changes:** PasswordResetToken entity in v0.7 (tokenHash, expiresAt, usedAt; single-use)
**Auth:** [PUBLIC]
**Flags:** None
**Open Technical Questions:** OQ-062 — is password reset P0 or P1? Schema entity ships now; endpoints remain behind feature flag if deferred to P1

---

## TR-022 — Language preference update

**Use Case:** UC-022
**Services:** Account & Identity Service
**API Changes:** PATCH /api/v1/me — include preferredLanguage field explicitly in documentation
**Schema Changes:** User.preferredLanguage enum(en, fr) in v0.7; GuestCheckout.preferredLanguage in v0.7
**Auth:** guest, instructor, school_admin
**Flags:** i18n

---

## TR-023 — Instructor availability with RRULE recurrence

**Use Case:** UC-023
**Services:** Scheduling & Availability Service
**API Changes:** POST /api/v1/instructors/:id/availability; PATCH /api/v1/instructors/:id/availability/:slotId; DELETE /api/v1/instructors/:id/availability/:slotId
**Schema Changes:** Availability.recurrence changed from json → text for RRULE string (v0.7 migration: unwrap JSON string values to plain TEXT)
**Auth:** instructor (own availability); school_admin (all instructors)
**Flags:** None

---

## Gap Analysis

1. GET /api/v1/instructors/:id/earnings — missing from api-design.md; listed in Instructor Service but has no documented response payload
2. Cancellation policies endpoints — missing from api-design.md (GET/POST/PATCH /api/v1/cancellation-policies and /default)
3. Certification endpoints — missing from api-design.md (GET/POST/PATCH /api/v1/instructors/:id/certifications)
4. POST /api/v1/users — missing from api-design.md (walk-up booking, TR-017)
5. Password reset endpoints — missing from api-design.md (TR-021; OQ-062 gating P0 scope)
6. GET /api/v1/bookings/:id/notes — missing from api-design.md (TR-010)
7. PATCH /api/v1/bookings/:id/checkin — missing from api-design.md (TR-011)
8. PATCH /api/v1/bookings/:id/reassign — missing from api-design.md (TR-015); payload documented in api-design-proposed.md
9. POST /api/v1/bookings/bulk-cancel — missing from api-design.md (TR-016)
10. POST /api/v1/guest-checkouts — missing from api-design.md (TR-003)
11. POST /api/v1/slot-reservations — missing from api-design.md (TR-002)
12. POST /api/v1/bookings/:id/review — existing endpoint titled "tip and rating" in api-design.md; must be review-only; tip is a separate endpoint
13. POST /api/v1/bookings/:id/tip — missing from api-design.md (TR-008); requires status guard, 48h window, idempotency key
14. GET /api/v1/availability — missing age and skillLevel query params (TR-001)
15. booking.completed notification event — missing from api-design.md Notification Service
16. instructor.cert_expiry notification event — missing from api-design.md
17. .ics attachment not documented in booking.confirmed event description
18. OQ-062: Password reset P0 vs P1 — blocks TR-021 scope decision
19. OQ-063: Real-time push mechanism — blocks TR-014 implementation
20. OQ-065: Auto-completion scheduler interval — blocks TR-013a implementation

---

## Schema Changes Summary

| Entity.field | Type | Additive/Destructive | TR |
|---|---|---|---|
| Instructor.averageRating | decimal(3,2) nullable | Additive | TR-007 side effect |
| Availability.recurrence | text (was json) | Destructive (migration) | TR-023 |
| Booking.checkedInAt | timestamp nullable | Additive | TR-011 |
| Booking.autoCompletedAt | timestamp nullable | Additive | TR-013a |
| Booking.status in_progress | REMOVED from enum | Destructive | TR-011 (OQ-055) |
| Booking.learnerId | nullable (was NOT NULL) | Destructive (constraint drop) | TR-003 |
| Booking.softReservationId | uuid FK nullable | Additive | TR-002 |
| Payment.bookingId | nullable (was NOT NULL) | Destructive (constraint drop) | TR-004 (OQ-059) |
| Payment.lessonPackageId | uuid FK nullable | Additive | TR-004 (OQ-059) |
| Payment.paymentType | enum DEFAULT booking_charge | Additive | TR-008 |
| Payment unique partial index (bookingId, paymentType) WHERE tip | index | Additive | TR-008 |
| Payment.platformFeeCents | integer | Additive | TR-004 |
| PasswordResetToken | new entity | Additive | TR-021 |
| LessonPackage | new entity (P1) | Additive | UC-024 |
| PackageRedemption | new entity (P1) | Additive | UC-025 |
