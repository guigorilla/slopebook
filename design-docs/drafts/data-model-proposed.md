# Slopebook — Proposed Data Model

**Document Status:** Draft — Review Pipeline Run 6
**Last Updated:** 2026-03-28
**Author:** Data-Modeler Agent
**Version:** 0.5 (proposed revision of data-model-proposed.md v0.4)
**Baseline:** data-model-proposed.md v0.4
**Sources:** use-cases-p0-proposed.md (Run 6), tech-requirements-proposed.md (Run 6), critique-proposed.md (Run 6)

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
  waiverToken           string, nullable          -- reserved: Smartwaiver integration deferred (OQ-052); null for P0
  waiverStatus          enum(not_required, pending, signed, fallback_typed_name), nullable  -- reserved: deferred (OQ-052); null for P0
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
  createdAt       timestamp
  updatedAt       timestamp
```

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
  recurrence    text, nullable
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
  preferredLanguage     enum(en, fr), default 'en'   -- CHANGED: add default; collected at checkout (CR-001 fix)
  learnerDateOfBirth    date, NOT NULL
  skillLevel            enum(beginner, intermediate, advanced)
  parentalConsentGiven  boolean, nullable
  parentalConsentAt     timestamp, nullable
  waiverToken           string, nullable              -- reserved: Smartwaiver deferred (OQ-052); null for P0
  waiverStatus          enum(not_required, pending, signed, fallback_typed_name), nullable  -- reserved: deferred; null for P0
  createdAt             timestamp
  updatedAt             timestamp
```

Index: `(tenantId, email)`
Application-layer enforcement: if `learnerDateOfBirth` indicates age < 18, `parentalConsentGiven` must be `true`.
Note: `preferredLanguage` must be collected in guest checkout flow (step 2) to support bilingual confirmation emails. Default = `en` if not supplied.

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
  status                enum(confirmed, in_progress, completed, cancelled, no_show)
  skillLevelAtBooking   enum(beginner, intermediate, advanced)
  meetingPoint          string, nullable
  checkedInAt           timestamp, nullable
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

Status transition rules:
- `confirmed` → `in_progress`: set when `checkedInAt` is populated (UC-010) or at lesson start time via scheduled job
- `confirmed` / `in_progress` → `completed`: set by instructor (UC-013)
- `confirmed` / `in_progress` → `no_show`: set by instructor (UC-011)
- `confirmed` → `cancelled`: set by customer, admin, or cascade (UC-006, UC-019, UC-031a)

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
Unique constraint: `(bookingId)`
Index: `(instructorId, tenantId)`

---

### Payment

```
Payment
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  householdId           uuid, FK → Household, nullable
  guestCheckoutId       uuid, FK → GuestCheckout, nullable
  bookingId             uuid, FK → Booking, nullable
  processor             enum(stripe, shift4)
  processorPaymentId    string
  amountCents           integer
  currency              enum(USD, CAD)
  status                enum(pending, captured, refunded, partially_refunded, failed, void_pending)  -- CHANGED: add void_pending for CR-004 compensation state
  refundedAmountCents   integer, default 0
  platformFeeCents      integer
  createdAt             timestamp
  updatedAt             timestamp
```

CHECK constraints:
- `(householdId IS NOT NULL) OR (guestCheckoutId IS NOT NULL)`
- `bookingId IS NOT NULL`
- `refundedAmountCents <= amountCents`
- `amountCents > 0`

`void_pending` status: set when `POST /api/v1/payments/:id/refund` (void) fails after 3 DB write retries. Background job retries void with alerting after N hours if still in this state (CR-004).

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

---

### OAuthToken

**DEFERRED to v1.5** — per OQ-021. Entity removed from v1.0 schema.

---

## Change Summary

| Entity.field | Change | Reference | Additive/Destructive |
|---|---|---|---|
| `GuestCheckout.preferredLanguage` | CHANGED: add default 'en' | CR-001 fix; bilingual email support | Additive |
| `Payment.status` | CHANGED: add `void_pending` enum value | CR-004 compensation state | Additive |
| `Booking` status transition rules | ADDED: documented in schema | CR-003 | Additive |
| `Learner.waiverToken` | ANNOTATED: reserved/deferred for P0 | OQ-052 | — |
| `Learner.waiverStatus` | ANNOTATED: reserved/deferred for P0 | OQ-052 | — |
| `GuestCheckout.waiverToken` | ANNOTATED: reserved/deferred for P0 | OQ-052 | — |
| `GuestCheckout.waiverStatus` | ANNOTATED: reserved/deferred for P0 | OQ-052 | — |
| All v0.4 changes | Carried forward | v0.4 | See v0.4 |

---

## Migration Notes

| Entity.field | Migration required | Risk |
|---|---|---|
| `Payment.status` | Add `void_pending` enum value. Additive; no existing rows affected. | Low |
| `GuestCheckout.preferredLanguage` | Already exists; add `DEFAULT 'en'` constraint. Existing nullable rows backfill to 'en'. | Low |
| `GuestCheckout.learnerDateOfBirth` | NOT NULL (from v0.4). No prod data. | Low |
| `Payment.groupSessionId` | DROP (from v0.4). No prod data. | Low |
| `PaymentMethod.processorTokenId` | Apply KMS envelope encryption (from v0.4). No prod data. | Low |
| `Availability.recurrence` | Type change json → text (from v0.2). Requires data migration. | Med |
