# Slopebook — Data Model

**Document Status:** Draft — Review Pipeline Run 9
**Last Updated:** 2026-04-04
**Version:** 0.7
**Sources:** use-cases-p0-proposed.md (Run 8), tech-requirements-proposed.md (Run 8), critique-proposed.md (Run 9), decisions.md (through 2026-03-29), open-questions-proposed.md (OQ-059 and OQ-061 resolved 2026-04-04)

---

## Schema

---

### Tenant

```
Tenant
  id                          uuid, PK
  name                        string
  slug                        string, unique
  currency                    enum(USD, CAD)
  defaultLanguage             enum(en, fr)
  paymentProcessor            enum(stripe, shift4)
  paymentCredentials          encrypted json
  subscriptionTier            enum(starter, growth, pro, enterprise)
  waitlistAcceptWindowMinutes integer, default 120
  createdAt                   timestamp
  updatedAt                   timestamp
```

---

### User

```
User
  id                uuid, PK
  tenantId          uuid, FK → Tenant, nullable
  email             string, unique
  passwordHash      string
  role              enum(guest, instructor, school_admin, operator, platform_admin)
  preferredLanguage enum(en, fr)
  phone             string, nullable
  phoneVerified     boolean, default false
  emailOptOut       boolean, default false
  smsOptOut         boolean, default false
  createdAt         timestamp
  updatedAt         timestamp
```

---

### Household

```
Household
  id          uuid, PK
  tenantId    uuid, FK → Tenant
  ownerId     uuid, FK → User
  createdAt   timestamp
  updatedAt   timestamp
```

---

### Learner

```
Learner
  id                    uuid, PK
  householdId           uuid, FK → Household
  firstName             string
  lastName              string
  dateOfBirth           date
  skillLevel            enum(beginner, intermediate, advanced)
  notes                 text, nullable
  waiverSignedAt        timestamp, nullable
  waiverVersion         string, nullable
  waiverToken           string, nullable          -- reserved: Smartwaiver deferred (OQ-052); null for P0
  waiverStatus          enum(not_required, pending, signed, fallback_typed_name), nullable
  parentalConsentGiven  boolean, nullable
  parentalConsentAt     timestamp, nullable
  createdAt             timestamp
  updatedAt             timestamp
```

Application-layer enforcement: if `dateOfBirth` indicates age < 18 at booking time, `parentalConsentGiven` must be `true`.

---

### Instructor

```
Instructor
  id              uuid, PK
  userId          uuid, FK → User
  bioEn           text
  bioFr           text
  photoUrl        string, nullable
  languagesSpoken string[]
  averageRating   decimal(3,2), nullable     -- ADDED v0.6: cached aggregate from InstructorRating; updated on review submit (POST /api/v1/bookings/:id/review side effect); null until first rating
  createdAt       timestamp
  updatedAt       timestamp
```

`averageRating`: recomputed by application layer on every `InstructorRating` insert. Formula: `AVG(rating)` over all InstructorRating records for this instructor within this tenant. NULL until at least one rating exists.

---

### InstructorTenant

```
InstructorTenant
  instructorId      uuid, FK → Instructor
  tenantId          uuid, FK → Tenant
  onboardingStatus  enum(pending, approved, inactive)
  workdayHandoffAt  timestamp, nullable
  createdAt         timestamp
  updatedAt         timestamp
  PRIMARY KEY       (instructorId, tenantId)
```

---

### Certification

```
Certification
  id            uuid, PK
  instructorId  uuid, FK → Instructor
  body          enum(PSIA, CSIA)
  level         integer
  issuedAt      date, nullable
  expiresAt     date
  alertSentAt   timestamp, nullable
  documentUrl   string, nullable
  createdAt     timestamp
  updatedAt     timestamp
```

---

### WorkdayHandoff

