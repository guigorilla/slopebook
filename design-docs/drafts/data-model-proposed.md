# Slopebook — Data Model

**Document Status:** Draft — Review Pipeline Run 10
**Last Updated:** 2026-11-01
**Version:** 0.8
**Sources:** use-cases-p0-proposed.md (Run 10, revision 2), tech-requirements-proposed.md (Run 10), critique-proposed.md (Run 10), api-design-proposed.md (Run 10, field names only), decisions.md (through 2026-11-01), data-model-proposed.md v0.7 (kept as base)

**Reading notes**
- Booking Core entities (everything in v0.7) are Phase 3. Overlay entities are Phase 1 or 2; the phase is shown in each entity heading. Phases marked "provisional" follow tech-requirements Q10.53.
- `[GATE]` on an entity or field means it holds personal data that cannot hold real data until the privacy gate (TR-030) is open for its data class. `[PCI]` marks a field that could contain card data.
- Change tags (`-- ADDED`, `-- CHANGED`, `-- REMOVED`) appear on changed lines only. A new entity is tagged once, on its heading. Tags from earlier runs were reduced to plain notes.
- Overlay entities that point at imported POS records use string references (`lessonRef`, `slotRef`, `targetRef`) rather than foreign keys, so they do not depend on how imported lessons are stored (Q10.12).
- The 30KB target was waived for this run (completeness over size).

---

## Phase Map of New Entities

| Entity | Phase | Gate | TR |
|---|---|---|---|
| DataClassPolicy | 1 (prerequisite), platform-wide | - | TR-030 |
| POSReference | 1 | - | TR-031, TR-035, TR-050 |
| PosConnection | 1 | - | TR-031 |
| PolicyRule | 1 | - | TR-032 |
| ImportBatch | 1 | - (see Q10.2, CR-001) | TR-035 |
| ImportFlag | 1 | - (see Q10.2, CR-001) | TR-036 |
| OperationalIssue | 1 | - | TR-037 |
| ResolutionPlan | 1 | - | TR-038 |
| ProposedAction | 1 | - | TR-038 |
| ActionValidation | 1 | - | TR-038, TR-032 |
| AgentConversation | 1 (provisional) | [GATE] | TR-039 |
| AgentMessage | 1 (provisional) | [GATE] | TR-039 |
| OperationalObservation | 1 (shadow), 2 | [GATE] | TR-040 |
| IntakeSession | 1-2 | [GATE] | TR-047 |
| IntakeMessage | 1-2 | [GATE] | TR-047 |
| LearnerProfile | 1 (minimal), 2 | [GATE] | TR-047, TR-035 |
| TenantMembership | 2 | - | TR-041 |
| ManagerDecision | 2 | - | TR-042 |
| ActionOutcome | 2 | - | TR-043 |
| WaitlistOffer | 2 (provisional) | - | TR-046 |
| InstructorProfile | 2 | field `learnedProfile` is [GATE] | TR-048, TR-052, CR-016 |
| IntakeMatch | 2 | - | TR-048 |
| GroupPlacementRequest | 2 | - (copies gated values, Q10.64) | TR-049 |
| StudentLessonAssessment | 2 | [GATE] | TR-051 |
| InstructorLessonAssessment | 2 | [GATE] | TR-052 |
| NextLessonRecommendation | 2 | [GATE] | TR-053 |
| PrivacyRequest | 2 (must exist before the gate opens) | - | TR-054 |
| ConsentRecord | 2 (must exist before the gate opens) | - | TR-055 |

Changed existing entities: Tenant, Learner, GuestCheckout, LessonType, GroupSession, Booking, Payment. The TR schema summary does not tag InstructorProfile as gated; `learnedProfile` is tagged here because it holds instructor observations, a gated class in decisions.md 2026-10-31.

## Critique Items Addressed

| Item | Status | Where |
|---|---|---|
| CR-016 InstructorProfile tenant scoping | Addressed | InstructorProfile: `tenantId`, unique `(tenantId, instructorId)`, composite FK to InstructorTenant |
| CR-007 tip index counts failed charges | Addressed in schema; retry semantics open | Payment unique partial index excludes `status = failed`; Q10.60 |
| CR-012 re-import recreates erased learner | Partly addressed; design needs a decision | POSReference `erasedAt`, import rule; Q10.58 |
| Q10.29 waitlistAcceptWindowMinutes vs fixed 2 hours | Addressed (decisions.md 2026-03-26 applied) | Tenant field REMOVED; WaitlistOffer 2-hour CHECK |
| Q10.12 imported lessons vs NOT NULL constraints | Not decided; constraint inventory recorded | Open Questions, Q10.12 inventory |
| CR-001 imported POS data and the gate | Partly: `imported_pos_customer` data class listed; gating is Q10.2 | DataClassPolicy |
| CR-003 consent and erasure depend on Household/User | Open, recorded | Q10.63 |
| CR-017 age vs date of birth | Open, recorded | Q10.42 (existing), Q10.64 |
| CR-023 processor switch overwrites credentials | Open, recorded | Q10.69 |

## New Open Questions (Run 10, data model)

Numbering continues after Q10.57 in the API draft. Q10.12 is carried from tech requirements.

