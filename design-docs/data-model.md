# Slopebook — Proposed Data Model

**Document Status:** Draft
**Last Updated:** 2026-03-24
**Author:** Data-Modeler Agent
**Version:** 0.2 (proposed revision of `design-docs/data-model.md` v0.1)

---

## 1. Summary of Changes

This section enumerates every entity that is new, modified, or removed relative to the baseline `data-model.md`. Each change references the critique ID(s) that motivate it.

### New Entities

| Entity | Motivation | Notes |
|---|---|---|
| `SlotReservation` | CRT-H-001 | Time-limited soft hold created when a guest selects a slot at checkout. Prevents double-booking under concurrent load. TTL ~5–30 minutes (configurable, bounded by TR-F-002). |
| `CancellationPolicy` | CRT-H-002 | Configurable refund rules per Tenant or LessonType. Replaces the undocumented implicit policy that existed nowhere in the schema. |
| `GuestCheckout` | CRT-H-003 | Lightweight guest record for bookings made without a full User/Household/Learner chain. Resolves the structural impossibility of guest checkout. |
| `GroupSession` | CRT-H-005 | Parent record grouping multiple single-learner Bookings under one instructor time block for group/camp/full-day lessons. |
| `OAuthToken` | CRT-H-006 | Stores encrypted Google Calendar OAuth tokens per User. Required for the v1.0 GA calendar sync feature. |
| `InstructorTenant` | CRT-H-004 | Join table replacing the single `tenantId` FK on `Instructor`, enabling freelance instructors to belong to multiple Tenants. |
| `WhiteLabelConfig` | CRT-M-007 | Branding and custom domain configuration per Tenant. Required for the Enterprise-tier white-label feature. |
| `ApiKey` | CRT-M-008 | Hashed API key for external integrations, owned by Tenant. |
| `Webhook` | CRT-M-008 | Webhook endpoint configuration, owned by Tenant. |
| `BookingNote` | CRT-M-010 | Replaces the single overloaded `Booking.notes text` field. Supports multiple notes per booking, role-scoped visibility, and the instructor sharing flag. |
| `Certification` | CRT-M-004 | Replaces the unstructured `Instructor.certifications json` blob with a normalised, indexable entity enabling efficient expiry alerting. |
| `WorkdayHandoff` | CRT-L-004 | Replaces the single `workdayHandoffAt` timestamp on `Instructor` with a full audit-capable handoff history record. |

### Modified Entities

| Entity | Fields Changed | Motivation |
|---|---|---|
| `Tenant` | Add `waitlistAcceptWindowMinutes int` (default 120), `tipsEnabled boolean` (default false) | CRT-H-010 (OQ-009 configurable accept window), CRT-M-009 (tips enablement flag) |
| `User` | Add `phone string` (nullable), `phoneVerified boolean` (default false), `emailOptOut boolean` (default false), `smsOptOut boolean` (default false) | CRT-L-006, CRT-M-001 |
| `Instructor` | Remove `tenantId FK`, remove `certifications json`, remove `onboardingStatus`, remove `workdayHandoffAt`. Multi-tenancy via `InstructorTenant`. Certifications via `Certification`. | CRT-H-004, CRT-M-004, CRT-L-004 |
| `LessonType` | Add `cancellationPolicyId FK → CancellationPolicy` (nullable), add `meetingPoint string` (nullable) | CRT-H-002, CRT-M-003 |
| `Availability` | Change `recurrence` field type from `json` to `text` | CRT-L-002 (RRULE is RFC 5545 text, not JSON) |
| `Booking` | Add `softReservationId FK → SlotReservation` (nullable, cleared on confirm), `cancellationPolicyId FK → CancellationPolicy` (non-nullable, snapshot at booking time), `groupSessionId FK → GroupSession` (nullable), `skillLevelAtBooking enum`, `meetingPoint string` (nullable), `guestCheckoutId FK → GuestCheckout` (nullable). Make `learnerId` nullable. Remove `notes text`. Change `status` enum: remove `waitlisted`, add `in_progress`. | CRT-H-001, CRT-H-002, CRT-H-003, CRT-H-005, CRT-H-009, CRT-M-002, CRT-M-003, CRT-M-010 |
| `Payment` | Add `bookingId FK → Booking` (nullable), `groupSessionId FK → GroupSession` (nullable), `householdId` made nullable (guest checkout has no household), `tipAmountCents integer` (nullable) | CRT-M-005, CRT-H-003, CRT-M-009 |
| `Learner` | Add `waiverSignedAt timestamp` (nullable), `waiverVersion string` (nullable) | TR-F-077, OQ-008 |
| `WaitlistEntry` | Make `learnerId` nullable, add `guestEmail string` (nullable). CHECK: either `learnerId` or `guestEmail` must be non-null. | CRT-H-003 (unauthenticated waitlist path, GAP-013) |
| `AuditLog` | Make `actorId` nullable, add `actorType enum(user, system)` | CRT-L-005 |

### Removed Fields (from existing entities)

| Entity | Field Removed | Replacement | Motivation |
|---|---|---|---|
| `Instructor` | `tenantId` | `InstructorTenant` join table | CRT-H-004 |
| `Instructor` | `certifications json` | `Certification` entity | CRT-M-004 |
| `Instructor` | `onboardingStatus` | Moved to `InstructorTenant.onboardingStatus` (per-tenant) | CRT-H-004 |
| `Instructor` | `workdayHandoffAt` | `WorkdayHandoff` entity | CRT-L-004 |
| `Booking` | `notes text` | `BookingNote` entity | CRT-M-010 |
| `Booking` | `status = waitlisted` | `WaitlistEntry` entity only | CRT-H-009 |

---

## 2. Full Proposed Data Model

Every entity is listed in full. Fields carried unchanged from the baseline are preserved exactly. New fields are annotated with `-- NEW` or `-- MODIFIED`. Removed fields are omitted (see Section 1 for removed field list).

---

### Tenant

Represents a resort or ski school. The top-level isolation boundary for all data.

```
Tenant
  id                        uuid, PK
  name                      string
  slug                      string, unique              -- used in subdomain / white-label URL
  currency                  enum(USD, CAD)
  defaultLanguage           enum(en, fr)
  paymentProcessor          enum(stripe, shift4)
  paymentCredentials        encrypted json              -- processor API keys, never exposed in UI
  subscriptionTier          enum(starter, growth, pro, enterprise)
  waitlistAcceptWindowMinutes integer, default 120      -- NEW: configurable 2-hour default (CRT-H-010 / OQ-009)
  tipsEnabled               boolean, default false      -- NEW: enables tip line item at checkout (CRT-M-009)
  createdAt                 timestamp
  updatedAt                 timestamp
  paymentCredentials        encrypted json  -- see open-questions.md OQ-005 for schema per processor/tier
```

