# Slopebook — Use Cases (P0)

**Document Status:** Draft — Generate Pipeline Run 7
**Last Updated:** 2026-03-29
**Author:** Product-Lead Agent
**Scope:** P0 (Alpha — Q2 2026) use cases only

---

## UC-001 — Browse available lesson slots

**Persona:** Guest / Head of Household
**Goal:** Discover available instructors and time slots for a chosen lesson type and skill level.
**Preconditions:**
- Tenant booking widget is accessible
- At least one LessonType with isActive = true exists
- At least one Instructor with approved onboarding status exists

**Main Flow:**
1. Guest selects lesson type (private, semi-private, group, etc.) and skill level.
2. System queries available instructors filtered by skill level and lesson type.
3. Guest optionally browses instructor profile cards (photo, bio in preferred language, certifications, rating).
4. Guest selects a date; system returns real-time availability for that date.
5. Guest selects a time slot; system shows available instructor(s) for that slot.
6. Guest proceeds to booking summary.

**Alternate Flows:**
- No availability on selected date → guest sees empty state with option to join waitlist (P1).
- Guest prefers specific instructor → filters grid before selecting date.

**Postconditions:**
- Selected lesson type, instructor, and time slot are held in session state.
- No SlotReservation created yet (created at UC-002).

**Priority:** P0
**Note (OQ-041):** No cross-tenant conflict detection for multi-resort instructors in v1.0.

---

## UC-002 — Reserve a slot (soft hold)

**Persona:** Guest / Head of Household
**Goal:** Hold a specific time slot for 15 minutes while completing checkout.
**Preconditions:**
- Guest has selected lesson type, instructor, and time slot (UC-001).

**Main Flow:**
1. Guest confirms booking summary (lesson details, instructor, price in resort currency).
2. System creates a SlotReservation with expiresAt = now + 15 minutes and status = active.
3. System returns sessionToken for use through the rest of checkout.
4. Visible countdown timer activates in the booking widget UI.
5. Guest proceeds to authentication gate (UC-003 or UC-004).

**Alternate Flows:**
- Slot taken before SlotReservation created → BOOKING_CONFLICT error; guest returns to slot selection.

**Postconditions:**
- SlotReservation exists with status = active; instructor slot locked for 15 minutes.
- Countdown timer is visible throughout remaining checkout steps.

**Priority:** P0
**Note (OQ-011):** Soft-hold TTL is 15 minutes, platform constant.

---

## UC-003 — Guest checkout booking

**Persona:** Guest (no account)
**Goal:** Complete a booking without creating an account.
**Preconditions:**
- Active SlotReservation exists (UC-002).
- Guest has not signed in.

**Main Flow:**
1. Guest selects "Guest checkout" at the authentication gate.
2. Guest enters: first name, last name, email, optional phone, learnerDateOfBirth (required), skillLevel (required), preferredLanguage (defaults to browser geolocation per OQ-057).
3. System validates: age ≥ 5 (OQ-007); if age < 5 → AGE_TOO_YOUNG error, booking blocked.
4. If age < 18 → parental consent checkbox is shown and must be checked to continue (OQ-032).
5. System creates GuestCheckout record with all collected fields.
6. Guest enters payment details via processor JS SDK; card is not saved.
7. System captures payment via Payment Service (Stripe or Shift4 per tenant processor).
8. If booking DB write fails: retry DB write up to 3 times using captured payment (OQ-053); on 3rd failure, initiate void with 4 retries at 100ms intervals; if void fails after all retries, silently set Payment.status = void_pending (OQ-056).
9. On success: Booking confirmed with status = confirmed.
10. Confirmation email + SMS sent in guest's preferredLanguage; .ics calendar attachment included.
11. Confirmation screen shown with booking reference; guest-checkout users see ContactSchoolCard (OQ-033).

**Alternate Flows:**
- Payment declined → guest sees PAYMENT_FAILED error; slot hold remains active if TTL not expired.
- SlotReservation expired before payment → HOLD_EXPIRED; guest returns to slot selection.
- Email already used for existing account → prompt to sign in.

**Postconditions:**
- Booking.status = confirmed; GuestCheckout record exists with parentalConsentGiven if minor.
- No self-service cancel available for guest-checkout users (OQ-033).

**Priority:** P0

---

## UC-004 — Authenticated user booking

