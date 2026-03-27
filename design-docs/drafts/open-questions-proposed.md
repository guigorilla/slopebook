# Slopebook — Open Questions (Proposed Update)

**Document Status:** Draft — Run 3
**Last Updated:** 2026-03-26
**Author:** Open-Questions-Tracker Agent
**Pipeline Run:** Run 3 (2026-03-26)

---

## This Run

### Changes Summary

| Category | Count | OQ Numbers |
|---|---|---|
| Questions added | 14 | OQ-033 through OQ-046 |
| Questions resolved | 0 | — |
| Questions flagged as stale | 3 | OQ-030, OQ-031, OQ-032 |

### Questions Added (OQ-033 – OQ-046)

All 14 new questions were surfaced by the Run 3 draft documents. Sources are `critique.md` (edge cases EC-001 through EC-010, slopebook-specific concerns SC-A through SC-H, unstated assumptions UA-001 through UA-008), `tech-requirements.md` (open technical questions in TR-020, TR-022, TR-038), and `use-cases.md` (UC-042 open questions). Where two draft documents surface the same ambiguity, one question is written, not two.

### Questions Resolved This Run

None. No previously-unresolved question was definitively closed by any Run 3 draft.

### Questions Flagged as Stale

OQ-030, OQ-031, and OQ-032 were opened in Run 2 (2026-03-26) and remain entirely unresolved entering Run 3. All three are actively referenced in `use-cases.md`, `tech-requirements.md`, and `data-model-proposed.md`. Each has been flagged below with a staleness note indicating which use case or feature it is blocking.

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

### OQ-030 — French Language Suppression on Starter Tier: Customer App and Instructor PWA

**Question:** Is the French language option suppressed for Starter-tier tenants on the `customer` app and `instructor` PWA, or is French available to all tiers on those two surfaces? TR-F-104 states FR is available to all tiers at Alpha on customer/instructor; DS-050 and CUST-021 state FR is suppressed on Starter in the customer app. Which is authoritative?

**Why it matters:** TR-F-104 and DS-050/CUST-021 directly contradict each other. Engineering teams implementing the FR toggle will apply different logic depending on which document they read. The most likely intended reading is that FR is available to all tiers on customer/instructor (bilingual customer experience is a core differentiator), and FR is gated to Growth+ only on admin/operator back-office surfaces. If Starter FR suppression on the customer surface is intentional, TR-F-104 must be corrected; if not, DS-050 and CUST-021 must be corrected.

**Urgency:** MEDIUM

**Affected Items:** TR-F-104, DS-050 (LanguageToggle), CUST-021, `InstructorTenant.frEnabled`, `Tenant.subscriptionTier`, OQ-001, OQ-002, CRT2-M-002, TR-001, TR-009, TR-043, UC-001, UC-009, UC-043

**Status:** Unresolved

> **STALE — Needs stakeholder input — blocking UC-001, UC-009, UC-043 (language toggle render logic for Starter tier on the customer app and instructor PWA). Opened Run 2 (2026-03-26); no progress in Run 3.**

---

### OQ-031 — GroupSession School-Block Billing: In Scope or Removed?

**Question:** Is school-block billing (a single payment covering an entire group session on behalf of a school or group organiser) a v1.0 feature, or is it deferred? If deferred, should all school-block references be removed from `data-model.md`? If it is in scope, does the admin have UI to issue a single invoice to a school or group organiser?

**Why it matters:** `data-model.md` v0.2 contained `Payment.groupSessionId`. `data-model-proposed.md` v0.3 removes it with a DEFERRED-002 callout, following the recommendation in TR-019 and critique CR-002. CR-002 also identifies that the v0.2 CHECK constraint (requiring `bookingId OR groupSessionId` to be non-null) is incompatible with `paymentType = package_purchase` records where both FKs are legitimately null — a concrete data-integrity bug. The product scope must be formally confirmed so that the DEFERRED-002 callout is either ratified or reversed.

