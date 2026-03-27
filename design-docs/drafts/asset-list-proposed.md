# Slopebook — UI/UX Asset List (Proposed)

**Document Status:** Draft
**Last Updated:** 2026-03-26
**Author:** UI/UX Lead Agent
**Pipeline Run:** Run 3 (2026-03-26)
**Sources:** drafts/use-cases.md, drafts/tech-requirements.md, ux-flows.md

---

## Screens

### Customer App — Booking Widget: Lesson Type Selection
**Route:** `/book` or embedded iframe
**Use Cases Served:** UC-001
**Key Elements:**
- Lesson type tiles (private / semi-private / group / half-day / full-day)
- Skill level selector (beginner / intermediate / advanced)
- Language toggle (EN/FR) — render for all tiers until OQ-030 resolved
- Group tiles hidden for Starter-tier tenants
**States:** loading, no-lessons-available, error
**Responsive:** both (mobile primary)
**i18n Required:** yes

### Customer App — Booking Widget: Instructor Browse
**Route:** `/book/instructors`
**Use Cases Served:** UC-002
**Key Elements:**
- Instructor profile cards (photo, name, bio EN/FR, certifications, languages, star rating)
- "Any instructor" skip CTA
- Bilingual bio fallback label
**States:** loading, empty (no eligible instructors)
**Responsive:** both
**i18n Required:** yes

### Customer App — Booking Widget: Date & Time Selection
**Route:** `/book/schedule`
**Use Cases Served:** UC-003
**Key Elements:**
- Availability calendar (highlighted dates)
- Time slot list with instructor name per slot
- Soft-hold countdown timer (15 min, starts on slot tap)
- Race-condition error toast
**States:** loading, no-availability → waitlist CTA, slot-expired redirect
**Responsive:** both
**i18n Required:** yes — date/time locale formatting

### Customer App — Booking Widget: Review & Auth Gate
**Route:** `/book/review`
**Use Cases Served:** UC-004, UC-005, UC-006
**Key Elements:**
- Booking summary (type, instructor, date/time, skill level, price in USD or CAD)
- Auth gate tabs: Guest Checkout / Sign In / Create Account
- Guest checkout: email field only
- Soft-hold countdown visible throughout
**States:** loading, hold-expired
**Responsive:** both
**i18n Required:** yes — currency formatted per resort

### Customer App — Booking Widget: Learner Selection
**Route:** `/book/learner` (or inline modal)
**Use Cases Served:** UC-012
**Key Elements:**
- Household sub-profile list (name, age, skill level)
- "Add new learner" inline form
- Skill-level override (pre-filled, optional)
- Parental consent checkbox for learners <18 (OQ-032 pending field)
**States:** loading, no-learners empty state, age-blocked error (<5 yrs)
**Responsive:** both
**i18n Required:** yes

### Customer App — Booking Widget: Payment
**Route:** `/book/payment`
**Use Cases Served:** UC-004, UC-006, UC-017, UC-018
**Key Elements:**
- Stored card list (masked number, type, expiry, default badge)
- New card entry form (tokenized; Stripe or Shift4 embed)
- Package credit redemption option (earliest-expiry pre-selected)
- "Save card" checkbox
- Order summary in resort currency
**States:** loading, card-declined, hold-expired, package-expired notice
**Responsive:** both
**i18n Required:** yes — currency (USD/CAD)

### Customer App — Booking Confirmation
**Route:** `/book/confirmation`
**Use Cases Served:** UC-004, UC-005, UC-006, UC-019
**Key Elements:**
- Booking ref, lesson details, instructor, date/time
- Receipt / amount paid
- "Add to calendar" (.ics download link)
- Account creation prompt (guest-checkout path)
**States:** (terminal)
**Responsive:** both
**i18n Required:** yes

### Customer App — Account Dashboard
**Route:** `/account`
**Use Cases Served:** UC-007, UC-008, UC-013
**Key Elements:**
- Upcoming lessons list (all household members, by date)
- Nav links: Booking History, Household, Payment Methods, Language
**States:** loading, empty
**Responsive:** both
**i18n Required:** yes

### Customer App — Booking History
**Route:** `/account/history`
**Use Cases Served:** UC-007
**Key Elements:**
- Past bookings list (date, instructor, type, amount)
- Detail view: full receipt + session notes (hidden if not shared)
**States:** loading, empty
**Responsive:** both
**i18n Required:** yes — currency (USD/CAD)

