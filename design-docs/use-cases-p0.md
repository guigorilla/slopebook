# Slopebook — Use Cases P0

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-04-04
**Pipeline:** pipeline-generate.yaml
**Sources:** overview.md, ux-flows.md, open-questions.md (Run 9), uc-registry.md, decisions.md

---

## UC-001 — Browse and select available lesson slot

**Persona:** Guest / Head of Household
**Goal:** Find an available lesson slot matching the learner's age, skill level, and preferred date, and hold it during checkout
**Preconditions:**
- Tenant booking widget is accessible
- At least one active LessonType exists with instructor availability on the requested date

**Main Flow:**
1. Student selects lesson type (private / semi-private / group / half-day / full-day)
2. Student enters learner age and skill level; system filters eligible instructors
3. System queries GET /api/v1/availability?lessonTypeId=&date=&age=&skillLevel= and displays matching slots
4. Student optionally browses instructor profile cards (UC-002)
5. Student selects a time slot and instructor
6. System creates SlotReservation (POST /api/v1/slot-reservations); returns sessionToken + expiresAt (15 min TTL)
7. Student proceeds to checkout holding sessionToken

**Alternate Flows:**
- No availability for date: student offered waitlist path (UC-008)
- Slot taken mid-selection: BOOKING_CONFLICT returned; student shown next available slot
- Student changes date: availability calendar refreshes; new query issued

**Postconditions:**
- SlotReservation.status = active; sessionToken held by client
- Checkout must complete within 15 minutes or hold expires (HOLD_EXPIRED)

**Priority:** P0

---

## UC-002 — View instructor profile

**Persona:** Guest / Head of Household
**Goal:** Review an instructor's credentials, bio, languages, and rating before selecting them
**Preconditions:**
- Instructor exists; InstructorTenant.onboardingStatus = approved

**Main Flow:**
1. Student taps instructor card in booking widget
2. System calls GET /api/v1/instructors/:id
3. System displays photo, bioEn/bioFr (based on preferredLanguage), certifications, languagesSpoken, averageRating

**Alternate Flows:**
- Language toggle: bio switches between EN and FR instantly
- Student navigates back without selecting this instructor

**Postconditions:**
- No state change; read-only profile view

**Priority:** P0

---

## UC-003 — Guest checkout

**Persona:** Guest (unauthenticated)
**Goal:** Complete a booking and payment without creating an account
**Preconditions:**
- SlotReservation is active (sessionToken valid, not expired)
- Tenant payment processor is configured

**Main Flow:**
1. Guest selects "Continue as Guest" at the authentication gate
2. Guest submits GuestCheckout record (POST /api/v1/guest-checkouts): email, firstName, lastName, learnerDateOfBirth, skillLevel, preferredLanguage; parentalConsentGiven required if age < 18
3. System validates: learner age ≥ 5 (AGE_TOO_YOUNG if not); parentalConsentGiven = true required if age < 18
4. Guest enters card details via processor SDK embed (Stripe Elements or Shift4 embed for Growth+)
5. System creates Booking (POST /api/v1/bookings): guestCheckoutId set, learnerId = null, paymentMethodId = null
6. Payment Service captures charge; platformFeeCents = 1.5% of amountCents
7. Booking.status = confirmed; SlotReservation.status = converted
8. Notification Service sends confirmation email + SMS in preferredLanguage; .ics calendar attachment included
9. Guest shown optional post-payment account creation prompt (skippable; learner data pre-populated)

**Alternate Flows:**
- sessionToken expired (HOLD_EXPIRED): slot released; guest returned to availability view
- Payment declined (PAYMENT_FAILED): booking not created; guest retries with different card
- Booking DB write fails post-capture: 3 retries; if all fail, void payment (4 attempts at 100ms intervals); Payment.status = void_pending if void fails (OQ-056)
- Growth+ tenant: Shift4 embed used instead of Stripe

**Postconditions:**
- Booking confirmed; Booking.guestCheckoutId set, Booking.learnerId = null
- Payment.paymentType = booking_charge; Payment.status = captured
- Confirmation sent in guest's preferredLanguage with .ics attachment

**Priority:** P0

---

## UC-004 — Authenticated checkout