**Urgency:** MEDIUM

**Affected Items:** `GroupSession`, `Payment.groupSessionId` (removed in v0.3), TR-DC-017, CR-002 (critique), CRT2-M-001, UC-019, UC-020, TR-019, TR-020, ADMIN-017

**Status:** Unresolved

> **STALE — Needs stakeholder input — blocking TR-019 (group-session billing path in `POST /api/v1/bookings`) and TR-020 (group session enrollment management). Opened Run 2 (2026-03-26); no progress in Run 3. Data model v0.3 has defensively removed the field; formal product decision still required.**

---

### OQ-032 — Parental Consent Fields: Schema Definition and Erasure Exemption

**Question:** Should the `Learner` entity carry explicit `parentalConsentGiven boolean` and `parentalConsentAt timestamp` fields to persist the parental consent collected via FORM-003? If so, are these fields explicitly exempted from right-to-erasure on the grounds that they constitute a legal record of adult consent?

**Why it matters:** TR-F-052 requires parental/guardian consent to be recorded for under-18 learner profiles. FORM-003 collects a required consent checkbox. `data-model-proposed.md` v0.3 reserves the fields (SC-010, SC-011) but flags them as dormant pending resolution. The Run 3 critique (SC-D) escalates urgency: "A booking for a 7-year-old can be confirmed with no auditable record that an adult consented. This is a child safety liability gap. Alpha is targeting pilot ski schools in Q2 2026 — if children are enrolled in Alpha, this gap exists from day one." TR-011 and TR-037 both require resolution before Beta schema freeze.

**Urgency:** LOW

**Affected Items:** `Learner.parentalConsentGiven`, `Learner.parentalConsentAt`, TR-F-052, FORM-003, OQ-007, OQ-026, CRT2-L-004, CUST-019, SC-D (critique), SC-010, SC-011, TR-011, TR-037, UC-011, UC-037

**Status:** Unresolved

> **STALE — Needs stakeholder input — blocking TR-011 (household learner setup), TR-037 (right-to-erasure tool), SC-010, SC-011 (parental consent field activation). Opened Run 2 (2026-03-26); no progress in Run 3. Critique SC-D recommends reviewing whether urgency should be reclassified BLOCKER given Alpha's planned minor-student enrolment.**

---

### OQ-033 — Guest-Checkout Self-Cancellation: Authenticated Cancel Link in Confirmation Email

**Question:** Should guests who booked without creating an account be able to self-cancel their booking via a one-time authenticated link in their confirmation email? If yes: what is the mechanism — a signed, time-limited URL that grants single-use cancellation capability without a JWT? What happens when the cancellation window under the school's policy has passed (should the link remain active but show "no refund available")?

**Why it matters:** `PATCH /api/v1/bookings/:id/cancel` requires a JWT. Guest-checkout users have no JWT, so the only current cancellation path for them is contacting the school directly. Critique GAP-C flags this: guest-checkout cancellations will generate support volume above the 2% support-contact-rate target stated in `overview.md`. Confirmation emails contain no cancel link. All guest-checkout bookings — a significant proportion of all bookings — are non-self-serviceable for cancellation in the current design. A one-time-token cancel mechanism (analogous to the post-lesson review token) would address this without requiring account creation.

**Urgency:** HIGH

**Affected Items:** `PATCH /api/v1/bookings/:id/cancel`, `GuestCheckout`, `Booking`, UC-008, TR-008, GAP-C (critique), `api-design.md` §Booking Engine, overview.md §Success Metrics (2% support-contact-rate target)

**Source:** `drafts/critique.md` GAP-C

**Status:** Unresolved

---

### OQ-034 — Waitlist Priority Ordering: Stored Position Field, FIFO, or Admin-Configurable?

