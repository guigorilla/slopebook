# Slopebook — UI/UX Asset List

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-11-01
**Pipeline:** pipeline-generate.yaml (step 5, ui-ux-lead)
**Sources:** use-cases-p0-proposed.md (Run 10, revision 2), tech-requirements-proposed.md (Run 10), ux-flows.md (not edited), overview.md, decisions.md, asset-list-proposed.md (Run 9, valid screens kept), prototype code in packages/skimatch/src/components and apps/admin

---

## How to Read This Document

- Screen entries follow the role-spec format. Two additions are carried in the heading only, after the screen name: the delivery phase (Phase 1, 2 or 3) and a prototype marker. The field lines are unchanged.
- **Phase 1** shadow pilot (read-only Manager Console). **Phase 2** live overlay (auth, SkiMatch, interviews, privacy). **Phase 3** Booking Core (Run 9 screens, updated). Phase 2 or 1 labels marked "provisional" follow tech-requirements Q10.53 (overview assigns no phase to UC-039, 042, 044, 045, 046).
- **ported prototype** means a UI for this screen already exists in packages/skimatch/src/components (rendered by apps/admin, which is a one-line wrapper around ManagerDashboard). It still needs production wiring, tenant scope, real data and the changes noted. **ported prototype (partial)** means only part of the screen exists. No marker means the screen is new.
- Routes for Phase 1-2 screens are proposed; the prototype is one page with tabs and has no routes. Admin console routes sit under /admin/console. The customer SkiMatch routes sit under /skimatch.
- Scores and confidence shown to managers and guests use the EstimateLabel component (overview: labeled estimates). The prototype's "simulated" wording is replaced.
- In overlay deployments there is no Slopebook payment, so overlay screens are Currency: no. Booking Core screens in overlay deployments are owned by the POS.
- Operator app: no P0 use case; no screens (same as Run 9).

### Prototype Coverage (what exists today)

| Prototype file | Maps to |
|---|---|
| manager-dashboard.tsx (tabs Today, Schedule, Issues, Waitlist, Pros, Students; plan drawer; agent aside; inline verified action history) | Admin console Phase 1-2 screens marked ported |
| home.tsx, conversation.tsx, booking-agent.tsx | Customer / SkiMatch Start, Intake Conversation |
| lesson-profile.tsx | Customer / Intake Summary |
| ski-match.tsx, instructor-card.tsx | Customer / Instructor Matches, InstructorCard |
| group-placement.tsx | Customer / Group Placement Status |
| next-lesson.tsx | Customer / Next-Lesson Recommendation |
| mountain.tsx | Mountain illustration (empty and hero art) |
| none | Sign-in, tenant select, import, consent, privacy, interviews, audit as a screen, all Booking Core screens |

### New Open Questions (this document)

- **UI-1** Skill selector: ux-flows.md shows three levels; the model has six plus a source (TR-034). Q10.10 covers the enum migration only. Not defined: what the guest sees (three groups mapped to six, all six, or a "not sure" choice stored as unresolved), and what source value a three-group choice records. SkillLevelSelector variants below are layouts only and carry no mapping.
- **UI-2** Phase 1 pilot console access has no auth (Q10.19). Phase 1 console screens are listed without a sign-in gate; whether a pilot token or shared link is used is undecided.
- **UI-3** Console language: decisions.md defers full admin bilingual support to Beta (Q10.16). Console screens are i18n: no (provisional); Plan Review is i18n: yes because TR-038 flags it. Needs one decision.
- **UI-4** The prototype has Schedule, Pros and Students tabs that no P0 use case describes (overview lists "schedule, pros, students" for the Manager Console). Keep as read-only screens tied to UC-035/047/052, or leave out of P0?
- **UI-5** TR-030 data-class policy writes are platform_admin only. No platform-admin surface exists among the four apps. Only the school_admin read-only status screen is listed.
- **UI-6** Consent screen: age threshold, wording and version text are unset (Q10.40). Also unset: whether an adult booking for themselves sees a privacy notice (conversation is personal data) and where consent sits relative to the school intake link.
- **UI-7** Overlay guest links (offer accept, student interview) have no delivery channel (Q10.28, Q10.36). Email and SMS templates for them are provisional counts, not designs.
- **UI-8** SkiMatch placement: standalone /skimatch pages or embedded in the school's own checkout (Q10.31, overview risk 4). Routes are provisional.
- **UI-9** Guest Checkout Form: no skill selector (carried from browse). Whether it shows an age or a date-of-birth input depends on Q10.42.
- **UI-10** Approval screen states: editing a plan before approval (Q10.20), required rejection reason (Q10.21) and who holds approval right (Q10.22) are undecided. States list the neutral cases only.
- **UI-11** Execution screen: no retry or rollback control until Q10.23/Q10.24 decide failure handling. The failed state shows the failure only.
- **UI-12** Group program screen: how a flagged conflict week is fixed (retry one week or resubmit) is undecided (Q10.49). The flagged-week row shows reason and no action button.
- **UI-13** Household checkout: failure states for several learners depend on Q10.45 (one capture or per Booking; partial failure).
- **UI-14** Modify Booking (UC-057) screen is provisional; it cannot be designed before Q10.50 defines what is modifiable.
- **UI-16** Privacy Center and Consent Management sit under /account, but the guest account system is Booking Core (Phase 3). Phase 2 guests reach them by token link or another route; undecided.
- **UI-15** Instructor interview screens (UC-052) are provisional because the Instructor App is not a listed Phase 2 deliverable (Q10.37).

---

## Customer App

### Phase 3 — Booking Core

---

### Customer / Booking Widget Home — Phase 3

