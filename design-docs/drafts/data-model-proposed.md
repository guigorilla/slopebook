# Slopebook — Proposed Data Model

**Document Status:** Draft
**Last Updated:** 2026-03-26
**Author:** Data-Modeler Agent
**Version:** 0.3 (proposed revision of `design-docs/data-model.md` v0.2)
**Based On:**
- `design-docs/data-model.md` v0.2
- `design-docs/drafts/use-cases.md` (Run 3, 2026-03-26)
- `design-docs/drafts/tech-requirements.md` (Run 3, 2026-03-26)
- `design-docs/drafts/critique.md` (Run 3, 2026-03-26)

---

## 0. What Changed From v0.2 to v0.3

This section enumerates all changes from the v0.2 baseline. Each entry references the critique item, tech-requirement schema-change (SC-xxx), or gap item that motivates it.

### Critical Fixes Applied (from critique.md)

| Critique | Change Applied |
|---|---|
| CR-001 | `OAuthToken` entity removed. Replaced with DEFERRED-001 callout. |
| CR-002 | `Payment.groupSessionId` removed. `bookingId` CHECK relaxed to accommodate `package_purchase` payments. DEFERRED-002 callout added. |
| CR-003 | Added `InstructorRating`, `LessonPackage`, `LessonPackageTemplate`, `PackageRedemption`. Added `Instructor.ratingAvg`, `Instructor.ratingCount`. Added `Payment.paymentType`. Added `Booking.lessonPackageId`. |
| CR-004 | Added `Tenant.paymentModel`. |
| CR-008 | Added `rejected` to `InstructorTenant.onboardingStatus` enum. |
| CR-011 | Removed duplicate `paymentCredentials` field from `Tenant`. |

### Schema Changes Applied (from tech-requirements.md)

| SC-ID | Change Applied |
|---|---|
| SC-001 | Added `Instructor.ratingAvg decimal(3,2) nullable`. |
| SC-002 | Added `Instructor.ratingCount integer default 0`. |
| SC-003 | Added `InstructorRating` entity. |
| SC-004 | Added `LessonPackageTemplate` entity. |
| SC-005 | Added `LessonPackage` entity. |
| SC-006 | Added `PackageRedemption` entity. |
| SC-007 | Added `Payment.paymentType enum(standard, package_purchase, tip) default standard`. |
| SC-008 | Added `Learner.waiverToken string nullable`. |
| SC-009 | Added `Learner.waiverStatus enum(not_required, pending, signed, expired) nullable`. |
| SC-010 | Added `Learner.parentalConsentGiven boolean default false` (OQ-032 pending — schema reserved). |
| SC-011 | Added `Learner.parentalConsentAt timestamp nullable` (OQ-032 pending — schema reserved). |
| SC-012 | Added `GroupSession.instructorStudentRatio integer nullable`. |
| SC-013 | Added `LessonType.instructorStudentRatio integer nullable`. |
| SC-014 | Added `Tenant.paymentModel enum(direct_merchant, platform_mid) nullable`. |
| SC-015 | Replaced `Certification.alertSentAt` with `alert60SentAt`, `alert30SentAt`, `alert7SentAt`. |
| SC-016 | Added `Booking.lessonPackageId uuid FK → LessonPackage, nullable`. |
| SC-017 | Added `rejected` to `InstructorTenant.onboardingStatus` enum. |
| SC-018 | Added `GroupSessionInstructor` join table. Renamed `GroupSession.instructorId` to `GroupSession.leadInstructorId`. |
| SC-019 | Renamed `GroupSession.currentCapacity` to `GroupSession.currentEnrollment`. |

### New Entities (v0.3 additions beyond v0.2)

| Entity | Motivation |
|---|---|
| `InstructorRating` | CR-003 / SC-003 / TR-010 |
| `LessonPackageTemplate` | CR-003 / SC-004 / TR-017 |
| `LessonPackage` | CR-003 / SC-005 / TR-017 |
| `PackageRedemption` | CR-003 / SC-006 / TR-018 |
| `GroupSessionInstructor` | GAP-F / SC-018 / TR-020 |

### Removed Entities (v0.3)

| Entity | Reason |
|---|---|
| `OAuthToken` | CR-001 — OQ-021 deferred Google Calendar sync to v1.5 |

### Removed Fields (v0.3)

| Entity | Field Removed | Replacement | Motivation |
|---|---|---|---|
| `Tenant` | `paymentCredentials` (duplicate line) | Single annotated instance retained | CR-011 |
| `Payment` | `groupSessionId` | DEFERRED-002 (OQ-031 unresolved) | CR-002 |
| `GroupSession` | `instructorId` | `GroupSession.leadInstructorId` + `GroupSessionInstructor` join table | SC-018 / GAP-F |
| `GroupSession` | `currentCapacity` | `GroupSession.currentEnrollment` (rename) | SC-019 |
| `Certification` | `alertSentAt` | `alert60SentAt`, `alert30SentAt`, `alert7SentAt` | SC-015 / GAP-E |

---

## 1. Full Proposed Data Model

Every entity is listed in full. Fields carried unchanged from v0.2 are preserved exactly. New or modified fields are annotated with `-- ADDED`, `-- MODIFIED`, or `-- CHANGED`. Removed fields are omitted (see Section 0).

---

### Tenant

Represents a resort or ski school. The top-level isolation boundary for all data.

```
Tenant
  id                            uuid, PK
  name                          string
  slug                          string, unique
  currency                      enum(USD, CAD)
  defaultLanguage               enum(en, fr)
  paymentProcessor              enum(stripe, shift4)
  paymentCredentials            encrypted json              -- CHANGED: duplicate removed (CR-011); processor API keys, never exposed in UI
  paymentModel                  enum(direct_merchant, platform_mid), nullable
                                                            -- ADDED: Shift4 dual-routing model; null for Stripe tenants; required for Payment Service routing predicate (CR-004 / SC-014 / OQ-005 / OQ-024)
  subscriptionTier              enum(starter, growth, pro, enterprise)
  waitlistAcceptWindowMinutes   integer, default 120        -- configurable accept window; range 30 min–48 hr (CRT-H-010 / OQ-009)
  tipsEnabled                   boolean, default false      -- gates tip selector in checkout and tip Payment records (CRT-M-009)
  createdAt                     timestamp
  updatedAt                     timestamp
```

**Notes:**
- `paymentModel` is meaningful only when `paymentProcessor = shift4`. For Stripe tenants it MUST be null. `direct_merchant` = tenant has their own Shift4 MID; `platform_mid` = transactions route through the platform MID.
- Starter-tier tenants MUST have `paymentProcessor = stripe`. Shift4 is blocked at the API layer for Starter tier (OQ-024).
- The duplicate `paymentCredentials` line present in v0.2 has been removed (CR-011). Only one instance exists.

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
  phone               string, nullable                 -- E.164 format (CRT-L-006)
  phoneVerified       boolean, default false           -- set true after OTP verification (CRT-L-006)
  emailOptOut         boolean, default false           -- CASL / CAN-SPAM marketing suppression; transactional booking emails are still sent (CRT-M-001)
  smsOptOut           boolean, default false           -- all SMS suppressed when true (CRT-M-001)
  createdAt           timestamp
  updatedAt           timestamp
```

**Notes:**
- `phone` stores E.164 format (e.g., `+14155552671`). MUST NOT be returned in API responses beyond the account owner's own record.
- `emailOptOut` suppresses marketing-adjacent emails only. Booking confirmation emails are sent regardless.

---

### Household

An adult account that manages reservations for multiple learners. Owned by one User.

```
Household
  id          uuid, PK
  tenantId    uuid, FK → Tenant
  ownerId     uuid, FK → User
  createdAt   timestamp
  updatedAt   timestamp                           -- ADDED: all entities must carry updatedAt
