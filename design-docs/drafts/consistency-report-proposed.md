# Slopebook — Cross-Document Consistency Report

**Document Status:** Draft — Review Pipeline Run 9
**Last Updated:** 2026-04-04
**Author:** Consistency-Checker Agent
**Sources compared:** overview.md, data-model.md (v0.5), api-design.md, ux-flows.md, open-questions.md, decisions.md; vs. use-cases-p0-proposed.md (Run 8), tech-requirements-proposed.md (Run 8), asset-list-proposed.md (Run 8), data-model-proposed.md (v0.7), api-design-proposed.md (Run 8, post-CR-004 fix), open-questions-proposed.md (Run 9), critique-proposed.md (Run 9)

**Resolved since Run 8:**
- OQ-059 fully resolved — nullable bookingId + lessonPackageId FK on Payment confirmed; data-model-proposed.md v0.7 implementation authoritative
- OQ-061 resolved — tips in scope as optional post-lesson payment; OQ-043 superseded; data-model-proposed.md v0.7 includes unique partial index and paymentType = 'tip'

---

## Terminology Conflicts

- "soft hold" (ux-flows.md) vs "SlotReservation" (data-model.md, api-design-proposed.md) vs "slot reservation" (tech-requirements-proposed.md TR-002) — recommend: **SlotReservation** (entity name); "soft hold" acceptable in UX context only
- "card-on-file" (ux-flows.md §1, overview.md) vs "stored card" (api-design.md GET /api/v1/payment-methods) vs "card-on-file token" (overview.md) — recommend: **card-on-file** in UX; **PaymentMethod** in API/schema context
- "school admin" (overview.md Personas table) vs "School Admin" (use-cases-p0-proposed.md Persona fields) vs "school_admin" (api-design.md Authorization table, data-model.md User.role) — recommend: **School Admin** in prose; **school_admin** in code/schema context; consistent
- "guest" (ux-flows.md §1 "Guest (Student)") vs "Guest / Head of Household" (UC-001–UC-006 Persona fields) vs "guest" role (api-design.md Authorization) — recommend: clarify: **Guest** = unauthenticated or newly registered user; **Head of Household** = authenticated user managing family; **guest** role = JWT role for authenticated non-admin users
- "post-lesson flow" (decisions.md 2026-03-26, 2026-03-29) vs "post-lesson review" (api-design-proposed.md POST /api/v1/bookings/:id/review) vs "rating prompt" (asset-list-proposed.md) — recommend: **post-lesson flow** as canonical umbrella term (covers both rating and tip); **post-lesson review** for the rating-only endpoint
- "walk-up customer" (UC-021, TR-021) vs "walk-in customer" (no instance found) — no conflict; "walk-up" is consistent across Run 8 drafts

---

## Cross-Document Contradictions

### Active contradictions

1. **api-design-proposed.md booking payload vs server-side rule (CR-001 Run 9)**: Booking payload JSON shows `"learnerId": "uuid"` (non-nullable), but server-side rule states exactly one of `learnerId` / `guestCheckoutId` must be non-null. Guest checkout path (UC-003) requires `learnerId = null`. Any client reading this spec will treat `learnerId` as required and reject the guest checkout path at client-side validation. **Fix:** Change to `"learnerId": "uuid | null"` and document `"paymentMethodId": "uuid | null"` similarly (guest checkout uses processor SDK, not a stored PaymentMethod).

2. **api-design-proposed.md POST /api/v1/bookings/:id/tip — no status guard (CR-003 Run 9)**: Endpoint has no documented guard that booking must be in `completed` status, no guard against `cancelled` or `no_show` bookings, and no time window after which tips are no longer accepted. decisions.md 2026-03-29 links tip flow to booking.completed event only. Unbound post-completion acceptance period is a chargeback risk. **Fix:** Document server-side enforcement: Booking.status = completed required; fixed or configurable tip acceptance window (suggest 7 days after Booking.endAt).

3. **ux-flows.md §3 vs decisions.md / open-questions.md OQ-021**: ux-flows.md lists "Sync with Google Calendar (optional)" under Instructor Availability Management; OQ-021 deferred Google Calendar sync to v1.5 — ux-flows.md not updated; stale reference.

4. **ux-flows.md §3 vs open-questions.md OQ-061 / decisions.md 2026-04-04**: ux-flows.md lists "Tips (if applicable)" under Instructor Earnings Dashboard. Tips are now confirmed in scope (OQ-061 resolved) but as a **customer-initiated post-lesson payment flow**, not as an Instructor Earnings Dashboard line item. The ux-flows.md description is misleading — instructors see tip income in earnings but do not initiate tips from their dashboard.

