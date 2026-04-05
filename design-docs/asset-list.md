# Slopebook — UI/UX Asset List

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-04-04
**Pipeline:** pipeline-generate.yaml
**Sources:** use-cases-p0-proposed.md (Run 10), tech-requirements-proposed.md (Run 10), ux-flows.md

---

## Customer App

---

### Customer / Booking Widget — Home

**Route:** /
**UC:** UC-001
**Elements:** LessonTypeSelector, AgeInput, SkillLevelSelector, DatePicker, AvailabilityGrid, InstructorCard
**States:** loading, empty (no availability), results, no-availability (waitlist prompt)
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

---

### Customer / Instructor Profile

**Route:** /instructors/:id
**UC:** UC-002
**Elements:** InstructorPhoto, BilingualBio, CertificationBadges, LanguagesList, StarRating, SelectButton
**States:** loading, error
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Authentication Gate

**Route:** /checkout/auth
**UC:** UC-003, UC-004
**Elements:** GuestContinueButton, SignInForm, CreateAccountLink, LanguageToggle
**States:** default, loading
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Guest Checkout Form

**Route:** /checkout/guest
**UC:** UC-003
**Elements:** EmailInput, NameInputs, DateOfBirthInput, SkillLevelSelector, LanguageToggle, ParentalConsentCheckbox, SubmitButton
**States:** default, validation-error, loading, age-blocked (AGE_TOO_YOUNG)
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Payment Screen

**Route:** /checkout/payment
**UC:** UC-003, UC-004, UC-005
**Elements:** ProcessorSDKEmbed, SaveCardToggle, DefaultCardBadge, CardOnFileList, PaymentSummary, ConfirmButton, HoldExpiryTimer
**States:** loading, processing, declined (PAYMENT_FAILED), hold-expired (HOLD_EXPIRED)
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

---

### Customer / Booking Confirmation

**Route:** /booking/:id/confirmation
**UC:** UC-003, UC-004, UC-005, UC-020
**Elements:** BookingSummaryCard, InstructorDetails, IcsDownloadLink, AddToCalendarButton, AccountCreationPrompt
**States:** success, error
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

---

### Customer / Post-Payment Account Creation Prompt

**Route:** /checkout/create-account
**UC:** UC-003
**Elements:** PrePopulatedForm (email, learner data), PasswordInput, SkipButton, CreateAccountButton
**States:** default, loading, success
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Account Dashboard

**Route:** /account
**UC:** UC-018, UC-005
**Elements:** UpcomingLessonsList, HouseholdMemberList, PaymentMethodList, BookingHistoryLink, LanguageToggle
**States:** loading, empty (no upcoming lessons), populated
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

---

### Customer / Learner Management

**Route:** /account/learners
**UC:** UC-018
**Elements:** LearnerCard, AddLearnerForm, EditLearnerForm, DeleteButton, ParentalConsentBadge
**States:** loading, empty, populated, delete-blocked (LEARNER_HAS_ACTIVE_BOOKINGS)
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Payment Methods

**Route:** /account/payment-methods
**UC:** UC-018, UC-006
**Elements:** CardList, AddCardButton, SetDefaultButton, RemoveButton, ProcessorSDKEmbed
**States:** loading, empty, populated
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Post-Lesson Review

**Route:** /booking/:id/review
**UC:** UC-007
**Elements:** StarRatingInput, CommentTextarea, SubmitRatingButton, TipSection, TipAmountInput, TipPaymentMethodSelector, SubmitTipButton, TipWindowExpiryNotice
**States:** loading, rating-pending, rating-submitted, tip-pending, tip-submitted, tip-window-expired (TIP_WINDOW_EXPIRED), already-rated (RATING_ALREADY_SUBMITTED)
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

---

### Customer / Waitlist Join