**Route:** /
**UC:** UC-001
**Elements:** LessonTypeSelector, AgeInput, SkillLevelSelector, DatePicker, AvailabilityGrid, InstructorCard
**States:** loading, empty (no availability), results, no-availability (waitlist prompt), slot-conflict (BOOKING_CONFLICT)
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

---

### Customer / Instructor Profile — Phase 3

**Route:** /instructors/:id
**UC:** UC-002
**Elements:** InstructorPhoto, BilingualBio, CertificationBadges, LanguagesList, StarRating, SelectButton
**States:** loading, error
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Authentication Gate — Phase 3

**Route:** /checkout/auth
**UC:** UC-003, UC-004
**Elements:** GuestContinueButton, SignInForm, CreateAccountLink, LanguageToggle, HoldExpiryTimer
**States:** default, loading, hold-expired (HOLD_EXPIRED)
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Guest Checkout Form — Phase 3

**Route:** /checkout/guest
**UC:** UC-003
**Elements:** EmailInput, NameInputs, LanguageToggle, ParentalConsentCheckbox, CarriedLearnerSummary, SubmitButton
**States:** default, validation-error, loading, age-blocked (AGE_TOO_YOUNG), hold-expired
**Breakpoint:** both
**i18n:** yes
**Currency:** no

Changed from Run 9: skill selector and date-of-birth input removed; age and skill level are carried from UC-001 and shown read-only (decisions.md 2026-03-20). See UI-9, Q10.42.

---

### Customer / Learner Selection — Phase 3

**Route:** /checkout/learners
**UC:** UC-005
**Elements:** LearnerMultiSelect, AddLearnerInlineForm, SkillLevelSelector, AgeInput, OneClickSummary, ContinueButton
**States:** loading, none-selected, one-selected, several-selected, inline-add, hold-expired
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

New. Missing from ux-flows.md §1 (single learner only). Inline add collects age and skill level (decisions.md 2026-11-01). Hold and capacity behavior for several learners: UI-13.

---

### Customer / Payment Screen — Phase 3

**Route:** /checkout/payment
**UC:** UC-003, UC-004, UC-005, UC-070, UC-071
**Elements:** ProcessorSDKEmbed, SaveCardToggle, CardOnFileList, PaymentSummary, ConfirmButton, HoldExpiryTimer
**States:** loading, processing, declined (PAYMENT_FAILED), hold-expired (HOLD_EXPIRED), stored-card-invalid (isValid false), multi-learner-partial-failure (blocked by UI-13)
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

Embed variant by tenant: Stripe Elements on every tier, Shift4 on Growth+.

---

### Customer / Booking Confirmation — Phase 3

**Route:** /booking/:id/confirmation
**UC:** UC-003, UC-004, UC-005, UC-020
**Elements:** BookingSummaryCard, InstructorDetails, IcsDownloadLink, AddToCalendarButton, PostLessonLinkNotice, AccountCreationPrompt
**States:** success, success-multi-learner, error
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

---

### Customer / Post-Payment Account Creation — Phase 3

**Route:** /checkout/create-account
**UC:** UC-003
**Elements:** PrePopulatedForm, CarriedLearnerSummary, PasswordInput, SkipButton, CreateAccountButton
**States:** default, loading, success
**Breakpoint:** both
**i18n:** yes
**Currency:** no

Sub-profile vs self-Learner and booking re-link are open (Q10.44).

---

### Customer / Account Dashboard — Phase 3

**Route:** /account
**UC:** UC-018, UC-005, UC-057
**Elements:** UpcomingLessonsList, HouseholdMemberList, PaymentMethodList, BookingHistoryLink, LanguageToggle, ModifyButton
**States:** loading, empty (no upcoming lessons), populated
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

---

### Customer / Modify Booking — Phase 3 (provisional)

**Route:** /account/bookings/:id/modify
**UC:** UC-057
**Elements:** BookingSummaryCard, ChangeForm, AvailabilityGrid, ConfirmButton, CancelInsteadLink
**States:** loading, conflict (BOOKING_CONFLICT), success, not-modifiable
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

Blocked by UI-14 (Q10.50); no API exists.

---

### Customer / Learner Management — Phase 3

**Route:** /account/learners
**UC:** UC-018
**Elements:** LearnerCard, AddLearnerForm, EditLearnerForm, SkillLevelSelector, DeleteButton, ParentalConsentBadge
**States:** loading, empty, populated, delete-blocked (LEARNER_HAS_ACTIVE_BOOKINGS)
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Payment Methods — Phase 3

**Route:** /account/payment-methods
**UC:** UC-018, UC-006
**Elements:** CardList, AddCardButton, SetDefaultButton, RemoveButton, ProcessorSDKEmbed
**States:** loading, empty, populated, card-invalid (processor switched)
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Post-Lesson Review — Phase 3

**Route:** /booking/:id/review
**UC:** UC-007, UC-058
**Elements:** StarRatingInput, CommentTextarea, SubmitRatingButton, TipForm, TipPaymentMethodSelector, TipWindowExpiryNotice
**States:** loading, not-yet-unlocked (booking not completed), rating-pending, rating-submitted, tip-pending, tip-submitted, tip-window-expired (TIP_WINDOW_EXPIRED), already-rated (RATING_ALREADY_SUBMITTED)
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

New state not-yet-unlocked (link in confirmation email opens before completion). Guest with no stored card has no tip payment path yet (carried TR-008 question).

---

### Customer / Waitlist Join — Phase 3

**Route:** /waitlist/join
**UC:** UC-008
**Elements:** WaitlistModeSelector, LessonTypeDisplay, DateDisplay, InstructorSelector, SubmitButton
**States:** default, loading, success, already-on-waitlist
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Customer / Waitlist Offer Accept — Phase 3