- **Q10.12 (carried, inventory added) — imported lessons.** Booking, Learner and Instructor have NOT NULL constraints a POS record may not meet. Schema is unchanged pending a product decision between relaxing constraints and a separate imported-lesson entity. Inventory:

| Entity.field | v0.7 constraint | Why a POS record may fail | If relaxed | If separate entity |
|---|---|---|---|---|
| Booking.cancellationPolicyId | NOT NULL (CHECK) | POS lesson has no Slopebook policy | nullable, CHECK only for booking_core tenants | not needed |
| Booking.learnerId / guestCheckoutId | exactly one non-null | POS customer is neither a Learner with a Household nor a guest checkout | allow both null plus a POS reference | store customer ref only |
| Booking.lessonTypeId, instructorId | NOT NULL FK | POS product or instructor may not map to a LessonType or Instructor | nullable | string refs |
| Booking.skillLevelAtBooking | NOT NULL | POS has no skill; TR-034 forbids guessing | nullable, or `unresolved` handling | not needed |
| Learner.householdId, dateOfBirth | NOT NULL | POS customers have no Household; date of birth may be missing or withheld | nullable, with application rules | profile keyed by POSReference |
| Learner.skillLevel | NOT NULL | skill is `unresolved` for new imports; see Q10.62 | nullable when source is unresolved | not needed |
| Instructor.userId, bioEn, bioFr | NOT NULL | POS instructors have no login or bios | nullable | profile keyed by POSReference |
| Exposure | Booking rows are reachable through booking endpoints | overlay tenants cannot use those endpoints (Q10.57) | needs a tenant-mode guard on every read | none |

- **Q10.58 — Erasure suppression for re-import (CR-012).** v0.7-plus design: an erased POS record keeps its POSReference with `erasedAt` set and no personal fields, and import skips it. Needs a decision: does keeping the POS external id defeat erasure, and for how long may the marker live; is the Slopebook Learner deleted or pseudonymised (decisions.md uses pseudonymise for GuestCheckout); what happens when the POS issues a new customer id for the same person; which imported fields Slopebook may hold at all.
- **Q10.59 — Overlay tenants and payment columns.** Tenant.paymentProcessor, paymentCredentials and subscriptionTier are NOT NULL in v0.7, which overlay tenants cannot satisfy. Unchanged here. Linked to Q10.5; also whether Tenant.operatingMode has a default for new tenants.
- **Q10.60 — Tip retry semantics (CR-007).** Index now excludes `failed` only. Decide how `pending` (abandoned 3-D Secure), `void_pending`, `refunded` and `partially_refunded` tips count against the one-tip limit, and what a retry after `PAYMENT_FAILED` returns.
- **Q10.61 — Status values not specified in sources.** Proposed from the flows and to confirm: ImportBatch.status, PosConnection.status, IntakeSession.status, InstructorLessonAssessment.status, PrivacyRequest.status. Also TR-042 says an approved plan becomes `ready_to_execute`, but that value is not in the TR-038 plan status list; this schema treats `approved` as ready to execute. OperationalIssue.type and ProposedAction.actionType stay strings because their value lists are undecided (Q10.15).
- **Q10.62 — Where skill and its source live.** TR-034 puts `skillLevelSource` on Learner; TR-035 and UC-035 put it on LearnerProfile. This schema follows TR-034. Also `unresolved` source with NOT NULL skill columns on Learner, GuestCheckout and Booking is contradictory.
- **Q10.63 — Subject identity for overlay consent, export and erasure (CR-003, Q10.32).** ConsentRecord, PrivacyRequest and LearnerProfile point at Learner, which needs a Household and User (Phase 3). IntakeSession is not bound to a learner. Needs an identity model for overlay adults and minors.
- **Q10.64 — Gate status of copied values.** GroupPlacementRequest (age, abilityLevel, goals), IntakeMatch and NextLessonRecommendation copy values derived from gated profile data. Also GroupPlacementRequest.age is an integer snapshot; see Q10.42 and CR-017 for age versus date of birth.
- **Q10.65 — Whole-group instructor answers.** API sends `learnerId = null` when `wholeGroup` is true. Schema allows a null learnerId; decide whether this stays one row or expands into per-student rows.
- **Q10.66 — Card data in free text.** Fields tagged `[PCI]` below are free text in which a guest could type card data. Decide screening or redaction before storage. Existing free-text fields (Learner.notes, BookingNote.content, cancellationReason) are not retro-tagged.
- **Q10.67 — TenantMembership versus User.tenantId.** Which is authoritative once both exist, whether User.tenantId is later removed, the membership role vocabulary (Q10.18) and where the plan approval right lives (Q10.22).
- **Q10.68 — LessonType.priceAmount.** Column is `decimal`, which breaks the integer-cents rule; the API example shows an integer. Unchanged here.
- **Q10.69 — Processor switch (CR-023).** Tenant.paymentCredentials holds one value, so refunds and tips for charges made through the old processor have no credentials after a switch. Payment.processor records which processor charged; credential history is undecided.

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
  operatingMode               enum(overlay, booking_core)       -- ADDED: overlay vs Booking Core tenants; TR-031
  realDataEnabled             boolean, default false            -- ADDED: privacy gate state; TR-030
  paymentProcessor            enum(stripe, shift4)
  paymentCredentials          encrypted json
  subscriptionTier            enum(starter, growth, pro, enterprise)
  createdAt                   timestamp
  updatedAt                   timestamp