### Customer App — Cancel Booking
**Route:** `/account/bookings/:id/cancel`
**Use Cases Served:** UC-008
**Key Elements:**
- Booking summary
- Refund amount and policy explanation
- Non-refundable warning with explicit confirm step
**States:** loading, in-policy-window, non-refundable-window
**Responsive:** both
**i18n Required:** yes

### Customer App — Household Members
**Route:** `/account/household`
**Use Cases Served:** UC-011, UC-012
**Key Elements:**
- Learner profile cards (name, DOB, skill level)
- Add / Edit / Remove actions
- Parental consent indicator for minors
- Age-blocked message for under-5
**States:** loading, empty, age-blocked
**Responsive:** both
**i18n Required:** yes

### Customer App — Payment Methods
**Route:** `/account/payment-methods`
**Use Cases Served:** UC-014
**Key Elements:**
- Stored card list (masked, type, expiry, default badge)
- Invalid-card banner (re-entry prompt)
- Add card / Remove / Set default
- "Cannot remove last card" warning if active booking exists
**States:** loading, empty, invalid-card-banner
**Responsive:** both
**i18n Required:** yes

### Customer App — Post-Lesson: Rate & Tip
**Route:** `/lessons/:id/review` (email link target)
**Use Cases Served:** UC-010
**Key Elements:**
- Star rating selector (1–5)
- Tip amount selector (presets + custom) — hidden if `tipsEnabled = false`
- Card-on-file or new card entry for tip charge
- Skip / Submit CTAs
**States:** loading, rating-only mode, tip-declined error
**Responsive:** both
**i18n Required:** yes — currency (USD/CAD)

### Customer App — Waitlist Join
**Route:** `/book/waitlist`
**Use Cases Served:** UC-015
**Key Elements:**
- No-availability message
- Mode selector: Any instructor / Specific instructor
- Email field (unauthenticated)
- Accept window duration notice
**Responsive:** both
**i18n Required:** yes

### Customer App — Waitlist Accept
**Route:** `/waitlist/:token/accept` (email link target)
**Use Cases Served:** UC-016
**Key Elements:**
- Booking summary
- Accept window countdown
- Payment step (card-on-file or entry)
- Expired / Declined terminal screens
**States:** active, expired, declined
**Responsive:** both
**i18n Required:** yes

### Customer App — Packages
**Route:** `/account/packages`
**Use Cases Served:** UC-017, UC-018
**Key Elements:**
- Available packages (name, count, price, validity)
- Active packages (remaining credits, expiry date)
- Purchase flow (payment)
**States:** loading, empty
**Responsive:** both
**i18n Required:** yes — currency (USD/CAD)

---

### Instructor App — Home: Today's Schedule
**Route:** `/` (PWA home)
**Use Cases Served:** UC-021
**Key Elements:**
- Lesson cards (student name, skill level, type, meeting point)
- Expandable detail (full student info, prior session notes)
- Group session card variant (all enrolled students listed)
- Empty state: next scheduled lesson date
**States:** loading, empty
**Responsive:** mobile (primary)
**i18n Required:** yes

### Instructor App — Check-In
**Route:** `/lessons/:id/check-in`
**Use Cases Served:** UC-022
**Key Elements:**
- Waiver status indicator
- Smartwaiver mobile embed
- Typed-name fallback form (mountain offline mode)
- Optional digital signature pad
- Check-in confirm CTA
**States:** loading, waiver-pending, waiver-signed (skip waiver), refused-waiver, offline-fallback
**Responsive:** mobile
**i18n Required:** yes

### Instructor App — No-Show
**Route:** inline modal on lesson card
**Use Cases Served:** UC-023
**Key Elements:**
- Confirmation dialog with policy notice
**States:** confirm, confirmed
**Responsive:** mobile
**i18n Required:** yes

### Instructor App — Session Notes
**Route:** `/lessons/:id/notes`
**Use Cases Served:** UC-024
**Key Elements:**
- Free-form text area
- Share toggle (student-visible vs. internal only)
- Save CTA
**States:** loading, saved
**Responsive:** mobile
**i18n Required:** yes (UI labels; note content stored as-entered)

### Instructor App — Availability Management
**Route:** `/availability`
**Use Cases Served:** UC-025
**Key Elements:**
- Weekly grid with recurring availability blocks
- Date-specific override form
- Conflict warning (booking exists on overridden date)
- Note: Google Calendar sync removed from v1.0 (OQ-021)
**States:** loading, conflict-warning
**Responsive:** both
**i18n Required:** yes

