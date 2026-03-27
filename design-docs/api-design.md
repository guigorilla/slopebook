# Slopebook — API Design

## Principles

- All applications (customer, admin, instructor, operator) consume the same API layer — no app has direct database access
- The API gateway handles authentication, authorization, tenant resolution, versioning, and rate limiting
- Service boundaries are explicit — each domain service owns its data and exposes it only through defined endpoints
- All endpoints are versioned under `/api/v1/`
- All responses are JSON
- Authentication is via Bearer token (JWT) in the Authorization header
- Tenant is resolved from the JWT claims — never passed as a query parameter

## Services & Endpoints

---

### Account & Identity Service

Owns users, households, learner sub-profiles, roles, and tenant scoping.

```
POST   /api/v1/auth/register              Create a new user account
POST   /api/v1/auth/login                 Authenticate and return JWT
POST   /api/v1/auth/logout                Invalidate session
POST   /api/v1/auth/refresh               Refresh JWT

GET    /api/v1/me                         Get current user profile
PATCH  /api/v1/me                         Update current user profile

GET    /api/v1/households/:id             Get household with learner sub-profiles
POST   /api/v1/households                 Create a household
PATCH  /api/v1/households/:id             Update household

GET    /api/v1/households/:id/learners    List learners in a household
POST   /api/v1/households/:id/learners    Add a learner sub-profile
PATCH  /api/v1/households/:id/learners/:learnerId   Update a learner
DELETE /api/v1/households/:id/learners/:learnerId   Remove a learner

GET    /api/v1/payment-methods            List stored cards for current household
POST   /api/v1/payment-methods            Add a card-on-file (via processor token)
DELETE /api/v1/payment-methods/:id        Remove a stored card
PATCH  /api/v1/payment-methods/:id/default  Set as default payment method
```

---

### Instructor Service

Owns coach profiles, certifications, onboarding state, and Workday handoff.

```
GET    /api/v1/instructors                List instructors for tenant (public, paginated)
GET    /api/v1/instructors/:id            Get instructor profile (public)
POST   /api/v1/instructors                Create instructor profile (admin)
PATCH  /api/v1/instructors/:id            Update instructor profile
PATCH  /api/v1/instructors/:id/approve    Approve instructor onboarding (admin)
POST   /api/v1/instructors/:id/workday-handoff  Trigger Workday payroll handoff (admin)

GET    /api/v1/instructors/:id/earnings   Get earnings summary (instructor only)
```

---

### Catalog & Lesson Service

Owns lesson types, pricing, upsells, and instructor requirements.

```
GET    /api/v1/lesson-types               List active lesson types for tenant
GET    /api/v1/lesson-types/:id           Get lesson type detail
POST   /api/v1/lesson-types               Create lesson type (admin)
PATCH  /api/v1/lesson-types/:id           Update lesson type (admin)
DELETE /api/v1/lesson-types/:id           Deactivate lesson type (admin)
```

---

### Scheduling & Availability Service

Owns availability slots and open schedule templates. Provides inputs to the Booking Engine — does not create bookings itself.

```
GET    /api/v1/availability               Query available slots (used by booking widget)
       ?lessonTypeId=&date=&skillLevel=   Filter parameters

GET    /api/v1/instructors/:id/availability         Get instructor's availability
POST   /api/v1/instructors/:id/availability         Create availability slot or recurrence
PATCH  /api/v1/instructors/:id/availability/:slotId Update or override a slot
DELETE /api/v1/instructors/:id/availability/:slotId Remove a slot

GET    /api/v1/schedule                   Admin view of all instructor schedules
       ?date=&instructorId=               Filter parameters
```

---

### Booking Engine

The authoritative service for all reservations. All booking requests — from the customer app, admin dashboard, or POS — go through this service.

```
POST   /api/v1/bookings                   Create a booking (triggers payment)
GET    /api/v1/bookings/:id               Get booking detail
PATCH  /api/v1/bookings/:id/cancel        Cancel a booking (triggers refund if applicable)
PATCH  /api/v1/bookings/:id/complete      Mark booking as completed (instructor)
PATCH  /api/v1/bookings/:id/no-show       Mark student as no-show (instructor)

GET    /api/v1/bookings                   List bookings (scoped by role)
       ?learnerId=&instructorId=&status=&from=&to=

POST   /api/v1/bookings/:id/notes         Add session notes (instructor)

GET    /api/v1/waitlist                   List waitlist entries (admin)
POST   /api/v1/waitlist                   Join a waitlist
DELETE /api/v1/waitlist/:id               Leave a waitlist
POST   /api/v1/waitlist/:id/accept        Accept a waitlist offer (within 2-hour window)
PATCH  /api/v1/waitlist/:id/promote       Manually promote waitlisted student (admin)
POST   /api/v1/bookings/:id/review    Submit tip and rating after lesson completion
```

**Booking request payload:**
```json
{
  "lessonTypeId": "uuid",
  "learnerId": "uuid",
  "instructorId": "uuid",
  "startAt": "2026-12-20T09:00:00Z",
  "paymentMethodId": "uuid",
  "reservationId": "uuid | null",
  "sessionToken": "string | null"
}
```

**Booking response includes:**
- Confirmed booking record
- Payment capture confirmation
- Instructor details
- Calendar .ics attachment URL
- Confirmation email/SMS trigger

---

### Payment Service

Abstracts Stripe and Shift4 behind a common interface. Never called directly by client apps — only invoked by the Booking Engine and admin refund workflows.

```
POST   /api/v1/payments/charge            Create and capture a charge (internal)
POST   /api/v1/payments/:id/refund        Issue a full or partial refund
GET    /api/v1/payments/:id               Get payment detail
GET    /api/v1/payments                   List payments (admin/operator)
       ?from=&to=&status=

POST   /api/v1/webhooks/stripe            Stripe webhook receiver
POST   /api/v1/webhooks/shift4            Shift4 webhook receiver
```

---

### Notification Service

Triggered by events from other services — not called directly by client apps.

```
Internal events consumed:
  booking.confirmed       → send confirmation email + SMS
  booking.cancelled       → send cancellation notice + refund confirmation
  waitlist.slot_available → send waitlist notification (2-hour window opens)
  booking.reminder        → send 24-hour reminder (scheduled job)
  lesson.weather_cancel   → send bulk cancellation notice + rebooking link
```

---

### Reporting Service

Produces operational and financial reports. Accessible to admin and operator roles.

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
| `guest` | Own household, learners, bookings, payment methods |
| `instructor` | Own profile, availability, assigned bookings, earnings |
| `school_admin` | All tenant data — instructors, bookings, schedule, reports |
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

## Non-Functional

- Rate limiting applied at the API gateway per tenant and per IP
- All endpoints require TLS 1.3
- Responses include `X-Request-ID` header for tracing
- Idempotency keys supported on `POST /api/v1/bookings` and `POST /api/v1/payments/charge`