```

`waitlistAcceptWindowMinutes` -- REMOVED: fixed 2-hour window, decisions.md 2026-03-26 (Q10.29). The accept window is a platform constant of 2 hours in v1.0; per-resort configuration is deferred to v1.5.

`operatingMode`: overlay tenants cannot enable booking or payment endpoints. Existing tenants are backfilled to `booking_core`; new tenants set it at onboarding (default undecided, Q10.59).
`realDataEnabled`: application layer rejects `true` unless every gated DataClassPolicy row has `approvedAt` set (CR-008 asks for a per-class or per-phase split; not decided).

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

### TenantMembership                                                  -- ADDED: multi-school admins; TR-041 [Phase 2]

```
TenantMembership
  id          uuid, PK
  userId      uuid, FK → User
  tenantId    uuid, FK → Tenant
  role        enum(guest, instructor, school_admin, operator)   -- overlay roles pending Q10.18
  createdAt   timestamp
  updatedAt   timestamp
  UNIQUE      (userId, tenantId)
```

Index: `(userId)` — GET /api/v1/me/tenants. `platform_admin` is platform-wide and has no membership. Relationship to `User.tenantId`: Q10.67.

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
  skillLevel            enum(first_timer, beginner, advanced_beginner, intermediate, advanced, expert)   -- CHANGED: three-level to six-level; TR-034
  skillLevelSource      enum(customer, inferred, instructor, unresolved)   -- ADDED: recorded source of skill; TR-034
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
`skillLevelSource = instructor` can be set only by an instructor or school_admin.
Two consent mechanisms exist (`parentalConsentGiven` for Booking Core, ConsentRecord for gated overlay data); TR-055 leaves `parentalConsentGiven` as-is.
Imported POS learners cannot satisfy `householdId`, `dateOfBirth` and `skillLevel` NOT NULL; see Q10.12 and Q10.62.

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
  averageRating   decimal(3,2), nullable     -- cached aggregate from InstructorRating; recomputed on review submit; null until first rating
  createdAt       timestamp
  updatedAt       timestamp
```

`averageRating`: recomputed by application layer on every `InstructorRating` insert. Formula: `AVG(rating)` over all InstructorRating records for this instructor within this tenant. NULL until at least one rating exists.
Imported POS instructors cannot satisfy `userId`, `bioEn`, `bioFr` NOT NULL; see Q10.12.

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

### InstructorProfile                                                  -- ADDED: tenant-scoped coaching profile; TR-048, CR-016 [Phase 2]

```
InstructorProfile
  id                  uuid, PK
  instructorId        uuid
  tenantId            uuid, FK → Tenant
  specialties         string[]
  terrain             string[]
  teachingStyle       string
  communicationStyle  string
  learnedProfile      json     -- [GATE] derived from instructor interviews (TR-052); coaching and assignment only
  createdAt           timestamp
  updatedAt           timestamp
  UNIQUE              (tenantId, instructorId)
  FOREIGN KEY         (instructorId, tenantId) → InstructorTenant
```

An instructor who works for several schools has one InstructorProfile per school, so one school's observations are never readable by another (CR-016). Guests see an allow-list of fields only; which `learnedProfile` fields are visible is undecided (Q10.33). `learnedProfile` is readable by school_admin and the instructor, never by guests.

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
  priceAmount             decimal                -- Q10.68: breaks integer-cents rule; unchanged
  currency                enum(USD, CAD)
  maxCapacity             integer
  skillLevels             enum[](first_timer, beginner, advanced_beginner, intermediate, advanced, expert)   -- CHANGED: three-level to six-level; TR-034
  groupMode               enum(customer_selected, school_composed), nullable   -- ADDED: group booking mode per lesson type; TR-049
  instructorRequirements  json
  upsells                 json, nullable
  meetingPoint            string, nullable
  cancellationPolicyId    uuid, FK → CancellationPolicy, nullable
  isActive                boolean
  createdAt               timestamp
  updatedAt               timestamp
```

`groupMode` applies to group categories (`group`, `camp`); null otherwise. `customer_selected` lesson types are booked as GroupSessions; `school_composed` are placed through GroupPlacementRequest. Application layer enforces `groupMode IS NULL` when `category` is not a group category.

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
  recurrence    text, nullable     -- RRULE string (v0.6: was json)
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
  skillLevel            enum(first_timer, beginner, advanced_beginner, intermediate, advanced, expert)   -- CHANGED: three-level to six-level; TR-034
  skillLevelSource      enum(customer, inferred, instructor, unresolved), nullable   -- ADDED: carried from browse; API guest-checkouts payload
  parentalConsentGiven  boolean, nullable
  parentalConsentAt     timestamp, nullable
  waiverToken           string, nullable
  waiverStatus          enum(not_required, pending, signed, fallback_typed_name), nullable
  createdAt             timestamp
  updatedAt             timestamp
```

Index: `(tenantId, email)`
Application-layer enforcement: if `learnerDateOfBirth` indicates age < 18, `parentalConsentGiven` must be `true`.
Browse collects an age, not a date of birth (Q10.42, CR-017); unresolved.

---

### GroupSession

