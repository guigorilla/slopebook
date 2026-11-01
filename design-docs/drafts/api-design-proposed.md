# Slopebook — API Design

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-11-01

## Principles

- All applications (customer, admin, instructor, operator, Manager Console) consume the same API layer — no app has direct database access
- The API gateway handles authentication, authorization, tenant resolution, versioning, and rate limiting
- Service boundaries are explicit — each domain service owns its data and exposes it only through defined endpoints
- All endpoints are versioned under `/api/v1/`
- All responses are JSON
- Authentication is via Bearer token (JWT) in the Authorization header
- Tenant is resolved from the JWT claims — never passed as a query parameter or request body field
- Unauthenticated (public) endpoints are explicitly marked `[PUBLIC]`; all others require a valid JWT
- Endpoints touching payment credentials or card data are marked `[PCI]`
- Monetary amounts are integer cents with an explicit `currency`; never floats
- Services are grouped into Booking Core (Phase 3) and the Overlay (Phases 1-2). Overlay services are marked with their phase and `Proposal` in the service heading: they are proposed interfaces that are not yet decided or built, and may change before they are accepted
- Overlay tenants (`Tenant.operatingMode = overlay`) run on top of a school's existing POS. Booking and payment endpoints are not available to overlay tenants; the error returned for such a call is undecided (Q10.57)
- Deterministic rules decide: validation, constraints, policy, ranking of issues and matches are pure, versioned functions of their inputs. No model call is in a decision path
- The agent only explains and recommends. It uses read-only tools, holds no POS write credentials, and a requested change creates a draft plan, never a write
- Nothing executes without a manager decision. Only the Orchestration Service writes to the POS adapter, and only for actions covered by an approved ManagerDecision whose `planHash` matches the current plan
- A waitlist offer never confirms a booking and never takes payment
- Privacy gate: endpoints marked `[GATE]` write personal data (conversations, inferred profiles, instructor observations, free-text reasons). They return `409 PRIVACY_GATE_CLOSED` unless `Tenant.realDataEnabled` is true and the retention and erasure policy for the data class is approved. Non-production environments accept synthetic data only
- Overlay estimate labels: any score, confidence or recommendation returned by the overlay carries `"estimate": true` until measured against outcomes

## Services & Endpoints

---

### Account & Identity Service

Owns users, households, learner sub-profiles, roles, tenant membership, and tenant scoping.

```
POST   /api/v1/auth/register              Create user account; atomically creates User + Household + self-Learner  [PUBLIC]
       Required: email, password, dateOfBirth, skillLevel, preferredLanguage
       Optional: skillLevelSource (default customer)
       Conditional: parentalConsentGiven required if age < 18
POST   /api/v1/auth/login                 Authenticate and return JWT  [PUBLIC]
POST   /api/v1/auth/logout                Invalidate session
POST   /api/v1/auth/refresh               Refresh JWT
POST   /api/v1/auth/forgot-password       Send password-reset email to registered address  [PUBLIC]
POST   /api/v1/auth/reset-password        Consume reset token and set new password  [PUBLIC]

GET    /api/v1/me                         Get current user profile
PATCH  /api/v1/me                         Update current user profile (includes preferredLanguage)

POST   /api/v1/users                      Admin creates User account for walk-up customer (school_admin)
                                          Atomically creates User + Household + Learner sub-profile
                                          Returns { userId, householdId, learnerId } for immediate use in booking

GET    /api/v1/households/:id             Get household with learner sub-profiles
POST   /api/v1/households                 Create a household
PATCH  /api/v1/households/:id             Update household

GET    /api/v1/households/:id/learners    List learners in a household
POST   /api/v1/households/:id/learners    Add a learner sub-profile
PATCH  /api/v1/households/:id/learners/:learnerId   Update a learner
DELETE /api/v1/households/:id/learners/:learnerId   Remove a learner
       409 LEARNER_HAS_ACTIVE_BOOKINGS returned when learner has confirmed bookings

GET    /api/v1/payment-methods            List stored cards for current household
POST   /api/v1/payment-methods            Add a card-on-file (via processor token)  [PCI]
DELETE /api/v1/payment-methods/:id        Remove a stored card
PATCH  /api/v1/payment-methods/:id/default  Set as default payment method
```

Skill levels use the six-level scale everywhere a skill level appears: `first_timer | beginner | advanced_beginner | intermediate | advanced | expert`. `skillLevelSource` records where the value came from: `customer | inferred | instructor | unresolved`. `skillLevelSource = instructor` can be set only by an instructor or school_admin. Mapping of existing three-level values to the six levels is undecided (Q10.10).

**POST /api/v1/auth/register payload:**
```json
{
  "email": "string",
  "password": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "skillLevel": "first_timer | beginner | advanced_beginner | intermediate | advanced | expert",
  "skillLevelSource": "customer | inferred | instructor | unresolved | null",
  "preferredLanguage": "en | fr",
  "parentalConsentGiven": "boolean | null"
}
```

**POST /api/v1/users payload (school_admin):**
```json
{
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string | null",
  "preferredLanguage": "en | fr",
  "learnerDateOfBirth": "YYYY-MM-DD",
  "skillLevel": "first_timer | beginner | advanced_beginner | intermediate | advanced | expert",
  "skillLevelSource": "customer | inferred | instructor | unresolved",
  "parentalConsentGiven": "boolean | null"
}
```
Age and skill level are collected in the walk-up form because an admin walk-up booking has no browse stage.

**POST /api/v1/users response:**
```json
{
  "userId": "uuid",
  "householdId": "uuid",
  "learnerId": "uuid"
}
```

