# Slopebook — Use Cases P0

**Document Status:** Draft — Generate Pipeline Run 10, revision 2
**Last Updated:** 2026-11-01
**Pipeline:** pipeline-generate.yaml
**Sources:** overview.md (2026-10-31), ux-flows.md, open-questions.md, uc-registry.md, decisions.md (2026-10-31 entries)

**Scope notes**
- Revision 2 (2026-11-01) corrects the Run 10 gate failure. Section B is rebuilt from the Run 9 text with full detail (API paths, field names, processors, flows); only changes required by the 2026-10-31 sources and by the six gate failures were applied. The P0 size target was waived by the pipeline owner for this run. Section A and the UX Flow Gaps are unchanged from revision 1 (three lines appended to the gaps).
- Section A is Overlay Scope (Phases 1-2), UC-035 to UC-055. Delivery priority; all 21 registry items covered.
- Section B is Booking Core (Phase 3), UC-001 to UC-023, UC-056 to UC-058 and UC-070 to UC-071. Kept as P0 per the registry heading. Run 9 IDs are unchanged. UC-070 (Stripe charge) and UC-071 (Shift4 charge, Growth+) are new in revision 2. In overlay deployments the third-party POS owns these transactional records.
- Skill level uses the six-level scale (first_timer, beginner, advanced_beginner, intermediate, advanced, expert) with a recorded source (customer, inferred, instructor, unresolved). Older three-level wording in ux-flows.md is superseded.
- Age and skill level are collected once, at browse/availability (UC-001), and carried through the session; checkout flows do not ask for them again (decisions.md 2026-03-20).
- The waitlist accept window is a platform-wide fixed 2 hours (decisions.md 2026-03-26).
- Processors: Stripe on every tier; Shift4 for Growth tier and above only (decisions.md 2026-03-26). Card-on-file tokens live in the processor-managed vault.
- Where Main Flow exceeds 8 steps or a block exceeds 20 lines, detail was kept deliberately (completeness override).
- All schedule changes need manager approval; the agent explains and recommends only. Scores and confidence shown to managers are labeled estimates.

---

# Section A — Overlay (Phases 1-2)

## UC-035 — Import daily schedule and roster
**Persona:** School Admin
**Goal:** Load the school's daily schedule and roster from its POS into the operating model without writing back.
**Preconditions:**
- Tenant exists; POS data export or read access available
- Import adapter configured (read-only POSAdapter)

**Main Flow:**
1. Admin starts an import for a date or range
2. Import adapter reads reservations, instructors, shifts and customers
3. System validates records (UC-036) and maps them to Learner, Instructor and lesson objects
4. System stores a POSReference for each mapped record
5. System shows an import summary and refreshes today's issues (UC-037)

**Alternate Flows:**
- Re-import of the same day updates changed records and keeps existing POSReferences
- Learners with no profile get a minimal LearnerProfile with skill source = unresolved

**Postconditions:**
- Operating model reflects the school's day; the POS is unchanged
- Each imported record has a POSReference

**Priority:** P0
**Open Questions:** Import mechanism (file upload, scheduled pull, vendor API) and refresh frequency are not defined; POS data access is untested (overview risk 1).

---

## UC-036 — Reject or flag an invalid import
**Persona:** School Admin
**Goal:** Learn which imported records are invalid or incomplete and keep them out of recommendations.
**Preconditions:**
- An import is in progress (UC-035)

**Main Flow:**
1. System validates required fields, references and time conflicts
2. System rejects the batch if it is structurally unreadable
3. System flags individual bad records with reason and source row
4. Admin reviews the flagged list and corrects the source or dismisses a flag

**Alternate Flows:**
- Flagged records are excluded from issue detection until fixed
- Records missing optional data (e.g. skill level) import with an "incomplete" marker

**Postconditions:**
- No invalid record enters the operating model unflagged
- Rejection and flag reasons are retained for review

**Priority:** P0
**Open Questions:** Is a batch with some invalid records imported partially or rejected whole? Not stated in any source.

---

## UC-037 — View today's issues ranked by attention
**Persona:** School Admin
**Goal:** See today's operational issues ordered by what needs attention first.
**Preconditions:**
- A schedule is imported for today (UC-035)
- Admin is signed in (Phase 2) or viewing the pilot console (Phase 1)

**Main Flow:**
1. System detects OperationalIssues such as instructor absence, group imbalance and instructor overload
2. System ranks issues and shows each with type, affected lessons and time to impact
3. Admin opens an issue to see its proposed ResolutionPlan (UC-038)

**Alternate Flows:**
- Admin filters by issue type or status (open, planned, resolved)
- No issues: console states that nothing needs attention

**Postconditions:**
- Each issue shows a status; no schedule change occurs

**Priority:** P0
**Open Questions:** Ranking criteria (severity, time to impact, affected guests) are not defined.

---

## UC-038 — Review a resolution plan
**Persona:** School Admin
**Goal:** Understand a proposed plan well enough to approve, reject or ignore it.
**Preconditions:**
- An OperationalIssue has a ResolutionPlan with ProposedActions

**Main Flow:**
1. Admin opens the plan from an issue
2. System shows reasoning in plain language, one entry per ProposedAction
3. System shows impact (lessons preserved, students and instructors affected)
4. System shows ActionValidation results for each deterministic constraint (pass/fail with reason)
5. System labels scores and confidence as estimates

**Alternate Flows:**
- A constraint fails: plan shows the failed rule and cannot be approved as is
- Several plans exist for one issue: Admin compares them side by side