**Notes:**
- `waitlistAcceptWindowMinutes` replaces the hardcoded 2-hour value in TR-F-045. Until OQ-009 is formally resolved this defaults to 120 but is now schema-ready for per-tenant override.
- `tipsEnabled` gates the tip selector in the checkout UI and the tip line item in Payment. Until OQ (tips scope) is resolved, this defaults to false.

---

### User

An authenticated user of the platform. Roles determine which app surfaces they can access.

```
User
  id                  uuid, PK
  tenantId            uuid, FK → Tenant, nullable      -- null for platform-level admin users and multi-tenant instructors
  email               string, unique
  passwordHash        string
  role                enum(guest, instructor, school_admin, operator, platform_admin)
  preferredLanguage   enum(en, fr)
  phone               string, nullable                 -- NEW: E.164 format (CRT-L-006)
  phoneVerified       boolean, default false           -- NEW: set true after OTP verification (CRT-L-006)
  emailOptOut         boolean, default false           -- NEW: CASL / CAN-SPAM compliance (CRT-M-001)
  smsOptOut           boolean, default false           -- NEW: CASL / CAN-SPAM compliance (CRT-M-001)
  createdAt           timestamp
  updatedAt           timestamp
```

**Notes:**
- `tenantId` was already nullable for platform-level admins; it is also null for freelance instructors who belong to multiple tenants (their tenant memberships live in `InstructorTenant`).
- `phone` stores an E.164-formatted string (e.g., `+14155552671`). Raw phone numbers are never exposed in API responses beyond the account owner's own record.

---

### Household

An adult account that manages reservations for multiple learners. Owned by one User.

```
Household
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  ownerId             uuid, FK → User                 -- the Head of Household
  createdAt           timestamp
```

No changes from baseline. Preserved as-is.

---

### Learner

A sub-profile within a household. May be a minor who cannot log in independently.

```
Learner
  id                  uuid, PK
  householdId         uuid, FK → Household
  firstName           string
  lastName            string
  dateOfBirth         date
  skillLevel          enum(beginner, intermediate, advanced)
  notes               text                            -- medical notes, equipment notes
  waiverSignedAt      timestamp, nullable             -- NEW: timestamp of waiver acceptance (TR-F-077, OQ-008)
  waiverVersion       string, nullable                -- NEW: version string of waiver signed (TR-F-077, OQ-008)
  createdAt           timestamp
```

**Notes:**
- `waiverSignedAt` and `waiverVersion` are nullable. The electronic waiver capture feature is gated on OQ-008 (jurisdiction-specific rules) per TR-F-077, but the schema is reserved now to avoid a later breaking migration.

---

### Instructor

A coach profile. Linked to a User account. Multi-tenancy is managed through `InstructorTenant`.

```
Instructor
  id                  uuid, PK
  userId              uuid, FK → User
  bioEn               text
  bioFr               text
  photoUrl            string
  languagesSpoken     string[]
  createdAt           timestamp
```

**Removed from baseline:** `tenantId`, `certifications json`, `onboardingStatus`, `workdayHandoffAt`.

**Notes:**
- `tenantId` is gone. Tenant membership and per-tenant onboarding status live in `InstructorTenant`.
- `certifications json` is gone. Certification records live in `Certification` (normalised entity).
- `onboardingStatus` is gone. It was per-tenant; see `InstructorTenant.onboardingStatus`.
- `workdayHandoffAt` is gone. Payroll history lives in `WorkdayHandoff`.
- `instructorRequirements` that gated which skill levels an instructor can teach was implicit in certifications. Going forward, eligibility is resolved by joining through `InstructorTenant` → `Certification`, filtered by `LessonType.instructorRequirements` (which remains a JSON field on `LessonType` for now — see CRT-M-004 for longer-term normalisation recommendation).

---

### InstructorTenant

Join table enabling many-to-many relationship between Instructor and Tenant. Holds all per-tenant instructor state.

```
InstructorTenant
  instructorId        uuid, FK → Instructor           -- NEW entity (CRT-H-004)
  tenantId            uuid, FK → Tenant
  onboardingStatus    enum(pending, approved, inactive)  -- per-tenant status
  workdayHandoffAt    timestamp, nullable              -- retained here for lightweight last-handoff reference; full history in WorkdayHandoff
  createdAt           timestamp
  PRIMARY KEY         (instructorId, tenantId)
```

**Notes:**
- An instructor is only visible in a tenant's booking widget when `onboardingStatus = approved` for that tenant.
- The composite PK `(instructorId, tenantId)` enforces uniqueness of the relationship.
- TR-DC-010 (original constraint that `Instructor.tenantId` must match `User.tenantId`) is superseded. The new constraint is: for every `InstructorTenant` row, the `Instructor.userId` must reference a `User` with either `tenantId = null` (multi-tenant user) or `tenantId = InstructorTenant.tenantId` (single-tenant user). Enforced at application layer.

---

### Certification

Normalised instructor certification record. Replaces `Instructor.certifications json`.

```
Certification
  id                  uuid, PK                        -- NEW entity (CRT-M-004)
  instructorId        uuid, FK → Instructor
  body                enum(PSIA, CSIA)
  level               integer                         -- e.g. 1, 2, 3 for PSIA levels
  issuedAt            date, nullable
  expiresAt           date
  alertSentAt         timestamp, nullable              -- set when the 60-day expiry alert is dispatched; prevents duplicate alerts
  documentUrl         string, nullable                -- scanned cert upload (GAP-016)
  createdAt           timestamp
  updatedAt           timestamp
```

**Notes:**
- `alertSentAt` enables the certification expiry job (TR-F-057) to use an indexed query: `WHERE expiresAt <= now() + 60 days AND alertSentAt IS NULL`. No full-table scan required.
- An `INDEX ON (instructorId, expiresAt)` is recommended.
- An `INDEX ON (expiresAt, alertSentAt)` is recommended for the background job.

---

### WorkdayHandoff

Full payroll handoff history per instructor per tenant. Replaces the single `Instructor.workdayHandoffAt` timestamp.

