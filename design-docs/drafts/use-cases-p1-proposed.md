# Slopebook — Use Cases P1 / P2

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-11-01
**Pipeline:** pipeline-generate.yaml
**Sources:** overview.md (2026-10-31), ux-flows.md, open-questions.md, uc-registry.md, decisions.md

**Scope notes**
- All items here belong to Booking Core (Phase 3) or later. Overlay Scope (Phases 1-2) items are P0 and live in the P0 file. The old Beta (Q3 2026) and GA (Q4 2026) dates no longer apply; P1/P2 labels follow the registry sections.
- In overlay deployments the third-party POS owns transactional records, so these flows do not apply there. The 1.5% platform fee applies to Booking Core only.
- Run 9 IDs are unchanged. New IDs from splitting multi-goal cases: UC-059 to UC-069.

---

# P1

## UC-024 — Purchase a lesson package
**Persona:** Head of Household
**Goal:** Buy a multi-lesson package at a discounted rate for a learner.
**Preconditions:**
- Signed in; packages enabled for the tenant

**Main Flow:**
1. Student picks a package (lesson count, price, expiry)
2. Student selects learner and card
3. System captures the charge as a package purchase with the 1.5% fee (OQ-027)
4. System creates the package with remaining credits = total

**Alternate Flows:**
- Unused credits at expiry are forfeited; admin can extend expiry (OQ-025)

**Postconditions:**
- Package created; payment recorded against the package, not a booking

**Priority:** P1

---

## UC-068 — Track package usage per learner
**Persona:** Head of Household
**Goal:** See how many package lessons each learner has used and has left.
**Preconditions:**
- At least one package exists for the household

**Main Flow:**
1. User opens packages in the account dashboard
2. System shows remaining credits, expiry and redemptions per learner sub-profile

**Alternate Flows:**
- Cancelled redeemed booking: inside window the credit is reinstated, outside it is forfeited (OQ-039)

**Postconditions:**
- Read-only

**Priority:** P1
**Open Questions:** Whether a package belongs to one learner or can be shared across the household is not stated.

---

## UC-025 — Apply package credit at checkout
**Persona:** Head of Household
**Goal:** Pay for a lesson with a package credit.
**Preconditions:**
- Eligible package with credits left, not expired, matching lesson type

**Main Flow:**
1. System detects the eligible package at checkout
2. Student chooses "Use package credit"
3. System records a redemption and decrements credits; no card charge

**Alternate Flows:**
- No eligible package: standard payment flow

**Postconditions:**
- Redemption stored; remaining credits updated

**Priority:** P1

---

## UC-026 — Book a group lesson for multiple learners
**Persona:** Head of Household
**Goal:** Book several learners into a customer-selected group session in one transaction, each with their own skill level.
**Preconditions:**
- Group session with capacity (customer-selected mode)

**Main Flow:**
1. Student selects the group lesson
2. Student selects learners and sets each learner's skill level
3. System creates a booking per learner and updates session capacity
4. System captures one payment covering the learners

**Alternate Flows:**
- Session full: waitlist offered
- Skill level outside the session range: learner blocked or moved to another session

**Postconditions:**
- One booking per learner; capacity updated

**Priority:** P1
**Open Questions:** Registry says "one transaction" but Run 9 captured payment per learner with independent failure; which applies?

---

## UC-027 — Group lesson roster and per-student check-in
**Persona:** Instructor / School Admin
**Goal:** Manage a group roster and check in each student individually.
**Preconditions:**
- Group session exists; instructor assigned

**Main Flow:**
1. Instructor views the roster
2. Instructor checks in each student
3. Instructor marks the session complete

**Alternate Flows:**
- No-show recorded for one learner only
- Admin cancels the session: all bookings cancel with full refunds (OQ-051)

**Postconditions:**
- All bookings updated; session completed

**Priority:** P1

---

## UC-028 — Instructor views earnings summary
**Persona:** Instructor
**Goal:** See daily, weekly and seasonal earnings.
**Preconditions:**
- Instructor signed in; completed bookings exist

**Main Flow:**
1. Instructor opens the earnings dashboard
2. System shows totals by day, week and season

**Alternate Flows:**
- Admin triggers the Workday handoff (report-only payroll)

**Postconditions:**
- Read-only

**Priority:** P1

---

## UC-065 — Instructor views earnings by lesson type
**Persona:** Instructor
**Goal:** See earnings broken down by lesson type.
**Preconditions:**
- Completed bookings exist

**Main Flow:**
1. Instructor selects a period
2. System shows earnings per lesson type

**Postconditions:**
- Read-only

**Priority:** P1

---

## UC-029 — Admin revenue report
**Persona:** School Admin
**Goal:** See revenue by instructor, lesson type, period and currency.
**Preconditions:**
- Completed bookings exist

**Main Flow:**
1. Admin picks a date range and filters
2. System shows the revenue report

**Postconditions:**
- Read-only

**Priority:** P1

---

## UC-066 — Instructor utilization report
**Persona:** School Admin
**Goal:** See how much of each instructor's availability is booked.
**Preconditions:**
- Availability and bookings exist

**Main Flow:**
1. Admin picks a period
2. System shows utilization rate per instructor

**Postconditions:**
- Read-only

**Priority:** P1

---

## UC-067 — Export a report to CSV
**Persona:** School Admin
**Goal:** Download any report as CSV.
**Preconditions:**
- A report is displayed