**Route:** /waitlist/:id/accept
**UC:** UC-008
**Elements:** OfferSummaryCard, OfferWindowTimer, AcceptButton, WithdrawButton
**States:** loading, open (2-hour window), expired (WAITLIST_WINDOW_EXPIRED), accepted-to-checkout
**Breakpoint:** both
**i18n:** yes
**Currency:** yes

New; Run 9 had no accept screen. Accept routes to checkout (payment). Overlay offers use a different screen (see Offer Response).

---

### Customer / Contact School Card — Phase 3

**Route:** /booking/:id/cancel-info
**UC:** UC-006
**Elements:** SchoolContactDetails, PolicySummary, PhoneLink, EmailLink
**States:** default
**Breakpoint:** both
**i18n:** yes
**Currency:** no

---

### Phase 2 — SkiMatch, Learning Loop, Consent and Privacy

---

### Customer / SkiMatch Start — Phase 2 — ported prototype

**Route:** /skimatch
**UC:** UC-047
**Elements:** Hero, MountainArt, StartButton, LanguageToggle, SchoolBranding
**States:** default, intake-link-invalid, consent-required-redirect
**Breakpoint:** both
**i18n:** yes
**Currency:** no

Prototype: home.tsx, mountain.tsx. Entry by school link token; placement in the school's checkout is UI-8.

---

### Customer / Minor Consent — Phase 2

**Route:** /skimatch/consent/:learnerId
**UC:** UC-055
**Elements:** DataUseExplainer, ConsentPanel, ConsentVersionLabel, AgreeButton, DeclineButton, LanguageToggle
**States:** loading, default, granted, declined (school handles booking in POS), error
**Breakpoint:** both
**i18n:** yes
**Currency:** no

New; no consent UI in the prototype. Shown before intake or interview for a learner under 18. Wording and age rule: UI-6, Q10.40. Gate: TR-055 must exist before real data.

---

### Customer / Intake Conversation — Phase 2 — ported prototype

**Route:** /skimatch/intake/:token
**UC:** UC-047
**Elements:** ConversationThread, MessageInput, ProgressIndicator, OriginalWordingQuote, LanguageToggle, PrivacyNoteLink
**States:** loading, in-progress, skill-unresolved, minor-with-adult, consent-required (CONSENT_REQUIRED), privacy-gate-closed (PRIVACY_GATE_CLOSED), error
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

Prototype: conversation.tsx, booking-agent.tsx (deterministic mock today). EN/FR handling: Q10.30.

---

### Customer / Intake Summary and Correction — Phase 2 — ported prototype

**Route:** /skimatch/intake/:id/summary
**UC:** UC-047
**Elements:** ProfileSummaryCard, OriginalWordingQuote, SkillLevelSelector, SkillSourceBadge, EditFieldButton, ConfirmButton
**States:** loading, default, editing, skill-unresolved, saved
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

Prototype: lesson-profile.tsx. Shows structured value beside original wording; unclear skill stays unresolved, never guessed.

---

### Customer / Instructor Matches — Phase 2 — ported prototype

**Route:** /skimatch/intake/:id/matches
**UC:** UC-048
**Elements:** InstructorCard, FitReasonList, MismatchList, EstimateLabel, WhyRankedLowerLink, ChooseButton
**States:** loading, results, no-match (waitlist or manager review offered), preferred-saved, error
**Breakpoint:** both
**i18n:** yes
**Currency:** no

Prototype: ski-match.tsx, instructor-card.tsx. Visible instructor fields are an allow-list (Q10.33).

---

### Customer / Group Placement Status — Phase 2 — ported prototype

**Route:** /skimatch/group-placement/:id
**UC:** UC-049
**Elements:** RequestSummaryCard, StatusBadge, QueuePosition, AlternativesList, ReviseButton, NewRequestButton
**States:** pending, placed, unplaceable (alternatives proposed), loading, error
**Breakpoint:** both
**i18n:** yes
**Currency:** no

Prototype: group-placement.tsx. Customer-selected group lesson types use the Phase 3 group booking flow instead.

---

### Customer / Offer Response — Phase 2

**Route:** /offers/:token
**UC:** UC-046
**Elements:** OfferSummaryCard, OfferWindowTimer, AcceptButton, DeclineButton, NoPaymentNotice
**States:** loading, open (2-hour window), accepted (school will confirm in POS), declined, expired, error
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

New. Accepting confirms nothing and takes no payment. Delivery channel: UI-7, Q10.28.

---

### Customer / Student Post-Lesson Interview — Phase 2

**Route:** /interview/:token
**UC:** UC-051
**Elements:** ConversationThread, QuestionCard, SkipButton, SaveForLaterNotice, AdultRespondentToggle, LanguageToggle
**States:** loading, in-progress, partial-saved, complete, lesson-not-complete, consent-required, privacy-gate-closed
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

New; reuses ConversationThread from the prototype. Relation to rating and tip (Booking Core) is open (Q10.36).

---

### Customer / Next-Lesson Recommendation — Phase 2 — ported prototype

**Route:** /account/learners/:id/next-lesson
**UC:** UC-053
**Elements:** RecommendationCard, ReasonList, EstimateLabel, RequestButton, DismissButton, InstructorCard
**States:** loading, recommended, instructor-unavailable (next-best shown), not-enough-data (new intake offered), requested, dismissed
**Breakpoint:** both
**i18n:** yes
**Currency:** no

Prototype: next-lesson.tsx. Whether guests can book directly from it is open (Q10.38).

---

### Customer / Privacy Center — Phase 2

**Route:** /account/privacy
**UC:** UC-054
**Elements:** LearnerSelector, ExportButton, EraseButton, PrivacyRequestStatus, RetainedRecordsNotice, ConfirmDialog
**States:** loading, default, export-ready, erasure-pending, erasure-complete, partial (retained records listed), error
**Breakpoint:** both
**i18n:** yes
**Currency:** no