**Postconditions:**
- Admin has the information needed for UC-040 or UC-042
- No change to the school's system

**Priority:** P0

---

## UC-039 — Ask the manager agent about operations
**Persona:** School Admin
**Goal:** Ask questions about current operations and get explained answers.
**Preconditions:**
- Operating model contains the current schedule

**Main Flow:**
1. Admin asks a question (e.g. why an instructor was suggested, who is free at 2pm)
2. Agent answers from the operating model with the facts and rules it used
3. Agent can point to the related issue or plan

**Alternate Flows:**
- Admin asks the agent to change the schedule: agent offers a plan for approval (UC-042); it never writes directly
- Data insufficient: agent says what is missing

**Postconditions:**
- No schedule or POS change
- Conversation is stored per the retention rule (once set)

**Priority:** P0
**Open Questions:** Retention and erasure for manager-agent conversations (new personal data type) are undefined.

---

## UC-040 — Record whether a recommendation matched the manager's action
**Persona:** School Admin
**Goal:** Log whether Slopebook's recommendation matched what the manager actually did, so value can be measured in the shadow pilot.
**Preconditions:**
- A recommendation was shown (UC-038)
- Phase 1 shadow mode, or Phase 2 manual action outside Slopebook

**Main Flow:**
1. Admin or system notes the real action taken in the POS
2. Admin marks the recommendation as matched, partly matched, different, or not needed
3. Admin adds an optional reason
4. System stores an OperationalObservation linked to the plan

**Alternate Flows:**
- Admin skips: observation stays "unrecorded"
- Pilot report aggregates matches for the success metrics

**Postconditions:**
- Observation stored; no schedule change

**Priority:** P0
**Open Questions:** In read-only mode, is "what the manager did" self-reported or inferred from later imports?

---

## UC-041 — Sign in to a tenant-scoped Manager Console
**Persona:** School Admin
**Goal:** Sign in and see only my school's data.
**Preconditions:**
- Admin account exists for the tenant

**Main Flow:**
1. Admin authenticates
2. System resolves the tenant and role
3. Console loads data scoped to that tenant only

**Alternate Flows:**
- Admin belongs to several schools: picks one tenant per session
- Session expires: admin signs in again and returns to the same view

**Postconditions:**
- Session carries tenant and role; no cross-tenant data is visible

**Priority:** P0
**Open Questions:** Sign-in method (password, SSO) and roles in the overlay are not defined; password reset is unresolved (OQ-062).

---

## UC-042 — Approve or reject a resolution plan
**Persona:** School Admin
**Goal:** Decide on a plan so that only approved changes proceed.
**Preconditions:**
- Plan has passed constraint validation (UC-038)
- Admin has approval rights

**Main Flow:**
1. Admin approves or rejects the plan
2. System records a ManagerDecision with user, time and optional reason
3. Approved plan moves to ready-to-execute (UC-043); rejected plan is closed

**Alternate Flows:**
- Admin approves a subset of ProposedActions
- Plan goes stale as the schedule changes: system re-validates before accepting approval

**Postconditions:**
- ManagerDecision stored; approved plan awaits execution

**Priority:** P0
**Open Questions:** Can a manager edit a plan before approving, and is a rejection reason required? Not stated.

---

## UC-043 — Execute an approved plan and verify the result
**Persona:** School Admin
**Goal:** Apply an approved plan to the school's system through the adapter and confirm it took effect.
**Preconditions:**
- ManagerDecision = approved
- Adapter supports writes (vendor POS adapter or Booking Core)

**Main Flow:**
1. System re-checks constraints and policy
2. System sends each ProposedAction through the POSAdapter
3. System reads back the POS state and compares to the expected result
4. System stores an ActionOutcome per action (verified or failed)
5. Console shows the result

**Alternate Flows:**
- Adapter is read-only: plan is marked for manual execution and tracked via UC-040
- Verification fails: issue stays open and the failure is shown to the manager

**Postconditions:**
- ActionOutcome stored for each action
- Agent made no direct write to the POS

**Priority:** P0
**Open Questions:** Rollback or retry policy after a failed verification is not defined.

---

## UC-044 — View decision and action audit history
**Persona:** School Admin
**Goal:** Review who decided what, what was executed and whether it was verified.
**Preconditions:**
- ManagerDecisions or ActionOutcomes exist for the tenant

**Main Flow:**
1. Admin opens audit history
2. System lists decisions and outcomes with user, time, plan, actions and verification result
3. Admin filters by date, issue type, user or outcome and opens an entry

**Alternate Flows:**
- Admin exports the filtered history

**Postconditions:**
- Read-only; history cannot be edited

**Priority:** P0
**Open Questions:** Retention period for overlay audit data is not set (AuditLog max 3 years applies to Booking Core only).

---

## UC-045 — Rank a waitlist by slot, ability, goals and instructor fit
**Persona:** School Admin
**Goal:** Order waitlisted students by how well they fit an opened slot.
**Preconditions:**
- A slot opens and waitlist entries exist
- Entries have LearnerProfile data

**Main Flow:**
1. System filters entries by hard constraints (slot, lesson type, ability level)
2. System scores remaining entries on goals and instructor fit
3. Console shows the ranking with fit reasons
4. Admin selects an entry to offer (UC-046)

**Alternate Flows:**
- Entry has an unresolved skill level: ranked lower and flagged
- Admin overrides the order manually

**Postconditions:**
- Ranked list available; no offer sent yet

**Priority:** P0
**Open Questions:** Fit-based ranking vs FIFO default with admin-adjustable position (OQ-034): which is default?

