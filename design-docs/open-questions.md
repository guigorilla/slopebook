# Slopebook — Open Questions (Proposed Update)

**Document Status:** Draft — Run 2
**Last Updated:** 2026-03-26
**Author:** Open-Questions-Tracker Agent
**Pipeline Run:** Run 2 (2026-03-26)

All 22 original open questions (OQ-001 through OQ-022) are resolved. This document archives those decisions and surfaces new open questions raised by the Run 2 critique that have not yet been resolved.

---

## Urgency Key

| Level | Meaning |
|---|---|
| **BLOCKER** | Must be resolved before Alpha development begins (Q2 2026). Engineering is blocked without an answer. |
| **HIGH** | Must be resolved before Beta (Q3 2026). Schema or architecture choices depend on it. |
| **MEDIUM** | Must be resolved before v1.0 GA (Q4 2026). Can be deferred past Beta but must land before launch. |
| **LOW** | Can wait until after v1.0 GA or is informational. |

Alpha target: Q2 2026. Beta target: Q3 2026. v1.0 GA target: Q4 2026.

---

## Active Open Questions

---

### OQ-023 — Booking API Payload: `tipAmountCents`, `reservationId`, and `sessionToken` Field Specification

**Question:** What are the exact new fields required in the `POST /api/v1/bookings` payload to support the soft-hold mechanism and tip submission? Specifically: are the field names `tipAmountCents`, `reservationId`, and `sessionToken`? What are their types, constraints, and nullability rules?

**Why it matters:** `api-design.md` currently contains none of these fields. The `SlotReservation` entity notes explicitly state that `POST /api/v1/bookings` MUST include the slot reservation ID and session token, but these fields are undocumented in the API contract. Without them, the booking endpoint cannot honour the soft-hold mechanism (a hard Alpha requirement) or record tip amounts (resolved in scope by OQ-018). Engineering teams building the booking endpoint and the checkout UI have no authoritative field spec to implement against, creating a high risk of inconsistent parallel implementations.

**Urgency:** BLOCKER

**Affected Items:** `POST /api/v1/bookings` in `api-design.md`, `SlotReservation` entity, `Payment.tipAmountCents`, `Tenant.tipsEnabled`, TR-F-002, TR-F-004, TR-F-033, CRT2-H-001, UC-003, UC-004, CUST-005, DS-TIP-001

**Status:** Resolved
**Decision:**tipAmountCents removed from booking payload. Tip and rating 
submitted via a separate post-lesson flow. New use case to be written by 
product-lead on next pipeline run.

POST /api/v1/bookings payload additions:
- tipAmountCents: integer, nullable, must be >= 0 if present
- reservationId: uuid, nullable, references soft-hold record if provided
- sessionToken: string, nullable, expires after 15 minutes
**Date:**2026-03-26

---

### OQ-024 — `paymentCredentials` JSON Schema for Each Processor/Tier Combination

**Question:** What are the exact field names and required fields for `Tenant.paymentCredentials` for each valid processor/tier combination? Specifically: (a) Stripe/any tier; (b) Shift4/Growth-Pro-Enterprise (direct merchant); (c) Shift4/Starter (platform MID — is any tenant-specific data stored at all)?

**Why it matters:** The `paymentModel` field has been added to `Tenant` (OQ-005 dual Shift4 routing), but the JSON schema inside `paymentCredentials` is informal and undocumented as a contract. The Payment Service abstraction layer must extract the correct credential fields to route a charge, and the operator onboarding UI (FORM-013) must validate completeness before saving. Without a defined schema, the routing predicate cannot be implemented reliably, and the AWS KMS encryption envelope cannot be designed with confidence that all required fields are covered. For the Starter/platform-MID case, it is also unclear whether Slopebook's compliance obligations as a payment facilitator require any tenant-level KYC or sub-merchant registration data to be stored.

**Urgency:** BLOCKER

**Affected Items:** `Tenant.paymentCredentials`, `Tenant.paymentModel`, `Tenant.paymentProcessor`, `api-design.md` Payment Service, TR-F-017, TR-F-032, OQ-005, OQ-022, CRT2-H-002, CRT2-L-002, FORM-013, OPER-004, UC-031

**Status:** Resolved
**Decision:** Three credential schemas defined:

Stripe/any tier:
  - secretKey: string, required
  - webhookSecret: string, required