**Question:** When a waitlist slot becomes available, in what order are entries notified? UC-016 alternate flow 3a states "by position, then by registration time," but `WaitlistEntry` has no `position` field in the data model. Is the ordering purely registration-time FIFO? Is there a mechanism for admins to manually reorder entries? What happens when the entire waitlist cycles through (all entries expire or decline) without acceptance — does the slot return to general inventory, and is the admin notified?

**Why it matters:** Critique EC-003 identifies that no ordering algorithm is implemented in the API or data model. Without a `position` field or a defined FIFO rule, the background waitlist sweep and `PATCH /api/v1/waitlist/:id/promote` cannot be consistently implemented by different engineers. The lack of an admin notification when the full waitlist is exhausted without acceptance means slots can silently return to inventory with no human awareness. This affects all waitlist use cases (UC-015, UC-016) which are P1 Beta deliverables.

**Urgency:** HIGH

**Affected Items:** `WaitlistEntry`, `POST /api/v1/waitlist`, `PATCH /api/v1/waitlist/:id/promote`, UC-015, UC-016, TR-015, TR-016, TR-035, EC-003 (critique)

**Source:** `drafts/critique.md` EC-003

**Status:** Unresolved

---

### OQ-035 — Processor Switch Mid-Season: Transition Period for In-Flight Refunds and Old Webhooks

**Question:** When a resort operator switches payment processors via UC-039, what happens to: (a) upcoming bookings with charges already captured on the old processor — refunds must be issued via the old processor, but its credentials have been replaced; (b) partial refunds in flight at the moment of the switch; (c) webhooks from the old processor that will now fail HMAC verification against the new `webhookSecret`? Should a "transition period" be defined during which old-processor credentials are preserved in a read-only, refund-only mode?

**Why it matters:** Critique EC-004 identifies a concrete financial liability: replacing `Tenant.paymentCredentials` immediately eliminates refund capability on the old processor. UC-039 (operator configures payment processor) only specifies invalidating `PaymentMethod` records and showing a warning — there is no transition period concept in the data model or API. Old processor webhooks (e.g., delayed refund confirmations or chargeback notifications) will fail HMAC validation with the new `webhookSecret`, breaking payment reconciliation. This risk scales with the number of active bookings at the time of the switch.

**Urgency:** HIGH

**Affected Items:** `Tenant.paymentCredentials`, `Tenant.paymentProcessor`, `Payment`, UC-039, TR-039, EC-004 (critique), `POST /api/v1/tenants/:id/payment-config`, webhook HMAC verification logic

**Source:** `drafts/critique.md` EC-004

**Status:** Unresolved

---

### OQ-036 — Learner Deletion with Active Bookings: Block, Cascade-Cancel, or FK-Convert?

**Question:** When a head of household deletes a learner sub-profile (`DELETE /api/v1/households/:id/learners/:learnerId`) and that learner has confirmed upcoming bookings, what is the correct behaviour? Options: (a) block the deletion until bookings are resolved; (b) cascade-cancel all upcoming bookings (applying the cancellation policy and initiating refunds); (c) convert `Booking.learnerId` to a `GuestCheckout` reference so the booking survives the deletion. Which option is correct, and is `Booking.learnerId` nullable in the target schema?

**Why it matters:** Critique EC-005 identifies that `Booking.learnerId` is a FK with no documented precondition on the delete endpoint and no DB-level CASCADE defined. Without a defined behaviour, a deleted learner with live bookings creates either a dangling FK reference (data corruption) or an unexpected cascade that cancels paid bookings without guest awareness. The right-to-erasure tool (OQ-026) already defines a leaner pseudonymisation path for GDPR erasure, but household-initiated learner deletion is a distinct flow with different semantics.

**Urgency:** HIGH

**Affected Items:** `DELETE /api/v1/households/:id/learners/:learnerId`, `Booking.learnerId`, `Learner`, UC-011, TR-011, EC-005 (critique), `api-design.md` §Account & Identity Service