**Persona:** Guest (signed-in) / Head of Household
**Goal:** Complete a booking using an existing account, optionally using card-on-file.
**Preconditions:**
- Active SlotReservation exists (UC-002).
- User is signed in; User has a Household with at least one Learner (self-Learner auto-created at registration per OQ-048).

**Main Flow:**
1. Authenticated user selects a Learner from their Household (or the auto-created self-Learner).
2. System validates learner age and skill level (already on Learner record from registration or profile).
3. If learner age < 18 → parental consent required; system checks Learner.parentalConsentGiven (OQ-032).
4. User selects payment method (card-on-file or enters new card).
5. New card optionally saved as PaymentMethod on the Household.
6. System captures payment via Payment Service.
7. If booking DB write fails: retry DB write up to 3 times using captured payment (OQ-053); on 3rd failure, initiate void with 4 retries at 100ms intervals; if void fails after all retries, silently set Payment.status = void_pending (OQ-056).
8. On success: Booking confirmed; cancel CTA available in account dashboard.
9. Confirmation email + SMS sent; .ics included.

**Alternate Flows:**
- Card-on-file declined → user prompted to enter new card.
- Learner missing dateOfBirth or skillLevel → prompt to complete profile before booking (OQ-032).

**Postconditions:**
- Booking.status = confirmed; Booking.learnerId set.
- Cancel link available in account dashboard (UC-006).

**Priority:** P0

---

## UC-005 — Create account with self-Learner

**Persona:** Guest (new user)
**Goal:** Create a Slopebook account and be immediately able to book without additional profile setup.
**Preconditions:**
- Active SlotReservation may exist (checkout path) or user is registering standalone.

**Main Flow:**
1. Guest selects "Create account" at the authentication gate or from the main nav.
2. Guest enters email, password, phone (optional), preferredLanguage (defaults to browser geolocation per OQ-057), dateOfBirth (required), skillLevel (required).
3. System validates: age ≥ 5 (OQ-007); if age < 18 → parental consent checkbox required (OQ-032).
4. System creates User, Household, and a self-Learner sub-profile from the registration data (OQ-048).
5. If registration occurs during active slot hold: countdown timer continues to be visible (OQ-037); slot is not extended.
6. On success: user is signed in and returned to payment step.

**Alternate Flows:**
- Email already registered → prompt to sign in.
- SlotReservation expires during registration → slot silently released; user redirected to slot selection after sign-in.

**Postconditions:**
- User, Household, and Learner (self) records created.
- User is signed in and can proceed to payment (UC-004).

**Priority:** P0

---

## UC-006 — Cancel a booking

**Persona:** Guest (signed-in) / Head of Household / School Admin / Instructor (own lessons per OQ-058)
**Goal:** Cancel a confirmed upcoming booking and receive applicable refund.
**Preconditions:**
- Booking.status = confirmed.
- For customer path: user is authenticated and Booking.learnerId is in their Household.
- For instructor path: instructor has admin-level access to their own bookings (OQ-058).

**Main Flow:**
1. User selects a booking in their account dashboard and taps cancel.
2. System shows CancellationModal with the applicable refund amount based on snapshot CancellationPolicy.
3. User confirms cancellation.
4. System sets Booking.status = cancelled, cancelledAt = now.
5. If refund applicable per policy: Payment Service issues refund; confirmation email sent.
6. No-refund confirmation email sent if outside refund window.

**Alternate Flows:**
- Admin cancels on behalf of customer → admin uses booking management screen; same flow.
- Instructor cancels own lesson → treated as admin-level cancellation; student notified; admin alerted.
- Guest-checkout user → no self-service cancel; Confirmation screen shows ContactSchoolCard with school email and phone (OQ-033).

**Postconditions:**
- Booking.status = cancelled; refund issued if policy permits.
- Instructor schedule slot freed.

**Priority:** P0

---

## UC-007 — Rate an instructor after a lesson

**Persona:** Guest (signed-in)
**Goal:** Submit a rating and optional comment after a completed lesson.
**Preconditions:**
- Booking.status = completed.
- No existing InstructorRating for this booking.
- User is authenticated.

**Main Flow:**
1. User sees rating prompt in account dashboard for completed lesson.
2. User selects 1–5 star rating and optionally adds a comment.
3. System creates InstructorRating record (tenantId, bookingId, instructorId, rating, comment).