**Main Flow:**
1. Admin selects export
2. System generates a CSV for the current filters

**Postconditions:**
- CSV downloaded

**Priority:** P1

---

## UC-030 — Configure the white-label booking widget
**Persona:** Resort Operator
**Goal:** Set the widget's domain, logo and colors and get the embed code.
**Preconditions:**
- Operator signed in; resort tenant exists

**Main Flow:**
1. Operator sets custom domain, logo and colors
2. System shows the embed snippet

**Postconditions:**
- Widget uses the new branding

**Priority:** P1
**Open Questions:** Registry lists the Operator Portal as P1, but overview.md places it in Phase 4 (Scale); which sequencing governs?

---

## UC-059 — Set resort-wide currency and language defaults
**Persona:** Resort Operator
**Goal:** Set the resort's currency (USD or CAD) and default language (EN or FR).
**Preconditions:**
- Operator signed in

**Main Flow:**
1. Operator selects currency and default language
2. System applies them to widget and communications

**Alternate Flows:**
- Changing currency after bookings exist is blocked (single currency per tenant)

**Postconditions:**
- Defaults saved

**Priority:** P1

---

## UC-060 — Configure payment processor and credentials
**Persona:** Resort Operator
**Goal:** Choose Stripe or Shift4 and store credentials securely.
**Preconditions:**
- Operator signed in; Shift4 needs Growth tier or above

**Main Flow:**
1. Operator selects the processor
2. Operator enters credentials; system encrypts them and never shows them again

**Alternate Flows:**
- Switching mid-season: in-flight transactions resolved manually (OQ-035); stored cards become invalid

**Postconditions:**
- Processor active

**Priority:** P1

---

## UC-061 — View consolidated revenue across schools
**Persona:** Resort Operator
**Goal:** See revenue across all the resort's schools.
**Preconditions:**
- Operator signed in; multiple schools exist

**Main Flow:**
1. Operator opens consolidated revenue
2. System shows revenue per school in the resort currency

**Postconditions:**
- Read-only

**Priority:** P1

---

## UC-031 — Book a recurring weekly lesson
**Persona:** Head of Household
**Goal:** Book a weekly lesson for a multi-week program in one step.
**Preconditions:**
- Instructor has recurring availability; lesson type supports recurrence

**Main Flow:**
1. Student chooses weekly for N weeks at checkout
2. System creates a booking per week
3. System captures payment and sends one confirmation listing all dates

**Alternate Flows:**
- Instructor unavailable one week: that occurrence is skipped and the student told

**Postconditions:**
- N bookings created

**Priority:** P1
**Open Questions:** Payment per occurrence or one lump charge is not decided.

---

## UC-069 — Cancel one occurrence of a recurring series
**Persona:** Head of Household
**Goal:** Cancel one week without affecting the rest.
**Preconditions:**
- Series of bookings exists

**Main Flow:**
1. User cancels one occurrence
2. System applies the cancellation policy to that booking only

**Postconditions:**
- One booking cancelled; others unchanged

**Priority:** P1

---

# P2

## UC-032 — Operator views aggregated dashboards
**Persona:** Resort Operator
**Goal:** See revenue and utilization dashboards across all schools.
**Preconditions:**
- Multiple schools under the operator

**Main Flow:**
1. Operator opens the multi-school dashboard
2. System shows aggregated metrics

**Postconditions:**
- Read-only

**Priority:** P2

---

## UC-062 — Export consolidated financial report
**Persona:** Resort Operator
**Goal:** Export a consolidated report with a multi-currency summary.
**Preconditions:**
- Multiple schools; operator signed in

**Main Flow:**
1. Operator selects period and base currency
2. System generates the report for download

**Postconditions:**
- Report downloaded

**Priority:** P2
**Open Questions:** Tenants are single-currency with no FX conversion; how a "multi-currency summary" is produced is undefined.

---

## UC-033 — Configure webhooks for PMS, CRM and marketing tools
**Persona:** Resort Operator
**Goal:** Send Slopebook events to external systems.
**Preconditions:**
- Operator signed in

**Main Flow:**
1. Operator adds a webhook URL, events and signing secret
2. System delivers signed events on each trigger

**Postconditions:**
- Webhook active

**Priority:** P2

---

## UC-063 — Sync instructor schedule to Google Calendar
**Persona:** Instructor
**Goal:** See confirmed lessons in my Google Calendar.
**Preconditions:**
- Instructor signed in

**Main Flow:**
1. Instructor connects a Google account
2. System syncs confirmed bookings

**Postconditions:**
- Calendar synced

**Priority:** P2
**Open Questions:** Decisions deferred Google Calendar sync to v1.5 (OQ-021) while the registry lists it P2; confirm timing.

---

## UC-034 — Repeat booking rate report
**Persona:** School Admin
**Goal:** See how many students book again.
**Preconditions:**
- Sufficient booking history

**Main Flow:**
1. Admin opens student analytics
2. System shows repeat booking rate

**Postconditions:**
- Read-only

**Priority:** P2

---

## UC-064 — Average spend per student report
**Persona:** School Admin
**Goal:** See average spend per student.
**Preconditions:**
- Sufficient booking history

**Main Flow:**
1. Admin opens student analytics
2. System shows average spend per student

**Postconditions:**
- Read-only

**Priority:** P2