**Route:** /waitlist/join
**UC:** UC-008
**Elements:** WaitlistModeSelector (time-slot / instructor), LessonTypeDisplay, DateDisplay, InstructorSelector, SubmitButton
**States:** default, loading, success, already-on-waitlist
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Contact School Card

**Route:** /booking/:id/cancel-info
**UC:** UC-006
**Elements:** SchoolContactDetails, PolicySummary, PhoneLink, EmailLink
**States:** default
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

## Admin App

---

### Admin / Schedule View

**Route:** /admin/schedule
**UC:** UC-014
**Elements:** DayWeekMonthToggle, InstructorLanes, BookingDragTarget, ConflictIndicator, DateNavigator, ReassignModal
**States:** loading, populated, conflict (BOOKING_CONFLICT), empty-day
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

---

### Admin / Booking List

**Route:** /admin/bookings
**UC:** UC-014
**Elements:** BookingTable, FilterBar (instructor, lesson type, date, status), CancelButton, BulkCancelButton, ExportButton
**States:** loading, empty, populated, bulk-cancel-confirmation
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

---

### Admin / Booking Detail

**Route:** /admin/bookings/:id
**UC:** UC-014, UC-006
**Elements:** BookingSummary, LearnerDetails, PaymentSummary, SessionNotesList, CancelButton, ReassignButton
**States:** loading, populated
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

---

### Admin / Instructor Roster

**Route:** /admin/instructors
**UC:** UC-015
**Elements:** InstructorTable, OnboardingStatusBadge, CertExpirySoonBadge, FilterBar, ApproveButton, AddInstructorButton
**States:** loading, empty, populated, pending-approvals
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

---

### Admin / Instructor Detail

**Route:** /admin/instructors/:id
**UC:** UC-015
**Elements:** ProfileForm, CertificationList, AddCertForm, WorkdayHandoffButton, ApproveButton, EarningsSummary
**States:** loading, pending, approved, certification-expiry-warning
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

---

### Admin / Waitlist Panel

**Route:** /admin/waitlist
**UC:** UC-016
**Elements:** WaitlistTable, FilterBar, PromoteButton, NotificationHistoryTooltip
**States:** loading, empty, populated
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

---

### Admin / Lesson Type Configuration

**Route:** /admin/lesson-types
**UC:** UC-017
**Elements:** LessonTypeTable, CreateLessonTypeForm, EditLessonTypeForm, DeactivateButton, CancellationPolicySelector
**States:** loading, empty, populated
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

---

### Admin / Cancellation Policy Configuration

**Route:** /admin/cancellation-policies
**UC:** UC-017
**Elements:** PolicyList, CreatePolicyForm, EditPolicyForm, SetDefaultButton, DefaultBadge
**States:** loading, empty, populated
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

---

### Admin / Walk-Up Booking Form

**Route:** /admin/walk-up
**UC:** UC-021
**Elements:** CustomerSearchInput, CreateCustomerForm (email, name, DOB, skill, language), LearnerConfirmationCard, SlotSelector, BookingConfirmButton
**States:** loading, new-customer, existing-customer, booking-confirmed, payment-error
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

---

## Instructor App (PWA)

---

### Instructor / Today's Schedule

**Route:** /schedule
**UC:** UC-009, UC-013
**Elements:** LessonCardList, DateNavigator, CheckInButton, CompleteButton, NoShowButton, EmptyStateIllustration
**States:** loading, empty, populated, all-complete
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

---

### Instructor / Lesson Detail

**Route:** /schedule/:bookingId
**UC:** UC-009, UC-010, UC-011, UC-012
**Elements:** StudentInfoCard, SkillLevelBadge, MeetingPointDisplay, PriorNotesList, AddNoteButton, CheckInButton, CompleteButton, NoShowButton
**States:** loading, pre-checkin, checked-in, completed, no-show
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

---

### Instructor / Session Notes

**Route:** /schedule/:bookingId/notes
**UC:** UC-012
**Elements:** NotesList, NoteComposer, ShareWithStudentToggle, SubmitButton
**States:** loading, empty, populated, saving
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