New. Verified head of household only. POS-owned records are not erased by Slopebook; the school is notified. Routes may sit in guest accounts that Phase 2 does not yet provide (account system is Phase 3): see UI-16.

---

### Customer / Consent Management — Phase 2

**Route:** /account/learners/:id/consent
**UC:** UC-055, UC-054
**Elements:** ConsentPanel, ConsentHistoryList, WithdrawButton, ExportOfferLink, ConfirmDialog
**States:** loading, active, withdrawn (collection stopped, export offered), error
**Breakpoint:** both
**i18n:** yes
**Currency:** no

New. Withdrawal stops collection and offers UC-054.

---

## Admin App

### Phase 1 — Manager Console (shadow pilot, read-only)

---

### Admin / Console Today — Phase 1 — ported prototype

**Route:** /admin/console
**UC:** UC-037, UC-035, UC-039
**Elements:** DayStatsRow, IssueCard, SeeAllIssuesLink, AgentChatPanel, ImportStatusBadge, ModeBadge
**States:** loading, populated, no-issues (nothing needs attention), no-import-yet, import-failed
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype: Today tab. The prototype's "LOCAL SIMULATION" badge becomes ModeBadge (shadow, live, read-only POS).

---

### Admin / Schedule Import — Phase 1

**Route:** /admin/console/import
**UC:** UC-035
**Elements:** DateRangePicker, StartImportButton, ImportSummary, ImportHistoryList, FlagCountBadge, ReadOnlyNotice
**States:** idle, running, complete, structurally-unreadable (IMPORT_UNREADABLE), re-import-updated, error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. The import mechanism (upload, scheduled pull, vendor API) is open (Q10.11), so the start control is a placeholder. Reached from Today and the sidebar.

---

### Admin / Import Flags — Phase 1

**Route:** /admin/console/import/:id/flags
**UC:** UC-036
**Elements:** FlagTable, ImportFlagRow, ReasonFilter, SourceRowPreview, DismissButton, IncompleteMarker
**States:** loading, populated, empty, dismissed, whole-batch-rejected (partial vs whole undecided, Q10.13)
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. Flagged records are excluded from issue detection until fixed.

---

### Admin / Issues — Phase 1 — ported prototype

**Route:** /admin/console/issues
**UC:** UC-037
**Elements:** IssueCard, TypeFilter, StatusFilter, TimeToImpactLabel, AffectedLessonsList, EstimateLabel
**States:** loading, populated, filtered-empty, no-issues, resolved-only
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype: Issues tab. Ranking criteria (Q10.14) and issue types beyond absence, group imbalance and overload (Q10.15) are open.

---

### Admin / Resolution Plan Review — Phase 1 — ported prototype

**Route:** /admin/console/plans/:id
**UC:** UC-038
**Elements:** PlanReasoning, PlanActionList, ImpactSummary, ConstraintValidationRow, EstimateLabel, PlanCompareView
**States:** loading, valid, constraint-failed (cannot approve), several-plans-compare, stale (PLAN_STALE), error
**Breakpoint:** desktop
**i18n:** yes (UI-3)
**Currency:** no

Prototype: plan drawer in manager-dashboard.tsx (reasoning, actions with risk, impact, validation, simulated confidence). Missing in prototype: side-by-side compare, stale state. In Phase 1 the approve control is hidden (UC-040 path).

---

### Admin / Manager Agent Panel — Phase 1 (provisional) — ported prototype

**Route:** /admin/console/agent
**UC:** UC-039
**Elements:** ConversationThread, QuestionInput, SuggestedPrompts, CitedFactsList, RelatedIssueLink, AgentBoundaryNote
**States:** empty, answering, answered, insufficient-data, privacy-gate-closed, error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype: aside on the Today tab (deterministic mock, agent footnote "proposes, you decide"). Also embeds as a panel on Today. A request to change the schedule yields a draft plan, never a write. Phase provisional (Q10.53).

---

### Admin / Recommendation Observation — Phase 1

**Route:** /admin/console/plans/:id/observation
**UC:** UC-040
**Elements:** ResultSelector, ReasonTextarea, RecordedActionNote, SaveButton, SkipButton, PlanSummaryCard
**States:** unrecorded, saving, saved, error, privacy-gate-closed
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. The prototype shows an observation count only. Result choices: matched, partly matched, different, not needed. Whether "what the manager did" is self-reported or inferred is open (Q10.41).

---

### Admin / Pilot Match Report — Phase 1

**Route:** /admin/console/reports/pilot
**UC:** UC-040
**Elements:** DateRangePicker, MatchCountsTable, MatchRateSummary, ObservationList, ExportButton
**States:** loading, populated, empty, error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. Aggregates matched, partly matched, different, not needed for the shadow-pilot success metrics.

---

### Admin / Console Schedule — Phase 1 (provisional) — ported prototype

**Route:** /admin/console/schedule
**UC:** UC-035, UC-037
**Elements:** DayView, InstructorLanes, LessonBlock, IssueMarker, DateNavigator, ReadOnlyNotice
**States:** loading, populated, empty-day, issue-highlighted
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype: Schedule tab. Read-only view of the imported day, no drag and drop (that is Phase 3 Admin / Schedule View). No UC defines it: UI-4.

---

### Admin / Console Pros — Phase 1 (provisional) — ported prototype

**Route:** /admin/console/pros
**UC:** UC-035, UC-052
**Elements:** InstructorProfileCard, CertificationBadge, SpecialtiesList, LearnedProfileSummary, POSReferenceLabel, DailyHoursLimit
**States:** loading, populated, empty-learned-profile
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype: Pros tab. The learned profile is a coaching input, not an evaluation, and is visible to school_admin and the instructor only (TR-052). UI-4.

---

### Admin / Console Students — Phase 1 (provisional) — ported prototype