```

**Notes:**
- A `Household` is created automatically when a new authenticated user registers (TR-005). No separate API call.

---

### Learner

A sub-profile within a household. May be a minor who cannot log in independently.

```
Learner
  id                    uuid, PK
  householdId           uuid, FK → Household
  firstName             string
  lastName              string
  dateOfBirth           date
  skillLevel            enum(beginner, intermediate, advanced)
  notes                 text                              -- medical notes, equipment notes; internal only
  waiverSignedAt        timestamp, nullable               -- timestamp of waiver acceptance (TR-F-077 / OQ-008)
  waiverVersion         string, nullable                  -- version string of waiver document signed
  waiverToken           string, nullable                  -- ADDED: Smartwaiver document token returned by provider API on signing (SC-008 / TR-022 / OQ-029); enables right-to-erasure Smartwaiver document deletion
  waiverStatus          enum(not_required, pending, signed, expired), nullable
                                                          -- ADDED: current waiver state driving check-in gate logic (SC-009 / TR-022 / GAP-D); null until first waiver interaction
  parentalConsentGiven  boolean, default false            -- ADDED: OQ-032 PENDING — schema reserved for under-18 consent; must not be surfaced in UI until OQ-032 resolves; ERASURE-EXEMPT (SC-010 / TR-011)
  parentalConsentAt     timestamp, nullable               -- ADDED: OQ-032 PENDING — timestamp of parental consent; ERASURE-EXEMPT (SC-011 / TR-011)
  createdAt             timestamp
  updatedAt             timestamp                         -- ADDED: all entities must carry updatedAt
```

**Notes:**
- `waiverStatus` drives the check-in gate in the instructor PWA. If `waiverStatus NOT IN (signed, not_required)`, the Smartwaiver embed is presented. `not_required` is the default for learners in jurisdictions where waivers are not mandated.
- `parentalConsentGiven` and `parentalConsentAt` are **erasure-exempt** — they constitute a legal consent record. The right-to-erasure tool MUST explicitly exclude these fields from pseudonymisation when OQ-032 is resolved and the fields are activated.
- Minimum learner age is 5 years (OQ-007), enforced at the application layer.

---

### Instructor

A coach profile. Linked to a User account. Multi-tenancy managed through `InstructorTenant`.

```
Instructor
  id              uuid, PK
  userId          uuid, FK → User
  bioEn           text
  bioFr           text
  photoUrl        string
  languagesSpoken string[]
  ratingAvg       decimal(3,2), nullable          -- ADDED: denormalised average of all InstructorRating.rating values; null when ratingCount = 0 (SC-001 / CR-003 / TR-002)
  ratingCount     integer, default 0              -- ADDED: denormalised count of InstructorRating records (SC-002 / CR-003 / TR-002)
  createdAt       timestamp
  updatedAt       timestamp
```

**Removed from baseline (done in v0.2):** `tenantId`, `certifications json`, `onboardingStatus`, `workdayHandoffAt`.

**Notes:**
- `ratingAvg` and `ratingCount` MUST be updated atomically in the same DB transaction as the `InstructorRating` write.
- `ratingAvg` is null when `ratingCount = 0`. Booking widget must handle null gracefully.
- Ratings are internal-only (OQ-028). Visible to guests browsing within the tenant. Not exposed via public search-indexed endpoints.

---

### InstructorTenant

Join table enabling many-to-many relationship between Instructor and Tenant.

```
InstructorTenant
  instructorId      uuid, FK → Instructor
  tenantId          uuid, FK → Tenant
  onboardingStatus  enum(pending, approved, rejected, inactive)
                                                  -- MODIFIED: added 'rejected' (CR-008 / SC-017 / TR-036)
                                                  -- Transitions: pending→approved, pending→rejected, rejected→pending (resubmission), approved→inactive
  workdayHandoffAt  timestamp, nullable            -- lightweight last-handoff reference; full history in WorkdayHandoff
  createdAt         timestamp
  updatedAt         timestamp                     -- ADDED: all entities must carry updatedAt
  PRIMARY KEY       (instructorId, tenantId)
```

**Notes:**
- `rejected` is required for the UC-036 onboarding resubmission path (CR-008). Without it, rejected profiles have no distinct state separate from voluntary inactivation.
- An instructor is bookable only when `onboardingStatus = approved` for the active tenant.

---

### InstructorRating

A post-lesson star rating submitted by a guest or household member. Individual records are internal-only.

```
InstructorRating
  id            uuid, PK
  tenantId      uuid, FK → Tenant
  instructorId  uuid, FK → Instructor
  bookingId     uuid, FK → Booking, UNIQUE         -- ADDED entity (CR-003 / SC-003 / TR-010 / UC-010); one rating per booking enforced at DB layer
  submittedBy   uuid, FK → User, nullable          -- null for guest-checkout submission (one-time review token path)
  rating        integer                            -- CHECK: rating BETWEEN 1 AND 5
  reviewToken   string, nullable                   -- single-use token from post-lesson email for guest-checkout users; invalidated on first use
  createdAt     timestamp
```

**Notes:**
- The UNIQUE constraint on `bookingId` enforces one rating per booking.
- `submittedBy` is nullable for guest-checkout users who access the review form via `reviewToken`.
- `reviewToken` MUST be invalidated on first use to prevent replay.
- Only `platform_admin` can delete or moderate ratings. `school_admin` has no moderation capability (OQ-028).
- `Instructor.ratingAvg` and `Instructor.ratingCount` MUST be updated atomically in the same transaction as this record's creation.
- Recommended: `INDEX ON (instructorId, tenantId)` for the instructor browse query.

---

### Certification

Normalised instructor certification record.

```
Certification
  id              uuid, PK
  instructorId    uuid, FK → Instructor
  body            enum(PSIA, CSIA)
  level           integer                         -- e.g. 1, 2, 3 for PSIA levels
  issuedAt        date, nullable
  expiresAt       date
  alert60SentAt   timestamp, nullable             -- MODIFIED: replaces alertSentAt; set when 60-day expiry alert is dispatched (SC-015 / GAP-E / TR-031)
  alert30SentAt   timestamp, nullable             -- ADDED: set when 30-day expiry alert is dispatched (SC-015 / GAP-E / TR-031)
  alert7SentAt    timestamp, nullable             -- ADDED: set when 7-day expiry alert is dispatched (SC-015 / GAP-E / TR-031)
  documentUrl     string, nullable                -- scanned cert upload
  createdAt       timestamp
  updatedAt       timestamp
```

**Notes:**
- `alertSentAt` (single field from v0.2) is **replaced** by three threshold fields. A single field cannot represent three-threshold re-alert behaviour required by TR-031.
- Background job query pattern per threshold: `WHERE expiresAt <= now() + N AND alert[N]SentAt IS NULL`.
- Alerts MUST be dispatched to admins of all tenants where the instructor has `onboardingStatus = approved`.
- Recommended indexes: `(instructorId, expiresAt)`, `(expiresAt, alert60SentAt)`, `(expiresAt, alert30SentAt)`, `(expiresAt, alert7SentAt)`.

---

### WorkdayHandoff

Full payroll handoff history per instructor per tenant.

```
WorkdayHandoff
  id                    uuid, PK
  instructorId          uuid, FK → Instructor
  tenantId              uuid, FK → Tenant
  handoffAt             timestamp
  periodStart           date
  periodEnd             date
  status                enum(pending, delivered, failed)
  earningsSnapshotJson  json                              -- immutable after creation; captures earnings state at handoff time
  createdAt             timestamp
