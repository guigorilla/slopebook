# Slopebook — UI/UX Asset List (Proposed)

**Document Status:** Draft — Generate Pipeline Run 6
**Last Updated:** 2026-03-28
**Author:** UI/UX Lead Agent
**Source:** use-cases-p0-proposed.md (Run 6), tech-requirements-proposed.md (Run 6), ux-flows.md
**Scope:** P0 screens and components only. P1/P2 screens excluded.

---

## Customer App Screens

### Customer / Booking Widget — Lesson Selection
**Route:** /book
**UC:** UC-001
**Elements:** lesson type selector, skill level selector, instructor grid, instructor profile card
**States:** loading, empty (no availability), filtered
**Breakpoint:** mobile
**i18n:** yes — all labels and instructor bio in EN/FR based on preferred language (OQ-030: all tiers)
**Currency:** no

### Customer / Booking Widget — Date & Time Picker
**Route:** /book/schedule
**UC:** UC-001, UC-002
**Elements:** calendar, time slot list, instructor availability indicator (green = available, gray = unavailable), countdown timer (activates on SlotReservation creation)
**States:** loading, empty (no slots), slot-taken (BOOKING_CONFLICT), countdown-warning (< 2 min), countdown-expired
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

### Customer / Booking Widget — Booking Summary
**Route:** /book/summary
**UC:** UC-001, UC-002
**Elements:** lesson details card, instructor card, price display, language toggle, confirm CTA, countdown timer
**States:** default, hold-expired warning
**Breakpoint:** mobile
**i18n:** yes
**Currency:** yes

### Customer / Booking Widget — Authentication Gate
**Route:** /book/auth
**UC:** UC-003, UC-004, UC-005
**Elements:** guest checkout option, sign-in form, create account form, learner date of birth field (required), skill level selector (required), parental consent checkbox (conditional: age < 18), countdown timer
**States:** default (guest/sign-in/register tabs), consent-required (minor detected), slot-expired, sign-in-error, registration-error, email-conflict
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

### Customer / Booking Widget — Payment
**Route:** /book/payment
**UC:** UC-003, UC-004
**Elements:** processor JS SDK card field, save-card checkbox (authenticated users only), pay CTA, price summary, countdown timer
**States:** default, processing, payment-error (card declined), booking-failed (3 retries exhausted, payment voided), hold-expired
**Breakpoint:** mobile
**i18n:** yes
**Currency:** yes

### Customer / Booking Widget — Confirmation
**Route:** /book/confirmation
**UC:** UC-003, UC-004
**Elements:** booking reference, lesson summary, instructor name, calendar add (.ics), email confirmation notice
**States:** success (guest-checkout: ContactSchoolCard shown; authenticated: manage-booking link shown)
**Breakpoint:** mobile
**i18n:** yes
**Currency:** yes

### Customer / Account — Booking Dashboard
**Route:** /account/bookings
**UC:** UC-006, UC-007
**Elements:** upcoming booking list, past booking list, cancel CTA (authenticated only), rating prompt card (completed lessons)
**States:** empty, loading, cancel-confirm modal
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

### Customer / Account — Booking Detail
**Route:** /account/bookings/:id
**UC:** UC-006, UC-007
**Elements:** lesson info, instructor card, payment receipt, session notes (if shared), cancel button (authenticated only), rating form (if completed)
**States:** upcoming, completed, cancelled, no-show
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

### Customer / Account — Settings
**Route:** /account/settings
**UC:** UC-022
**Elements:** language toggle (EN/FR — all tiers per OQ-030), email, phone, name fields, save button
**States:** default, saved, error
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

## Instructor App Screens (PWA)

### Instructor / Home — Today's Schedule
**Route:** /schedule/today
**UC:** UC-009, UC-011, UC-012, UC-013
**Elements:** lesson card list, student name, skill level badge, lesson type label, meeting point, check-in CTA, no-show CTA, complete CTA
**States:** empty, loading, checked-in, no-show, completed
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

### Instructor / Check-In
**Route:** /schedule/:bookingId/checkin
**UC:** UC-010
**Elements:** student details (name, DOB, skill level, parental consent indicator for minors), confirm check-in CTA
**States:** default, already-checked-in
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no
**Note (OQ-052):** Smartwaiver embed deferred. No iframe, no 15s timer, no typed-name fallback in P0.

### Instructor / Session Notes
**Route:** /schedule/:bookingId/notes
**UC:** UC-012
**Elements:** notes textarea, share-with-guest toggle, save button, prior notes list
**States:** empty, saved, error
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

### Instructor / Availability Management
**Route:** /availability
**UC:** UC-008
**Elements:** weekly calendar, recurring availability form (RRULE input), date-override form, slot list, block/unblock toggle
**States:** loading, empty, conflict-error, invalid-RRULE error
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

---

## Admin App Screens

### Admin / Schedule View
**Route:** /schedule
**UC:** UC-014, UC-015
**Elements:** drag-drop calendar, day/week/month switcher, instructor filter, lesson type filter, booking card, real-time update indicator, reassign modal
**States:** loading, empty, conflict-blocked, real-time-update flash
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

### Admin / Booking Management
**Route:** /bookings
**UC:** UC-021, UC-015, UC-019
**Elements:** bookings table, filter bar (instructor, lesson type, date, status), weather bulk-cancel CTA, booking detail drawer, cancel CTA, bulk-cancel confirmation modal (affected count + refund total)
**States:** loading, empty, bulk-cancel-confirm modal, bulk-cancel-processing
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

