# Slopebook — Decisions Log

This file is the authoritative record of all significant product and technical
decisions made during design. All pipeline agents read this file. Decisions
here take precedence over inferences made from other documents.

When a decision is made — in a pipeline run, a conversation, or a design
session — add it here immediately. This is the memory layer for the pipeline.

Format:
## [Date]
- **[Topic]:** [Decision]. [Reason if relevant.]

---
## 2026-11-01

- **Bulk group program creation:** Booking Core v1.0 includes real bulk
  creation. An admin defines a group program once and the system creates every
  session in one request, flagging any week with a conflict and creating the
  rest. This supersedes the earlier "no dedicated bulk endpoint in v1.0" note.

- **Scope of age and skill collection:** The 2026-03-20 rule (collected at
  browse, not at checkout) applies to the public browse-to-checkout flow. An
  admin walk-up booking has no browse stage, so details are collected in the
  walk-up form. A learner added during household checkout is collected at that
  step. No flow asks again for details the session already holds.

## 2026-10-31

- **Product merge:** Slopebook and SkiMatch merge into one product named
  Slopebook. SkiMatch is the customer booking and matching module. The Ski
  School Manager prototype becomes the Manager Console. `overview.md` is the
  single product definition.

- **Overlay-first:** Slopebook launches as an intelligence layer above a
  school's existing POS. This supersedes the v1.0 non-goal on POS integration
  and the previous Alpha, Beta and GA roadmap. Booking Core specs are retained
  and move to Phase 3.

- **Adapter boundary:** All operating logic goes through `POSAdapter`. Booking
  Core is one implementation of that interface. Third-party POS systems own
  transactional records in overlay deployments.

- **Matching timing:** Rules-based, explainable instructor matching moves from
  v2.0 into the core product. The earlier deferral assumed trained models.

- **Merged domain direction:** Slopebook's data model is the base, extended by
  SkiMatch concepts as listed in `overview.md`. Skill levels become SkiMatch's
  six-level scale with a recorded source. Group lessons support both
  customer-selected sessions and school-composed placement per lesson type.
  Rating and tip remain, joined by student and instructor assessments.

- **Manager approval:** Agents explain and recommend only. Schedule and other
  material changes require manager approval, and adapter writes are verified.

- **AI data privacy:** No real customer conversation, inferred profile or
  instructor observation data enters the system until retention and erasure
  rules cover it. Those rules must address minors explicitly.

- **Platform fee:** The 1.5% fee applies to Booking Core transactions only.
  Overlay pricing is unset until the shadow pilot.

- **Agent pipeline:** The design-only pipeline expands to cover product through
  operations, as defined in `agent-pipeline.md`. Status is Proposed until its
  open questions are resolved.

## 2026-04-04

- **Tips:** Tips are in scope for v1.0 as an optional post-lesson flow.
  Post-lesson flow: rating (required) + tip (optional, separate payment transaction).
  OQ-043 is superseded by this decision. Schema must include tipAmountCents
  on BookingReview entity.

- **Package payments:** Payment.bookingId is nullable with lessonPackageId FK 
  (also nullable) on the Payment entity. No separate PackagePayment entity. 
  OQ-059 resolved. decisions.md supersedes Run 7 data-model approach.

## 2026-03-29

- **Booking auto-completion:** Bookings auto-complete 2 hours after scheduled
  end time if the instructor has not manually marked the lesson complete.
  The `booking.completed` event fires at auto-completion and triggers earnings
  calculation and unlocks the post-lesson rating and tip flow for the student.

- **Payment.bookingId nullability:** `Payment.bookingId` is nullable.
  `Payment` adds a `lessonPackageId` FK (also nullable). A payment links to
  either a booking or a package purchase — never both. Constraint: at least
  one of `bookingId` or `lessonPackageId` must be non-null, enforced at the
  application layer.

## 2026-03-26

- **Tips:** Tips are removed from the booking payload. Tips are submitted
  via a separate post-lesson flow after the lesson is marked complete.
  The post-lesson flow includes: rating (required) + tip (optional).
  Tips are a separate payment transaction, not part of the original booking charge.

