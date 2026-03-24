# Slopebook — Open Questions

Questions requiring stakeholder alignment or further research before feature development begins. Add decisions and outcomes as they are resolved.

---

## Product & Business

### OQ-001 — French translation priority
**Question:** What is the priority order for French translation — booking widget first, or full admin dashboard simultaneously?

**Why it matters:** Determines whether EN/FR can be shipped in phases or must be fully parallel. Affects i18n engineering scope for Alpha.

**Status:** Unresolved
**Decision:**
**Date:**

---

### OQ-002 — Minimum viable Starter tier feature set
**Question:** What is the minimum viable feature set for the Starter tier to drive trial-to-paid conversion?

**Why it matters:** Shapes the Alpha scope and determines what gets built vs. gated behind higher tiers.

**Status:** Unresolved
**Decision:**
**Date:**

---

### OQ-003 — Native iOS app requirement for instructor adoption
**Question:** Is a native iOS app required for instructor adoption, or is a high-quality PWA sufficient for Alpha?

**Why it matters:** Native app is scoped to v2.0 (Q3 2027), but if instructor adoption is at risk without it, the roadmap may need to be revisited.

**Status:** Unresolved
**Decision:**
**Date:**

---

## Payments & Billing

### OQ-004 — Cross-processor card-on-file token vault
**Question:** Should the card-on-file token vault be managed entirely by the processor, or should Slopebook maintain a cross-processor token mapping for accounts that switch processors?

**Why it matters:** Processor-managed tokens are simpler and maintain PCI compliance, but are not portable. If a resort switches from Stripe to Shift4, all stored cards become invalid. A cross-processor mapping layer is complex but would preserve the customer experience.

**Status:** Unresolved
**Decision:**
**Date:**

---

### OQ-005 — Shift4 merchant model
**Question:** For Shift4 integration — does the resort supply their own Shift4 merchant ID, or does Slopebook operate as a Shift4 payment facilitator (PayFac)?

**Why it matters:** PayFac model gives Slopebook more control and faster onboarding but requires underwriting and compliance obligations. Direct merchant model is simpler but puts more setup burden on the resort.

**Status:** Unresolved
**Decision:**
**Date:**

---

### OQ-006 — Instructor payroll handling
**Question:** How should the platform handle instructor payroll — direct deposit integration, or report-only with Workday handoff?

**Why it matters:** Direct deposit adds significant financial and compliance complexity. Report-only with Workday handoff is scoped in the architecture but the boundary needs to be clearly defined.

**Status:** Unresolved
**Decision:**
**Date:**

---

## Accounts & Households

### OQ-007 — Minimum age threshold for learner sub-profiles
**Question:** For household accounts, what is the minimum age threshold for a learner sub-profile vs. an independent account? Does this vary by province/state?

**Why it matters:** Affects data model design (how minors are represented), legal requirements around parental consent, and account creation UX.

**Status:** Unresolved
**Decision:**
**Date:**

---

### OQ-008 — Electronic waiver storage requirements
**Question:** What are the legal requirements around storing student waiver signatures electronically by state/province?

**Why it matters:** Waivers are likely required for ski lessons. Requirements differ across US states and Canadian provinces. This affects the booking flow UX and data storage obligations.

**Status:** Unresolved
**Decision:**
**Date:**

---

## Scheduling & Booking

### OQ-009 — Waitlist notification window configurability
**Question:** Should the 2-hour waitlist accept window be configurable per resort, or fixed platform-wide?

**Why it matters:** A fixed window simplifies the system but some resorts may want a shorter or longer window depending on their cancellation patterns.

**Status:** Unresolved
**Decision:**
**Date:**

---

### OQ-010 — Group lesson capacity limits
**Question:** Should group lesson capacity limits be set at the school level, the lesson type level, or both?

**Why it matters:** Affects the LessonType data model and the capacity check logic in the Booking Engine. If both levels are supported, a conflict resolution rule is needed.

**Status:** Unresolved
**Decision:**
**Date:**

---

## How to Use This File

When a question is resolved, fill in the **Decision** and **Date** fields. Move resolved questions to the `## Resolved` section below so the active list stays focused.

## Resolved

_No resolved questions yet._