**Route:** /admin/console/students
**UC:** UC-035, UC-047
**Elements:** StudentSearch, StudentProfileCard, SkillLevelBadge, SkillSourceBadge, OriginalWordingQuote, POSReferenceLabel
**States:** loading, populated, no-results, incomplete-profile (skill unresolved)
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype: Students tab. Original wording is personal data: the gate applies once real data is used. UI-4.

---

### Phase 2 — Manager Console (live overlay)

---

### Admin / Sign In — Phase 2

**Route:** /admin/sign-in
**UC:** UC-041
**Elements:** EmailInput, PasswordInput, SignInButton, ForgotPasswordLink, LanguageToggle, SessionExpiredNotice
**States:** default, loading, invalid-credentials, session-expired (returns to same view), locked-or-unauthorized
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. Sign-in method (password or SSO) and password reset (OQ-062) undecided (Q10.18).

---

### Admin / Tenant Select — Phase 2

**Route:** /admin/select-tenant
**UC:** UC-041
**Elements:** TenantList, TenantSwitcher, SelectButton, RoleBadge, SignOutLink
**States:** loading, one-tenant (auto-select), several-tenants, none, error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. One tenant per session; no cross-tenant data is shown.

---

### Admin / Plan Approval Decision — Phase 2 (provisional) — ported prototype (partial)

**Route:** /admin/console/plans/:id/decision
**UC:** UC-042
**Elements:** ApprovalPanel, ActionCheckboxList, ReasonTextarea, ApproveButton, RejectButton, ValidationRecheckNotice
**States:** ready, subset-selected, revalidating, stale (PLAN_STALE), blocked (PLAN_VALIDATION_FAILED), approved, rejected
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype has one "Approve & Resolve" button inside the plan drawer with no subset approval, reason or stale handling. Edit-before-approve, required reason, approval right: UI-10.

---

### Admin / Execution and Verification — Phase 2 — ported prototype (partial)

**Route:** /admin/console/plans/:id/outcome
**UC:** UC-043
**Elements:** OutcomeTimeline, ActionOutcomeRow, ExpectedVsObservedDiff, ManualExecutionNotice, StatusBadge, ExecuteButton
**States:** ready-to-execute, executing, verified, failed (issue stays open), manual-pending (read-only adapter), partial
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype lists outcomes with a "Verified in Mock POS" message. Real screen shows expected vs read-back state per action. No retry control until UI-11.

---

### Admin / Audit History — Phase 2 (provisional) — ported prototype (partial)

**Route:** /admin/console/audit
**UC:** UC-044
**Elements:** AuditTable, AuditEntryRow, FilterBar (date, issue type, user, outcome), ExportButton, VerificationBadge
**States:** loading, populated, filtered-empty, empty, error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype has an inline "verified action history" section on the page, not a screen. Read-only; overlay retention undefined (Q10.25).

---

### Admin / Audit Entry Detail — Phase 2 (provisional)

**Route:** /admin/console/audit/:id
**UC:** UC-044
**Elements:** DecisionSummary, ActionList, ValidationResults, OutcomeTimeline, UserAndTimeLabel, ReasonText
**States:** loading, populated, error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. Shows user id and name, never raw email in logs.

---

### Admin / Waitlist Ranking — Phase 2 (provisional) — ported prototype

**Route:** /admin/console/waitlist
**UC:** UC-045
**Elements:** OpenSlotHero, RankedCandidateCard, FitReasonList, EstimateLabel, ManualOrderControl, AllRequestsTable
**States:** loading, ranked, unresolved-skill-flagged, no-candidates, error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype: Waitlist tab (candidate cards with fit %, reasons, requests table). Fit ranking vs FIFO default is open (OQ-034).

---

### Admin / Waitlist Offer — Phase 2 (provisional) — ported prototype (partial)

**Route:** /admin/console/waitlist/:slotRef/offer
**UC:** UC-046
**Elements:** OfferSummaryCard, OfferWindowTimer, SendOfferButton, NoReservationNotice, OfferStatusBadge, NextCandidateCard
**States:** ready, offered (2-hour window), accepted (confirm in POS), declined, expired (next candidate shown), error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

Prototype: "Review & offer slot" then "Offer recorded, awaiting acceptance". Real flow adds a timer and accept/decline outcome. Who creates the reservation: Q10.27.

---

### Admin / Intake Link to POS Reservation — Phase 2

**Route:** /admin/console/intakes/:id/link
**UC:** UC-050
**Elements:** IntakeSummaryCard, CandidateReservationList, ConfirmLinkButton, UnlinkButton, LinkStatusBadge, POSReferenceLabel
**States:** loading, candidates, no-reservation (pending), linked, relinked, error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. Manual vs automatic linking is open (Q10.35).

---

### Admin / Group Placement Queue — Phase 2

**Route:** /admin/console/group-placements
**UC:** UC-049
**Elements:** RequestTable, ComposeGroupPanel, AlternativesForm, StatusFilter, GuestSummaryCard, PlaceButton
**States:** loading, populated, empty, placed, unplaceable (alternatives proposed)
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. Composition rules (ability spread, age bands) are open (Q10.34).

---

### Admin / Privacy Gate Status — Phase 2

**Route:** /admin/settings/privacy
**UC:** UC-054, UC-055 (TR-030 gate)
**Elements:** DataClassTable, PolicyStatusBadge, RealDataStateBadge, DecisionRefLink, ClosedGateNotice
**States:** loading, gate-closed, gate-open, class-missing-policy
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New, read-only for school_admin. Platform-admin writes have no surface (UI-5).

---

### Admin / Privacy Requests — Phase 2