```
WorkdayHandoff
  id                  uuid, PK                        -- NEW entity (CRT-L-004)
  instructorId        uuid, FK → Instructor
  tenantId            uuid, FK → Tenant
  handoffAt           timestamp
  periodStart         date
  periodEnd           date
  status              enum(pending, delivered, failed)
  earningsSnapshotJson json                           -- earnings data captured at handoff time, immutable after creation
  createdAt           timestamp
```

**Notes:**
- `earningsSnapshotJson` is immutable after creation (no `updatedAt`). It captures the earnings state at handoff so the data is retrievable historically even if underlying bookings or payments are later modified.
- Failed handoffs can be retried, creating a new `WorkdayHandoff` record rather than mutating the failed one.

---

### LessonType

A configurable product in the lesson catalog. Owned by a Tenant.

```
LessonType
  id                      uuid, PK
  tenantId                uuid, FK → Tenant
  nameEn                  string
  nameFr                  string
  category                enum(private, semi_private, group, camp, full_day, half_day)
  durationMinutes         integer
  priceAmount             decimal
  currency                enum(USD, CAD)              -- inherits from Tenant
  maxCapacity             integer                     -- for group lessons
  skillLevels             enum[]                      -- which skill levels this lesson accepts
  instructorRequirements  json                        -- certifications required to teach this type
  upsells                 json                        -- e.g. equipment rental links
  meetingPoint            string, nullable            -- NEW: default meeting location for this lesson type (CRT-M-003)
  cancellationPolicyId    uuid, FK → CancellationPolicy, nullable  -- NEW: falls back to Tenant default if null (CRT-H-002)
  isActive                boolean
  createdAt               timestamp
```

**Notes:**
- `meetingPoint` is the default value propagated to `Booking.meetingPoint` at booking creation. The booking may override it.
- `cancellationPolicyId` is nullable; when null, the cancellation engine falls back to the `CancellationPolicy` with `isDefault = true` for the tenant.

---

### CancellationPolicy

A configurable refund rule set owned by a Tenant. Multiple policies may exist per tenant; one is flagged as default.

```
CancellationPolicy
  id                          uuid, PK                -- NEW entity (CRT-H-002)
  tenantId                    uuid, FK → Tenant
  name                        string                  -- e.g. "Standard Policy", "No-Refund Camp Policy"
  refundRules                 json                    -- ordered array of { hoursBeforeLesson: int, refundPercent: int (0-100) }
  noShowPolicy                enum(no_refund, partial_refund, full_refund)
  noShowRefundPercent         integer, nullable        -- only used when noShowPolicy = partial_refund; 0-100
  isDefault                   boolean, default false  -- at most one per tenant should be true; enforced at app layer
  createdAt                   timestamp
  updatedAt                   timestamp
```

**`refundRules` JSON schema (example):**
```json
[
  { "hoursBeforeLesson": 48, "refundPercent": 100 },
  { "hoursBeforeLesson": 24, "refundPercent": 50 },
  { "hoursBeforeLesson": 0,  "refundPercent": 0 }
]
```
Rules are evaluated in descending `hoursBeforeLesson` order. The first rule whose threshold the cancellation time satisfies determines the refund percentage.

**Notes:**
- A partial UNIQUE constraint on `(tenantId, isDefault)` WHERE `isDefault = true` is recommended to enforce at most one default per tenant.
- The inheritance chain is: `Booking.cancellationPolicyId` (snapshot at booking time) > `LessonType.cancellationPolicyId` > Tenant default `CancellationPolicy` where `isDefault = true`. The booking always carries a snapshot FK so the policy in effect at booking time is unambiguous even if the tenant later changes their default.

---

### Availability

Instructor availability slots. Used as inputs to the Booking Engine — does not represent a confirmed booking.

```
Availability
  id                  uuid, PK
  instructorId        uuid, FK → Instructor
  tenantId            uuid, FK → Tenant
  startAt             timestamp
  endAt               timestamp
  recurrence          text, nullable                  -- MODIFIED: was json; null for one-off, RRULE string (RFC 5545) for recurring (CRT-L-002)
  isBlocked           boolean                         -- true for blackout periods / overrides
  createdAt           timestamp
```

**Notes:**
- `recurrence` is now `text` (nullable). The application layer MUST validate RRULE strings on write using an RFC 5545-compliant library. Invalid RRULE values MUST be rejected at the API layer with a 422 response.

---

### SlotReservation

A time-limited soft hold on an instructor time slot, created when a guest reaches the checkout step. Prevents race-condition double-booking during the payment flow.

```
SlotReservation
  id                  uuid, PK                        -- NEW entity (CRT-H-001)
  tenantId            uuid, FK → Tenant
  instructorId        uuid, FK → Instructor
  lessonTypeId        uuid, FK → LessonType
  startAt             timestamp
  endAt               timestamp
  sessionToken        string                          -- opaque token tied to the checkout session; carried through the booking payload
  status              enum(active, released, expired, converted)
  expiresAt           timestamp                       -- typically now() + 10–30 minutes (TR-F-002)
  convertedBookingId  uuid, nullable                  -- FK → Booking; set when the hold becomes a confirmed booking
  createdAt           timestamp
```

**Notes:**
- The TTL MUST be enforced server-side (TR-NF-018). The recommended implementation is a Redis key expiring at `expiresAt` in addition to the database record. On expiry the status transitions to `expired` and the slot returns to available inventory.
- A background reconciliation job running at least every 5 minutes MUST sweep `SlotReservation WHERE status = active AND expiresAt < now()` and set `status = expired`.
- The `POST /api/v1/bookings` payload MUST include `reservationId` (the `SlotReservation.id`) and `sessionToken`. The booking engine validates both before committing.
- A unique partial index on `(instructorId, startAt, endAt)` WHERE `status = active` is strongly recommended to prevent duplicate active holds at the database layer.
- `status = released` is set on explicit abandonment (guest navigates away) or when the booking engine calls `DELETE /api/v1/slot-reservations/:id`.
- `status = converted` is set atomically when the booking is committed. `convertedBookingId` is populated at the same time.

---

### GuestCheckout

A lightweight guest record for bookings made without a full User / Household / Learner chain. Resolves CRT-H-003.

```
GuestCheckout
  id                  uuid, PK                        -- NEW entity (CRT-H-003)
  tenantId            uuid, FK → Tenant
  email               string
  phone               string, nullable                -- E.164 format
  firstName           string
  lastName            string
  preferredLanguage   enum(en, fr)
  createdAt           timestamp
```

