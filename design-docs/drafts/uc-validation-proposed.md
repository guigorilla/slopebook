PASS — all 74 P0 registry items are covered

Run: pipeline-generate run 10, revision 2. Validator: uc-validator. Judged fresh on 2026-11-01 against use-cases-p0-proposed.md, uc-registry.md and decisions.md (2026-11-01 entries take precedence). Items checked: 74 = 21 Overlay Scope + 53 Alpha Scope (P0). Deferred items and P1/P2 sections excluded. This replaces the earlier FAIL in this file: UC-005, UC-021 and UC-056 now follow the 2026-11-01 decisions (inline learner add, walk-up collection and bulk create), so their earlier mismatches no longer apply.

## Coverage Report

### Overlay Phase 1 — Shadow Pilot (6)
- [FOUND] — Import a school's daily schedule and roster into the operating model (read-only) — UC-035
- [FOUND] — Reject or flag an import with invalid or incomplete records — UC-036
- [FOUND] — View today's issues ranked by what needs attention — UC-037
- [FOUND] — Review a resolution plan with reasoning, impact and constraint results — UC-038
- [FOUND] — Ask the manager agent questions about current operations — UC-039
- [FOUND] — Record whether a recommendation matched what the manager actually did — UC-040

### Overlay Phase 2 — Live Overlay (15)
- [FOUND] — Sign in to a tenant-scoped Manager Console — UC-041
- [FOUND] — Approve or reject a resolution plan — UC-042
- [FOUND] — Execute an approved plan through the adapter and verify the result — UC-043
- [FOUND] — View the decision and action audit history — UC-044
- [FOUND] — Rank a waitlist by slot, ability, goals and instructor fit — UC-045
- [FOUND] — Offer a waitlist slot without creating a confirmed reservation — UC-046
- [FOUND] — Complete a conversational booking intake with original wording preserved — UC-047
- [FOUND] — See instructor matches with fit reasons and potential mismatches — UC-048
- [FOUND] — Submit a school-composed group placement request — UC-049
- [FOUND] — Link a SkiMatch intake to a POS reservation — UC-050
- [FOUND] — Student completes a post-lesson interview — UC-051
- [FOUND] — Instructor completes a post-lesson interview — UC-052
- [FOUND] — View a next-lesson recommendation — UC-053
- [FOUND] — Export or erase a learner's profile and conversation data — UC-054
- [FOUND] — Parent or guardian consents before a minor's data is collected — UC-055

### Alpha Scope — Discovery & Availability (5)
- [FOUND] — Browse available lesson slots by age and skill level — UC-001
- [FOUND] — Filter available instructors by skill level eligibility — UC-001
- [FOUND] — View instructor profile (photo, bio EN/FR, certifications, languages, rating) — UC-002
- [FOUND] — Select date from availability calendar — UC-001
- [FOUND] — Select time slot and instructor from filtered results — UC-001

### Alpha Scope — Booking & Checkout (7)
- [FOUND] — Guest checkout — book without creating an account — UC-003
- [FOUND] — Authenticated checkout — book with existing account — UC-004
- [FOUND] — Household checkout — book for one or more learner sub-profiles — UC-005
- [FOUND] — Card-on-file one-click checkout for returning households — UC-005
- [FOUND] — Post-payment prompt to create account with pre-populated learner profile — UC-003
- [FOUND] — Booking confirmation — email + SMS in user's selected language — UC-003, UC-020
- [FOUND] — Booking confirmation — .ics calendar attachment — UC-003

### Alpha Scope — Payment (4)
- [FOUND] — Charge via Stripe — UC-070
- [FOUND] — Charge via Shift4 (Growth+ tenants) — UC-071
- [FOUND] — Refund to original payment method on cancellation — UC-006
- [FOUND] — Store card-on-file token via processor vault — UC-004, UC-018

### Alpha Scope — Post-Lesson Flow (4)
- [FOUND] — Student submits rating after lesson is marked complete — UC-007
- [FOUND] — Student submits tip after lesson is marked complete (optional) — UC-058
- [FOUND] — Post-lesson flow unlocked when booking status changes to completed — UC-013, UC-007
- [FOUND] — Post-lesson flow accessible via confirmation email link — UC-003, UC-007