**Route:** /admin/privacy-requests
**UC:** UC-054
**Elements:** RequestTable, StartExportButton, StartErasureButton, PrivacyRequestStatus, RetainedRecordsList, PosNotifiedBadge
**States:** loading, populated, empty, completed, partial (retained records), error
**Breakpoint:** desktop
**i18n:** no (provisional, UI-3)
**Currency:** no

New. School admin acts on request for a learner. Who may request on a school's behalf: Q10.39.

---

### Phase 3 — Booking Core

---

### Admin / Schedule View — Phase 3

**Route:** /admin/schedule
**UC:** UC-014
**Elements:** DayWeekMonthToggle, InstructorLanes, BookingDragTarget, ConflictIndicator, DateNavigator, ReassignModal
**States:** loading, populated, conflict (BOOKING_CONFLICT), empty-day
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

Real-time push mechanism: OQ-063.

---

### Admin / Booking List — Phase 3

**Route:** /admin/bookings
**UC:** UC-014, UC-019
**Elements:** BookingTable, FilterBar, CancelButton, BulkCancelButton, ExportButton, BulkCancelDialog
**States:** loading, empty, populated, bulk-cancel-confirmation
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

---

### Admin / Booking Detail — Phase 3

**Route:** /admin/bookings/:id
**UC:** UC-014, UC-006
**Elements:** BookingSummary, LearnerDetails, PaymentSummary, SessionNotesList, CancelButton, ReassignButton
**States:** loading, populated
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

---

### Admin / Instructor Roster — Phase 3

**Route:** /admin/instructors
**UC:** UC-015
**Elements:** InstructorTable, OnboardingStatusBadge, CertExpirySoonBadge, FilterBar, ApproveButton, AddInstructorButton
**States:** loading, empty, populated, pending-approvals
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

---

### Admin / Instructor Detail — Phase 3

**Route:** /admin/instructors/:id
**UC:** UC-015
**Elements:** ProfileForm, CertificationList, AddCertForm, WorkdayHandoffButton, ApproveButton, EarningsSummary
**States:** loading, pending, approved, certification-expiry-warning
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

---

### Admin / Waitlist Panel — Phase 3

**Route:** /admin/waitlist
**UC:** UC-016
**Elements:** WaitlistTable, FilterBar, PromoteButton, NotificationHistoryTooltip, OfferWindowTimer
**States:** loading, empty, populated
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

Distinct from the Phase 2 Waitlist Ranking and Offer screens (offer without reservation).

---

### Admin / Lesson Type Configuration — Phase 3

**Route:** /admin/lesson-types
**UC:** UC-017
**Elements:** LessonTypeTable, CreateLessonTypeForm, EditLessonTypeForm, SkillLevelsMultiSelect, DeactivateButton, CancellationPolicySelector
**States:** loading, empty, populated
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

Skill levels use the six-level scale. Group mode (customer-selected vs school-composed) selector added by TR-049: placed here once Q10.34 closes.

---

### Admin / Cancellation Policy Configuration — Phase 3

**Route:** /admin/cancellation-policies
**UC:** UC-017
**Elements:** PolicyList, CreatePolicyForm, EditPolicyForm, SetDefaultButton, DefaultBadge
**States:** loading, empty, populated
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

---

### Admin / Group Program Bulk Create — Phase 3

**Route:** /admin/lesson-types/:id/program
**UC:** UC-056, UC-017
**Elements:** ProgramDefinitionForm, WeekPreviewList, ConflictWeekRow, SubmitButton, CreatedSessionsList, InstructorSelector
**States:** default, validation-error, submitting, success (all weeks created), partial (flagged conflict weeks listed, others created), error
**Breakpoint:** desktop
**i18n:** yes
**Currency:** no

New. One submit creates every weekly session; a conflicting week is flagged with its reason and not created. Fix path for flagged weeks: UI-12. DST and max weeks: Q10.48.

---

### Admin / Walk-Up Booking Form — Phase 3

**Route:** /admin/walk-up
**UC:** UC-021
**Elements:** CustomerSearchInput, CreateCustomerForm (email, name, DOB), SkillLevelSelector, ParentalConsentCheckbox, SlotSelector, BookingConfirmButton
**States:** loading, new-customer, existing-customer, age-blocked, booking-confirmed, payment-error
**Breakpoint:** desktop
**i18n:** yes
**Currency:** yes

Collects date of birth and six-level skill with source here because the flow has no browse stage (decisions.md 2026-11-01). Payment via POS card terminal.

---

## Instructor App (PWA)

### Phase 2 — Learning Loop (provisional, UI-15)

---

### Instructor / Interview List — Phase 2 (provisional)

**Route:** /interviews
**UC:** UC-052
**Elements:** OpenInterviewList, LessonCard, DeferBadge, GroupBadge, StartButton
**States:** loading, empty (none open), populated, error
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

New. Open interviews persist until completed or deferred.

---

### Instructor / Lesson Interview — Phase 2 (provisional)

**Route:** /interviews/:lessonRef
**UC:** UC-052
**Elements:** StudentTabs, QuestionCard, WholeGroupShortcut, SaveButton, DeferButton, ProfileUpdateNotice
**States:** loading, in-progress, group-shortcut-applied, deferred, complete, privacy-gate-closed
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

New. Per-student answers with a whole-group shortcut. Learned profile is for coaching, not evaluation (stated on screen).

---

### Phase 3 — Booking Core

---

### Instructor / Today's Schedule — Phase 3

**Route:** /schedule
**UC:** UC-009, UC-013
**Elements:** LessonCardList, DateNavigator, CheckInButton, CompleteButton, NoShowButton, EmptyStateIllustration
**States:** loading, empty, populated, all-complete
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

---

### Instructor / Lesson Detail — Phase 3

**Route:** /schedule/:bookingId
**UC:** UC-009, UC-010, UC-011, UC-012
**Elements:** StudentInfoCard, SkillLevelBadge, MeetingPointDisplay, PriorNotesList, AddNoteButton, CheckInButton
**States:** loading, pre-checkin, checked-in, completed, no-show
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

