# Slopebook — Open Questions (Proposed Update)

**Document Status:** Draft — Run 6
**Last Updated:** 2026-03-28
**Author:** Open-Questions-Tracker Agent
**Pipeline Run:** Run 6 (2026-03-28)

---

## This Run

| Category | Count | OQ Numbers |
|---|---|---|
| Questions added | 5 | OQ-054 through OQ-058 |
| Questions resolved | 3 | OQ-051, OQ-052, OQ-053 |
| Questions flagged as stale | 0 | — |

### Questions Added (OQ-054 – OQ-058)
All 5 new questions were surfaced by the Run 6 critique (critique-proposed.md CR-001 through CR-004 and Significant Gaps). OQ-001 through OQ-053 are all resolved as of 2026-03-28.

### Questions Resolved This Run
OQ-051, OQ-052, OQ-053 — resolved by user on 2026-03-28 and reflected in Run 6 generate outputs.

### Stale Questions
None.

---

## Urgency Key

| Level | Meaning |
|---|---|
| **BLOCKER** | Must be resolved before Alpha development begins (Q2 2026). |
| **HIGH** | Must be resolved before Beta (Q3 2026). |
| **MEDIUM** | Must be resolved before v1.0 GA (Q4 2026). |
| **LOW** | Can wait until after v1.0 GA. |

---

## Active Open Questions

---

### OQ-054 — Admin Walk-Up Booking: GuestCheckout or Ad-Hoc Learner?

**Question:** UC-021 allows an admin to create a manual booking for a walk-up customer with no account, but the Booking CHECK constraint requires either `learnerId` or `guestCheckoutId` to be non-null. When a walk-up customer has no prior account or GuestCheckout, what is the correct path: (a) admin creates a GuestCheckout ad-hoc via `POST /api/v1/guest-checkouts` before creating the booking, or (b) `POST /api/v1/bookings` accepts an inline `adminGuestDetails` payload that creates the GuestCheckout atomically?

**Why it matters:** Without a defined path, admin manual booking for first-time walk-up customers violates the Booking CHECK constraint and will fail at the DB layer. This is a P0 Alpha flow (UC-021) that must work on day one for pilot schools.

**Urgency:** BLOCKER
**Affected Items:** UC-021, TR-021, `POST /api/v1/bookings`, `Booking` CHECK constraint
**Source:** critique-proposed.md CR-002 (Run 6)
**Status:** Resolved
**Decisions:** Admin creates an account and a learner profile at the window.

---

### OQ-055 — Booking.status = in_progress: Trigger Mechanism

**Question:** The `in_progress` status value exists in the Booking enum but no use case or TR defines when it is set. Is it (a) set when `checkedInAt` is populated by UC-010 (check-in), (b) set by a scheduled job at lesson start time, or (c) never set in P0 and used only in group session flows? Data-model-proposed.md v0.5 documents both options (a) and (b) as possible.

**Why it matters:** Multiple UCs reference `in_progress` as a valid precondition (UC-012, UC-013). If it is never set, those preconditions are dead. If it is set at check-in, the status transition must be added to TR-010. If it is a scheduled job, that job must be defined.

**Urgency:** BLOCKER
**Affected Items:** `Booking.status`, UC-010, UC-012, UC-013, TR-010, TR-013
**Source:** critique-proposed.md CR-003 (Run 6)
**Status:** Resolved.
**Decision:** Remove 'in_progress' from the Booking enum

---

### OQ-056 — Payment Void Failure: Compensation State Policy

**Question:** TR-003/TR-004 specify voiding a captured payment when all 3 DB write retries fail. Data-model-proposed.md v0.5 adds `Payment.status = void_pending` as a compensation state. What is the retry policy for the void: (a) how many retry attempts, (b) what is the retry interval, (c) who is alerted and after how long, and (d) what is the final escalation path if the void cannot be completed after N attempts?

**Why it matters:** A captured payment with no booking and an unresolvable void is direct financial liability. At Alpha scale (2 pilot schools), this may be recoverable manually, but a defined policy is needed before any real transactions run.

**Urgency:** BLOCKER
**Affected Items:** `Payment.status`, TR-003, TR-004, `POST /api/v1/payments/:id/refund`
**Source:** critique-proposed.md CR-004 (Run 6)
**Status:** Resolved
**Decision:** 4 retries, 100ms apart. If unresolved silently void transaction.


---