```

**Notes:**
- No `updatedAt` — this record is intentionally immutable. Failed handoffs are retried by creating a new record.

---

### LessonType

A configurable product in the lesson catalog. Owned by a Tenant.

```
LessonType
  id                      uuid, PK
  tenantId                uuid, FK → Tenant
  nameEn                  string
  nameFr                  string
  descriptionEn           text, nullable
  descriptionFr           text, nullable
  category                enum(private, semi_private, group, camp, full_day, half_day)
  durationMinutes         integer
  priceAmountCents        integer                         -- MODIFIED: renamed from priceAmount; stored as integer cents, never floats (multi-currency rule); CHECK: > 0
  currency                enum(USD, CAD)                  -- inherits from Tenant.currency
  maxCapacity             integer                         -- for group lessons; use 1 for private
  skillLevels             enum[]                          -- accepted skill levels; values: beginner, intermediate, advanced
  instructorRequirements  json                            -- certifications required to teach this type
  instructorStudentRatio  integer, nullable               -- ADDED: max students per instructor for group lessons (SC-013 / TR-033 / GAP-006); null for private/semi-private
  upsells                 json                            -- e.g. equipment rental links
  meetingPoint            string, nullable                -- default meeting location; propagated to Booking.meetingPoint at creation (CRT-M-003)
  cancellationPolicyId    uuid, FK → CancellationPolicy, nullable  -- falls back to tenant default when null (CRT-H-002)
  isActive                boolean
  createdAt               timestamp
  updatedAt               timestamp
```

**Notes:**
- `priceAmountCents` replaces `priceAmount decimal`. All monetary amounts in this schema are integers in cents.
- The three-level hierarchy for effective `instructorStudentRatio`: per-session override (`GroupSession.instructorStudentRatio`) → `LessonType.instructorStudentRatio` → platform default (application config).

---

### LessonPackageTemplate

A configurable package offering defined by a school admin. Guests purchase from templates.

```
LessonPackageTemplate
  id                uuid, PK                            -- ADDED entity (CR-003 / SC-004 / TR-017 / UC-017)
  tenantId          uuid, FK → Tenant
  nameEn            string
  nameFr            string
  lessonTypeId      uuid, FK → LessonType               -- package applies to this lesson type
  lessonCount       integer                             -- lessons included; CHECK: > 0
  priceAmountCents  integer                             -- total purchase price in cents; CHECK: > 0
  currency          enum(USD, CAD)                      -- inherits from Tenant.currency
  validityDays      integer                             -- days from purchase before expiry; CHECK: > 0
  isActive          boolean, default true
  createdAt         timestamp
  updatedAt         timestamp
```

**Notes:**
- Admin CRUD endpoints for templates (`POST/PATCH/DELETE /api/v1/lesson-package-templates`) are not yet in `api-design.md`. See GAP-G in critique.md — tech-lead must add them before Beta.

---

### LessonPackage

An active lesson package owned by a household, created on purchase.

```
LessonPackage
  id                  uuid, PK                          -- ADDED entity (CR-003 / SC-005 / TR-017 / UC-017)
  tenantId            uuid, FK → Tenant
  householdId         uuid, FK → Household
  packageTemplateId   uuid, FK → LessonPackageTemplate
  remainingCount      integer                           -- CHECK: >= 0; decremented per redemption; use SELECT FOR UPDATE to prevent race on last credit
  status              enum(active, exhausted, expired)
  purchasedAt         timestamp
  expiresAt           timestamp                         -- = purchasedAt + template.validityDays; admin may extend via PATCH (UC-032)
  paymentId           uuid, FK → Payment                -- the purchase payment record (paymentType = package_purchase)
  createdAt           timestamp
  updatedAt           timestamp
```

**Notes:**
- `remainingCount` decrement and `status → exhausted` transition MUST be atomic within the booking + `PackageRedemption` creation transaction. Use `SELECT FOR UPDATE` on this row.
- Credits are forfeited on expiry (OQ-025). Admin extension via UC-032 is the only exception path.
- Recommended: `INDEX ON (tenantId, householdId, status, expiresAt)` for redemption eligibility checks.

---

### PackageRedemption

Links a lesson booking to the `LessonPackage` credit it redeemed.

```
PackageRedemption
  id                uuid, PK                            -- ADDED entity (CR-003 / SC-006 / TR-018 / UC-018)
  tenantId          uuid, FK → Tenant
  lessonPackageId   uuid, FK → LessonPackage
  bookingId         uuid, FK → Booking, UNIQUE          -- one redemption per booking; UNIQUE at DB layer
  redeemedAt        timestamp
  createdAt         timestamp
```

**Notes:**
- UNIQUE on `bookingId` prevents a booking from being redeemed against multiple packages.
- **Open product question (EC-008):** if a package-redeemed booking is cancelled, is the credit reinstated? This is unresolved. The schema supports both paths (reinstate by incrementing `remainingCount` and voiding this record; or forfeit by leaving this record intact). Product Lead must decide before Beta.

---

### CancellationPolicy

A configurable refund rule set owned by a Tenant.

```
CancellationPolicy
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  name                  string
  refundRules           json                            -- ordered array: [{ hoursBeforeLesson: int, refundPercent: int (0-100) }]
  noShowPolicy          enum(no_refund, partial_refund, full_refund)
  noShowRefundPercent   integer, nullable               -- only when noShowPolicy = partial_refund; CHECK: BETWEEN 0 AND 100
  isDefault             boolean, default false          -- at most one per tenant; PARTIAL UNIQUE INDEX recommended: (tenantId, isDefault) WHERE isDefault = true
  createdAt             timestamp
  updatedAt             timestamp
```

**Notes:**
- `refundRules` evaluated in descending `hoursBeforeLesson` order. First matching threshold determines refund percentage.
- For package-redeemed bookings with no cash to refund, product must define how `refundPercent` applies. See EC-008 in critique.md.

---

### Availability

Instructor availability slots. Input to the Booking Engine.

```
Availability
  id            uuid, PK
  instructorId  uuid, FK → Instructor
  tenantId      uuid, FK → Tenant
  startAt       timestamp
  endAt         timestamp
  recurrence    text, nullable                          -- MODIFIED (v0.2): was json; null = one-off; RFC 5545 RRULE string for recurring; validated on write (CRT-L-002)
  isBlocked     boolean                                 -- true for blackout periods / overrides
  createdAt     timestamp
  updatedAt     timestamp                               -- ADDED: all entities must carry updatedAt
```

**Notes:**
- Invalid RRULE values MUST be rejected at the API layer with HTTP 422.
- `Availability.tenantId` ensures instructor schedule at Resort A is invisible to Resort B.
- Recommended: `INDEX ON (tenantId, instructorId, startAt, endAt)`.

---

### SlotReservation

A time-limited soft hold on an instructor time slot created when a guest reaches checkout.

```
SlotReservation
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  instructorId        uuid, FK → Instructor
  lessonTypeId        uuid, FK → LessonType
  startAt             timestamp
  endAt               timestamp
  sessionToken        string                            -- opaque cryptographically random token; carried in booking payload (OQ-023)
  status              enum(active, released, expired, converted)
  expiresAt           timestamp                         -- = now() + 15 minutes (platform constant, OQ-011; NOT configurable per tenant)
  convertedBookingId  uuid, nullable                    -- FK → Booking; set atomically when hold becomes a confirmed booking
  createdAt           timestamp
```

**Notes:**
- Active `SlotReservation` records MUST be excluded from `GET /api/v1/availability` slot results (UA-004 in critique.md — explicitly stated here to prevent silent engineering omission).
- Recommended: UNIQUE partial index on `(instructorId, startAt, endAt) WHERE status = active`.
- Background sweep runs at minimum every 5 minutes to expire stale holds.

---

### GuestCheckout

Lightweight guest record for bookings made without a User / Household / Learner chain.

```
GuestCheckout
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  email               string
  phone               string, nullable                  -- E.164 format
  firstName           string
  lastName            string
  preferredLanguage   enum(en, fr)
  createdAt           timestamp
  updatedAt           timestamp                         -- ADDED: all entities must carry updatedAt
