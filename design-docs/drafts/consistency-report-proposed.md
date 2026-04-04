# Slopebook — Cross-Document Consistency Report

**Document Status:** Draft — Review Pipeline Run 7
**Last Updated:** 2026-03-29
**Author:** Consistency-Checker Agent
**Documents Checked:**
- Current: overview.md, data-model.md (v0.5), api-design.md, ux-flows.md, open-questions.md
- Drafts: use-cases-p0-proposed.md (Run 7), tech-requirements-proposed.md (Run 7), asset-list-proposed.md (Run 7), data-model-proposed.md (v0.6), open-questions-proposed.md (Run 7)

---

## Terminology Conflicts

- "Soft hold" (ux-flows.md §1) vs "SlotReservation" (data-model.md) vs "soft-hold" (tech-requirements-proposed.md TR-002) — recommend: use "slot reservation" in schema references, "soft hold" in UX-facing copy; already consistent within each layer
- "Guest checkout" (use-cases-p0-proposed.md UC-003 title) vs "GuestCheckout" (data-model.md entity) vs "guest-checkout" (various hyphenated uses) — recommend: "GuestCheckout" for schema entity, "guest checkout" (no hyphen) for prose
- "School Admin" (ux-flows.md, persona tables) vs "school_admin" (role enum in data-model.md/api-design.md) — these are presentation vs code-layer; no conflict; no change needed
- "Walk-up customer" (UC-021, OQ-054) — not defined in overview.md or ux-flows.md; only in use cases and OQs — recommend: add to overview.md persona table or ux-flows.md
- "Booking.softReservationId" (data-model.md) vs "SlotReservation.convertedBookingId" (data-model.md) — both FKs exist for the same relationship from opposite directions; bidirectional FK is intentional and consistent

---

## Cross-Document Contradictions

- **api-design.md** vs **use-cases-p0-proposed.md**: Booking request payload lists `"learnerId": "uuid"` with no `guestCheckoutId` field — contradicts UC-003 which requires `guestCheckoutId` to link guest bookings; Booking entity CHECK constraint requires exactly one of learnerId/guestCheckoutId — api-design.md takes lower precedence; data-model-proposed.md takes precedence
- **api-design.md** vs **open-questions.md (OQ-043)**: `POST /api/v1/bookings/:id/review` description reads "Submit tip and rating after lesson completion" — "tip" was removed by OQ-043; api-design.md conflicts with resolved OQ; open-questions.md takes precedence
- **ux-flows.md §3** vs **open-questions.md (OQ-021)**: "Sync with Google Calendar (optional)" listed in Availability Management section — OQ-021 defers this to v1.5; ux-flows.md conflicts with resolved OQ; open-questions.md takes precedence
- **ux-flows.md §3** vs **open-questions.md (OQ-043)**: "Tips (if applicable)" listed in Earnings Dashboard — OQ-043 removes tips entirely; ux-flows.md conflicts with resolved OQ; open-questions.md takes precedence
- **ux-flows.md §5** vs **open-questions.md (OQ-042)**: "Pricing floors and seasonal rate cards" listed in Resort Policies — OQ-042 removes this from v1.0 scope; ux-flows.md conflicts with resolved OQ; open-questions.md takes precedence
- **ux-flows.md §3** vs **open-questions.md (OQ-052)**: "optional digital signature" at Check-In — OQ-052 defers Smartwaiver integration; ux-flows.md conflicts with resolved OQ; open-questions.md takes precedence
- **data-model.md (v0.5)** vs **data-model-proposed.md (v0.6)**: `Payment CHECK bookingId IS NOT NULL` — v0.5 has hard NOT NULL; v0.6 replaces with `(bookingId IS NOT NULL) OR (lessonPackageId IS NOT NULL)`; v0.6 draft takes precedence pending OQ-059 resolution
- **api-design.md** vs **tech-requirements-proposed.md (TR-013)**: `booking.completed` event absent from Notification Service event list in api-design.md — TR-013 requires this event to trigger post-lesson review email; tech-requirements-proposed.md takes precedence

---

## Coverage Gaps

### UC / API gaps

- **UC-003** — `POST /api/v1/guest-checkouts` required by TR-003; absent from api-design.md
- **UC-002** — `POST /api/v1/slot-reservations` required by TR-002; absent from api-design.md
- **UC-010** — `PATCH /api/v1/bookings/:id/checkin` required by TR-010; absent from api-design.md
- **UC-013** — `PATCH /api/v1/bookings/:id/complete` required by TR-013; absent from api-design.md
- **UC-011** — `PATCH /api/v1/bookings/:id/no-show` required by TR-011; absent from api-design.md
- **UC-015** — `PATCH /api/v1/bookings/:id/reassign` required by TR-015; absent from api-design.md
- **UC-019** — `POST /api/v1/bookings/bulk-cancel` required by TR-019; absent from api-design.md
- **UC-021** — `POST /api/v1/users` required by TR-021 (walk-up path, OQ-054); absent from api-design.md

### UC / Screen gaps

No issues found. All 22 P0 UCs either have a dedicated screen in asset-list-proposed.md or are explicitly handled by a shared component (CancellationModal, ContactSchoolCard, BookingCard). UCs with no discrete screen (UC-007 rating via BookingCard, UC-011/012/013 via Today's Schedule) are documented with the covering screen.

### Schema / API gaps

- **api-design.md booking payload** — `guestCheckoutId` field absent; Booking entity requires it for guest checkout path; no schema field to carry guestCheckoutId into booking creation
- **api-design.md** — `POST /api/v1/auth/register` undocumented for extended fields: `dateOfBirth`, `skillLevel`, `preferredLanguage`, `parentalConsentGiven` required by TR-005; current spec does not show these fields
- **data-model-proposed.md** — `Payment.lessonPackageId` references `LessonPackage` entity not yet defined in P0 schema; FK target entity absent (P1 addition)

---

## Roadmap Conflicts

- Google Calendar sync — ux-flows.md §3 — v1.5 per OQ-021 and overview.md roadmap; treated as current in ux-flows.md
- Tips — ux-flows.md §3 — removed from all plans (OQ-043); still present in ux-flows.md Earnings Dashboard
- Pricing floors / seasonal rate cards — ux-flows.md §5 — v1.0 Non-Goals per OQ-042; still present in ux-flows.md Resort Policies
- Smartwaiver digital signature at check-in — ux-flows.md §3 — deferred per OQ-052; still present as "optional digital signature" in Instructor App check-in flow

---

## Overall Score

**AMBER** — api-design.md has 8+ missing endpoints required for P0 delivery and two stale descriptions (tip reference, missing guestCheckoutId in payload); ux-flows.md has 4 stale references contradicting resolved OQs. These contradict current design decisions but are contained to source docs not yet updated. No P0 draft files conflict with each other. All 22 P0 UCs, TRs, and screens are internally consistent across the Run 7 draft set.