**Notes:**
- A `GuestCheckout` record is created during guest checkout (UC-004) before payment is attempted.
- If the guest later creates an account with the same email address, the `GuestCheckout` records MAY be retroactively linked to the new `User` via a background process. This is a product decision — the schema supports it but does not require it.
- `GuestCheckout` carries no FK to `Household` or `Learner`. The booking references it directly.
- An `INDEX ON (tenantId, email)` is recommended for lookup during account conversion.

---

### GroupSession

A parent record grouping multiple individual Bookings under one instructor time block for group/camp/full-day lessons. Addresses CRT-H-005.

```
GroupSession
  id                  uuid, PK                        -- NEW entity (CRT-H-005)
  tenantId            uuid, FK → Tenant
  lessonTypeId        uuid, FK → LessonType
  instructorId        uuid, FK → Instructor
  startAt             timestamp
  endAt               timestamp
  maxCapacity         integer
  currentCapacity     integer, default 0              -- denormalised count; incremented/decremented atomically with Booking creation/cancellation
  status              enum(open, full, in_progress, completed, cancelled)
  meetingPoint        string, nullable
  cancelledAt         timestamp, nullable
  cancellationReason  string, nullable
  createdAt           timestamp
  updatedAt           timestamp
```

**Notes:**
- `currentCapacity` is a denormalised counter maintained atomically alongside Booking writes. The source of truth is the count of Bookings with `groupSessionId = this.id AND status NOT IN (cancelled, no_show)`, but the denormalised field enables O(1) capacity checks.
- When `currentCapacity >= maxCapacity`, the session status transitions to `full` and no further bookings are accepted.
- Each individual Booking references `GroupSession.id` via `Booking.groupSessionId` (nullable FK). For private lessons, this FK is null.
- `Payment` may reference a `GroupSession` directly when a single payment covers the full session (e.g., school purchases a group lesson block); individual learner Bookings may then have no direct Payment record. See `Payment` entity for the FK structure.

---

### Booking

A confirmed reservation. The authoritative record of a learner's lesson assignment.

```
Booking
  id                      uuid, PK
  tenantId                uuid, FK → Tenant
  learnerId               uuid, FK → Learner, nullable          -- MODIFIED: nullable to support guest checkout (CRT-H-003)
  guestCheckoutId         uuid, FK → GuestCheckout, nullable    -- NEW: set when learnerId is null (CRT-H-003)
  instructorId            uuid, FK → Instructor
  lessonTypeId            uuid, FK → LessonType
  groupSessionId          uuid, FK → GroupSession, nullable     -- NEW: set for group/camp/full-day lessons (CRT-H-005)
  softReservationId       uuid, FK → SlotReservation, nullable  -- NEW: cleared (set null) on booking confirmation (CRT-H-001)
  cancellationPolicyId    uuid, FK → CancellationPolicy         -- NEW: non-nullable snapshot of policy at booking time (CRT-H-002)
  startAt                 timestamp
  endAt                   timestamp
  status                  enum(confirmed, in_progress, completed, cancelled, no_show)
                                                                -- MODIFIED: removed waitlisted, added in_progress (CRT-H-009)
  skillLevelAtBooking     enum(beginner, intermediate, advanced) -- NEW: snapshot of skill level used at booking time (CRT-M-002)
  meetingPoint            string, nullable                      -- NEW: resolved from LessonType.meetingPoint at booking creation; overridable (CRT-M-003)
  checkedInAt             timestamp, nullable                   -- set when instructor checks in the student (TR-F-013)
  cancelledAt             timestamp, nullable
  cancellationReason      string, nullable
  createdAt               timestamp
  updatedAt               timestamp
```

**Removed from baseline:** `notes text` (replaced by `BookingNote` entity).

**CHECK constraints (application layer):**
- Either `learnerId IS NOT NULL` or `guestCheckoutId IS NOT NULL` — a booking must always have a learner reference.
- `learnerId IS NULL OR guestCheckoutId IS NULL` — these are mutually exclusive.
- `startAt < endAt`
- `cancellationPolicyId` is never null (enforced at booking creation by copying from `LessonType.cancellationPolicyId` or the tenant default).

**Notes on `status` transitions:**
```
confirmed   → in_progress   (instructor checks in student; TR-F-013)
in_progress → completed     (lesson ends; instructor marks complete)
confirmed   → cancelled     (guest or admin cancels; UC-008, UC-023)
in_progress → no_show       (instructor marks no-show after window; UC-018)
confirmed   → no_show       (instructor marks no-show without check-in)
```
`waitlisted` is no longer a valid booking status. Waitlisted students have a `WaitlistEntry` record only.

---

### BookingNote

A note attached to a booking by an instructor or admin. Replaces the single overloaded `Booking.notes text` field.

```
BookingNote
  id                  uuid, PK                        -- NEW entity (CRT-M-010)
  bookingId           uuid, FK → Booking
  authorId            uuid, FK → User
  authorRole          enum(instructor, admin)
  content             text
  isSharedWithGuest   boolean, default false          -- when true, visible in guest/household booking history
  createdAt           timestamp
  updatedAt           timestamp
```

**Notes:**
- The API MUST enforce visibility at the response layer: guest-facing endpoints return only `BookingNote` records where `isSharedWithGuest = true` for their own bookings.
- Instructors may only create notes on bookings assigned to them.
- Admins may create notes on any booking within their tenant.
- Notes are mutable (content may be edited) but not deletable by the instructor; only admins may delete notes.

---

### Payment

A financial transaction associated with one or more bookings.

```
Payment
  id                      uuid, PK
  tenantId                uuid, FK → Tenant
  householdId             uuid, FK → Household, nullable  -- MODIFIED: nullable to support guest checkout (CRT-H-003)
  guestCheckoutId         uuid, FK → GuestCheckout, nullable -- NEW: set when householdId is null (CRT-H-003)
  bookingId               uuid, FK → Booking, nullable    -- NEW: null only for group session payments (CRT-M-005)
  groupSessionId          uuid, FK → GroupSession, nullable -- NEW: set when payment covers a full group session (CRT-M-005)
  processor               enum(stripe, shift4)
  processorPaymentId      string                          -- Stripe PaymentIntent ID or Shift4 equivalent
  amountCents             integer                         -- CHECK: > 0
  currency                enum(USD, CAD)
  status                  enum(pending, captured, refunded, partially_refunded, failed)
  refundedAmountCents     integer, default 0              -- CHECK: <= amountCents
  platformFeeCents        integer                         -- 1.5% of transaction
  tipAmountCents          integer, nullable               -- NEW: only populated when Tenant.tipsEnabled = true (CRT-M-009)
  createdAt               timestamp
  updatedAt               timestamp
```

