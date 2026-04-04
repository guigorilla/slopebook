# Slopebook — API Design

## Principles

- All applications (customer, admin, instructor, operator) consume the same API layer — no app has direct database access
- The API gateway handles authentication, authorization, tenant resolution, versioning, and rate limiting
- Service boundaries are explicit — each domain service owns its data and exposes it only through defined endpoints
- All endpoints are versioned under `/api/v1/`
- All responses are JSON
- Authentication is via Bearer token (JWT) in the Authorization header
- Tenant is resolved from the JWT claims — never passed as a query parameter
- Unauthenticated (public) endpoints are explicitly marked `[PUBLIC]`; all others require a valid JWT

## Services & Endpoints

---

### Account & Identity Service

Owns users, households, learner sub-profiles, roles, and tenant scoping.

```
POST   /api/v1/auth/register              Create user account; atomically creates User + Household + self-Learner  [PUBLIC]
       Required: email, password, dateOfBirth, skillLevel, preferredLanguage
       Conditional: parentalConsentGiven required if age < 18 (OQ-032)
POST   /api/v1/auth/login                 Authenticate and return JWT  [PUBLIC]
POST   /api/v1/auth/logout                Invalidate session
POST   /api/v1/auth/refresh               Refresh JWT
POST   /api/v1/auth/forgot-password       Send password-reset email to registered address  [PUBLIC]
POST   /api/v1/auth/reset-password        Consume reset token and set new password  [PUBLIC]

GET    /api/v1/me                         Get current user profile
PATCH  /api/v1/me                         Update current user profile (includes preferredLanguage)

POST   /api/v1/users                      Admin creates User account for walk-up customer (school_admin)
                                          Atomically creates User + Household + Learner sub-profile

GET    /api/v1/households/:id             Get household with learner sub-profiles
POST   /api/v1/households                 Create a household
PATCH  /api/v1/households/:id             Update household

GET    /api/v1/households/:id/learners    List learners in a household
POST   /api/v1/households/:id/learners    Add a learner sub-profile
PATCH  /api/v1/households/:id/learners/:learnerId   Update a learner
DELETE /api/v1/households/:id/learners/:learnerId   Remove a learner
       409 LEARNER_HAS_ACTIVE_BOOKINGS returned when learner has confirmed bookings (OQ-036)

GET    /api/v1/payment-methods            List stored cards for current household
POST   /api/v1/payment-methods            Add a card-on-file (via processor token)  [PCI]
DELETE /api/v1/payment-methods/:id        Remove a stored card
PATCH  /api/v1/payment-methods/:id/default  Set as default payment method
```

**POST /api/v1/auth/register payload:**
```json
{
  "email": "string",
  "password": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "skillLevel": "beginner | intermediate | advanced",
  "preferredLanguage": "en | fr",
  "parentalConsentGiven": "boolean | null"
}
```

---

### Instructor Service

Owns coach profiles, certifications, onboarding state, and Workday handoff.

```
GET    /api/v1/instructors                List instructors for tenant (public, paginated)  [PUBLIC]
       ?skillLevel=&lessonTypeId=         Includes certificationStatus computed field
GET    /api/v1/instructors/:id            Get instructor profile (public)  [PUBLIC]
POST   /api/v1/instructors                Create instructor profile (school_admin)
PATCH  /api/v1/instructors/:id            Update instructor profile
PATCH  /api/v1/instructors/:id/approve    Approve instructor onboarding (school_admin)
POST   /api/v1/instructors/:id/workday-handoff  Trigger Workday payroll handoff (school_admin)

GET    /api/v1/instructors/:id/earnings   Get earnings summary (instructor own record only)

GET    /api/v1/instructors/:id/certifications          List certifications
POST   /api/v1/instructors/:id/certifications          Add certification with documentUrl (school_admin)
PATCH  /api/v1/instructors/:id/certifications/:certId  Update expiresAt, documentUrl, alertSentAt
```

---

### Catalog & Lesson Service

Owns lesson types, pricing, instructor requirements, and cancellation policies.