**Persona:** Guest (authenticated, solo adult account)
**Goal:** Book a lesson for themselves using a stored or new payment card
**Preconditions:**
- User is authenticated (valid JWT); self-Learner auto-created at registration (OQ-048)
- SlotReservation is active

**Main Flow:**
1. Authenticated user proceeds through the authentication gate
2. System auto-selects self-Learner sub-profile
3. System displays stored payment methods (GET /api/v1/payment-methods)
4. User selects card-on-file or enters new card
5. System creates Booking (POST /api/v1/bookings): learnerId set, guestCheckoutId = null
6. Payment Service charges stored processorTokenId; 1.5% platform fee applied
7. Booking.status = confirmed; confirmation email + SMS + .ics sent in preferredLanguage

**Alternate Flows:**
- New card: tokenized via processor vault (POST /api/v1/payment-methods); optionally saved and set as default
- Payment declined (PAYMENT_FAILED): user selects different card
- sessionToken expired (HOLD_EXPIRED): user returned to availability view

**Postconditions:**
- Booking confirmed with learnerId set
- New card optionally stored as PaymentMethod

**Priority:** P0

---

## UC-005 — Household checkout and card-on-file one-click

**Persona:** Head of Household
**Goal:** Book a lesson for a household learner sub-profile; use a stored default card for one-click payment
**Preconditions:**
- Household has at least one learner sub-profile
- User is authenticated

**Main Flow:**
1. Household head reaches learner selection step; selects learner from sub-profile list
2. For returning household with default card on file: system shows one-click payment confirmation; user confirms
3. System creates Booking with selected learnerId
4. Payment captured from default PaymentMethod; confirmation sent

**Alternate Flows:**
- New learner: added inline during checkout; Learner sub-profile created before booking
- No card on file: user adds new card (POST /api/v1/payment-methods); optionally saves
- Default card declined: PaymentMethod.isValid = false; user prompted to add new card

**Postconditions:**
- Booking confirmed with learnerId set; household dashboard updated

**Priority:** P0

---

## UC-006 — Cancel booking and issue refund

**Persona:** Guest / Head of Household / School Admin / Instructor (own lessons)
**Goal:** Cancel a confirmed booking; refund issued automatically per the booking's cancellation policy
**Preconditions:**
- Booking.status = confirmed; CancellationPolicy attached to booking

**Main Flow:**
1. Actor calls PATCH /api/v1/bookings/:id/cancel
2. System evaluates CancellationPolicy.refundRules against now vs Booking.startAt
3. System calculates refund amount (full / partial / none per policy)
4. Payment Service issues refund (POST /api/v1/payments/:id/refund) to original payment method
5. Booking.status = cancelled; cancelledAt and cancellationReason recorded
6. Cancellation notice + refund confirmation sent in learner/guest language

**Alternate Flows:**
- Outside refund window: no refund issued; booking still cancelled; notice sent
- Guest checkout: guest cannot self-cancel (OQ-033); app shows ContactSchoolCard; admin cancels on their behalf
- Instructor cancels own lesson: instructors have admin-level access to their own lessons (OQ-058)

**Postconditions:**
- Booking.status = cancelled; Payment.status = refunded or partially_refunded per policy
- All parties notified in their preferred language

**Priority:** P0

---

## UC-007 — Submit post-lesson rating and optional tip

**Persona:** Guest / Head of Household
**Goal:** Rate the instructor after lesson completion and optionally submit a tip as a separate payment
**Preconditions:**
- Booking.status = completed (instructor action UC-013 or auto-completion at endAt + 2h)
- No InstructorRating exists for this booking

**Main Flow:**
1. Student receives post-lesson email (booking.completed event) with one-click link
2. Student opens post-lesson flow via email link or account dashboard
3. Student submits rating: POST /api/v1/bookings/:id/review with rating (1–5) and optional comment
4. System creates InstructorRating; application layer recomputes Instructor.averageRating
5. Student optionally submits tip: POST /api/v1/bookings/:id/tip with amountCents, currency, paymentMethodId; Idempotency-Key header required
6. System validates: Booking.status = completed; within 48 hours of Booking.endAt; unique partial index on Payment ensures one tip per booking
7. Payment captured; Payment.paymentType = tip