```

**Notes:**
- A guest booking at two resorts produces two separate `GuestCheckout` records (one per tenant) — strict tenant isolation even for unauthenticated flows.
- Right-to-erasure (OQ-026): `firstName`, `lastName`, `email`, `phone` pseudonymised to `"ERASED"`. All other fields retained. `Payment.guestCheckoutId` FK set to null.
- Recommended: `INDEX ON (tenantId, email)` for erasure tool lookup and optional account-conversion matching.

---

### GroupSession

A parent record grouping multiple individual Bookings under one instructor time block.

```
GroupSession
  id                      uuid, PK
  tenantId                uuid, FK → Tenant
  lessonTypeId            uuid, FK → LessonType
  leadInstructorId        uuid, FK → Instructor         -- MODIFIED: renamed from instructorId (SC-018 / GAP-F); additional instructors in GroupSessionInstructor
  startAt                 timestamp
  endAt                   timestamp
  maxCapacity             integer
  instructorStudentRatio  integer, nullable             -- ADDED: per-session ratio override; overrides LessonType.instructorStudentRatio (SC-012 / TR-019 / GAP-006)
  currentEnrollment       integer, default 0            -- MODIFIED: renamed from currentCapacity (SC-019 / TR-019); denormalised; incremented/decremented atomically with Booking writes
  status                  enum(open, full, in_progress, completed, cancelled)
  meetingPoint            string, nullable
  cancelledAt             timestamp, nullable
  cancellationReason      string, nullable
  createdAt               timestamp
  updatedAt               timestamp
```

**Notes:**
- `currentEnrollment` replaces `currentCapacity` for alignment with use-cases.md and tech-requirements.md terminology.
- `leadInstructorId` is the primary instructor. Additional instructors are in `GroupSessionInstructor`.
- When `currentEnrollment >= maxCapacity`, status transitions to `full`.
- Session-level cancellation (`status = cancelled`) MUST trigger notifications to all enrolled learners and should cascade cancellation of child `Booking` records (EC-007 in critique.md — application-layer concern).
- **DEFERRED-002:** `Payment.groupSessionId` is NOT present. School-block billing deferred until OQ-031 resolves (CR-002). Per-learner billing via individual `Booking` → `Payment` is the only supported path.

---

### GroupSessionInstructor

Join table enabling multiple instructors per group session.

```
GroupSessionInstructor
  groupSessionId    uuid, FK → GroupSession             -- ADDED entity (GAP-F / SC-018 / TR-020)
  instructorId      uuid, FK → Instructor
  role              enum(lead, support)                 -- 'lead' mirrors GroupSession.leadInstructorId for query convenience; 'support' for additional instructors
  assignedAt        timestamp
  createdAt         timestamp
  PRIMARY KEY       (groupSessionId, instructorId)
```

**Notes:**
- The `lead` row MUST match `GroupSession.leadInstructorId`. Both representations are maintained so a single query can list all instructors for a session.
- Recommended: `INDEX ON (instructorId)` for cross-session instructor lookup and cross-tenant double-booking detection.
- Endpoint: `POST /api/v1/group-sessions/:id/instructors` assigns additional support instructors (TR-020).

---

### Booking

A confirmed reservation. The authoritative record of a learner's lesson assignment.

```
Booking
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  learnerId             uuid, FK → Learner, nullable           -- nullable for guest checkout (CRT-H-003)
  guestCheckoutId       uuid, FK → GuestCheckout, nullable     -- set when learnerId is null (CRT-H-003)
  instructorId          uuid, FK → Instructor
  lessonTypeId          uuid, FK → LessonType
  groupSessionId        uuid, FK → GroupSession, nullable      -- set for group/camp/full-day lessons (CRT-H-005)
  softReservationId     uuid, FK → SlotReservation, nullable   -- cleared (set null) on booking confirmation (CRT-H-001)
  cancellationPolicyId  uuid, FK → CancellationPolicy          -- non-nullable snapshot at booking time (CRT-H-002)
  lessonPackageId       uuid, FK → LessonPackage, nullable     -- ADDED: set when booking redeems a package credit (SC-016 / TR-018 / CR-003)
  startAt               timestamp
  endAt                 timestamp
  status                enum(confirmed, in_progress, completed, cancelled, no_show)
                                                               -- MODIFIED (v0.2): removed waitlisted; added in_progress (CRT-H-009)
  skillLevelAtBooking   enum(beginner, intermediate, advanced) -- snapshot of skill level at booking time (CRT-M-002)
  meetingPoint          string, nullable                       -- resolved from LessonType.meetingPoint at creation; overridable (CRT-M-003)
  checkedInAt           timestamp, nullable                    -- set on PATCH /api/v1/bookings/:id/checkin (TR-022 / UC-022)
  cancelledAt           timestamp, nullable
  cancellationReason    string, nullable                       -- weather cancellations use value "weather" per TR-029; no additional enum value added
  createdAt             timestamp
  updatedAt             timestamp
```

**Removed from v0.2:** `notes text` (replaced by `BookingNote` entity). `status = waitlisted` removed from enum.

**CHECK constraints (application layer):**
- `learnerId IS NOT NULL OR guestCheckoutId IS NOT NULL` — a booking must always have a learner reference.
- `learnerId IS NULL OR guestCheckoutId IS NULL` — mutually exclusive.
- `startAt < endAt`.
- `cancellationPolicyId` is never null.

**Status transitions:**
```
confirmed   → in_progress   (instructor checks in student; PATCH /api/v1/bookings/:id/checkin)
in_progress → completed     (lesson ends; instructor marks complete)
confirmed   → cancelled     (guest or admin cancels; UC-008, UC-028)
in_progress → no_show       (instructor marks no-show after window; UC-023)
confirmed   → no_show       (instructor marks no-show without check-in)
```

**Notes:**
- When `lessonPackageId IS NOT NULL`, no `Payment` record for the lesson itself is created (fee was captured at package purchase). A `PackageRedemption` record is also created.
- `softReservationId` is cleared (set to null) atomically when the booking is confirmed and `SlotReservation.status` transitions to `converted`.

---

### BookingNote

A note attached to a booking by an instructor, admin, or the system.

```
BookingNote
  id                uuid, PK
  bookingId         uuid, FK → Booking
  authorId          uuid, FK → User
  authorRole        enum(instructor, admin, system)   -- MODIFIED: added 'system' for typed-name waiver fallback (TR-022 / UC-022)
  content           text
  isSharedWithGuest boolean, default false            -- when true, visible in guest/household booking history
  createdAt         timestamp
  updatedAt         timestamp
```

**Notes:**
- `authorRole = system` is used when the typed-name waiver fallback fires (mountain wireless loss). The typed name is stored as a system `BookingNote` with `isSharedWithGuest = false` (TR-022).
- Guest-facing endpoints MUST filter to `isSharedWithGuest = true` at the API response layer — not only in the UI.
- Instructors may create notes only on their own assigned bookings and may not delete them.
- Only `school_admin` and `platform_admin` may delete notes.
- Right-to-erasure (OQ-026): FK to erased record replaced with `ERASED_GUEST` placeholder; content retained. Notes older than 2 years auto-purged.

---

### Payment

A financial transaction associated with a booking, package purchase, or standalone tip.

```
Payment
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  householdId           uuid, FK → Household, nullable       -- nullable for guest checkout (CRT-H-003)
  guestCheckoutId       uuid, FK → GuestCheckout, nullable   -- set when householdId is null (CRT-H-003)
  bookingId             uuid, FK → Booking, nullable         -- MODIFIED: null only for paymentType = package_purchase (CR-002 fix)
  paymentType           enum(standard, package_purchase, tip), default standard
                                                             -- ADDED: distinguishes lesson payment, package purchase, tip charge (SC-007 / CR-003)
  processor             enum(stripe, shift4)
  processorPaymentId    string                               -- Stripe PaymentIntent ID or Shift4 equivalent
  amountCents           integer                              -- CHECK: > 0; all monetary amounts in cents
  currency              enum(USD, CAD)
  status                enum(pending, captured, refunded, partially_refunded, failed)
  refundedAmountCents   integer, default 0                   -- CHECK: <= amountCents
  platformFeeCents      integer                              -- 1.5% of amountCents for standard and package_purchase; 0 for paymentType = tip (OQ-027); CHECK: >= 0
  tipAmountCents        integer, nullable                    -- populated on paymentType = tip payments; Tenant.tipsEnabled must be true; CHECK: >= 0
  createdAt             timestamp
  updatedAt             timestamp