```
GET    /api/v1/lesson-types               List active lesson types for tenant
GET    /api/v1/lesson-types/:id           Get lesson type detail
POST   /api/v1/lesson-types               Create lesson type (school_admin)
PATCH  /api/v1/lesson-types/:id           Update lesson type (school_admin)
DELETE /api/v1/lesson-types/:id           Deactivate lesson type (school_admin)

GET    /api/v1/cancellation-policies      List cancellation policies for tenant
POST   /api/v1/cancellation-policies      Create cancellation policy (school_admin)
PATCH  /api/v1/cancellation-policies/:id           Update cancellation policy (school_admin)
PATCH  /api/v1/cancellation-policies/:id/default   Set as default; clears previous default (school_admin)
```

---

### Scheduling & Availability Service

Owns availability slots and open schedule templates. Provides inputs to the Booking Engine — does not create bookings itself.

```
GET    /api/v1/availability               Query available slots (booking widget)  [PUBLIC]
       ?lessonTypeId=&date=&age=&skillLevel=

GET    /api/v1/instructors/:id/availability         Get instructor's availability
POST   /api/v1/instructors/:id/availability         Create availability slot or RRULE recurrence
PATCH  /api/v1/instructors/:id/availability/:slotId Update or override a slot
DELETE /api/v1/instructors/:id/availability/:slotId Remove a slot

GET    /api/v1/schedule                   Admin view of all instructor schedules
       ?date=&instructorId=               Filter parameters
```

---

### Booking Engine

The authoritative service for all reservations. All booking requests — from customer app, admin dashboard, or walk-up POS — go through this service.

```
POST   /api/v1/slot-reservations          Create soft-hold SlotReservation; returns sessionToken + expiresAt  [PUBLIC]
POST   /api/v1/guest-checkouts            Create GuestCheckout record  [PUBLIC]
       Required: email, firstName, lastName, learnerDateOfBirth, skillLevel, preferredLanguage
       Conditional: parentalConsentGiven required if age < 18

POST   /api/v1/bookings                   Create a booking (triggers payment)
GET    /api/v1/bookings/:id               Get booking detail
PATCH  /api/v1/bookings/:id/cancel        Cancel a booking (triggers refund if applicable)
PATCH  /api/v1/bookings/:id/complete      Mark booking as completed (instructor)
PATCH  /api/v1/bookings/:id/no-show       Mark student as no-show (instructor)
PATCH  /api/v1/bookings/:id/checkin       Check in student; sets checkedInAt; status stays confirmed (instructor)
PATCH  /api/v1/bookings/:id/reassign      Reassign booking to different instructor (school_admin)

GET    /api/v1/bookings                   List bookings (scoped by role)
       ?learnerId=&instructorId=&status=&from=&to=

POST   /api/v1/bookings/bulk-cancel       Bulk-cancel by filter; returns count + total refund (school_admin)
       Payload: { "date": "YYYY-MM-DD", "instructorId": "uuid | null", "lessonTypeId": "uuid | null" }

POST   /api/v1/bookings/:id/notes         Add session notes (instructor, school_admin)
GET    /api/v1/bookings/:id/notes         List session notes for booking

POST   /api/v1/bookings/:id/review        Submit rating after lesson completion
POST   /api/v1/bookings/:id/tip           [PCI] Submit optional tip; requires Booking.status = completed;
                                          window: 48 hours after Booking.endAt; one tip per booking enforced
                                          by unique partial index; Idempotency-Key header required

GET    /api/v1/waitlist                   List waitlist entries (school_admin)
POST   /api/v1/waitlist                   Join a waitlist  [PUBLIC or authenticated]
DELETE /api/v1/waitlist/:id               Leave a waitlist
POST   /api/v1/waitlist/:id/accept        Accept a waitlist offer (within acceptance window)
PATCH  /api/v1/waitlist/:id/promote       Manually promote waitlisted student (school_admin)
```