```
WorkdayHandoff
  id                    uuid, PK
  instructorId          uuid, FK → Instructor
  tenantId              uuid, FK → Tenant
  handoffAt             timestamp
  periodStart           date
  periodEnd             date
  status                enum(pending, delivered, failed)
  earningsSnapshotJson  json
  createdAt             timestamp
```

---

### LessonType

```
LessonType
  id                      uuid, PK
  tenantId                uuid, FK → Tenant
  nameEn                  string
  nameFr                  string
  category                enum(private, semi_private, group, camp, full_day, half_day)
  durationMinutes         integer
  priceAmount             decimal
  currency                enum(USD, CAD)
  maxCapacity             integer
  skillLevels             enum[]
  instructorRequirements  json
  upsells                 json, nullable
  meetingPoint            string, nullable
  cancellationPolicyId    uuid, FK → CancellationPolicy, nullable
  isActive                boolean
  createdAt               timestamp
  updatedAt               timestamp
```

---

### CancellationPolicy

```
CancellationPolicy
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  name                  string
  refundRules           json
  noShowPolicy          enum(no_refund, partial_refund, full_refund)
  noShowRefundPercent   integer, nullable
  isDefault             boolean, default false
  createdAt             timestamp
  updatedAt             timestamp
```

UNIQUE partial index: `(tenantId, isDefault)` WHERE `isDefault = true`

---

### Availability

```
Availability
  id            uuid, PK
  instructorId  uuid, FK → Instructor
  tenantId      uuid, FK → Tenant
  startAt       timestamp
  endAt         timestamp
  recurrence    text, nullable     -- CHANGED v0.6: was json; now text for RRULE string storage
  isBlocked     boolean
  createdAt     timestamp
  updatedAt     timestamp
```

---

### SlotReservation

```
SlotReservation
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  instructorId        uuid, FK → Instructor
  lessonTypeId        uuid, FK → LessonType
  startAt             timestamp
  endAt               timestamp
  sessionToken        string
  status              enum(active, released, expired, converted)
  expiresAt           timestamp
  convertedBookingId  uuid, nullable, FK → Booking
  createdAt           timestamp
  updatedAt           timestamp
```

Unique partial index: `(instructorId, startAt, endAt)` WHERE `status = active`

---

### GuestCheckout

```
GuestCheckout
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  email                 string
  phone                 string, nullable
  firstName             string
  lastName              string
  preferredLanguage     enum(en, fr), default 'en'
  learnerDateOfBirth    date, NOT NULL
  skillLevel            enum(beginner, intermediate, advanced)
  parentalConsentGiven  boolean, nullable
  parentalConsentAt     timestamp, nullable
  waiverToken           string, nullable
  waiverStatus          enum(not_required, pending, signed, fallback_typed_name), nullable
  createdAt             timestamp
  updatedAt             timestamp
```

Index: `(tenantId, email)`
Application-layer enforcement: if `learnerDateOfBirth` indicates age < 18, `parentalConsentGiven` must be `true`.

---

### GroupSession

```
GroupSession
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  lessonTypeId        uuid, FK → LessonType
  instructorId        uuid, FK → Instructor
  startAt             timestamp
  endAt               timestamp
  maxCapacity         integer
  currentCapacity     integer, default 0
  status              enum(open, full, in_progress, completed, cancelled)
  meetingPoint        string, nullable
  cancelledAt         timestamp, nullable
  cancellationReason  string, nullable
  createdAt           timestamp
  updatedAt           timestamp
```

Note: `in_progress` retained on GroupSession (not Booking) as group sessions have a distinct lifecycle.

---

### Booking