**Alternate Flows:**
- Rating already submitted (RATING_ALREADY_SUBMITTED): tip submission still available if within window
- Tip window expired > 48h after endAt (TIP_WINDOW_EXPIRED): rating still accepted if not yet submitted
- Tip already submitted (TIP_ALREADY_SUBMITTED): idempotency key match returns existing tip response
- Guest accesses via email link: booking reference token in link; no login required

**Postconditions:**
- InstructorRating created; Instructor.averageRating recomputed
- Tip Payment optionally created; Payment.paymentType = tip
- Post-lesson link deactivated after rating submission

**Priority:** P0
**Open Questions:** none (OQ-061 resolved 2026-04-04; tips confirmed in scope)

---

## UC-008 — Join waitlist and accept offer

**Persona:** Guest / Head of Household
**Goal:** Get notified when a desired lesson slot or instructor becomes available and book immediately
**Preconditions:**
- No available slot for the requested lesson type / date

**Main Flow:**
1. Student selects "Join Waitlist" from no-availability state
2. Student selects mode: time_slot (any instructor) or instructor (specific instructor)
3. System creates WaitlistEntry (POST /api/v1/waitlist): learnerId or guestEmail, lessonTypeId, mode, targetDate, targetInstructorId if instructor mode
4. When slot opens, system sets WaitlistEntry.status = notified; sends notification with 2-hour acceptance link (OQ-009)
5. Student accepts offer (POST /api/v1/waitlist/:id/accept) within 2-hour window
6. System creates SlotReservation; routes student through checkout (UC-003 or UC-004)

**Alternate Flows:**
- Acceptance window expires (WAITLIST_WINDOW_EXPIRED): WaitlistEntry.status = expired; slot offered to next FIFO entry (OQ-034)
- Admin manually promotes student: PATCH /api/v1/waitlist/:id/promote; skips position ordering
- Student withdraws before notification: DELETE /api/v1/waitlist/:id

**Postconditions:**
- On accept: Booking confirmed; WaitlistEntry.status = accepted
- On expire: WaitlistEntry.status = expired; queue position released

**Priority:** P0

---

## UC-009 — Instructor views schedule and student details

**Persona:** Instructor
**Goal:** See today's bookings and review student details before each lesson
**Preconditions:**
- Instructor authenticated; InstructorTenant.onboardingStatus = approved

**Main Flow:**
1. Instructor opens PWA home; system calls GET /api/v1/bookings?instructorId=&status=confirmed&from=today
2. System displays lesson cards: student name, skill level, lesson type, meeting point, startAt
3. Instructor taps lesson card to expand full student details
4. System returns prior session notes: GET /api/v1/bookings/:id/notes

**Alternate Flows:**
- No bookings today: empty state shown with next upcoming lesson date
- Prior session notes exist: displayed on card expansion

**Postconditions:**
- No state change; read-only

**Priority:** P0

---

## UC-010 — Instructor checks in student

**Persona:** Instructor
**Goal:** Record that a student has arrived for their scheduled lesson
**Preconditions:**
- Booking.status = confirmed

**Main Flow:**
1. Instructor taps "Check In" on lesson card
2. System calls PATCH /api/v1/bookings/:id/checkin
3. Booking.checkedInAt = now; status remains confirmed (OQ-055; in_progress status removed)
4. Check-in confirmed on instructor screen

**Alternate Flows:**
- Student arrives late: check-in recorded at actual arrival; lesson proceeds
- Student absent: instructor marks no-show instead (UC-011)

**Postconditions:**
- Booking.checkedInAt set; Booking.status = confirmed (unchanged)

**Priority:** P0

---

## UC-011 — Instructor marks student no-show

**Persona:** Instructor
**Goal:** Record that a booked student did not appear for their lesson
**Preconditions:**
- Booking.status = confirmed; lesson start time has passed

**Main Flow:**
1. Instructor taps "No Show" on lesson card
2. System calls PATCH /api/v1/bookings/:id/no-show
3. Booking.status = no_show; admin alert notification sent
4. No refund issued per CancellationPolicy.noShowPolicy

**Alternate Flows:**
- Admin reverses no-show: manual override via admin booking management

**Postconditions:**
- Booking.status = no_show; admin alerted

**Priority:** P0

---

## UC-012 — Instructor adds session notes

**Persona:** Instructor
**Goal:** Record student progress notes after a lesson for continuity across sessions
**Preconditions:**
- Booking is assigned to this instructor