**CHECK constraints:**
- Either `householdId IS NOT NULL` or `guestCheckoutId IS NOT NULL`.
- Either `bookingId IS NOT NULL` or `groupSessionId IS NOT NULL` (a payment must reference a booking context).
- `refundedAmountCents <= amountCents`.
- `amountCents > 0`.
- `tipAmountCents IS NULL OR tipAmountCents >= 0`.

**Notes:**
- TR-DC-013 (a confirmed Booking must have exactly one Payment in `captured` status) is now enforceable: the Booking Engine queries `Payment WHERE bookingId = :id AND status = captured` to verify before returning success.
- For group session payments where a school purchases the session block, `bookingId` is null and `groupSessionId` is set. Individual learner Bookings within that group session may then have no associated Payment of their own.

---

### PaymentMethod

A stored card-on-file token. Raw card data is never stored.

```
PaymentMethod
  id                  uuid, PK
  householdId         uuid, FK → Household
  processor           enum(stripe, shift4)
  processorTokenId    string                          -- processor vault token, not a PAN
  last4               string
  brand               string                          -- visa, mastercard, etc.
  expiryMonth         integer
  expiryYear          integer
  isDefault           boolean
  isValid             boolean, default true           -- NEW: set false when tenant switches processor, invalidating orphaned tokens
  createdAt           timestamp
```

**Notes on `isValid`:**
- When an operator changes `Tenant.paymentProcessor`, all `PaymentMethod` records for that tenant MUST have `isValid` set to `false` atomically in the same transaction (CRT-H-007). Affected households receive a notification to re-add payment methods.
- Guest checkout card tokens are not stored as `PaymentMethod` records (TR-F-024); they are used for a single transaction only.

---

### WaitlistEntry

A student's position in a waitlist, either for a time slot or a specific instructor.

```
WaitlistEntry
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  learnerId           uuid, FK → Learner, nullable    -- MODIFIED: nullable for unauthenticated waitlist (CRT-H-003 / GAP-013)
  guestEmail          string, nullable                -- NEW: used when learnerId is null indexed for erasure tool lookup auto-purged after 90 days
  lessonTypeId        uuid, FK → LessonType
  mode                enum(time_slot, instructor)
  targetDate          date
  targetInstructorId  uuid, FK → Instructor, nullable -- null if mode = time_slot
  notifiedAt          timestamp, nullable             -- when the accept window opened
  expiresAt           timestamp, nullable             -- notifiedAt + Tenant.waitlistAcceptWindowMinutes
  status              enum(waiting, notified, accepted, expired)
  createdAt           timestamp
```

**CHECK constraints:**
- Either `learnerId IS NOT NULL` or `guestEmail IS NOT NULL`.
- `expiresAt > notifiedAt` (when both are non-null).
- `targetInstructorId IS NOT NULL` when `mode = instructor`.

---

### OAuthToken

Stores encrypted OAuth tokens for third-party calendar integrations per User.

```
OAuthToken
  id                  uuid, PK                        -- NEW entity (CRT-H-006)
  userId              uuid, FK → User
  provider            enum(google)                    -- extensible for future providers (Apple, Microsoft)
  accessToken         string, encrypted               -- application-layer encrypted; same KMS as paymentCredentials
  refreshToken        string, encrypted               -- application-layer encrypted
  scopes              string[]                        -- e.g. ["https://www.googleapis.com/auth/calendar.events"]
  expiresAt           timestamp                       -- access token expiry; refresh token has no fixed expiry
  createdAt           timestamp
  updatedAt           timestamp
  UNIQUE (userId, provider)
```

**Notes:**
- `accessToken` and `refreshToken` are encrypted at the application layer using the same KMS mechanism as `Tenant.paymentCredentials` (TR-NF-011). They MUST never be returned in API responses.
- Token refresh is handled transparently by the calendar sync service when `expiresAt < now()`.
- Revoking calendar sync from the instructor app MUST delete the `OAuthToken` record and call the provider's token revocation endpoint.

---

### WhiteLabelConfig

Per-Tenant branding and custom domain configuration. Required for the Enterprise-tier white-label feature.

```
WhiteLabelConfig
  id                      uuid, PK                    -- NEW entity (CRT-M-007)
  tenantId                uuid, FK → Tenant, unique   -- one config per tenant
  logoUrl                 string, nullable
  faviconUrl              string, nullable
  primaryColor            string, nullable             -- hex code e.g. "#1A73E8"
  secondaryColor          string, nullable             -- hex code
  fontFamily              string, nullable             -- CSS font-family string; falls back to platform default
  customDomain            string, nullable             -- e.g. "book.alpineresort.com"
  domainVerified          boolean, default false
  domainVerifiedAt        timestamp, nullable
  embedSnippet            text, nullable               -- generated iframe / JS snippet for embedding the booking widget
  embedCodeToken          string, nullable             -- token securing the widget embed against unauthorized use
  createdAt               timestamp
  updatedAt               timestamp
```

**Notes:**
- `customDomain` is nullable and not considered PII, but it may expose internal infrastructure if logged carelessly. It MUST be excluded from any debug-level logs that aggregate across tenants.
- `domainVerified` is set to `true` by the DNS polling job once the operator's CNAME record propagates (TR-F-067).
- White-label rendering MUST be gated on `Tenant.subscriptionTier = enterprise` at the API layer (TR-F-066).
- `embedCodeToken` is not a secret (it is embedded in public pages) but it provides a namespace for the operator's widget and can be rotated if the operator reports abuse.

---

### ApiKey

A hashed API key for operator-to-Slopebook external integrations.

```
ApiKey
  id                  uuid, PK                        -- NEW entity (CRT-M-008)
  tenantId            uuid, FK → Tenant
  label               string                          -- human-readable name e.g. "My POS Integration"
  keyHash             string                          -- bcrypt or Argon2id hash of the raw key; raw key shown only once at generation
  scopes              string[]                        -- e.g. ["bookings:read", "availability:read"]
  lastUsedAt          timestamp, nullable
  expiresAt           timestamp, nullable             -- null means no expiry
  isActive            boolean, default true
  createdAt           timestamp
  revokedAt           timestamp, nullable             -- set on rotation or explicit revocation
```