---

## UC-046 — Offer a waitlist slot without creating a reservation
**Persona:** School Admin
**Goal:** Offer an open slot to a waitlisted guest with a 2-hour accept window and no reservation or payment created.
**Preconditions:**
- Ranked waitlist (UC-045); manager approves the offer

**Main Flow:**
1. Admin offers the slot to the chosen entry
2. System records the offer with a 2-hour accept window (decisions.md)
3. Guest accepts within the window
4. System tells the manager to confirm the booking in the POS; the offer itself confirms nothing

**Alternate Flows:**
- Window expires: offer closes and the next ranked entry is shown to the manager
- Guest declines: same as expiry

**Postconditions:**
- Offer status recorded; no reservation or payment created by Slopebook

**Priority:** P0
**Open Questions:** Who creates the reservation after acceptance (manager in POS, or adapter write) and how guests are notified without Booking Core notifications is not stated.

---

## UC-047 — Complete a conversational booking intake
**Persona:** Guest / Head of Household
**Goal:** Describe the lesson I want in my own words and have it captured accurately.
**Preconditions:**
- Intake link or widget available from the school
- Consent obtained if the learner is a minor (UC-055)

**Main Flow:**
1. Guest chats about learner, goals, terrain, confidence and preferences
2. System extracts structured values for LearnerProfile
3. System stores the original wording next to each structured value
4. Guest reviews the summary and corrects it
5. System offers instructor matches (UC-048)

**Alternate Flows:**
- Skill level unclear: stored as unresolved with source recorded, not guessed
- Minor learner: the conversation is held with the adult

**Postconditions:**
- LearnerProfile saved with structured values and original wording

**Priority:** P0
**Open Questions:** Conversation language (EN/FR) handling and how intake relates to the school's own checkout (overview risk 4) are not decided.

---

## UC-048 — See instructor matches with fit reasons and mismatches
**Persona:** Guest / Head of Household
**Goal:** See which instructors suit the learner and why, including possible mismatches.
**Preconditions:**
- Completed intake (UC-047); instructors with InstructorProfiles
- Availability known from imported schedule

**Main Flow:**
1. System applies hard constraints (availability, certification, lesson type, language, age)
2. System scores remaining instructors on soft compatibility
3. Guest sees ranked matches with fit reasons and potential mismatches
4. Guest picks a preferred instructor

**Alternate Flows:**
- No instructor passes constraints: guest is offered a waitlist or manager review
- Guest asks why a match ranked lower: system explains

**Postconditions:**
- Preferred instructor stored on the intake; no booking made by Slopebook

**Priority:** P0
**Open Questions:** Which learned-profile fields about instructors guests may see (profiles are coaching inputs, not evaluations).

---

## UC-049 — Submit a school-composed group placement request
**Persona:** Guest / Head of Household
**Goal:** Ask the school to place the learner in a suitable group.
**Preconditions:**
- Lesson type uses school-composed placement
- Intake completed (UC-047)

**Main Flow:**
1. Guest selects lesson type and preferred date
2. System creates a GroupPlacementRequest with age, ability and goals
3. Manager sees the request and composes the group
4. Guest is told the placement outcome

**Alternate Flows:**
- Lesson type uses customer-selected sessions: GroupSession booking flow applies instead (UC-026)
- Request cannot be placed: manager proposes alternatives

**Postconditions:**
- GroupPlacementRequest stored with status

**Priority:** P0
**Open Questions:** Group composition rules (ability spread, age bands) are not defined.

---

## UC-050 — Link a SkiMatch intake to a POS reservation
**Persona:** School Admin
**Goal:** Connect a guest's intake to the reservation the POS holds so the match drives the real lesson.
**Preconditions:**
- Intake exists; matching reservation exists in the POS and is imported

**Main Flow:**
1. System proposes candidate reservations for the intake
2. Admin confirms the correct one
3. System creates a POSReference linking intake, learner and reservation
4. Profile and match data attach to the lesson

**Alternate Flows:**
- No reservation yet: intake stays unlinked and pending
- Wrong link: admin unlinks and relinks

**Postconditions:**
- Intake linked via POSReference; POS record unchanged

**Priority:** P0
**Open Questions:** Whether linking is manual, automatic by customer and time, or by a booking reference is not stated.

---

## UC-051 — Student completes a post-lesson interview
**Persona:** Guest / Head of Household
**Goal:** Tell the school how the lesson went so recommendations improve.
**Preconditions:**
- Lesson is complete (from the POS import)
- Consent on file for a minor learner

**Main Flow:**
1. Guest opens the interview link
2. System asks short follow-up questions on progress, confidence, fit with instructor
3. System stores a StudentLessonAssessment with original wording
4. System updates the learner profile

**Alternate Flows:**
- Adult answers for a minor
- Guest skips questions or stops partway; partial answers are kept

**Postconditions:**
- StudentLessonAssessment stored; profile updated
- Next-lesson recommendation can be refreshed (UC-053)

**Priority:** P0
**Open Questions:** Delivery channel and trigger without Booking Core notifications; how this relates to rating and tip (Booking Core only).

---

## UC-052 — Instructor completes a post-lesson interview
**Persona:** Instructor
**Goal:** Record observations on each student after a lesson.
**Preconditions:**
- Instructor taught the lesson
- Instructor can reach the Instructor App

**Main Flow:**
1. Instructor opens the interview for a lesson
2. System asks about ability shown, goals progress, terrain, what worked
3. System stores an InstructorLessonAssessment
4. System updates the learner profile and the instructor's learned profile