**Source:** `drafts/critique.md` EC-005

**Status:** Unresolved

---

### OQ-037 — Soft-Hold Expiry During Account Creation: TTL Reset or Guest Redirect?

**Question:** In the UC-005 flow, a guest selects "Create Account" at the checkout authentication gate, inserting a registration step between soft-hold creation and payment. If account creation takes longer than 15 minutes, the `SlotReservation` expires. Should the system: (a) silently let the hold expire and redirect the guest to re-select a time slot after registration completes; (b) issue a new soft-hold automatically on successful registration if the original has expired; or (c) extend the TTL when the registration step is entered? TR-005 states the `SlotReservation` "must remain valid across the registration step" but does not define the mechanism.

**Why it matters:** Critique EC-006 flags this as a missing alternate flow. UC-003 alternate flow 6a covers TTL expiry at the payment step, but UC-005 has no corresponding alternate flow for expiry during registration. A guest who spends more than 15 minutes registering — plausible on mobile or mountain wireless — is silently bounced back to the calendar after completing registration, having lost both their time slot and their registration effort. This is a high-friction checkout failure case with a direct impact on Alpha conversion rates.

**Urgency:** MEDIUM

**Affected Items:** `SlotReservation.expiresAt`, UC-003, UC-005, TR-003, TR-005, OQ-011, EC-006 (critique)

**Source:** `drafts/critique.md` EC-006

**Status:** Unresolved

---

### OQ-038 — Group Session Entity-Level Cancellation: Flow, Trigger, and Enrollment Notification

**Question:** Is there a defined flow for cancelling a `GroupSession` as a whole entity, distinct from cancelling individual bookings within it? If yes: (a) what endpoint sets `GroupSession.status = cancelled`; (b) who can trigger it — school admin, resort operator, or both; (c) are all enrolled bookings cancelled automatically with refunds issued, or must they be cancelled individually; (d) what notification path reaches all enrolled learners simultaneously?

**Why it matters:** `GroupSession.status` includes a `cancelled` enum value in v0.2 and v0.3, but no use case, endpoint, or notification flow sets it. Critique EC-007 identifies a realistic scenario — a sole instructor becoming unavailable for a week-long junior academy — where cancelling 30+ individual bookings one by one is operationally unsustainable. UC-029 (weather bulk-cancel) operates at the booking level and does not set `GroupSession.status`. Without a session-level cancellation path, group session management is incomplete for a P1 Beta feature.

**Urgency:** MEDIUM

**Affected Items:** `GroupSession.status`, `GroupSession`, UC-019, UC-020, TR-019, TR-020, EC-007 (critique), `api-design.md` §Booking Engine (no `POST /api/v1/group-sessions/:id/cancel` defined)

**Source:** `drafts/critique.md` EC-007

**Status:** Unresolved

---

### OQ-039 — Package-Redeemed Booking Cancellation: Credit Reinstated or Forfeited?

**Question:** When a guest cancels a booking that was fulfilled by a lesson package credit (UC-018), is `LessonPackage.remainingCount` reinstated (credit returned), or is the credit forfeited? Does the cancellation policy's `refundPercent` apply in some form — for example, reinstating the credit only when the cancellation is within the full-refund window? Or is the credit always reinstated regardless of how late the cancellation is made?

**Why it matters:** Critique EC-008 identifies that `CancellationPolicy.refundRules` is expressed as `refundPercent` — a mechanism for cash refunds — and there is no cash to refund on a package-redeemed booking. The intersection of cancellation policy and package redemption is entirely unaddressed. If credits are automatically reinstated on any cancellation, a guest could repeatedly book and cancel to hold high-demand slots without commitment. If credits are always forfeited, guests who cancel legitimately (illness, school closure) receive no remedy despite having already paid for the lesson via the package. A defined product policy is required before TR-008 (cancel booking) and TR-018 (package redemption) can be consistently implemented.

**Urgency:** HIGH