**Main Flow:**
1. Instructor opens lesson card; selects "Add Notes"
2. Instructor writes progress notes; sets isSharedWithGuest if sharing with student
3. System calls POST /api/v1/bookings/:id/notes
4. BookingNote stored: authorId, authorRole = instructor

**Alternate Flows:**
- Additional notes added later: new POST entry; notes are append-only
- Admin adds note: same endpoint; authorRole = admin

**Postconditions:**
- BookingNote created; visible to student if isSharedWithGuest = true

**Priority:** P0

---

## UC-013 — Mark lesson complete and unlock post-lesson flow

**Persona:** Instructor (manual) / System (auto-completion)
**Goal:** Transition booking to completed status and trigger the post-lesson rating and tip flow for the student
**Preconditions:**
- Booking.status = confirmed

**Main Flow:**
1. Instructor taps "Complete Lesson" on lesson card
2. System calls PATCH /api/v1/bookings/:id/complete
3. Booking.status = completed; autoCompletedAt remains null
4. booking.completed event fires
5. Notification Service sends post-lesson email with one-click rating and tip link in student's language

**Alternate Flows:**
- Auto-completion: scheduled job finds confirmed bookings where endAt + 2h ≤ now; sets status = completed; Booking.autoCompletedAt = now; AuditLog entry with actorType = system, actorId = null
- Instructor already completed manually before job runs: auto-complete skips; autoCompletedAt = null

**Postconditions:**
- Booking.status = completed; post-lesson flow unlocked (UC-007)
- booking.completed event fired; post-lesson email dispatched

**Priority:** P0
**Open Questions:** OQ-065 (scheduler interval: 5 min vs 15 min vs event-driven — unresolved)

---

## UC-014 — Admin manages schedule and bookings

**Persona:** School Admin
**Goal:** View all bookings, reassign instructors, detect conflicts, and bulk-cancel when needed
**Preconditions:**
- Admin authenticated with school_admin role

**Main Flow:**
1. Admin opens Schedule View; system calls GET /api/v1/schedule?date=&instructorId=
2. Admin sees visual scheduler with all instructors and their assigned bookings
3. Admin reassigns booking: PATCH /api/v1/bookings/:id/reassign with { instructorId, reason }
4. System validates no conflict on new instructor (BOOKING_CONFLICT if conflict); records in AuditLog
5. Admin filters booking list: GET /api/v1/bookings?instructorId=&lessonTypeId=&status=&from=&to=
6. Admin cancels individual booking: PATCH /api/v1/bookings/:id/cancel; refund per policy

**Alternate Flows:**
- Bulk cancel by date/instructor/lesson type: POST /api/v1/bookings/bulk-cancel; returns cancelled count + total refund
- Walk-up booking: admin creates User+Household+Learner (POST /api/v1/users) then proceeds through booking (UC-021)
- Real-time schedule updates as bookings arrive: push mechanism TBD (OQ-063)

**Postconditions:**
- Schedule reflects updated assignments; AuditLog entry per reassignment

**Priority:** P0
**Open Questions:** OQ-063 (real-time push mechanism: SSE / WebSocket / polling — unresolved)

---

## UC-015 — Admin approves instructor onboarding

**Persona:** School Admin
**Goal:** Review a new instructor's profile and certifications then approve them to appear in the booking widget
**Preconditions:**
- Instructor account created; InstructorTenant.onboardingStatus = pending

**Main Flow:**
1. Admin views roster filtered by onboardingStatus = pending
2. Admin reviews profile, bio, certifications; adds certification if needed (POST /api/v1/instructors/:id/certifications with documentUrl)
3. Admin approves: PATCH /api/v1/instructors/:id/approve
4. InstructorTenant.onboardingStatus = approved; instructor appears in booking widget

**Alternate Flows:**
- Certification approaching expiry: instructor.cert_expiry alert sent to school_admin
- Admin updates certification: PATCH /api/v1/instructors/:id/certifications/:certId

**Postconditions:**
- InstructorTenant.onboardingStatus = approved; instructor visible in GET /api/v1/instructors

**Priority:** P0

---

## UC-016 — Admin manages active waitlists

**Persona:** School Admin
**Goal:** Monitor waitlist entries and manually promote students ahead of the FIFO queue
**Preconditions:**
- Active WaitlistEntry records exist for tenant

