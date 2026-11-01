# Slopebook — Open Questions

**Document Status:** Draft — Review Pipeline Run 10
**Last Updated:** 2026-11-01
**Active open questions:** 76 (OQ-062 to OQ-065 carried; OQ-067 to OQ-138 new)
**Total resolved:** 62 (OQ-001 to OQ-061 and OQ-066). The Run 9 header said 62 but the table held 61 entries; the count is now correct.
**Size note:** the 15KB target is waived for this run. Run 10 produced about 130 informal questions that had to be consolidated; completeness over size.

---

## This Run
- Added: 72 new questions (OQ-067 to OQ-138), consolidated from Q10.1 to Q10.69, UI-1 to UI-16, the Open Questions fields in use-cases-p0/p1-proposed.md, and critique-proposed.md CR items that need a decision
- Resolved: 2 questions (OQ-066 closed, reassign payload now in api-design-proposed.md; OQ-009 corrected, superseded by the fixed 2-hour decision, which also answers informal Q10.29)
- Stale: 4 questions (OQ-062, OQ-063, OQ-064, OQ-065)

**Reading notes**
- Informal tags (Q10.n, UI-n, UC open-question fields, CR-n) are merged, not dropped. The mapping table at the end of this file gives the OQ for every tag.
- Phases follow overview.md: 1 Shadow pilot (read-only import, Manager Console, shadow comparison), 2 Live overlay (auth and tenancy, SkiMatch, interviews, first vendor adapter), 3 Booking Core, 4 Scale. The old Alpha, Beta, GA and v1.5 wording in resolved entries pre-dates the 2026-10-31 decisions and was not rewritten.
- Owner is the role that prepares the proposal. Product and legal decisions are made by a human and recorded in decisions.md; no agent decides them. Roles: Product Lead, Tech Lead, API Design Writer, Data Modeler, UI/UX Lead, Legal/Privacy Counsel.
- New entries add Phase, Priority, Owner, Maps from and Decision required to the existing format. Decision required replaces Options and lists the concrete choices.
- Tag sources: Q10.n and UI-n tags are from tech-requirements-proposed.md, data-model-proposed.md, api-design-proposed.md and asset-list-proposed.md (all Run 10 drafts). CR-n tags are from critique-proposed.md (Run 10).
- Provisional proposals in the drafts (for example the group program endpoint) are not treated as decisions.

## Staleness and Source Corrections

- open-questions.md was stale: OQ-009 still read "configurable per tenant; default 120 min", which decisions.md 2026-03-26 superseded (fixed 2 hours; per-resort configuration deferred). Found independently by use-cases-p0-proposed.md UC-008, tech-requirements-proposed.md Q10.29 and critique-proposed.md. Corrected in the Resolved table below.
- OQ-066 is still shown as unresolved in UC-014 and TR-015 of the Run 10 drafts; those drafts should drop the reference when promoted.
- The Run 9 header count of resolved questions was off by one (see above).

## Phase 1 Blockers, Ranked

Order is the order of the entries below. Critical means real data or the first pilot day cannot proceed.

| Rank | OQ | Short title | Priority |
|---|---|---|---|
| 1 | OQ-067 | Is imported POS customer data a gated class, and how is the gate split by phase | Critical |
| 2 | OQ-068 | Retention and erasure rules per data class, including minors | Critical |
| 3 | OQ-069 | How the Phase 1 pilot console is accessed | Critical |
| 4 | OQ-070 | First vendor POS and whether it exposes read and write APIs | Critical |
| 5 | OQ-071 | Import mechanism and refresh frequency | High |
| 6 | OQ-072 | How imported lessons, learners and instructors are stored | High |
| 7 | OQ-073 | Overlay tenant record and mode boundaries | High |
| 8 | OQ-074 | Model provider and no-training terms | High |
| 9 | OQ-075 | Phase assignment of UC-039, UC-042, UC-044, UC-045, UC-046 | High |
| 10 | OQ-076 | Partial or whole-batch import, and flag dismissal | Medium |
| 11 | OQ-077 | Issue ranking criteria and issue types | High |
| 12 | OQ-078 | Constraint and policy rule set | High |
| 13 | OQ-079 | Three-to-six skill mapping and guest skill selector | High |
| 14 | OQ-080 | How "what the manager did" is determined in shadow mode | High |
| 15 | OQ-081 | Platform-admin surface for data-class policy | Medium |
| 16 | OQ-082 | Which Console tabs are Phase 1 | Low |
| 17 | OQ-083 | Console language | Low |
| 18 | OQ-084 | Card data in free-text fields | Medium |
| 19 | OQ-085 | Status vocabularies for new entities | Low |

---

## Active Open Questions

---

# Phase 1 — Shadow pilot (ranked)

---

### OQ-067 — Is imported POS customer data a gated class, and how is the privacy gate split?

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-001, CR-008; tech-requirements-proposed.md TR-030 (Q10.2); data-model-proposed.md DataClassPolicy; decisions.md 2026-10-31 (AI data privacy)
**Blocks:** Phase 1 real-data pilot; UC-035, UC-039, UC-054; POST /imports; LearnerProfile minimal record; PATCH /admin/tenants/:id/real-data
**Phase:** 1 (blocks real data entering the system)
**Priority:** Critical
**Owner:** Legal/Privacy Counsel (decision); Tech Lead (gate mechanics)
**Maps from:** Q10.2, CR-001, CR-008, UC-054 field

**Question:** decisions.md names three gated classes (conversations, inferred profiles, instructor observations). Phase 1 import loads real names, contact details and minors from the POS, and writes a minimal LearnerProfile that TR-047 marks [GATE]. Does the gate also cover imports, ImportFlag.sourceRow previews and agent retrieval? Separately, the real-data switch is rejected unless every gated class, including Phase 2 classes, has an approved policy. Is the gate split per class or per phase?

**Why it matters:** As written, import either fails with PRIVACY_GATE_CLOSED or bypasses the gate, and Phase 1 cannot use real data until Phase 2 retention rules exist.
The agent (UC-039) would retrieve minors' imported records for a model provider while its own writes are gated.

**Decision required:** Pick one. (a) Add imported POS customer data as a gated class in decisions.md, gate POST /imports, previews, LearnerProfile and agent retrieval, and split the real-data switch per class or per phase. (b) Constrain the Phase 1 pilot to synthetic or pseudonymised data until OQ-068 is decided. Record the choice in decisions.md.

---

### OQ-068 — Retention periods and erasure behavior per data class, including minors, backups and provider logs

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-030 (Q10.1, Q10.3), TR-039 (Q10.17), TR-044 (Q10.25); data-model-proposed.md Q10.64; use-cases-p0-proposed.md UC-039, UC-044, UC-054 fields; critique-proposed.md Domain Risks; decisions.md 2026-10-31
**Blocks:** Phase 1 real data; DataClassPolicy approvals; UC-039, UC-040, UC-044, UC-047, UC-051 to UC-054; every [GATE] entity
**Phase:** 1 (prerequisite); applies again in Phase 2
**Priority:** Critical
**Owner:** Legal/Privacy Counsel (decision); Tech Lead (implementation)
**Maps from:** Q10.1, Q10.3, Q10.17, Q10.25, Q10.64, UC-039 field, UC-044 field, UC-054 field

**Question:** For each data class (manager-agent conversations, intake conversations, learner profiles, assessments, observations and free-text reasons, imported POS customers, overlay audit data, values copied into GroupPlacementRequest, IntakeMatch and NextLessonRecommendation): what is the retention period and is erasure delete or pseudonymise? What is the minors rule? Are backups and model-provider logs in erasure scope? What is the overlay audit retention (the 3-year AuditLog cap is Booking Core only)? Is Quebec French-speaking-school and cross-border processing handled?

**Why it matters:** decisions.md 2026-10-31 forbids real conversation, profile and observation data until these rules cover it and address minors explicitly.
TR-030 says the periods are a human decision, not a drafting decision.

**Decision required:** A decisions.md entry per data class giving retention period, erasure behavior and minor rule, citing the Legal review; a yes or no on backups and provider logs; the overlay audit retention figure; whether copied values inherit the source class gate.

---

### OQ-069 — How the Phase 1 pilot console is accessed

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-041 (Q10.19); asset-list-proposed.md UI-2; critique-proposed.md CR-009; overview.md Phases
**Blocks:** Phase 1 Manager Console; tenant isolation for the pilot; UC-037, UC-038 as shown in Phase 1
**Phase:** 1
**Priority:** Critical
**Owner:** Tech Lead
**Maps from:** Q10.19, UI-2, CR-009

**Question:** Overview puts auth and tenancy in Phase 2, but the API says every non-public endpoint needs a JWT and the Phase 1 Console screens have no sign-in gate. How does the pilot school reach the console?

**Why it matters:** A real school's schedule and student data behind an unauthenticated console breaks tenant isolation.
UC-037 assumes "viewing the pilot console" without defining it.

**Decision required:** Pick a mechanism: single-tenant deploy per pilot, a pilot access token or shared link, or pull the minimal sign-in forward from Phase 2 (links to OQ-086). State how tenantId is resolved for it.

---

### OQ-070 — First vendor POS and whether it exposes read and write APIs

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-031 (Q10.4); data-model-proposed.md PosConnection.vendor; overview.md Largest Risks 1
**Blocks:** Phase 1 import; Phase 2 first vendor adapter; UC-035, UC-043, UC-050
**Phase:** 1 (read access); 2 (write)
**Priority:** Critical
**Owner:** Product Lead
**Maps from:** Q10.4

**Question:** Which vendor POS is the first adapter, and does it expose a write API? Overview risk 1 says POS data access is untested with a real school and Phase 1 exists to answer it.

**Why it matters:** The import mechanism (OQ-071), the stored fields (OQ-072) and whether Phase 2 execution is writable or manual-only all depend on the vendor.
No adapter work can be scoped without a named vendor.

**Decision required:** Name the first vendor and the pilot school; record whether read and write APIs exist and what customer fields the allow-list must exclude (card data stays out, TR-031).

---

### OQ-071 — Import mechanism and refresh frequency

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-035 (Q10.11); use-cases-p0-proposed.md UC-035 field; api-design-proposed.md POST /imports
**Blocks:** Phase 1 UC-035, TR-035, POST /imports request body
**Phase:** 1
**Priority:** High
**Owner:** Tech Lead
**Maps from:** Q10.11, UC-035 field

**Question:** Is the import a file upload, a scheduled pull or a vendor API call, and how often does it refresh (daily, intraday, on demand)?

**Why it matters:** Refresh frequency sets how stale today's issues are on the day of operations.
The POST /imports body may gain fields once decided.

**Decision required:** Choose the mechanism for the pilot (depends on OQ-070) and a refresh frequency; state whether OQ-063 (push vs polling) also covers Console refresh.

---