Skill level shows the six-level label and its source.

---

### Instructor / Session Notes — Phase 3

**Route:** /schedule/:bookingId/notes
**UC:** UC-012
**Elements:** NotesList, NoteComposer, ShareWithStudentToggle, SubmitButton
**States:** loading, empty, populated, saving
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

---

### Instructor / Availability Management — Phase 3

**Route:** /availability
**UC:** UC-023
**Elements:** WeeklyGrid, RecurringRuleForm, DateOverrideForm, BlockDateButton, SaveButton
**States:** loading, empty, populated, conflict-warning
**Breakpoint:** mobile
**i18n:** yes
**Currency:** no

---

## Operator App

No P0 use case; no screens (unchanged from Run 9).

---

## Shared Components

### SkillLevelSelector (new)
**Surfaces:** customer, admin
**UC:** UC-001, UC-003, UC-005, UC-018, UC-021, UC-047
**Variants:** three-level-legacy (ux-flows layout, mapping undecided), six-level, six-level-with-source, not-sure (stores unresolved)
Mapping: UI-1. Labels EN and FR. i18n: yes.

### SkillSourceBadge (new)
**Surfaces:** customer, admin, instructor
**UC:** UC-035, UC-047, UC-009, UC-021
**Variants:** customer, inferred, instructor, unresolved

### SkillLevelBadge (new)
**Surfaces:** customer, admin, instructor
**UC:** UC-009, UC-018, UC-047, UC-048
**Variants:** first_timer, beginner, advanced_beginner, intermediate (advanced and expert share the pattern)

### EstimateLabel (new)
**Surfaces:** customer, admin
**UC:** UC-038, UC-045, UC-048, UC-053
**Variants:** score, confidence, fit-percent, recommendation

### IssueCard (new, ported prototype)
**Surfaces:** admin
**UC:** UC-037
**Variants:** high, medium, low, resolved

### PlanActionList (new, ported prototype)
**Surfaces:** admin
**UC:** UC-038, UC-042
**Variants:** read-only, selectable (subset approval), with-outcome

### ConstraintValidationRow (new, ported prototype)
**Surfaces:** admin
**UC:** UC-038, UC-043
**Variants:** passed, blocked, rechecked

### ApprovalPanel (new, ported prototype partial)
**Surfaces:** admin
**UC:** UC-042
**Variants:** approve-reject, subset, stale, read-only (Phase 1)

### OutcomeTimeline (new, ported prototype partial)
**Surfaces:** admin
**UC:** UC-043, UC-044
**Variants:** pending, verified, failed, manual-pending

### AuditEntryRow (new)
**Surfaces:** admin
**UC:** UC-044
**Variants:** verified, failed, manual, rejected

### ImportFlagRow (new)
**Surfaces:** admin
**UC:** UC-036
**Variants:** open, dismissed, fixed

### AgentChatPanel / ConversationThread (new, ported prototype)
**Surfaces:** admin, customer, instructor
**UC:** UC-039, UC-047, UC-051, UC-052
**Variants:** manager-agent (cited facts), intake, student-interview, instructor-interview

### OriginalWordingQuote (new)
**Surfaces:** customer, admin
**UC:** UC-047, UC-051, UC-053
**Variants:** inline, beside-structured-value

### FitReasonList (new, ported prototype)
**Surfaces:** customer, admin
**UC:** UC-045, UC-048, UC-053
**Variants:** reasons, mismatches, why-ranked-lower

### OfferWindowTimer (new)
**Surfaces:** customer, admin
**UC:** UC-046, UC-008, UC-016
**Variants:** open (2 hours fixed), expiring-soon, expired

### ConsentPanel (new)
**Surfaces:** customer
**UC:** UC-055, UC-047, UC-051
**Variants:** grant, review, withdraw, declined

### PrivacyRequestStatus (new)
**Surfaces:** customer, admin
**UC:** UC-054
**Variants:** export-ready, erasure-pending, complete, partial

### TenantSwitcher (new)
**Surfaces:** admin
**UC:** UC-041
**Variants:** select-page, header-menu

### LearnerMultiSelect (new)
**Surfaces:** customer
**UC:** UC-005
**Variants:** none-selected, several-selected, inline-add

### ConflictWeekRow (new)
**Surfaces:** admin
**UC:** UC-056
**Variants:** created, flagged (reason), pending

### LanguageToggle
**Surfaces:** customer, instructor, admin
**UC:** UC-022
**Variants:** header-inline, settings-page, checkout-flow, guest-checkout-form

### InstructorCard (ported prototype: instructor-card.tsx)
**Surfaces:** customer
**UC:** UC-001, UC-002, UC-048, UC-053
**Variants:** compact (grid), expanded (profile), selected, match (fit reasons)

### BookingSummaryCard
**Surfaces:** customer, admin, instructor
**UC:** UC-003, UC-004, UC-005, UC-014
**Variants:** confirmation, list-item, detail, multi-learner

### HoldExpiryTimer
**Surfaces:** customer
**UC:** UC-001, UC-003
**Variants:** active, expiring-soon (< 2 min), expired

### StarRatingInput
**Surfaces:** customer
**UC:** UC-007
**Variants:** interactive, read-only, submitted

### TipForm
**Surfaces:** customer
**UC:** UC-058
**Variants:** default, submitted, window-expired

### ContactSchoolCard
**Surfaces:** customer
**UC:** UC-006
**Variants:** cancel-blocked (guest), generic-support

### ProcessorSDKEmbed
**Surfaces:** customer, admin
**UC:** UC-003, UC-004, UC-005, UC-070, UC-071
**Variants:** stripe-elements, shift4-embed