**Affected Items:** `LessonPackage.remainingCount`, `PackageRedemption`, `CancellationPolicy`, `Booking.lessonPackageId`, UC-008, UC-018, TR-008, TR-018, EC-008 (critique), OQ-025

**Source:** `drafts/critique.md` EC-008

**Status:** Unresolved

---

### OQ-040 — Smartwaiver API Outage: Check-In Fallback Trigger and Circuit-Breaker Policy

**Question:** TR-022 defines a typed-name fallback for instructor-device connectivity loss (mountain wireless failure). It does not define fallback behaviour when the instructor's device has internet connectivity but Smartwaiver's API or CDN returns errors (5xx, CORS failure, certificate error, or timeout). In that case: (a) should the instructor be permitted to proceed to check-in using only the typed-name record; (b) should a circuit-breaker auto-activate the typed-name path after N seconds of Smartwaiver unresponsiveness; (c) is there a contractual SLA with Smartwaiver, and is vendor redundancy required?

**Why it matters:** Critiques EC-009 and GAP-I identify that the entire waiver flow depends on a single third-party with no circuit-breaker or SLA defined. During peak periods (opening weekend, school group arrivals), a Smartwaiver service outage would prevent instructors from completing check-in for any student, blocking all lessons. The typed-name fallback's legal equivalence "must be validated by legal before Beta" (TR-022), but its triggering condition is currently defined only for device-level connectivity loss — not for provider-level failure. This is a P0 Alpha feature (UC-022) with no resilience plan for its critical dependency.

**Urgency:** HIGH

**Affected Items:** `Learner.waiverStatus`, `Learner.waiverToken`, UC-022, TR-022, OQ-029, EC-009 (critique), GAP-I (critique), `PATCH /api/v1/bookings/:id/checkin`

**Source:** `drafts/critique.md` EC-009 and GAP-I

**Status:** Unresolved

---

### OQ-041 — Cross-Tenant Instructor Double-Booking: Detection Scope and KPI Risk Acceptance

**Question:** The booking engine's conflict check is scoped to a single tenant (JWT-bounded). A freelance instructor with `InstructorTenant` rows at two resorts can be simultaneously booked at both for the same time slot, since Resort A's availability query never checks Resort B's bookings. Is cross-tenant conflict detection required before Alpha? If so, what mechanism is used — a global conflict lookup across all approved `InstructorTenant` rows for the instructor at booking time? If deferred, what formal risk-acceptance process covers the `< 0.5% double-booking rate` KPI stated in `overview.md`?

**Why it matters:** Critiques EC-010 and SC-C identify this as the most likely mechanism by which the double-booking KPI is missed. Instructor availability is fully tenant-isolated (OQ-015), meaning `GET /api/v1/availability` for Resort A never queries Resort B's confirmed bookings. Without cross-tenant conflict detection, the double-booking KPI is unenforceable for any multi-resort instructor. Given the freelance-instructor model prevalent in ski schools, multi-resort instructors will exist from day one of Alpha.

**Urgency:** HIGH

**Affected Items:** `Availability`, `InstructorTenant`, `Booking`, `GET /api/v1/availability`, UC-003, TR-003, EC-010 (critique), SC-C (critique), overview.md §Success Metrics (`< 0.5% double-booking rate`)

**Source:** `drafts/critique.md` EC-010 and SC-C

**Status:** Unresolved

---

### OQ-042 — Pricing Floors and Seasonal Rate Cards: v1.0 GA Scope Confirmation

**Question:** Are "pricing floors and seasonal rate cards" — listed in UC-038 step 4 and referenced in the operator portal screen design (asset-list-proposed.md) as v1.0 GA deliverables — actually in scope for v1.0 GA? `tech-requirements.md` TR-038 states these are "not in scope for v1.0 without a formal product decision (GAP-013)" and `data-model-proposed.md` v0.3 includes no entity for this concept. If in scope: a `PriceFloorConfig` entity, admin/operator CRUD endpoints, and use-case coverage must be added before operator portal implementation begins. If deferred: UC-038, `overview.md`, and the asset list's "pricing floors and seasonal rate card editor" element must be removed to prevent dead implementation paths.