### Instructor App — Earnings Dashboard
**Route:** `/earnings`
**Use Cases Served:** UC-026
**Key Elements:**
- Summary: today / this week / this season
- Breakdown by lesson type
- Tips line item (if `tipsEnabled = true`)
- Custom date range filter
- Per-tenant isolation (no cross-tenant roll-up)
**States:** loading, empty, no-tips mode
**Responsive:** both
**i18n Required:** yes — currency (USD/CAD)

### Instructor App — Onboarding Profile
**Route:** `/profile/setup`
**Use Cases Served:** UC-036
**Key Elements:**
- Photo upload
- Bio fields (EN + FR)
- Certification entry (PSIA/CSIA, level, expiry)
- Languages spoken
- Lesson types qualified to teach
- Submit for review CTA; rejection feedback display
**States:** draft, submitted, rejected
**Responsive:** both
**i18n Required:** yes

---

### Admin App — Schedule View
**Route:** `/schedule`
**Use Cases Served:** UC-027, UC-029, UC-030
**Key Elements:**
- Drag-and-drop scheduler (day / week / month views)
- Unassigned booking highlights
- Conflict detection overlay
- Instructor assignment dropdown
- "Weather Cancellation" bulk action
- Real-time updates
**States:** loading, conflict-blocked, no-bookings
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Admin App — Booking Management
**Route:** `/bookings`
**Use Cases Served:** UC-028, UC-029, UC-032
**Key Elements:**
- Filterable table (instructor, type, date, status)
- Cancel booking + refund policy display
- Custom refund override (reason field for audit log)
- Lesson packages sub-view (search by guest/package ID, extend expiry)
**States:** loading, empty, refund-failed alert
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Admin App — Weather Cancellation
**Route:** modal / `/schedule/weather-cancel`
**Use Cases Served:** UC-029
**Key Elements:**
- Date + scope selector (all lessons or by type)
- Affected count + total refund amount preview
- Confirm CTA; per-booking failure summary
**States:** confirming, processing, partial-failure
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Admin App — Waitlist Panel
**Route:** `/waitlist`
**Use Cases Served:** UC-035
**Key Elements:**
- Filterable table (type, date, status)
- Notification history per entry
- Manual promote CTA; promote-blocked state (no slot available)
**States:** loading, empty, promote-blocked
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Admin App — Instructor Management
**Route:** `/instructors`
**Use Cases Served:** UC-031, UC-036
**Key Elements:**
- Staff roster (name, cert body/level, expiry, contract status)
- Expiry alert badges (60 / 30 / 7 day tiers)
- Expired = blocked indicator on assignment
- Onboarding review queue (approve / reject with feedback)
**States:** loading, empty, expiry-alert, assignment-blocked
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Admin App — Lesson Configuration
**Route:** `/lessons/config`
**Use Cases Served:** UC-033
**Key Elements:**
- Lesson type list (active / draft)
- Create/edit form: name EN+FR, description EN+FR, skill levels, capacity, ratio, duration, price
- Missing-translation warning banner
- Bulk group session creation
**States:** loading, missing-translation-warning
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Admin App — Reporting
**Route:** `/reports`
**Use Cases Served:** UC-034
**Key Elements:**
- Date range / instructor / type filters
- Revenue table (gross, platform fee 1.5%, net, tips column)
- Utilization view (booked vs available instructor-hours)
- CSV export
**States:** loading, empty, export-ready
**Responsive:** desktop
**i18n Required:** yes (Beta) — currency (USD/CAD)

### Admin App — Data Management / Erasure Tool
**Route:** `/settings/data-management`
**Use Cases Served:** UC-037
**Key Elements:**
- Search by email or GuestCheckout ID
- PII record summary (combined view for dual-record guests)
- Upcoming booking warning before erasure
- Confirm CTA; completion receipt
**States:** loading, not-found, active-booking-warning, erased-success
**Responsive:** desktop
**i18n Required:** yes (Beta)

---

