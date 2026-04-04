# Generate Pipeline — PASS

**Run:** 8
**Date:** 2026-04-04
**Pipeline:** pipeline-generate.yaml

---

- Step 1 product-lead: ~7KB — P0: 22 use cases (UC-001 – UC-022), P1: 13 use cases (UC-023 – UC-035), P2: 5 use cases (UC-036 – UC-040)
- Step 2 uc-validator: PASS — 46 registry items checked
- Step 3 tech-lead: ~6KB — 23 requirements (TR-001 – TR-022 + TR-013a), 18 gaps identified
- Step 4 api-design-writer: ~8KB — 17 endpoints added, 3 fixed, 0 deprecated, 29 unchanged
- Step 5 ui-ux-lead: ~6KB — 20 screens (10 customer, 4 instructor, 6 admin)

---

## New Open Questions Surfaced

1. **OQ-043 vs decisions.md tip conflict** (UC-007, TR-007): OQ-043 (2026-03-27) resolved "No tips" and removed `Payment.tipAmountCents` and `Tenant.tipsEnabled`. However, decisions.md entries from 2026-03-26 and 2026-03-29 both include an optional tip in the post-lesson flow. The uc-registry has `[ ] Student submits tip after lesson is marked complete (optional)`. This run followed decisions.md to avoid a uc-validator FAIL. **Resolution required before implementation:** either (a) confirm tips are retained, add schema support, and keep UC-007 step 4–5, or (b) update decisions.md to remove tip references and mark the uc-registry item `[>] DEFERRED`.

2. **Password reset flow absent** (TR gap #18): No forgot-password or reset-password endpoint existed before this run. Added as new endpoints. No UC covers this — add to uc-registry if in scope.

3. **Real-time push mechanism for Admin Schedule View** (TR-014, gap #8): SSE vs WebSocket vs polling still undecided.

4. **PCI DSS compliance scope** (domain risk, unresolved since Run 7): SAQ type not documented.

5. **Auto-completion scheduler interval** (TR-013a): Job frequency not defined. Suggested: every 5–15 minutes. Add to decisions.md.

---

## Recommended Next Step

Run pipeline-review, or resolve open question 1 (tip conflict) first — it affects schema, API design, and UC scope before any implementation begins.