**Why it matters:** Critique UA-007 identifies this as a gap between the product roadmap (`overview.md`, UC-038) and every technical document: "The operator portal will launch without a feature listed in the product overview." The operator portal is a v1.0 GA deliverable. If pricing floors are genuinely expected at launch and are absent from the schema, they will be silently dropped unless a formal product decision is made now.

**Urgency:** MEDIUM

**Affected Items:** UC-038, TR-038, `overview.md` §v1.0 GA deliverables, GAP-013 (critique, tech-requirements), `Operator App — Resort Policies` screen (asset-list-proposed.md), `PATCH /api/v1/tenants/:id`

**Source:** `drafts/tech-requirements.md` TR-038 and `drafts/critique.md` UA-007, GAP-013

**Status:** Unresolved

---

### OQ-043 — OQ-023 Resolution Text: `tipAmountCents` Contradiction Requires Authoritative Correction

**Question:** The OQ-023 resolution block in `open-questions.md` contains a direct internal contradiction. The narrative states "tipAmountCents removed from booking payload; tip submitted via a separate post-lesson flow." The field-specification sub-section of the same block then lists `tipAmountCents: integer, nullable, must be >= 0 if present` as a `POST /api/v1/bookings` payload addition. Which is authoritative? Is the final authoritative decision that the booking payload carries only `reservationId` and `sessionToken`, and that `tipAmountCents` is collected exclusively via `POST /api/v1/bookings/:id/review`?

**Why it matters:** Critique CR-010 identifies this as a critical issue. `tech-requirements.md` TR-004/TR-010 and `use-cases.md` UC-004/UC-010 both follow the post-lesson interpretation. An engineer reading only the OQ-023 payload additions list will implement `tipAmountCents` in the booking endpoint, creating a parallel and incorrect code path. The OQ-023 decision block in `open-questions.md` must be corrected to remove `tipAmountCents` from the payload additions list. This requires a stakeholder confirmation that the post-lesson-only interpretation is the definitive decision so the correction can be applied authoritatively, not just as an editorial assumption.

**Urgency:** BLOCKER

**Affected Items:** `POST /api/v1/bookings` payload, OQ-023 decision text (open-questions.md), TR-004, TR-010, UC-004, UC-010, CR-010 (critique), `Payment.tipAmountCents`, `POST /api/v1/bookings/:id/review`

**Source:** `drafts/critique.md` CR-010

**Status:** Unresolved

---

### OQ-044 — CASL Classification of Weather-Cancellation Rebooking Links

**Question:** Do weather-cancellation emails that include a "rebooking link" (UC-029 step 6) qualify as commercial electronic messages under CASL, requiring prior express consent from Canadian recipients? If they do, what is the resolution: (a) remove the rebooking link from cancellation emails; (b) introduce CASL message-type classification in the Notification Service; or (c) collect and record express rebooking-prompt consent at booking time? Guest-checkout users at Canadian resorts have not provided any marketing consent.

**Why it matters:** Critique SC-G identifies this as an unresolved compliance risk for Canadian resort tenants. CASL applies from the first email sent to a Canadian recipient — Alpha (Q2 2026). Booking confirmations and cancellations are transactional and CASL-exempt, but a promotional call-to-action embedded in a cancellation email can reclassify the message as a commercial electronic message, exposing Slopebook and its resort tenants to fines up to CAD $10 million per violation. The Notification Service has no CASL message-type classification. `overview.md` places the PIPEDA compliance audit at v1.5, but CASL obligations pre-date that milestone.

**Urgency:** HIGH