```

**REMOVED from v0.2:** `groupSessionId uuid FK → GroupSession` — removed per CR-002 (OQ-031 unresolved; DEFERRED-002).

**CHECK constraints:**
- `householdId IS NOT NULL OR guestCheckoutId IS NOT NULL` — payment must always have an owner.
- `bookingId IS NOT NULL OR paymentType = 'package_purchase'` — payments must reference a booking UNLESS they are a package purchase. This replaces the v0.2 CHECK that required `bookingId OR groupSessionId`, which rejected valid package purchases (CR-002).
- `refundedAmountCents <= amountCents`.
- `amountCents > 0`.
- `tipAmountCents IS NULL OR tipAmountCents >= 0`.
- `platformFeeCents >= 0`.
- `paymentType = 'tip' implies platformFeeCents = 0` — enforced at application layer (OQ-027).

**Notes:**
- `paymentType = standard`: individual lesson bookings. `paymentType = package_purchase`: `bookingId` is null. `paymentType = tip`: `bookingId` references the completed booking.
- A confirmed `Booking` (non-package) MUST have exactly one `Payment` in `captured` status.
- A booking with `lessonPackageId IS NOT NULL` has no associated lesson-level `Payment`.

**PCI Scope:** Raw PANs MUST NEVER appear here. `processorPaymentId` is a non-sensitive processor reference.

---

### PaymentMethod

A stored card-on-file token. Raw card data is never stored.

```
PaymentMethod
  id                uuid, PK
  householdId       uuid, FK → Household
  processor         enum(stripe, shift4)
  processorTokenId  string                              -- processor vault token; NOT a PAN
  last4             string
  brand             string                              -- visa, mastercard, amex, etc.
  expiryMonth       integer
  expiryYear        integer
  isDefault         boolean
  isValid           boolean, default true               -- set false on processor switch (CRT-H-007)
  createdAt         timestamp
  updatedAt         timestamp                           -- ADDED: all entities must carry updatedAt
```

**Notes:**
- When `Tenant.paymentProcessor` is changed, ALL `PaymentMethod` records for the tenant MUST have `isValid = false` set atomically in the same transaction. Affected households notified.
- Guest checkout card tokens are single-use and never stored as `PaymentMethod` records.

**PCI Scope:** `processorTokenId` is a vault token, not a PAN. Maintained under SAQ A-EP scope.

---

### WaitlistEntry

A student's position in a waitlist for a time slot or specific instructor.

```
WaitlistEntry
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  learnerId             uuid, FK → Learner, nullable      -- nullable for unauthenticated waitlist (CRT-H-003 / GAP-013)
  guestEmail            string, nullable                  -- used when learnerId is null; indexed for erasure tool; auto-purged 90 days after accepted/expired
  lessonTypeId          uuid, FK → LessonType
  mode                  enum(time_slot, instructor)
  targetDate            date
  targetInstructorId    uuid, FK → Instructor, nullable   -- null if mode = time_slot
  position              integer                           -- ADDED: queue ordering position (EC-003 / critique.md); assigned at creation; stable (not renumbered on removal)
  notifiedAt            timestamp, nullable               -- when the accept window opened
  expiresAt             timestamp, nullable               -- = notifiedAt + Tenant.waitlistAcceptWindowMinutes; set when notifiedAt is set
  status                enum(waiting, notified, accepted, expired)
  createdAt             timestamp
  updatedAt             timestamp                         -- ADDED: all entities must carry updatedAt
```

**ADDED field: `position integer`**
- Required to resolve EC-003 in critique.md: the promotion ordering algorithm ("by position, then by registration time") referenced a field that did not exist in the schema.
- Assigned at creation as `MAX(position) + 1` within scope `(tenantId, lessonTypeId, targetDate, mode, targetInstructorId)`.
- Promotion: `ORDER BY position ASC` within same scope where `status = waiting`.

**CHECK constraints:**
- `learnerId IS NOT NULL OR guestEmail IS NOT NULL`.
- `expiresAt > notifiedAt` when both non-null.
- `targetInstructorId IS NOT NULL` when `mode = instructor`.

---

### WhiteLabelConfig

Per-Tenant branding and custom domain configuration. Enterprise tier only.

```
WhiteLabelConfig
  id                  uuid, PK
  tenantId            uuid, FK → Tenant, UNIQUE          -- one config per tenant
  logoUrl             string, nullable
  faviconUrl          string, nullable
  primaryColor        string, nullable                    -- CSS hex code e.g. "#1A73E8"
  secondaryColor      string, nullable
  fontFamily          string, nullable                    -- CSS font-family string
  customDomain        string, nullable                    -- must be globally unique across all tenants
  domainVerified      boolean, default false
  domainVerifiedAt    timestamp, nullable
  embedSnippet        text, nullable                      -- generated iframe / JS snippet
  embedCodeToken      string, nullable                    -- public namespace token; not a secret; can be rotated on abuse report
  createdAt           timestamp
  updatedAt           timestamp
```

**Notes:**
- White-label rendering gated on `Tenant.subscriptionTier = enterprise` at the API layer.
- `customDomain` must be validated as globally unique across all `WhiteLabelConfig` records to prevent domain hijacking.
- `embedCodeToken` is public (appears in embed snippets on resort websites). Must NOT be treated as a secret.

---

### ApiKey

A hashed API key for operator-to-Slopebook external integrations.

```
ApiKey
  id            uuid, PK
  tenantId      uuid, FK → Tenant
  label         string
  keyHash       string                                    -- Argon2id hash of raw key; raw key shown once only; safe to log (TR-NF-015)
  scopes        string[]                                  -- e.g. ["bookings:read", "availability:read"]
  lastUsedAt    timestamp, nullable
  expiresAt     timestamp, nullable                       -- null = no expiry
  isActive      boolean, default true
  createdAt     timestamp
  revokedAt     timestamp, nullable
```

**Notes:**
- Raw key generated as a cryptographically random string (minimum 32 bytes), shown once, never stored.
- Key rotation: new `ApiKey` record created, old record's `isActive` set to false immediately.

---

### Webhook

An operator-configured webhook endpoint.

```
Webhook
  id                uuid, PK
  tenantId          uuid, FK → Tenant
  url               string, encrypted                     -- KMS-encrypted; may contain embedded auth tokens
  events            string[]                              -- e.g. ["booking.confirmed", "booking.cancelled", "waitlist.promoted", "lesson.completed"]
  signingSecret     string, encrypted                     -- KMS-encrypted HMAC-SHA256 secret; shown once at creation
  isActive          boolean, default true
  lastDeliveredAt   timestamp, nullable
  failureCount      integer, default 0                    -- consecutive failures; reset on success; auto-deactivates after 10 failures (TR-042)
  createdAt         timestamp
  updatedAt         timestamp