### OQ-072 — How imported lessons, learners and instructors are stored

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-035 (Q10.12), Gap 5; data-model-proposed.md Q10.12 inventory and Migration Notes
**Blocks:** Phase 1 schema, ImportBatch mapping, POSReference entityType lesson, UC-035 step 3
**Phase:** 1
**Priority:** High
**Owner:** Data Modeler (proposal); Tech Lead (decision)
**Maps from:** Q10.12

**Question:** Booking, Learner and Instructor have NOT NULL constraints (cancellationPolicyId, householdId, dateOfBirth, userId, bio fields, skillLevelAtBooking) that a POS record may not meet. Relax the constraints or add a separate imported-lesson entity?

**Why it matters:** Relaxing NOT NULL on Booking and Learner affects existing code paths (migration risk high) and leaves overlay rows reachable through Booking endpoints.
A separate entity keeps Booking Core untouched but adds a second model.

**Decision required:** Choose "relax constraints with a tenant-mode guard" or "separate imported-lesson entity keyed by POSReference"; the inventory table in data-model-proposed.md lists each field.

---

### OQ-073 — Overlay tenant record and mode boundaries

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-031 (Q10.5); api-design-proposed.md Q10.57; data-model-proposed.md Q10.59; critique-proposed.md CR-002
**Blocks:** Phase 1 tenant creation; Tenant.paymentProcessor, paymentCredentials, subscriptionTier NOT NULL; overlay calls to booking and payment endpoints
**Phase:** 1
**Priority:** High
**Owner:** Tech Lead
**Maps from:** Q10.5, Q10.57, Q10.59, CR-002 (route restriction)

**Question:** (1) Tenant payment columns are NOT NULL, which overlay tenants cannot satisfy; what is the default for Tenant.operatingMode and are the payment columns made nullable? (2) Can one tenant run both an overlay vendor adapter and Booking Core? (3) Which error and status does an overlay tenant get when it calls a booking or payment endpoint?

**Why it matters:** The first pilot tenant cannot be created until the NOT NULL columns are resolved.
CR-002 shows overlay waitlist can otherwise be routed through the paying Booking Core path.

**Decision required:** Make payment columns nullable for overlay (or add defaults); state yes or no on a mixed tenant; name the error code and HTTP status for overlay calls to Booking Engine and Payment endpoints (see also OQ-105).

---

### OQ-074 — Model provider and no-training, no-retention terms

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-033 (Q10.8, Q10.9); critique-proposed.md Domain Risks (cross-border)
**Blocks:** Phase 1 Agent Gateway; UC-038 explanations, UC-039; Phase 2 UC-047 to UC-053
**Phase:** 1
**Priority:** High
**Owner:** Product Lead (provider choice); Legal/Privacy Counsel (terms and cross-border)
**Maps from:** Q10.8, Q10.9

**Question:** Which model provider or providers will be used, are no-training and no-retention terms (store: false) available, and if terms are unavailable does the feature block or run with consent? What is the cross-border position for Canadian schools?

**Why it matters:** Overview says terms apply "where available"; an unavailable-terms case is undefined.
Real data cannot be sent to a provider until this is answered (links to OQ-067, OQ-068).

**Decision required:** Provider name(s); whether terms are contractually available; the fallback (block the feature, or allow with recorded consent); cross-border position.

---

### OQ-075 — Phase assignment of UC-039, UC-042, UC-044, UC-045, UC-046

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md Phase Map (Q10.53); asset-list-proposed.md How to Read
**Blocks:** Phase 1 scope; TR-039, TR-042, TR-044, TR-045, TR-046; the screens and entities placed "provisional"
**Phase:** 1 (scoping)
**Priority:** High
**Owner:** Product Lead
**Maps from:** Q10.53

**Question:** overview.md assigns no phase to the manager-agent Q&A (UC-039), approve or reject (UC-042), audit history (UC-044), waitlist ranking (UC-045) and waitlist offer (UC-046). They are placed provisionally (UC-039 Phase 1; the rest Phase 2). Confirm or move.

**Why it matters:** Phase 1 scope, the privacy gate surface (UC-039 holds conversations) and the Console screen list all follow from this.
Several downstream questions (OQ-088, OQ-105, OQ-106) are Phase 2 only if this holds.

**Decision required:** A phase for each of the five use cases, recorded in overview.md or decisions.md.

---

### OQ-076 — Partial or whole-batch import, and what dismissing a flag means

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-036 (Q10.13); use-cases-p0-proposed.md UC-036 field; critique-proposed.md Minor Issues (dismissed flags)
**Blocks:** Phase 1 UC-036, TR-036, ImportBatch.status values
**Phase:** 1
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.13, UC-036 field, critique minor (flag dismissal)

**Question:** Is a batch with some invalid records imported partially or rejected whole? When an admin dismisses a flag, is the record kept out or admitted to the operating model?

**Why it matters:** UC-036 postcondition says no invalid record enters unflagged; a dismissal that admits the record can contradict it.

**Decision required:** Partial import with flags (and excluded records) or whole-batch rejection; state that dismissal either keeps the record excluded or admits it with an "incomplete" marker.

---

### OQ-077 — Issue ranking criteria and issue type list

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-037 (Q10.14, Q10.15); use-cases-p0-proposed.md UC-037 field
**Blocks:** Phase 1 UC-037, OperationalIssue.type and rankScore, issue detection rules
**Phase:** 1
**Priority:** High
**Owner:** Product Lead
**Maps from:** Q10.14, Q10.15, UC-037 field

**Question:** How are issues ranked (severity, time to impact, affected guests, weights)? What issue types exist beyond instructor absence, group imbalance and instructor overload?

**Why it matters:** Ranked issues are the Phase 1 core deliverable; the shadow comparison measures against them.
OperationalIssue.type stays a free string until the list is fixed.

**Decision required:** The ranking formula or ordered criteria and the closed list of issue types for the pilot.

---

### OQ-078 — Constraint and policy rule set

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-032 (Q10.6, Q10.7); critique-proposed.md CR-010
**Blocks:** Phase 1 UC-038 constraint results; Phase 2 UC-042, UC-043; PolicyRule content
**Phase:** 1 (validation shown in plan review); 2 (execution)
**Priority:** High
**Owner:** Product Lead
**Maps from:** Q10.6, Q10.7, CR-010 (minimum rule set)

**Question:** Which policies exist and who sets them (school or operator)? Which constraints beyond UC-038/UC-048 (availability, certification, lesson type, language, age, ability) apply to schedule changes?

**Why it matters:** "Deterministic rules decide" is only true if rules exist; with no rule set a plan returns valid and agent-authored params pass unchecked.

**Decision required:** A minimum rule set to ship before Phase 2 execution, who owns each policy, and the owner of the rule configuration.

---

### OQ-079 — Three-to-six skill mapping, source value and guest skill selector

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-034 (Q10.10); data-model-proposed.md Q10.62, Migration Notes; asset-list-proposed.md UI-1; critique-proposed.md Minor Issues; decisions.md 2026-10-31
**Blocks:** Phase 1 LearnerProfile and Learner migration; skill selector in UC-001; GuestCheckout, Booking.skillLevelAtBooking, LessonType.skillLevels remaps
**Phase:** 1 (migration risk high); 3 (customer selector)
**Priority:** High
**Owner:** Product Lead (mapping); Data Modeler (schema placement)
**Maps from:** Q10.10, Q10.62, UI-1, critique minor (six-level cutover applied before it is defined)

**Question:** decisions.md adopts the six-level scale with a recorded source but defines no mapping from the existing three-level enum. Also open: what source value existing levels get (customer would be a guess), whether a historical Booking.skillLevelAtBooking snapshot is rewritten, whether one old LessonType level expands to several, where skillLevelSource lives (Learner per TR-034, LearnerProfile per TR-035), how an unresolved source fits NOT NULL skill columns, and what the guest sees (three groups mapped to six, all six, or "not sure").

**Why it matters:** The migration is high risk and cannot start until the mapping is fixed.
Booking Core P0 endpoints already use six levels while v0.7 data and LessonType.skillLevels are three-level.

**Decision required:** The old-to-new mapping and backfill source value; snapshot policy; nullability rule for unresolved; one location for skillLevelSource; the guest selector design.

---

### OQ-080 — How "what the manager did" is determined in shadow mode

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-040 (Q10.41); use-cases-p0-proposed.md UC-040 field; data-model-proposed.md OperationalObservation
**Blocks:** Phase 1 success metric (recommendation vs manager action); pilot-matches report; UC-040
**Phase:** 1
**Priority:** High
**Owner:** Product Lead
**Maps from:** Q10.41, UC-040 field

**Question:** In read-only mode is the manager's real action self-reported or inferred from later imports? If inferred, how is POS state compared to plan actions, and how is source = inferred derived?

**Why it matters:** The Phase 1 exit criterion depends on measuring match rate; a method that is not defined cannot produce a trustworthy metric.

**Decision required:** Self-reported only, inferred only, or both with a stated comparison method and which counts toward the pilot metric.

---

### OQ-081 — Platform-admin surface for data-class policy

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** asset-list-proposed.md UI-5; tech-requirements-proposed.md TR-030
**Blocks:** Phase 1 opening of the privacy gate (PUT /admin/data-class-policies, PATCH /admin/tenants/:id/real-data)
**Phase:** 1
**Priority:** Medium
**Owner:** UI/UX Lead
**Maps from:** UI-5

**Question:** DataClassPolicy writes are platform_admin only, but none of the four apps has a platform-admin surface. Is there a screen, or are the writes API-only or manual?

**Why it matters:** The gate cannot be opened through any UI that exists today; only a school_admin read-only status screen is listed.

**Decision required:** A platform-admin screen in scope, or API-only operation documented for the pilot.

---

### OQ-082 — Which Manager Console tabs are Phase 1

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** asset-list-proposed.md UI-4; critique-proposed.md Minor Issues
**Blocks:** Phase 1 Console screen list
**Phase:** 1
**Priority:** Low
**Owner:** UI/UX Lead
**Maps from:** UI-4, critique minor (Pros and Students show Phase 2 data)

**Question:** The prototype has Schedule, Pros and Students tabs that no P0 use case describes. Keep as read-only screens, or leave out of Phase 1? Pros and Students show learned profiles and original wording that exist only after Phase 2 and are gated data.

**Why it matters:** Phase 1 screens would otherwise show gated data that cannot exist yet.

**Decision required:** Include (read-only, with learned-profile fields hidden in Phase 1) or exclude each of the three tabs.

---

### OQ-083 — Console language: English-only reasoning in Phases 1 and 2?

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-038 (Q10.16); asset-list-proposed.md UI-3; decisions.md 2026-03-26 (admin bilingual follows Beta)
**Blocks:** Phase 1 Console i18n; Plan Review screen
**Phase:** 1
**Priority:** Low
**Owner:** Product Lead
**Maps from:** Q10.16, UI-3

**Question:** decisions.md defers full admin bilingual support to "Beta", a term replaced by phases on 2026-10-31. Are plan reasoning texts and Console screens English-only in Phases 1 and 2? Plan Review is flagged i18n yes while other Console screens are no.