Shift4/Growth+:
  - model: "direct", required
  - apiKey: string, required
  - merchantId: string, required
  - webhookSecret: string, required

Shift4/Starter: NOT SUPPORTED in v1.0.
Starter tier is Stripe-only. Shift4 requires Growth tier minimum.
No platform MID or PayFac model in v1.0 — deferred to v1.5.

All fields encrypted via AWS KMS. Schema is the encryption contract.
**Date:** 2026-03-26

---

### OQ-025 — Lesson Package Expiry: Forfeiture, Extension, or Auto-Refund?

**Question:** When a `LessonPackage` expires (`LessonPackage.expiresAt` exceeded) with unused credits remaining, what happens to those credits? Are they silently forfeited, can a school admin manually extend the expiry, or does the system automatically initiate a partial refund for unused credits?

**Why it matters:** `LessonPackage` has a `validityDays` field and an `expiresAt` timestamp, but no expiry behaviour is defined anywhere in the data model or tech-requirements. A guest who purchases a 5-lesson package, uses 3 lessons, and then experiences a school closure or illness needs a clearly defined outcome. The behaviour determines whether `PackageRedemption` records need a `refundEligible` flag, whether `Payment` needs a partial-refund path for package expiry events, and what admin UI controls (if any) are needed for manual extension.

**Urgency:** HIGH

**Affected Items:** `LessonPackage.expiresAt`, `LessonPackage.remainingCount`, `LessonPackage.status`, `PackageRedemption`, `Payment`, TR-F-113, TR-F-116, CRT2-H-003, OQ-019, UC-013, ADMIN-PKG-001

**Status:** Resolved
**Decision:** The unused lessons are quietly forfeited, but an admin can manually extend the expire date.
**Date:** 2026-03-26

---

### OQ-026 — Right-to-Erasure: Complete PII Scope Definition

**Question:** When a `GuestCheckout` record is pseudonymised via the right-to-erasure admin tool, what is the complete set of entities and fields containing PII linked to that guest, and what is the disposition of each (delete, pseudonymise, or retain-with-justification)? In particular: (a) `Payment` records and the `guestCheckoutId` FK — retained or anonymised? (b) `WaitlistEntry.guestEmail` for unauthenticated waitlist signups — never in `GuestCheckout`; does the erasure tool cover it? (c) `BookingNote` records that may contain personal references — in scope? (d) `AuditLog.metadata` JSON blobs that may contain email addresses — retained on what legal basis?

**Why it matters:** TR-F-120 specifies pseudonymising `GuestCheckout` personal data fields, but `Payment` records are financial records potentially required for tax and audit retention. The erasure tool as specified would miss `WaitlistEntry.guestEmail` entirely — a GDPR Article 17 and PIPEDA compliance gap. Without a complete scope definition, the erasure tool provides incomplete coverage and exposes Slopebook and its resort tenants to regulatory liability.

**Urgency:** HIGH

**Affected Items:** `GuestCheckout`, `Payment.guestCheckoutId`, `WaitlistEntry.guestEmail`, `BookingNote`, `AuditLog.metadata`, `Booking.guestCheckoutId`, TR-F-119, TR-F-120, OQ-012, CRT2-H-009, UC-004, ADMIN right-to-erasure tool

**Status:** Resolved
**Decision:** Right-to-erasure scope and disposition per entity:

GuestCheckout:
  - firstName, lastName, email, phone → pseudonymise to "ERASED"
  - All other fields → retain

Payment:
  - guestCheckoutId FK → nullify (set to null)
  - All financial fields → retain (tax retention 7yr US / 6yr CA)
  - Legal basis: tax and financial reporting obligations

WaitlistEntry:
  - guestEmail → DELETE the record entirely
  - Index guestEmail for efficient lookup
  - Auto-purge expired/fulfilled entries after 90 days (scheduled job)
  - NOTE: erasure tool must explicitly cover this entity — gap confirmed

BookingNote:
  - learnerId / guestCheckoutId FK → replace with ERASED_GUEST placeholder
  - Note content → retain (operational value, identity removed)
  - Auto-purge notes older than 2 years

AuditLog:
  - Retain in full — do not modify
  - Legal basis: fraud prevention, security, financial compliance
  - Maximum retention: 3 years
  - Going forward: log userId only in metadata, never raw email addresses
  - Document retention basis in privacy policy and resort tenant DPA

