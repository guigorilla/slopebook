# Generate Pipeline Complete

**Run:** 6
**Date:** 2026-03-28
**Pipeline:** pipeline-generate.yaml

---

## Outputs

- **use-cases-p0-proposed.md:** 22 use cases (all P0) — OQ-051/052/053 resolutions applied
- **use-cases-p1-proposed.md:** 18 use cases (P1: 15, P2: 5) — UC-031a updated with full-refund rule (OQ-051)
- **tech-requirements-proposed.md:** 22 requirements (TR-001–TR-022) — Smartwaiver deferred (OQ-052); retry semantics clarified (OQ-053)
- **asset-list-proposed.md:** 19 screens (9 customer, 4 instructor, 6 admin), 10 shared components — Instructor Check-In screen simplified; Smartwaiver iframe removed

---

## OQ Resolutions Applied This Run

3 questions resolved since Run 5:

| OQ | Decision | Primary impact |
|---|---|---|
| OQ-051 | Company-initiated group cancel = full refund always | UC-031a rewritten; TR-031a (P1) |
| OQ-052 | Smartwaiver integration deferred; assume waiver done | UC-010 simplified; TR-003/TR-004/TR-010 updated; Check-In screen simplified; waiverToken null for P0 |
| OQ-053 | Retry DB write only (not payment capture) | TR-003/TR-004 retry semantics clarified; double-capture risk eliminated |

---

## Changes from Run 5

- **UC-010 Check-In:** Smartwaiver embed, 15s timeout, and typed-name fallback removed (OQ-052). P0 check-in is student identity confirmation only.
- **UC-003/UC-004:** Removed waiverToken generation step at booking confirmation. GuestCheckout.waiverToken and Learner.waiverToken remain null in P0.
- **UC-031a:** Cascade cancel now specifies full refund for company-initiated cancellation, overriding snapshot CancellationPolicy (OQ-051).
- **Instructor / Check-In screen:** Reduced states — no loading-waiver, fallback-auto-activated, or token-missing states needed for P0.
- **Gap analysis:** Updated to reflect 3 new gaps closed; 11 gaps remain in api-design.md.

---

## Remaining Active Open Questions

**Zero active open questions.** All OQ-001 through OQ-053 are resolved as of 2026-03-28.

---

## Recommended Next Step

Run **pipeline-review** to check Run 6 drafts for quality, update data-model-proposed.md with any new schema changes, and confirm consistency. The primary items to check: (1) GuestCheckout.waiverToken and Learner.waiverToken handling now that Smartwaiver is deferred — verify the schema still needs these fields or whether they should be conditionally removed; (2) confirm api-design.md gaps (11 identified) are tracked for the next api-design revision; (3) verify ux-flows.md stale references (tips, Google Calendar, pricing floors) are flagged for promotion.