### OQ-057 — GuestCheckout Language Collection: Required Field or Default?

**Question:** GuestCheckout.preferredLanguage exists and is used to send confirmation emails in the guest's language. UC-003 does not include a language selection step, and no default is specified in the UC. Data-model-proposed.md v0.5 adds `DEFAULT 'en'` as a DB-level default. Is a language selector required in the guest checkout flow, or is defaulting to the tenant's `defaultLanguage` (or browser Accept-Language header) the correct approach?

**Why it matters:** Guests booking at a Francophone resort (defaultLanguage = fr) who receive English confirmations will generate support requests. The EN default in v0.5 may be wrong for FR-primary tenants. This is a bilingual product with a Canadian market focus.

**Urgency:** HIGH
**Affected Items:** `GuestCheckout.preferredLanguage`, UC-003, TR-003, asset-list Authentication Gate screen
**Source:** critique-proposed.md Significant Gaps (Run 6)
**Status:** Resolved
**Decision:** Website UI should have a language selection that should default by geolocation of browser.  User default should match the browser when commiting transactions.

---

### OQ-058 — Instructor-Initiated Booking Cancellation

**Question:** No use case or API endpoint is defined for an instructor cancelling one of their own assigned bookings (e.g., instructor calls in sick). UC-006 covers customer and admin cancellation only. When an instructor needs to cancel, must an admin always act on their behalf, or should instructors have a self-service cancel capability with automatic student notification and admin alert?

**Why it matters:** Instructors calling in sick is a routine operational scenario at any ski school, especially in Alpha pilots. Requiring admin action for every instructor-initiated cancellation adds operational friction and support volume from day one. This is different from admin reassignment (UC-015), which assumes the instructor is available.

**Urgency:** HIGH
**Affected Items:** UC-006, `PATCH /api/v1/bookings/:id/cancel`, Notification Service, UC-015
**Source:** critique-proposed.md Significant Gaps (Run 6)
**Status:** Resolved
**Decision:** Single instructors should have admin status for thier lessons.

---

## Resolved Questions