**Date:** 2026-03-26

---

### OQ-027 — Platform Fee Calculation on Package Purchases and Package-Redeemed Bookings

**Question:** Does the 1.5% Slopebook platform fee apply to lesson package purchases at the time of purchase, at each individual redemption, or both? Is `tipAmountCents` excluded from the fee base for package-redeemed bookings in the same way it is excluded for standard bookings? Does `tipAmountCents` on a package-redeemed booking flow 100% to the instructor?

**Why it matters:** A `LessonPackage` purchase creates a `Payment` record with `paymentType = package_purchase`. When a credit is redeemed on a booking, no new charge is made but a tip-only charge may occur. The `platformFeeCents` calculation basis is therefore ambiguous: charging the fee at purchase time is straightforward, but charging per redemption requires a separate fee record at each redemption even when `amountCents = 0`. The instructor payout and `WorkdayHandoff` earnings snapshot are affected because `tipAmountCents` is stated to flow 100% to the instructor for standard bookings but this is unconfirmed for the package-redeemed tip case.

**Urgency:** HIGH

**Affected Items:** `Payment.platformFeeCents`, `Payment.tipAmountCents`, `Payment.paymentType`, `LessonPackage.purchasePaymentId`, `PackageRedemption`, `WorkdayHandoff`, TR-F-021, TR-F-033, TR-F-073, TR-F-115, CRT2-M-012, CRT2-H-004, UC-013

**Status:** Resolved
**Decision:** The fee is charged at time of purchase.  Tip elements do get charged.
**Date:** 2026-03-26
---

### OQ-028 — `InstructorRating` Visibility, Moderation, and Submission Timing

**Question:** (a) Are `InstructorRating` records public to guests browsing instructors, internal-only to school admins, or configurable per tenant? (b) Who can hide or remove a rating — only platform admins, or also school admins? (c) Is there a minimum completed-booking count before a rating is displayed on the instructor card? (d) At what point in the booking lifecycle can a household/guest submit a rating: immediately after `booking.status = completed`, after a cooling-off period (e.g., 24 hours), or within a configurable window?

**Why it matters:** The `InstructorRating` entity has been added to the data model v0.3 and `Instructor.ratingAvg` / `ratingCount` denormalised fields are present. The instructor browse UI (CUST-003, CUST-004, DS-022 InstructorCard, DS-051 StarRating) already displays average ratings. None of the product policy questions above are answered in any design document. A rating submitted immediately after a booking could reflect a system artefact; an unmoderated public rating creates liability exposure. The minimum count threshold prevents a single rating from disproportionately affecting a new instructor's card.

**Urgency:** MEDIUM

**Affected Items:** `InstructorRating`, `Instructor.ratingAvg`, `Instructor.ratingCount`, `POST /api/v1/bookings/:id/rating` (undefined endpoint), CUST-003, CUST-004, DS-022, DS-051, TR-F-070, CRT2-H-011, CRT2-M-006, UC-002

**Status:** Resolved
**Decision:** (a) Instructor rating is internal only. (b) only platform admins can edit or remove a rating (c) no miminum (d) rating only after booking complete - no time window.
**Date:** 2026-03-26

---

### OQ-029 — Waiver Third-Party Provider Selection

**Question:** Which specific third-party e-signature provider will Slopebook use for waivers — DocuSign, HelloSign/Dropbox Sign, or another? Does the provider's embed API support mobile PWA embed without a native SDK? What is the `waiverToken` format (opaque string, UUID, signed JWT)? Does the provider support a document-deletion API for right-to-erasure compliance?

**Why it matters:** OQ-008 and OQ-017 resolved that a third-party tool will be used, but the specific provider was not named. The embed interface, `waiverToken` format, fallback timeout handling, and right-to-erasure document deletion all depend on the provider. The legal equivalence of the typed-name fallback (when the embed times out on mountain wireless) must also be validated against US/Canadian liability law before Beta when waivers at check-in become active.

**Urgency:** MEDIUM

**Affected Items:** `Learner.waiverToken`, `Learner.waiverStatus`, `Learner.waiverVersion`, DS-067 (WaiverSignaturePad), INSTR-004 (Check-In Screen), TR-F-085, OQ-008, OQ-017, CRT2-M-011, FORM-019

