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