**Main Flow:**
1. Admin opens Waitlist Panel; system calls GET /api/v1/waitlist
2. Admin views entries filterable by date, status, lesson type, instructor
3. Admin manually promotes a student: PATCH /api/v1/waitlist/:id/promote
4. System reorders queue and sends 2-hour acceptance notification to promoted student

**Alternate Flows:**
- Promoted student's window expires: next queue entry notified automatically
- Admin views notification history: notifiedAt and expiresAt visible per entry

**Postconditions:**
- WaitlistEntry.position updated; promoted student notified

**Priority:** P0

---

## UC-017 — Configure lesson types and cancellation policies

**Persona:** School Admin
**Goal:** Create and manage lesson types with pricing, capacity, and cancellation rules ready for bookings
**Preconditions:**
- Admin authenticated with school_admin role

**Main Flow:**
1. Admin creates lesson type: POST /api/v1/lesson-types with nameEn, nameFr, category, durationMinutes, priceAmount, currency, maxCapacity, skillLevels, cancellationPolicyId
2. Admin creates or updates cancellation policy: POST /api/v1/cancellation-policies; PATCH /api/v1/cancellation-policies/:id
3. Admin sets tenant default policy: PATCH /api/v1/cancellation-policies/:id/default
4. Admin updates existing lesson type: PATCH /api/v1/lesson-types/:id

**Alternate Flows:**
- Bulk group program sessions: admin creates lesson type then creates individual Booking or GroupSession records for each weekly occurrence (no dedicated bulk endpoint in v1.0)
- Deactivate obsolete lesson type: DELETE /api/v1/lesson-types/:id (soft; isActive = false)

**Postconditions:**
- LessonType active and visible in GET /api/v1/lesson-types; CancellationPolicy set as default

**Priority:** P0

---

## UC-018 — Household account and learner management

**Persona:** Head of Household
**Goal:** Register, manage learner sub-profiles, store payment methods, and view all upcoming household lessons
**Preconditions:**
- User is registering or is already authenticated

**Main Flow:**
1. User registers: POST /api/v1/auth/register; User + Household + self-Learner created atomically (OQ-048)
2. User adds family member: POST /api/v1/households/:id/learners with firstName, lastName, dateOfBirth, skillLevel
3. User adds card-on-file: POST /api/v1/payment-methods via processor token; PATCH /api/v1/payment-methods/:id/default to set default
4. User views all upcoming lessons: GET /api/v1/bookings?learnerId= per household member
5. User updates learner: PATCH /api/v1/households/:id/learners/:learnerId
6. User removes learner: DELETE /api/v1/households/:id/learners/:learnerId (blocked 409 LEARNER_HAS_ACTIVE_BOOKINGS if active bookings exist — OQ-036)

**Alternate Flows:**
- Language preference update: PATCH /api/v1/me with preferredLanguage
- Card removed: DELETE /api/v1/payment-methods/:id

**Postconditions:**
- Household populated with learner profiles and payment methods
- All upcoming lessons visible in account dashboard

**Priority:** P0

---

## UC-019 — Weather cancellation bulk cancel

**Persona:** School Admin
**Goal:** Cancel all bookings on a weather-closure day and notify all affected students with a rebooking link
**Preconditions:**
- Multiple confirmed bookings exist for affected date; admin authenticated

**Main Flow:**
1. Admin selects affected date and optional instructor/lesson type filters
2. Admin executes: POST /api/v1/bookings/bulk-cancel with { date, instructorId: null, lessonTypeId: null }
3. System cancels all matching confirmed bookings
4. lesson.weather_cancel event fires; Notification Service sends bulk cancellation notice + rebooking link in each student's preferredLanguage (CASL transactional — OQ-044)
5. Full refunds issued to all affected students regardless of policy (company-initiated — OQ-051)
6. System returns cancelled count + total refund amount

**Alternate Flows:**
- Partial closure: filter by instructorId or lessonTypeId in bulk-cancel payload
- Individual rebooking: students use rebooking link to re-enter UC-001 availability flow

**Postconditions:**
- All matching Booking.status = cancelled; full refunds issued; students notified

**Priority:** P0

---

## UC-020 — Notification delivery