**Alternate Flows:**
- User dismisses prompt → no rating created; prompt removed.

**Postconditions:**
- One InstructorRating per Booking (unique constraint enforced).

**Priority:** P0
**Note (OQ-028):** Ratings are internal-only within tenant; no public-facing display.

---

## UC-008 — Instructor manages availability

**Persona:** Instructor
**Goal:** Set recurring weekly availability and date-specific overrides.
**Preconditions:**
- Instructor is approved (InstructorTenant.onboardingStatus = approved).
- Instructor is signed in.

**Main Flow:**
1. Instructor opens Availability Management screen.
2. Instructor sets recurring availability using RRULE input (e.g. Mon–Fri 9am–4pm).
3. System creates or updates Availability records with recurrence field set.
4. Instructor adds a date-specific override (e.g. unavailable Dec 26) with isBlocked = true.
5. Instructor saves; system validates for conflicts and returns conflict-error if found.

**Alternate Flows:**
- Invalid RRULE format → inline error; changes not saved.
- Override conflicts with confirmed booking → admin notified; override saved but booking not auto-cancelled.

**Postconditions:**
- Availability records updated; booking widget reflects new availability on next query.

**Priority:** P0

---

## UC-009 — Instructor views today's schedule

**Persona:** Instructor
**Goal:** See all lessons assigned for today in chronological order.
**Preconditions:**
- Instructor is signed in.

**Main Flow:**
1. Instructor opens Today's Schedule screen.
2. System returns all Bookings for today where Booking.instructorId matches and status = confirmed.
3. Each lesson card shows: student name, skill level, lesson type, meeting point, lesson time.
4. Instructor taps a card to see full student details and prior session notes.

**Alternate Flows:**
- No lessons today → empty state shown.

**Postconditions:**
- No state change; read-only view.

**Priority:** P0
**Note (OQ-055):** `in_progress` status removed from Booking enum; schedule shows only confirmed bookings.
**Note (OQ-050):** Instructor receives email notification on new booking assignment; not required for P0.

---

## UC-010 — Instructor checks in a student

**Persona:** Instructor
**Goal:** Confirm student has arrived and is ready for their lesson.
**Preconditions:**
- Booking.status = confirmed.
- Instructor is signed in.

**Main Flow:**
1. Instructor opens the booking from Today's Schedule and taps Check In.
2. System displays student details: name, dateOfBirth, skill level, parental consent indicator (if minor).
3. Instructor confirms student identity and taps Confirm Check-In.
4. System sets Booking.checkedInAt = now; status remains confirmed.

**Alternate Flows:**
- Student not present → instructor marks no-show instead (UC-011).

**Postconditions:**
- Booking.checkedInAt is set; Booking.status remains confirmed.

**Priority:** P0
**Note (OQ-052):** Smartwaiver embed integration deferred to a later phase. Waiver assumed completed for P0. No waiverToken generation or embed in P0 check-in flow.
**Note (OQ-055):** Booking.status = in_progress removed from enum. Check-in sets checkedInAt only; status transitions directly from confirmed to completed or no_show.

---

## UC-011 — Instructor marks student as no-show

**Persona:** Instructor
**Goal:** Record that a student did not appear for their lesson.
**Preconditions:**
- Booking.status = confirmed; lesson start time has passed.

**Main Flow:**
1. Instructor selects a booking and taps No Show.
2. System sets Booking.status = no_show; triggers admin alert.
3. Refund applied per noShowPolicy on snapshot CancellationPolicy.

**Alternate Flows:**
- Admin reviews no-show and manually overrides to cancelled if appropriate.

**Postconditions:**
- Booking.status = no_show; refund (if any) issued per policy.

**Priority:** P0

---

## UC-012 — Instructor adds session notes

**Persona:** Instructor
**Goal:** Record progress notes for a student after their lesson.
**Preconditions:**
- Booking.status = confirmed or completed.
- Instructor is signed in.

**Main Flow:**
1. Instructor opens Session Notes screen for a booking.
2. Instructor types notes and optionally toggles "Share with guest."
3. System creates BookingNote record; authorId = instructor User.id.

**Alternate Flows:**
- Prior notes exist → displayed in list; new note appended.

**Postconditions:**
- BookingNote created; if isSharedWithGuest = true, visible in customer's booking detail.