**POST /api/v1/households/:id/learners payload:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "skillLevel": "first_timer | beginner | advanced_beginner | intermediate | advanced | expert",
  "skillLevelSource": "customer | inferred | instructor | unresolved",
  "notes": "string | null",
  "parentalConsentGiven": "boolean | null"
}
```
A learner added during household checkout supplies these details at that step; no later step asks again.

**POST /api/v1/payment-methods payload:** `[PCI]`
```json
{
  "processorToken": "string",
  "setAsDefault": "boolean"
}
```
Card data never reaches the API; only the processor token is submitted. `processorTokenId` is encrypted at rest.

---

### Account & Identity Service — Tenant Sign-in
**Overlay · Phase 2 · Proposal**

Lets a Manager Console user who belongs to several schools sign in to exactly one school per session. Phase 1 pilot console access, before this ships, is undecided (Q10.19).

```
POST   /api/v1/auth/login                 Existing login; returns the user's session before a tenant is selected  [PUBLIC]
GET    /api/v1/me/tenants                 List schools the current user belongs to, with role per school
POST   /api/v1/auth/select-tenant         Select one tenant; issues a JWT carrying tenantId and role
```

**POST /api/v1/auth/select-tenant payload:**
```json
{
  "tenantId": "uuid"
}
```
**Response:** `{ "accessToken": "string", "tenantId": "uuid", "role": "string" }`. The tenantId in this body selects among the user's memberships once; every later request resolves the tenant from the JWT only. An expired session returns the user to the same view after sign-in.

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

**POST /api/v1/instructors/:id/certifications payload:**
```json
{
  "body": "PSIA | CSIA",
  "level": 2,
  "issuedAt": "YYYY-MM-DD | null",
  "expiresAt": "YYYY-MM-DD",
  "documentUrl": "string | null"
}
```

---

### Catalog & Lesson Service

Owns lesson types, pricing, instructor requirements, group programs, and cancellation policies.

```
GET    /api/v1/lesson-types               List active lesson types for tenant
GET    /api/v1/lesson-types/:id           Get lesson type detail
POST   /api/v1/lesson-types               Create lesson type (school_admin)
PATCH  /api/v1/lesson-types/:id           Update lesson type (school_admin)
DELETE /api/v1/lesson-types/:id           Deactivate lesson type (school_admin)

POST   /api/v1/group-programs             Bulk-create one GroupSession per week of a group program (school_admin)
                                          Conflicting weeks are flagged and not created; the other weeks are created
                                          Idempotency-Key header required

GET    /api/v1/cancellation-policies      List cancellation policies for tenant
POST   /api/v1/cancellation-policies      Create cancellation policy (school_admin)
PATCH  /api/v1/cancellation-policies/:id           Update cancellation policy (school_admin)
PATCH  /api/v1/cancellation-policies/:id/default   Set as default; clears previous default (school_admin)
```

**POST /api/v1/lesson-types payload (school_admin):**
```json
{
  "nameEn": "string",
  "nameFr": "string",
  "category": "private | semi_private | group | camp | full_day | half_day",
  "durationMinutes": 60,
  "priceAmount": 12000,
  "currency": "USD | CAD",
  "maxCapacity": 6,
  "skillLevels": ["first_timer", "beginner"],
  "groupMode": "customer_selected | school_composed | null",
  "instructorRequirements": {},
  "meetingPoint": "string | null",
  "cancellationPolicyId": "uuid | null"
}
```
`groupMode` applies to group categories. `customer_selected` lesson types are booked as GroupSessions; `school_composed` lesson types are placed by the school through group placement requests (see Intake & Matching).

**POST /api/v1/group-programs request payload (school_admin):**
```json
{
  "lessonTypeId": "uuid",
  "instructorId": "uuid",
  "weekday": "monday | tuesday | wednesday | thursday | friday | saturday | sunday",
  "startTime": "HH:MM",
  "startDate": "YYYY-MM-DD",
  "weeks": 6
}
```
Behavior:
- One request defines a group program once and creates one GroupSession for each weekly occurrence, starting on the first `weekday` on or after `startDate`
- Each session's `endAt` is `startAt` plus `LessonType.durationMinutes`; `maxCapacity` is taken from `LessonType.maxCapacity`; `meetingPoint` is taken from the lesson type
- The lesson type must be a group lesson type with `groupMode = customer_selected`; otherwise the request is rejected as invalid
- The instructor is checked for each week against availability and existing bookings. A week with a conflict is flagged with reason `BOOKING_CONFLICT` and not created; every other week is created (partial success)
- The server generates one `programId` per request and stores it on every created GroupSession to group the program's sessions
- `Idempotency-Key` header is required. Replaying the same key returns the original response and creates nothing new
- The tenant comes from the JWT; the request is rejected if the lesson type or instructor does not belong to it
- Timezone and daylight-saving handling, and the maximum `weeks` per request, are undecided (Q10.48)

**POST /api/v1/group-programs response:**
```json
{
  "programId": "uuid",
  "created": [
    {
      "groupSessionId": "uuid",
      "week": 1,
      "startAt": "2026-12-07T09:00:00Z",
      "endAt": "2026-12-07T11:00:00Z",
      "maxCapacity": 8,
      "status": "open"
    }
  ],
  "flagged": [
    {
      "week": 3,
      "startAt": "2026-12-21T09:00:00Z",
      "reason": "BOOKING_CONFLICT"
    }
  ]
}
```
`week` is the 1-based occurrence number. `flagged` is empty when every week is created. How an admin later fixes a flagged week (retry one week or submit a new request) is undecided (Q10.49).

---

### Scheduling & Availability Service

Owns availability slots and open schedule templates. Provides inputs to the Booking Engine — does not create bookings itself.

```
GET    /api/v1/availability               Query available slots (booking widget)  [PUBLIC]
       ?lessonTypeId=&date=&age=&skillLevel=    skillLevel takes the six levels; age minimum 5

GET    /api/v1/instructors/:id/availability         Get instructor's availability
POST   /api/v1/instructors/:id/availability         Create availability slot or RRULE recurrence
PATCH  /api/v1/instructors/:id/availability/:slotId Update or override a slot
DELETE /api/v1/instructors/:id/availability/:slotId Remove a slot

GET    /api/v1/schedule                   Admin view of all instructor schedules
       ?date=&instructorId=               Filter parameters
```

**POST /api/v1/instructors/:id/availability payload:**
```json
{
  "startAt": "2026-12-20T09:00:00Z",
  "endAt": "2026-12-20T17:00:00Z",
  "recurrence": "RRULE string | null",
  "isBlocked": false
}
```
Whether `age` is an integer or a date of birth, and how a date of birth is derived without asking again, is undecided (Q10.42).

---

### Booking Engine

The authoritative service for all reservations in Booking Core (Phase 3). All booking requests — from customer app, admin dashboard, or walk-up POS — go through this service.

```
POST   /api/v1/slot-reservations          Create soft-hold SlotReservation; returns sessionToken + expiresAt  [PUBLIC]
POST   /api/v1/guest-checkouts            Create GuestCheckout record  [PUBLIC]
       Required: email, firstName, lastName, learnerDateOfBirth, skillLevel, preferredLanguage
       Conditional: parentalConsentGiven required if learnerDateOfBirth indicates age < 18

