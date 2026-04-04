# Slopebook — Use Case Registry

This file is the authoritative list of use cases that must exist in the
pipeline output. The uc-validator agent checks every P0 item against
use-cases-p0-proposed.md and blocks the pipeline if any are missing.

The product-lead reads this file and must produce a use case for every
checked item. If a use case cannot be written (due to an unresolved open
question), it must be flagged explicitly — it cannot be silently skipped.

## How to Use This File

- **Add** a new item when a feature decision is made that implies a new user goal
- **Check** an item when it is stable and present in the promoted use-cases file
- **Never remove** an item — mark it DEFERRED with a version note if descoped

Status values:
- `[ ]` — Required, not yet in use-cases file
- `[x]` — Present and stable in promoted use-cases file
- `[~]` — In progress — present in draft but not yet promoted
- `[>]` — DEFERRED to version noted

---

## P0 — Alpha Scope (Q2 2026)

### Discovery & Availability
- [x] Browse available lesson slots by age and skill level
- [x] Filter available instructors by skill level eligibility
- [x] View instructor profile (photo, bio EN/FR, certifications, languages, rating)
- [x] Select date from availability calendar
- [x] Select time slot and instructor from filtered results

### Booking & Checkout
- [x] Guest checkout — book without creating an account
- [x] Authenticated checkout — book with existing account
- [x] Household checkout — book for one or more learner sub-profiles
- [x] Card-on-file one-click checkout for returning households
- [x] Post-payment prompt to create account with pre-populated learner profile
- [x] Booking confirmation — email + SMS in user's selected language
- [x] Booking confirmation — .ics calendar attachment

### Payment
- [x] Charge via Stripe
- [x] Charge via Shift4 (Growth+ tenants)
- [x] Refund to original payment method on cancellation
- [x] Store card-on-file token via processor vault

### Post-Lesson Flow
- [ ] Student submits rating after lesson is marked complete
- [ ] Student submits tip after lesson is marked complete (optional)
- [ ] Post-lesson flow unlocked when booking status changes to completed
- [ ] Post-lesson flow accessible via confirmation email link

### Cancellation
- [x] Student cancels booking within cancellation window
- [x] Admin cancels booking with automated refund
- [x] Weather cancellation — bulk cancel with student notification + rebooking link

### Waitlist
- [x] Join time-slot waitlist (any available instructor)
- [x] Join instructor-specific waitlist
- [x] Receive waitlist notification when slot opens (2-hour accept window)
- [x] Accept waitlist offer within 2-hour window — triggers payment and confirmation
- [x] Waitlist offer expires after 2 hours — slot released

### Instructor — Schedule & Operations
- [x] View today's schedule and upcoming bookings
- [x] View student details for assigned lesson
- [x] Check student in at lesson start
- [x] Mark lesson as complete
- [x] Mark student as no-show
- [x] Add session notes per student per lesson
- [x] Set recurring weekly availability
- [x] Set date-specific availability override

### Admin — School Operations
- [x] View all bookings — filterable by instructor, lesson type, date, status
- [x] Assign instructor to booking via drag-and-drop scheduler
- [x] Detect and resolve scheduling conflicts
- [x] Approve new instructor onboarding
- [x] View and manage all active waitlists
- [x] Manually promote waitlisted student
- [x] Configure lesson types, pricing, and capacity
- [x] Bulk create lessons for group programs

### Account & Household
- [x] Create household account
- [x] Add learner sub-profile to household
- [x] View all upcoming lessons across all household members
- [x] Modify individual booking without affecting others
- [x] Store and manage card-on-file payment methods

### Notifications
- [x] Send booking confirmation (email + SMS, EN/FR)
- [x] Send cancellation notice with refund confirmation
- [x] Send waitlist notification
- [x] Send 24-hour lesson reminder

---

## P1 — Beta Scope (Q3 2026)

### Lesson Packages
- [ ] Purchase multi-lesson package at discounted rate
- [ ] Track package lesson usage per learner sub-profile
- [ ] Apply package credit at checkout

### Group Lessons
- [ ] Book group lesson for multiple learners in one transaction
- [ ] Per-learner skill level selection in group booking
- [ ] Group lesson roster management with per-student check-in

### Earnings & Reporting (Instructor)
- [ ] View daily, weekly, and seasonal earnings summary
- [ ] View earnings breakdown by lesson type

### Reporting (Admin)
- [ ] Revenue report by instructor, lesson type, period, currency
- [ ] Instructor utilization rate report
- [ ] Export any report to CSV

### Operator Portal
- [ ] Configure white-label booking widget (domain, logo, colors)
- [ ] Set resort-wide currency and language defaults
- [ ] Configure payment processor and credentials
- [ ] View consolidated revenue across all schools

### Recurring Lessons
- [ ] Book weekly recurring lesson for multi-week program
- [ ] Cancel individual occurrence without affecting series

---

## P2 — v1.0 GA Scope (Q4 2026)

### Operator Analytics
- [ ] View aggregated dashboards across all schools
- [ ] Export consolidated financial report with multi-currency summary

### Integrations
- [ ] Google Calendar sync for instructor schedule
- [ ] Webhook configuration for PMS, CRM, marketing tools

### Student Analytics (Admin)
- [ ] Repeat booking rate report
- [ ] Average spend per student report

---

## Deferred

- [>] Native iOS instructor app — v2.0
- [>] AI instructor matching — v2.0
- [>] Dynamic pricing — v2.0
- [>] Additional languages beyond EN/FR — v2.0
- [>] Additional currencies beyond USD/CAD — v1.5
- [>] Shift4/Starter tier (platform MID) — v1.5
- [>] Cross-processor card-on-file token mapping — v1.5
- [>] QuickBooks integration — v1.5
- [>] Gift cards and resort credits — v1.5
- [>] Direct deposit instructor payroll — v2.0
- [>] Lift ticket API integration — v2.0