**Priority:** P0
**Note (OQ-055):** Precondition updated: in_progress removed; notes can be added on confirmed or completed bookings.

---

## UC-013 — Instructor marks lesson complete

**Persona:** Instructor
**Goal:** Close out a lesson after it has concluded.
**Preconditions:**
- Booking.status = confirmed; lesson end time has passed.

**Main Flow:**
1. Instructor taps Complete on a booking card.
2. System sets Booking.status = completed.
3. System queues post-lesson review email to student (booking.completed event).

**Postconditions:**
- Booking.status = completed; student can now submit a rating (UC-007).

**Priority:** P0
**Note (OQ-055):** Transition is confirmed → completed directly. in_progress status is not used.

---

## UC-014 — Admin views the schedule

**Persona:** School Admin
**Goal:** See a visual overview of all bookings and instructor assignments.
**Preconditions:**
- Admin is signed in with school_admin role.

**Main Flow:**
1. Admin opens Schedule View; default is current day.
2. System returns all Bookings for the tenant, filterable by instructor and lesson type.
3. Admin switches between day/week/month views.
4. Real-time update indicator flashes when a new booking arrives.

**Alternate Flows:**
- Admin filters by instructor → only that instructor's bookings shown.

**Postconditions:**
- No state change; read-only view with real-time updates.

**Priority:** P0

---

## UC-015 — Admin reassigns a booking to a different instructor

**Persona:** School Admin
**Goal:** Move a confirmed booking to a different available instructor.
**Preconditions:**
- Booking.status = confirmed.
- Replacement instructor is available for the time slot.

**Main Flow:**
1. Admin drags a booking card to a different instructor on the schedule (or uses reassign modal).
2. System checks for BOOKING_CONFLICT on the target instructor.
3. System updates Booking.instructorId; previous instructor's slot is freed.
4. Notification email sent to student (instructor change); notification to new instructor (OQ-050: not required for P0).

**Alternate Flows:**
- Target instructor already booked at that time → BOOKING_CONFLICT; drag reverted.

**Postconditions:**
- Booking.instructorId updated; previous instructor slot freed.

**Priority:** P0

---

## UC-016 — Admin onboards an instructor

**Persona:** School Admin
**Goal:** Add a new instructor to the tenant roster and approve their onboarding.
**Preconditions:**
- Admin is signed in.

**Main Flow:**
1. Admin creates a new Instructor profile (name, bio EN/FR, photo, certifications).
2. System creates Instructor and InstructorTenant records with onboardingStatus = pending.
3. Admin reviews and uploads certification documents.
4. Admin taps Approve; system sets InstructorTenant.onboardingStatus = approved.
5. Instructor can now log in and appear in booking widget availability.

**Alternate Flows:**
- Missing required certification → admin can save as pending; approve later.

**Postconditions:**
- InstructorTenant.onboardingStatus = approved; instructor visible in booking widget.

**Priority:** P0

---

## UC-017 — Admin creates or edits a lesson type

**Persona:** School Admin
**Goal:** Define a new bookable lesson offering with pricing, capacity, and policy.
**Preconditions:**
- Admin is signed in.

**Main Flow:**
1. Admin opens Lesson Configuration and creates or selects a LessonType.
2. Admin sets nameEn, nameFr, category, durationMinutes, priceAmount, currency, maxCapacity, skillLevels, meetingPoint.
3. Admin selects or creates a cancellation policy to attach.
4. Admin sets isActive = true to make lesson bookable.

**Alternate Flows:**
- Admin deactivates a lesson type → isActive = false; existing bookings unaffected.

**Postconditions:**
- LessonType saved; immediately visible in booking widget if isActive = true.

**Priority:** P0

---

## UC-018 — Admin creates or edits a cancellation policy

**Persona:** School Admin
**Goal:** Define refund rules applied when a booking is cancelled.
**Preconditions:**
- Admin is signed in.

**Main Flow:**
1. Admin opens Cancellation Policies and creates a new policy.
2. Admin builds refund rules (ordered rows: hours-before → refundPercent%).
3. Admin sets noShowPolicy (no_refund, partial_refund, or full_refund) and noShowRefundPercent if applicable.
4. Admin optionally marks policy as default; unique partial index enforces one default per tenant.

**Alternate Flows:**
- Admin sets-as-default → previous default automatically cleared.