```

**Notes:**
- Retry/backoff: exponential schedule — 1 min, 5 min, 15 min, 30 min, 1 hr, 2 hr. Auto-deactivation at 10 consecutive failures with operator notification (TR-042).
- `lesson.completed` event must be added to `api-design.md`'s Notification Service event catalogue (GAP-012 in critique.md).
- Outbound requests carry `X-Slopebook-Signature` (HMAC-SHA256 of payload using `signingSecret`).

---

### AuditLog

Central immutable log of all administrative actions, financial events, and system workflows.

```
AuditLog
  id          uuid, PK
  tenantId    uuid, FK → Tenant, nullable   -- null for platform-level events
  actorId     uuid, FK → User, nullable     -- MODIFIED (v0.2): nullable for system events (CRT-L-005); stores User.id only, never raw email
  actorType   enum(user, system)            -- ADDED (v0.2): distinguishes human from system actor (CRT-L-005)
  action      string                        -- e.g. "booking.cancelled", "refund.issued", "lesson_package.expiry_extended"
  targetType  string                        -- e.g. "Booking", "Payment", "LessonPackage"
  targetId    uuid, nullable                -- nullable for bulk or system-wide events
  metadata    json                          -- before/after state; job/service name for system events; reason for admin overrides
  createdAt   timestamp
```

**Notes:**
- **Immutable.** No `UPDATE` or `DELETE` is permitted. Enforce via DB-level row-security policy or `REVOKE UPDATE, DELETE` grants (TR-NF-023, TR-DC-018).
- No `updatedAt` — intentional for immutable records.
- `actorId` stores `User.id` only, never raw email addresses (OQ-026 — logs retained up to 3 years).
- All mutating operations on `Booking`, `Payment`, `Instructor`, `Learner`, `LessonPackage`, and `LessonType` MUST produce an `AuditLog` record in the same transaction (TR-NF-013).

---

### ~~OAuthToken~~ — DEFERRED-001

**This entity has been removed from the v1.0 data model.**

Google Calendar sync was deferred to v1.5 per OQ-021. The `OAuthToken` entity MUST NOT be created in any v1.0 Prisma migration. No v1.0 code paths should reference this entity.

When v1.5 Google Calendar sync is scoped, reinstate the entity with fields: `id (uuid PK)`, `userId (FK → User)`, `provider (enum: google)`, `accessToken (string, KMS-encrypted)`, `refreshToken (string, KMS-encrypted)`, `scopes (string[])`, `expiresAt (timestamp)`, `createdAt (timestamp)`, `updatedAt (timestamp)`, `UNIQUE (userId, provider)`.

---

## 2. Key Relationships (Updated Diagram)

```
Tenant
  ├── many InstructorTenant (join)
  │     └── Instructor (many-to-many via InstructorTenant)
  │           ├── many Certification
  │           ├── many WorkdayHandoff
  │           ├── many InstructorRating (via bookings)
  │           └── User (one-to-one via userId)
  ├── many LessonType
  │     ├── CancellationPolicy (optional override FK)
  │     └── LessonPackageTemplate (many, scoped to this lesson type)
  ├── many CancellationPolicy (one flagged isDefault)
  ├── WhiteLabelConfig (one-to-one via UNIQUE FK, nullable)
  ├── many ApiKey
  ├── many Webhook
  ├── many Availability (via Instructor + tenantId)
  ├── many GroupSession
  │     ├── GroupSessionInstructor (join; additional instructors)
  │     └── many Booking (groupSessionId FK)
  ├── many Household
  │     ├── User (owner — Head of Household)
  │     ├── many Learner
  │     │     └── many Booking (learnerId FK)
  │     │           ├── many BookingNote
  │     │           ├── SlotReservation (softReservationId FK, cleared on confirm)
  │     │           ├── CancellationPolicy (cancellationPolicyId FK — snapshot)
  │     │           ├── Payment (bookingId FK, paymentType = standard | tip)
  │     │           ├── LessonPackage (lessonPackageId FK, nullable)
  │     │           │     └── PackageRedemption (bookingId FK)
  │     │           └── InstructorRating (bookingId FK, one-to-one)
  │     ├── many PaymentMethod
  │     ├── many Payment (householdId FK; includes standard, package_purchase, tip)
  │     └── many LessonPackage (householdId FK)
  │           └── Payment (paymentId FK; paymentType = package_purchase)
  ├── many GuestCheckout
  │     ├── many Booking (guestCheckoutId FK)
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
- `GroupSession.leadInstructorId` → `Instructor`
- `GroupSession.lessonTypeId` → `LessonType`
- `GroupSessionInstructor.instructorId` → `Instructor`
- `WorkdayHandoff.tenantId` → `Tenant`
- `Certification.instructorId` → `Instructor`
- `InstructorRating.instructorId` → `Instructor`
- `InstructorRating.bookingId` → `Booking` (UNIQUE)
- `InstructorRating.submittedBy` → `User` (nullable)
- `BookingNote.authorId` → `User`
- `SlotReservation.instructorId` → `Instructor`
- `SlotReservation.lessonTypeId` → `LessonType`
- `SlotReservation.convertedBookingId` → `Booking` (nullable)
- `LessonPackageTemplate.lessonTypeId` → `LessonType`
- `LessonPackage.packageTemplateId` → `LessonPackageTemplate`
- `LessonPackage.paymentId` → `Payment`
- `PackageRedemption.lessonPackageId` → `LessonPackage`
- `PackageRedemption.bookingId` → `Booking` (UNIQUE)

---

## 3. Multi-Tenancy Notes

### Standard Tenant Scoping

Every entity except `User` (platform admins have `tenantId = null`) and `Instructor` (tenantless; membership via `InstructorTenant`) carries a `tenantId`. All queries MUST include tenant scoping from the authenticated JWT claims. `tenantId` MUST NEVER be accepted as a raw client query parameter.

**Full list of tenant-scoped tables (updated):** `Booking`, `Learner`, `Instructor` (via `InstructorTenant.tenantId`), `LessonType`, `LessonPackageTemplate`, `LessonPackage`, `PackageRedemption`, `Availability`, `WaitlistEntry`, `Payment`, `AuditLog`, `GuestCheckout`, `GroupSession`, `GroupSessionInstructor` (via parent `GroupSession.tenantId`), `SlotReservation`, `CancellationPolicy`, `WhiteLabelConfig`, `ApiKey`, `Webhook`, `WorkdayHandoff`, `InstructorRating`.

### Freelance Instructor Multi-Tenant Model

A freelance instructor approved at multiple resorts has:
- A single `User` record (`tenantId = null` or primary tenant ID).
- A single `Instructor` record with no `tenantId`.
- One `InstructorTenant` row per resort.

**Cross-tenant double-booking risk (SC-C / EC-010 in critique.md):** The booking engine's conflict check is JWT-scoped to one tenant. A freelance instructor can be double-booked simultaneously at two resorts. This threatens the `< 0.5% double-booking rate` KPI. The `GroupSessionInstructor` index on `instructorId` supports a cross-tenant query, but the application architecture must be designed to perform this check at the platform level (not within a single tenant JWT). **Flag for tech-lead:** cross-tenant availability conflict check is required for multi-tenant instructors before Beta.

### `SlotReservation` and Availability Inventory

Active `SlotReservation` records (where `status = active AND expiresAt > now()`) MUST be subtracted from available inventory when responding to `GET /api/v1/availability`. This is an application-layer rule stated here explicitly (UA-004 in critique.md) to prevent silent engineering omission.

---

## 4. Encryption & PCI Scope

### Fields Encrypted at Application Layer

| Entity | Field | Mechanism | Notes |
|---|---|---|---|
| `Tenant` | `paymentCredentials` | KMS (AES-256-GCM) | Processor API keys. Never returned in any API response. Access-logged on every read. |
| `Webhook` | `url` | KMS (AES-256-GCM) | May contain embedded auth tokens or reveal internal infrastructure. |
| `Webhook` | `signingSecret` | KMS (AES-256-GCM) | HMAC secret. Shown once at creation. |
| `ApiKey` | `keyHash` | Argon2id (one-way hash) | Not reversible. Safe to log. Raw key never stored. |