**Status:** Resolved
**Decision:** smartwaiver, which has an API
**Date:** 2026-03-26

---

### OQ-030 — French Language Suppression on Starter Tier: Customer App and Instructor PWA

**Question:** Is the French language option suppressed for Starter-tier tenants on the `customer` app and `instructor` PWA, or is French available to all tiers on those two surfaces? TR-F-104 states FR is available to all tiers at Alpha on customer/instructor; DS-050 and CUST-021 state FR is suppressed on Starter in the customer app. Which is authoritative?

**Why it matters:** TR-F-104 and DS-050/CUST-021 directly contradict each other. Engineering teams implementing the FR toggle will apply different logic depending on which document they read. The most likely intended reading is that FR is available to all tiers on customer/instructor (bilingual customer experience is a core differentiator), and FR is gated to Growth+ only on admin/operator back-office surfaces. If Starter FR suppression on the customer surface is intentional, TR-F-104 must be corrected. If it is not intentional, DS-050 and CUST-021 must be corrected.

**Urgency:** MEDIUM

**Affected Items:** TR-F-104, DS-050 (LanguageToggle), CUST-021, `InstructorTenant.frEnabled`, `Tenant.subscriptionTier`, OQ-001, OQ-002, CRT2-M-002

**Status:** Unresolved

---

### OQ-031 — GroupSession School-Block Billing: In Scope or Removed?

**Question:** Is school-block billing (a single payment covering an entire group session on behalf of a school or group organiser) a v1.0 feature, or is it deferred? If deferred, should all school-block references be removed from `data-model.md`? If it is in scope, does the admin have UI to issue a single invoice to a school or group organiser?

**Why it matters:** `data-model.md` v0.2 contains a `GroupSession` note describing a school-block billing path. No use case in Run 2 describes this model — UC-010 through UC-013 use only per-learner billing. The proposed data model v0.3 removes `Payment.groupSessionId` treating school-block as deferred. TR-DC-017 requires every confirmed booking to have exactly one captured payment, which is incompatible with the school-block model. If school-block is genuinely deferred, all references must be removed to avoid dead code paths. If it is required, a use case, a billing model field on `GroupSession`, and a TR-DC-017 exemption must be added.

**Urgency:** MEDIUM

**Affected Items:** `GroupSession`, `Payment.groupSessionId` (removed in v0.3), TR-DC-017, CRT2-M-001, UC-010–UC-013, ADMIN-017

**Status:** Unresolved

---

### OQ-032 — Parental Consent Fields: Schema Definition and Erasure Exemption

**Question:** Should the `Learner` entity carry explicit `parentalConsentGiven boolean` and `parentalConsentAt timestamp` fields to persist the parental consent collected via FORM-003? If so, are these fields explicitly exempted from right-to-erasure on the grounds that they are a legal record of adult consent?

**Why it matters:** TR-F-052 requires parental/guardian consent to be recorded for under-18 learner profiles. FORM-003 includes a required consent checkbox. The `Learner` entity in data model v0.2 and v0.3 has no field for this consent — it is collected in the UI but has no defined persistence target. OQ-007 resolved the minimum learner age at 5 years with parental consent required under 18, but the schema change to back that requirement has not been made. The consent record must also be explicitly excluded from right-to-erasure (unlike other Learner PII) because it constitutes a legal record.

**Urgency:** LOW

**Affected Items:** `Learner` entity, `parentalConsentGiven`, `parentalConsentAt`, TR-F-052, FORM-003, OQ-007, OQ-026, CRT2-L-004, CUST-019 (Add/Edit Learner form)

**Status:** Unresolved

---

## Resolved Questions

All 22 questions from the original pipeline run (Run 1, 2026-03-24/25) are resolved. Decisions are locked and must not be reopened.