**Why it matters:** One decision is needed so the Console and plan reasoning are consistent.

**Decision required:** English-only through Phase 2 (with the Beta wording mapped to a phase), or bilingual Plan Review from Phase 1.

---

### OQ-084 — Card data typed into free-text fields

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** data-model-proposed.md Q10.66
**Blocks:** Phase 1 OperationalObservation.reason; any [PCI]-tagged free-text field; PCI scope (OQ-064)
**Phase:** 1 (OperationalObservation.reason); 2 and 3 for the other fields
**Priority:** Medium
**Owner:** Tech Lead
**Maps from:** Q10.66

**Question:** Fields tagged [PCI] (for example OperationalObservation.reason, free-text content fields) are places a guest or admin could type card data. Screen or redact before storage? Existing free-text fields (Learner.notes, BookingNote.content, cancellationReason) are not retro-tagged.

**Why it matters:** Stored card numbers in free text would widen PCI scope.

**Decision required:** Screening or redaction rule and the list of fields it applies to, including whether to retro-tag the existing fields.

---

### OQ-085 — Status vocabularies for new entities

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** data-model-proposed.md Q10.61
**Blocks:** Phase 1 ImportBatch.status, PosConnection.status; Phase 2 IntakeSession, InstructorLessonAssessment, PrivacyRequest status; ResolutionPlan.status value ready_to_execute
**Phase:** 1
**Priority:** Low
**Owner:** Data Modeler
**Maps from:** Q10.61

**Question:** Status value lists for five entities are proposed from flows, not specified in any source. TR-042 says an approved plan becomes ready_to_execute, which is not in the TR-038 status list; the schema treats approved as ready to execute. OperationalIssue.type and ProposedAction.actionType stay strings (see OQ-077).

**Why it matters:** Implementation needs closed enums.

**Decision required:** Confirm the proposed values, and whether ready_to_execute is a status or the approved status.

---

# Phase 2 — Live overlay

---

### OQ-062 — Password reset: in scope for P0?