```
Booking
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  learnerId             uuid, FK → Learner, nullable
  guestCheckoutId       uuid, FK → GuestCheckout, nullable
  instructorId          uuid, FK → Instructor
  lessonTypeId          uuid, FK → LessonType
  groupSessionId        uuid, FK → GroupSession, nullable
  softReservationId     uuid, FK → SlotReservation, nullable
  cancellationPolicyId  uuid, FK → CancellationPolicy
  startAt               timestamp
  endAt                 timestamp
  status                enum(confirmed, completed, cancelled, no_show)
  skillLevelAtBooking   enum(beginner, intermediate, advanced)
  meetingPoint          string, nullable
  checkedInAt           timestamp, nullable
  autoCompletedAt       timestamp, nullable     -- ADDED v0.6: set by scheduler job (TR-013a); null if instructor-completed manually
  cancelledAt           timestamp, nullable
  cancellationReason    string, nullable
  createdAt             timestamp
  updatedAt             timestamp
```

CHECK constraints (application layer):
- `(learnerId IS NOT NULL) OR (guestCheckoutId IS NOT NULL)`
- `(learnerId IS NULL) OR (guestCheckoutId IS NULL)`
- `startAt < endAt`
- `cancellationPolicyId IS NOT NULL`

Status transitions (OQ-055):
- `confirmed` → `completed`: instructor action (UC-013) or system at endAt + 2h (TR-013a)
- `confirmed` → `no_show`: instructor action (UC-011)
- `confirmed` → `cancelled`: customer, admin, instructor (own lessons), or cascade

---

### BookingNote

```
BookingNote
  id                uuid, PK
  bookingId         uuid, FK → Booking
  authorId          uuid, FK → User
  authorRole        enum(instructor, admin)
  content           text
  isSharedWithGuest boolean, default false
  createdAt         timestamp
  updatedAt         timestamp
```

---

### InstructorRating

```
InstructorRating
  id            uuid, PK
  tenantId      uuid, FK → Tenant
  bookingId     uuid, FK → Booking, unique
  instructorId  uuid, FK → Instructor
  rating        integer
  comment       text, nullable
  createdAt     timestamp
  updatedAt     timestamp
```

CHECK: `rating >= 1 AND rating <= 5`
Unique constraint: `(bookingId)` — one rating per booking
Index: `(instructorId, tenantId)`
Side effect on insert: application layer recomputes `Instructor.averageRating` for the affected instructor.

---

### Payment

```
Payment
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  householdId           uuid, FK → Household, nullable
  guestCheckoutId       uuid, FK → GuestCheckout, nullable
  bookingId             uuid, FK → Booking, nullable          -- CHANGED v0.6: nullable per decisions.md 2026-03-29; OQ-059 resolved 2026-04-04
  lessonPackageId       uuid, FK → LessonPackage, nullable    -- ADDED v0.6: for package purchase payments; OQ-059 resolved 2026-04-04
  paymentType           enum(booking_charge, tip, package_purchase), default 'booking_charge'  -- ADDED v0.6: CR-003 Run 8; default added v0.7 per CR Run 9
  processor             enum(stripe, shift4)
  processorPaymentId    string
  amountCents           integer
  currency              enum(USD, CAD)
  status                enum(pending, captured, refunded, partially_refunded, failed, void_pending)
  refundedAmountCents   integer, default 0
  platformFeeCents      integer
  createdAt             timestamp
  updatedAt             timestamp
```

CHECK constraints:
- `(householdId IS NOT NULL) OR (guestCheckoutId IS NOT NULL)`
- `(bookingId IS NOT NULL) OR (lessonPackageId IS NOT NULL)`
- `NOT (bookingId IS NOT NULL AND lessonPackageId IS NOT NULL)`
- `refundedAmountCents <= amountCents`
- `amountCents > 0`
- `paymentType = 'package_purchase' → lessonPackageId IS NOT NULL` (application layer)
- `paymentType IN ('booking_charge', 'tip') → bookingId IS NOT NULL` (application layer)

Unique partial index: `(bookingId, paymentType)` WHERE `paymentType = 'tip'`  -- ADDED v0.7: one tip per booking; CR-002 Run 9

`void_pending`: set when void fails after all retries (4 attempts at 100ms). Silent for end users; ops review queue (OQ-056).

---

### PaymentMethod