**Alternate Flows:**
- Group lesson: instructor answers per student, with a shortcut for the whole group
- Instructor defers: interview stays open

**Postconditions:**
- InstructorLessonAssessment stored
- Learned profile used for coaching and assignment, not evaluation

**Priority:** P0
**Open Questions:** Instructor App is not listed in Phase 2 deliverables; delivery channel for the interview is undecided.

---

## UC-053 — View a next-lesson recommendation
**Persona:** Guest / Head of Household
**Goal:** See a suggested next lesson with the reason behind it.
**Preconditions:**
- At least one assessment exists for the learner (UC-051 or UC-052)

**Main Flow:**
1. System combines the learner profile, both assessments and available instructors
2. Guest sees the recommended lesson type, level and instructor with reasons
3. Guest chooses to request it (via intake, UC-047) or dismiss it

**Alternate Flows:**
- Not enough data: system says so and offers a new intake
- Recommended instructor is unavailable: next-best options shown

**Postconditions:**
- Recommendation recorded with reasoning; shown as an estimate

**Priority:** P0
**Open Questions:** Whether managers and instructors also see it, and whether guests can book from it directly.

---

## UC-054 — Export or erase a learner's profile and conversation data
**Persona:** Head of Household
**Goal:** Obtain a copy of, or delete, a learner's profile, assessments and conversations.
**Preconditions:**
- Requester is the verified adult for the learner (or School Admin on request)

**Main Flow:**
1. Requester asks for export or erasure
2. System identifies all profile, wording, assessment and conversation data for the learner
3. Export: system provides a downloadable copy
4. Erasure: system deletes or pseudonymises per the rules and confirms

**Alternate Flows:**
- Records the school must retain (finance, audit) are kept; the requester is told which
- POS-owned records are not erased by Slopebook; the school is notified

**Postconditions:**
- Export delivered or erasure completed, and logged without raw personal data

**Priority:** P0
**Open Questions:** Retention periods and erasure behavior for the new data types are not yet defined (required before real data per decisions.md); who may request on a school's behalf.

---

## UC-055 — Parent or guardian consents for a minor
**Persona:** Head of Household
**Goal:** Give consent so a minor's profile and conversation data can be collected.
**Preconditions:**
- Learner is under 18
- Adult is identified and linked to the household

**Main Flow:**
1. System explains what data is collected and why
2. Adult gives consent and the system records who, when and which version
3. Intake and interviews for that minor become available

**Alternate Flows:**
- Adult declines: no profile data collected; school can still handle the booking in the POS
- Adult withdraws consent later: collection stops and UC-054 is offered

**Postconditions:**
- Consent record stored with version and time
- No minor data collected before consent

**Priority:** P0
**Open Questions:** Age threshold by province/state (legal review pending) and consent wording are not set.

---

# Section B — Booking Core (Phase 3)

## UC-001 — Browse and select available lesson slot

**Persona:** Guest / Head of Household
**Goal:** Find an available lesson slot matching the learner's age, skill level, and preferred date, and hold it during checkout
**Preconditions:**
- Tenant booking widget is accessible
- At least one active LessonType exists with instructor availability on the requested date

**Main Flow:**
1. Student selects lesson type (private / semi-private / group / half-day / full-day)
2. Student enters learner age and skill level (six-level scale, source = customer); system filters eligible instructors by skill level eligibility
3. Student selects a date from the availability calendar
4. System queries GET /api/v1/availability?lessonTypeId=&date=&age=&skillLevel= and displays matching slots
5. Student optionally browses instructor profile cards (UC-002)
6. Student selects a time slot and instructor from the filtered results
7. System creates SlotReservation (POST /api/v1/slot-reservations); returns sessionToken + expiresAt (15 min TTL)
8. Student proceeds to checkout holding sessionToken; age and skill level are carried in the session and are not collected again at checkout (decisions.md 2026-03-20)

**Alternate Flows:**
- No availability for date: student offered waitlist path (UC-008)
- Slot taken mid-selection: BOOKING_CONFLICT returned; student shown next available slot
- Student changes date: availability calendar refreshes; new query issued

**Postconditions:**
- SlotReservation.status = active; sessionToken held by client
- Learner age and skill level held in the session for checkout and for the post-payment learner profile (UC-003)
- Checkout must complete within 15 minutes or hold expires (HOLD_EXPIRED)

**Priority:** P0
**Open Questions:** The availability query takes `age`, but GuestCheckout requires `learnerDateOfBirth` (api-design.md, data-model.md). Whether browse collects a date of birth or an age, and how a date of birth is derived for GuestCheckout without asking again at checkout, is not defined. For a multi-learner household checkout (UC-005), how age and skill level are gathered for each learner at browse is not defined.

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
- Learner age and skill level were collected at browse (UC-001) and are held in the session
- Tenant payment processor is configured (Stripe on any tier, UC-070; Shift4 on Growth+, UC-071)