**Status:** Unresolved
**Raised:** 2026-04-04
**Source:** critique-proposed.md (Run 8, Significant Gaps), tech-requirements-proposed.md (TR gap #18), api-design-proposed.md
**Blocks:** api-design-proposed.md password reset endpoints, PasswordResetToken entity in data-model-proposed.md, no UC or screen defined

**Question:** TR gap #18 (Run 8) identified that no password reset flow exists in any design document. api-design-proposed.md added `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` as new endpoints. data-model-proposed.md added a `PasswordResetToken` entity. But no use case, no screen in asset-list-proposed.md, and no uc-registry item exist for this flow. Is password reset required for Alpha (P0)?

**Why it matters:** Without password reset, any account with a forgotten password is permanently locked. If Starter-tier users have no admin to reset for them, this is a critical retention issue. If it is P0, a UC and screen must be added before development.

**Options:**
1. P0: Add UC-023a, a password-reset screen to asset-list, and add to uc-registry.
2. P1: Mark password reset as Beta deliverable; add to uc-registry P1 section; remove PasswordResetToken from P0 data-model-proposed.md (keep endpoints as no-op stubs if needed).
3. Manual only for Alpha: ops resets passwords manually; auto-reset deferred to GA.

**Run 10 update:** Phase is now 2 for the Manager Console if sign-in is password-based (TR-021, UC-041 field, Q10.18; see OQ-086), and 3 for Booking Core accounts and walk-up customers (CR-019, OQ-129). The Alpha, Beta and GA wording in the options predates the 2026-10-31 phase model. Owner: Product Lead.
⚠️ Stale — blocking UC-041 (Manager Console sign-in) and TR-021

---

### OQ-086 — Manager Console sign-in method and overlay roles

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-041 (Q10.18); use-cases-p0-proposed.md UC-041 field; api-design-proposed.md Tenant Sign-in
**Blocks:** Phase 2 UC-041; TR-041, TR-021; role vocabulary for TenantMembership
**Phase:** 2
**Priority:** High
**Owner:** Tech Lead
**Maps from:** Q10.18, UC-041 field

**Question:** Is sign-in by password or SSO, and what roles exist in the overlay? Password reset is OQ-062. POST /auth/login also has two behaviors (JWT with tenant, or a pre-tenant session) that the API draft should reconcile.

**Why it matters:** A password-based choice makes OQ-062 a Phase 2 dependency.

**Decision required:** Method (password, SSO or both), the overlay role list, and the single login behavior.

---

### OQ-087 — Who holds plan approval, and which is authoritative: TenantMembership or User.tenantId

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-042 (Q10.22); data-model-proposed.md Q10.67
**Blocks:** Phase 2 UC-042; approval permission model; membership role vocabulary
**Phase:** 2
**Priority:** Medium
**Owner:** Tech Lead
**Maps from:** Q10.22, Q10.67

**Question:** Who holds the plan approval right (a separate permission within school_admin)? Once both TenantMembership and User.tenantId exist, which is authoritative and is User.tenantId later removed?

**Why it matters:** Agent and system actors must never approve; the approving role must be unambiguous to enforce it.

**Decision required:** The approval-right holder, the authoritative tenancy source, and the migration plan for User.tenantId.

---

### OQ-088 — Editing a plan before approval, rejection reason, approval expiry

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-042 (Q10.20, Q10.21); use-cases-p0-proposed.md UC-042 field; asset-list-proposed.md UI-10; critique-proposed.md CR-010
**Blocks:** Phase 2 UC-042; Approval screen states
**Phase:** 2 (provisional per OQ-075)
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.20, Q10.21, UI-10, UC-042 field, CR-010 (approval expiry)

**Question:** Can a manager edit a plan before approving? Is a rejection reason required (reason is optional today)? Should an approval expire?

**Why it matters:** The approval screen lists neutral states only until this is decided. An approved action that sits unexecuted can run against changed POS state.

**Decision required:** Edit allowed or not (and if allowed, whether it creates a new plan version); reason required on reject yes or no; an approval time-to-live.

---

### OQ-089 — Failed verification, rollback, partial plans, concurrent POS edits

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-043 (Q10.23, Q10.24); use-cases-p0-proposed.md UC-043 field; asset-list-proposed.md UI-11; critique-proposed.md CR-010, Minor Issues (ADAPTER_READ_ONLY)
**Blocks:** Phase 2 UC-043, TR-043, POST /plans/:id/execute; Execution screen retry and rollback controls
**Phase:** 2
**Priority:** High
**Owner:** Tech Lead
**Maps from:** Q10.23, Q10.24, UI-11, UC-043 field, CR-010 (compare-and-set), critique minor

**Question:** What is the rollback or retry policy after failed verification? Does a partial-plan failure stop or continue? How are per-lesson locks and concurrent POS edits handled (expectedState is compared only after the write; planHash covers the last import, not live POS state)? What HTTP result does a caller get for ADAPTER_READ_ONLY, which is both an error and a path that produces manual_pending outcomes?

**Why it matters:** An approved action can overwrite a concurrent POS edit. The Execution screen shows the failure only until this is decided.

**Decision required:** Retry and rollback rules, stop-or-continue, a pre-write read-compare step, and the read-only response contract.

---

### OQ-090 — Does manager approval cover customer-initiated Booking Core changes?

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-005; decisions.md 2026-10-31 (Manager approval); overview.md Execution rule
**Blocks:** Phase 2 execution scope; Phase 3 UC-057; any decisions.md wording on approval
**Phase:** 2
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** CR-005

**Question:** The decision says schedule and other material changes require manager approval, and overview says every change to a school's schedule does. Customers changing their own Booking Core records (UC-057, UC-001 to UC-006) have no approval step. Is approval meant only for agent- and system-originated changes and overlay execution?

**Why it matters:** Without a clarifying line the decision reads as covering customer bookings, and UC-057 could change instructor assignment, which should stay an admin action.

**Decision required:** Add a decisions.md line scoping approval to agent- and system-originated changes and overlay execution; confirm any instructor change stays an admin reassign.

---

### OQ-091 — Subject identity for overlay consent, export and erasure

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-003; tech-requirements-proposed.md TR-047 (Q10.32), TR-054, TR-055; data-model-proposed.md Q10.63; asset-list-proposed.md UI-16
**Blocks:** Phase 2 privacy gate (ConsentRecord and PrivacyRequest must exist before the gate opens); UC-047, UC-054, UC-055, UC-053; Privacy Center and Consent screens
**Phase:** 2 (blocks opening the gate)
**Priority:** High
**Owner:** Tech Lead (identity model); Legal/Privacy Counsel (verification standard)
**Maps from:** Q10.32, Q10.63, CR-003, UI-16

**Question:** Consent, export and erasure are authenticated as the verified head of household (JWT) and keyed by learnerId, which needs a Household and User from Booking Core (Phase 3). Overlay guests have intake or interview tokens only. How is an overlay adult identified and verified, and how is each intake bound to a learner subject before any message is accepted? How do Phase 2 guests reach the Privacy Center, which sits under /account?

**Why it matters:** An intake token is not bound to a learner, so 403 CONSENT_REQUIRED cannot be enforced; the only link is a client-supplied consentRef string, so minors' protection rests on an unverifiable value.

**Decision required:** An identity model (for example a verified-email token bound to a learner subject created at intake start), the keying of ConsentRecord and PrivacyRequest to that subject rather than Household, and the Phase 2 route to the Privacy Center.

---

### OQ-092 — Minor consent: age threshold, wording, and the two consent mechanisms

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-055 (Q10.40); use-cases-p0-proposed.md UC-055 field; asset-list-proposed.md UI-6; critique-proposed.md Domain Risks (child safety); decisions.md 2026-03-26 (household minimum age)
**Blocks:** Phase 2 UC-055, Consent screen; any minor data collection
**Phase:** 2
**Priority:** High
**Owner:** Legal/Privacy Counsel
**Maps from:** Q10.40, UI-6, UC-055 field, critique (two consent mechanisms)

**Question:** What is the age threshold by province and state (legal review pending) and what is the consent wording and version text? Does an adult booking for themselves see a privacy notice? Where does consent sit relative to the school intake link? How do Learner.parentalConsentGiven (Booking Core) and ConsentRecord (overlay) relate?

**Why it matters:** No minor data may be collected before consent. Two unreconciled consent mechanisms risk contradictory states for one child.

**Decision required:** Threshold per jurisdiction, approved wording with a version, the adult notice rule, and whether one mechanism supersedes the other.

---

### OQ-093 — Erasure suppression when a POS record is re-imported

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** data-model-proposed.md Q10.58; critique-proposed.md CR-012
**Blocks:** Phase 2 UC-054 and re-import in UC-035; POSReference erasedAt
**Phase:** 2 (affects Phase 1 data already imported)
**Priority:** High
**Owner:** Legal/Privacy Counsel (decision); Data Modeler
**Maps from:** Q10.58, CR-012

**Question:** Erasure leaves the POS record in the POS, and the next re-import would recreate the Slopebook copy. The proposed design keeps a POSReference with erasedAt and no personal fields. Does keeping the external id defeat erasure, and for how long may the marker live? Is the Learner deleted or pseudonymised? What happens if the POS issues a new customer id for the same person? Which imported fields may Slopebook hold at all?

**Why it matters:** Without a tombstone that re-import honours, erasure is undone on the next import.

**Decision required:** Tombstone design and lifetime, delete versus pseudonymise, and the allow-list of imported fields.

---

### OQ-094 — Who may request privacy actions on a school's behalf, and erasure of derived instructor data

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-054 (Q10.39); use-cases-p0-proposed.md UC-054 field
**Blocks:** Phase 2 UC-054, PrivacyRequest authorization
**Phase:** 2
**Priority:** Medium
**Owner:** Legal/Privacy Counsel
**Maps from:** Q10.39, UC-054 field

**Question:** Who may request export or erasure on a school's behalf? How is instructor learnedProfile data derived from the learner erased?

**Why it matters:** Derived data left behind would survive an erasure; an unauthorised requester could erase a learner's data.

**Decision required:** The authorised requester list and an erasure rule for derived learned-profile content.

---

### OQ-095 — Intake conversation language (EN/FR)

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-047 (Q10.30); use-cases-p0-proposed.md UC-047 field
**Blocks:** Phase 2 UC-047, IntakeSession.language
**Phase:** 2
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.30, UC-047 field

**Question:** How are French and English conversations handled: language chosen at start, detected, switchable mid-conversation? Is original wording stored in the language spoken and are structured values language-neutral?

**Why it matters:** OQ-001 and OQ-030 require FR on guest-facing surfaces; the intake is the most language-heavy guest flow.

**Decision required:** Language selection rule, storage of original wording, and whether the EN/FR extraction is validated separately.

---

### OQ-096 — Intake and placement: standalone pages or embedded in the school's checkout

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-047 (Q10.31); asset-list-proposed.md UI-8; overview.md Largest Risks 4; use-cases-p0-proposed.md UC-047 field
**Blocks:** Phase 2 UC-047, UC-049, UC-050; /skimatch routes
**Phase:** 2
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.31, UI-8, UC-047 field

**Question:** Is SkiMatch intake and placement a standalone /skimatch experience or embedded in the school's own checkout?

**Why it matters:** Routes, widget embedding and the POS-linking flow (OQ-100) depend on the answer.

**Decision required:** Standalone, embedded, or standalone first with an embed later.

---

### OQ-097 — Which learned instructor-profile fields guests may see

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-048 (Q10.33); use-cases-p0-proposed.md UC-048 field
**Blocks:** Phase 2 UC-048, InstructorProfile guest allow-list
**Phase:** 2
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.33, UC-048 field

**Question:** Which learnedProfile fields about instructors may guests see? Profiles are coaching inputs, not evaluations.

**Why it matters:** Exposing observations as evaluations conflicts with the stated use of learned profiles; learnedProfile is gated data.

**Decision required:** A named allow-list of guest-visible fields (or none beyond the static profile).

---

### OQ-098 — May inferred age or ability feed hard-constraint matching?

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md Domain Risks (child safety); use-cases-p0-proposed.md UC-047, UC-048; tech-requirements-proposed.md TR-047
**Blocks:** Phase 2 UC-048 hard constraints
**Phase:** 2
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** critique Domain Risks (AI intake extraction)

**Question:** AI intake extraction can set age or ability with source = inferred, and those values feed hard constraints (age, ability) in matching. Should inferred values be allowed to exclude or admit an instructor, or must the guest confirm them first?

**Why it matters:** A wrong inferred age or ability on a minor could place the child with an unsuitable instructor or group.

**Decision required:** Rule that only customer-confirmed or instructor-set values enter hard constraints, or an alternative with explicit guard.

---

### OQ-099 — Group composition rules for school-composed groups

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-049 (Q10.34); use-cases-p0-proposed.md UC-049 field
**Blocks:** Phase 2 UC-049, GroupPlacementRequest handling
**Phase:** 2
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.34, UC-049 field

**Question:** What are the composition rules (ability spread, age bands) for school-composed groups?

**Why it matters:** Imbalance detection (UC-037) and placement need the same definitions.

**Decision required:** Maximum ability spread and age bands per lesson type, or confirmation that managers compose freely.

---

### OQ-100 — How an intake is linked to a POS reservation

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-050 (Q10.35); use-cases-p0-proposed.md UC-050 field
**Blocks:** Phase 2 UC-050, candidate-reservations endpoint
**Phase:** 2
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.35, UC-050 field

**Question:** Is linking manual, automatic by customer and time, or by a booking reference?

**Why it matters:** Automatic linking needs a trustworthy customer key from the POS (OQ-070).

**Decision required:** Linking method, and what confidence is needed to auto-propose a candidate.

---

### OQ-101 — Delivery channel and trigger for overlay guest links (offers, student interviews)

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-046 (Q10.28), TR-051 (Q10.36), TR-020; asset-list-proposed.md UI-7; use-cases-p0-proposed.md UC-046, UC-051 fields; critique-proposed.md CR-011
**Blocks:** Phase 2 UC-046, UC-051; Notification Service overlay events; email and SMS templates
**Phase:** 2
**Priority:** High
**Owner:** Tech Lead
**Maps from:** Q10.28, Q10.36, UI-7, UC-046 field, UC-051 field, CR-011

**Question:** Notification Service has only Booking Core events. How do waitlist offers and student interview links reach guests in overlay deployments (where do the contact details come from, who sends, which events and templates)? How does the interview relate to rating and tip, which are Booking Core only?

**Why it matters:** Without a channel the signed links cannot be sent. Email and SMS template counts in the asset list are provisional.

**Decision required:** Sender (Slopebook or the school), channel, event contract and templates, and the interview trigger (lesson completion per import).

---

### OQ-102 — Instructor interview channel and the Instructor App

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-052 (Q10.37); asset-list-proposed.md UI-15; use-cases-p0-proposed.md UC-052 field
**Blocks:** Phase 2 UC-052, InstructorLessonAssessment
**Phase:** 2
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.37, UI-15, UC-052 field

**Question:** The Instructor App is not a listed Phase 2 deliverable, yet UC-052 needs an instructor delivery channel. Add the Instructor App to Phase 2, use a token link, or defer UC-052?

**Why it matters:** UC-052 feeds the learned profile that matching uses; the instructor interview screens are provisional until this is decided.

**Decision required:** Channel for instructor interviews and whether the Instructor App enters Phase 2 scope.

---

### OQ-103 — Who sees a next-lesson recommendation, and can guests book from it

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-053 (Q10.38); use-cases-p0-proposed.md UC-053 field
**Blocks:** Phase 2 UC-053
**Phase:** 2
**Priority:** Low
**Owner:** Product Lead
**Maps from:** Q10.38, UC-053 field

**Question:** Do managers and instructors also see the recommendation, and can a guest book directly from it?

**Why it matters:** Booking directly needs a POS write path; viewing by staff adds a gated data surface.

**Decision required:** Visibility per role; direct booking yes or no (the draft routes requests through intake, UC-047).

---

### OQ-104 — Whole-group instructor answers: one row or per-student rows

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** data-model-proposed.md Q10.65; tech-requirements-proposed.md TR-052
**Blocks:** Phase 2 InstructorLessonAssessment
**Phase:** 2
**Priority:** Low
**Owner:** Data Modeler
**Maps from:** Q10.65

**Question:** The API sends learnerId = null when wholeGroup is true. Does that stay one row or expand into per-student rows?

**Why it matters:** Per-student erasure (OQ-094) cannot find a shared row.

**Decision required:** Expand per student on write, or keep one row with a learner list.

---

### OQ-105 — Overlay waitlist: ranking default, origin of entries, reorder action

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-045 (Q10.26); use-cases-p0-proposed.md UC-045 field; critique-proposed.md CR-002; decisions (OQ-034)
**Blocks:** Phase 2 UC-045, UC-046, UC-008, UC-016
**Phase:** 2 (provisional per OQ-075)
**Priority:** High
**Owner:** Product Lead (default and origin); API Design Writer (reorder action)
**Maps from:** Q10.26, UC-045 field, CR-002

**Question:** Is the overlay default fit-based ranking or FIFO with admin-adjustable position (OQ-034)? Do overlay waitlist entries come from the POS import or are they entered in Slopebook? TR-045 sends manual order through PATCH /waitlist/:id/promote, which in Booking Core notifies the guest and leads to checkout and payment.

**Why it matters:** The overlay rule is that an offer never confirms or takes payment, so reusing /promote or /accept either breaks that rule or leaves overlay reorder unusable. "Waitlist offer" also names two different things.

**Decision required:** Default ordering rule; entry origin; a separate overlay reorder action; /promote and /accept marked Booking Core only (error per OQ-073); rename the Booking Core step "waitlist notification".

---

### OQ-106 — Waitlist offer follow-through: who creates the reservation, and audit of offers

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-046 (Q10.27); use-cases-p0-proposed.md UC-046 field; critique-proposed.md CR-011
**Blocks:** Phase 2 UC-046, WaitlistOffer accept flow
**Phase:** 2 (provisional per OQ-075)
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.27, UC-046 field, CR-011 (audit)

**Question:** After a guest accepts, who creates the reservation: the manager in the POS, or an adapter write that must go through a ManagerDecision? Is sending an offer a school-facing action that should be recorded in the UC-044 audit stream?

**Why it matters:** Accept currently records acceptance only. An offer that is neither a ManagerDecision nor audited is invisible in the audit history.

**Decision required:** Manual POS confirmation or adapter write through approval; record offers as audit entries or not.

---

# Phase 3 — Booking Core

---

### OQ-063 — Real-time push mechanism for Admin Schedule View

**Status:** Unresolved
**Raised:** 2026-04-04
**Source:** tech-requirements-proposed.md TR-014 (gap #8)
**Blocks:** TR-014, admin/Schedule View screen (UC-014), asset-list-proposed.md Admin / Schedule View

**Question:** TR-014 requires "real-time updates as bookings arrive" for the admin schedule view. The current spec says "SSE vs WebSocket vs polling (push mechanism TBD)." No endpoint or protocol is defined.

**Why it matters:** The choice (SSE, WebSocket, or polling) affects infrastructure (load balancer config, persistent connections), the client implementation, and whether it is feasible for P0 vs P1. Polling is simplest but may introduce unacceptable lag on opening day.

**Options:**
1. Server-Sent Events (SSE): stateless server side; works through HTTP/2; simple client implementation
2. WebSocket: bidirectional; more complex infrastructure; more appropriate if instructors also need push (e.g. new booking notifications)
3. Polling: simplest; 5–30s interval; acceptable latency for admin use case; no infrastructure change needed

**Run 10 update:** Phase 3 (Booking Core Schedule View); the same choice is shared with Manager Console refresh (TR-035, OQ-071) in Phase 1-2. Still open in api-design-proposed.md Non-Functional. Owner: Tech Lead.
⚠️ Stale — blocking UC-014 (Schedule View real-time updates) and TR-014

---

### OQ-064 — PCI DSS compliance scope (SAQ type)

**Status:** Unresolved
**Raised:** 2026-04-04 (first surfaced in Run 7 critique, not yet formalized as OQ)
**Source:** critique-proposed.md (Run 8, Domain Risks; Run 7, Domain Risks)
**Blocks:** security architecture, processor integration spec, cardholder data environment boundary

**Question:** Slopebook uses Stripe Elements and Shift4 embed for card capture. These reduce PCI scope significantly, but the exact SAQ applicable to Slopebook's architecture is nowhere documented. SAQ A, SAQ A-EP, and SAQ D have very different audit requirements. If any merchant-side token handling exists (e.g. processorTokenId in PaymentMethod), scope may expand to SAQ A-EP or SAQ D.

**Why it matters:** If compliance scope is wrong at launch, remediation can delay production deployment. Must be confirmed before building payment infrastructure.

**Options:**
1. SAQ A: card data never touches Slopebook servers; all via processor JS SDK and iframe; processorTokenId is a reference token, not card data
2. SAQ A-EP: Slopebook serves the payment page (even with iframe); more stringent than SAQ A
3. Engage Stripe/Shift4 compliance team before Alpha to confirm SAQ type

**Run 10 update:** Phase 3. Critique Run 10 notes a link-based guest tip page (OQ-107) must stay an embedded processor field to remain SAQ A, and POS imports keep the card-data allow-list (TR-031). Related: OQ-084. Owner: Legal/Privacy Counsel with Tech Lead. "Alpha" in option 3 means before Booking Core launch.
⚠️ Stale — blocking payment infrastructure (UC-070, UC-071, UC-003) and the guest tip page

---

### OQ-065 — Auto-completion scheduler interval

**Status:** Unresolved
**Raised:** 2026-04-04
**Source:** tech-requirements-proposed.md TR-013a, decisions.md 2026-03-29
**Blocks:** TR-013a implementation (scheduler job frequency)

**Question:** TR-013a describes a scheduled job that runs every "N minutes (interval TBD)" to auto-complete bookings at +2h past endAt. What should the interval be? A long interval increases the delay between lesson end and review email delivery. A very short interval adds database load during peak booking windows.

**Why it matters:** The booking.completed event triggers the post-lesson review email. A 15-minute scheduler interval means up to 15 minutes of delay for the email. For a ski resort context where instructors often run consecutive lessons, this gap may matter.

**Options:**
1. 5-minute interval: near real-time; low additional DB load; recommended
2. 15-minute interval: acceptable; matches the soft-hold TTL for consistency
3. Event-driven via booking endAt timestamp: most precise; requires a job queue or delayed-event system (more complex)

**Run 10 update:** Phase 3. The 2-hour offset itself is settled (decisions.md 2026-03-29, OQ-060); only the job interval is open. Owner: Tech Lead.
⚠️ Stale — blocking UC-013 (TR-013a)

---

### OQ-107 — Payment input for guest-checkout booking and tip payloads

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-004, CR-006; api-design-proposed.md tip payload (open item); tech-requirements-proposed.md TR-003, TR-008
**Blocks:** Phase 3 UC-003 (primary conversion path), UC-007, UC-058; POST /bookings and POST /bookings/:id/tip
**Phase:** 3
**Priority:** High
**Owner:** API Design Writer (contract); Tech Lead (3-D Secure flow)
**Maps from:** CR-004, CR-006, API open item "Tip: payment path for guest-checkout users with no stored card"

**Question:** UC-003 captures the card through the processor SDK and sends paymentMethodId = null, but the booking payload has no field carrying the processor token or payment intent, so the server cannot charge the guest. The tip payload requires a non-null paymentMethodId, and guest-checkout users arriving from the email link have no stored card.

**Why it matters:** The guest path is the main conversion path and is unbuildable as specified; most users cannot tip. A server-side token handler would widen PCI scope (OQ-064).

**Decision required:** Add a payment input (for example paymentToken XOR paymentMethodId) to POST /bookings and POST /bookings/:id/tip, define the processor confirmation and 3-D Secure round trip, and define a link-based tokenized tip path (embedded processor field, no account) or require account creation.

---

### OQ-108 — Tip retry after failure and what counts against the one-tip limit

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** data-model-proposed.md Q10.60; critique-proposed.md CR-007
**Blocks:** Phase 3 UC-058, TIP_ALREADY_SUBMITTED behavior
**Phase:** 3
**Priority:** Medium
**Owner:** API Design Writer
**Maps from:** Q10.60, CR-007

**Question:** The unique index now excludes failed tips only. How do pending (abandoned 3-D Secure), void_pending, refunded and partially_refunded tips count against the one-tip limit, and what does a retry after PAYMENT_FAILED with a new Idempotency-Key return?

**Why it matters:** A declined card should not permanently block tipping.

**Decision required:** A status-by-status rule for the limit and the retry response.

---

### OQ-109 — Platform fee on tips

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md Minor Issues (Payment schema); decisions.md 2026-10-31 (Platform fee)
**Blocks:** Phase 3 Payment.platformFeeCents for paymentType = tip
**Phase:** 3
**Priority:** Low
**Owner:** Product Lead
**Maps from:** critique minor (platformFeeCents on tips)

**Question:** decisions.md applies the 1.5% fee to Booking Core transactions. Is a tip, a gratuity to the instructor, a Booking Core transaction subject to the fee?

**Why it matters:** The fee affects what the instructor receives and the Payment record.

**Decision required:** Fee applies or does not apply to tips.

---

### OQ-110 — Age or date of birth at browse

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-001 (Q10.42); critique-proposed.md CR-017; asset-list-proposed.md UI-9; use-cases-p0-proposed.md UC-001, UC-003
**Blocks:** Phase 3 UC-001, UC-003; GET /availability age param; GuestCheckout.learnerDateOfBirth; Guest Checkout Form
**Phase:** 3
**Priority:** High
**Owner:** Product Lead
**Maps from:** Q10.42, CR-017, UI-9, UC-001 field

**Question:** Browse collects an integer age (decisions.md 2026-03-20 and 2026-11-01 say collect once at browse and do not ask again), but GuestCheckout requires learnerDateOfBirth. A date of birth cannot be derived from an age. Does browse collect a date of birth, or is the age rule redefined?

**Why it matters:** The under-18 consent test would run on an invented date of birth. The decisions on collecting once do not settle the format.

**Decision required:** Collect date of birth at browse, or redefine the under-18 rule and GuestCheckout field to age; update the availability parameter and the checkout form accordingly.

---

### OQ-111 — Per-learner age and skill at browse for a multi-learner household

**Status:** Unresolved (partly answered)
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-001 (Q10.43); use-cases-p0-proposed.md UC-001 field; decisions.md 2026-11-01
**Blocks:** Phase 3 UC-001, UC-005
**Phase:** 3
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.43, UC-001 field

**Question:** decisions.md 2026-11-01 settles that a learner added during household checkout is collected at that step and no flow asks again. Still open: how browse gathers age and skill for each existing learner when several learners are booked together (availability takes one age and one skill level).

**Why it matters:** Availability filtering by one learner can offer slots invalid for another.

**Decision required:** Browse collects per learner, filters on the strictest, or defers per-learner filtering to checkout validation.

---

### OQ-112 — Multi-learner household checkout: reservations, capture and partial failure

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-004 (Q10.45); asset-list-proposed.md UI-13; critique-proposed.md CR-021; use-cases-p0-proposed.md UC-005 field; api-design-proposed.md
**Blocks:** Phase 3 UC-005, POST /bookings, charge idempotency
**Phase:** 3
**Priority:** High
**Owner:** Tech Lead
**Maps from:** Q10.45, UI-13, UC-005 field, CR-021

**Question:** For several learners in one checkout: how many SlotReservations and sessionTokens are held, is capacity checked per learner, is there one capture or one per Booking (Payment.bookingId implies one per Booking), and what happens to the remaining bookings when one fails? The charge idempotency key is scoped to reservationId, which is nullable and shared by several learners, so a second learner's charge would replay the first.

**Why it matters:** Failure states in the household checkout cannot be designed or built until semantics are fixed.

**Decision required:** Reservation and token count, per-learner capacity rule, capture model, all-or-nothing versus partial success, and a per-booking idempotency key.

---

### OQ-113 — Account creation after guest checkout: profile type and re-linking

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-003 (Q10.44); use-cases-p0-proposed.md UC-003 field; critique-proposed.md CR-015
**Blocks:** Phase 3 UC-003 step 9, OQ-048 registration, OQ-033 guest cancel exclusion
**Phase:** 3
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.44, UC-003 field, CR-015

**Question:** Registration auto-creates a self-Learner (OQ-048) but the pre-populated profile is the guest's learner, possibly a minor. Is it the self-Learner or a sub-profile, and is the existing guest Booking re-linked to the new account? If re-linked, the cancel exclusion (OQ-033) disappears, so "create an account to cancel" becomes a bypass; the API also states no authorization rule or error code for guest cancel.

**Why it matters:** The re-link rule decides whether a decided exclusion can be bypassed.

**Decision required:** Profile type for the pre-populated learner, a re-link rule, and the guest-cancel error code and authorization statement in api-design.

---

### OQ-114 — Guest link tokens: lifetime, scope and waitlist accept or leave

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-007 (Q10.46), TR-009; use-cases-p0-proposed.md UC-007 field; critique-proposed.md CR-014, CR-015
**Blocks:** Phase 3 UC-007, UC-058, UC-008; POST /waitlist/:id/accept, DELETE /waitlist/:id
**Phase:** 3
**Priority:** Medium
**Owner:** API Design Writer
**Maps from:** Q10.46, UC-007 field, CR-014, CR-015 (token scope)

**Question:** What is the lifetime and revocation of the booking-reference token in the confirmation email (for example after cancellation or no-show)? Does it open only review and tip, never cancel? An email-only waitlister cannot call accept or DELETE because these are not [PUBLIC] and TR-009 gives them to the guest role; what auth path do they use?

**Why it matters:** Links that never expire or that open cancel are a security gap; email-only waitlisters are locked out of accepting their offer.

**Decision required:** Token lifetime and revocation events, the actions a booking token may authorise, and a signed-link auth path for waitlist accept and leave.

---

### OQ-115 — Tenant resolution for public endpoints and webhooks

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-013; tech-requirements-proposed.md TR-070 (Q10.51), TR-071 (Q10.52); api-design-proposed.md Principles
**Blocks:** Phase 3 booking widget, availability, slot-reservations, guest-checkouts, waitlist join, /webhooks/stripe, /webhooks/shift4
**Phase:** 3
**Priority:** High
**Owner:** API Design Writer
**Maps from:** Q10.51, Q10.52, CR-013

**Question:** Tenant is "resolved from the JWT only", but public endpoints have no JWT and there is no widget key, slug or domain rule. Webhook endpoints share one path for all tenants but each tenant has its own webhookSecret, so lookup by path slug or event account id is undefined.

**Why it matters:** The booking widget cannot resolve a tenant; webhook verification cannot choose the right secret.

**Decision required:** Public tenant resolution (widget key, slug or domain) with abuse limits, and the webhook tenant lookup rule for Stripe and Shift4.

---

### OQ-116 — Modifying one booking (UC-057)

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-057 (Q10.50); use-cases-p0-proposed.md UC-057 field; asset-list-proposed.md UI-14; critique-proposed.md CR-005
**Blocks:** Phase 3 UC-057, TR-057 endpoint, Modify Booking screen
**Phase:** 3
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.50, UI-14, UC-057 field

**Question:** What can a customer change (time, instructor, learner) and do fees or policy windows apply? api-design has only the admin reassign endpoint. Critique suggests limiting UC-057 to a same-instructor time change with availability re-validation.

**Why it matters:** The API and screen cannot be defined until the scope is fixed; an instructor change must stay an admin action (OQ-090).

**Decision required:** Modifiable fields, fee and policy-window rules, and the endpoint shape.

---

### OQ-117 — Reassign: notifications and notifyStudent

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** api-design-proposed.md (Q10.54); critique-proposed.md (Run 9 OQ-066 status)
**Blocks:** Phase 3 PATCH /bookings/:id/reassign behavior; notification events
**Phase:** 3
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.54 (split out of OQ-066)

**Question:** When a booking is reassigned, are the student and the old and new instructors notified, and does the request carry a notifyStudent flag?

**Why it matters:** The payload now has `{ instructorId, reason }` only; an unannounced instructor change surprises students.

**Decision required:** Notify who and when; whether a notifyStudent flag exists and its default.

---

### OQ-118 — Reassign: eligible booking statuses and instructor eligibility checks

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** api-design-proposed.md (Q10.55); critique-proposed.md (Run 9 OQ-066 status)
**Blocks:** Phase 3 PATCH /bookings/:id/reassign validation
**Phase:** 3
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** Q10.55 (split out of OQ-066)

**Question:** Which booking statuses can be reassigned (confirmed only, or also completed or checked-in), and are instructor certification and lesson-type requirements checked beyond availability?

**Why it matters:** Without the rule an admin could assign an uncertified instructor.

**Decision required:** Allowed statuses and the eligibility checks applied (availability plus certification and lesson type, or availability only).

---

### OQ-119 — Group program endpoint: confirm contract and error behavior

**Status:** Unresolved (answer proposed, pending human confirmation)
**Raised:** 2026-11-01
**Source:** api-design-proposed.md Q10.47 and Q10.56; tech-requirements-proposed.md TR-056; decisions.md 2026-11-01 (bulk group program creation)
**Blocks:** Phase 3 UC-056, TR-056
**Phase:** 3
**Priority:** Medium
**Owner:** API Design Writer
**Maps from:** Q10.47, Q10.56

**Question:** decisions.md 2026-11-01 settles that Booking Core has real bulk creation. api-design-proposed.md proposes POST /api/v1/group-programs with `{ lessonTypeId, instructorId, weekday, startTime, startDate, weeks }`, an Idempotency-Key and a `{ programId, created[], flagged[] }` response, but marks it a proposal pending a human. Also open: the error code and status for a lesson type that is not a customer-selected group type, and the result shape when every week conflicts.

**Why it matters:** The decision exists, so only the contract remains; it should not stay open once confirmed.

**Decision required:** Confirm or amend the path and shape, and define the two error cases.

---

### OQ-120 — Group program: timezone, daylight saving and maximum weeks

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-056 (Q10.48); api-design-proposed.md
**Blocks:** Phase 3 UC-056
**Phase:** 3
**Priority:** Low
**Owner:** Tech Lead
**Maps from:** Q10.48

**Question:** How are timezone and daylight-saving changes handled for weekly occurrences, and what is the maximum number of weeks per request?

**Why it matters:** A session after a DST change could land an hour off.

**Decision required:** Use the tenant's local time for wall-clock times; a maximum weeks value.

---

### OQ-121 — Group program: fixing a flagged week

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** tech-requirements-proposed.md TR-056 (Q10.49); asset-list-proposed.md UI-12; api-design-proposed.md
**Blocks:** Phase 3 UC-056 alternate flow, Group Program screen
**Phase:** 3
**Priority:** Low
**Owner:** Product Lead
**Maps from:** Q10.49, UI-12

**Question:** After a conflict flags a week, does the admin retry that one week or submit a new request?

**Why it matters:** The flagged-week row has no action button until decided.

**Decision required:** A retry-one-week operation or a fresh request (and how the program id groups them).

---

### OQ-122 — Are group program sessions bookable in P0?

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-018; use-cases-p0-proposed.md UC-056 postcondition, UC-049; use-cases-p1-proposed.md UC-026
**Blocks:** Phase 3 UC-056, UC-049 (customer-selected route), UC-026
**Phase:** 3
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** CR-018

**Question:** UC-056 says created sessions are "bookable", but no P0 endpoint books a GroupSession (the booking payload has no groupSessionId; group booking is UC-026, P1). Bring group booking into P0 or drop "bookable" from UC-056?

**Why it matters:** Created sessions cannot be sold; UC-049 also depends on UC-026.

**Decision required:** Promote UC-026 into P0 scope, or reword UC-056 and UC-049.

---

### OQ-123 — Processor switch: credential history for refunds and tips

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** data-model-proposed.md Q10.69; critique-proposed.md CR-023
**Blocks:** Phase 3 UC-006 refunds, UC-058 tips after a processor switch; UC-060
**Phase:** 3
**Priority:** Medium
**Owner:** Data Modeler
**Maps from:** Q10.69, CR-023

**Question:** Tenant.paymentCredentials holds one value, so refunds and tips for charges made through the old processor have no credentials after a switch. Payment.processor records the charging processor. Keep a credential history?

**Why it matters:** Refunds "through the processor that captured the charge" cannot run after a switch (OQ-035 only says in-flight transactions are resolved manually).

**Decision required:** Retain prior credentials per processor (encrypted) with a retirement rule, or resolve old-processor refunds manually.

---

### OQ-124 — LessonType.priceAmount type

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** data-model-proposed.md Q10.68
**Blocks:** Phase 3 LessonType schema
**Phase:** 3
**Priority:** Low
**Owner:** Data Modeler
**Maps from:** Q10.68

**Question:** The column is decimal, which breaks decisions.md 2026-03-20 (integer cents); the API example shows an integer.

**Why it matters:** Mixed money types invite rounding errors.

**Decision required:** Change to integer cents (priceAmountCents) and migrate.

---

### OQ-125 — Instructor earnings response payload

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** api-design-proposed.md Open Questions; tech-requirements-proposed.md Gap 20
**Blocks:** Phase 3 GET /api/v1/instructors/:id/earnings; UC-028, UC-065
**Phase:** 3 (P1)
**Priority:** Low
**Owner:** API Design Writer
**Maps from:** API open item (earnings)

**Question:** The earnings endpoint has no response payload defined.

**Why it matters:** UC-028 and UC-065 cannot be built.

**Decision required:** A response schema for totals by day, week, season and lesson type.

---

### OQ-126 — Refund on instructor-initiated or school-initiated cancellation

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-020; use-cases-p0-proposed.md UC-006; OQ-051, OQ-058
**Blocks:** Phase 3 UC-006
**Phase:** 3
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** CR-020

**Question:** UC-006 applies the CancellationPolicy to an instructor-initiated cancel, so a student can be refused a refund for the school's own cancellation. OQ-051 covers weather and group cascade only. Should instructor-initiated cancellation always refund in full, and should rebooking be offered?

**Why it matters:** A student refused a refund after the instructor cancels is a trust and chargeback risk.

**Decision required:** Full refund for any school- or instructor-initiated cancel, and whether a rebooking offer is sent.

---

### OQ-127 — Waitlist entry state when checkout lapses after accept

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-022; use-cases-p0-proposed.md UC-008
**Blocks:** Phase 3 UC-008, WaitlistEntry.status
**Phase:** 3
**Priority:** Low
**Owner:** Product Lead
**Maps from:** CR-022

**Question:** Booking Core sets the entry to accepted on accept, before payment. If checkout lapses at 15 minutes the entry is accepted with no booking and no retry state.

**Why it matters:** The guest loses the slot with no way back and the entry is stuck.

**Decision required:** Revert to notified within the remaining window, or expire, when the hold lapses.

---

### OQ-128 — Bulk-cancel partial failure reporting

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-025; api-design-proposed.md Non-Functional (bulk operations)
**Blocks:** Phase 3 UC-019, POST /bookings/bulk-cancel
**Phase:** 3
**Priority:** Medium
**Owner:** API Design Writer
**Maps from:** CR-025

**Question:** The bulk-cancel response is counts only although the design promises partial-failure reporting; no list of bookings whose refund failed, and no Idempotency-Key.

**Why it matters:** On a weather-closure day hundreds of refunds run in one call.

**Decision required:** A response with failed bookings and reasons, plus Idempotency-Key support.

---

### OQ-129 — Walk-up card payment recording and customer account claim

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-019; use-cases-p0-proposed.md UC-021; tech-requirements-proposed.md TR-017
**Blocks:** Phase 3 UC-021
**Phase:** 3
**Priority:** Medium
**Owner:** Product Lead
**Maps from:** CR-019

**Question:** "Payment via POS card terminal" has no Payment Service path, yet Booking requires a Payment record. The walk-up User is created with no password. How is an off-platform card payment recorded, and how does the customer claim the account (links to OQ-062)?

**Why it matters:** The booking cannot be created without a Payment; the customer has no way to sign in.

**Decision required:** A Payment path for off-platform payments (a manual payment type or an in-window processor charge) and the account-claim flow.

---

### OQ-130 — No-show admin alert: event, template and screen

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md Minor Issues; use-cases-p0-proposed.md UC-011; asset-list-proposed.md
**Blocks:** Phase 3 UC-011 step 3, UC-020 events
**Phase:** 3
**Priority:** Low
**Owner:** UI/UX Lead
**Maps from:** critique minor (no-show alert)

**Question:** UC-011 sends an admin alert but Notification Service has no event, template or screen for it.

**Why it matters:** The alert cannot be built.

**Decision required:** Add a booking.no_show event and template, or remove the alert.

---

### OQ-131 — Booking Core erasure: guest PII use case and learners with future bookings

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md CR-024, Domain Risks; use-cases-p0-proposed.md UC-054; OQ-036, OQ-012
**Blocks:** Phase 3 guest-checkout erasure; UC-054 for Booking Core learners
**Phase:** 3
**Priority:** Medium
**Owner:** Legal/Privacy Counsel
**Maps from:** CR-024

**Question:** The UC-054 erasure path for a learner with future bookings is not reconciled with the OQ-036 block (409 LEARNER_HAS_ACTIVE_BOOKINGS). Booking Core GuestCheckout erasure also has no P0 use case while P0 collects guest PII.

**Why it matters:** An erasure request cannot be honoured while a block applies; collecting PII without an erasure use case is a compliance gap.

**Decision required:** Whether erasure overrides the block (cancel and refund first) and a UC for guest-checkout erasure.

---

### OQ-132 — Seasonal load targets

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** critique-proposed.md Domain Risks (Seasonal load)
**Blocks:** Phase 3 capacity planning for availability, slot-reservations, bulk-cancel; model-backed intake and agent calls
**Phase:** 3 (agent-call load from Phase 2)
**Priority:** Medium
**Owner:** Tech Lead
**Maps from:** critique Domain Risks (seasonal load)

**Question:** No capacity or rate targets exist for the booking surge or for opening-day model-backed calls.

**Why it matters:** The performance flags in the requirements have nothing to test against.

**Decision required:** Peak concurrent users, request rates and bulk sizes to design and test for.

---

# P1 and P2 (Booking Core, Phase 3; Operator items Phase 4)

---

### OQ-133 — Package ownership: one learner or shared across the household

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** use-cases-p1-proposed.md UC-068 field
**Blocks:** Phase 3 (P1) UC-068, UC-024, UC-025
**Phase:** 3
**Priority:** Low
**Owner:** Product Lead
**Maps from:** UC-068 field

**Question:** Does a lesson package belong to one learner or can it be shared across the household?

**Why it matters:** Redemption rules and the usage view depend on it.

**Decision required:** Per learner or household-shared.

---

### OQ-134 — Group booking for several learners: one payment or one per learner

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** use-cases-p1-proposed.md UC-026 field
**Blocks:** Phase 3 (P1) UC-026
**Phase:** 3
**Priority:** Low
**Owner:** Product Lead
**Maps from:** UC-026 field

**Question:** The registry says "one transaction" but Run 9 captured payment per learner with independent failure. Which applies? Compare OQ-112.

**Why it matters:** Failure and refund handling differ.

**Decision required:** One capture or per-learner capture; the same rule as OQ-112 is probably wanted.

---

### OQ-135 — Recurring weekly lesson: payment per occurrence or lump

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** use-cases-p1-proposed.md UC-031 field
**Blocks:** Phase 3 (P1) UC-031, UC-069
**Phase:** 3
**Priority:** Low
**Owner:** Product Lead
**Maps from:** UC-031 field

**Question:** Is payment captured per occurrence or as one lump charge?

**Why it matters:** UC-069 applies the cancellation policy to one occurrence; a lump charge needs partial refunds.

**Decision required:** Per occurrence or lump.

---

### OQ-136 — Operator Portal sequencing: P1 or Phase 4

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** use-cases-p1-proposed.md UC-030 field; overview.md Phases
**Blocks:** UC-030, UC-059 to UC-061 scheduling
**Phase:** 3 or 4
**Priority:** Low
**Owner:** Product Lead
**Maps from:** UC-030 field

**Question:** The registry lists the Operator Portal as P1, but overview.md places it in Phase 4 (Scale). Which sequencing governs?

**Why it matters:** Operator-persona use cases are scheduled by it.

**Decision required:** Confirm Phase 4 and relabel the registry, or pull specific items into Phase 3.

---

### OQ-137 — Consolidated multi-currency summary

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** use-cases-p1-proposed.md UC-062 field
**Blocks:** Phase 4 (P2) UC-062
**Phase:** 4
**Priority:** Low
**Owner:** Product Lead
**Maps from:** UC-062 field

**Question:** Tenants are single-currency with no FX conversion (decisions.md 2026-03-20), so how is a multi-currency summary produced?

**Why it matters:** The report cannot be built without a conversion rule.

**Decision required:** Per-currency subtotals only, or a defined FX source.

---

### OQ-138 — Google Calendar sync timing

**Status:** Unresolved
**Raised:** 2026-11-01
**Source:** use-cases-p1-proposed.md UC-063 field; OQ-021
**Blocks:** Phase 4 (P2) UC-063
**Phase:** 4
**Priority:** Low
**Owner:** Product Lead
**Maps from:** UC-063 field

**Question:** OQ-021 deferred Google Calendar sync to v1.5 while the registry lists it P2. Confirm timing under the phase model.

**Why it matters:** The "v1.5" label no longer maps to a phase.

**Decision required:** A phase for UC-063.

---

## Informal-Tag Mapping

Every informal tag raised this run, and the OQ that now carries it.

### Q10.n

| Tag | OQ | Tag | OQ | Tag | OQ |
|---|---|---|---|---|---|
| Q10.1 | OQ-068 | Q10.24 | OQ-089 | Q10.47 | OQ-119 |
| Q10.2 | OQ-067 | Q10.25 | OQ-068 | Q10.48 | OQ-120 |
| Q10.3 | OQ-068 | Q10.26 | OQ-105 | Q10.49 | OQ-121 |
| Q10.4 | OQ-070 | Q10.27 | OQ-106 | Q10.50 | OQ-116 |
| Q10.5 | OQ-073 | Q10.28 | OQ-101 | Q10.51 | OQ-115 |
| Q10.6 | OQ-078 | Q10.29 | OQ-009 (resolved) | Q10.52 | OQ-115 |
| Q10.7 | OQ-078 | Q10.30 | OQ-095 | Q10.53 | OQ-075 |
| Q10.8 | OQ-074 | Q10.31 | OQ-096 | Q10.54 | OQ-117 |
| Q10.9 | OQ-074 | Q10.32 | OQ-091 | Q10.55 | OQ-118 |
| Q10.10 | OQ-079 | Q10.33 | OQ-097 | Q10.56 | OQ-119 |
| Q10.11 | OQ-071 | Q10.34 | OQ-099 | Q10.57 | OQ-073 |
| Q10.12 | OQ-072 | Q10.35 | OQ-100 | Q10.58 | OQ-093 |
| Q10.13 | OQ-076 | Q10.36 | OQ-101 | Q10.59 | OQ-073 |
| Q10.14 | OQ-077 | Q10.37 | OQ-102 | Q10.60 | OQ-108 |
| Q10.15 | OQ-077 | Q10.38 | OQ-103 | Q10.61 | OQ-085 |
| Q10.16 | OQ-083 | Q10.39 | OQ-094 | Q10.62 | OQ-079 |
| Q10.17 | OQ-068 | Q10.40 | OQ-092 | Q10.63 | OQ-091 |
| Q10.18 | OQ-086 | Q10.41 | OQ-080 | Q10.64 | OQ-068 |
| Q10.19 | OQ-069 | Q10.42 | OQ-110 | Q10.65 | OQ-104 |
| Q10.20 | OQ-088 | Q10.43 | OQ-111 | Q10.66 | OQ-084 |
| Q10.21 | OQ-088 | Q10.44 | OQ-113 | Q10.67 | OQ-087 |
| Q10.22 | OQ-087 | Q10.45 | OQ-112 | Q10.68 | OQ-124 |
| Q10.23 | OQ-089 | Q10.46 | OQ-114 | Q10.69 | OQ-123 |

### UI-n

| Tag | OQ | Tag | OQ |
|---|---|---|---|
| UI-1 | OQ-079 | UI-9 | OQ-110 |
| UI-2 | OQ-069 | UI-10 | OQ-088 |
| UI-3 | OQ-083 | UI-11 | OQ-089 |
| UI-4 | OQ-082 | UI-12 | OQ-121 |
| UI-5 | OQ-081 | UI-13 | OQ-112 |
| UI-6 | OQ-092 | UI-14 | OQ-116 |
| UI-7 | OQ-101 | UI-15 | OQ-102 |
| UI-8 | OQ-096 | UI-16 | OQ-091 |

### Use-case Open Questions fields

| UC | OQ | UC | OQ |
|---|---|---|---|
| UC-001 | OQ-110, OQ-111 | UC-047 | OQ-095, OQ-096 |
| UC-003 | OQ-113 | UC-048 | OQ-097 |
| UC-005 | OQ-112 | UC-049 | OQ-099 |
| UC-007 | OQ-114 | UC-050 | OQ-100 |
| UC-008 | OQ-009 (resolved; stale reference) | UC-051 | OQ-101 |
| UC-013 | OQ-065 | UC-052 | OQ-102 |
| UC-014 | OQ-063; OQ-066 (resolved) | UC-053 | OQ-103 |
| UC-026 | OQ-134 | UC-054 | OQ-068, OQ-094 |
| UC-030 | OQ-136 | UC-055 | OQ-092 |
| UC-031 | OQ-135 | UC-057 | OQ-116 |
| UC-035 | OQ-071 | UC-062 | OQ-137 |
| UC-036 | OQ-076 | UC-063 | OQ-138 |
| UC-037 | OQ-077 | UC-068 | OQ-133 |
| UC-039 | OQ-068 | UC-041 | OQ-086, OQ-062 |
| UC-040 | OQ-080 | UC-042 | OQ-088 |
| UC-043 | OQ-089 | UC-044 | OQ-068 |
| UC-045 | OQ-105 | UC-046 | OQ-106, OQ-101 |

### Other open items raised without a tag

| Source item | OQ |
|---|---|
| api-design-proposed.md: tip payment path for guest-checkout users | OQ-107 |
| api-design-proposed.md and TR gap 20: earnings payload | OQ-125 |
| api-design-proposed.md and TR: auto-completion interval, real-time push | OQ-065, OQ-063 |
| critique CR-001, CR-008 | OQ-067 |
| critique CR-002 | OQ-073, OQ-105 |
| critique CR-003 | OQ-091 |
| critique CR-004, CR-006 | OQ-107 |
| critique CR-005 | OQ-090, OQ-116 |
| critique CR-007 | OQ-108 |
| critique CR-009 | OQ-069 |
| critique CR-010 | OQ-078, OQ-088, OQ-089 |
| critique CR-011 | OQ-101, OQ-106 |
| critique CR-012 | OQ-093 |
| critique CR-013, CR-014, CR-015 | OQ-115, OQ-114, OQ-113 |
| critique CR-017 | OQ-110 |
| critique CR-018 | OQ-122 |
| critique CR-019 | OQ-129 |
| critique CR-020 to CR-025 | OQ-126, OQ-112, OQ-127, OQ-123, OQ-131, OQ-128 |
| critique CR-016 | none (addressed in data-model-proposed.md: InstructorProfile keyed by tenantId and instructorId) |
| critique Domain Risks: seasonal load, child safety, PCI | OQ-132, OQ-092 and OQ-098, OQ-064 |
| critique Minor Issues: platform fee on tips, no-show alert, ADAPTER_READ_ONLY, flag dismissal, Console tabs | OQ-109, OQ-130, OQ-089, OQ-076, OQ-082 |

---

## Resolved Questions

| # | Title | Decision | Date |
|---|---|---|---|
| OQ-001 | French translation priority | EN/FR on customer + instructor at Alpha; admin + operator at Beta. | 2026-03-25 |
| OQ-002 | Minimum viable Starter tier | 1 instructor, 100 bookings/month. | 2026-03-25 |
| OQ-003 | Native iOS app | PWA sufficient for Alpha and Beta. | 2026-03-25 |
| OQ-004 | Cross-processor card vault | Processor-managed vault per tenant; PaymentMethod.isValid = false on switch. | 2026-03-25 |
| OQ-005 | Shift4 merchant model | Starter = Stripe only; Growth+ can use Shift4 direct MID. | 2026-03-25 |
| OQ-006 | Instructor payroll | Report-only with Workday handoff. Direct deposit deferred to v2.0. | 2026-03-25 |
| OQ-007 | Minimum learner age | 5 years. Under-18 requires parental consent. | 2026-03-25 |
| OQ-008 | Electronic waiver storage | Third-party e-signature tool (Smartwaiver per OQ-029). | 2026-03-26 |
| OQ-009 | Waitlist notification window | **Superseded (Run 10 correction).** The window is a fixed 2 hours, a platform-wide value in v1.0; per-resort configuration deferred to v1.5 (decisions.md 2026-03-26). The earlier text "Configurable per tenant; default 120 min" was stale in open-questions.md and conflicted with decisions.md, which takes precedence. Tenant.waitlistAcceptWindowMinutes is removed from the data model (data-model-proposed.md v0.8); informal Q10.29 is answered by this decision. | 2026-03-26 (decisions.md); flagged 2026-11-01 |
| OQ-010 | Group lesson capacity | Platform default → LessonType.maxCapacity → GroupSession.maxCapacity. | 2026-03-26 |
| OQ-011 | Soft-hold TTL | 15 minutes, platform constant. | 2026-03-26 |
| OQ-012 | GuestCheckout data retention | Admin tools for right-to-erasure; full PII scope per OQ-026. | 2026-03-26 |
| OQ-013 | Group lesson instructor ratio | Three-level hierarchy: platform → LessonType → GroupSession override. | 2026-03-26 |
| OQ-014 | Cancellation policy default | Default = non-refundable. Seeded atomically at tenant creation. | 2026-03-26 |
| OQ-015 | InstructorTenant earnings visibility | Full tenant isolation. No cross-tenant visibility. | 2026-03-26 |
| OQ-016 | Notification provider | SendGrid for email. CASL opt-out via suppression list. | 2026-03-26 |
| OQ-017 | Electronic waiver storage layer | Smartwaiver. Learner.waiverSignedAt, waiverVersion, waiverToken. | 2026-03-26 |
| OQ-018 | Tips scope | No tips in booking payload. Superseded by OQ-043 and OQ-061. | 2026-03-26 |
| OQ-019 | Lesson packages | Confirmed Beta deliverable. LessonPackage and PackageRedemption entities. | 2026-03-26 |
| OQ-020 | Skill level: self-reported or validated | Self-reported. Admin override audited via AuditLog. | 2026-03-26 |
| OQ-021 | Google Calendar sync | Deferred to v1.5. OAuthToken entity removed from v1.0 schema. | 2026-03-26 |
| OQ-022 | KMS selection | AWS KMS. Envelope encryption with per-tenant DEK. | 2026-03-26 |
| OQ-023 | Booking payload tipAmountCents | tipAmountCents removed. See OQ-043. | 2026-03-26 |
| OQ-024 | paymentCredentials JSON schema | Starter = Stripe only. Shift4 requires Growth+. Three credential schemas. | 2026-03-26 |
| OQ-025 | Lesson package expiry | Expired credits forfeited. Admin can extend expiresAt manually. | 2026-03-26 |
| OQ-026 | Right-to-erasure PII scope | Full scope defined per entity. Smartwaiver deletion: OQ-045. | 2026-03-26 |
| OQ-027 | Platform fee on packages | 1.5% at package purchase time. | 2026-03-26 |
| OQ-028 | InstructorRating visibility | Internal-only within tenant. Platform-admin moderation only. | 2026-03-26 |
| OQ-029 | Waiver provider | Smartwaiver. Provides API and mobile-compatible embed. | 2026-03-26 |
| OQ-030 | French Language Suppression on Starter Tier | FR available on all tiers including Starter. | 2026-03-28 |
| OQ-031 | GroupSession School-Block Billing | Deferred; Payment.groupSessionId removed. | 2026-03-28 |
| OQ-032 | Parental Consent Fields | Age + skill level required for all bookings. Under-18 blocked without consent. | 2026-03-28 |
| OQ-033 | Guest-Checkout Self-Cancellation | No self-service cancel. Guests see ContactSchoolCard. | 2026-03-28 |
| OQ-034 | Waitlist Priority Ordering | FIFO default; admin-adjustable via position field; exhaustion = nothing. | 2026-03-28 |
| OQ-035 | Processor Switch Mid-Season | In-flight transactions resolved manually. | 2026-03-28 |
| OQ-036 | Learner Deletion with Active Bookings | Block deletion; return 409 LEARNER_HAS_ACTIVE_BOOKINGS. | 2026-03-28 |
| OQ-037 | Soft-Hold Expiry During Account Creation | Visible 15-min clock throughout checkout; silently expire after TTL. | 2026-03-28 |
| OQ-038 | Group Session Entity-Level Cancellation | Cascade cancel all enrolled bookings with automatic refunds. | 2026-03-28 |
| OQ-039 | Package-Redeemed Booking Cancellation | Policy applies; within window reinstates credit; outside forfeits. | 2026-03-28 |
| OQ-040 | Smartwaiver API Outage at Check-In | Typed-name fallback (deferred with Smartwaiver integration per OQ-052). | 2026-03-28 |
| OQ-041 | Cross-Tenant Instructor Double-Booking | No cross-tenant conflict detection in v1.0. | 2026-03-28 |
| OQ-042 | Pricing Floors and Seasonal Rate Cards | Out of scope for v1.0 GA. UC-042 removed. | 2026-03-28 |
| OQ-043 | Tips | No tips in booking payload (superseded — tips are now in scope as post-lesson optional payment per OQ-061 / decisions.md 2026-04-04). | 2026-03-27 |
| OQ-044 | CASL Classification of Weather Emails | Transactional; no CASL commercial classification. | 2026-03-28 |
| OQ-045 | Smartwaiver Document Deletion (Right-to-Erasure) | Not in scope for v1.0. | 2026-03-28 |
| OQ-046 | processorTokenId PCI-DSS Protection | Must be encrypted at rest via AWS KMS envelope encryption. | 2026-03-28 |
| OQ-047 | Payment Atomicity: Booking Write Failure After Capture | 3 DB-write retries; on 3rd failure void payment. | 2026-03-28 |
| OQ-048 | Solo Adult Self-Learner Profile | Self-Learner auto-created atomically at account registration. | 2026-03-28 |
| OQ-049 | Learner.waiverToken Generation Timing | At booking confirmation (deferred with OQ-052 for P0). | 2026-03-28 |
| OQ-050 | Instructor New-Booking Notification | Email notification; not required for P0. | 2026-03-28 |
| OQ-051 | UC-031a Group Cascade Cancel Refund Policy | Company-initiated cancellation always issues full refund regardless of CancellationPolicy. | 2026-03-28 |
| OQ-052 | Smartwaiver Integration API Spec | Deferred to later phase. Waiver assumed complete for P0. waiverToken null in P0. | 2026-03-28 |
| OQ-053 | Payment 3-Retry Idempotency | Retry DB write only; payment captured once; idempotency key scoped to reservationId. | 2026-03-28 |
| OQ-054 | Admin Walk-Up Booking: GuestCheckout or Ad-Hoc Learner? | Admin creates a User account and Learner profile at the window. Walk-up customers get full accounts. | 2026-03-29 |
| OQ-055 | Booking.status = in_progress: Trigger Mechanism | Remove `in_progress` from Booking enum. checkedInAt records check-in; status goes confirmed → completed or no_show. | 2026-03-29 |
| OQ-056 | Payment Void Failure: Compensation State Policy | 4 void retries at 100ms intervals. If all fail, silently set Payment.status = void_pending for ops review. | 2026-03-29 |
| OQ-057 | GuestCheckout Language Collection: Required Field or Default? | UI language selector defaults to browser geolocation. User's browser language matches their transaction language. | 2026-03-29 |
| OQ-058 | Instructor-Initiated Booking Cancellation | Instructors have admin-level access to their own lessons and can cancel them directly. | 2026-03-29 |
| OQ-059 | Payment.bookingId constraint vs P1 package purchases | nullable bookingId + lessonPackageId FK on Payment entity. No separate PackagePayment entity. decisions.md 2026-03-29 and 2026-04-04 authoritative. data-model-proposed.md v0.6 implementation confirmed. | 2026-04-04 |
| OQ-060 | Booking auto-completion: fallback if instructor never marks complete | Auto-complete via scheduled job at endAt + 2 hours. booking.completed event fires; earnings calculated; review email sent. | 2026-03-29 |
| OQ-061 | Tips: OQ-043 resolution conflicts with decisions.md | Tips are in scope for v1.0 as optional post-lesson payment. decisions.md 2026-04-04 is authoritative. OQ-043 superseded. Payment.paymentType = 'tip' confirmed. POST /api/v1/bookings/:id/tip confirmed. Unique partial index on (bookingId, paymentType) WHERE paymentType = 'tip' added in data-model-proposed.md v0.7. | 2026-04-04 |
| OQ-066 | PATCH /api/v1/bookings/:id/reassign payload spec | Request `{ "instructorId": "uuid", "reason": "string \| null" }` (instructorId required and different from current, reason optional and recorded in the audit entry); response 200 returns the updated Booking; conflict returns BOOKING_CONFLICT; one AuditLog entry per reassignment with previousInstructorId, newInstructorId and reason. Specified in api-design-proposed.md (Booking Engine, Run 10), confirmed FIXED by critique-proposed.md Run 10. The draft is a proposal until promoted. Notification and the notifyStudent flag moved to OQ-117; eligible statuses and eligibility checks moved to OQ-118. UC-014 and TR-015 still list it as unresolved and should be updated. | 2026-11-01 |

## Open Question Not Resolved by Run 10 Decisions

Checked against decisions.md 2026-10-31 and 2026-11-01 and no other open or resolved OQ is answered by them. Notes only (no status change):
- 2026-11-01 "Scope of age and skill collection" confirms the walk-up (OQ-054) and household-checkout new-learner cases; it partly answers Q10.43 (now OQ-111) and does not settle age versus date of birth (OQ-110).
- 2026-11-01 "Bulk group program creation" settles the product decision; only the endpoint contract remains (OQ-119).
- 2026-10-31 decisions replace Alpha, Beta, GA and v1.5 labels with phases; resolved entries using those labels (for example OQ-001, OQ-003, OQ-019, OQ-021) keep their original wording.