### Alpha Scope — Cancellation (3)
- [FOUND] — Student cancels booking within cancellation window — UC-006
- [FOUND] — Admin cancels booking with automated refund — UC-006, UC-014
- [FOUND] — Weather cancellation — bulk cancel with student notification + rebooking link — UC-019

### Alpha Scope — Waitlist (5)
- [FOUND] — Join time-slot waitlist (any available instructor) — UC-008
- [FOUND] — Join instructor-specific waitlist — UC-008
- [FOUND] — Receive waitlist notification when slot opens (2-hour accept window) — UC-008, UC-020
- [FOUND] — Accept waitlist offer within 2-hour window — triggers payment and confirmation — UC-008
- [FOUND] — Waitlist offer expires after 2 hours — slot released — UC-008

### Alpha Scope — Instructor (8)
- [FOUND] — View today's schedule and upcoming bookings — UC-009
- [FOUND] — View student details for assigned lesson — UC-009
- [FOUND] — Check student in at lesson start — UC-010
- [FOUND] — Mark lesson as complete — UC-013
- [FOUND] — Mark student as no-show — UC-011
- [FOUND] — Add session notes per student per lesson — UC-012
- [FOUND] — Set recurring weekly availability — UC-023
- [FOUND] — Set date-specific availability override — UC-023

### Alpha Scope — Admin School Operations (8)
- [FOUND] — View all bookings — filterable by instructor, lesson type, date, status — UC-014
- [FOUND] — Assign instructor to booking via drag-and-drop scheduler — UC-014
- [FOUND] — Detect and resolve scheduling conflicts — UC-014
- [FOUND] — Approve new instructor onboarding — UC-015
- [FOUND] — View and manage all active waitlists — UC-016
- [FOUND] — Manually promote waitlisted student — UC-016
- [FOUND] — Configure lesson types, pricing, and capacity — UC-017
- [FOUND] — Bulk create lessons for group programs — UC-056

### Alpha Scope — Account & Household (5)
- [FOUND] — Create household account — UC-018
- [FOUND] — Add learner sub-profile to household — UC-018
- [FOUND] — View all upcoming lessons across all household members — UC-018
- [FOUND] — Modify individual booking without affecting others — UC-057
- [FOUND] — Store and manage card-on-file payment methods — UC-018, UC-004

### Alpha Scope — Notifications (4)
- [FOUND] — Send booking confirmation (email + SMS, EN/FR) — UC-020, UC-003
- [FOUND] — Send cancellation notice with refund confirmation — UC-020, UC-006
- [FOUND] — Send waitlist notification — UC-020
- [FOUND] — Send 24-hour lesson reminder — UC-020

Totals: 74 checked. FOUND 74. MISMATCH 0. MISSING 0.

Registry note (not a coverage failure): the status boxes in uc-registry.md are stale. All 15 Phase 2 and all 6 Phase 1 items, and the 4 Post-Lesson items, are still [ ] although their use cases are present. The registry owner should update them.

## Issues (FAIL only)
None.

## Decisions Compliance
All use cases comply with decisions.md as written. UC-005 (inline learner add) and UC-021 (walk-up collection) follow the 2026-11-01 scope decision. UC-056 follows the 2026-11-01 bulk-create decision.

Advisories for the product-lead to confirm (not contradictions, not blocking):
- UC-047, UC-051, UC-052 and UC-053 capture customer conversation, inferred profile and instructor observation data. No precondition ties them to the 2026-10-31 AI data privacy decision (retention and erasure rules, addressing minors, must exist before real data enters the system). UC-054 records those rules as undefined. If the owner treats this as a launch blocker, the verdict becomes FAIL on those four items.
- UC-049 alternate flow cites UC-026, which is not in the P0 file. This is a cross-reference to the P1 draft and is not an error.
- UC-057 lets a household user change a booking without manager approval. The 2026-10-31 manager approval decision reads as agent-scoped; confirm this is intended.
- UC-006 excludes guest-checkout self-cancel (OQ-033). "Student cancels booking" is therefore met for account holders. Counted as FOUND because the exclusion is explicit in the UC and the registry item carries no guest qualifier.

## Pipeline Gate
PASS. Pipeline may continue to tech-lead.