```
GroupSession
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  lessonTypeId        uuid, FK → LessonType
  instructorId        uuid, FK → Instructor
  programId           uuid, nullable          -- ADDED: groups sessions of a bulk-created program; TR-056
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

Index: `(tenantId, programId)`. `programId` is generated by the server per bulk-creation request; it has no entity of its own. Note: `in_progress` retained on GroupSession (not Booking) as group sessions have a distinct lifecycle.

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
  skillLevelAtBooking   enum(first_timer, beginner, advanced_beginner, intermediate, advanced, expert)   -- CHANGED: three-level to six-level; TR-034
  meetingPoint          string, nullable
  checkedInAt           timestamp, nullable
  autoCompletedAt       timestamp, nullable     -- set by scheduler job (TR-013a); null if instructor-completed manually
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

Imported POS lessons are not stored here in this version: these constraints cannot be met by a POS record (inventory under Q10.12).

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
  bookingId             uuid, FK → Booking, nullable          -- nullable per decisions.md 2026-03-29; OQ-059 resolved
  lessonPackageId       uuid, FK → LessonPackage, nullable    -- for package purchase payments; OQ-059 resolved
  paymentType           enum(booking_charge, tip, package_purchase), default 'booking_charge'
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

Unique partial index: `(bookingId, paymentType)` WHERE `paymentType = 'tip' AND status <> 'failed'`  -- CHANGED: failed tip must not block retry; CR-007
A declined tip is set to `failed` and drops out of the index, so the guest can retry with a new Idempotency-Key. Treatment of `pending`, `void_pending` and refunded tips is undecided (Q10.60).

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
`expiresAt` is set by the application as `notifiedAt + 2 hours` (platform constant, decisions.md 2026-03-26).

---

### WaitlistOffer                                                      -- ADDED: overlay offer, no reservation or payment; TR-046 [Phase 2, provisional]

```
WaitlistOffer
  id               uuid, PK
  tenantId         uuid, FK → Tenant
  waitlistEntryId  uuid, FK → WaitlistEntry
  slotRef          string
  status           enum(offered, accepted, declined, expired)
  offeredBy        uuid, FK → User
  offeredAt        timestamp
  expiresAt        timestamp
  createdAt        timestamp
  updatedAt        timestamp
```

CHECK: `expiresAt = offeredAt + interval '2 hours'` — fixed platform value; no tenant setting overrides it (Q10.29).
Index: `(tenantId, waitlistEntryId, status)`.
An offer never creates a SlotReservation, Booking or Payment. `WaitlistEntry.status = accepted` stays a Booking Core state. Overlay waitlist entries need a lessonTypeId and targetDate (origin undecided, Q10.26).

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
Overlay use: one entry per ActionOutcome transition (TR-043). Metadata holds user ids only, never raw email or personal data (TR-030, TR-044). The 3-year retention cap covers Booking Core only; overlay audit retention is undecided (Q10.25).

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

### LessonPackage                                                     -- P1 entity; defined for FK validity on Payment.lessonPackageId; OQ-019

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

### PackageRedemption                                                 -- P1 entity; per-booking usage of LessonPackage credits; UC-024

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

## Overlay Entities

Everything below is new in this version and is a proposal that follows tech-requirements Run 10. Every entity carries `tenantId`, `createdAt` and `updatedAt`, except where noted.

---

### DataClassPolicy                                                   -- ADDED: retention and erasure registry; TR-030 [Phase 1, platform-wide]

```
DataClassPolicy
  id               uuid, PK
  dataClass        enum(agent_conversation, intake_conversation, learner_profile, instructor_observation, student_assessment, operational_observation, next_lesson_recommendation, imported_pos_customer), unique
  retentionPeriod  string, nullable          -- format open until retention rules exist (Q10.1)
  erasureBehavior  enum(delete, pseudonymise), nullable
  minorRule        string, nullable
  decisionRef      string, nullable          -- must cite a decisions.md entry before approval
  approvedAt       timestamp, nullable       -- null = class not approved; gate stays closed
  createdAt        timestamp
  updatedAt        timestamp
```

Platform-wide: no `tenantId` (written by platform_admin only). One row per data class exists from day one, with `approvedAt` null until a human decision is recorded. Approval requires `retentionPeriod`, `erasureBehavior`, `minorRule` and `decisionRef` all non-null (application layer). CI fails if an entity holding personal data has no matching class or no purge/erasure job.
`imported_pos_customer` is listed because imported POS names and contact details are personal data; whether the privacy gate also covers imports is undecided (Q10.2, CR-001). The row stays unapproved until then.

---

### POSReference                                                      -- ADDED: maps Slopebook records to POS records; TR-031 [Phase 1]

```
POSReference
  id            uuid, PK
  tenantId      uuid, FK → Tenant
  entityType    enum(learner, instructor, lesson, intake)   -- `lesson` target entity undecided (Q10.12)
  entityId      uuid, nullable        -- polymorphic, no FK; null if the target row was deleted by erasure
  system        string
  externalType  string
  externalId    string
  lastSyncedAt  timestamp, nullable
  erasedAt      timestamp, nullable   -- ADDED: erased record that re-import must not recreate; CR-012
  createdAt     timestamp
  updatedAt     timestamp
  UNIQUE        (tenantId, system, externalType, externalId)
