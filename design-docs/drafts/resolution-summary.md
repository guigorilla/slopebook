# Slopebook — Blocker Resolution Summary

**Date:** 2026-03-25
**Scope:** Targeted fixes for blockers and critical issues identified in `critique.md` and `synthesis.md`. Full pipeline re-run not performed.

---

## Blockers Resolved

---

### BLOCKER 1 — Soft-hold / slot reservation has no API surface (CRT-H-001 / OQ-011)

**What was wrong:** `data-model-proposed.md` correctly proposed the `SlotReservation` entity, but no API endpoints existed for creating or releasing holds. The booking engine had no contract for the slot reservation flow.

**What was changed:** Created `drafts/api-design-proposed.md` Section 1 — defines `POST /api/v1/slot-reservations` (create hold, returns `reservationId` carried through checkout) and `DELETE /api/v1/slot-reservations/:id` (explicit release). Includes TTL enforcement notes (Redis + DB), conflict detection (409 response), and the requirement that `POST /api/v1/bookings` must carry `reservationId`.

**File changed:** `drafts/api-design-proposed.md` (created)

---

### BLOCKER 2 — No `CancellationPolicy` entity — refund logic has no backing data (CRT-H-002 / OQ-014)

**What was wrong:** `data-model-proposed.md` defined the `CancellationPolicy` entity and its fields, but there were no CRUD endpoints for creating, reading, updating, or deleting policies. Admin and operator UI pages referenced this feature but had no API to call. Additionally, there was no documented platform default for newly onboarded tenants (the OQ-014 gap window).

**What was changed:** Created `drafts/api-design-proposed.md` Section 2 — defines 5 endpoints (`GET`, `POST`, `GET/:id`, `PATCH/:id`, `DELETE/:id` under `/api/v1/admin/cancellation-policies`). The `POST` endpoint notes include a platform-default seeding policy (full refund > 48 h; 50% 24–48 h; no refund < 24 h) to address the OQ-014 gap window for new tenants. The `DELETE` endpoint is guarded to block deletion of in-use policies.

**File changed:** `drafts/api-design-proposed.md` (created)

---

### BLOCKER 3 — Guest checkout structurally impossible (CRT-H-003)

**What was wrong:** Two sub-issues:
1. `tech-requirements.md` TR-DC-005 still declared `Booking.learnerId` as non-nullable, directly contradicting the `data-model-proposed.md` fix (nullable `learnerId` + `guestCheckoutId` with CHECK constraint). Engineers reading `tech-requirements.md` as the source of truth would implement the constraint wrong.
2. `api-design.md` had no definition of the guest checkout booking payload variant (`guest.firstName`, `guest.lastName`, `guest.email` in place of `learnerId`).

**What was changed:**
- Updated TR-DC-005 in `drafts/tech-requirements.md` to reflect nullable `learnerId`, required `guestCheckoutId` when `learnerId IS NULL`, and the CHECK constraint `(learnerId IS NOT NULL OR guestCheckoutId IS NOT NULL)`.
- Created `drafts/api-design-proposed.md` Section 3 — documents both the authenticated and guest checkout variants of the `POST /api/v1/bookings` payload, including validation rules for the mutual exclusivity of `learnerId` vs. `guest` object.

**Files changed:** `drafts/tech-requirements.md`, `drafts/api-design-proposed.md` (created)

---

### BLOCKER 4 — 5 Alpha OQs unresolved, sprint planning blocked (CRT-H-010)

**What was wrong:** OQ-001, OQ-002, OQ-005, OQ-011, OQ-014, and OQ-016 were all unresolved and directly gate Alpha (Q2 2026) engineering scope. These require stakeholder decisions that the design documents cannot make unilaterally.

**What was changed:** No document can resolve a stakeholder decision. The `drafts/open-questions-proposed.md` already correctly flags all six questions as BLOCKER urgency with detailed recommendations and blocking impact analysis — it is marked READY for promotion in `synthesis.md`. No additional draft changes were made for this blocker. The resolution path is: promote `open-questions-proposed.md` to replace `open-questions.md`, then schedule stakeholder sessions for OQ-001, OQ-002, OQ-005, OQ-011, OQ-014, and OQ-016.

**Files changed:** None (no document-level fix possible; action required from stakeholders)

---

### BLOCKER 5 — Notification provider unselected; CASL compliance unresolved (OQ-016)

**What was wrong:** 27 notification templates existed in `asset-list.md` with no provider selection, no CASL opt-in model, and `User` had no `phone` field in the current data model.

**What was changed:** The data model side is already resolved in `data-model-proposed.md` (`User.phone`, `User.phoneVerified`, `User.emailOptOut`, `User.smsOptOut` are all added). `open-questions-proposed.md` already flags OQ-016 as BLOCKER with full impact analysis. No further draft changes needed; the outstanding action is provider selection by stakeholders and email domain warm-up initiation before Alpha go-live.