### CertificationBadge
**Surfaces:** customer, admin, instructor
**UC:** UC-002, UC-015
**Variants:** valid, expiring-soon, expired

---

## Design Tokens Needed

Run 9 tokens kept; new Run 10 tokens added. Check against styles already in packages/skimatch (prototype badges and cards) before creating duplicates.

- `--color-hold-expiry-warning` — amber; used in HoldExpiryTimer (expiring-soon state)
- `--color-no-show-indicator` — muted red; used in Instructor / Today's Schedule no-show state
- `--color-booking-complete` — green; used in Instructor / Lesson Detail completed state
- `--color-conflict-indicator` — red; used in Admin / Schedule View conflict state, ConflictWeekRow flagged
- `--color-cert-expiry-warning` — amber; used in CertificationBadge expiring-soon
- `--spacing-card-compact` — 12px; InstructorCard compact grid variant
- `--font-size-rating-star` — 24px; StarRatingInput interactive
- `--duration-hold-timer` — animation: countdown from 15 min; HoldExpiryTimer
- `--color-estimate-label` — neutral accent distinguishing estimates from facts; used in EstimateLabel, Plan Review, Instructor Matches, Waitlist Ranking
- `--color-validation-pass` — green; used in ConstraintValidationRow, Plan Review, Execution and Verification
- `--color-validation-blocked` — red; used in ConstraintValidationRow, Plan Approval Decision
- `--color-severity-scale` — three-step set (high, medium, low); used in IssueCard, Issues, Console Today
- `--color-skill-source-unresolved` — muted flag color; used in SkillSourceBadge, Intake Summary, Console Students, Waitlist Ranking
- `--duration-offer-window` — 2-hour countdown display style; used in OfferWindowTimer
- `--font-style-original-wording` — quoted-text style; used in OriginalWordingQuote, Intake Summary, Console Students

---

## Asset Checklist

- [ ] Screens: 27 (customer app: 16 Phase 3, 11 Phase 2)
- [ ] Screens: 33 (admin app: 11 Phase 1, 12 Phase 2, 10 Phase 3)
- [ ] Screens: 6 (instructor app — PWA: 2 Phase 2 provisional, 4 Phase 3)
- [ ] Screens: 0 (operator app)
- [ ] Shared components: 29 (9 from Run 9, 20 new)
- [ ] Icons: est. 34 (Run 9 14 + issue types 3, validation 2, outcome statuses 5, extra skill levels 3, skill sources 4, consent and privacy 3)
- [ ] Empty state illustrations: 10 (Run 9 4 + no issues, no import flags, no audit entries, no matches, not enough data for recommendation, no open interviews); existing MountainArt from the prototype reused for hero art
- [ ] Email templates: 7 EN + 7 FR confirmed (Run 9 events), plus 2 EN + 2 FR provisional (offer response link, student interview link; channel undecided, UI-7)
- [ ] SMS templates: 3 EN + 3 FR confirmed (booking.confirmed, booking.cancelled, booking.reminder); overlay offer and interview SMS undecided (UI-7)

Screens total: 66 (27 customer + 33 admin + 6 instructor). By phase: Phase 1 = 11 (admin), Phase 2 = 25 (11 customer, 12 admin, 2 instructor), Phase 3 = 30 (16 customer, 10 admin, 4 instructor). Ported prototype (full or partial): 18 screens (6 customer, 12 admin).

---

## UX Flows Missing a Screen

ux-flows.md is not edited. These follow the UX Flow Gaps in use-cases-p0-proposed.md, each mapped to the screens in this list:

- No Manager Console flow (import, ranked issues, plan review, approve/reject, execute/verify, audit): screens listed under Admin Phase 1-2
- No SkiMatch flow (intake, matches, group placement, POS linking): Customer SkiMatch screens and Admin / Intake Link to POS Reservation
- No learning loop flow (student and instructor interviews, next-lesson recommendation): Customer / Student Post-Lesson Interview, Instructor / Lesson Interview, Customer / Next-Lesson Recommendation
- No privacy flows (minor consent, export and erasure): Customer / Minor Consent, Consent Management, Privacy Center; Admin / Privacy Requests
- No overlay waitlist steps (fit ranking, offer without reservation; §1 says accept triggers payment): Admin / Waitlist Ranking, Waitlist Offer; Customer / Offer Response
- §1 skill selection shows three levels, not the six-level scale with source: SkillLevelSelector (UI-1)
- Admin sign-in and tenant selection not shown for the Manager Console: Admin / Sign In, Tenant Select
- §1 Booking Flow has no post-lesson rating and tip flow or its entry from the confirmation email: Customer / Post-Lesson Review (UC-007, UC-058)
- §1 "Select learner" is single-learner; multi-learner household checkout not shown: Customer / Learner Selection (UC-005)
- §1 Payment shows no processor choice (Stripe on every tier, Shift4 on Growth+): ProcessorSDKEmbed variants (UC-070, UC-071)
- §4 Lesson Configuration "bulk lesson creation" has no flow steps for flagged conflict weeks: Admin / Group Program Bulk Create (UC-056)
- §4 Admin walk-up booking is not in the flow list: Admin / Walk-Up Booking Form (UC-021)
- §2 "modify or cancel individual bookings" has no modify flow detail: Customer / Modify Booking (UC-057, provisional)
- §3 "Sync with Google Calendar (optional)": deferred (OQ-021); no screen
- §3 "Tips (if applicable)" under Earnings Dashboard: tips are guest post-lesson (UC-058); Instructor Earnings Dashboard is P1; no P0 screen
- §3 "optional digital signature" at check-in: deferred with Smartwaiver (OQ-052); no screen
- §3 Earnings Dashboard, §4 utilization and revenue reporting, §5 Operator Portal: no P0 use case; no screens