POST   /api/v1/bookings                   Create a booking (triggers payment); Idempotency-Key supported
GET    /api/v1/bookings/:id               Get booking detail
PATCH  /api/v1/bookings/:id/cancel        Cancel a booking (triggers refund if applicable)
PATCH  /api/v1/bookings/:id/complete      Mark booking as completed (instructor)
PATCH  /api/v1/bookings/:id/no-show       Mark student as no-show (instructor)
PATCH  /api/v1/bookings/:id/checkin       Check in student; sets checkedInAt; status stays confirmed (instructor)
PATCH  /api/v1/bookings/:id/reassign      Reassign booking to different instructor (school_admin)

GET    /api/v1/bookings                   List bookings (scoped by role)
       ?learnerId=&instructorId=&status=&from=&to=

POST   /api/v1/bookings/bulk-cancel       Bulk-cancel by filter; returns count + total refund (school_admin)

POST   /api/v1/bookings/:id/notes         Add session notes (instructor, school_admin)
GET    /api/v1/bookings/:id/notes         List session notes for booking

POST   /api/v1/bookings/:id/review        Submit rating after lesson completion
POST   /api/v1/bookings/:id/tip           [PCI] Submit optional tip; requires Booking.status = completed;
                                          window: 48 hours after Booking.endAt; one tip per booking;
                                          Idempotency-Key header required

GET    /api/v1/waitlist                   List waitlist entries (school_admin)
POST   /api/v1/waitlist                   Join a waitlist  [PUBLIC or authenticated]
DELETE /api/v1/waitlist/:id               Leave a waitlist
POST   /api/v1/waitlist/:id/accept        Accept a waitlist offer (within the 2-hour acceptance window)
PATCH  /api/v1/waitlist/:id/promote       Manually promote waitlisted student (school_admin)
```

**GuestCheckout request payload:**
```json
{
  "email": "string",
  "phone": "string | null",
  "firstName": "string",
  "lastName": "string",
  "preferredLanguage": "en | fr",
  "learnerDateOfBirth": "YYYY-MM-DD",
  "skillLevel": "first_timer | beginner | advanced_beginner | intermediate | advanced | expert",
  "skillLevelSource": "customer | inferred | instructor | unresolved | null",
  "parentalConsentGiven": "boolean | null"
}
```
Age and skill level are carried from the browse stage and are not asked again at checkout. **Response:** `{ "guestCheckoutId": "uuid" }`.

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
- `learnerId` is nullable (`uuid | null`) to support guest checkout. Server-side, exactly one of `learnerId` / `guestCheckoutId` must be non-null
- `paymentMethodId` is also nullable: it is null on the guest checkout path, where payment is captured through the processor SDK rather than a stored PaymentMethod
- Guest checkout request: `learnerId` null, `guestCheckoutId` set, `paymentMethodId` null. Authenticated request: `learnerId` set, `guestCheckoutId` null, `paymentMethodId` set (or the processor SDK path)
- `sessionToken` expires 15 minutes after the SlotReservation is created; `HOLD_EXPIRED` is returned if exceeded. Not every booking flow uses a soft-hold
- `Idempotency-Key` header is supported
- A household checkout for several learners creates one Booking and one Payment per selected learner. Reservation and sessionToken semantics for multiple learners are undecided (Q10.45)

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

**Bulk-cancel request payload (school_admin):**
```json
{
  "date": "YYYY-MM-DD",
  "instructorId": "uuid | null",
  "lessonTypeId": "uuid | null"
}
```
**Bulk-cancel response:** `{ "cancelledCount": 0, "totalRefundCents": 0, "currency": "USD | CAD" }`. Refunds are full regardless of policy. Fires `lesson.weather_cancel`.

**Session note request payload:**
```json
{
  "content": "string",
  "isSharedWithGuest": false
}
```
Instructors see all notes on their own bookings; guests see only notes with `isSharedWithGuest = true`; school_admin sees all.

**Review request payload:**
```json
{
  "rating": 5,
  "comment": "string | null"
}
```
Requires `Booking.status = completed` (`BOOKING_NOT_COMPLETED` otherwise). One rating per booking (`RATING_ALREADY_SUBMITTED`). Side effect: `Instructor.averageRating` is recomputed on insert. Accessible by the booking owner or by a booking reference token from the email link, without login. Lifetime and revocation of the token are undecided (Q10.46).

**Tip request payload:** `[PCI]`
```json
{
  "amountCents": 1000,
  "currency": "USD | CAD",
  "paymentMethodId": "uuid"
}
```
Headers: `Idempotency-Key: <client-generated unique key>` — required.

**Tip response:**
```json
{
  "paymentId": "uuid",
  "bookingId": "uuid",
  "paymentType": "tip",
  "amountCents": 1000,
  "currency": "USD | CAD",
  "status": "captured"
}
```

Server-side enforcement, evaluated in this order:
1. Status guard: `Booking.status` must be `completed`. A booking that is `confirmed`, `cancelled` or `no_show` is rejected with `BOOKING_NOT_COMPLETED`
2. Acceptance window: the request must arrive within 48 hours after `Booking.endAt`; later requests are rejected with `TIP_WINDOW_EXPIRED`
3. Idempotency: the `Idempotency-Key` header is required. Replaying the same key for the same booking returns the original response without a second charge. A request with a different key when a tip already exists for the booking is rejected with `TIP_ALREADY_SUBMITTED`
4. Uniqueness at the database layer: a unique partial index on `Payment(bookingId, paymentType) WHERE paymentType = 'tip'` allows one tip per booking and prevents duplicate charges even if the application checks race
5. The tip is a separate payment transaction (`paymentType = tip`) charged through the tenant's processor; it is not part of the booking charge

The tip requires a stored `paymentMethodId`. A guest-checkout user arriving by email link has no stored card; a link-based tokenized payment path or account creation is needed and is undecided (open).

**Reassign request payload (school_admin):**
```json
{
  "instructorId": "uuid",
  "reason": "string | null"
}
```
- `instructorId` (required): the new instructor. Must differ from the booking's current instructor and belong to the tenant
- `reason` (optional, nullable): free text recorded in the audit entry

**Reassign response (200):** the updated Booking record.
```json
{
  "id": "uuid",
  "learnerId": "uuid | null",
  "guestCheckoutId": "uuid | null",
  "instructorId": "uuid",
  "lessonTypeId": "uuid",
  "groupSessionId": "uuid | null",
  "startAt": "2026-12-20T09:00:00Z",
  "endAt": "2026-12-20T10:00:00Z",
  "status": "confirmed",
  "meetingPoint": "string | null",
  "checkedInAt": "timestamp | null",
  "updatedAt": "timestamp"
}
```
Behavior:
- The new instructor's availability and existing bookings are checked for the booking's time range. A conflict returns `BOOKING_CONFLICT`; double-booking is blocked. An admin resolves a flagged conflict by choosing a different instructor and resubmitting
- Booking time, learner, payment and cancellation policy are unchanged. No Payment is created or modified
- One AuditLog entry is written per reassignment: `action` identifies the reassignment, `targetType` is booking, `targetId` is the booking id, `actorId` is the admin's userId (never an email), and `metadata` holds `previousInstructorId`, `newInstructorId` and `reason`
- Undecided and not specified here (open): whether the student and the instructors are notified and whether the request carries a `notifyStudent` flag (Q10.54); which booking statuses can be reassigned and whether instructor certification or lesson-type requirements are checked beyond availability (Q10.55)

---

### Payment Service

Abstracts Stripe and Shift4 behind a common interface. Never called directly by client apps — only invoked by the Booking Engine and admin refund workflows. Shift4 requires Growth tier or above; Starter tier is Stripe only.

```
POST   /api/v1/payments/charge            Create and capture a charge (internal); Idempotency-Key supported  [PCI]
POST   /api/v1/payments/:id/refund        Issue a full or partial refund
GET    /api/v1/payments/:id               Get payment detail
GET    /api/v1/payments                   List payments (school_admin/operator)
       ?from=&to=&status=