```
PaymentMethod
  id                uuid, PK
  householdId       uuid, FK → Household
  processor         enum(stripe, shift4)
  processorTokenId  string, encrypted               -- [PCI] encrypted at rest via AWS KMS DEK; OQ-046
  last4             string
  brand             string
  expiryMonth       integer
  expiryYear        integer
  isDefault         boolean
  isValid           boolean, default true
  createdAt         timestamp
  updatedAt         timestamp
```

---

### WaitlistEntry

```
WaitlistEntry
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  learnerId           uuid, FK → Learner, nullable
  guestEmail          string, nullable
  lessonTypeId        uuid, FK → LessonType
  mode                enum(time_slot, instructor)
  targetDate          date
  targetInstructorId  uuid, FK → Instructor, nullable
  position            integer, nullable
  notifiedAt          timestamp, nullable
  expiresAt           timestamp, nullable
  status              enum(waiting, notified, accepted, expired)
  createdAt           timestamp
  updatedAt           timestamp
```

CHECK constraints:
- `(learnerId IS NOT NULL) OR (guestEmail IS NOT NULL)`
- `expiresAt > notifiedAt` (when both non-null)
- `targetInstructorId IS NOT NULL` when `mode = instructor`

Index: `(tenantId, targetDate, status, position)`

---

### WhiteLabelConfig

```
WhiteLabelConfig
  id                uuid, PK
  tenantId          uuid, FK → Tenant, unique
  logoUrl           string, nullable
  faviconUrl        string, nullable
  primaryColor      string, nullable
  secondaryColor    string, nullable
  fontFamily        string, nullable
  customDomain      string, nullable
  domainVerified    boolean, default false
  domainVerifiedAt  timestamp, nullable
  embedSnippet      text, nullable
  embedCodeToken    string, nullable
  createdAt         timestamp
  updatedAt         timestamp
```

---

### ApiKey

```
ApiKey
  id          uuid, PK
  tenantId    uuid, FK → Tenant
  label       string
  keyHash     string
  scopes      string[]
  lastUsedAt  timestamp, nullable
  expiresAt   timestamp, nullable
  isActive    boolean, default true
  revokedAt   timestamp, nullable
  createdAt   timestamp
  updatedAt   timestamp
```

---

### Webhook

```
Webhook
  id              uuid, PK
  tenantId        uuid, FK → Tenant
  url             string, encrypted
  events          string[]
  signingSecret   string, encrypted
  isActive        boolean, default true
  lastDeliveredAt timestamp, nullable
  failureCount    integer, default 0
  createdAt       timestamp
  updatedAt       timestamp
```

---

### AuditLog

```
AuditLog
  id          uuid, PK
  tenantId    uuid, FK → Tenant, nullable
  actorId     uuid, FK → User, nullable
  actorType   enum(user, system)
  action      string
  targetType  string
  targetId    uuid, nullable
  metadata    json
  createdAt   timestamp
```

Immutable — no UPDATE or DELETE permitted. No `updatedAt`.
`actorType = system` used for auto-completion events (TR-013a); `actorId` null for system actions.

---

### PasswordResetToken

```
PasswordResetToken
  id          uuid, PK
  userId      uuid, FK → User
  tokenHash   string
  expiresAt   timestamp
  usedAt      timestamp, nullable
  createdAt   timestamp
```

Index: `(tokenHash)` — lookup by token hash on reset
Single-use: `usedAt` set on consumption; subsequent use rejected.
Scope: included in schema now; P0 vs P1 scoping pending OQ-062 resolution. If P1, entity ships but endpoints remain behind feature flag until Beta.

---

### LessonPackage                                                     -- ADDED v0.6: P1 entity; defined now for FK validity on Payment.lessonPackageId; OQ-019; OQ-059 resolved