**Persona:** System
**Goal:** Deliver correct transactional notifications at each booking lifecycle trigger
**Preconditions:**
- Relevant event fired; User.emailOptOut and smsOptOut checked

**Main Flow:**
1. booking.confirmed → email + SMS + .ics in preferredLanguage
2. booking.cancelled → cancellation notice + refund confirmation amount
3. booking.completed → post-lesson email with one-click rating and tip link
4. waitlist.slot_available → notification with 2-hour acceptance link
5. booking.reminder → 24h before startAt; reminder email + SMS
6. lesson.weather_cancel → bulk cancellation notice + rebooking link (transactional; OQ-044)
7. instructor.cert_expiry → alert to school_admin

**Alternate Flows:**
- emailOptOut = true: marketing suppressed; booking/safety notifications always sent
- smsOptOut = true: SMS suppressed
- Delivery failure: logged; confirmation and cancellation emails retried by SendGrid

**Postconditions:**
- Notification sent in preferredLanguage; AuditLog entry for triggered events

**Priority:** P0

---

## UC-021 — Admin creates walk-up customer account

**Persona:** School Admin
**Goal:** Register a walk-up customer at the ski school window without a prior account and immediately book a lesson
**Preconditions:**
- Admin authenticated with school_admin role

**Main Flow:**
1. Admin opens walk-up booking form
2. Admin calls POST /api/v1/users: email, firstName, lastName, learnerDateOfBirth, skillLevel, preferredLanguage, parentalConsentGiven if age < 18
3. System atomically creates User + Household + Learner; returns created entity IDs
4. Admin creates SlotReservation: POST /api/v1/slot-reservations
5. Admin creates Booking: POST /api/v1/bookings with learnerId from step 3; payment via POS card terminal
6. Booking confirmed; confirmation email sent to customer

**Alternate Flows:**
- Customer has existing account: admin looks up by email; uses existing learnerId
- Payment declined: booking not created; admin retries

**Postconditions:**
- User + Household + Learner created; Booking confirmed

**Priority:** P0

---

## UC-022 — Update language preference

**Persona:** Guest / Head of Household / Instructor
**Goal:** Set or change the preferred language for all UI surfaces and communications
**Preconditions:**
- User is authenticated

**Main Flow:**
1. User opens account settings
2. User selects EN or FR via language toggle
3. System calls PATCH /api/v1/me with { preferredLanguage: "en" | "fr" }
4. All subsequent notifications and UI rendered in updated language

**Alternate Flows:**
- Guest checkout: preferredLanguage collected at GuestCheckout creation; defaults to browser geolocation language (OQ-057)
- Instructor app: same toggle in profile settings

**Postconditions:**
- User.preferredLanguage updated; all future notifications use new language

**Priority:** P0

---

## UC-023 — Set instructor availability

**Persona:** Instructor
**Goal:** Define recurring weekly availability and date-specific overrides so the booking widget reflects accurate open slots
**Preconditions:**
- Instructor authenticated; InstructorTenant.onboardingStatus = approved

**Main Flow:**
1. Instructor opens Availability Management screen
2. Instructor sets recurring weekly availability: POST /api/v1/instructors/:id/availability with RRULE text and startAt, endAt window
3. System stores Availability record; recurrence = RRULE string (text field per schema v0.7)
4. GET /api/v1/availability reflects updated slots on next query

**Alternate Flows:**
- Date-specific block: POST /api/v1/instructors/:id/availability with specific startAt/endAt and isBlocked = true
- Override existing slot: PATCH /api/v1/instructors/:id/availability/:slotId
- Remove slot: DELETE /api/v1/instructors/:id/availability/:slotId

**Postconditions:**
- Availability records updated; booking widget reflects changes

**Priority:** P0

---

## UX Flow Gaps

The following ux-flows.md flows have no corresponding P0 use case and require no UC in this run:
- §3 "Sync with Google Calendar (optional)" — deferred to v1.5 (OQ-021); no P0 UC
- §3 "Tips (if applicable)" under Instructor Earnings Dashboard — tips are a customer post-lesson payment (UC-007), not an instructor Earnings Dashboard feature; Earnings Dashboard is P1
- §3 "optional digital signature" at check-in — Smartwaiver deferred (OQ-052); waiverToken = null for P0; not in UC-010