POST   /api/v1/webhooks/stripe            Stripe webhook receiver  [PUBLIC]
POST   /api/v1/webhooks/shift4            Shift4 webhook receiver  [PUBLIC]
```

**POST /api/v1/payments/:id/refund payload:**
```json
{
  "amountCents": "integer | null",
  "reason": "string | null"
}
```
A null `amountCents` refunds the remaining balance in full. `refundedAmountCents` can never exceed `amountCents`. The refund goes through the processor that captured the charge.

**Payment schema notes:**
- `Payment.bookingId` is nullable. At least one of `bookingId` or `lessonPackageId` must be non-null
- `Payment.lessonPackageId` (FK, nullable) supports package purchase payments
- `Payment.paymentType` enum(`booking_charge`, `tip`, `package_purchase`) DEFAULT `booking_charge` discriminates payment kinds
- Unique partial index on `Payment(bookingId, paymentType) WHERE paymentType = 'tip'` enforces one tip per booking
- Application layer enforces mutual exclusivity: a payment links to booking OR package, never both
- The idempotency key for a charge is scoped to the reservationId
- Webhook tenant resolution (path slug or event account id) is undecided (Q10.51, Q10.52)
- Setting `paymentProcessor = shift4` on a Starter tenant is refused with `422 SHIFT4_TIER_REQUIRED` (proposed code)

---

### Notification Service

Triggered by events from other services — not called directly by client apps.

```
Internal events consumed:
  booking.confirmed       → send confirmation email + SMS + .ics attachment
  booking.cancelled       → send cancellation notice + refund confirmation
  booking.completed       → send post-lesson email with link for rating (required) and optional tip
  waitlist.slot_available → send waitlist notification (2-hour acceptance window opens)
  booking.reminder        → send 24-hour reminder (scheduled job)
  lesson.weather_cancel   → send bulk cancellation notice + rebooking link
  instructor.cert_expiry  → send certification expiry alert to school_admin
```

Overlay notifications (waitlist offers, interview links) have no event contract yet (Q10.28, Q10.36).

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

### Overlay — Privacy Gate & Platform Configuration
**Overlay · Phase 1 (prerequisite) · Proposal**

Controls whether a tenant may hold real personal data. The gate is closed by default. Retention periods and erasure behavior per data class are a human decision recorded in decisions.md and are not defined by this API (Q10.1).

```
GET    /api/v1/admin/data-class-policies               Policy status per data class (platform_admin; school_admin reads status only)
PUT    /api/v1/admin/data-class-policies/:dataClass    Record approved retention and erasure behavior (platform_admin)
PATCH  /api/v1/admin/tenants/:id/real-data             Enable real data for a tenant (platform_admin)
```

**PUT /api/v1/admin/data-class-policies/:dataClass payload:**
```json
{
  "retentionPeriod": "string",
  "erasureBehavior": "delete | pseudonymise",
  "minorRule": "string",
  "decisionRef": "string"
}
```
`decisionRef` must cite an entry in decisions.md. `retentionPeriod` format is open until the retention rules exist (Q10.1).

**PATCH /api/v1/admin/tenants/:id/real-data payload:**
```json
{
  "realDataEnabled": true
}
```
Rejected unless every gated data class has an approved policy. Whether Phase 1 import of real POS customer data also needs the gate is undecided (Q10.2); whether backups and model-provider logs are in erasure scope is undecided (Q10.3).

Gated write endpoints return `409 PRIVACY_GATE_CLOSED` unless `Tenant.realDataEnabled` is true and the data class policy is approved: agent conversations, observations with a free-text reason, intakes and intake profiles, post-lesson interviews, instructor interviews, and next-lesson recommendations. Purges and erasures are logged without raw personal data.

---

### Overlay — Schedule Import
**Overlay · Phase 1 · Proposal**

Reads the school's daily schedule and roster from the POS through a read-only import adapter. No POS write method is reachable from these endpoints.

```
POST   /api/v1/imports                    Start an import for a date or range (school_admin)
GET    /api/v1/imports/:id                Import status with created, updated and flagged counts
GET    /api/v1/imports/:id/flags          Flagged records with reason and source row
PATCH  /api/v1/imports/:id/flags/:flagId  Dismiss a flag (school_admin)
```

**POST /api/v1/imports payload:**
```json
{
  "rangeStart": "YYYY-MM-DD",
  "rangeEnd": "YYYY-MM-DD"
}
```
For a single date, `rangeStart` equals `rangeEnd`. The import mechanism (file upload, scheduled pull or vendor API) and refresh frequency are undecided (Q10.11); the request body may gain fields once decided.

**GET /api/v1/imports/:id response:**
```json
{
  "id": "uuid",
  "status": "string",
  "rangeStart": "YYYY-MM-DD",
  "rangeEnd": "YYYY-MM-DD",
  "counts": { "created": 0, "updated": 0, "flagged": 0 }
}
```
The `status` values are open. Re-import updates changed records and keeps their POS references. Completion refreshes today's issues. A structurally unreadable batch is rejected with `422 IMPORT_UNREADABLE`. Whether a batch with some invalid records imports partially or is rejected whole is undecided (Q10.13); flagged records are excluded from issue detection until fixed.

**GET /api/v1/imports/:id/flags item:**
```json
{
  "flagId": "uuid",
  "sourceRow": 0,
  "recordType": "string",
  "reason": "string",
  "status": "open | dismissed | fixed"
}
```

**PATCH /api/v1/imports/:id/flags/:flagId payload:**
```json
{
  "status": "dismissed"
}
```
Imported lessons, learners and instructors cannot yet be stored under current Booking, Learner and Instructor constraints; storage is undecided (Q10.12). Imported learners with no profile get a minimal profile with `skillLevelSource = unresolved`.

---

### Overlay — Issues
**Overlay · Phase 1 · Proposal**

Operational issues detected from the imported model by deterministic rules and ranked by attention. Detection and ranking are pure functions of the imported data; the agent plays no part.

```
GET    /api/v1/issues                     Ranked issues for the tenant (school_admin)
       ?date=&type=&status=