**Files changed:** None additional (fixes already present in `data-model-proposed.md` and `open-questions-proposed.md`)

---

## Critical Issues (HIGH) Resolved

---

### HIGH — Instructor multi-tenancy: stale TR-DC-010 constraint (CRT-H-004)

**What was wrong:** TR-DC-010 in `tech-requirements.md` still referred to `Instructor.tenantId` and `User.tenantId` consistency as if the single-FK model were in effect — directly contradicting the `InstructorTenant` junction table approach in `data-model-proposed.md`.

**What was changed:** Updated TR-DC-010 in `drafts/tech-requirements.md` to reference `InstructorTenant`, describe the multi-tenant user conversion requirement (`User.tenantId` set to null for multi-resort instructors), and note that all joins through `Instructor.tenantId` must be migrated to join through `InstructorTenant.tenantId`.

**File changed:** `drafts/tech-requirements.md`

---

### HIGH — Missing API endpoints (CRT-H-008)

**What was wrong:** `api-design.md` was missing at least 5 explicit operation groups needed by use cases and technical requirements.

**What was changed:** Created `drafts/api-design-proposed.md` Sections 3–5 — covers booking assign (`PATCH /api/v1/bookings/:id/assign`), reassign (`PATCH /api/v1/bookings/:id/reassign`), bulk-cancel (`POST /api/v1/bookings/bulk-cancel`), processor test (`POST /api/v1/operator/payment-processor/test`), processor switch safeguard (`PATCH /api/v1/operator/payment-processor`), and white-label config CRUD (3 endpoints under `/api/v1/operator/white-label`).

**File changed:** `drafts/api-design-proposed.md` (created)

---

### HIGH — Payment.bookingId FK missing from constraint (CRT-M-005)

**What was wrong:** TR-DC-013 said confirmed bookings must have exactly one captured payment but described no FK to enforce this. `data-model-proposed.md` added `Payment.bookingId FK → Booking` to fix the schema, but `tech-requirements.md` still described the constraint as purely application-enforced without referencing the new FK.

**What was changed:** Updated TR-DC-013 in `drafts/tech-requirements.md` to reference the `Payment.bookingId FK` from `data-model-proposed.md` and specify the UNIQUE partial index pattern for DB-layer enforcement.

**File changed:** `drafts/tech-requirements.md`

---

## Medium Issue Resolved

---

### MEDIUM — `WaitlistEntry.status` enum mismatch (synthesis.md §10)

**What was wrong:** `use-cases.md` UC-014 step 6 described creating a waitlist entry in `"pending"` status. `data-model-proposed.md` defines the canonical enum as `(waiting, notified, accepted, expired)` — `pending` is not a valid value.

**What was changed:** Updated UC-014 step 6 in `drafts/use-cases.md` to use `"waiting"` (the canonical initial state) with a note referencing the `WaitlistEntry.status` enum in `data-model-proposed.md`.

**File changed:** `drafts/use-cases.md`

---

## Stale Tenant-Scoped Table List Fixed

**What was wrong:** TR-DC-011 listed only the original 8 tenant-scoped tables, missing the 9 new tables introduced in `data-model-proposed.md`.

**What was changed:** Updated TR-DC-011 in `drafts/tech-requirements.md` to include all 17 tenant-scoped tables: `Booking`, `Learner`, `Instructor` (via `InstructorTenant`), `LessonType`, `Availability`, `WaitlistEntry`, `Payment`, `AuditLog`, `GuestCheckout`, `GroupSession`, `SlotReservation`, `CancellationPolicy`, `WhiteLabelConfig`, `ApiKey`, `Webhook`, `WorkdayHandoff`.

**File changed:** `drafts/tech-requirements.md`

---

## What Was Not Touched

The following issues require stakeholder decisions or full pipeline work and were deliberately left for the next run:

- **OQ-001, OQ-002, OQ-005** — stakeholder sessions required before Alpha sprint planning.
- **OQ-014, OQ-016** — platform default policy and provider selection are stakeholder decisions; data model and OQ tracking are already up to date.
- **CRT-H-005 / OQ-010** (group lesson capacity schema) — `data-model-proposed.md` has `GroupSession` but OQ-010 is unresolved; next pipeline run should produce use cases and schema for lesson packages simultaneously (CRT-L-003 / OQ-019).
- **CRT-H-006 / OQ-021** (Google Calendar OAuth flow) — `OAuthToken` entity is in `data-model-proposed.md`; OAuth endpoint design deferred to OQ-021 resolution.
- **CRT-L-001 / OQ-022** (KMS selection) — infrastructure decision; no design document can resolve it.
- **Promotion of `data-model-proposed.md`** — blocked on stakeholder sign-off for CRT-H-003, CRT-H-004, OQ-014 per synthesis recommendations.