**REMOVED from v0.2 encryption table:** `OAuthToken.accessToken`, `OAuthToken.refreshToken` — entity removed (DEFERRED-001 / CR-001).

**KMS requirements:** Encryption key in external KMS (AWS KMS, GCP Cloud KMS, or HashiCorp Vault). Key rotation without downtime via envelope key versioning with key version ID embedded in encrypted values.

### PCI Scope

- Raw PANs MUST NEVER be stored, logged, or transmitted through Slopebook servers.
- `PaymentMethod.processorTokenId` is a vault token, not a PAN. Not encrypted at application layer but protected by DB-level access controls.
- Slopebook maintains SAQ A-EP scope via processor tokenisation.

### PII Considerations

| Entity | Field | Sensitivity | Notes |
|---|---|---|---|
| `User` | `phone` | PII | E.164. Not returned except to account owner. Zeroed on account deletion. |
| `User` | `email` | PII | GDPR/PIPEDA. |
| `GuestCheckout` | `firstName`, `lastName`, `email`, `phone` | PII | Pseudonymisable to `"ERASED"` on right-to-erasure (OQ-026). |
| `Learner` | `firstName`, `lastName`, `dateOfBirth` | PII (minor) | Enhanced protection. |
| `Learner` | `parentalConsentGiven`, `parentalConsentAt` | Legal Record | **Erasure-exempt.** Must not be pseudonymised. |
| `WaitlistEntry` | `guestEmail` | PII | Full record deletion on erasure. Auto-purged 90 days post-accepted/expired. |
| `WhiteLabelConfig` | `customDomain` | Operational | Reveals customer identity. Must not appear in aggregate cross-tenant debug logs. |

---

## Change Summary

Every change from v0.2 to v0.3, with motivating source.

| # | Entity | Change | Motivation |
|---|---|---|---|
| 1 | `Tenant` | Added `paymentModel enum(direct_merchant, platform_mid) nullable` | CR-004 / SC-014 / OQ-005 / OQ-024 — Shift4 routing predicate requires this field |
| 2 | `Tenant` | Removed duplicate `paymentCredentials` field | CR-011 — duplicate causes migration failure |
| 3 | `Household` | Added `updatedAt timestamp` | Platform-wide rule: all entities carry `createdAt` + `updatedAt` |
| 4 | `Learner` | Added `waiverToken string nullable` | SC-008 / TR-022 — Smartwaiver token for check-in gate and right-to-erasure document deletion |
| 5 | `Learner` | Added `waiverStatus enum nullable` | SC-009 / TR-022 / GAP-D — check-in gate logic requires queryable waiver state |
| 6 | `Learner` | Added `parentalConsentGiven boolean default false` | SC-010 / OQ-032 — schema reserved; erasure-exempt; NOT surfaced in UI until OQ-032 resolves |
| 7 | `Learner` | Added `parentalConsentAt timestamp nullable` | SC-011 / OQ-032 — schema reserved; erasure-exempt |
| 8 | `Learner` | Added `updatedAt timestamp` | Platform-wide rule |
| 9 | `Instructor` | Added `ratingAvg decimal(3,2) nullable` | CR-003 / SC-001 / TR-002 — denormalised aggregate for instructor browse |
| 10 | `Instructor` | Added `ratingCount integer default 0` | CR-003 / SC-002 / TR-002 — denormalised count for instructor browse |
| 11 | `InstructorTenant` | Added `rejected` to `onboardingStatus` enum | CR-008 / SC-017 / TR-036 — rejection state required for UC-036 resubmission path |
| 12 | `InstructorTenant` | Added `updatedAt timestamp` | Platform-wide rule |
| 13 | `InstructorRating` | New entity | CR-003 / SC-003 / TR-010 / UC-010 — post-lesson rating |
| 14 | `Certification` | Replaced `alertSentAt` with `alert60SentAt`, `alert30SentAt`, `alert7SentAt` | GAP-E / SC-015 / TR-031 — three-threshold re-alert requires three fields |
| 15 | `LessonType` | Renamed `priceAmount decimal` to `priceAmountCents integer` | Platform-wide rule — monetary amounts in integer cents |
| 16 | `LessonType` | Added `instructorStudentRatio integer nullable` | SC-013 / TR-033 / GAP-006 / UC-019 — group lesson ratio |
| 17 | `LessonPackageTemplate` | New entity | CR-003 / SC-004 / TR-017 / UC-017 |
| 18 | `LessonPackage` | New entity | CR-003 / SC-005 / TR-017 / UC-017 |
| 19 | `PackageRedemption` | New entity | CR-003 / SC-006 / TR-018 / UC-018 |
| 20 | `Availability` | Added `updatedAt timestamp` | Platform-wide rule |
| 21 | `GroupSession` | Renamed `instructorId` to `leadInstructorId` | SC-018 / GAP-F / TR-020 — additional instructors now in `GroupSessionInstructor` |
| 22 | `GroupSession` | Renamed `currentCapacity` to `currentEnrollment` | SC-019 / TR-019 — align with use-cases.md terminology |
| 23 | `GroupSession` | Added `instructorStudentRatio integer nullable` | SC-012 / TR-019 / GAP-006 — per-session ratio override |
| 24 | `GroupSessionInstructor` | New entity | GAP-F / SC-018 / TR-020 — multi-instructor group sessions |
| 25 | `Booking` | Added `lessonPackageId uuid FK nullable` | CR-003 / SC-016 / TR-018 — package credit redemption link |
| 26 | `BookingNote` | Added `system` to `authorRole` enum | TR-022 — typed-name waiver fallback stored as system note |
| 27 | `Payment` | Removed `groupSessionId` FK | CR-002 / OQ-031 — OQ-031 unresolved; DEFERRED-002 |
| 28 | `Payment` | Added `paymentType enum(standard, package_purchase, tip) default standard` | CR-003 / SC-007 / TR-010 / TR-017 |
| 29 | `Payment` | Updated `bookingId` CHECK logic | CR-002 — old CHECK rejected valid `package_purchase` payments; new CHECK: `bookingId IS NOT NULL OR paymentType = 'package_purchase'` |
| 30 | `PaymentMethod` | Added `updatedAt timestamp` | Platform-wide rule |
| 31 | `WaitlistEntry` | Added `position integer` | EC-003 / critique.md — promotion ordering required a stored position field |
| 32 | `WaitlistEntry` | Added `updatedAt timestamp` | Platform-wide rule |
| 33 | `GuestCheckout` | Added `updatedAt timestamp` | Platform-wide rule |
| 34 | `OAuthToken` | Entity removed | CR-001 / OQ-021 — deferred to v1.5 (DEFERRED-001) |

---

## Prisma Migration Notes

### Legend
- **Additive** — new table or nullable/default column; safe with rolling deploy
- **Additive (backfill)** — safe to run; requires a one-time data backfill
- **Destructive** — column removal, rename, or type change; no rollback without data loss
- **Data migration required** — existing rows must be updated before the change is safe

---