GET    /api/v1/issues/:id                 Issue detail with rank inputs
GET    /api/v1/issues/:id/plans           Resolution plans for an issue
```

**GET /api/v1/issues item:**
```json
{
  "id": "uuid",
  "type": "string",
  "status": "open | planned | resolved",
  "affectedLessonRefs": ["string"],
  "detectedAt": "timestamp",
  "impactAt": "timestamp",
  "rankScore": 0,
  "rankInputs": {}
}
```
Issue types beyond absence, group imbalance and overload are undecided (Q10.15); ranking criteria are undecided (Q10.14). Pilot console access to issues in Phase 1 depends on Q10.19.

---

### Overlay — Plans & Approval
**Overlay · Phase 1 (review, validation) and Phase 2 (decision) · Proposal**

A ResolutionPlan is a set of proposed actions for an issue. Plans are drafted by the system or the agent; every action is validated by the deterministic constraint and policy engine. Only a manager decision moves a plan toward execution.

```
GET    /api/v1/plans/:id                  Plan with reasoning per action, impact, validation results and estimate labels
POST   /api/v1/plans/:id/validate         Run all constraints and policy; returns validation rows
POST   /api/v1/plans/:id/decision         Approve or reject a plan, or selected actions (school_admin with approval right)
```

**GET /api/v1/plans/:id response:**
```json
{
  "id": "uuid",
  "issueId": "uuid",
  "version": 1,
  "planHash": "string",
  "status": "draft | validated | pending_approval | approved | rejected | executing | executed | failed | stale | closed",
  "createdBy": "agent | system",
  "estimate": true,
  "actions": [
    {
      "actionId": "uuid",
      "actionType": "string",
      "targetRef": "string",
      "params": {},
      "expectedState": {},
      "reasoning": "string",
      "validations": [
        {
          "ruleId": "string",
          "ruleVersion": 1,
          "result": "pass | fail",
          "reason": "string",
          "evaluatedAt": "timestamp"
        }
      ]
    }
  ]
}
```
The engine is pure and versioned: the same inputs give the same result. Rules run again at plan view, at approval and at execution. A failed constraint blocks approval. Which policies and constraints exist, and who sets them, is undecided (Q10.6, Q10.7). Whether reasoning text is English-only in Phase 1-2 is undecided (Q10.16).

**POST /api/v1/plans/:id/validate response:** `{ "planId": "uuid", "planHash": "string", "valid": true, "validations": [ ... ] }` with the same validation shape as above.

**POST /api/v1/plans/:id/decision payload:**
```json
{
  "decision": "approve | reject",
  "actionIds": ["uuid"],
  "reason": "string | null"
}
```
- `actionIds` is optional; when omitted, all actions of the plan are decided together
- The plan is re-validated first. `409 PLAN_STALE` is returned when the schedule has changed since the plan's `planHash`; `422 PLAN_VALIDATION_FAILED` is returned when a constraint fails
- The decision is recorded as an append-only ManagerDecision containing planId, planHash, userId, decision, approved action ids, reason and time. An approved plan becomes ready to execute; a rejected plan is closed
- Agent and system actors can never approve. The approval right is a separate permission; who holds it is undecided (Q10.22)
- Whether a manager can edit a plan before approving (Q10.20) and whether a rejection reason is required (Q10.21) are undecided; `reason` is therefore optional here

---

### Overlay — Execution & Verification
**Overlay · Phase 2 · Proposal**

Executes an approved plan through the POS adapter and verifies the result. The Orchestration Service is the only holder of POS write credentials.

```
POST   /api/v1/plans/:id/execute          Execute the approved actions of a plan (school_admin); Idempotency-Key supported
GET    /api/v1/plans/:id/outcomes         Per-action outcomes
POST   /api/v1/plans/:id/observations     Record whether the recommendation matched what the manager did (school_admin)  [GATE for free-text reason]
GET    /api/v1/reports/pilot-matches      Match aggregates for pilot success metrics
       ?from=&to=