**Main Flow:**
1. Guest selects "Continue as Guest" at the authentication gate; learner age and skill level are not asked again (carried from the UC-001 session)
2. Guest submits GuestCheckout record (POST /api/v1/guest-checkouts): email, firstName, lastName, preferredLanguage; the session-carried learner age (as learnerDateOfBirth) and skillLevel are attached to the record; parentalConsentGiven collected here if the carried age < 18
3. System validates the carried values: learner age ≥ 5 (AGE_TOO_YOUNG if not); parentalConsentGiven = true required if age < 18
4. Guest enters card details via the tenant processor's SDK embed: Stripe Elements (charge path UC-070), or the Shift4 embed for Growth+ tenants (charge path UC-071)
5. System creates Booking (POST /api/v1/bookings): guestCheckoutId set, learnerId = null, paymentMethodId = null
6. Payment Service captures the charge through the tenant's processor; platformFeeCents = 1.5% of amountCents
7. Booking.status = confirmed; SlotReservation.status = converted
8. Notification Service sends confirmation email + SMS in preferredLanguage; .ics calendar attachment included; the email carries the post-lesson link (UC-007)
9. Guest shown optional post-payment account creation prompt (skippable; learner profile pre-populated with the age, skill level and booking data from the session — decisions.md 2026-03-20)

**Alternate Flows:**
- sessionToken expired (HOLD_EXPIRED): slot released; guest returned to availability view
- Payment declined (PAYMENT_FAILED): booking not created; guest retries with different card
- Booking DB write fails post-capture: 3 DB-write retries, payment captured once (OQ-047, OQ-053); if all fail, void payment (4 attempts at 100ms intervals); Payment.status = void_pending if void fails (OQ-056)
- Growth+ tenant: Shift4 embed used instead of Stripe Elements
- Guest skips account creation: confirmation is sent to the email address regardless

**Postconditions:**
- Booking confirmed; Booking.guestCheckoutId set, Booking.learnerId = null
- Payment.paymentType = booking_charge; Payment.status = captured
- Confirmation sent in guest's preferredLanguage with .ics attachment

**Priority:** P0
**Open Questions:** When the guest creates an account after payment, registration auto-creates a self-Learner (OQ-048) while the pre-populated profile comes from the guest's learner data; whether that profile is the self-Learner or a sub-profile (the learner may be a minor), and whether the existing guest Booking is re-linked to the new account, is not stated.

---

## UC-004 — Authenticated checkout

**Persona:** Guest (authenticated, solo adult account)
**Goal:** Book a lesson for themselves using a stored or new payment card
**Preconditions:**
- User is authenticated (valid JWT); self-Learner auto-created at registration (OQ-048)
- SlotReservation is active
- Tenant payment processor is configured (Stripe on any tier, UC-070; Shift4 on Growth+, UC-071)

**Main Flow:**
1. Authenticated user proceeds through the authentication gate
2. System auto-selects self-Learner sub-profile
3. System displays stored payment methods (GET /api/v1/payment-methods)
4. User selects card-on-file or enters new card
5. System creates Booking (POST /api/v1/bookings): learnerId set, guestCheckoutId = null
6. Payment Service charges the stored processorTokenId through the tenant's processor (Stripe or Shift4); 1.5% platform fee applied
7. Booking.status = confirmed; confirmation email + SMS + .ics sent in preferredLanguage

**Alternate Flows:**
- New card: tokenized via the processor (POST /api/v1/payment-methods); the card token is stored in the processor-managed vault (Stripe or Shift4), and Slopebook keeps only the processorTokenId reference, encrypted at rest via AWS KMS (OQ-046); optionally saved and set as default
- Payment declined (PAYMENT_FAILED): user selects different card
- sessionToken expired (HOLD_EXPIRED): user returned to availability view
- Stored card invalid after a processor switch (PaymentMethod.isValid = false): user adds a new card

**Postconditions:**
- Booking confirmed with learnerId set
- New card optionally stored as PaymentMethod, with its token held in the processor-managed vault (no cross-processor token mapping in v1.0)

**Priority:** P0

---

## UC-005 — Household checkout and card-on-file one-click

**Persona:** Head of Household
**Goal:** Book a lesson for one or more household learner sub-profiles in a single checkout; use a stored default card for one-click payment
**Preconditions:**
- Household has at least one learner sub-profile
- User is authenticated
- Tenant payment processor is configured (Stripe on any tier, UC-070; Shift4 on Growth+, UC-071)

**Main Flow:**
1. Household head reaches learner selection step; selects one or more learners from the sub-profile list
2. For returning household with default card on file: system shows one-click payment confirmation covering the selected learners; user confirms once
3. System creates one Booking per selected learner (POST /api/v1/bookings with that learnerId) in the same checkout
4. Payment Service charges the default PaymentMethod's processorTokenId through the tenant's processor (Stripe or Shift4); one Payment per Booking (Payment.bookingId), 1.5% platform fee applied
5. Confirmation email + SMS + .ics sent in preferredLanguage for the booked learners

**Alternate Flows:**
- New learner: added inline during checkout; age and skill level collected at this step (decisions.md 2026-11-01), without asking again for anything the session already holds; Learner sub-profile created before booking
- No card on file: user adds new card (POST /api/v1/payment-methods); token held in the processor-managed vault; optionally saves
- Default card declined: PaymentMethod.isValid = false; user prompted to add new card
- Single learner selected: same flow with one Booking

**Postconditions:**
- One confirmed Booking per selected learner, each with learnerId set; household dashboard updated

**Priority:** P0
**Open Questions:** For several learners in one checkout: how many SlotReservations and sessionTokens are held, whether capacity is checked per learner, whether the charge is one capture or one per Booking with independent failure (Payment.bookingId implies one Payment per Booking), and what happens to the remaining bookings when one learner's booking or payment fails.

---

## UC-070 — Charge a booking via Stripe

**Persona:** Guest / Head of Household (payer); System
**Goal:** Pay for a booking by card through the tenant's Stripe account
**Preconditions:**
- Tenant processor = Stripe (available on every tier, including Starter)
- Stripe credentials stored: secretKey and webhookSecret (both required, encrypted via AWS KMS)
- Checkout in progress with an active SlotReservation (UC-003, UC-004, UC-005)

