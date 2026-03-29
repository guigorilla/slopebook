# Slopebook — Cross-Document Consistency Report

**Document Status:** Draft — Run 6
**Last Updated:** 2026-03-28
**Author:** Consistency-Checker Agent
**Pipeline Run:** Run 6 (2026-03-28)
**Documents Reviewed:** overview.md, data-model.md (v0.3 source), api-design.md, ux-flows.md, open-questions.md (source), drafts/use-cases-p0-proposed.md, drafts/use-cases-p1-proposed.md, drafts/tech-requirements-proposed.md, drafts/asset-list-proposed.md, drafts/data-model-proposed.md (v0.5), drafts/open-questions-proposed.md

---

## Terminology Conflicts

- `sessionToken` (api-design.md §Booking Engine payload) vs `SlotReservation.sessionToken` (data-model-proposed.md) vs `reservationId` (tech-requirements-proposed.md TR-003 idempotency note) — three names for the same concept; recommend: `reservationToken` as payload field name, `SlotReservation.sessionToken` as schema field; update api-design.md payload
- `slot hold` (ux-flows.md §1) vs `soft hold` (ux-flows.md §1 comment) vs `SlotReservation` (schema) vs `slot reservation` (TR-002) — recommend: `SlotReservation` (entity), `slot hold` (user-facing copy)
- `guest checkout` (ux-flows.md) vs `GuestCheckout` (schema) vs `guest-checkout` (use-cases-p0-proposed.md) — consistent pattern: entity = `GuestCheckout`, adjective = `guest-checkout`, noun phrase = `guest checkout`
- `in_progress` (Booking.status enum) vs no user-facing name defined — recommend: define display label `In Progress` and trigger mechanism before Alpha (OQ-055)

---

## Cross-Document Contradictions

- [design-docs/data-model.md §Payment] vs [data-model-proposed.md v0.5 §Payment]: source still has `groupSessionId` and old CHECK constraint; draft removes both — draft takes precedence; source must be promoted
- [design-docs/data-model.md §PaymentMethod] vs [data-model-proposed.md v0.5 §PaymentMethod]: source has `processorTokenId string` without encryption; draft has `processorTokenId string, encrypted` — draft takes precedence (OQ-046); source is a PCI compliance risk until promoted
- [design-docs/data-model.md §Learner] vs [data-model-proposed.md v0.5 §Learner]: source has `parentalConsentGiven boolean, nullable -- reserved; OQ-032 unresolved; dormant`; draft activates these fields — draft takes precedence; source is stale
- [overview.md §Release Roadmap v1.0 GA] vs [open-questions-proposed.md OQ-042]: "Pricing floors and seasonal rate cards" listed as v1.0 deliverable conflicts with "Out of scope for v1.0 GA" — OQ-042 takes precedence; overview.md must be corrected
- [ux-flows.md §3 Instructor App] vs [open-questions-proposed.md OQ-043]: "Tips (if applicable)" in Earnings Dashboard conflicts with no-tips decision — OQ-043 takes precedence; ux-flows.md is stale
- [ux-flows.md §3 Instructor App] vs [open-questions-proposed.md OQ-021]: "Sync with Google Calendar (optional)" conflicts with "Deferred to v1.5" — OQ-021 takes precedence; ux-flows.md is stale
- [use-cases-p0-proposed.md UC-003 step 8] vs [tech-requirements-proposed.md TR-003]: UC-003 step 8 creates GuestCheckout after payment capture; TR-003 correctly orders POST /api/v1/guest-checkouts before payment — TR-003 takes precedence; UC-003 steps must be reordered (CR-001)
- [api-design.md §Notification Service] vs [use-cases-p0-proposed.md UC-013]: UC-013 emits `booking.completed` event; api-design.md event list does not include this event — UC-013 / TR-013 takes precedence; api-design.md is incomplete
- [design-docs/open-questions.md header] vs [content]: header reads "Draft — Run 4 / 2026-03-27" but content includes OQ-051/052/053 resolved 2026-03-28 — content is authoritative; header metadata stale

---

## Coverage Gaps

### UC / API gaps

- UC-021 (admin manual booking) — no defined path for walk-up customers: neither `POST /api/v1/guest-checkouts` (admin-created) nor inline `adminGuestDetails` on `POST /api/v1/bookings` is specified; OQ-054
- UC-010 (check-in) — `PATCH /api/v1/bookings/:id/checkin` absent from api-design.md; referenced in TR-010
- UC-013 (complete) — `booking.completed` notification event absent from api-design.md §Notification Service
- UC-018 (cancellation policy CRUD) — `POST /api/v1/cancellation-policies`, `PATCH /api/v1/cancellation-policies/:id`, `PATCH /api/v1/cancellation-policies/:id/default` all absent from api-design.md
- UC-015 (reassign booking) — no `PATCH /api/v1/bookings/:id/reassign` or generic PATCH documented in api-design.md
- No UC defined for instructor-initiated cancellation; OQ-058
- Slot reservation endpoint `POST /api/v1/slot-reservations` (TR-002) absent from api-design.md
- Bulk cancel endpoint `POST /api/v1/bookings/bulk-cancel` (TR-019) absent from api-design.md

### UC / Screen gaps

- UC-027–030 (waitlist join/accept) — no customer-facing waitlist screen in asset-list-proposed.md; ux-flows.md §1 shows a waitlist path node with no corresponding screen
- UC-031a (group cascade cancel) — no admin screen for group-session-level cancel CTA in asset-list-proposed.md; Admin / Booking Management covers per-booking cancel only
- Instructor-initiated cancel (unresolved OQ-058) — no screen defined; the instructor Check-In / Today's Schedule screens have no cancel CTA

### Schema / API gaps

- `GuestCheckout.preferredLanguage` — not collected in UC-003 guest checkout flow; v0.5 adds DEFAULT 'en' but tenant defaultLanguage may be 'fr'; OQ-057
- `Payment.status = void_pending` — added in v0.5 (CR-004); no corresponding handling documented in api-design.md §Payment Service
- `WaitlistEntry.position` — added in v0.4/v0.5; no `PATCH /api/v1/waitlist/:id/position` endpoint defined in api-design.md for admin reorder
- `Booking.status = in_progress` trigger — undocumented in any API endpoint; OQ-055

---

## Roadmap Conflicts

- "Pricing floors and seasonal rate cards" — overview.md §v1.0 GA — removed from scope by OQ-042; source document not yet updated
- "Sync with Google Calendar" — ux-flows.md §3 Instructor App — deferred to v1.5 per OQ-021; ux-flows.md not yet updated
- "Tips (if applicable)" — ux-flows.md §3 Instructor App — removed entirely per OQ-043; no roadmap phase
- "Lesson packages" (UC-024, P1 Beta) — consistent with overview.md §Beta; no conflict
- "White-label widget" (UC-036, P2 GA) — consistent with overview.md §v1.0 GA; no conflict

---

## Overall Score

**AMBER** — Run 6 drafts are internally consistent and apply all 53 OQ resolutions correctly. Three source documents (data-model.md, ux-flows.md, overview.md) remain stale and must be promoted before development begins. Three new BLOCKERs (OQ-054, OQ-055, OQ-056) and two HIGH questions (OQ-057, OQ-058) require resolution; the walk-up booking path (OQ-054) and void failure compensation (OQ-056) are Alpha day-one risks.