**Affected Items:** UC-029, TR-029, Notification Service, `User.emailOptOut`, `GuestCheckout`, `api-design.md` §Notification Service, overview.md §Release Roadmap, SC-G (critique)

**Source:** `drafts/critique.md` SC-G

**Status:** Unresolved

---

### OQ-045 — Smartwaiver Document Deletion: GDPR/PIPEDA Right-to-Erasure Coverage

**Question:** Does Slopebook's right-to-erasure obligation (GDPR Article 17, PIPEDA) extend to the waiver document stored at Smartwaiver — not just the `Learner.waiverToken` reference in Slopebook's own database? If yes: (a) does Smartwaiver provide a document-deletion API; (b) should the erasure admin tool (UC-037) invoke this API as part of the erasure workflow; (c) if the learner is a minor whose waiver was signed by a parent/guardian, does a household erasure request cover the minor's waiver document? Does Slopebook's DPA with Smartwaiver address this?

**Why it matters:** OQ-026 defines the right-to-erasure scope across Slopebook's own entities but does not mention `Learner.waiverToken` or the underlying Smartwaiver document. Critique UA-008 identifies this gap: nullifying the token in Slopebook's DB leaves the waiver document — which may contain the signer's name, signature, and contact details — at Smartwaiver untouched and unreferenced. OQ-029 confirmed Smartwaiver "provides an API," but TR-022 uses the API only for token retrieval; it says nothing about document deletion. This is a compliance gap that could be flagged in any GDPR or PIPEDA audit.

**Urgency:** HIGH

**Affected Items:** `Learner.waiverToken`, `Learner.waiverStatus`, UC-037, TR-037, OQ-026, OQ-029, UA-008 (critique), `POST /api/v1/admin/erasure-requests/:id/confirm`, right-to-erasure scope

**Source:** `drafts/critique.md` UA-008

**Status:** Unresolved

---

### OQ-046 — `ProcessorTokenId` PCI-DSS Protection: Encryption Required or Access-Control Sufficient?

**Question:** `data-model.md` v0.2 classifies `PaymentMethod.processorTokenId` as non-sensitive on the basis that it is "useless without processor credentials," relying on database-level access controls as the protection mechanism. Is this classification defensible under PCI-DSS SAQ-A or SAQ-A-EP? Must `processorTokenId` be encrypted at rest, or is access-control isolation of the `payment_methods` table a compliant posture? Has a QSA or PCI-qualified security reviewer assessed this decision?

**Why it matters:** Critique SC-E identifies that processor vault tokens are card-linked identifiers; their exposure combined with processor credentials (held separately but in the same KMS-encrypted `paymentCredentials` blob) enables fraudulent charges. PCI-DSS SAQ-A-EP applies when processor-hosted fields or a processor JS SDK are used. "Database-level access controls alone" is not a documented compliant posture for card-linked data under SAQ-A-EP. `data-model-proposed.md` v0.3 does not address this: `processorTokenId` remains unannotated for encryption. Engineering cannot make an informed implementation decision without a formal PCI scoping determination.

**Urgency:** HIGH

**Affected Items:** `PaymentMethod.processorTokenId`, `data-model.md` §5 Encryption & PCI Scope, `data-model-proposed.md` v0.3, TR-039, TR-045, SC-E (critique), overview.md §Security

**Source:** `drafts/critique.md` SC-E

**Status:** Unresolved

---

## Resolved Questions