```
LessonPackage
  id               uuid, PK
  tenantId         uuid, FK → Tenant
  householdId      uuid, FK → Household
  lessonTypeId     uuid, FK → LessonType
  totalCount       integer
  remainingCount   integer
  priceAmountCents integer
  currency         enum(USD, CAD)
  expiresAt        timestamp, nullable
  isActive         boolean, default true
  createdAt        timestamp
  updatedAt        timestamp
```

CHECK: `remainingCount >= 0 AND remainingCount <= totalCount`
Platform fee (1.5%) applied at purchase time (OQ-027).

---

### PackageRedemption                                                 -- ADDED v0.6: P1 entity; tracks per-booking usage of LessonPackage credits; UC-024

```
PackageRedemption
  id               uuid, PK
  lessonPackageId  uuid, FK → LessonPackage
  bookingId        uuid, FK → Booking, unique
  redeemedAt       timestamp
  createdAt        timestamp
```

Unique on `bookingId` — one redemption per booking.

---

### OAuthToken

**DEFERRED to v1.5** — per OQ-021. Entity removed from v1.0 schema.

---

## Change Summary

| Entity.field | Change | Reference | Additive/Destructive |
|---|---|---|---|
| `Instructor.averageRating` | ADDED decimal(3,2) nullable | CR-sig Run 8; UC-001 display | Additive |
| `Availability.recurrence` | CHANGED json → text | TR-008 RRULE support | Destructive (migration) |
| `Booking.autoCompletedAt` | ADDED timestamp nullable | TR-013a; decisions.md 2026-03-29 | Additive |
| `Booking.status in_progress` | REMOVED from enum | OQ-055 | Destructive |
| `Payment.bookingId` | CHANGED: NOT NULL → nullable | decisions.md 2026-03-29; OQ-059 resolved | Destructive (constraint drop) |
| `Payment.lessonPackageId` | ADDED uuid FK → LessonPackage nullable | decisions.md 2026-03-29; OQ-059 | Additive |
| `Payment.paymentType` | ADDED enum default 'booking_charge' | CR-003 Run 8; CR min Run 9 (default added) | Additive |
| `Payment unique partial index (bookingId, paymentType) WHERE tip` | ADDED | CR-002 Run 9 | Additive |
| `Payment.groupSessionId` | REMOVED | OQ-031 | Destructive |
| `Payment.status void_pending` | ADDED enum value | OQ-056 | Additive |
| `Payment CHECK bookingId IS NOT NULL` | REMOVED | decisions.md 2026-03-29; CR-002 Run 8 | Destructive (constraint drop) |
| `Payment CHECK (bookingId OR lessonPackageId) NOT NULL` | ADDED | decisions.md 2026-03-29 | Additive |
| `Payment CHECK mutual exclusivity` | ADDED | decisions.md 2026-03-29 | Additive |
| `PasswordResetToken` | ADDED entity | TR gap #18 | Additive |
| `LessonPackage` | ADDED entity (P1) | OQ-019; OQ-059 FK validity | Additive |
| `PackageRedemption` | ADDED entity (P1) | UC-024 | Additive |

---

## Migration Notes

| Entity.field | Migration Required | Risk |
|---|---|---|
| `Availability.recurrence` | Unwrap JSON string values to plain TEXT: `UPDATE availability SET recurrence = recurrence #>> '{}' WHERE recurrence IS NOT NULL`; validate RRULE format before running | Med |
| `Booking.status in_progress` | DROP enum value; verify zero rows with this status before running | Low |
| `Payment.bookingId` | DROP CHECK `bookingId IS NOT NULL`; add new CHECK `(bookingId IS NOT NULL OR lessonPackageId IS NOT NULL)`; existing rows all have bookingId set — safe | Low |
| `Payment.groupSessionId` | DROP FK column and associated CHECK; no prod data expected | Low |
| `Payment.paymentType` | ADD column NOT NULL DEFAULT 'booking_charge'; no backfill needed (default covers all existing rows) | Low |
| `PaymentMethod.processorTokenId` | Apply KMS envelope encryption; no prod data | Low |
