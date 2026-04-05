PASS — all 46 P0 registry items are covered

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-04-04

---

## Coverage Report

- [FOUND] — Browse available lesson slots by age and skill level — UC-001
- [FOUND] — Filter available instructors by skill level eligibility — UC-001
- [FOUND] — View instructor profile (photo, bio EN/FR, certifications, languages, rating) — UC-002
- [FOUND] — Select date from availability calendar — UC-001
- [FOUND] — Select time slot and instructor from filtered results — UC-001
- [FOUND] — Guest checkout — book without creating an account — UC-003
- [FOUND] — Authenticated checkout — book with existing account — UC-004
- [FOUND] — Household checkout — book for one or more learner sub-profiles — UC-005
- [FOUND] — Card-on-file one-click checkout for returning households — UC-005
- [FOUND] — Post-payment prompt to create account with pre-populated learner profile — UC-003
- [FOUND] — Booking confirmation — email + SMS in user's selected language — UC-020
- [FOUND] — Booking confirmation — .ics calendar attachment — UC-020
- [FOUND] — Charge via Stripe — UC-003, UC-004
- [FOUND] — Charge via Shift4 (Growth+ tenants) — UC-003
- [FOUND] — Refund to original payment method on cancellation — UC-006
- [FOUND] — Store card-on-file token via processor vault — UC-004, UC-005
- [FOUND] — Student submits rating after lesson is marked complete — UC-007
- [FOUND] — Student submits tip after lesson is marked complete (optional) — UC-007
- [FOUND] — Post-lesson flow unlocked when booking status changes to completed — UC-013
- [FOUND] — Post-lesson flow accessible via confirmation email link — UC-007
- [FOUND] — Student cancels booking within cancellation window — UC-006
- [FOUND] — Admin cancels booking with automated refund — UC-006
- [FOUND] — Weather cancellation — bulk cancel with student notification + rebooking link — UC-019
- [FOUND] — Join time-slot waitlist (any available instructor) — UC-008
- [FOUND] — Join instructor-specific waitlist — UC-008
- [FOUND] — Receive waitlist notification when slot opens (2-hour accept window) — UC-008, UC-020
- [FOUND] — Accept waitlist offer within 2-hour window — triggers payment and confirmation — UC-008
- [FOUND] — Waitlist offer expires after 2 hours — slot released — UC-008
- [FOUND] — View today's schedule and upcoming bookings — UC-009
- [FOUND] — View student details for assigned lesson — UC-009
- [FOUND] — Check student in at lesson start — UC-010
- [FOUND] — Mark lesson as complete — UC-013
- [FOUND] — Mark student as no-show — UC-011
- [FOUND] — Add session notes per student per lesson — UC-012
- [FOUND] — Set recurring weekly availability — UC-023
- [FOUND] — Set date-specific availability override — UC-023
- [FOUND] — View all bookings — filterable by instructor, lesson type, date, status — UC-014
- [FOUND] — Assign instructor to booking via drag-and-drop scheduler — UC-014
- [FOUND] — Detect and resolve scheduling conflicts — UC-014
- [FOUND] — Approve new instructor onboarding — UC-015
- [FOUND] — View and manage all active waitlists — UC-016
- [FOUND] — Manually promote waitlisted student — UC-016
- [FOUND] — Configure lesson types, pricing, and capacity — UC-017
- [FOUND] — Bulk create lessons for group programs — UC-017
- [FOUND] — Create household account — UC-018
- [FOUND] — Add learner sub-profile to household — UC-018
- [FOUND] — View all upcoming lessons across all household members — UC-018
- [FOUND] — Modify individual booking without affecting others — UC-006
- [FOUND] — Store and manage card-on-file payment methods — UC-018
- [FOUND] — Send booking confirmation (email + SMS, EN/FR) — UC-020
- [FOUND] — Send cancellation notice with refund confirmation — UC-020
- [FOUND] — Send waitlist notification — UC-020
- [FOUND] — Send 24-hour lesson reminder — UC-020

## Issues

None.

## Decisions Compliance

- UC-003: learnerId = null + guestCheckoutId set; paymentMethodId = null for guest checkout — complies with decisions.md 2026-03-20
- UC-007: tips as separate post-lesson payment; Booking.status = completed guard; 48h window; one tip per booking — complies with decisions.md 2026-04-04 (OQ-061 resolved)
- UC-007: Payment.paymentType = tip; Idempotency-Key required — complies with decisions.md 2026-04-04
- UC-013: auto-completion at endAt + 2h; booking.completed event fires; Booking.autoCompletedAt set by scheduler — complies with decisions.md 2026-03-29
- UC-010: checkedInAt recorded; Booking.status stays confirmed (in_progress removed) — complies with OQ-055
- UC-006: guest cannot self-cancel; ContactSchoolCard shown — complies with OQ-033
- UC-019: full refund on company-initiated weather cancel regardless of policy — complies with OQ-051
- UC-008: 2-hour waitlist acceptance window (default 120 min) — complies with OQ-009

All use cases comply with decisions.md.

## Pipeline Gate

Pipeline may continue to tech-lead.