**Notes:**
- The raw key is generated as a cryptographically random string (minimum 32 bytes), shown to the operator exactly once, and never stored. Only the hash is persisted (TR-NF-015).
- Key rotation creates a new `ApiKey` record and immediately sets `isActive = false` on the old one (CRT-M-008 / TR-F-071). Revocation takes effect without cache delay.
- API gateway validates incoming keys by hashing the bearer token and comparing against `keyHash` WHERE `isActive = true AND (expiresAt IS NULL OR expiresAt > now())`.

---

### Webhook

An operator-configured webhook endpoint for receiving Slopebook event notifications.

```
Webhook
  id                  uuid, PK                        -- NEW entity (CRT-M-008)
  tenantId            uuid, FK → Tenant
  url                 string, encrypted               -- destination URL; encrypted at rest to prevent data exposure in logs
  events              string[]                        -- e.g. ["booking.confirmed", "booking.cancelled", "waitlist.promoted"]
  signingSecret       string, encrypted               -- HMAC secret used to sign outbound payloads; encrypted at rest
  isActive            boolean, default true
  lastDeliveredAt     timestamp, nullable
  failureCount        integer, default 0              -- consecutive delivery failures; used to auto-deactivate after threshold
  createdAt           timestamp
  updatedAt           timestamp
```

**Notes:**
- `url` is encrypted at rest because it may reveal internal infrastructure or contain embedded auth tokens.
- `signingSecret` is encrypted at rest. The raw secret is shown to the operator once at creation and on rotation.
- `failureCount` is reset to 0 on each successful delivery. After a configurable threshold (e.g., 10 consecutive failures) the webhook is auto-deactivated and the operator is notified.
- The delivery system appends an `X-Slopebook-Signature` header (HMAC-SHA256 of the payload using `signingSecret`) to each outbound request.

---

### AuditLog

Central log of all administrative actions, financial events, and exception workflows.

```
AuditLog
  id                  uuid, PK
  tenantId            uuid, FK → Tenant, nullable     -- null for platform-level events
  actorId             uuid, FK → User, nullable        -- MODIFIED: nullable for system-generated events (CRT-L-005)
  actorType           enum(user, system)               -- NEW: distinguishes human from system actor (CRT-L-005)
  action              string                           -- e.g. "booking.cancelled", "refund.issued", "waitlist.expiry_sweep"
  targetType          string                           -- e.g. "Booking", "Payment"
  targetId            uuid, nullable                   -- nullable for bulk or system-wide events
  metadata            json                             -- before/after state, job name for system events, etc.
  createdAt           timestamp
```

**Notes:**
- `actorId` is null when `actorType = system`. `metadata` MUST include the job name or service name for system events.
- AuditLog records are immutable (TR-NF-023, TR-DC-018). No UPDATE or DELETE is permitted. A database-level trigger or row-security policy MUST enforce this.
- All mutating operations on `Booking`, `Payment`, `Instructor`, `Learner`, and `LessonType` MUST produce an `AuditLog` record (TR-NF-013), committed in the same transaction.

---

## 3. Key Relationships (Updated Diagram)

```
Tenant
  ├── many InstructorTenant (join)
  │     └── Instructor (many-to-many via InstructorTenant)
  │           ├── many Certification
  │           ├── many WorkdayHandoff
  │           └── User (one-to-one)
  │                 └── OAuthToken (one per provider)
  ├── many LessonType
  │     └── CancellationPolicy (optional override FK)
  ├── many CancellationPolicy (one flagged isDefault)
  ├── WhiteLabelConfig (one-to-one, nullable)
  ├── many ApiKey
  ├── many Webhook
  ├── many Availability (via Instructor)
  ├── many GroupSession
  │     └── many Booking (groupSessionId FK)
  │     └── many Payment (groupSessionId FK, for session-level payment)
  ├── many Household
  │     └── User (owner — Head of Household)
  │     └── many Learner
  │           └── many Booking (learnerId FK)
  │                 ├── many BookingNote
  │                 ├── SlotReservation (softReservationId FK, cleared on confirm)
  │                 ├── CancellationPolicy (cancellationPolicyId FK — snapshot)
  │                 └── Payment (bookingId FK)
  │     └── many PaymentMethod
  │     └── many Payment (householdId FK)
  ├── many GuestCheckout
  │     └── many Booking (guestCheckoutId FK)
  │     └── many Payment (guestCheckoutId FK)
  ├── many SlotReservation
  ├── many WaitlistEntry
  └── many AuditLog
```

**Cross-cutting FKs (not shown inline above for clarity):**

- `Booking.instructorId` → `Instructor`
- `Booking.lessonTypeId` → `LessonType`
- `WaitlistEntry.targetInstructorId` → `Instructor` (nullable)
- `WaitlistEntry.learnerId` → `Learner` (nullable)
- `GroupSession.instructorId` → `Instructor`
- `GroupSession.lessonTypeId` → `LessonType`
- `WorkdayHandoff.tenantId` → `Tenant`
- `Certification.instructorId` → `Instructor`
- `OAuthToken.userId` → `User`
- `BookingNote.authorId` → `User`
- `SlotReservation.instructorId` → `Instructor`
- `SlotReservation.lessonTypeId` → `LessonType`
- `SlotReservation.convertedBookingId` → `Booking` (nullable)

---

## 4. Multi-Tenancy Notes

### Standard Tenant Scoping

Every entity except `User` (platform-level admins have `tenantId = null`) and `Instructor` (now tenantless at the entity level, tenant membership via `InstructorTenant`) carries a `tenantId`. All queries at the application layer MUST include tenant scoping derived from the authenticated JWT claims.

### Freelance Instructor Model