### Operator App — Multi-School Dashboard
**Route:** `/dashboard`
**Use Cases Served:** UC-041
**Key Elements:**
- School cards (bookings today, revenue MTD)
- Aggregated resort-level summary
**States:** loading, single-school mode
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Operator App — Resort Policies
**Route:** `/settings/policies`
**Use Cases Served:** UC-038
**Key Elements:**
- Currency selector (USD / CAD) with mid-season change warning
- Default language (EN / FR)
- Pricing floors and seasonal rate card editor
- Cancellation policy defaults
**States:** loading, mid-season-currency-warning
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Operator App — Payment Processor Configuration
**Route:** `/settings/payment`
**Use Cases Served:** UC-039
**Key Elements:**
- Processor selector (Stripe / Shift4)
- Shift4 Starter-tier lock + upgrade prompt
- Credential entry (never re-displayed after save)
- Test transaction status; rotate credentials CTA
**States:** loading, test-failed, credentials-saved, tier-locked
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Operator App — White-Label Configuration
**Route:** `/settings/white-label`
**Use Cases Served:** UC-040
**Key Elements:**
- Custom domain entry + DNS verification status
- Logo upload; color picker (primary + accent)
- Embed code (iframe + JS snippet variants)
- Enterprise-tier lock + upgrade prompt
**States:** loading, dns-pending, dns-verified, tier-locked
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Operator App — Integrations
**Route:** `/settings/integrations`
**Use Cases Served:** UC-042
**Key Elements:**
- API key list (label, created date, revoke CTA)
- Webhook endpoint list (URL, events, status)
- Test ping result; rotate key CTA
- Webhook-disabled alert (after retry exhaustion)
**States:** loading, test-failed, webhook-disabled
**Responsive:** desktop
**i18n Required:** yes (Beta)

### Operator App — Consolidated Reporting
**Route:** `/reports`
**Use Cases Served:** UC-041
**Key Elements:**
- Date range filter
- Per-school revenue breakdown
- Multi-currency totals (separate; no FX)
- CSV / accounting software export
**States:** loading, empty
**Responsive:** desktop
**i18n Required:** yes (Beta) — multiple currencies presented separately

---

## Shared Components

### LanguageToggle
**Used In:** All customer + instructor screens (Alpha); admin + operator (Beta)
**Description:** EN/FR switcher; persists to account or session
**Props/Variants:** `currentLang`, `onChange`, `compact` (icon-only nav variant)
**Notes:** OQ-030 unresolved — render for all tiers until resolved

### CurrencyDisplay
**Used In:** Payment, Earnings, Reporting, Confirmation, Packages
**Description:** Formats amounts in USD or CAD per resort config
**Props/Variants:** `amountCents`, `currency` (`USD`|`CAD`), `showSymbol`
**Notes:** No FX conversion; resort uses one currency throughout

### InstructorCard
**Used In:** Instructor Browse, Schedule View, Booking Management
**Description:** Profile card (photo, name, bilingual bio, certifications, star rating)
**Props/Variants:** `instructor`, `variant` (`browse`|`compact`|`admin`)
**Notes:** Bilingual bio with EN/FR fallback label

### StarRating
**Used In:** Instructor Browse (display), Post-Lesson Review (input)
**Props/Variants:** `value`, `readonly`, `onChange`

### SlotHoldTimer
**Used In:** Date/Time Selection through Payment
**Description:** Countdown from 15 min; triggers expired-slot redirect at 0
**Props/Variants:** `expiresAt`, `onExpired`, `warningThresholdMs` (color shift near end)

### CalendarPicker
**Used In:** Date/Time Selection, Availability Management, Reporting filters
**Description:** Month calendar with per-date availability state
**Props/Variants:** `availableDates`, `selectedDate`, `onChange`, `locale`

### BookingCard
**Used In:** Today's Schedule (instructor), Upcoming Lessons (customer), Schedule View (admin)
**Description:** Lesson summary; expandable for full detail; group session variant
**Props/Variants:** `booking`, `variant` (`instructor`|`customer`|`admin`), `onExpand`

### PaymentMethodSelector
**Used In:** Payment, Post-Lesson Tip, Waitlist Accept
**Description:** Lists stored cards; surfaces invalid-card banner
**Props/Variants:** `methods`, `selectedId`, `onChange`, `showAddNew`

### CardEntryForm
**Used In:** Payment, Post-Lesson Tip (guest-checkout), Waitlist Accept
**Description:** Tokenized card entry (Stripe or Shift4 SDK embed)
**Props/Variants:** `processor`, `onToken`, `showSaveOption`

### EmptyState
**Used In:** All list/dashboard screens
**Props/Variants:** `illustration`, `heading`, `body`, `cta`

