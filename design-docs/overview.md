# Slopebook — Product Overview

**Status:** Merged product definition (Slopebook + SkiMatch), overlay-first. Adopted 2026-10-31.
**Authority:** Human-maintained source document. `decisions.md` takes precedence where the two differ.

## What It Is

Slopebook is the intelligent operating layer for ski schools. It sits above a school's existing POS, learns what each student wants and what each instructor does well, and tells the manager what needs attention and what to do about it.

Every recommendation is explainable, and every change to a school's schedule requires manager approval.

Slopebook starts as an overlay on a school's existing system. A native booking core, including payments, follows later for schools that have no adequate system. Both run on one domain model behind one adapter interface, so the intelligence does not depend on who holds the reservation.

The core question: **What needs my attention, and what should I do?**

## Product Modules

| Module | Audience | Purpose | Origin |
|---|---|---|---|
| **Manager Console** | School Admin | Daily issues, resolution plans, schedule, waitlist, pros, students, approval and audit | SkiMatch prototype |
| **SkiMatch** | Guest, Head of Household | Conversational booking and instructor matching | SkiMatch prototype |
| **Learning Loop** | Guest, Instructor | Student and instructor post-lesson interviews, updated profiles, next-lesson recommendations | SkiMatch prototype |
| **Instructor App** | Instructor | Schedule, check-in, session notes, interviews | Slopebook specs |
| **Operator Portal** | Resort Operator | Multi-school reporting and policy | Slopebook specs |
| **Booking Core** | All | Native reservations, payments, households, notifications | Slopebook specs |

## How It Fits Together

```text
EXPERIENCE
  SkiMatch | Instructor App | Manager Console | Operator Portal
                              |
OPERATING MODEL
  Profiles, intent, compatibility, groups, assignments, availability,
  waitlists, issues, plans, outcomes, observations
                              |
ORCHESTRATION
  Deterministic constraints -> policy -> manager approval -> execution -> verification
                              |
ADAPTER (POSAdapter)
  Import adapter   |   Vendor POS adapters   |   Slopebook Booking Core
  (read-only)          (read, then write)       (native system of record)
```

**Ownership rule.** With a third-party POS, the POS owns transactional records: reservations, products, payments, customers, employees and schedules. Slopebook owns intelligence: rich profiles, intent, compatibility, plans, outcomes and audit. `POSReference` maps between them. Booking Core is the same contract with Slopebook on both sides.

**Execution rule.** The agent explains and recommends. It never writes to a school's system directly. Constraints and policy are deterministic, and all writes go through the adapter and are verified afterward.

## Target Market

- **Primary: mid-size and large ski schools with an existing POS.** They have enough staff, students and daily change for matching and operations intelligence to matter. Roughly 15–80 instructors.
- **Secondary: resort operators** overseeing several schools.
- **Later: independent instructors and small schools.** They need Booking Core, and one instructor has nothing to match. This segment waits for Phase 3.

## Key Differentiators

- Captures student intent in the customer's own words and keeps that language alongside the structured profile
- Explainable matching: hard constraints, then soft compatibility, with visible fit and potential mismatches
- Resolution plans for real operating problems such as absences, group imbalance and instructor overload, with approval and audit
- Learning loop from both the student's and the instructor's view of each lesson
- Works beside an existing POS rather than demanding a replacement
- North American focus: English and French, USD and CAD
- Household model: one adult manages reservations for family members, including minors

## User Personas

| Role | Description |
|------|-------------|
| **Guest (Student)** | Age 20–55. Books lessons 1–5x per season. Primarily mobile. May book for themselves or as part of a household. |
| **Head of Household** | Adult managing reservations for multiple family members including minors. Needs a unified view of upcoming lessons. |
| **Instructor** | Certified ski instructor, may work one resort or freelance across multiple. Needs a real-time schedule, check-in tools and a quick post-lesson interview. Primarily mobile. |
| **School Admin** | Operations manager at a ski school. Manages 5–80 instructors. Primary buyer and daily user of the Manager Console. Primarily desktop. |
| **Resort Operator** | GM or Director of Ski Operations. Oversees one or more ski schools. Needs aggregated dashboards and resort-wide policy controls. |

## Merged Domain Model

Slopebook's model is the base. SkiMatch's concepts extend it.

| Concept | Merged approach |
|---|---|
| **Learner / Student** | Keep `Learner` and `Household`. Add a separate `LearnerProfile` for goals, terrain, confidence and learning preferences, each storing structured values plus the original customer wording. |
| **Skill level** | Adopt SkiMatch's six levels: first_timer, beginner, advanced_beginner, intermediate, advanced, expert. Record the source: customer, inferred, instructor or unresolved. Map the current three-level enum during migration. |
| **Instructor** | Keep `Instructor` and `InstructorTenant`. Add `InstructorProfile` for specialties, terrain, teaching style, communication style and the learned profile. |
| **Post-lesson** | Keep rating and tip. Add `StudentLessonAssessment` and `InstructorLessonAssessment`. Rating alone cannot drive the learning loop. |
| **Groups** | Support both modes per lesson type: *customer-selected session* (Slopebook `GroupSession`) and *school-composed placement* (SkiMatch `GroupPlacementRequest`). |
| **Waitlist** | Keep Slopebook's dual-mode waitlist and 2-hour accept window. Add SkiMatch's fit-based ranking. An offer never confirms a reservation or takes payment by itself. |
| **Operations** | Add `OperationalIssue`, `ResolutionPlan`, `ProposedAction`, `ActionValidation`, `ActionOutcome`, `OperationalObservation` and `ManagerDecision`. |
| **External records** | Add `POSReference` to link operating objects to transactional identifiers. |

