# Slopebook — Open Questions

**Document Status:** Draft — Review Pipeline Run 9
**Last Updated:** 2026-04-04
**Active open questions:** 5
**Total resolved:** 62 (OQ-001 through OQ-066, excluding OQ-062 through OQ-066 which remain active)

---

## This Run
- Added: 0 new questions
- Resolved: 2 questions (OQ-059 — nullable bookingId approach confirmed; OQ-061 — tips in scope confirmed)
- Cleaned up: OQ-063 block had tip resolution text misplaced there from Run 8 manual edit; moved to OQ-061 resolution; OQ-063 real-time push question remains unresolved

---

## Active Open Questions

---

### OQ-062 — Password reset: in scope for P0?

**Status:** Unresolved
**Raised:** 2026-04-04
**Source:** critique-proposed.md (Run 8, Significant Gaps), tech-requirements-proposed.md (TR gap #18), api-design-proposed.md
**Blocks:** api-design-proposed.md password reset endpoints, PasswordResetToken entity in data-model-proposed.md, no UC or screen defined

**Question:** TR gap #18 (Run 8) identified that no password reset flow exists in any design document. api-design-proposed.md added `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` as new endpoints. data-model-proposed.md added a `PasswordResetToken` entity. But no use case, no screen in asset-list-proposed.md, and no uc-registry item exist for this flow. Is password reset required for Alpha (P0)?

**Why it matters:** Without password reset, any account with a forgotten password is permanently locked. If Starter-tier users have no admin to reset for them, this is a critical retention issue. If it is P0, a UC and screen must be added before development.

**Options:**
1. P0: Add UC-023a, a password-reset screen to asset-list, and add to uc-registry.
2. P1: Mark password reset as Beta deliverable; add to uc-registry P1 section; remove PasswordResetToken from P0 data-model-proposed.md (keep endpoints as no-op stubs if needed).
3. Manual only for Alpha: ops resets passwords manually; auto-reset deferred to GA.

---

### OQ-063 — Real-time push mechanism for Admin Schedule View

**Status:** Unresolved
**Raised:** 2026-04-04
**Source:** tech-requirements-proposed.md TR-014 (gap #8)
**Blocks:** TR-014, admin/Schedule View screen (UC-014), asset-list-proposed.md Admin / Schedule View

**Question:** TR-014 requires "real-time updates as bookings arrive" for the admin schedule view. The current spec says "SSE vs WebSocket vs polling (push mechanism TBD)." No endpoint or protocol is defined.

**Why it matters:** The choice (SSE, WebSocket, or polling) affects infrastructure (load balancer config, persistent connections), the client implementation, and whether it is feasible for P0 vs P1. Polling is simplest but may introduce unacceptable lag on opening day.

**Options:**
1. Server-Sent Events (SSE): stateless server side; works through HTTP/2; simple client implementation
2. WebSocket: bidirectional; more complex infrastructure; more appropriate if instructors also need push (e.g. new booking notifications)
3. Polling: simplest; 5–30s interval; acceptable latency for admin use case; no infrastructure change needed

---

### OQ-064 — PCI DSS compliance scope (SAQ type)

**Status:** Unresolved
**Raised:** 2026-04-04 (first surfaced in Run 7 critique, not yet formalized as OQ)
**Source:** critique-proposed.md (Run 8, Domain Risks; Run 7, Domain Risks)
**Blocks:** security architecture, processor integration spec, cardholder data environment boundary

**Question:** Slopebook uses Stripe Elements and Shift4 embed for card capture. These reduce PCI scope significantly, but the exact SAQ applicable to Slopebook's architecture is nowhere documented. SAQ A, SAQ A-EP, and SAQ D have very different audit requirements. If any merchant-side token handling exists (e.g. processorTokenId in PaymentMethod), scope may expand to SAQ A-EP or SAQ D.

**Why it matters:** If compliance scope is wrong at launch, remediation can delay production deployment. Must be confirmed before building payment infrastructure.

**Options:**
1. SAQ A: card data never touches Slopebook servers; all via processor JS SDK and iframe; processorTokenId is a reference token, not card data
2. SAQ A-EP: Slopebook serves the payment page (even with iframe); more stringent than SAQ A
3. Engage Stripe/Shift4 compliance team before Alpha to confirm SAQ type

---

### OQ-065 — Auto-completion scheduler interval

**Status:** Unresolved
**Raised:** 2026-04-04
**Source:** tech-requirements-proposed.md TR-013a, decisions.md 2026-03-29
**Blocks:** TR-013a implementation (scheduler job frequency)

**Question:** TR-013a describes a scheduled job that runs every "N minutes (interval TBD)" to auto-complete bookings at +2h past endAt. What should the interval be? A long interval increases the delay between lesson end and review email delivery. A very short interval adds database load during peak booking windows.

**Why it matters:** The booking.completed event triggers the post-lesson review email. A 15-minute scheduler interval means up to 15 minutes of delay for the email. For a ski resort context where instructors often run consecutive lessons, this gap may matter.

**Options:**
1. 5-minute interval: near real-time; low additional DB load; recommended
2. 15-minute interval: acceptable; matches the soft-hold TTL for consistency
3. Event-driven via booking endAt timestamp: most precise; requires a job queue or delayed-event system (more complex)

---

### OQ-066 — PATCH /api/v1/bookings/:id/reassign payload spec

**Status:** Unresolved
**Raised:** 2026-04-04
**Source:** api-design-proposed.md — Booking Engine; critique-proposed.md (Run 8, Significant Gaps)
**Blocks:** TR-015, api-design-proposed.md PATCH /api/v1/bookings/:id/reassign

**Question:** api-design-proposed.md adds `PATCH /api/v1/bookings/:id/reassign` but documents no request payload and no response payload. At minimum `instructorId` is required. Should it also accept `reason` (for audit log) and/or `notifyStudent: boolean`? What does the response contain?

**Why it matters:** Without a documented payload, the endpoint cannot be implemented. The audit log entry for a reassignment should capture who the booking was moved from and why — this may require additional fields not in the current Booking entity.

**Options:**
1. Minimal: `{ "instructorId": "uuid" }` — reason inferred from AuditLog context
2. With audit fields: `{ "instructorId": "uuid", "reason": "string | null", "notifyStudent": "boolean" }` — explicit audit trail
3. Reuse PATCH /api/v1/bookings/:id with role-gated instructorId update — fewer endpoints

---

## Resolved Questions

| # | Title | Decision | Date |
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
| OQ-017 | Electronic waiver storage layer | Smartwaiver. Learner.waiverSignedAt, waiverVersion, waiverToken. | 2026-03-26 |
| OQ-018 | Tips scope | No tips in booking payload. Superseded by OQ-043 and OQ-061. | 2026-03-26 |
| OQ-019 | Lesson packages | Confirmed Beta deliverable. LessonPackage and PackageRedemption entities. | 2026-03-26 |
| OQ-020 | Skill level: self-reported or validated | Self-reported. Admin override audited via AuditLog. | 2026-03-26 |
| OQ-021 | Google Calendar sync | Deferred to v1.5. OAuthToken entity removed from v1.0 schema. | 2026-03-26 |
| OQ-022 | KMS selection | AWS KMS. Envelope encryption with per-tenant DEK. | 2026-03-26 |
| OQ-023 | Booking payload tipAmountCents | tipAmountCents removed. See OQ-043. | 2026-03-26 |
| OQ-024 | paymentCredentials JSON schema | Starter = Stripe only. Shift4 requires Growth+. Three credential schemas. | 2026-03-26 |
| OQ-025 | Lesson package expiry | Expired credits forfeited. Admin can extend expiresAt manually. | 2026-03-26 |
| OQ-026 | Right-to-erasure PII scope | Full scope defined per entity. Smartwaiver deletion: OQ-045. | 2026-03-26 |
| OQ-027 | Platform fee on packages | 1.5% at package purchase time. | 2026-03-26 |
| OQ-028 | InstructorRating visibility | Internal-only within tenant. Platform-admin moderation only. | 2026-03-26 |
| OQ-029 | Waiver provider | Smartwaiver. Provides API and mobile-compatible embed. | 2026-03-26 |
| OQ-030 | French Language Suppression on Starter Tier | FR available on all tiers including Starter. | 2026-03-28 |
| OQ-031 | GroupSession School-Block Billing | Deferred; Payment.groupSessionId removed. | 2026-03-28 |
| OQ-032 | Parental Consent Fields | Age + skill level required for all bookings. Under-18 blocked without consent. | 2026-03-28 |
| OQ-033 | Guest-Checkout Self-Cancellation | No self-service cancel. Guests see ContactSchoolCard. | 2026-03-28 |
| OQ-034 | Waitlist Priority Ordering | FIFO default; admin-adjustable via position field; exhaustion = nothing. | 2026-03-28 |
| OQ-035 | Processor Switch Mid-Season | In-flight transactions resolved manually. | 2026-03-28 |
| OQ-036 | Learner Deletion with Active Bookings | Block deletion; return 409 LEARNER_HAS_ACTIVE_BOOKINGS. | 2026-03-28 |
| OQ-037 | Soft-Hold Expiry During Account Creation | Visible 15-min clock throughout checkout; silently expire after TTL. | 2026-03-28 |
| OQ-038 | Group Session Entity-Level Cancellation | Cascade cancel all enrolled bookings with automatic refunds. | 2026-03-28 |
| OQ-039 | Package-Redeemed Booking Cancellation | Policy applies; within window reinstates credit; outside forfeits. | 2026-03-28 |
| OQ-040 | Smartwaiver API Outage at Check-In | Typed-name fallback (deferred with Smartwaiver integration per OQ-052). | 2026-03-28 |
| OQ-041 | Cross-Tenant Instructor Double-Booking | No cross-tenant conflict detection in v1.0. | 2026-03-28 |
| OQ-042 | Pricing Floors and Seasonal Rate Cards | Out of scope for v1.0 GA. UC-042 removed. | 2026-03-28 |
| OQ-043 | Tips | No tips in booking payload (superseded — tips are now in scope as post-lesson optional payment per OQ-061 / decisions.md 2026-04-04). | 2026-03-27 |
| OQ-044 | CASL Classification of Weather Emails | Transactional; no CASL commercial classification. | 2026-03-28 |
| OQ-045 | Smartwaiver Document Deletion (Right-to-Erasure) | Not in scope for v1.0. | 2026-03-28 |
| OQ-046 | processorTokenId PCI-DSS Protection | Must be encrypted at rest via AWS KMS envelope encryption. | 2026-03-28 |
| OQ-047 | Payment Atomicity: Booking Write Failure After Capture | 3 DB-write retries; on 3rd failure void payment. | 2026-03-28 |
| OQ-048 | Solo Adult Self-Learner Profile | Self-Learner auto-created atomically at account registration. | 2026-03-28 |
| OQ-049 | Learner.waiverToken Generation Timing | At booking confirmation (deferred with OQ-052 for P0). | 2026-03-28 |
| OQ-050 | Instructor New-Booking Notification | Email notification; not required for P0. | 2026-03-28 |
| OQ-051 | UC-031a Group Cascade Cancel Refund Policy | Company-initiated cancellation always issues full refund regardless of CancellationPolicy. | 2026-03-28 |
| OQ-052 | Smartwaiver Integration API Spec | Deferred to later phase. Waiver assumed complete for P0. waiverToken null in P0. | 2026-03-28 |
| OQ-053 | Payment 3-Retry Idempotency | Retry DB write only; payment captured once; idempotency key scoped to reservationId. | 2026-03-28 |
| OQ-054 | Admin Walk-Up Booking: GuestCheckout or Ad-Hoc Learner? | Admin creates a User account and Learner profile at the window. Walk-up customers get full accounts. | 2026-03-29 |
| OQ-055 | Booking.status = in_progress: Trigger Mechanism | Remove `in_progress` from Booking enum. checkedInAt records check-in; status goes confirmed → completed or no_show. | 2026-03-29 |
| OQ-056 | Payment Void Failure: Compensation State Policy | 4 void retries at 100ms intervals. If all fail, silently set Payment.status = void_pending for ops review. | 2026-03-29 |
| OQ-057 | GuestCheckout Language Collection: Required Field or Default? | UI language selector defaults to browser geolocation. User's browser language matches their transaction language. | 2026-03-29 |
| OQ-058 | Instructor-Initiated Booking Cancellation | Instructors have admin-level access to their own lessons and can cancel them directly. | 2026-03-29 |
| OQ-059 | Payment.bookingId constraint vs P1 package purchases | nullable bookingId + lessonPackageId FK on Payment entity. No separate PackagePayment entity. decisions.md 2026-03-29 and 2026-04-04 authoritative. data-model-proposed.md v0.6 implementation confirmed. | 2026-04-04 |
| OQ-060 | Booking auto-completion: fallback if instructor never marks complete | Auto-complete via scheduled job at endAt + 2 hours. booking.completed event fires; earnings calculated; review email sent. | 2026-03-29 |
| OQ-061 | Tips: OQ-043 resolution conflicts with decisions.md | Tips are in scope for v1.0 as optional post-lesson payment. decisions.md 2026-04-04 is authoritative. OQ-043 superseded. Payment.paymentType = 'tip' confirmed. POST /api/v1/bookings/:id/tip confirmed. Unique partial index on (bookingId, paymentType) WHERE paymentType = 'tip' added in data-model-proposed.md v0.7. | 2026-04-04 |