```

Import rule (CR-012): when an import finds a POSReference with `erasedAt` set, it skips the record, creates no Learner or LearnerProfile, and counts it as `suppressed` in ImportBatch.counts. Erasure of a learner sets `erasedAt` on every POSReference for that learner. Open: retention of this marker, hashing the external id, delete versus pseudonymise, and which imported fields may be held at all (Q10.58). Adapter field allow-list excludes card and payment-instrument data (TR-031).
For TR-050, a POSReference with `entityType` intake or learner links to an external reservation id.

---

### PosConnection                                                     -- ADDED: per-tenant POS vendor connection; TR-031 [Phase 1]

```
PosConnection
  id           uuid, PK
  tenantId     uuid, FK → Tenant
  vendor       string                          -- first vendor undecided (Q10.4)
  mode         enum(read_only, read_write)
  credentials  encrypted json                  -- AWS KMS; vendor API credentials, never card data
  status       enum(active, inactive, error)   -- values proposed (Q10.61)
  createdAt    timestamp
  updatedAt    timestamp
  UNIQUE       (tenantId, vendor)
```

Set by platform_admin. Whether a tenant can run an overlay adapter and Booking Core together is undecided (Q10.5).

---

### PolicyRule                                                        -- ADDED: versioned tenant policy configuration; TR-032 [Phase 1]

```
PolicyRule
  id             uuid, PK
  tenantId       uuid, FK → Tenant
  ruleKey        string
  config         json
  version        integer
  effectiveFrom  timestamp
  createdAt      timestamp
  updatedAt      timestamp
  UNIQUE         (tenantId, ruleKey, version)
```

The engine is pure and versioned: the same inputs give the same result. Which policies exist and who sets them is undecided (Q10.6).

---

### ImportBatch                                                       -- ADDED: one schedule import run; TR-035 [Phase 1]

```
ImportBatch
  id          uuid, PK
  tenantId    uuid, FK → Tenant
  source      string                          -- mechanism undecided (Q10.11)
  rangeStart  date
  rangeEnd    date
  status      enum(running, completed, rejected)   -- values proposed (Q10.61); partial vs whole rejection is Q10.13
  counts      json                            -- keys: created, updated, flagged, suppressed
  createdAt   timestamp
  updatedAt   timestamp
```

Index: `(tenantId, rangeStart, rangeEnd)`. `rejected` covers a structurally unreadable batch (422 IMPORT_UNREADABLE).

---

### ImportFlag                                                        -- ADDED: invalid or incomplete imported record; TR-036 [Phase 1]

```
ImportFlag
  id             uuid, PK
  tenantId       uuid, FK → Tenant
  importBatchId  uuid, FK → ImportBatch
  sourceRow      integer                  -- row number only; the raw source row is not stored
  recordType     string
  reason         string
  status         enum(open, dismissed, fixed)
  dismissedBy    uuid, FK → User, nullable
  createdAt      timestamp
  updatedAt      timestamp
```

Index: `(importBatchId, status)`. Storing a row number and not the row keeps personal data and any card data out of flags (CR-001, TR-031). Flagged records are excluded from issue detection until fixed. Records missing optional data carry an incomplete marker; where that marker lives depends on Q10.12.

---

### OperationalIssue                                                  -- ADDED: ranked operational issue; TR-037 [Phase 1]

```
OperationalIssue
  id                 uuid, PK
  tenantId           uuid, FK → Tenant
  type               string                   -- value list undecided (Q10.15)
  status             enum(open, planned, resolved)
  affectedLessonRefs string[]
  detectedAt         timestamp
  impactAt           timestamp
  rankScore          decimal
  rankInputs         json
  createdAt          timestamp
  updatedAt          timestamp
```

Index: `(tenantId, status, rankScore)`. Detection and ranking are pure functions of the imported model; criteria are undecided (Q10.14). `rankScore` is an estimate until measured.

---

### ResolutionPlan                                                    -- ADDED: proposed set of actions for an issue; TR-038 [Phase 1]

```
ResolutionPlan
  id          uuid, PK
  tenantId    uuid, FK → Tenant
  issueId     uuid, FK → OperationalIssue
  version     integer
  planHash    string
  status      enum(draft, validated, pending_approval, approved, rejected, executing, executed, failed, stale, closed)
  createdBy   enum(agent, system)
  createdAt   timestamp
  updatedAt   timestamp
  UNIQUE      (issueId, version)
```

`approved` is treated as ready to execute after a ManagerDecision (Q10.61). A failed constraint blocks approval.

---

### ProposedAction                                                    -- ADDED: one action inside a plan; TR-038 [Phase 1]

```
ProposedAction
  id             uuid, PK
  tenantId       uuid, FK → Tenant
  planId         uuid, FK → ResolutionPlan
  actionType     string                   -- value list undecided (Q10.61)
  targetRef      string
  params         json
  expectedState  json
  reasoning      text
  createdAt      timestamp
  updatedAt      timestamp