An instructor who works at multiple resorts has:
- A single `User` record with `tenantId = null` (or the primary tenant's ID for instructors who started at one resort and later added a second).
- A single `Instructor` record with no `tenantId` field.
- One `InstructorTenant` row per resort they work at, each with its own `onboardingStatus` and `workdayHandoffAt`.

**Authorization rules for multi-tenant instructors:**
- The JWT MUST carry the `tenantId` of the active session context. When an instructor logs in they select (or are prompted to select) which tenant context they are operating in.
- An `X-Tenant-Context` header (or equivalent session parameter) determines which tenant's data is visible within a given session.
- Availability records carry `tenantId` so an instructor's schedule at Resort A is invisible to Resort B even via the instructor's own account.
- Earnings are calculated per `tenantId` scope. The instructor earnings endpoint MUST accept a `tenantId` query parameter, restricted to tenants where the instructor has an `InstructorTenant` row with `onboardingStatus = approved`.

**Single-tenant instructors** continue to work exactly as before. The `InstructorTenant` join table has a single row for them and the application handles them identically to multi-tenant instructors — the logic path is the same, the result set is just a single row.

### Guest Checkout and Tenant Scoping

`GuestCheckout` records carry `tenantId`. A guest who books at two different resorts produces two separate `GuestCheckout` records (one per tenant). This maintains strict tenant isolation even for unauthenticated flows.

### Cross-Tenant Leakage Prevention

TR-DC-011 (all queries on tenant-scoped tables MUST include a `tenantId` filter from the JWT) still applies. The affected table list now includes: `Booking`, `Learner`, `Instructor` (via `InstructorTenant.tenantId`), `LessonType`, `Availability`, `WaitlistEntry`, `Payment`, `AuditLog`, `GuestCheckout`, `GroupSession`, `SlotReservation`, `CancellationPolicy`, `WhiteLabelConfig`, `ApiKey`, `Webhook`, `WorkdayHandoff`.

---

## 5. Encryption & PCI Scope (Updated)

### Fields Encrypted at Application Layer

| Entity | Field | Mechanism | Notes |
|---|---|---|---|
| `Tenant` | `paymentCredentials` | KMS (AES-256-GCM) | Processor API keys. Never returned in API responses. (existing) |
| `OAuthToken` | `accessToken` | KMS (AES-256-GCM) | Google Calendar access token. (CRT-H-006) |
| `OAuthToken` | `refreshToken` | KMS (AES-256-GCM) | Google Calendar refresh token. Must survive access token rotation. (CRT-H-006) |
| `Webhook` | `url` | KMS (AES-256-GCM) | May contain embedded auth tokens or reveal internal infrastructure. (CRT-M-008) |
| `Webhook` | `signingSecret` | KMS (AES-256-GCM) | HMAC secret for outbound payload signing. Shown once at creation. (CRT-M-008) |
| `ApiKey` | `keyHash` | Argon2id (one-way) | Not reversible — this is a hash, not symmetric encryption. Raw key never stored. (CRT-M-008, TR-NF-015) |

**KMS requirements (all symmetric fields):**
- Encryption key stored in a KMS (AWS KMS, GCP Cloud KMS, or HashiCorp Vault), NOT co-located with the database.
- Key rotation MUST be supported without downtime (in-place re-encryption with envelope key versioning).
- Encrypted values MUST include the key version identifier to support rotation (TR-NF-011).

### PCI Scope

The PCI DSS scope reduction strategy from the baseline is preserved and extended:

- Raw PANs MUST never be stored, logged, or transmitted through Slopebook servers (TR-F-019, TR-NF-012).
- `PaymentMethod.processorTokenId` stores only the processor vault token. It is not encrypted at the application layer (it is a non-sensitive identifier that is useless without the corresponding processor credentials) but is protected by database-level access controls.
- `Tenant.paymentCredentials` (processor API keys) is the highest-sensitivity field in the system. It is encrypted at rest AND excluded from all API responses AND covered by an explicit KMS rotation policy.
- The `ApiKey.keyHash` field is a one-way Argon2id hash and is safe to log (it cannot be reversed to recover the raw key).

### `WhiteLabelConfig.customDomain` Considerations

`customDomain` is not PII and does not require application-layer encryption. However:
- It MUST NOT appear in aggregate cross-tenant debug logs (it reveals customer identity).
- DNS verification polling responses MUST be rate-limited to prevent enumeration of customer domains.
- The `embedCodeToken` is a public value (it appears in embed snippets on public sites) and MUST NOT be treated as a secret.

### `User.phone` PII Considerations

`User.phone` is PII and is subject to CASL / GDPR obligations:
- It MUST NOT be returned in API responses except to the account owner.
- It MUST be included in any GDPR/CASL data-export feature (deferred to v1.5).
- It MUST be zeroed or pseudonymised as part of any account deletion flow.

---

## 6. Migration Notes

The following table summarises data migrations required to move from the baseline `data-model.md` schema to this proposed schema. Each entry notes the risk level and whether the migration can run online (zero-downtime with a rolling deploy) or requires a maintenance window.

---

### M-001: Make `Booking.learnerId` Nullable; Add `guestCheckoutId`

**What:** Add `guestCheckoutId uuid FK → GuestCheckout` (nullable) to `Booking`. Alter `learnerId` from NOT NULL to NULL. Add CHECK constraint ensuring at least one of the two is non-null.

**Risk:** LOW. Existing rows all have a `learnerId` and null `guestCheckoutId`, satisfying the CHECK constraint. The column becomes nullable — no existing data changes.

**Online / Maintenance Window:** Online (zero-downtime). Apply with a non-blocking `ALTER TABLE ... ALTER COLUMN learnerId DROP NOT NULL` followed by `ALTER TABLE ... ADD COLUMN guestCheckoutId uuid REFERENCES guest_checkouts(id)`. The CHECK constraint can be added as `NOT VALID` initially and validated in a background pass.

---

### M-002: Create `InstructorTenant`; Remove `tenantId`, `onboardingStatus`, `workdayHandoffAt` from `Instructor`

**What:** (a) Create the `instructor_tenants` join table. (b) Backfill one row per existing `Instructor` using `Instructor.tenantId` and `Instructor.onboardingStatus`. (c) Drop `tenantId`, `onboardingStatus`, and `workdayHandoffAt` columns from `Instructor`.

**Risk:** HIGH. This is a breaking change. Any application code or query joining `Instructor.tenantId` directly will break. All such queries MUST be updated before the column drop.

**Online / Maintenance Window:** Partially online via a phased approach:
1. **Phase 1 (online):** Create `instructor_tenants` table. Backfill from existing `Instructor` data. Deploy application code that reads from `instructor_tenants` (dual-read from both old and new).
2. **Phase 2 (online):** Deploy code that writes to `instructor_tenants` exclusively and no longer writes to `Instructor.tenantId` / `onboardingStatus`.
3. **Phase 3 (maintenance window, brief):** Drop old columns from `Instructor` once all code paths have been migrated and verified.

**Recommendation:** Do this migration before Alpha data accumulates. Post-Alpha, backfilling becomes riskier.

---

### M-003: Create `Certification`; Remove `Instructor.certifications json`

**What:** (a) Create `certifications` table. (b) For each existing `Instructor`, parse `certifications json` and insert one row per certification object. (c) Drop `Instructor.certifications` column.

**Risk:** MEDIUM. The JSON blob has no enforced schema; parsing may encounter malformed data. A validation pass on all existing `certifications` values should run before migration.

**Online / Maintenance Window:** Partially online. Same phased approach as M-002: create table → backfill → dual-read → drop column.

**Pre-migration action required:** Audit all existing `Instructor.certifications` JSON values for conformance to the `{ type, level, expiresAt }` structure before backfilling.

---

### M-004: Create `WorkdayHandoff`; Remove `Instructor.workdayHandoffAt`

**What:** (a) Create `workday_handoffs` table. (b) For each `Instructor` where `workdayHandoffAt IS NOT NULL`, insert one `WorkdayHandoff` row with `handoffAt = Instructor.workdayHandoffAt` and `status = delivered` (we cannot know the period retroactively so `periodStart` and `periodEnd` may be null for historical rows). (c) Drop `Instructor.workdayHandoffAt`.

**Risk:** LOW for the migration itself. Historical rows will have null `periodStart`/`periodEnd` — this is acceptable; only future handoffs capture the full period data.

**Online / Maintenance Window:** Online (zero-downtime).

---

### M-005: Alter `Booking.status` Enum — Remove `waitlisted`, Add `in_progress`

**What:** Add `in_progress` to the `Booking.status` enum. Remove `waitlisted`.

**Risk:** MEDIUM. If any existing `Booking` rows have `status = waitlisted` they must be migrated before the value is dropped. Audit the data: any `status = waitlisted` bookings are structurally incorrect per the critique and should be reviewed — either converted to `WaitlistEntry` records or deleted.

**Online / Maintenance Window:** Adding `in_progress` to the enum is online (PostgreSQL `ALTER TYPE ... ADD VALUE` is non-blocking). Removing `waitlisted` requires checking that no rows use the value, then removing from the enum — this may require a brief lock or a full enum rebuild depending on the database engine.

**Pre-migration action required:** `SELECT COUNT(*) FROM bookings WHERE status = 'waitlisted'`. If > 0, manually review and remediate before dropping the value.

---

### M-006: Replace `Booking.notes text` with `BookingNote` Entity

**What:** (a) Create `booking_notes` table. (b) For each `Booking` where `notes IS NOT NULL AND notes != ''`, insert one `BookingNote` row with `authorRole = instructor`, `isSharedWithGuest = false`, and `content = Booking.notes`. (c) Drop `Booking.notes`.

**Risk:** LOW. Loss of authorship information for historical notes (we do not know which user wrote the original `notes` field). This is acceptable — historical notes are migrated with a synthetic `authorId` (the platform system user or the instructor assigned to the booking).

**Online / Maintenance Window:** Online (zero-downtime, phased).

---

### M-007: Alter `Availability.recurrence` from `json` to `text`

**What:** Change the column type from `json`/`jsonb` to `text`. Existing values stored as JSON strings that happen to contain RRULE text must be unwrapped.

**Risk:** MEDIUM. If any existing `recurrence` values are stored as JSON objects (not plain RRULE strings), the unwrapping logic must be handled carefully. Audit first.

**Online / Maintenance Window:** Online. Use a `ADD COLUMN recurrence_text text` approach: copy values with unwrapping logic, switch application code to read/write the new column, then drop the old column.

---

### M-008: Make `Payment.householdId` Nullable; Add `guestCheckoutId` and `bookingId`

**What:** (a) Alter `householdId` to nullable. (b) Add `guestCheckoutId uuid FK → GuestCheckout` (nullable). (c) Add `bookingId uuid FK → Booking` (nullable). (d) Add `groupSessionId uuid FK → GroupSession` (nullable).

**Risk:** LOW for nullability change (all existing rows have a `householdId`). MEDIUM for backfilling `bookingId`: there is currently no FK from `Payment` to `Booking`, so the mapping must be inferred from application-level knowledge (e.g., time correlation, `processorPaymentId` matching booking records). This backfill may require manual review for edge cases.

**Online / Maintenance Window:** Adding nullable columns and making `householdId` nullable are online operations. The `bookingId` backfill should be done in a separate offline script with human review of any unresolvable rows.

---

### M-009: Alter `AuditLog` — Make `actorId` Nullable; Add `actorType`

**What:** (a) Alter `actorId` to nullable. (b) Add `actorType enum(user, system)` with default `user`. (c) Backfill `actorType = user` for all existing rows (all existing rows were human-initiated).

**Risk:** LOW. Purely additive change with a safe backfill.

**Online / Maintenance Window:** Online (zero-downtime).

---

### M-010: Alter `WaitlistEntry.learnerId` to Nullable; Add `guestEmail`

**What:** (a) Make `learnerId` nullable. (b) Add `guestEmail string` (nullable). (c) Add CHECK ensuring at least one is non-null.

**Risk:** LOW. All existing rows have a `learnerId`, satisfying the CHECK constraint.

**Online / Maintenance Window:** Online (zero-downtime).

---

### M-011: Add `isValid` to `PaymentMethod`

**What:** Add `isValid boolean, default true` to `PaymentMethod`. Backfill all existing rows to `true`.

**Risk:** LOW.

**Online / Maintenance Window:** Online (zero-downtime).

---

### Migration Sequencing Recommendation

The following order minimises risk and inter-migration dependencies:

1. M-009 (`AuditLog` actorType — purely additive, safe first)
2. M-011 (`PaymentMethod.isValid` — purely additive)
3. M-001 (`Booking.learnerId` nullable + `guestCheckoutId`)
4. M-010 (`WaitlistEntry.learnerId` nullable + `guestEmail`)
5. M-008 (`Payment` nullable householdId + new FKs)
6. M-006 (`BookingNote` extraction — must follow M-001 since `BookingNote.bookingId` FK is required)
7. M-007 (`Availability.recurrence` type change)
8. M-003 (`Certification` extraction — parallel to M-002)
9. M-004 (`WorkdayHandoff` extraction — parallel to M-002)
10. M-002 (`InstructorTenant` — most complex, should be last among schema changes, coordinated with application code deployment)
11. M-005 (`Booking.status` enum change — after application code is updated to handle `in_progress`)

All new entities (`SlotReservation`, `GuestCheckout`, `GroupSession`, `CancellationPolicy`, `OAuthToken`, `WhiteLabelConfig`, `ApiKey`, `Webhook`) are purely additive table creations and can be applied at any point in the sequence as online migrations without risk.

---

*End of Slopebook Proposed Data Model v0.2*