**Main Flow:**
1. Payer enters card details in the Stripe Elements embed, or chooses a stored card whose token is in the Stripe-managed vault
2. Payment Service creates the charge with the tenant's Stripe credentials, in the tenant currency (USD or CAD), amount as integer cents
3. Payment Service sets platformFeeCents = 1.5% of amountCents
4. System records Payment: paymentType = booking_charge, status = captured, bookingId set; Stripe webhook events are verified with webhookSecret
5. Checkout continues to booking confirmation

**Alternate Flows:**
- Charge declined (PAYMENT_FAILED): no booking created; payer retries with another card
- Booking DB write fails after capture: retry the write (idempotency key scoped to reservationId), then void if all fail (OQ-047, OQ-053, OQ-056)
- Refunds (UC-006) and tips (UC-058) are issued through the same Stripe account

**Postconditions:**
- Payment captured through Stripe with fee recorded; card tokens, if saved, stay in the Stripe-managed vault

**Priority:** P0

---

## UC-071 — Charge a booking via Shift4 (Growth+ tenants)

**Persona:** Guest / Head of Household (payer); System
**Goal:** Pay for a booking by card through the tenant's Shift4 account
**Preconditions:**
- Tenant is on the Growth tier or above (Starter is Stripe-only; Shift4/Starter is deferred to v1.5)
- Tenant processor = Shift4 with credentials stored: model: direct, apiKey, merchantId, webhookSecret (all required, encrypted via AWS KMS); no platform MID or PayFac model
- Checkout in progress with an active SlotReservation (UC-003, UC-004, UC-005)

**Main Flow:**
1. Payer enters card details in the Shift4 embed, or chooses a stored card whose token is in the Shift4-managed vault
2. Payment Service creates the charge with the tenant's Shift4 credentials, in the tenant currency (USD or CAD), amount as integer cents
3. Payment Service sets platformFeeCents = 1.5% of amountCents
4. System records Payment: paymentType = booking_charge, status = captured, bookingId set; Shift4 webhook events are verified with webhookSecret
5. Checkout continues to booking confirmation

**Alternate Flows:**
- Charge declined (PAYMENT_FAILED): no booking created; payer retries with another card
- Tenant below Growth: Shift4 is not offered; the Stripe path (UC-070) applies
- Booking DB write fails after capture: retry the write (idempotency key scoped to reservationId), then void if all fail (OQ-047, OQ-053, OQ-056)
- Refunds (UC-006) and tips (UC-058) are issued through the same Shift4 account
- Tenant switches processor: stored cards become invalid (PaymentMethod.isValid = false); no cross-processor token mapping in v1.0

**Postconditions:**
- Payment captured through Shift4 with fee recorded; card tokens, if saved, stay in the Shift4-managed vault

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
4. Payment Service issues refund (POST /api/v1/payments/:id/refund) to original payment method, through the processor that captured the charge (Stripe or Shift4)
5. Booking.status = cancelled; cancelledAt and cancellationReason recorded
6. Cancellation notice + refund confirmation sent in learner/guest language

**Alternate Flows:**
- Outside refund window: no refund issued; booking still cancelled; notice sent
- Guest checkout: guest cannot self-cancel (OQ-033); app shows ContactSchoolCard; admin cancels on their behalf
- Instructor cancels own lesson: instructors have admin-level access to their own lessons (OQ-058)
- Admin cancels: same endpoint; automated refund per policy

**Postconditions:**
- Booking.status = cancelled; Payment.status = refunded or partially_refunded per policy
- All parties notified in their preferred language

**Priority:** P0

---

## UC-007 — Submit post-lesson rating

**Persona:** Guest / Head of Household
**Goal:** Rate the instructor after lesson completion
**Preconditions:**
- Booking.status = completed (instructor action UC-013 or auto-completion at endAt + 2h); the post-lesson flow is unlocked only by this status
- No InstructorRating exists for this booking

**Main Flow:**
1. Student opens the post-lesson flow from the link in the booking confirmation email (UC-003/004/005, UC-020), from the post-lesson email sent at booking.completed (UC-013), or from the account dashboard
2. System checks Booking.status = completed
3. Student submits rating: POST /api/v1/bookings/:id/review with rating (1-5) and optional comment
4. System creates InstructorRating; application layer recomputes Instructor.averageRating
5. Student is offered the optional tip step (UC-058)

**Alternate Flows:**
- Link opened before the lesson is completed: flow shows it opens after the lesson; nothing can be submitted
- Rating already submitted (RATING_ALREADY_SUBMITTED): tip submission still available if within window
- Guest accesses via email link: booking reference token in link; no login required

**Postconditions:**
- InstructorRating created; Instructor.averageRating recomputed
- Rating entry deactivated after submission; the link remains usable for the tip until the tip window ends

**Priority:** P0
**Open Questions:** Run 9 deactivated the post-lesson link after rating while also allowing a tip afterwards; this draft keeps the link live for the tip only. Lifetime and revocation of the booking-reference token in the confirmation-email link (for example after cancellation or no-show) are not defined.

---

## UC-058 — Submit an optional post-lesson tip

**Persona:** Guest / Head of Household
**Goal:** Tip the instructor as a separate payment after the lesson
**Preconditions:**
- Booking.status = completed; within 48 hours of Booking.endAt
- Tenant payment processor is configured (Stripe, UC-070, or Shift4 on Growth+, UC-071)

