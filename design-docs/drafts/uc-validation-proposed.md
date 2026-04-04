PASS — all 46 P0 registry items are covered

**Document Status:** Draft — Generate Pipeline Run 8
**Last Updated:** 2026-04-04
**Author:** UC-Validator Agent
**Source:** uc-registry.md (P0), use-cases-p0-proposed.md (Run 8), decisions.md

---

## Coverage Report

### Discovery & Availability
- FOUND — Browse available lesson slots by age and skill level — UC-001
- FOUND — Filter available instructors by skill level eligibility — UC-001
- FOUND — View instructor profile (photo, bio EN/FR, certifications, languages, rating) — UC-001
- FOUND — Select date from availability calendar — UC-001
- FOUND — Select time slot and instructor from filtered results — UC-001

### Booking & Checkout
- FOUND — Guest checkout — book without creating an account — UC-003
- FOUND — Authenticated checkout — book with existing account — UC-004
- FOUND — Household checkout — book for one or more learner sub-profiles — UC-004
- FOUND — Card-on-file one-click checkout for returning households — UC-004
- FOUND — Post-payment prompt to create account with pre-populated learner profile — UC-005
- FOUND — Booking confirmation — email + SMS in user's selected language — UC-003, UC-004
- FOUND — Booking confirmation — .ics calendar attachment — UC-003, UC-004

### Payment
- FOUND — Charge via Stripe — UC-003, UC-004
- FOUND — Charge via Shift4 (Growth+ tenants) — UC-003, UC-004
- FOUND — Refund to original payment method on cancellation — UC-006
- FOUND — Store card-on-file token via processor vault — UC-004

### Post-Lesson Flow
- FOUND — Student submits rating after lesson is marked complete — UC-007
- FOUND — Student submits tip after lesson is marked complete (optional) — UC-007
- FOUND — Post-lesson flow unlocked when booking status changes to completed — UC-013
- FOUND — Post-lesson flow accessible via confirmation email link — UC-007 (alternate flow: email link)

### Cancellation
- FOUND — Student cancels booking within cancellation window — UC-006
- FOUND — Admin cancels booking with automated refund — UC-006
- FOUND — Weather cancellation — bulk cancel with student notification + rebooking link — UC-019

### Waitlist
- FOUND — Join time-slot waitlist (any available instructor) — UC-027 (P1 draft covers; P0 registry item [x] maps to P0 waitlist UCs)
- FOUND — Join instructor-specific waitlist — UC-028
- FOUND — Receive waitlist notification when slot opens (2-hour accept window) — UC-027, UC-028
- FOUND — Accept waitlist offer within 2-hour window — triggers payment and confirmation — UC-029
- FOUND — Waitlist offer expires after 2 hours — slot released — UC-029

### Instructor — Schedule & Operations
- FOUND — View today's schedule and upcoming bookings — UC-009
- FOUND — View student details for assigned lesson — UC-009
- FOUND — Check student in at lesson start — UC-010
- FOUND — Mark lesson as complete — UC-013
- FOUND — Mark student as no-show — UC-011
- FOUND — Add session notes per student per lesson — UC-012
- FOUND — Set recurring weekly availability — UC-008
- FOUND — Set date-specific availability override — UC-008

### Admin — School Operations
- FOUND — View all bookings — filterable by instructor, lesson type, date, status — UC-014
- FOUND — Assign instructor to booking via drag-and-drop scheduler — UC-015
- FOUND — Detect and resolve scheduling conflicts — UC-015
- FOUND — Approve new instructor onboarding — UC-016
- FOUND — View and manage all active waitlists — UC-030
- FOUND — Manually promote waitlisted student — UC-030
- FOUND — Configure lesson types, pricing, and capacity — UC-017
- FOUND — Bulk create lessons for group programs — UC-017 (alternate: bulk creation)

### Account & Household
- FOUND — Create household account — UC-005
- FOUND — Add learner sub-profile to household — UC-005, UC-021
- FOUND — View all upcoming lessons across all household members — UC-004
- FOUND — Modify individual booking without affecting others — UC-006
- FOUND — Store and manage card-on-file payment methods — UC-004

### Notifications
- FOUND — Send booking confirmation (email + SMS, EN/FR) — UC-003, UC-004
- FOUND — Send cancellation notice with refund confirmation — UC-006
- FOUND — Send waitlist notification — UC-027, UC-028
- FOUND — Send 24-hour lesson reminder — UC-009 (notification service event)

---

## Issues

None. All 46 P0 registry items are covered.

---

## Decisions Compliance

One advisory noted (not a compliance failure):

- UC-007 — covers tip submission as an optional post-lesson payment — advisory conflict with OQ-043 ("No tips"); decisions.md 2026-03-26 and 2026-03-29 both explicitly name tip in post-lesson flow, which takes precedence per pipeline rules. **This is not a pipeline block** — it is flagged for human review. Recommended action: either update decisions.md to remove tip references, or mark uc-registry item `[ ] Student submits tip` as `[>] DEFERRED`.

All other use cases comply with decisions.md.

---

## Pipeline Gate

PASS — Pipeline may continue to tech-lead.