| Migration ID | Description | Type | Risk Notes |
|---|---|---|---|
| M-v03-001 | Add `Tenant.paymentModel nullable` | Additive | Existing rows get `null`. Populate via operator portal flow. |
| M-v03-002 | Fix duplicate `Tenant.paymentCredentials` in schema | Schema document fix | If any migration script was generated from v0.2 with the duplicate, audit before running. In practice the DB column exists once. |
| M-v03-003 | Add `Household.updatedAt` | Additive (backfill) | Backfill: `SET updatedAt = createdAt`. |
| M-v03-004 | Add `Learner.waiverToken nullable` | Additive | Existing rows get `null`. |
| M-v03-005 | Add `Learner.waiverStatus enum nullable` | Additive (backfill) | Create enum type first. Backfill: rows where `waiverSignedAt IS NOT NULL` → `waiverStatus = signed`; others → `null`. |
| M-v03-006 | Add `Learner.parentalConsentGiven boolean default false` | Additive | OQ-032 pending — column exists, NOT surfaced in UI until resolved. |
| M-v03-007 | Add `Learner.parentalConsentAt timestamp nullable` | Additive | OQ-032 pending — same caveat. |
| M-v03-008 | Add `Learner.updatedAt` | Additive (backfill) | Backfill: `SET updatedAt = createdAt`. |
| M-v03-009 | Add `Instructor.ratingAvg decimal(3,2) nullable` | Additive | Existing instructors get `null`. |
| M-v03-010 | Add `Instructor.ratingCount integer default 0` | Additive | Existing instructors get `0`. |
| M-v03-011 | Add `rejected` to `InstructorTenant.onboardingStatus` enum | Additive | PostgreSQL `ALTER TYPE ... ADD VALUE` is non-blocking. No existing rows affected. |
| M-v03-012 | Add `InstructorTenant.updatedAt` | Additive (backfill) | Backfill: `SET updatedAt = createdAt`. |
| M-v03-013 | Create `instructor_ratings` table | Additive | New table. No existing data. |
| M-v03-014 | Replace `Certification.alertSentAt` with three threshold fields | Destructive + Data migration required | (1) Add `alert60SentAt`, `alert30SentAt`, `alert7SentAt` as nullable — safe. (2) Backfill: where `alertSentAt IS NOT NULL`, set `alert60SentAt = alertSentAt` (prior alerts assumed to be the 60-day threshold). (3) Drop `alertSentAt` — destructive; run only after all application code is updated. |
| M-v03-015 | Rename `LessonType.priceAmount decimal` to `priceAmountCents integer` | Destructive + Data migration required | **Highest risk.** (1) Audit all existing values — confirm they are in major currency units (e.g., 75.00 USD, not 7500). (2) Multiply by 100 and round. (3) Rename and retype column. Run during a maintenance window; update all application code atomically. |
| M-v03-016 | Add `LessonType.instructorStudentRatio integer nullable` | Additive | Existing lesson types get `null`. |
| M-v03-017 | Create `lesson_package_templates` table | Additive | New table. |
| M-v03-018 | Create `lesson_packages` table | Additive | New table. |
| M-v03-019 | Create `package_redemptions` table | Additive | New table. |
| M-v03-020 | Add `Availability.updatedAt` | Additive (backfill) | Backfill: `SET updatedAt = createdAt`. |
| M-v03-021 | Rename `GroupSession.instructorId` to `leadInstructorId` | Destructive | Breaking change. Use dual-column approach: (1) Add `leadInstructorId`, copy from `instructorId`. (2) Deploy application code reading `leadInstructorId`. (3) Drop `instructorId`. M-v03-024 depends on this completing. |
| M-v03-022 | Rename `GroupSession.currentCapacity` to `currentEnrollment` | Destructive | Same dual-column approach as M-v03-021. |
| M-v03-023 | Add `GroupSession.instructorStudentRatio integer nullable` | Additive | Existing sessions get `null`. |
| M-v03-024 | Create `group_session_instructors` table + backfill | Additive (backfill) | **Depends on M-v03-021.** Backfill: insert one row per existing `GroupSession` with `(groupSessionId, instructorId = leadInstructorId, role = lead)`. |
| M-v03-025 | Add `Booking.lessonPackageId uuid nullable` | Additive | Existing bookings get `null`. |
| M-v03-026 | Add `system` to `BookingNote.authorRole` enum | Additive | `ALTER TYPE ... ADD VALUE` — non-blocking. |
| M-v03-027 | Remove `Payment.groupSessionId` | Destructive | **Pre-migration action required:** `SELECT COUNT(*) FROM payments WHERE groupSessionId IS NOT NULL`. If any rows exist, remediate before dropping. In Alpha, no production data should reference this field. |
| M-v03-028 | Add `Payment.paymentType enum default 'standard'` | Additive (backfill) | Create enum type. Add column with `DEFAULT 'standard'`. Backfill: all existing rows → `standard`. |
| M-v03-029 | Update `Payment.bookingId` CHECK constraint | Data migration required | Drop old CHECK (`bookingId IS NOT NULL OR groupSessionId IS NOT NULL`). Add new CHECK (`bookingId IS NOT NULL OR paymentType = 'package_purchase'`) as `NOT VALID`, then validate in background. **Depends on M-v03-028.** |
| M-v03-030 | Add `PaymentMethod.updatedAt` | Additive (backfill) | Backfill: `SET updatedAt = createdAt`. |
| M-v03-031 | Add `WaitlistEntry.position integer` | Additive (backfill) | Add as nullable. Backfill: assign sequential position per `(tenantId, lessonTypeId, targetDate, mode, targetInstructorId)` scope ordered by `createdAt`. Then add NOT NULL constraint. |
| M-v03-032 | Add `WaitlistEntry.updatedAt` | Additive (backfill) | Backfill: `SET updatedAt = createdAt`. |
| M-v03-033 | Add `GuestCheckout.updatedAt` | Additive (backfill) | Backfill: `SET updatedAt = createdAt`. |
| M-v03-034 | Drop `oauth_tokens` table (if exists from v0.2 scripts) | Destructive | **Pre-migration action required:** verify table was never created. If it exists with data, investigate before dropping. Should not exist per CR-001. |

### Sequencing Constraints

1. **M-v03-028 before M-v03-029** — `paymentType` column must exist before the CHECK constraint referencing it can be added.
2. **M-v03-021 before M-v03-024** — `leadInstructorId` must be populated before the `GroupSessionInstructor` backfill can reference it.
3. **M-v03-014 step 3 (drop `alertSentAt`)** — must wait until all application code references `alert60SentAt`, `alert30SentAt`, `alert7SentAt` exclusively.
4. **M-v03-015 (`priceAmountCents`)** — highest-risk migration; must run in a maintenance window with atomic code deployment.

---

## Open Items Not Addressable Without a Product or Legal Decision

| Item | Schema Impact | Status |
|---|---|---|
| OQ-031 (school-block billing) | `Payment.groupSessionId` is deferred (DEFERRED-002). If resolved in scope: re-add `groupSessionId uuid FK → GroupSession, nullable` to `Payment` and update the CHECK constraint to `bookingId IS NOT NULL OR groupSessionId IS NOT NULL OR paymentType = 'package_purchase'`. | UNRESOLVED |
| OQ-032 (parental consent) | `Learner.parentalConsentGiven` and `Learner.parentalConsentAt` are schema-reserved. Must be activated (NOT NULL enforcement, UI surfacing, erasure exemption wired into erasure tool) before Beta once OQ-032 resolves. | UNRESOLVED |
| EC-008 (package-redeemed booking cancellation credit reinstatement) | Schema supports both paths. `PackageRedemption` may need a `cancelledAt timestamp` field and `LessonPackage.remainingCount` reinstatement logic. Product Lead must decide before Beta. | NO PRODUCT DECISION |
| EC-010 / SC-C (cross-tenant double-booking for freelance instructors) | Application-architecture concern. The `GroupSessionInstructor.instructorId` index supports cross-tenant queries. Tech-lead must implement a platform-level cross-tenant conflict check for freelance instructors before Beta. | ARCHITECTURAL — FLAG FOR TECH LEAD |
| UA-008 (Smartwaiver document deletion for GDPR/PIPEDA) | `Learner.waiverToken` enables calling Smartwaiver's deletion API during right-to-erasure. Confirm with legal that Smartwaiver supports programmatic document deletion and that Slopebook is contractually obligated to invoke it. | LEGAL / CONTRACT REVIEW NEEDED |
| UA-007 (pricing floors and seasonal rate cards) | UC-038 lists as v1.0 GA; TR-038 states it is not in scope without a formal product decision. No schema support exists. Product Lead must clarify before operator portal implementation begins. | PRODUCT DECISION NEEDED |
