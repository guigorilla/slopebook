# Slopebook — UX Flows

## App Surfaces

| App | Primary User | Port (dev) |
|-----|-------------|------------|
| `customer` | Guest / Head of Household | 3000 |
| `admin` | School Admin | 3001 |
| `instructor` | Instructor (PWA) | 3002 |
| `operator` | Resort Operator | 3003 |

---

## 1. Customer App — Booking Flow

The primary conversion surface. Must be frictionless, mobile-first, and work without account creation.

```
Landing / Booking Widget
  │
  ├── Select lesson type
  │     (private / semi-private / group / half-day / full-day)
  │
  ├── Select skill level
  │     (beginner / intermediate / advanced)
  │     → auto-filters eligible instructors
  │
  ├── Browse instructors (optional)
  │     → profile card: photo, bio (EN/FR), certifications, languages, rating
  │
  ├── Select date
  │     → calendar showing real-time availability
  │
  ├── Select time slot
  │     → shows available instructor(s) for that slot
  │
  ├── Review booking summary
  │     → lesson details, instructor, price in resort currency (USD or CAD)
  │
  ├── Authentication gate
  │     ├── Guest checkout → email only, confirmation sent
  │     └── Sign in / Create account → enables card-on-file, booking history
  │
  ├── Select learner (if household account)
  │     → pick from sub-profiles or add new learner
  │
  ├── Payment
  │     ├── Card-on-file (one-click for returning households)
  │     └── New card → tokenized via processor, optionally saved
  │
  └── Confirmation
        → email + SMS in user's language
        → .ics calendar attachment
        → booking visible in account dashboard
```

**Waitlist path (slot unavailable):**
```
No availability shown
  │
  └── Join waitlist
        ├── Mode: any instructor on this date/time
        └── Mode: specific instructor
              → notified within 2-hour accept window when slot opens
              → one-click accept → triggers payment and confirmation
```

---

## 2. Customer App — Account & Household Management

```
Account Dashboard
  │
  ├── Upcoming lessons (all household members)
  │     → modify or cancel individual bookings
  │
  ├── Household members
  │     → add / edit / remove learner sub-profiles
  │     → skill level per learner
  │
  ├── Payment methods
  │     → add / remove stored cards
  │     → set default card
  │
  ├── Booking history
  │     → past lessons, receipts, session notes (if shared by instructor)
  │
  └── Language preference
        → EN / FR toggle, persists to all communications
```

---

## 3. Instructor App — Schedule & Operations (PWA)

Mobile-first. Instructors primarily use this on their phone on the mountain.

```
Home — Today's Schedule
  │
  ├── Upcoming lesson cards
  │     → student name, skill level, lesson type, meeting point
  │     → tap to expand: full student details, notes from previous sessions
  │
  ├── Check-in
  │     → mark student as checked in
  │     → optional digital signature
  │
  ├── Session notes
  │     → add progress notes per student per session
  │     → notes visible to student and school admin (not public)
  │
  └── No-show
        → mark student as no-show → triggers admin alert

Availability Management
  │
  ├── Weekly availability view
  │     → set recurring availability (e.g. Mon–Fri 9am–4pm)
  │     → add date-specific overrides (e.g. unavailable Dec 26)
  │
  └── Sync with Google Calendar (optional)

Earnings Dashboard
  │
  ├── Daily / weekly / seasonal earnings summary
  ├── Breakdown by lesson type
  └── Tips (if applicable)
```

---

## 4. Admin Dashboard — School Operations

Desktop-first. Full operational control for the school manager.

```
Schedule View
  │
  ├── Visual drag-and-drop scheduler
  │     → assign instructors to bookings
  │     → conflict detection — blocked if double-booking detected
  │
  ├── Day / week / month view
  │
  └── Real-time updates as bookings arrive

Instructor Management
  │
  ├── Staff roster
  │     → certification tracking (PSIA / CSIA) with expiry alerts
  │     → seasonal contract status
  │     → onboarding approval workflow for new coaches
  │
  └── Instructor utilization reports

Booking Management
  │
  ├── All bookings — filterable by instructor, lesson type, date, status
  ├── Cancel booking → configurable refund policy applied automatically
  ├── Weather cancellation → bulk cancel with automated student notifications + rebooking link
  └── Manual override — reassign instructor to a booking

Waitlist Panel
  │
  ├── All active waitlists — filterable by type (time slot vs instructor), date, status
  ├── Manually promote a waitlisted student
  └── View notification history (when 2-hour window opened, whether accepted)

Lesson Configuration
  │
  ├── Create / edit lesson types
  ├── Set pricing and capacity
  └── Bulk lesson creation for group programs (e.g. 6-week junior academy)

Reporting
  │
  ├── Revenue by instructor / lesson type / period / currency
  ├── Utilization rate
  └── Export to CSV
```

---

## 5. Operator Portal — Resort-Level Management

```
Multi-School Dashboard
  │
  └── Aggregated view across all schools in the resort

White-Label Configuration
  │
  ├── Custom domain
  ├── Logo and color scheme
  └── Booking widget embed code (iframe + JS snippet)

Resort Policies
  │
  ├── Currency configuration (USD or CAD)
  ├── Default language (EN or FR)
  ├── Pricing floors and seasonal rate cards
  └── Cancellation policy defaults

Payment Processor Configuration
  │
  ├── Select processor (Stripe or Shift4)
  └── Enter and store credentials (encrypted, never re-displayed)

Integrations
  │
  ├── Webhook configuration (PMS, CRM, marketing automation)
  └── API key management for external consumers

Consolidated Reporting
  │
  ├── Revenue across all schools, per-resort currency
  ├── Multi-resort summary with configurable base currency
  └── Export to CSV / accounting software
```

---

## Language & Currency Behavior

| Surface | Language | Currency |
|---------|----------|----------|
| Booking widget | User-selectable; default from resort config | Resort's configured currency |
| Confirmation emails / SMS | User's selected language | Resort's configured currency |
| Instructor app | User's account preference | Resort's configured currency |
| Admin dashboard | User's account preference | Resort's configured currency |
| Operator portal | User's account preference | Per-resort; summary in base currency |

Language and currency are never mixed within a single transaction. There is no real-time FX conversion — each resort operates in one currency.