---

### Instructor / Availability Management

**Route:** /availability
**UC:** UC-023
**Elements:** WeeklyGrid, RecurringRuleForm, DateOverrideForm, BlockDateButton, SaveButton
**States:** loading, empty, populated, conflict-warning
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

---

## Shared Components

---

### LanguageToggle

**Surfaces:** customer, instructor, admin
**UC:** UC-022
**Variants:** header-inline, settings-page, checkout-flow, guest-checkout-form

---

### InstructorCard

**Surfaces:** customer
**UC:** UC-001, UC-002
**Variants:** compact (grid), expanded (profile), selected

---

### BookingSummaryCard

**Surfaces:** customer, admin, instructor
**UC:** UC-003, UC-004, UC-005, UC-014
**Variants:** confirmation, list-item, detail

---

### HoldExpiryTimer

**Surfaces:** customer
**UC:** UC-001, UC-003
**Variants:** active, expiring-soon (< 2 min), expired

---

### StarRatingInput

**Surfaces:** customer
**UC:** UC-007
**Variants:** interactive, read-only, submitted

---

### TipForm

**Surfaces:** customer
**UC:** UC-007
**Variants:** default, submitted, window-expired

---

### ContactSchoolCard

**Surfaces:** customer
**UC:** UC-006
**Variants:** cancel-blocked (guest), generic-support

---

### ProcessorSDKEmbed

**Surfaces:** customer, admin
**UC:** UC-003, UC-004, UC-005, UC-021
**Variants:** stripe-elements, shift4-embed

---

### CertificationBadge

**Surfaces:** customer, admin, instructor
**UC:** UC-002, UC-015
**Variants:** valid, expiring-soon, expired

---

## Design Tokens Needed

- `--color-hold-expiry-warning` — amber; used in HoldExpiryTimer (expiring-soon state)
- `--color-no-show-indicator` — muted red; used in Instructor / Today's Schedule no-show state
- `--color-booking-complete` — green; used in Instructor / Lesson Detail completed state
- `--color-conflict-indicator` — red; used in Admin / Schedule View conflict state
- `--color-cert-expiry-warning` — amber; used in CertificationBadge expiring-soon
- `--spacing-card-compact` — 12px; InstructorCard compact grid variant
- `--font-size-rating-star` — 24px; StarRatingInput interactive
- `--duration-hold-timer` — animation: countdown from 15 min; HoldExpiryTimer

---

## Asset Checklist

- [ ] Screens: 13 (customer app)
- [ ] Screens: 9 (admin app)
- [ ] Screens: 4 (instructor app — PWA)
- [ ] Shared components: 9
- [ ] Icons: booking status icons (confirmed, completed, cancelled, no_show), skill level icons (beginner, intermediate, advanced), language toggle icon, certification badge icons — est. 14
- [ ] Empty state illustrations: 4 (no availability, no upcoming lessons, today's schedule empty, no waitlist entries)
- [ ] Email templates: 7 EN + 7 FR (booking.confirmed, booking.cancelled, booking.completed post-lesson, waitlist.slot_available, booking.reminder, lesson.weather_cancel, instructor.cert_expiry)
- [ ] SMS templates: 3 EN + 3 FR (booking.confirmed, booking.cancelled, booking.reminder)

---

## UX Flows Missing a Screen

- ux-flows.md §3 "Sync with Google Calendar (optional)" — deferred v1.5 (OQ-021); no screen in P0
- ux-flows.md §3 "Tips (if applicable)" under Instructor Earnings Dashboard — tips are customer-submitted (TipForm on Customer / Post-Lesson Review); Instructor Earnings Dashboard is P1; no P0 screen needed for instructor tip view
- ux-flows.md §3 "optional digital signature" at check-in — Smartwaiver deferred (OQ-052); no digital signature screen in P0; Instructor / Lesson Detail check-in button proceeds without signature
