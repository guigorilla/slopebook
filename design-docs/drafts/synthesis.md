# Slopebook — Pipeline Synthesis

**Document Status:** Draft
**Run:** 3 (2026-03-26)
**Author:** Team Lead Agent

---

## What Was Produced This Run

| Draft File | Contents |
|---|---|
| `drafts/use-cases.md` | 45 formal use cases across all 5 personas and 4 app surfaces; all OQ-001–029 reflected; OQ-030/031/032 still unresolved. *(Carried from Run 3 Step 1)* |
| `drafts/tech-requirements.md` | Technical requirements per use case (API changes, data model notes, auth, multi-tenancy, i18n, performance). *(Carried from Run 3 Step 2)* |
| `drafts/asset-list-proposed.md` | 41 screens, 14 shared components, 8 design tokens, 24 email templates, 8 SMS templates; 4 gaps flagged vs ux-flows.md. *(Run 3 Step 3)* |
| `drafts/critique.md` | 11 critical issues, 9 significant gaps, 10 edge cases, 8 unstated assumptions, 8 domain-specific concerns. *(Run 3 Step 4)* |
| `drafts/data-model-proposed.md` | Schema v0.3 — 34 migration steps; adds InstructorRating, LessonPackage family, PackageRedemption, GroupSessionInstructor join table; removes OAuthToken and Payment.groupSessionId; enforces cents-as-integers throughout. *(Run 3 Step 5)* |
| `drafts/open-questions-proposed.md` | 14 new OQs (OQ-033–046); 3 stale flags (OQ-030/031/032); 0 resolved. *(Run 3 Step 6)* |
| `drafts/consistency-report.md` | AMBER — 5 terminology conflicts, 7 cross-doc contradictions, 11 UC/API misalignments, 5 UC/screen gaps, 8 data-model/API misalignments, 3 roadmap conflicts. *(Run 3 Step 7)* |

---

## Top Issues to Resolve

Ranked by severity. Items 1–4 are blockers; do not start development until resolved.

1. **OQ-043 / CR-010 / CON-006 — Contradiction in OQ-023 resolution text** *(BLOCKER)*
   The OQ-023 decision simultaneously states that `tipAmountCents` was *removed* from the booking payload AND lists it in the payload spec. Engineers will implement it in two conflicting places. Must be corrected before any payment work begins.

2. **CON-001 — Tip endpoint URL mismatch** *(BLOCKER for payment integration)*
   UC-010 calls the tip endpoint `POST /api/v1/bookings/:id/tip`; api-design.md and tech-requirements.md both say `POST /api/v1/bookings/:id/review`. These must be unified before implementation.

3. **11 missing API endpoints including 3 P0s** *(BLOCKER for Alpha)*
   `api-design.md` has no endpoints for: soft-hold slot reservation (UC-003), instructor check-in (UC-022), certification management (UC-031), post-lesson review, package redemption, group session management, waitlist promotion, erasure tool, or instructor onboarding. The API design document needs a major expansion pass before development begins.

4. **OQ-032 reclassification — Parental consent schema** *(BLOCKER risk for Alpha)*
   Alpha schools may enrol minors from Q2 2026. `Learner` has no `parentalConsentGiven`/`parentalConsentAt` fields. The critique recommends escalating from LOW to BLOCKER. Needs legal sign-off before Alpha launch.

5. **OQ-041 / SC-C — Cross-tenant instructor double-booking undetectable**
   The booking engine is tenant-scoped; freelance instructors working at multiple resorts can be double-booked with no system-level check. Requires product decision on whether cross-tenant availability is in scope.

6. **OQ-039 — Package-redeemed booking cancellation**
   No use case or tech requirement defines what happens to a credit when a package-redeemed booking is cancelled. Credit reinstated or forfeited? Must be decided before Beta package work.

7. **OQ-036 — Learner deletion with active bookings**
   Deleting a learner sub-profile that has upcoming bookings has no defined behaviour (block, cascade cancel, convert to guest). Missing from every document.

8. **OQ-035 — Processor switch mid-season**
   Refunds for bookings charged on the old processor after a switch have no defined path. HMAC webhook secrets also become invalid on switch. Must be addressed before any school goes live.

9. **CON-002 — `cancelled_weather` status not in Booking enum**
   UC-029 uses this status value; it does not exist in the data model v0.2 or v0.3. Added as additive migration in v0.3 but must be confirmed.

10. **OQ-030 / OQ-031 / OQ-032 — Three stale unresolved questions entering third cycle**
    All three are blocking Beta features (FR on Starter tier, school-block billing, parental consent schema). Stakeholder decisions overdue.

---

## Recommended Promotions

- `drafts/use-cases.md` → **READY** (no open issues; reflects all resolved OQs)
- `drafts/tech-requirements.md` → **READY** (solid; api-design.md expansion needed separately)
- `drafts/asset-list-proposed.md` → **NEEDS REVIEW** (4 flagged UX gaps; instructor registration entry point undefined)
- `drafts/data-model-proposed.md` → **NEEDS REVIEW** (migration M-v03-015 requires maintenance window; parental consent fields pending OQ-032)
- `drafts/open-questions-proposed.md` → **NEEDS REVIEW** (OQ-043 contradiction must be corrected by author before this replaces open-questions.md)

Do not promote `drafts/open-questions-proposed.md` until OQ-043 is resolved — it would propagate the tipAmountCents contradiction into the canonical document.

---

## New Open Questions This Run

OQ-033 through OQ-046 (14 new). Highest-urgency:
- **OQ-033** — Guest-checkout self-cancellation path undefined
- **OQ-034** — Waitlist position field and exhaustion notification undefined
- **OQ-035** — Processor switch mid-season refund and webhook path
- **OQ-036** — Learner deletion with active bookings
- **OQ-039** — Package-redeemed booking cancellation credit policy
- **OQ-040** — Smartwaiver full API outage fallback (beyond wireless loss)
- **OQ-041** — Cross-tenant instructor double-booking detection
- **OQ-043** — OQ-023 tipAmountCents contradiction *(resolve first)*
- **OQ-046** — PCI-DSS SAQ-A-EP posture on ProcessorTokenId

---

## Suggested Focus for Next Run

1. **Expand `api-design.md`** — 11 endpoints are missing; 3 are P0 blockers. The tech-lead agent should run a dedicated pass with `api-design.md` as its primary output.
2. **Resolve OQ-043** — Correct the OQ-023 resolution text before any other payment-related work.
3. **Escalate OQ-030/031/032** — All three are entering their third cycle. Flag for stakeholder meeting before Run 4.
4. **Define missing UX flows** — Instructor self-registration entry point, expired waitlist token screen, and PWA offline mode need design passes before the asset list can be promoted.
5. **Legal review** — Typed-name waiver fallback legal equivalence (UC-022), CASL classification of weather-cancellation emails (OQ-044), and Smartwaiver erasure compliance (OQ-045) all require legal input before Beta.