```

**POST /api/v1/plans/:id/execute behavior:**
- Requires an approved ManagerDecision whose `planHash` matches the current plan; otherwise `409 PLAN_STALE`
- Re-checks constraints and policy immediately before writing
- Sends each approved action through the POS adapter with an idempotency key equal to the actionId, reads the result back and compares it to `expectedState`
- A tenant with a read-only adapter returns `ADAPTER_READ_ONLY`; its actions become `manual_pending` outcomes, completed by the manager in the POS and tracked through observations
- Rollback or retry after failed verification (Q10.23), and partial-plan failure semantics and per-lesson locking against concurrent POS edits (Q10.24), are undecided

**GET /api/v1/plans/:id/outcomes response:**
```json
{
  "planId": "uuid",
  "outcomes": [
    {
      "actionId": "uuid",
      "status": "pending | executed | verified | failed | manual_pending",
      "adapterRequestId": "string | null",
      "observedState": {},
      "verifiedAt": "timestamp | null",
      "error": "string | null"
    }
  ]
}
```
Outcomes are frozen after their final status, and an AuditLog entry is written per transition.

**POST /api/v1/plans/:id/observations payload:**
```json
{
  "result": "matched | partly_matched | different | not_needed",
  "reason": "string | null"
}
```
`reason` is free text and is gated. Whether "what the manager did" is self-reported or inferred from later imports is undecided (Q10.41).

---

### Overlay — Manager Agent
**Overlay · Phase 1 (provisional) · Proposal**

A conversational assistant for the manager. All model calls go through the Agent Gateway: read-only tools, no write credentials, schema-validated output. Answers cite facts and rule ids and link the related issue or plan. A request to change the schedule creates a draft plan; it never writes. Phase placement is provisional (Q10.53).

```
POST   /api/v1/agent/conversations                       Start a conversation (school_admin)  [GATE]
POST   /api/v1/agent/conversations/:id/messages          Ask a question  [GATE]
GET    /api/v1/agent/conversations/:id                   Get a conversation
```

**POST /api/v1/agent/conversations/:id/messages payload:**
```json
{
  "content": "string"
}
```

**Response:**
```json
{
  "messageId": "uuid",
  "role": "agent",
  "content": "string",
  "citedFacts": [],
  "citedRuleIds": ["string"],
  "issueId": "uuid | null",
  "planId": "uuid | null",
  "estimate": true
}
```
Retrieval is strictly tenant-scoped. Prompts and logs carry user ids, not emails. Retention and erasure of conversations is undecided (Q10.17); model provider and no-training terms are undecided (Q10.8, Q10.9).

---

### Overlay — Audit
**Overlay · Phase 2 (provisional) · Proposal**

Read-only history of decisions and actions. There are no write endpoints, and no UPDATE or DELETE is possible on decisions or finalized outcomes.

```
GET    /api/v1/audit/decisions            Decisions and outcomes (school_admin)
       ?from=&to=&issueType=&userId=&outcome=
GET    /api/v1/audit/decisions/:id        One decision with plan, actions and verification
GET    /api/v1/audit/decisions/export     CSV of the filtered list
       ?from=&to=&issueType=&userId=&outcome=
```

**GET /api/v1/audit/decisions item:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "decidedAt": "timestamp",
  "decision": "approve | reject",
  "planId": "uuid",
  "issueType": "string",
  "actionIds": ["uuid"],
  "outcome": "string"
}
```
Audit entries record userId only, never a raw email. Retention for overlay audit data is undecided (Q10.25).

---

### Overlay — Waitlist Ranking & Offers
**Overlay · Phase 2 (provisional) · Proposal**

Ranks waiting guests for an open slot and lets the manager offer it. An offer is not a booking: it creates no reservation, takes no payment, and never calls the Booking Engine or the Payment Service.

```
GET    /api/v1/waitlist/ranking           Ranked waitlist for a slot (school_admin)
       ?slotRef=
POST   /api/v1/waitlist/:id/offers        Manager-approved offer with a 2-hour window (school_admin)
POST   /api/v1/waitlist/offers/:id/accept   Guest accepts via signed link  [PUBLIC]
POST   /api/v1/waitlist/offers/:id/decline  Guest declines via signed link  [PUBLIC]
```

**GET /api/v1/waitlist/ranking item:**
```json
{
  "waitlistEntryId": "uuid",
  "rank": 1,
  "score": 0,
  "fitReasons": ["string"],
  "unresolvedSkill": false,
  "estimate": true
}
```
Hard filters (slot, lesson type, ability) apply first; then a deterministic score on goals and instructor fit. Entries with unresolved skill rank lower and are flagged. Manual order uses the existing `PATCH /api/v1/waitlist/:id/promote`. Fit-based versus first-in-first-out default is undecided; where overlay waitlist entries originate is undecided (Q10.26).

**POST /api/v1/waitlist/:id/offers payload:**
```json
{
  "slotRef": "string"
}
```
**Offer response:**
```json
{
  "offerId": "uuid",
  "status": "offered | accepted | declined | expired",
  "offeredAt": "timestamp",
  "expiresAt": "timestamp"
}
```
`expiresAt` is `offeredAt` plus 2 hours, a fixed platform value (Tenant.waitlistAcceptWindowMinutes does not override it; Q10.29). Expiry closes the offer and surfaces the next ranked entry. Accepting records acceptance only: who creates the reservation afterwards (manager in the POS, or an adapter write that must go through a manager decision) is undecided (Q10.27), and the guest notification channel is undecided (Q10.28).

---

### Overlay — SkiMatch Intake & Matching
**Overlay · Phases 1-2 · Proposal**

A guest completes a conversational intake and receives rules-based, explainable instructor matches. Skill that is unclear is stored as unresolved and is never guessed.

```
POST   /api/v1/intakes                              Start an intake  [PUBLIC via school link token]  [GATE]
POST   /api/v1/intakes/:id/messages                 Submit one conversational turn  [PUBLIC intake token]  [GATE]
GET    /api/v1/intakes/:id/summary                  Profile summary for guest review  [PUBLIC intake token]
PATCH  /api/v1/intakes/:id/profile                  Guest corrections to the profile  [PUBLIC intake token]  [GATE]
POST   /api/v1/intakes/:id/confirm                  Guest confirms the profile  [PUBLIC intake token]  [GATE]
GET    /api/v1/intakes/:id/matches                  Instructor matches with fit reasons and mismatches  [PUBLIC intake token]
PATCH  /api/v1/intakes/:id/preferred-instructor     Guest records a preferred instructor  [PUBLIC intake token]
GET    /api/v1/intakes/:id/candidate-reservations   Deterministic POS reservation candidates (school_admin)
POST   /api/v1/intakes/:id/link                     Link the intake to a POS reservation (school_admin)
DELETE /api/v1/intakes/:id/link                     Unlink; the POS record is unchanged (school_admin)

POST   /api/v1/group-placement-requests             Request school-composed group placement  [PUBLIC intake token]
GET    /api/v1/group-placement-requests             List requests (school_admin)
PATCH  /api/v1/group-placement-requests/:id         Place the learner or propose alternatives (school_admin)

GET    /api/v1/learners/:id/next-lesson-recommendation   Next lesson recommendation (guest, own household learners)  [GATE]
```