All 22 questions from the original pipeline run (Run 1, 2026-03-24/25) are resolved. Questions OQ-023 through OQ-029 were resolved in Run 2 (2026-03-26). Decisions are locked and must not be reopened.

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
| OQ-017 | Electronic waiver storage layer | Third-party e-signature tool (same decision as OQ-008). `Learner.waiverSignedAt`, `waiverVersion`, and `waiverToken` fields hold the reference. Specific provider confirmed in OQ-029. | 2026-03-26 |
| OQ-018 | Tips: in scope for v1.0, or deferred? | Tips in scope. `Tenant.tipsEnabled`, `Payment.tipAmountCents`, tip selector in checkout UI (DS-TIP-001), and earnings dashboard line item confirmed. | 2026-03-26 |
| OQ-019 | Lesson packages: Beta deliverable or deferred? | Confirmed Beta deliverable. `LessonPackage` and `PackageRedemption` entities added to data model v0.3. | 2026-03-26 |
| OQ-020 | Skill level: self-reported or instructor-validated? | Self-reported by the consumer. System retains performance observation notes. School admins can manually override `Learner.skillLevel`; override audited via `AuditLog`. | 2026-03-26 |
| OQ-021 | Google Calendar sync: v1.0 GA or deferred? | Deferred to v1.5. `OAuthToken` entity removed from data model v0.3. Must not appear in any v1.0 code path (DEFERRED-001). | 2026-03-26 |
| OQ-022 | KMS selection for payment credential encryption | AWS KMS. Envelope encryption with per-tenant DEK; KEK managed in AWS KMS. Key rotation without downtime; encrypted values include key version identifier. | 2026-03-26 |
| OQ-023 | Booking API Payload: `reservationId`, `sessionToken`, and post-lesson tip routing | `tipAmountCents` is NOT in the `POST /api/v1/bookings` payload. Tip and rating submitted via `POST /api/v1/bookings/:id/review` — a separate post-lesson flow. Booking payload additions: `reservationId (uuid, nullable)` and `sessionToken (string, nullable)` only. NOTE: the OQ-023 resolution block contained an internal contradiction (field-spec listed `tipAmountCents`). See OQ-043 for the formal correction request. | 2026-03-26 |
| OQ-024 | `paymentCredentials` JSON schema for each processor/tier combination | Starter = Stripe-only. Shift4 requires Growth tier minimum. Three credential schemas: Stripe (`secretKey` + `webhookSecret`); Shift4/Growth+ (`model="direct"`, `apiKey`, `merchantId`, `webhookSecret`); Shift4/Starter: NOT SUPPORTED v1.0. No platform MID or PayFac in v1.0 — deferred to v1.5. All fields encrypted via AWS KMS. | 2026-03-26 |
| OQ-025 | Lesson package expiry: forfeiture, extension, or auto-refund? | Expired credits are quietly forfeited. Admin can manually extend `LessonPackage.expiresAt`. No auto-refund. | 2026-03-26 |
| OQ-026 | Right-to-erasure: complete PII scope definition | Full scope defined per entity: `GuestCheckout` PII fields pseudonymised to "ERASED"; `Payment.guestCheckoutId` FK nullified, financial fields retained (7yr US / 6yr CA); `WaitlistEntry` record deleted; `BookingNote` FK replaced with ERASED_GUEST placeholder, content retained; `AuditLog` retained in full (3yr max, no raw email in future logs). NOTE: Smartwaiver document deletion not addressed — see OQ-045. | 2026-03-26 |
| OQ-027 | Platform fee calculation on package purchases and package-redeemed bookings | Fee (1.5%) charged at package purchase time. Tip charges on package-redeemed bookings also attract the platform fee (1.5%). Standard booking tip amounts: fee does NOT apply to tips (`Payment.platformFeeCents = 0` on tip-only records). | 2026-03-26 |
| OQ-028 | `InstructorRating` visibility, moderation, and submission timing | Ratings are internal-only (visible to browsing users within tenant; not public-indexed). Platform-admin moderation only; `school_admin` cannot edit or remove. No minimum booking count. Rating available immediately after `booking.status = completed`. No submission time window. | 2026-03-26 |
| OQ-029 | Waiver third-party provider selection | Smartwaiver. Provides API and mobile-compatible embed. NOTE: Smartwaiver document-deletion coverage for right-to-erasure is unresolved — see OQ-045. | 2026-03-26 |
