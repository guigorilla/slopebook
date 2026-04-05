# Slopebook — Use Cases P1 / P2

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-04-04
**Pipeline:** pipeline-generate.yaml
**Sources:** overview.md, ux-flows.md, uc-registry.md, decisions.md

---

## P1 — Beta Scope (Q3 2026)

---

## UC-024 — Purchase lesson package

**Persona:** Head of Household
**Goal:** Buy a multi-lesson package at a discounted rate for a household learner
**Preconditions:**
- Household authenticated; lesson packages enabled for tenant
**Main Flow:**
1. Student selects lesson package from catalog (GET /api/v1/lesson-packages — P1 endpoint)
2. System displays package details: totalCount, priceAmountCents, currency, expiresAt
3. Student selects learner and payment method; confirms purchase
4. Payment Service captures charge (Payment.paymentType = package_purchase; Payment.lessonPackageId set)
5. LessonPackage created with remainingCount = totalCount; 1.5% platform fee applied (OQ-027)
**Alternate Flows:**
- Package expires with unused credits: credits forfeited; admin can extend expiresAt manually (OQ-025)
- Package-redeemed booking cancelled: within window reinstates credit; outside window forfeits credit (OQ-039)
**Postconditions:**
- LessonPackage created; Payment.paymentType = package_purchase
**Priority:** P1

---

## UC-025 — Apply package credit at checkout

**Persona:** Head of Household
**Goal:** Redeem a lesson package credit when booking a lesson for the eligible learner
**Preconditions:**
- LessonPackage.remainingCount > 0; not expired; lessonTypeId matches package
**Main Flow:**
1. At checkout, system detects eligible package; offers redemption option
2. Student selects "Use Package Credit"
3. On booking confirmation: PackageRedemption created; LessonPackage.remainingCount decremented by 1
4. No Payment charge for booking (covered by package)
**Alternate Flows:**
- No eligible package: standard payment flow proceeds
**Postconditions:**
- PackageRedemption created; LessonPackage.remainingCount updated
**Priority:** P1

---

## UC-026 — Book group lesson

**Persona:** Head of Household
**Goal:** Book a group lesson for one or more learners with per-learner skill level selection
**Preconditions:**
- GroupSession exists with available capacity; learners meet skill level requirements
**Main Flow:**
1. Student selects group lesson from availability results
2. Student selects learner(s) and confirms per-learner skillLevel
3. For each learner: system creates Booking linked to GroupSession; GroupSession.currentCapacity incremented
4. Payment captured per learner
**Alternate Flows:**
- Group session full: student offered waitlist
- One learner's payment fails: other learners' bookings not affected
**Postconditions:**
- Booking created per learner; GroupSession.currentCapacity updated
**Priority:** P1

---

## UC-027 — Group lesson roster management

**Persona:** Instructor / School Admin
**Goal:** Manage the roster for a group lesson and check in students individually
**Preconditions:**
- GroupSession exists; instructor assigned
**Main Flow:**
1. Instructor views GroupSession roster (all Bookings linked to groupSessionId)
2. Instructor checks in each student individually (PATCH /api/v1/bookings/:id/checkin per learner)
3. Instructor marks session complete (PATCH /api/v1/bookings/:id/complete for each booking or group-level complete)
**Alternate Flows:**
- Student no-show: PATCH /api/v1/bookings/:id/no-show for that learner only
- Admin cancels group session: cascade cancel all enrolled bookings; full refunds (OQ-051)
**Postconditions:**
- All bookings updated; GroupSession.status = completed
**Priority:** P1

---

## UC-028 — Instructor views earnings

**Persona:** Instructor
**Goal:** View daily, weekly, and seasonal earnings summary with breakdown by lesson type
**Preconditions:**
- Instructor authenticated; at least one completed booking exists
**Main Flow:**
1. Instructor opens Earnings Dashboard; system calls GET /api/v1/instructors/:id/earnings
2. System returns earnings summary: total by period, breakdown by lesson type
3. Instructor views seasonal totals and upcoming Workday handoff date
**Alternate Flows:**
- Admin triggers Workday handoff: POST /api/v1/instructors/:id/workday-handoff (school_admin only)
**Postconditions:**
- No state change; read-only summary
**Priority:** P1

---

## UC-029 — Admin revenue and utilization reporting