| # | Title | Decision (summary) | Date |
|---|---|---|---|
| OQ-001 | French translation priority | Phase i18n: EN/FR on customer + instructor PWA at Alpha; EN/FR on admin + operator at Beta. | 2026-03-25 |
| OQ-002 | Minimum viable Starter tier feature set | Starter = individual instructor tier; 1 instructor, 100 bookings/month. | 2026-03-25 |
| OQ-003 | Native iOS app requirement for instructor adoption | PWA sufficient for Alpha and Beta; formal usability test at Alpha to gate native iOS acceleration. | 2026-03-25 |
| OQ-004 | Cross-processor card-on-file token vault | Processor-managed vault per tenant; `PaymentMethod.isValid = false` on processor switch with household notification; cross-processor vault deferred to v1.5. | 2026-03-25 |
| OQ-005 | Shift4 merchant model | Dual model: Growth/Pro/Enterprise tenants use own Shift4 MID (direct_merchant); Starter tenants route through Slopebook platform MID (platform_mid). `Tenant.paymentModel` field added. | 2026-03-25 |
| OQ-006 | Instructor payroll handling | Report-only with Workday (or equivalent) handoff. `WorkdayHandoff` entity defines scope. Direct deposit deferred to v2.0. | 2026-03-25 |
| OQ-007 | Minimum age threshold for learner sub-profiles | Minimum learner age = 5 years (platform constant). Parental/guardian consent required for under-18. Age-gate UI shows guidance rather than hard block. | 2026-03-25 |
| OQ-008 | Electronic waiver storage requirements | Third-party e-signature tool to be used. Specific provider TBD (see OQ-029). | 2026-03-26 |
| OQ-009 | Waitlist notification window configurability | Configurable per tenant via `Tenant.waitlistAcceptWindowMinutes`; range 30 min–48 hr; default 2 hr (120 min). CUST-024/025 display must be dynamic. | 2026-03-26 |
| OQ-010 | Group lesson capacity limits | Three-level hierarchy: platform default → `LessonType.maxCapacity` → `GroupSession.maxCapacity` (admin-only per-session override). | 2026-03-26 |
| OQ-011 | Soft-hold TTL configurability | Platform-level constant: 15 minutes. Not configurable per tenant. `SlotReservation.expiresAt = now() + 15 minutes`. | 2026-03-26 |
| OQ-012 | GuestCheckout data retention policy | Manually supported; platform provides admin tools for right-to-erasure without technical intervention. Full PII scope TBD (see OQ-026). | 2026-03-26 |
| OQ-013 | Group lesson instructor-to-student ratio policy | Three-level hierarchy: platform default → `LessonType.instructorStudentRatio` → `GroupSession.instructorStudentRatio` (admin-only override). | 2026-03-26 |
| OQ-014 | Cancellation policy default for new tenants | Default = non-refundable. System supports custom full and partial refund windows. Non-refundable policy seeded atomically at tenant creation. | 2026-03-26 |
| OQ-015 | InstructorTenant earnings visibility across resorts | Full tenant isolation. Instructor earnings and data at each tenant are entirely isolated; no cross-tenant visibility for school admins. | 2026-03-26 |
| OQ-016 | Notification delivery provider and CASL compliance | SendGrid for email. Guest list management (CASL opt-out, unsubscribe) automated via SendGrid suppression list. `User.emailOptOut` and `User.smsOptOut` fields added. | 2026-03-26 |
| OQ-017 | Electronic waiver storage layer | Third-party e-signature tool (same decision as OQ-008). `Learner.waiverSignedAt`, `waiverVersion`, and `waiverToken` fields hold the reference. Specific provider TBD (see OQ-029). | 2026-03-26 |
| OQ-018 | Tips: in scope for v1.0, or deferred? | Tips in scope. `Tenant.tipsEnabled`, `Payment.tipAmountCents`, tip selector in checkout UI (DS-TIP-001), and earnings dashboard line item confirmed. | 2026-03-26 |
| OQ-019 | Lesson packages: Beta deliverable or deferred? | Confirmed Beta deliverable. `LessonPackage` and `PackageRedemption` entities added to data model v0.3. | 2026-03-26 |
| OQ-020 | Skill level: self-reported or instructor-validated? | Self-reported by the consumer. System retains performance observation notes. School admins can manually override `Learner.skillLevel`; override audited via `AuditLog`. | 2026-03-26 |
| OQ-021 | Google Calendar sync: v1.0 GA or deferred? | Deferred to v1.5. `OAuthToken` entity removed from data model v0.3. Must not appear in any v1.0 code path (DEFERRED-001). | 2026-03-26 |
| OQ-022 | KMS selection for payment credential encryption | AWS KMS. Envelope encryption with per-tenant DEK; KEK managed in AWS KMS. Key rotation without downtime; encrypted values include key version identifier. | 2026-03-26 |