**Booking request payload:**
```json
{
  "lessonTypeId": "uuid",
  "learnerId": "uuid | null",
  "instructorId": "uuid",
  "startAt": "2026-12-20T09:00:00Z",
  "paymentMethodId": "uuid | null",
  "guestCheckoutId": "uuid | null",
  "reservationId": "uuid | null",
  "sessionToken": "string | null"
}
```
Server-side: exactly one of `learnerId` / `guestCheckoutId` must be non-null. `paymentMethodId` is null for guest checkout (payment captured via processor SDK).

**Booking response includes:**
- Confirmed booking record
- Payment capture confirmation
- Instructor details
- Calendar .ics attachment URL
- Confirmation email/SMS trigger

**SlotReservation request payload:**
```json
{
  "instructorId": "uuid",
  "lessonTypeId": "uuid",
  "startAt": "2026-12-20T09:00:00Z",
  "endAt": "2026-12-20T10:00:00Z"
}
```

**SlotReservation response:**
```json
{
  "reservationId": "uuid",
  "sessionToken": "string",
  "expiresAt": "2026-12-20T09:15:00Z",
  "status": "active"
}
```

**Review request payload:**
```json
{
  "rating": 5,
  "comment": "string | null"
}
```

**Tip request payload:**
```json
{
  "amountCents": 1000,
  "currency": "USD | CAD",
  "paymentMethodId": "uuid"
}
```
Server-side enforcement: `Booking.status` must be `completed`; request must arrive within 48 hours of `Booking.endAt`; `Idempotency-Key` header required; unique partial index on `Payment(bookingId, paymentType) WHERE paymentType = 'tip'` prevents duplicate tip charges at the database layer.

**Reassign request payload:**
```json
{
  "instructorId": "uuid",
  "reason": "string | null"
}
```
**Reassign response:** Updated Booking record with new `instructorId`. Previous `instructorId` and `reason` captured in AuditLog entry.

---

### Payment Service

Abstracts Stripe and Shift4 behind a common interface. Never called directly by client apps — only invoked by the Booking Engine and admin refund workflows.

```
POST   /api/v1/payments/charge            Create and capture a charge (internal)  [PCI]
POST   /api/v1/payments/:id/refund        Issue a full or partial refund
GET    /api/v1/payments/:id               Get payment detail
GET    /api/v1/payments                   List payments (school_admin/operator)
       ?from=&to=&status=

POST   /api/v1/webhooks/stripe            Stripe webhook receiver  [PUBLIC]
POST   /api/v1/webhooks/shift4            Shift4 webhook receiver  [PUBLIC]
```

**Payment schema notes (decisions.md 2026-03-29 and 2026-04-04):**
- `Payment.bookingId` is nullable. At least one of `bookingId` or `lessonPackageId` must be non-null.
- `Payment.lessonPackageId` (FK, nullable) added for P1 package purchase payments.
- `Payment.paymentType` enum(`booking_charge`, `tip`, `package_purchase`) DEFAULT `booking_charge` discriminates payment kinds.
- Unique partial index on `Payment(bookingId, paymentType) WHERE paymentType = 'tip'` enforces one tip per booking.
- Application layer enforces mutual exclusivity: a payment links to booking OR package, never both.

---

### Notification Service

Triggered by events from other services — not called directly by client apps.

```
Internal events consumed:
  booking.confirmed       → send confirmation email + SMS + .ics attachment
  booking.cancelled       → send cancellation notice + refund confirmation
  booking.completed       → send post-lesson email with one-click link for rating (required) and tip (optional)
  waitlist.slot_available → send waitlist notification (acceptance window opens)
  booking.reminder        → send 24-hour reminder (scheduled job)
  lesson.weather_cancel   → send bulk cancellation notice + rebooking link
  instructor.cert_expiry  → send certification expiry alert to school_admin
```

---

### Reporting Service

Produces operational and financial reports. Accessible to school_admin and operator roles.

```
GET    /api/v1/reports/revenue            Revenue summary by period
       ?from=&to=&groupBy=day|week|month

GET    /api/v1/reports/utilization        Instructor utilization rate
       ?from=&to=&instructorId=

GET    /api/v1/reports/students           Student analytics (repeat rate, avg spend)

GET    /api/v1/reports/export             Export any report to CSV
       ?type=revenue|utilization|students&from=&to=
```