```

Index: `(planId)`. Agent-authored `params` are validated by the constraint engine before approval.

---

### ActionValidation                                                  -- ADDED: deterministic rule result per action; TR-038, TR-032 [Phase 1]

```
ActionValidation
  id            uuid, PK
  tenantId      uuid, FK → Tenant
  actionId      uuid, FK → ProposedAction
  ruleId        string                  -- engine rule key; policy rules match PolicyRule.ruleKey
  ruleVersion   integer
  result        enum(pass, fail)
  reason        string
  evaluatedAt   timestamp
  createdAt     timestamp
  updatedAt     timestamp
```

Index: `(actionId)`. Rules run again at plan view, approval and execution; each run adds rows.

---

### AgentConversation                                                 -- ADDED: manager agent conversation; TR-039 [GATE] [Phase 1, provisional]

```
AgentConversation
  id         uuid, PK
  tenantId   uuid, FK → Tenant
  userId     uuid, FK → User
  startedAt  timestamp
  createdAt  timestamp
  updatedAt  timestamp
```

Retrieval is strictly tenant-scoped. Retention and erasure undecided (Q10.17). Prompts and logs carry user ids, not emails.

---

### AgentMessage                                                      -- ADDED: manager agent message; TR-039 [GATE] [Phase 1, provisional]

```
AgentMessage
  id               uuid, PK
  tenantId         uuid, FK → Tenant
  conversationId   uuid, FK → AgentConversation
  role             enum(user, agent)
  content          text                -- [PCI] free text; screening undecided (Q10.66)
  citedFacts       json
  citedRuleIds     string[]
  issueId          uuid, FK → OperationalIssue, nullable
  planId           uuid, FK → ResolutionPlan, nullable
  createdAt        timestamp
  updatedAt        timestamp
```

Index: `(conversationId, createdAt)`. A requested schedule change creates a draft ResolutionPlan, never a write.

---

### OperationalObservation                                            -- ADDED: did the recommendation match the manager's action; TR-040 [GATE] [Phase 1 shadow, 2]

```
OperationalObservation
  id          uuid, PK
  tenantId    uuid, FK → Tenant
  planId      uuid, FK → ResolutionPlan
  result      enum(matched, partly_matched, different, not_needed, unrecorded)
  reason      text, nullable           -- [GATE] [PCI] free text (Q10.66)
  source      enum(self_reported, inferred)
  recordedBy  uuid, FK → User
  recordedAt  timestamp
  createdAt   timestamp
  updatedAt   timestamp
```

Index: `(tenantId, recordedAt)`. `unrecorded` is stored when no observation was entered; the API accepts the other four. How `inferred` is derived is undecided (Q10.41).

---

### ManagerDecision                                                   -- ADDED: append-only approval record; TR-042 [Phase 2]

```
ManagerDecision
  id                 uuid, PK
  tenantId           uuid, FK → Tenant
  planId             uuid, FK → ResolutionPlan
  planHash           string
  userId             uuid, FK → User
  decision           enum(approve, reject)
  approvedActionIds  uuid[]
  reason             text, nullable
  decidedAt          timestamp
  createdAt          timestamp
```

Append-only: no UPDATE or DELETE grants; no `updatedAt` (same exception as AuditLog). Agent and system actors can never be `userId` of an approve decision. Rejection reason requirement undecided (Q10.21).

---

### ActionOutcome                                                     -- ADDED: execution and verification result; TR-043 [Phase 2]

```
ActionOutcome
  id                uuid, PK
  tenantId          uuid, FK → Tenant
  actionId          uuid, FK → ProposedAction, unique
  status            enum(pending, executed, verified, failed, manual_pending)
  adapterRequestId  string, nullable
  observedState     json, nullable
  verifiedAt        timestamp, nullable
  error             text, nullable
  createdAt         timestamp
  updatedAt         timestamp
```

Frozen after its final status (which statuses are final is not stated; `manual_pending` is followed by an OperationalObservation). An AuditLog entry is written per transition. No UPDATE or DELETE on a finalized row.

---

### LearnerProfile                                                    -- ADDED: goals, terrain, confidence, preferences; TR-047 [GATE] [Phase 1 minimal, 2]

```
LearnerProfile
  id           uuid, PK
  tenantId     uuid, FK → Tenant
  learnerId    uuid, FK → Learner, unique
  goals        json         -- [{ value, originalWording, source }]
  terrain      json         -- [{ value, originalWording, source }]
  confidence   json         -- { value, originalWording, source }
  preferences  json         -- [{ value, originalWording, source }]
  createdAt    timestamp
  updatedAt    timestamp
```

Each value keeps the guest's original wording and a `source` (customer or inferred per the API). Unclear skill is stored as `unresolved` on Learner, never guessed (TR-034, Q10.62). Updated by deterministic merge with source tagging after interviews. Binding to a learner subject before linking is undecided (Q10.32, Q10.63).

---

### IntakeSession                                                     -- ADDED: conversational intake; TR-047 [GATE] [Phase 1-2]

```
IntakeSession
  id                    uuid, PK
  tenantId              uuid, FK → Tenant
  consentRef            string, nullable
  language              enum(en, fr)
  status                enum(in_progress, confirmed)    -- values proposed (Q10.61)
  preferredInstructorId uuid, FK → Instructor, nullable -- ADDED: guest's preferred instructor; TR-048
  createdAt             timestamp
  updatedAt             timestamp