- **Post-lesson flow trigger:** The post-lesson rating and tip flow is
  unlocked for the student when the booking status changes to `completed`
  (either by instructor action or auto-completion at +2 hours).

- **Waitlist notification window:** The waitlist accept window is 2 hours.
  This is a platform-wide fixed value in v1.0. Configurable per resort
  is deferred to v1.5.

- **Shift4 merchant model:** Shift4 requires Growth tier minimum.
  Starter tier is Stripe-only. No platform MID or PayFac model in v1.0.
  Shift4/Starter deferred to v1.5.

- **Payment credential schemas:**
  Stripe (any tier): `secretKey` (required) + `webhookSecret` (required).
  Shift4 (Growth+): `model: direct` + `apiKey` + `merchantId` + `webhookSecret` (all required).
  All fields encrypted via AWS KMS.

- **Right-to-erasure scope:**
  `GuestCheckout`: pseudonymise personal fields to "ERASED".
  `Payment`: nullify `guestCheckoutId` FK; retain financial fields (tax retention 7yr US / 6yr CA).
  `WaitlistEntry.guestEmail`: delete record entirely; index for erasure lookup; auto-purge after 90 days.
  `BookingNote`: replace learner FK with ERASED_GUEST placeholder; retain note content; auto-purge after 2 years.
  `AuditLog`: retain in full; legal basis: fraud prevention and financial compliance; max retention 3 years.
  Log userId only in metadata — never raw email addresses.

- **French translation priority:** Booking widget and guest-facing surfaces
  first. Full admin dashboard bilingual support follows in Beta.

- **Card-on-file token vault:** Processor-managed only. No cross-processor
  token mapping in v1.0. If a resort switches processors, stored cards
  become invalid. Deferred to v1.5.

- **Household minimum age threshold:** Learner sub-profiles support minors
  under 18. Minimum age for an independent account is 18. Variation by
  province/state to be addressed in legal review before GA.

- **Group lesson capacity limits:** Set at the lesson type level in v1.0.
  School-level overrides deferred to v1.5.

- **Instructor payroll:** Report-only with Workday handoff in v1.0.
  Direct deposit integration deferred to v2.0.

- **Electronic waiver storage:** Legal requirements by state/province to be
  confirmed before GA. Waiver signature captured at booking in v1.0 as
  a boolean acknowledgement; full digital signature with legal review in v1.5.

## 2026-03-20

- **Booking payload fields:** `POST /api/v1/bookings` includes:
  `lessonTypeId`, `learnerId`, `instructorId`, `startAt`, `paymentMethodId`,
  `guestCheckoutId` (nullable), `reservationId` (nullable),
  `sessionToken` (nullable, expires 15 minutes).
  `tipAmountCents` removed — tips are post-lesson only.

- **Age and skill level collection:** Collected at the browse/availability
  stage (UC-001), not at checkout. Carried through the session to checkout
  and into the learner profile if account is created post-payment.

- **Post-payment account creation:** After payment is captured, guest is
  prompted to create an account. Learner sub-profile is pre-populated with
  age, skill level, and booking data. Guest may skip — confirmation sent
  to email regardless.

- **Soft-hold mechanism:** `reservationId` links a soft-hold to a confirmed
  booking. `sessionToken` prevents race conditions — expires after 15 minutes.
  Not all booking flows require a soft-hold.

- **Monetary amounts:** All monetary amounts stored as integers (cents).
  Never floats. Currency stored alongside amount.

- **Soft deletes:** Preferred over hard deletes for all booking-related
  entities. Hard deletes only for erasure-scoped PII fields.

- **Tenant currency:** Each resort operates in a single currency (USD or CAD)
  set at onboarding. No real-time FX conversion. No mixed-currency tenants.

- **Platform fee:** 1.5% applied to all transactions in the transaction's
  native currency.

- **Starter tier:** Stripe only. 1 instructor, 100 bookings/month.
  No Shift4, no multi-school, no white-label in Starter.