Intake tokens are scoped to one tenant, rate limited, and single-use per intake. A minor learner without a ConsentRecord returns `403 CONSENT_REQUIRED`. EN/FR conversation handling (Q10.30), the relationship to the school's own checkout (Q10.31), and subject identity before linking to a Learner (Q10.32) are undecided.

**POST /api/v1/intakes payload:**
```json
{
  "language": "en | fr",
  "consentRef": "string | null"
}
```
**Response:** `{ "intakeId": "uuid", "intakeToken": "string" }`.

**POST /api/v1/intakes/:id/messages payload:**
```json
{
  "content": "string"
}
```

**GET /api/v1/intakes/:id/summary and PATCH profile payload:**
```json
{
  "goals": [{ "value": "string", "originalWording": "string", "source": "customer | inferred" }],
  "terrain": [{ "value": "string", "originalWording": "string", "source": "customer | inferred" }],
  "confidence": { "value": "string", "originalWording": "string", "source": "customer | inferred" },
  "preferences": [{ "value": "string", "originalWording": "string", "source": "customer | inferred" }],
  "skillLevel": "first_timer | beginner | advanced_beginner | intermediate | advanced | expert | null",
  "skillLevelSource": "customer | inferred | instructor | unresolved"
}
```
The PATCH accepts any subset of these fields. Each value keeps the guest's original wording and its source.

**GET /api/v1/intakes/:id/matches response:**
```json
{
  "matches": [
    {
      "instructorId": "uuid",
      "score": 0,
      "fitReasons": ["string"],
      "mismatches": ["string"],
      "estimate": true
    }
  ],
  "fallback": "waitlist | manager_review | null"
}
```
Hard constraints (availability from the import, certification, lesson type, language, age) apply first; a rules-based soft score ranks what remains. When there is no match, `fallback` offers the waitlist or manager review. Only an allow-list of instructor profile fields is visible to guests; which learned-profile fields are visible is undecided (Q10.33).

**PATCH /api/v1/intakes/:id/preferred-instructor payload:**
```json
{
  "instructorId": "uuid"
}
```

**POST /api/v1/intakes/:id/link payload:**
```json
{
  "posReferenceId": "uuid"
}
```
Whether linking is manual, automatic by customer and time, or by booking reference is undecided (Q10.35).

**POST /api/v1/group-placement-requests payload:**
```json
{
  "lessonTypeId": "uuid",
  "preferredDate": "YYYY-MM-DD"
}
```
The intake supplies age, ability and goals. Request status values: `pending | placed | unplaceable`. Customer-selected lesson types route to GroupSession booking instead. Group composition rules are undecided (Q10.34).

**PATCH /api/v1/group-placement-requests/:id payload:**
```json
{
  "status": "placed | unplaceable",
  "alternatives": [{ "date": "YYYY-MM-DD", "lessonTypeId": "uuid" }]
}
```
The shape of a placement result (which session or group the learner is placed in) is open.

**GET /api/v1/learners/:id/next-lesson-recommendation response:**
```json
{
  "lessonTypeId": "uuid",
  "level": "first_timer | beginner | advanced_beginner | intermediate | advanced | expert",
  "instructorId": "uuid",
  "reasons": ["string"],
  "estimate": true
}
```
Derived deterministically from the profile, both lesson assessments and availability. With not enough data, the response offers a new intake instead. Requesting the lesson goes through the intake path. Whether managers and instructors also see it, and whether guests can book from it directly, is undecided (Q10.38).

---

### Overlay — Learning Loop (Post-lesson Interviews)
**Overlay · Phase 2 · Proposal**

Post-lesson interviews from the student and from the instructor update the learner profile by deterministic merge with source tagging. Instructor-derived learned-profile data feeds coaching and assignment only, never an evaluation or employment decision.

```
GET    /api/v1/interviews/student/:token                   Student interview questions  [PUBLIC signed token]
POST   /api/v1/interviews/student/:token/answers           Submit answers; partial answers are kept  [PUBLIC signed token]  [GATE]
GET    /api/v1/instructor-interviews                       Open interviews for the instructor
       ?status=open
POST   /api/v1/instructor-interviews/:lessonRef/answers    Submit answers per student, with a whole-group shortcut  [GATE]
```

The student interview is allowed only after the lesson is complete per the import, and subject to minor consent. The token is signed, tenant scoped and limited to a single learner. Delivery channel and trigger (Q10.36), and delivery channel for instructors (Q10.37), are undecided.

**POST /api/v1/interviews/student/:token/answers payload:**
```json
{
  "respondent": "adult | learner",
  "answers": [{ "questionId": "string", "value": "string", "originalWording": "string" }]
}
```
**Response:** `{ "status": "complete | partial" }`.

**POST /api/v1/instructor-interviews/:lessonRef/answers payload:**
```json
{
  "learnerId": "uuid | null",
  "wholeGroup": false,
  "answers": [{ "questionId": "string", "value": "string" }]
}
```
`learnerId` is null when `wholeGroup` is true. Deferral leaves the interview open. The learned profile is readable by school_admin and the instructor, never by guests.

---

### Overlay — Privacy Requests & Consent
**Overlay · Phase 2 · Proposal**

Export, erasure and minor consent. Must exist before the privacy gate opens.

```
POST   /api/v1/learners/:id/data-export                      Request a downloadable copy of a learner's profile and conversation data
POST   /api/v1/learners/:id/erasure-requests                 Request erasure
GET    /api/v1/privacy-requests/:id                          Status of an export or erasure request

GET    /api/v1/learners/:id/consent-text                     Versioned consent text for a minor's guardian
POST   /api/v1/learners/:id/consents                         Grant consent
POST   /api/v1/learners/:id/consents/:consentId/withdraw     Withdraw consent; stops collection and offers export or erasure
```