**Main Flow:**
1. Student enters a tip amount and chooses a card in the post-lesson flow (same entry points as UC-007)
2. Client sends POST /api/v1/bookings/:id/tip with amountCents, currency, paymentMethodId; Idempotency-Key header required
3. System validates: Booking.status = completed; within 48 hours of Booking.endAt; unique partial index on Payment ensures one tip per booking
4. Payment Service captures a separate tip payment; Payment.paymentType = tip

**Alternate Flows:**
- Tip window expired > 48h after endAt (TIP_WINDOW_EXPIRED): tip refused; rating still accepted if not yet submitted
- Tip already submitted (TIP_ALREADY_SUBMITTED): idempotency key match returns existing tip response
- Guest accesses via email link: booking reference token in link; no login required

**Postconditions:**
- At most one tip Payment per booking, separate from the booking charge (decisions.md 2026-03-26, 2026-04-04)

**Priority:** P0

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
4. When slot opens, system sets WaitlistEntry.status = notified; sends notification with a 2-hour acceptance link (platform-wide fixed window, decisions.md 2026-03-26)
5. Student accepts offer (POST /api/v1/waitlist/:id/accept) within the 2-hour window
6. System creates SlotReservation; routes student through checkout (UC-003 or UC-004), which triggers payment and confirmation

**Alternate Flows:**
- Acceptance window expires after 2 hours (WAITLIST_WINDOW_EXPIRED): WaitlistEntry.status = expired; slot released and offered to next FIFO entry (OQ-034)
- Admin manually promotes student: PATCH /api/v1/waitlist/:id/promote; skips position ordering (UC-016)
- Student withdraws before notification: DELETE /api/v1/waitlist/:id

**Postconditions:**
- On accept: Booking confirmed; WaitlistEntry.status = accepted
- On expire: WaitlistEntry.status = expired; queue position released

**Priority:** P0
**Open Questions:** open-questions.md still records OQ-009 as "configurable per tenant, default 120 min", which conflicts with decisions.md 2026-03-26 (fixed 2 hours, configurable deferred to v1.5). This draft follows decisions.md.

---

## UC-009 — Instructor views schedule and student details

**Persona:** Instructor
**Goal:** See today's bookings and review student details before each lesson
**Preconditions:**
- Instructor authenticated; InstructorTenant.onboardingStatus = approved

**Main Flow:**
1. Instructor opens PWA home; system calls GET /api/v1/bookings?instructorId=&status=confirmed&from=today
2. System displays lesson cards: student name, skill level (six-level scale), lesson type, meeting point, startAt
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
**Goal:** Transition booking to completed status and unlock the post-lesson rating and tip flow for the student
**Preconditions:**
- Booking.status = confirmed

**Main Flow:**
1. Instructor taps "Complete Lesson" on lesson card
2. System calls PATCH /api/v1/bookings/:id/complete
3. Booking.status = completed; autoCompletedAt remains null
4. booking.completed event fires; the post-lesson flow (UC-007, UC-058) is unlocked, including the link already sent in the booking confirmation email
5. Notification Service sends post-lesson email with one-click rating and tip link in student's language

**Alternate Flows:**
- Auto-completion: scheduled job finds confirmed bookings where endAt + 2h ≤ now; sets status = completed; Booking.autoCompletedAt = now; AuditLog entry with actorType = system, actorId = null; the same event, unlock and email follow
- Instructor already completed manually before job runs: auto-complete skips; autoCompletedAt = null

**Postconditions:**
- Booking.status = completed; post-lesson flow unlocked (UC-007), reachable from the confirmation-email link, the post-lesson email and the dashboard
- booking.completed event fired; post-lesson email dispatched

**Priority:** P0
**Open Questions:** OQ-065 (scheduler interval: 5 min vs 15 min vs event-driven — unresolved)

---

## UC-014 — Admin manages schedule and bookings

**Persona:** School Admin
**Goal:** View all bookings, reassign instructors, detect and resolve conflicts, and bulk-cancel when needed
**Preconditions:**
- Admin authenticated with school_admin role

**Main Flow:**
1. Admin opens Schedule View (day, week or month); system calls GET /api/v1/schedule?date=&instructorId=
2. Admin sees visual scheduler with all instructors and their assigned bookings
3. Admin reassigns booking by drag-and-drop: PATCH /api/v1/bookings/:id/reassign with { instructorId, reason }
4. System validates no conflict on new instructor (BOOKING_CONFLICT if conflict; double-booking blocked); records in AuditLog
5. Admin filters booking list: GET /api/v1/bookings?instructorId=&lessonTypeId=&status=&from=&to=
6. Admin cancels individual booking: PATCH /api/v1/bookings/:id/cancel; refund per policy

**Alternate Flows:**
- Bulk cancel by date/instructor/lesson type: POST /api/v1/bookings/bulk-cancel; returns cancelled count + total refund
- Conflict flagged: admin resolves it by assigning a different instructor and re-submitting the reassign
- Walk-up booking: admin creates User+Household+Learner (POST /api/v1/users) then proceeds through booking (UC-021)
- Real-time schedule updates as bookings arrive: push mechanism TBD (OQ-063)

**Postconditions:**
- Schedule reflects updated assignments; AuditLog entry per reassignment

**Priority:** P0
**Open Questions:** OQ-063 (real-time push mechanism: SSE / WebSocket / polling — unresolved); OQ-066 (reassign payload spec — unresolved)

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
2. Admin views entries filterable by type (time slot or instructor), date, status, lesson type, instructor
3. Admin manually promotes a student: PATCH /api/v1/waitlist/:id/promote
4. System reorders queue and sends 2-hour acceptance notification to promoted student