```

`consentRef` is a client-supplied string and cannot enforce CONSENT_REQUIRED for a minor by itself (CR-003, Q10.63). Intake token storage (hash versus signed stateless) is undecided.

---

### IntakeMessage                                                     -- ADDED: one conversational turn; TR-047 [GATE] [Phase 1-2]

```
IntakeMessage
  id         uuid, PK
  tenantId   uuid, FK → Tenant
  intakeId   uuid, FK → IntakeSession
  role       enum(guest, agent)
  content    text                  -- [PCI] free text; screening undecided (Q10.66)
  createdAt  timestamp
  updatedAt  timestamp
```

Index: `(intakeId, createdAt)`.

---

### IntakeMatch                                                       -- ADDED: instructor match with fit reasons; TR-048 [Phase 2]

```
IntakeMatch
  id             uuid, PK
  tenantId       uuid, FK → Tenant
  intakeId       uuid, FK → IntakeSession
  instructorId   uuid, FK → Instructor
  score          decimal
  fitReasons     string[]
  mismatches     string[]
  computedAt     timestamp
  createdAt      timestamp
  updatedAt      timestamp
```

Index: `(intakeId, computedAt)`. Estimate-labeled until measured. Matches are computed from the school's InstructorProfile (tenant-scoped, CR-016).

---

### GroupPlacementRequest                                             -- ADDED: school-composed group placement; TR-049 [Phase 2]

```
GroupPlacementRequest
  id             uuid, PK
  tenantId       uuid, FK → Tenant
  intakeId       uuid, FK → IntakeSession
  lessonTypeId   uuid, FK → LessonType
  preferredDate  date
  age            integer
  abilityLevel   enum(first_timer, beginner, advanced_beginner, intermediate, advanced, expert), nullable   -- null if unresolved
  goals          json
  status         enum(pending, placed, unplaceable)
  createdAt      timestamp
  updatedAt      timestamp
```

Application layer: `lessonTypeId` must reference a LessonType with `groupMode = school_composed`. Placement result (which session or group) has no field yet (API open); composition rules undecided (Q10.34). `age`, `abilityLevel` and `goals` are copied from the gated intake profile (Q10.64).

---

### StudentLessonAssessment                                           -- ADDED: post-lesson student interview; TR-051 [GATE] [Phase 2]

```
StudentLessonAssessment
  id           uuid, PK
  tenantId     uuid, FK → Tenant
  lessonRef    string
  learnerId    uuid, FK → Learner
  respondent   enum(adult, learner)
  answers      json          -- [{ questionId, value, originalWording }]
  status       enum(complete, partial)
  completedAt  timestamp, nullable
  createdAt    timestamp
  updatedAt    timestamp
```

Index: `(tenantId, lessonRef, learnerId)`. Partial answers are kept. Allowed only after lesson completion per import and subject to minor consent. Answers are free text (Q10.66).

---

### InstructorLessonAssessment                                        -- ADDED: post-lesson instructor interview; TR-052 [GATE] [Phase 2]

```
InstructorLessonAssessment
  id            uuid, PK
  tenantId      uuid, FK → Tenant
  lessonRef     string
  learnerId     uuid, FK → Learner, nullable    -- null when the whole-group shortcut is used (Q10.65)
  instructorId  uuid, FK → Instructor
  answers       json, nullable
  status        enum(open, complete)             -- values proposed (Q10.61)
  createdAt     timestamp
  updatedAt     timestamp
```

Index: `(tenantId, instructorId, status)`. Deferral leaves the row `open`. Feeds `InstructorProfile.learnedProfile` for coaching and assignment only, never an evaluation or employment endpoint. Instructor App delivery channel undecided (Q10.37).

---

### NextLessonRecommendation                                          -- ADDED: next-lesson recommendation; TR-053 [GATE] [Phase 2]

```
NextLessonRecommendation
  id            uuid, PK
  tenantId      uuid, FK → Tenant
  learnerId     uuid, FK → Learner
  lessonTypeId  uuid, FK → LessonType
  level         enum(first_timer, beginner, advanced_beginner, intermediate, advanced, expert)
  instructorId  uuid, FK → Instructor
  reasons       json
  inputRefs     json
  status        enum(shown, requested, dismissed)
  createdAt     timestamp
  updatedAt     timestamp
```

Index: `(learnerId, createdAt)`. Deterministic from profile, both assessments and availability; estimate-labeled.

---

### PrivacyRequest                                                    -- ADDED: learner data export or erasure request; TR-054 [Phase 2]

```
PrivacyRequest
  id                  uuid, PK
  tenantId            uuid, FK → Tenant
  learnerId           uuid, FK → Learner
  type                enum(export, erasure)
  requesterId         uuid, FK → User
  status              enum(requested, processing, completed, failed)   -- values proposed (Q10.61)
  retainedCategories  json
  posNotifiedAt       timestamp, nullable
  completedAt         timestamp, nullable
  createdAt           timestamp
  updatedAt           timestamp