**Postconditions:**
- CancellationPolicy saved; can be attached to LessonTypes.

**Priority:** P0
**Note (OQ-014):** Default non-refundable policy seeded atomically at tenant creation.

---

## UC-019 — Admin bulk-cancels bookings for weather

**Persona:** School Admin
**Goal:** Cancel all bookings on a day or for a set of instructors due to weather closure.
**Preconditions:**
- Admin is signed in; at least one confirmed booking exists for the target date/instructor.

**Main Flow:**
1. Admin applies filters (date, instructor, lesson type) in Booking Management.
2. Admin taps Weather Bulk Cancel CTA; system shows confirmation modal with affected count and total refund amount.
3. Admin confirms; system sets all matching Bookings to status = cancelled.
4. Refunds issued per each booking's snapshot CancellationPolicy.
5. Cancellation emails sent to all affected students (transactional; no CASL issue per OQ-044).

**Alternate Flows:**
- Partial cancellation (subset of instructors) → admin re-filters and re-runs.

**Postconditions:**
- All matched Bookings cancelled; refunds queued; students notified.

**Priority:** P0

---

## UC-020 — Admin tracks instructor certification expiry

**Persona:** School Admin
**Goal:** Be alerted to certifications approaching or past expiry and take corrective action.
**Preconditions:**
- Admin is signed in; Certifications exist with expiresAt populated.

**Main Flow:**
1. Admin views Staff Roster; CertificationExpiryBadge shows amber (< 60 days) or red (expired).
2. Admin opens Instructor Profile; views full certification list with expiry dates.
3. Admin uploads renewed certification document and updates expiresAt.
4. System records alertSentAt when expiry alert email was sent.

**Alternate Flows:**
- Expired instructor still has future bookings → admin notified; admin decides whether to reassign.

**Postconditions:**
- Certification record updated; badge reverts to valid state.

**Priority:** P0

---

## UC-021 — Admin creates a manual booking

**Persona:** School Admin
**Goal:** Create a booking on behalf of a customer (phone-in or walk-up).
**Preconditions:**
- Admin is signed in; target instructor has availability for the desired slot.

**Main Flow:**
1. Admin opens Booking Management and selects Create Booking.
2. Admin selects lesson type, instructor, date/time.
3. For existing customer: admin searches and selects the customer's Learner record.
4. For walk-up customer with no account: admin creates a new User account and Learner profile on their behalf (OQ-054).
5. Admin selects or enters payment method; system captures payment.
6. System creates Booking linked to the Learner; CHECK constraint `(learnerId IS NOT NULL)` satisfied.

**Alternate Flows:**
- No availability for requested slot → admin checks schedule view and selects alternate.

**Postconditions:**
- Booking confirmed; confirmation sent to customer's email.
- Walk-up customer now has a full account and booking history from first visit.

**Priority:** P0
**Note (OQ-054):** Admin creates a full User + Learner record for walk-up customers rather than using GuestCheckout. Walk-up customers get full accounts.

---

## UC-022 — User changes language preference

**Persona:** Any authenticated user
**Goal:** Switch the UI and all future communications to French or English.
**Preconditions:**
- User is signed in.

**Main Flow:**
1. User opens account Settings or taps the LanguageToggle in the header.
2. User selects EN or FR.
3. System updates User.preferredLanguage; UI re-renders in selected language immediately.
4. All future emails and SMS sent in selected language.

**Postconditions:**
- User.preferredLanguage updated; UI and communications reflect new language.

**Priority:** P0
**Note (OQ-030):** FR language available on all subscription tiers including Starter. No tier-based suppression required.

---

## UX Flows Missing Steps

- `ux-flows.md §3 Instructor App` — "Sync with Google Calendar (optional)" listed under Availability Management; deferred to v1.5 (OQ-021); no UC defined for P0 or P1
- `ux-flows.md §3 Instructor App` — "Tips (if applicable)" listed in Earnings Dashboard; removed from all plans (OQ-043); no UC
- `ux-flows.md §5 Operator Portal` — "Pricing floors and seasonal rate cards" listed; removed from v1.0 scope (OQ-042)
- `ux-flows.md §1 Customer` — "Select learner (if household account)" step has no P0 screen for adding a new learner mid-checkout; deferred to P1 household management (UC-023)