### Admin / Instructor Management — Staff Roster
**Route:** /instructors
**UC:** UC-016, UC-020
**Elements:** instructor list, onboarding status badge, approve CTA, certification expiry alert badge, add instructor CTA
**States:** loading, empty, pending-approval, expiry-warning, expired
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

### Admin / Instructor Management — Instructor Profile
**Route:** /instructors/:id
**UC:** UC-016, UC-020
**Elements:** instructor details, certification list, add certification form, document upload, onboarding status controls, approve/deactivate CTA
**States:** pending, approved, inactive, expiry-alert
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

### Admin / Lesson Configuration — Lesson Types
**Route:** /config/lesson-types
**UC:** UC-017
**Elements:** lesson type list, create/edit form (nameEn, nameFr, category, price, capacity, skill levels, meeting point, cancellation policy selector), activate/deactivate toggle
**States:** loading, empty, form-error
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

### Admin / Lesson Configuration — Cancellation Policies
**Route:** /config/cancellation-policies
**UC:** UC-018
**Elements:** policy list, create/edit form (refund rules builder: ordered rows of hours → refund%, no-show policy dropdown, no-show refund % conditional), set-as-default CTA
**States:** loading, empty, form-error
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

---

## Shared Components

### BookingCard
**Surfaces:** customer, admin, instructor
**UC:** UC-003, UC-004, UC-009, UC-014
**Variants:** upcoming, in-progress, completed, cancelled, no-show

### InstructorProfileCard
**Surfaces:** customer
**UC:** UC-001
**Variants:** compact (grid), expanded (modal); bio in user's selected language

### LanguageToggle
**Surfaces:** customer, instructor, admin — all tiers including Starter (OQ-030)
**UC:** UC-022
**Variants:** header-inline, settings-page

### HoldCountdownTimer
**Surfaces:** customer — all checkout steps (UC-002 through UC-005)
**UC:** UC-002, UC-003, UC-004, UC-005
**Variants:** active (green), warning (< 2 min, amber), expired (red + "slot expired" message)

### CancellationModal
**Surfaces:** customer (authenticated only), admin
**UC:** UC-006
**Variants:** with-refund (shows refund amount), no-refund (shows "no refund" warning)

### ContactSchoolCard
**Surfaces:** customer booking confirmation (guest-checkout path only)
**UC:** UC-006 (alternate flow — OQ-033)
**Variants:** inline (on confirmation screen)
**Content:** school name, email, phone; shown only when guestCheckoutId is set on the booking

### RatingForm
**Surfaces:** customer
**UC:** UC-007
**Variants:** star-only, star-with-comment

### CertificationExpiryBadge
**Surfaces:** admin
**UC:** UC-020
**Variants:** valid, expiring-soon (< 60 days, amber), expired (red)

### RefundRulesBuilder
**Surfaces:** admin
**UC:** UC-018
**Variants:** default (read-only), custom (editable ordered rows)

### ParentalConsentCheckbox
**Surfaces:** customer authentication gate, instructor check-in
**UC:** UC-003, UC-005, UC-010
**Variants:** inline-checkout, check-in-screen
**Behaviour:** displayed only when learner age < 18; disables continue CTA until checked

---

## Design Tokens Needed

- `color-hold-warning` — amber (#F59E0B) — HoldCountdownTimer warning state (< 2 min)
- `color-hold-expired` — red (#EF4444) — HoldCountdownTimer expired state
- `color-expiry-critical` — red (#EF4444) — CertificationExpiryBadge expired
- `color-expiry-warning` — amber (#F59E0B) — CertificationExpiryBadge expiring-soon
- `color-onboarding-pending` — yellow-500 — Staff Roster onboarding status badge
- `color-no-show` — gray-400 — BookingCard no-show variant
- `color-minor-consent-required` — orange-400 — ParentalConsentCheckbox highlight when required
- `radius-card-lesson` — 12px — lesson cards across all surfaces
- `shadow-booking-card` — medium elevation — booking cards on mobile
- `font-size-currency-display` — 24px / semibold — price display in Booking Summary and Payment
- `spacing-mobile-touch-target` — 48px min height — all primary CTAs on mobile
- `color-instructor-available` — green-500 — availability indicator in Date & Time Picker
- `color-instructor-unavailable` — gray-300 — unavailable slot indicator

---

## Asset Checklist

- [ ] Screens: 9 (customer app)
- [ ] Screens: 4 (instructor PWA)
- [ ] Screens: 6 (admin app)
- [ ] Shared components: 10
- [ ] Email templates: 5 EN + 5 FR (booking confirmation, cancellation, instructor change, no-show alert, post-lesson review prompt)
- [ ] SMS templates: 2 EN + 2 FR (booking confirmation, cancellation)
- [ ] Empty state illustrations: 3 (no lessons today — instructor, no bookings — customer, no results — admin)
- [ ] Processor JS SDK integration: 2 (Stripe Elements, Shift4 embed)
- [ ] .ics calendar attachment generator: 1

---

## UX Flows Missing a Screen

- ux-flows.md §1 — "Join waitlist" node has no customer-facing screen defined (P1 feature; deferred)
- ux-flows.md §3 — "Sync with Google Calendar" listed in Availability Management; deferred to v1.5 (OQ-021); no screen needed
- ux-flows.md §5 — Operator portal screens not included in P0 scope; deferred to P2