Allowed for the verified head of household of the learner, and for school_admin on request. Requests find data through the data class policy registry so that no gated class is missed. Retained finance and audit records are listed to the requester; POS-owned records are not erased and the school is notified. Completion is logged without raw personal data.

**POST /api/v1/learners/:id/consents payload:**
```json
{
  "consentVersion": "string"
}
```
Responses use `403 CONSENT_REQUIRED` for gated minor writes without consent. The adult is taken from the JWT.

**GET /api/v1/privacy-requests/:id response:**
```json
{
  "id": "uuid",
  "type": "export | erasure",
  "status": "string",
  "retainedCategories": [],
  "posNotifiedAt": "timestamp | null",
  "completedAt": "timestamp | null"
}
```
Who may request on a school's behalf and how instructor learned-profile data derived from the learner is erased is undecided (Q10.39). Age threshold by province or state and consent wording are pending legal review (Q10.40).

---

## Authentication & Authorization

| Role | Access |
|------|--------|
| `[PUBLIC]` | Unauthenticated; availability queries, slot reservations, guest checkout, processor webhooks, auth/register, auth/login, password reset; overlay intake, interview and waitlist-offer links by scoped token |
| `guest` | Own household, learners, bookings, payment methods; post-lesson review and tip submission; consent, export and erasure for own learners; next-lesson recommendation |
| `instructor` | Own profile, availability, assigned bookings, earnings, session notes (read/write); check-in; complete; no-show; cancel own lessons; own post-lesson interviews |
| `school_admin` | All tenant data — instructors, bookings, schedule, reports, cancellation policies, certification management, group programs; overlay imports, issues, plans, execution, audit, waitlist offers, intake linking and group placement. Plan approval requires a separate approval right |
| `operator` | All tenant data across multiple schools, white-label config, processor config |
| `platform_admin` | All tenants — internal use only; owns data class policies and the real-data switch |

JWT claims include: `userId`, `tenantId`, `role`

Tenant is always resolved from the JWT — it is never accepted as a client-supplied parameter. The single exception is `POST /api/v1/auth/select-tenant`, which chooses among the user's own memberships and issues the JWT.

Agent and system actors can never approve a plan. Intake, interview and waitlist-offer tokens are scoped to one tenant and, where stated, one learner or offer.

Who holds the plan approval right is undecided (Q10.22). Sign-in method (password or SSO) and overlay roles are undecided (Q10.18).

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

**Defined error codes (Booking Core):**
- `BOOKING_CONFLICT` — instructor not available at requested time; also returned by reassign
- `HOLD_EXPIRED` — SlotReservation TTL (15 min) exceeded before booking confirmed
- `PAYMENT_FAILED` — processor declined charge
- `PAYMENT_VOID_FAILED` — all void retries exhausted; Payment.status = void_pending
- `AGE_TOO_YOUNG` — learner age < 5 at time of booking
- `LEARNER_HAS_ACTIVE_BOOKINGS` — DELETE on learner blocked; confirmed bookings exist (409)
- `WAITLIST_WINDOW_EXPIRED` — acceptance window closed
- `RATING_ALREADY_SUBMITTED` — InstructorRating already exists for this booking
- `TIP_ALREADY_SUBMITTED` — tip Payment already exists for this booking
- `TIP_WINDOW_EXPIRED` — 48-hour tip acceptance window has closed
- `BOOKING_NOT_COMPLETED` — tip or review submitted against a booking not in completed status

**Proposed error codes (Overlay and processor configuration):**
- `PRIVACY_GATE_CLOSED` (409) — gated write attempted while the tenant's real-data switch is off or the data class policy is not approved
- `CONSENT_REQUIRED` (403) — minor learner without a ConsentRecord
- `PLAN_STALE` (409) — the schedule changed since the plan's planHash
- `PLAN_VALIDATION_FAILED` (422) — a constraint failed
- `IMPORT_UNREADABLE` (422) — the import batch is structurally unreadable
- `ADAPTER_READ_ONLY` — POS adapter has no write capability; actions become manual
- `SHIFT4_TIER_REQUIRED` (422) — Shift4 selected on a Starter tenant

## Non-Functional

- Rate limiting applied at the API gateway per tenant and per IP; public intake endpoints are rate limited by link token as well
- All endpoints require TLS 1.3
- Responses include `X-Request-ID` header for tracing
- Idempotency keys supported on `POST /api/v1/bookings` and `POST /api/v1/payments/charge`; required on `POST /api/v1/bookings/:id/tip` and `POST /api/v1/group-programs`; supported on `POST /api/v1/plans/:id/execute`
- Bulk operations (bulk-cancel, group program creation) may touch hundreds of records in one call and are designed for partial-failure reporting
- Overlay scores, confidences and recommendations carry `estimate: true` until measured
- Prompts and logs carry user ids, not emails; purge and erasure jobs are logged without raw personal data
- Real-time updates for the admin schedule view and Manager Console (SSE, WebSocket or polling) are undecided; auto-completion scheduler interval is undecided

## Open Questions

Carried from earlier runs: Q10.1-Q10.46, Q10.48-Q10.53 are referenced inline above.

Answered in this draft:
- Q10.47 — Bulk group program endpoint: `POST /api/v1/group-programs` with `{ lessonTypeId, instructorId, weekday, startTime, startDate, weeks }`, an `Idempotency-Key` header, and a response of `{ programId, created[], flagged[] }`. This is a proposal pending confirmation by a human

Still open:
- Q10.48 — Timezone and daylight-saving handling for weekly occurrences, and the maximum `weeks` per request
- Q10.49 — How an admin later fixes a flagged week of a group program: retry one week, or submit a new request
- Q10.54 — Reassign: whether students and instructors are notified, and whether a `notifyStudent` field exists
- Q10.55 — Reassign: which booking statuses are reassignable, and whether instructor certification or lesson-type requirements are checked beyond availability
- Q10.56 — Group program: error code and status for a request whose lesson type is not a customer-selected group type, and the shape of the result when every week conflicts
- Q10.57 — Error returned when an overlay tenant calls a booking or payment endpoint
- Tip: payment path for guest-checkout users with no stored card
- `GET /api/v1/instructors/:id/earnings` has no response payload defined