---

## Authentication & Authorization

| Role | Access |
|------|--------|
| `[PUBLIC]` | Unauthenticated; availability queries, slot reservations, guest checkout, processor webhooks, auth/register, auth/login, password reset |
| `guest` | Own household, learners, bookings, payment methods; post-lesson review and tip submission |
| `instructor` | Own profile, availability, assigned bookings, earnings, session notes (read/write); check-in; complete; no-show; cancel own lessons |
| `school_admin` | All tenant data — instructors, bookings, schedule, reports, cancellation policies, certification management |
| `operator` | All tenant data across multiple schools, white-label config, processor config |
| `platform_admin` | All tenants — internal use only |

JWT claims include: `userId`, `tenantId`, `role`

Tenant is always resolved from the JWT — it is never accepted as a client-supplied parameter.

## Error Format

```json
{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "The requested instructor is not available at this time.",
    "details": {}
  }
}
```

**Defined error codes:**
- `BOOKING_CONFLICT` — instructor not available at requested time
- `HOLD_EXPIRED` — SlotReservation TTL (15 min) exceeded before booking confirmed
- `PAYMENT_FAILED` — processor declined charge
- `PAYMENT_VOID_FAILED` — all void retries exhausted; Payment.status = void_pending (OQ-056)
- `AGE_TOO_YOUNG` — learner age < 5 at time of booking
- `LEARNER_HAS_ACTIVE_BOOKINGS` — DELETE on learner blocked; confirmed bookings exist (OQ-036)
- `WAITLIST_WINDOW_EXPIRED` — acceptance window closed
- `RATING_ALREADY_SUBMITTED` — InstructorRating already exists for this booking
- `TIP_ALREADY_SUBMITTED` — tip Payment already exists for this booking
- `TIP_WINDOW_EXPIRED` — 48-hour tip acceptance window has closed
- `BOOKING_NOT_COMPLETED` — tip or review submitted against a booking not in completed status

## Non-Functional

- Rate limiting applied at the API gateway per tenant and per IP
- All endpoints require TLS 1.3
- Responses include `X-Request-ID` header for tracing
- Idempotency keys supported on `POST /api/v1/bookings`, `POST /api/v1/payments/charge`, and `POST /api/v1/bookings/:id/tip`

---

## API Change Summary — Run 9 (2026-04-04)

**Added:** 18 endpoints
- `POST /api/v1/slot-reservations`
- `POST /api/v1/guest-checkouts`
- `PATCH /api/v1/bookings/:id/checkin`
- `PATCH /api/v1/bookings/:id/reassign` (with documented request + response payloads — OQ-066)
- `POST /api/v1/bookings/bulk-cancel`
- `GET /api/v1/bookings/:id/notes`
- `POST /api/v1/bookings/:id/tip` (with status guard, 48h window, idempotency key — CR-002/CR-003 Run 9)
- `GET /api/v1/cancellation-policies`
- `POST /api/v1/cancellation-policies`
- `PATCH /api/v1/cancellation-policies/:id`
- `PATCH /api/v1/cancellation-policies/:id/default`
- `POST /api/v1/users`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/instructors/:id/certifications`
- `POST /api/v1/instructors/:id/certifications`
- `PATCH /api/v1/instructors/:id/certifications/:certId`
- `GET /api/v1/instructors/:id/earnings` (previously undocumented detail added)

**Fixed:** 6
- `POST /api/v1/bookings/:id/review` — removed tip reference (tip is a separate endpoint)
- `POST /api/v1/auth/register` — documented required fields and payload
- `GET /api/v1/availability` — added `age` and `skillLevel` filter params
- Booking payload `learnerId` — changed to `"uuid | null"` to support guest checkout path (CR-001 Run 9)
- Booking payload `paymentMethodId` — changed to `"uuid | null"` for guest checkout processor SDK path
- `PATCH /api/v1/bookings/:id/reassign` — documented request and response payloads (OQ-066)

**Deprecated:** 0

**Unchanged:** 29 endpoints