## Privacy and AI Boundaries

Conversations, inferred profiles and instructor observations are new personal data, frequently about children. The existing erasure decisions do not cover them. These rules apply before any real customer data enters the system:

- Each new data type gets a defined retention period and erasure behavior.
- Original customer wording counts as personal data.
- Data for minors is collected only with parental consent, and the booking conversation is held with the adult.
- Model providers are used under no-training and no-retention terms where available. The current booking integration sets `store: false`.
- Scores and confidence values shown to managers are labeled as estimates until measured against outcomes.
- Instructor learned profiles are coaching and assignment inputs, not performance evaluations. Any use in employment decisions requires separate legal review.

Lift tickets, equipment rental and dynamic pricing remain out of scope.

## Phases

Timing replaces the previous roadmap, whose Alpha (Q2 2026), Beta (Q3 2026) and GA (Q4 2026) dates no longer apply.

| Phase | Goal | Deliverables | Exit criterion |
|---|---|---|---|
| **0. Foundation** | One codebase | SkiMatch logic and tests moved into this monorepo; merged design docs; agent pipeline operating | Existing SkiMatch tests pass in the monorepo |
| **1. Shadow pilot** | Prove the value on real operations | Read-only schedule import, Manager Console, recommendations compared with what the manager actually did | One school confirms recommendations are useful on real days |
| **2. Live overlay** | Become part of the daily workflow | Auth and tenancy, SkiMatch intake linked to POS bookings, post-lesson interviews, first vendor POS adapter | Schools act on approved plans; adapter writes verified |
| **3. Booking Core** | Serve schools without a system | Native booking, payments, households and notifications from the existing P0/P1 specs, as a `POSAdapter` implementation | First school running without a third-party POS |
| **4. Scale** | Multi-school and enterprise | Operator Portal, white-label, analytics, compliance certification | To be set |

## Pricing

**Not yet set for the overlay.** The intelligence is aimed at Pro- and Enterprise-sized schools, so it should be priced on the operational value it delivers. Determine pricing from the shadow pilot.

These tiers remain the planning baseline for Booking Core only (Phase 3):

| Tier | Price | Target | Key Limits |
|------|-------|--------|------------|
| Starter | $49 / mo | Independent instructors | 1 instructor, 100 bookings/mo |
| Growth | $249 / mo | Small ski schools | Up to 15 instructors, unlimited bookings |
| Pro | $799 / mo | Mid-size ski schools | Up to 60 instructors, multi-school, analytics |
| Enterprise | Custom | Resorts & large operators | Unlimited instructors, white-label, SLA, SSO |

A flat 1.5% platform fee applies to all Booking Core transactions. It does not apply to overlay deployments, where Slopebook does not process payments.

## Success Metrics

### Overlay
- Recommendation acceptance: share of proposed plans managers approve unchanged
- Time from an issue appearing to its resolution
- Lessons preserved after instructor absences
- Waitlist offers that become confirmed lessons
- Post-lesson interview completion, students and instructors
- Share of action verifications passing after adapter writes
- Repeat booking rate for matched students compared with a baseline

Targets are set after the shadow pilot establishes baselines.

### Booking Core
- Booking completion rate: > 70% of sessions reaching the date picker convert to a confirmed booking
- Booking widget load time: < 2s on 4G (p95)
- Instructor schedule accuracy: < 0.5% double-booking rate
- Support ticket volume: < 2% of bookings generate a support request

### Business
- MoM MRR growth: ≥ 15% in the first 12 months post-launch
- Net Revenue Retention (NRR): ≥ 110% by end of Year 1
- CAC payback period: < 8 months
- Gross margin: ≥ 70% at steady state

### Customer Satisfaction
- Student NPS: ≥ 45
- Admin / operator NPS: ≥ 50
- Monthly active instructor retention: ≥ 85% during active season

## Largest Risks

1. **POS data access.** The overlay depends on getting schedule data out of a school's system, and this has not been tested with a real school. Phase 1 exists to answer it.
2. **Unproven value.** All fit, confidence and improvement figures so far come from seeded demo data.
3. **Sensitive data.** Free-text data about minors raises the stakes for privacy design.
4. **Booking ownership.** If schools keep their existing customer booking path, SkiMatch intake needs a placement that does not replace checkout.

## Agent Development Pipeline

How this product is designed, built, deployed and operated is defined in [agent-pipeline.md](agent-pipeline.md).