**Alternate Flows:**
- Promoted student's window expires after 2 hours: next queue entry notified automatically
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
1. Admin creates lesson type: POST /api/v1/lesson-types with nameEn, nameFr, category, durationMinutes, priceAmount, currency, maxCapacity, skillLevels (six-level scale), cancellationPolicyId
2. Admin creates or updates cancellation policy: POST /api/v1/cancellation-policies; PATCH /api/v1/cancellation-policies/:id
3. Admin sets tenant default policy: PATCH /api/v1/cancellation-policies/:id/default
4. Admin updates existing lesson type: PATCH /api/v1/lesson-types/:id

**Alternate Flows:**
- Bulk group program sessions: see UC-056
- Deactivate obsolete lesson type: DELETE /api/v1/lesson-types/:id (soft; isActive = false)

**Postconditions:**
- LessonType active and visible in GET /api/v1/lesson-types; CancellationPolicy set as default

**Priority:** P0

---

## UC-056 — Bulk create lessons for a group program

**Persona:** School Admin
**Goal:** Create all sessions of a multi-week group program (for example a 6-week junior academy) at once
**Preconditions:**
- Group lesson type exists (UC-017); admin authenticated with school_admin role

**Main Flow:**
1. Admin defines the program (lesson type, weekday, time, weeks, instructor)
2. Admin submits the program once as a single bulk-create request (decisions.md 2026-11-01; endpoint to be defined in api-design)
3. System creates one GroupSession per weekly occurrence and returns the created sessions

**Alternate Flows:**
- Conflict on one week: that session is flagged and not created; the other weeks are created and the admin resolves the flagged week

**Postconditions:**
- Sessions created and bookable; conflicts listed for the admin

**Priority:** P0

---

## UC-018 — Household account and learner management

**Persona:** Head of Household
**Goal:** Register, manage learner sub-profiles, store payment methods, and view all upcoming household lessons
**Preconditions:**
- User is registering or is already authenticated

**Main Flow:**
1. User registers: POST /api/v1/auth/register; User + Household + self-Learner created atomically (OQ-048)
2. User adds family member: POST /api/v1/households/:id/learners with firstName, lastName, dateOfBirth, skillLevel (six-level scale, source recorded)
3. User adds card-on-file: POST /api/v1/payment-methods via processor token (token stored in the processor-managed vault); PATCH /api/v1/payment-methods/:id/default to set default
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

## UC-057 — Modify one booking without affecting others

**Persona:** Head of Household
**Goal:** Change a single household booking while other members' bookings stay unchanged
**Preconditions:**
- Booking confirmed; signed in

**Main Flow:**
1. User selects one booking from the account dashboard
2. User changes it
3. System re-validates availability (BOOKING_CONFLICT if no longer available) and updates only that booking

**Alternate Flows:**
- Change not possible: user cancels (UC-006) and rebooks

**Postconditions:**
- Only the chosen booking changed; other household members' Bookings and Payments untouched; confirmation resent

**Priority:** P0
**Open Questions:** What is modifiable (time, instructor, learner) and whether fees or policy windows apply is not defined; api-design.md has no guest-facing booking modification endpoint (only admin PATCH /api/v1/bookings/:id/reassign, OQ-066).

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
1. booking.confirmed → email + SMS + .ics in preferredLanguage; the email includes the link to the post-lesson flow (UC-007), which opens once the booking is completed
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
1. Admin opens walk-up booking form; this flow has no browse stage, so age and skill level are collected here (decisions.md 2026-11-01)
2. Admin calls POST /api/v1/users: email, firstName, lastName, learnerDateOfBirth, skillLevel (six-level scale, source recorded), preferredLanguage, parentalConsentGiven if age < 18
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
- Date-specific override or block: POST /api/v1/instructors/:id/availability with specific startAt/endAt and isBlocked = true
- Override existing slot: PATCH /api/v1/instructors/:id/availability/:slotId
- Remove slot: DELETE /api/v1/instructors/:id/availability/:slotId

**Postconditions:**
- Availability records updated; booking widget reflects changes

**Priority:** P0

---

## UX Flow Gaps

ux-flows.md flows missing steps or absent, one line each:
- No Manager Console flow: import, ranked issues, resolution plan review, approve/reject, execute/verify, audit
- No SkiMatch flow: conversational intake, instructor matches, group placement request, POS linking
- No learning loop flow: student and instructor interviews, next-lesson recommendation
- No privacy flows: minor consent, export and erasure
- No overlay waitlist steps: fit ranking and offer without reservation (ux-flows §1 says accept triggers payment)
- Skill selection in §1 shows three levels; six-level scale with source is not reflected
- Admin sign-in and tenant selection are not shown for the Manager Console
- §3 Google Calendar sync: deferred (OQ-021); no UC
- §3 Earnings "Tips": tips are guest post-lesson (UC-058); earnings dashboard is P1
- §3 check-in digital signature: deferred with Smartwaiver (OQ-052); not in UC-010
- §1 Booking Flow does not show the post-lesson rating and tip flow or its entry from the booking confirmation email (UC-007, UC-058)
- §1 "Select learner" picks a single learner; selecting several learners in one household checkout is not shown (UC-005)
- §1 Payment shows no processor choice; Stripe Elements on every tier and Shift4 embed on Growth+ are not reflected (UC-070, UC-071)