**Persona:** School Admin
**Goal:** View revenue by instructor/lesson type/period and instructor utilization rates; export to CSV
**Preconditions:**
- Admin authenticated with school_admin role; completed bookings exist
**Main Flow:**
1. Admin opens Reports; selects Revenue or Utilization report type
2. Admin sets date range and optional instructor/lesson type filters
3. System returns report (GET /api/v1/reports/revenue or /utilization)
4. Admin exports to CSV: GET /api/v1/reports/export?type=revenue|utilization&from=&to=
**Alternate Flows:**
- Student analytics view: GET /api/v1/reports/students for repeat rate and avg spend
**Postconditions:**
- No state change; report displayed and optionally downloaded
**Priority:** P1

---

## UC-030 — Operator configures resort portal

**Persona:** Resort Operator
**Goal:** Configure white-label booking widget, currency, language defaults, and payment processor for a resort
**Preconditions:**
- Operator authenticated with operator role; resort tenant created
**Main Flow:**
1. Operator opens Operator Portal; selects resort school
2. Operator configures white-label: custom domain, logo, colors (WhiteLabelConfig)
3. Operator sets currency (USD or CAD) and defaultLanguage (EN or FR)
4. Operator selects payment processor and enters encrypted credentials
5. Operator copies booking widget embed snippet
**Alternate Flows:**
- Processor switch mid-season: in-flight transactions resolved manually (OQ-035)
- Starter tier: Stripe only; Shift4 option not shown (OQ-005)
**Postconditions:**
- Tenant configuration updated; booking widget reflects new branding
**Priority:** P1

---

## UC-031 — Book recurring weekly lesson

**Persona:** Head of Household
**Goal:** Book a recurring weekly lesson for a multi-week program without rebooking each week manually
**Preconditions:**
- Instructor has recurring availability configured (UC-023); lesson type supports recurrence
**Main Flow:**
1. Student selects recurrence option at checkout: weekly for N weeks
2. System creates one Booking per occurrence; each linked to a separate SlotReservation
3. Payment captured per booking or as a single lump charge
4. Confirmation sent with all occurrence dates
**Alternate Flows:**
- Cancel individual occurrence: PATCH /api/v1/bookings/:id/cancel for that booking only; series not affected
- Instructor unavailable on one week: that occurrence not created; student notified
**Postconditions:**
- N Bookings created (one per week); confirmations sent
**Priority:** P1

---

## P2 — v1.0 GA Scope (Q4 2026)

---

## UC-032 — Operator views aggregated analytics

**Persona:** Resort Operator
**Goal:** View consolidated revenue and utilization dashboards across all schools in the resort
**Preconditions:**
- Operator authenticated; multiple schools exist under tenant
**Main Flow:**
1. Operator opens Multi-School Dashboard
2. System returns aggregated revenue and utilization across all schools
3. Operator exports consolidated financial report (GET /api/v1/reports/export with multi-school scope)
**Postconditions:**
- No state change; read-only dashboard
**Priority:** P2

---

## UC-033 — Integrations: webhooks and Google Calendar

**Persona:** Resort Operator / Instructor
**Goal:** Connect Slopebook to external systems via webhooks (PMS, CRM, marketing) and sync instructor schedule to Google Calendar
**Preconditions:**
- Operator authenticated (webhooks); Instructor authenticated (Google Calendar)
**Main Flow (Webhooks):**
1. Operator configures webhook: URL, events, signingSecret (Webhook entity)
2. System delivers events to webhook URL on each trigger
**Main Flow (Google Calendar):**
1. Instructor connects Google account via OAuth (OAuthToken entity — deferred to v1.5 per OQ-021)
2. System syncs confirmed bookings to instructor's Google Calendar
**Postconditions:**
- Webhook registered and active; Calendar synced
**Priority:** P2

---

## UC-034 — Admin views student analytics

**Persona:** School Admin
**Goal:** Review repeat booking rate and average spend per student to identify high-value customers
**Preconditions:**
- Admin authenticated; sufficient booking history exists
**Main Flow:**
1. Admin opens Student Analytics report (GET /api/v1/reports/students)
2. System returns repeat rate and average spend metrics
3. Admin exports: GET /api/v1/reports/export?type=students
**Postconditions:**
- No state change; read-only
**Priority:** P2