```

Index: `(tenantId, learnerId)`. Finds data through DataClassPolicy so no gated class is missed. Retained finance and audit records are listed to the requester; POS-owned records are not erased and the school is notified (`posNotifiedAt`). On erasure completion, POSReference `erasedAt` is set (CR-012). Completion is logged without raw personal data. `requesterId` and `learnerId` assume Phase 3 accounts (Q10.63).

---

### ConsentRecord                                                     -- ADDED: guardian consent for a minor; TR-055 [Phase 2]

```
ConsentRecord
  id              uuid, PK
  tenantId        uuid, FK → Tenant
  learnerId       uuid, FK → Learner
  adultUserId     uuid, FK → User
  consentVersion  string
  grantedAt       timestamp
  withdrawnAt     timestamp, nullable
  createdAt       timestamp
  updatedAt       timestamp
```

Index: `(learnerId, withdrawnAt)`. Gated minor writes return 403 CONSENT_REQUIRED unless an active (not withdrawn) record exists. Withdrawal stops collection and offers PrivacyRequest. Age threshold and wording pending legal review (Q10.40).

---

## Carried Convention Gaps (not changed in this version)

- No `tenantId` on Learner (scoped through Household), Instructor (platform-wide, scoped through InstructorTenant), Certification, BookingNote, PaymentMethod, PackageRedemption, PasswordResetToken, OAuthToken.
- No `updatedAt` on WorkdayHandoff, PasswordResetToken, PackageRedemption, and the immutable AuditLog and ManagerDecision.
- Soft deletes (decisions.md 2026-03-20) are not modelled as a column on booking-related entities; application-layer handling is assumed.

---

## Change Summary

- Tenant.operatingMode, Tenant.realDataEnabled — ADDED — TR-031, TR-030 — additive
- Tenant.waitlistAcceptWindowMinutes — REMOVED — Q10.29, TR-009, TR-046 (decisions 2026-03-26) — destructive
- Learner.skillLevel — CHANGED three-level to six-level — TR-034 — destructive
- Learner.skillLevelSource, GuestCheckout.skillLevelSource — ADDED — TR-034 — additive
- GuestCheckout.skillLevel — CHANGED three-level to six-level — TR-034 — destructive
- Booking.skillLevelAtBooking — CHANGED three-level to six-level — TR-034 — destructive
- LessonType.skillLevels — CHANGED three-level to six-level — TR-034 — destructive
- LessonType.groupMode — ADDED — TR-049 — additive
- GroupSession.programId — ADDED — TR-056 — additive
- Payment tip unique partial index — CHANGED, excludes failed status — CR-007 — additive (index replaced)
- POSReference, PosConnection — ADDED (Phase 1) — TR-031, TR-035, TR-050, CR-012 (erasedAt) — additive
- DataClassPolicy, PolicyRule — ADDED (Phase 1) — TR-030, TR-032 — additive
- ImportBatch, ImportFlag — ADDED (Phase 1) — TR-035, TR-036 — additive
- OperationalIssue — ADDED (Phase 1) — TR-037 — additive
- ResolutionPlan, ProposedAction, ActionValidation — ADDED (Phase 1) — TR-038, TR-032 — additive
- AgentConversation, AgentMessage — ADDED [GATE] (Phase 1 provisional) — TR-039 — additive
- OperationalObservation — ADDED [GATE] (Phase 1-2) — TR-040 — additive
- IntakeSession, IntakeMessage — ADDED [GATE] (Phase 1-2) — TR-047, TR-048 — additive
- LearnerProfile — ADDED [GATE] (Phase 1-2) — TR-047, TR-035 — additive
- TenantMembership — ADDED (Phase 2) — TR-041 — additive
- ManagerDecision, ActionOutcome — ADDED (Phase 2) — TR-042, TR-043 — additive
- WaitlistOffer — ADDED (Phase 2 provisional), 2-hour CHECK — TR-046, Q10.29 — additive
- InstructorProfile — ADDED, tenant-scoped, learnedProfile [GATE] (Phase 2) — TR-048, CR-016 — additive
- IntakeMatch, GroupPlacementRequest — ADDED (Phase 2) — TR-048, TR-049 — additive
- StudentLessonAssessment, InstructorLessonAssessment, NextLessonRecommendation — ADDED [GATE] (Phase 2) — TR-051, TR-052, TR-053 — additive
- PrivacyRequest, ConsentRecord — ADDED (Phase 2) — TR-054, TR-055 — additive

---

## Migration Notes

- Tenant.waitlistAcceptWindowMinutes — verify every row is 120, then DROP COLUMN; any other value is lost — risk: low
- Learner.skillLevel — remap three-level enum to six-level; mapping undefined (Q10.10), blocks the migration — risk: high
- GuestCheckout.skillLevel, Booking.skillLevelAtBooking — same remap; Booking value is a historical snapshot, so a remap rewrites history — risk: high
- LessonType.skillLevels — remap each array element; decide whether one old level expands to several new levels — risk: high
- Learner.skillLevelSource — backfill existing rows; value for existing skill levels undecided (`customer` would be a guess) — risk: med
- Tenant.operatingMode — ADD NOT NULL, backfill existing tenants to `booking_core` — risk: low
- TenantMembership — backfill one row per User with non-null tenantId; User.tenantId kept (Q10.67) — risk: low
- Payment tip unique partial index — DROP v0.7 index, CREATE with `status <> 'failed'`; no duplicate check needed because the new predicate is narrower — risk: low
- Imported POS records — no migration; storage undecided (Q10.12) and the constraints above are unchanged — risk: high if relaxed later, because relaxing NOT NULL on Booking and Learner affects existing code paths