| # | Title | Decision (summary) | Date |
|---|---|---|---|
| OQ-001 | French translation priority | EN/FR on customer + instructor at Alpha; admin + operator at Beta. | 2026-03-25 |
| OQ-002 | Minimum viable Starter tier | 1 instructor, 100 bookings/month. | 2026-03-25 |
| OQ-003 | Native iOS app | PWA sufficient for Alpha and Beta. | 2026-03-25 |
| OQ-004 | Cross-processor card vault | Processor-managed vault per tenant; PaymentMethod.isValid = false on switch. | 2026-03-25 |
| OQ-005 | Shift4 merchant model | Starter = Stripe only; Growth+ can use Shift4 direct MID. | 2026-03-25 |
| OQ-006 | Instructor payroll | Report-only with Workday handoff. Direct deposit deferred to v2.0. | 2026-03-25 |
| OQ-007 | Minimum learner age | 5 years. Under-18 requires parental consent. | 2026-03-25 |
| OQ-008 | Electronic waiver storage | Third-party e-signature tool (Smartwaiver per OQ-029). | 2026-03-26 |
| OQ-009 | Waitlist notification window | Configurable per tenant; default 120 min. | 2026-03-26 |
| OQ-010 | Group lesson capacity | Platform default → LessonType.maxCapacity → GroupSession.maxCapacity. | 2026-03-26 |
| OQ-011 | Soft-hold TTL | 15 minutes, platform constant. | 2026-03-26 |
| OQ-012 | GuestCheckout data retention | Admin tools for right-to-erasure; full PII scope per OQ-026. | 2026-03-26 |
| OQ-013 | Group lesson instructor ratio | Three-level hierarchy: platform → LessonType → GroupSession override. | 2026-03-26 |
| OQ-014 | Cancellation policy default | Default = non-refundable. Seeded atomically at tenant creation. | 2026-03-26 |
| OQ-015 | InstructorTenant earnings visibility | Full tenant isolation. No cross-tenant visibility. | 2026-03-26 |
| OQ-016 | Notification provider | SendGrid for email. CASL opt-out via suppression list. | 2026-03-26 |
| OQ-017 | Electronic waiver storage layer | Smartwaiver (OQ-029). Learner.waiverSignedAt, waiverVersion, waiverToken. | 2026-03-26 |
| OQ-018 | Tips scope | Tips removed per OQ-043. | 2026-03-26 |
| OQ-019 | Lesson packages | Confirmed Beta deliverable. LessonPackage and PackageRedemption entities. | 2026-03-26 |
| OQ-020 | Skill level: self-reported or validated | Self-reported. Admin override audited via AuditLog. | 2026-03-26 |
| OQ-021 | Google Calendar sync | Deferred to v1.5. OAuthToken entity removed from v1.0 schema. | 2026-03-26 |
| OQ-022 | KMS selection | AWS KMS. Envelope encryption with per-tenant DEK. | 2026-03-26 |
| OQ-023 | Booking payload tipAmountCents | tipAmountCents removed. See OQ-043. | 2026-03-26 |
| OQ-024 | paymentCredentials JSON schema | Starter = Stripe only. Shift4 requires Growth+. | 2026-03-26 |
| OQ-025 | Lesson package expiry | Expired credits forfeited. Admin can extend expiresAt. | 2026-03-26 |
| OQ-026 | Right-to-erasure PII scope | Full scope defined per entity. Smartwaiver: OQ-045. | 2026-03-26 |
| OQ-027 | Platform fee on packages | 1.5% at package purchase time. | 2026-03-26 |
| OQ-028 | InstructorRating visibility | Internal-only within tenant. | 2026-03-26 |
| OQ-029 | Waiver provider | Smartwaiver. | 2026-03-26 |
| OQ-030 | French Language Suppression on Starter Tier | FR available all tiers. | 2026-03-28 |
| OQ-031 | GroupSession School-Block Billing | Deferred; Payment.groupSessionId removed. | 2026-03-28 |
| OQ-032 | Parental Consent Fields | Age + skill level required; under-18 blocked without consent. | 2026-03-28 |
| OQ-033 | Guest-Checkout Self-Cancellation | No self-service cancel. ContactSchoolCard shown. | 2026-03-28 |
| OQ-034 | Waitlist Priority Ordering | FIFO default; admin-adjustable; exhaustion = nothing. | 2026-03-28 |
| OQ-035 | Processor Switch Mid-Season | In-flight transactions resolved manually. | 2026-03-28 |
| OQ-036 | Learner Deletion with Active Bookings | Block; return 409. | 2026-03-28 |
| OQ-037 | Soft-Hold Expiry During Account Creation | Visible 15-min clock; silently expire. | 2026-03-28 |
| OQ-038 | Group Session Entity-Level Cancellation | Cascade cancel with automatic refunds. | 2026-03-28 |
| OQ-039 | Package-Redeemed Booking Cancellation | Policy applies; in-window reinstates credit. | 2026-03-28 |
| OQ-040 | Smartwaiver API Outage | Typed-name fallback after 15s (deferred with OQ-052). | 2026-03-28 |
| OQ-041 | Cross-Tenant Instructor Double-Booking | No cross-tenant detection in v1.0. | 2026-03-28 |
| OQ-042 | Pricing Floors and Seasonal Rate Cards | Out of scope v1.0. | 2026-03-28 |
| OQ-043 | tipAmountCents contradiction | No tips. Fields removed. | 2026-03-27 |
| OQ-044 | CASL Classification of Weather Emails | Transactional. No CASL issue. | 2026-03-28 |
| OQ-045 | Smartwaiver Document Deletion | Not in scope v1.0. | 2026-03-28 |
| OQ-046 | processorTokenId PCI-DSS Protection | Must be encrypted at rest via AWS KMS. | 2026-03-28 |
| OQ-047 | Payment Atomicity: Booking Write Failure | 3-retry DB write; void on 3rd failure. | 2026-03-28 |
| OQ-048 | Solo Adult Self-Learner Profile | Self-Learner auto-created at registration. | 2026-03-28 |
| OQ-049 | Learner.waiverToken Generation Timing | Booking confirmation (deferred with OQ-052). | 2026-03-28 |
| OQ-050 | Instructor New-Booking Notification | Email notification; not P0. | 2026-03-28 |
| OQ-051 | UC-031a Group Cascade Cancel Refund Policy | Company-initiated cancel = full refund always. | 2026-03-28 |
| OQ-052 | Smartwaiver Integration API Spec | Deferred to later phase; waiver assumed complete for P0. | 2026-03-28 |
| OQ-053 | Payment 3-Retry Idempotency | Retry DB write only; payment captured once. | 2026-03-28 |