### ConfirmationModal
**Used In:** Cancel Booking, No-Show, Weather Cancellation, Erasure Tool
**Description:** Destructive-action confirm dialog
**Props/Variants:** `heading`, `body`, `confirmLabel`, `danger`, `onConfirm`, `onCancel`

### NotificationBanner
**Used In:** Payment Methods (invalid card), Admin Schedule (conflict), Instructor expiry alerts
**Props/Variants:** `variant` (info/warning/error), `message`, `dismissible`

### SkillLevelBadge
**Used In:** Instructor Browse, Today's Schedule, Booking Cards, Household Profiles
**Props/Variants:** `level` (beginner/intermediate/advanced), `size`

### WaiverEmbed
**Used In:** Instructor App — Check-In
**Description:** Smartwaiver mobile embed + typed-name offline fallback
**Props/Variants:** `waiverStatus`, `onComplete`, `offlineMode`

---

## Design Tokens Needed

- `--color-warning-expiry` — certification / package expiry alert (amber)
- `--color-no-show` — no-show status indicator
- `--color-weather-cancel` — weather cancellation badge
- `--color-tier-locked` — locked / upgrade-required state
- `--color-instructor-surface` — PWA surface distinct from customer app
- `--font-lh-bilingual` — relaxed line-height for FR text (longer words)
- `--countdown-warning` — color shift when <2 min remain on soft hold
- `--touch-target-mountain` — larger touch targets for instructor app (gloved use)

---

## Flags: Flows Missing a Screen Definition

- ⚠️ **UC-036 Instructor self-registration** — ux-flows.md has no entry point for new-instructor registration or invite-link landing. Need a `/register` or `/invite/:token` screen.
- ⚠️ **UC-016 Waitlist token expiry** — expired-token landing screen required for `/waitlist/:token/accept` when TTL has passed.
- ⚠️ **UC-022 Offline/mountain mode** — ux-flows.md does not address PWA offline state. WaiverEmbed fallback and general offline shell need a design pass before Alpha.
- ⚠️ **UC-045 Processor-agnostic error copy** — payment error messages must be written in EN + FR before Alpha (no raw processor codes exposed to users).
- ℹ️ **UC-009 Language Preference** — no dedicated screen needed; handled as a section within Account Dashboard.

---

## Asset Checklist

**Screens**
- [ ] Customer app: 16 screens × 2 (mobile + desktop) = 32 layouts (Alpha)
- [ ] Instructor app (PWA): 8 screens × mobile + 3 desktop variants = ~11 layouts (Alpha)
- [ ] Admin app: 10 screens × desktop = 10 layouts (Beta)
- [ ] Operator app: 7 screens × desktop = 7 layouts (v1.0 GA)

**Shared Components**
- [ ] 14 components (see list above)

**Icons**
- [ ] Lesson type × 5 (private, semi-private, group, half-day, full-day)
- [ ] Skill level × 3 (beginner, intermediate, advanced)
- [ ] Certification badges × 2 (PSIA, CSIA)
- [ ] Booking status × 6 (confirmed, in-progress, completed, cancelled, no-show, weather)
- [ ] Currency indicators × 2 (USD, CAD)

**Illustrations / Empty States**
- [ ] No upcoming lessons (customer)
- [ ] No bookings today (instructor)
- [ ] No results (admin lists)
- [ ] Waitlist confirmation
- [ ] Post-lesson thank-you

**Email Templates (EN + FR = 2 per type)**
- [ ] Booking confirmation (with .ics) × 2
- [ ] Booking cancellation (with refund details) × 2
- [ ] Weather cancellation (with rebooking link) × 2
- [ ] Waitlist notification (accept/decline links) × 2
- [ ] Post-lesson review prompt (tip + rating) × 2
- [ ] Package purchase confirmation × 2
- [ ] Package expiry extension notification × 2
- [ ] Instructor assignment notification × 2
- [ ] Instructor reassignment notification × 2
- [ ] Certification expiry alert (admin) × 2
- [ ] Instructor onboarding approval / rejection × 2
- [ ] Right-to-erasure confirmation × 2

**SMS Templates (EN + FR = 2 per type)**
- [ ] Booking confirmation × 2
- [ ] Booking cancellation × 2
- [ ] Waitlist notification × 2
- [ ] Post-lesson review prompt × 2

**Totals**
- Email templates: 24 files (12 types × EN + FR)
- SMS templates: 8 files (4 types × EN + FR)
