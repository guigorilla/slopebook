# Slopebook — Data Model

## Core Entities

### Tenant
Represents a resort or ski school. The top-level isolation boundary for all data.

```
Tenant
  id                  uuid, PK
  name                string
  slug                string, unique          -- used in subdomain / white-label URL
  currency            enum(USD, CAD)
  defaultLanguage     enum(en, fr)
  paymentProcessor    enum(stripe, shift4)
  paymentCredentials  encrypted json          -- processor API keys, never exposed in UI
  subscriptionTier    enum(starter, growth, pro, enterprise)
  createdAt           timestamp
  updatedAt           timestamp
```

### User
An authenticated user of the platform. Roles determine which app surfaces they can access.

```
User
  id                  uuid, PK
  tenantId            uuid, FK → Tenant       -- null for platform-level admin users
  email               string, unique
  passwordHash        string
  role                enum(guest, instructor, school_admin, operator, platform_admin)
  preferredLanguage   enum(en, fr)
  createdAt           timestamp
  updatedAt           timestamp
```

### Household
An adult account that manages reservations for multiple learners. Owned by one User.

```
Household
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  ownerId             uuid, FK → User         -- the Head of Household
  createdAt           timestamp
```

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
  notes               text                    -- e.g. medical notes, equipment notes
  createdAt           timestamp
```

### Instructor
A coach profile. Linked to a User account. Scoped to one or more Tenants.

```
Instructor
  id                  uuid, PK
  userId              uuid, FK → User
  tenantId            uuid, FK → Tenant
  bioEn               text
  bioFr               text
  photoUrl            string
  certifications      json                    -- e.g. [{type: "PSIA", level: 3, expiresAt: ...}]
  languagesSpoken     string[]
  onboardingStatus    enum(pending, approved, inactive)
  workdayHandoffAt    timestamp               -- when payroll profile was sent to Workday
  createdAt           timestamp
```

### LessonType
A configurable product in the lesson catalog. Owned by a Tenant.

```
LessonType
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  nameEn              string
  nameFr              string
  category            enum(private, semi_private, group, camp, full_day, half_day)
  durationMinutes     integer
  priceAmount         decimal
  currency            enum(USD, CAD)          -- inherits from Tenant
  maxCapacity         integer                 -- for group lessons
  skillLevels         enum[]                  -- which skill levels this lesson accepts
  instructorRequirements json                 -- certifications required to teach this type
  upsells             json                    -- e.g. equipment rental links
  isActive            boolean
  createdAt           timestamp
```

### Availability
Instructor availability slots. Used as inputs to the Booking Engine — does not represent a confirmed booking.

```
Availability
  id                  uuid, PK
  instructorId        uuid, FK → Instructor
  tenantId            uuid, FK → Tenant
  startAt             timestamp
  endAt               timestamp
  recurrence          json                    -- null for one-off; RRULE for recurring
  isBlocked           boolean                 -- true for blackout periods / overrides
  createdAt           timestamp
```

### Booking
A confirmed reservation. The authoritative record of a lesson assignment.

```
Booking
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  learnerId           uuid, FK → Learner
  instructorId        uuid, FK → Instructor
  lessonTypeId        uuid, FK → LessonType
  startAt             timestamp
  endAt               timestamp
  status              enum(confirmed, cancelled, completed, waitlisted, no_show)
  cancelledAt         timestamp
  cancellationReason  string
  notes               text                    -- instructor session notes
  createdAt           timestamp
```

### Payment
A financial transaction associated with one or more bookings.

```
Payment
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  householdId         uuid, FK → Household
  processor           enum(stripe, shift4)
  processorPaymentId  string                  -- Stripe PaymentIntent ID or Shift4 equivalent
  amountCents         integer
  currency            enum(USD, CAD)
  status              enum(pending, captured, refunded, partially_refunded, failed)
  refundedAmountCents integer
  platformFeeCents    integer                 -- 1.5% of transaction
  createdAt           timestamp
```

### PaymentMethod
A stored card-on-file token. Raw card data is never stored.

```
PaymentMethod
  id                  uuid, PK
  householdId         uuid, FK → Household
  processor           enum(stripe, shift4)
  processorTokenId    string                  -- processor vault token, not a PAN
  last4               string
  brand               string                  -- visa, mastercard, etc.
  expiryMonth         integer
  expiryYear          integer
  isDefault           boolean
  createdAt           timestamp
```

### WaitlistEntry
A student's position in a waitlist, either for a time slot or a specific instructor.

```
WaitlistEntry
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  learnerId           uuid, FK → Learner
  lessonTypeId        uuid, FK → LessonType
  mode                enum(time_slot, instructor)
  targetDate          date
  targetInstructorId  uuid, FK → Instructor   -- null if mode = time_slot
  notifiedAt          timestamp               -- when the 2-hour accept window opened
  expiresAt           timestamp               -- notifiedAt + 2 hours
  status              enum(waiting, notified, accepted, expired)
  createdAt           timestamp
```

### AuditLog
Central log of all administrative actions, financial events, and exception workflows.

```
AuditLog
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  actorId             uuid, FK → User
  action              string                  -- e.g. "booking.cancelled", "refund.issued"
  targetType          string                  -- e.g. "Booking", "Payment"
  targetId            uuid
  metadata            json
  createdAt           timestamp
```

## Key Relationships

```
Tenant
  └── many Users
  └── many Instructors
  └── many LessonTypes
  └── many Households
        └── one owner User (Head of Household)
        └── many Learners
        └── many PaymentMethods
        └── many Payments
              └── many Bookings
  └── many Availabilities (via Instructor)
  └── many Bookings
  └── many WaitlistEntries
  └── many AuditLogs
```

## Multi-Tenancy

Every entity except `User` (which can be platform-level) carries a `tenantId`. All queries at the application layer must include tenant scoping. No cross-tenant data leakage is permitted.

## Encryption & PCI Scope

- `paymentCredentials` on Tenant — encrypted at rest, never returned in API responses
- `processorTokenId` on PaymentMethod — processor vault token only, never a raw PAN
- Raw card numbers (PANs) are never stored, logged, or passed through Slopebook servers