5. **ux-flows.md §3 vs open-questions.md OQ-052**: ux-flows.md §3 check-in step lists "optional digital signature"; OQ-052 deferred Smartwaiver to a later phase — ux-flows.md not updated; stale reference.

### Resolved since Run 8

- data-model.md vs decisions.md 2026-03-29: Payment CHECK `bookingId IS NOT NULL` — **resolved** in data-model-proposed.md v0.6/v0.7 (nullable bookingId, mutual exclusivity constraint)
- OQ-043 tips vs decisions.md tips — **resolved** (OQ-061 closed; tips in scope; data-model-proposed.md v0.7 adds unique partial index)
- OQ-059 PackagePayment vs nullable bookingId — **resolved** (decisions.md 2026-03-29 and 2026-04-04 authoritative; data-model-proposed.md v0.7 implementation confirmed)
- CR-004 duplicate guestCheckoutId — **resolved** (user-fixed in api-design-proposed.md before Run 9)
- CR-002 Run 9 tip uniqueness constraint — **resolved** in data-model-proposed.md v0.7 (unique partial index `(bookingId, paymentType) WHERE paymentType = 'tip'` added)

---

## Coverage Gaps

### UC / API gaps

- **UC-017 bulk create lessons** — UC-017 mentions bulk creation as an alternate flow; no `POST /api/v1/lesson-types/bulk` endpoint exists in api-design-proposed.md or tech-requirements-proposed.md; cannot be implemented from current spec
- **OQ-062 password reset** — two endpoints added (`POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`) with no corresponding UC or TR; spec exists but no requirements document it; OQ-062 unresolved
- **PATCH /api/v1/bookings/:id/reassign** — no request payload or response payload documented; OQ-066 tracks this; endpoint cannot be implemented

### UC / Screen gaps

- **OQ-062 password reset** — no screen in asset-list-proposed.md; PasswordResetToken entity in data-model-proposed.md but no UI defined; gap if password reset is P0 (OQ-062 unresolved)
- **POST /api/v1/users response** — admin walk-up flow (UC-021, TR-021) creates User + Household + Learner atomically; no response payload documented; implementer has no spec for what IDs are returned for subsequent booking call

### Schema / API gaps

- **api-design-proposed.md Notification Service — booking.completed event** — description says "one-click rating link" only; tips are now confirmed in scope; post-lesson email should prompt for both rating (required) and tip (optional); description needs updating
- **api-design-proposed.md PATCH /api/v1/bookings/:id/reassign** — no request or response payload; OQ-066 open
- **Instructor.averageRating update side effect** — data-model-proposed.md relies on "application layer recomputes on InstructorRating insert/update" but no TR or endpoint spec documents this as a side effect of `POST /api/v1/bookings/:id/review`; TR-007 must explicitly list this
- **data-model-proposed.md LessonPackage** — entity added; no `GET /api/v1/lesson-packages` or `POST /api/v1/lesson-packages` endpoint exists in api-design-proposed.md; expected for P1 (UC-024) but FK must be valid for P0 Payment records — no gap blocking P0

---

## Roadmap Conflicts

- **LessonPackage / PackageRedemption entities** — added to data-model-proposed.md (v0.7); overview.md places lesson packages in Beta (Q3 2026 P1); entities correctly marked P1; FK from Payment exists now for Payment.lessonPackageId validity — no conflict
- **PasswordResetToken entity** — added to data-model-proposed.md; no roadmap entry in overview.md; OQ-062 unresolved — needs scope confirmation before data-model is promoted
- **Instructor.averageRating** — added to data-model-proposed.md; not in overview.md roadmap; implied by UC-001 (P0 browsing flow); additive P0 field — no conflict
- **POST /api/v1/auth/forgot-password / reset-password** — not in any roadmap document; added to api-design-proposed.md in Run 8 as gap fill; OQ-062 unresolved

---

## Overall Score

**AMBER** — Two actionable contradictions within the proposed documents remain unresolved: (1) CR-001 Run 9: `learnerId` non-nullable in booking payload despite guest checkout path requiring it to be null — direct spec contradiction that will cause integration failures; (2) CR-003 Run 9: tip endpoint has no booking-status guard or time-window — chargeback risk left unspecified. Three stale references in ux-flows.md (Google Calendar, Tips context, digital signature) persist and will mislead developers. OQ-066 reassign payload remains undocumented. Score would move to GREEN once: CR-001 and CR-003 are fixed in api-design-proposed.md, ux-flows.md stale refs are corrected, and OQ-066 is resolved.
