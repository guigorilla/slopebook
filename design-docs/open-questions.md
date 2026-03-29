# Slopebook — Open Questions

**Document Status:** Promoted — Run 6
**Last Updated:** 2026-03-29
**Active open questions:** 0
**Total resolved:** 58 (OQ-001 through OQ-058)

---

## Active Open Questions

None. All OQ-001 through OQ-058 are resolved.

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
| OQ-018 | Tips scope | No tips. Superseded by OQ-043. | 2026-03-26 |
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
| OQ-043 | Tips | No tips. Payment.tipAmountCents and Tenant.tipsEnabled removed. | 2026-03-27 |
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
