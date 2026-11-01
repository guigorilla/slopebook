# Slopebook — Technical Requirements (P0)

**Document Status:** Draft — Generate Pipeline Run 10
**Last Updated:** 2026-11-01
**Pipeline:** pipeline-generate.yaml
**Sources:** use-cases-p0-proposed.md (Run 10, revision 2), data-model.md (v0.7), api-design.md, decisions.md (through 2026-11-01), overview.md (2026-10-31), tech-requirements-proposed.md (Run 9)

**Reading notes**
- Section A is Overlay (Phases 1-2): TR-030 to TR-034 are cross-cutting foundations, TR-035 to TR-055 map one-to-one to UC-035 to UC-055 (TR number = UC number). Section B is Booking Core (Phase 3): Run 9 TR-001 to TR-023 are kept and amended, plus TR-056, TR-057, TR-070 and TR-071.
- Principle: deterministic rules decide (validation, constraints, policy, ranking, matching, ranking of issues). The agent only explains and recommends. Only the Orchestration Service holds POSAdapter write credentials, and only after a ManagerDecision (TR-033, TR-042, TR-043).
- Every overlay endpoint, entity and error code below is a proposal: none exists in api-design.md or data-model.md v0.7. Run 9 gaps for endpoints now present in api-design.md (cancellation policies, certifications, POST /users, notes, checkin, reassign, bulk-cancel, guest-checkouts, slot-reservations, tip, availability params, notification events) are closed and not repeated; Run 9 schema changes are already in data-model.md v0.7 and are not repeated in the summary.
- `[GATE]` prefix on a schema line means the data stores personal data and cannot hold real data until TR-030 is satisfied. `[PCI]` follows the api-design.md convention.
- Open Technical Questions tagged Q10.n are new in Run 10. Questions without that tag are carried from Run 9.
- The 30KB output target was waived for this run (completeness over size).

## Phase Map

| TR | Use case | Phase | Note |
|---|---|---|---|
| TR-030 | UC-047, UC-051, UC-052, UC-053 (+039, 054, 055) | 1 (prerequisite) | Gate: closed until retention and erasure rules exist |
| TR-031 | UC-035, UC-043, UC-050 | 1 (read-only), 2 (vendor write) | |
| TR-032 | UC-038, UC-042, UC-043, UC-048 | 1 | |
| TR-033 | UC-038, UC-039, UC-042, UC-043, UC-047 | 1 | |
| TR-034 | UC-001, UC-003, UC-018, UC-021, UC-035, UC-047 | 1 | Needed by LearnerProfile |
| TR-035 | UC-035 | 1 | |
| TR-036 | UC-036 | 1 | |
| TR-037 | UC-037 | 1 | |
| TR-038 | UC-038 | 1 | |
| TR-039 | UC-039 | 1 (provisional) | Phase not stated in overview; Q10.53 |
| TR-040 | UC-040 | 1 | Shadow mode; Phase 2 manual actions |
| TR-041 | UC-041 | 2 | Phase 1 pilot console access: Q10.19 |
| TR-042 | UC-042 | 2 (provisional) | Q10.53 |
| TR-043 | UC-043 | 2 | Read-only manual path usable in Phase 1 |
| TR-044 | UC-044 | 2 (provisional) | Q10.53 |
| TR-045 | UC-045 | 2 (provisional) | Q10.53 |
| TR-046 | UC-046 | 2 (provisional) | Q10.53 |
| TR-047 | UC-047 | 2 | Gated by TR-030 |
| TR-048 | UC-048 | 2 | |
| TR-049 | UC-049 | 2 | |
| TR-050 | UC-050 | 2 | |
| TR-051 | UC-051 | 2 | Gated by TR-030 |
| TR-052 | UC-052 | 2 | Gated by TR-030 |
| TR-053 | UC-053 | 2 | Gated by TR-030 |
| TR-054 | UC-054 | 2 | Must exist before gate opens |
| TR-055 | UC-055 | 2 | Must exist before gate opens |
| TR-001 to TR-023, TR-013a | Run 9 Booking Core | 3 | TR-021 also needed by overlay sign-in if password-based (Q10.18) |
| TR-056, TR-057 | UC-056, UC-057 | 3 | |
| TR-070, TR-071 | UC-070, UC-071 | 3 | |

---

# Section A — Overlay (Phases 1-2)

## TR-030 — Privacy gate: retention and erasure rules before real data

**Use Case:** UC-047, UC-051, UC-052, UC-053 (gated); also UC-039, UC-054, UC-055
**Services:** Privacy Service, Platform Config; CI schema-registry check
**API Changes:** GET /api/v1/admin/data-class-policies — policy status per data class (platform_admin); PUT /api/v1/admin/data-class-policies/:dataClass — record approved retention + erasure behavior, must cite a decisions.md entry; PATCH /api/v1/admin/tenants/:id/real-data — enable real data, rejected unless every gated class is approved; gated write endpoints (TR-039, 047, 051, 052, 053, free-text reason in TR-040) return 409 PRIVACY_GATE_CLOSED unless Tenant.realDataEnabled and the class policy is approved; non-production accepts synthetic data only; CI fails if a personal-data entity lacks a DataClassPolicy entry or a purge/erasure job; purges and erasures are logged without raw personal data
**Schema Changes:** DataClassPolicy (dataClass, retentionPeriod, erasureBehavior delete|pseudonymise, minorRule, decisionRef, approvedAt) new; Tenant.realDataEnabled boolean default false — gate state
**Auth:** platform_admin writes; school_admin reads status only
**Flags:** multi-tenant
**Open Technical Questions:** Q10.1 retention periods and erasure behavior per class are undefined and are a human decision for decisions.md, not this document; Q10.2 does Phase 1 import of real POS customer data (names, contact details) need the gate too, since decisions.md names only conversations, inferred profiles and instructor observations; Q10.3 are backups and model-provider logs in erasure scope

---

## TR-031 — POSAdapter interface and implementations

**Use Case:** UC-035, UC-043, UC-050
**Services:** POSAdapter (interface), Import adapter (read-only), Vendor POS adapter, Booking Core adapter (Phase 3)
**API Changes:** None public; internal interface with capability flags: read (reservations, instructors, shifts, customers), write (per ProposedAction type), verify (read-back); every call tenant-scoped, idempotent, request id logged; adapter field allow-list excludes card and payment-instrument data
**Schema Changes:** POSReference (tenantId, entityType, entityId, system, externalType, externalId, lastSyncedAt; unique tenantId+system+externalType+externalId) new; PosConnection (tenantId, vendor, mode read_only|read_write, credentials encrypted via KMS, status) new; Tenant.operatingMode enum(overlay, booking_core) — overlay tenants cannot enable booking or payment endpoints
**Auth:** internal; PosConnection set by platform_admin
**Flags:** PCI (POS-owned payment data never imported), multi-tenant
**Open Technical Questions:** Q10.4 which vendor POS is the first adapter and does it expose a write API (overview risk 1); Q10.5 can a tenant run both an overlay vendor adapter and Booking Core at once

---

## TR-032 — Deterministic constraint and policy engine

**Use Case:** UC-038, UC-042, UC-043, UC-048
**Services:** Constraint Engine, Policy Engine
**API Changes:** POST /api/v1/plans/:id/validate — run all constraints and policy, returns ActionValidation rows; engine is pure and versioned (same inputs, same result), no model call in the decision path; rules re-run at plan view, approval and execution
**Schema Changes:** PolicyRule (tenantId, ruleKey, config json, version, effectiveFrom) new; ActionValidation.ruleId + ruleVersion (see TR-038)
**Auth:** system internal; policy config written by school_admin (proposed)
**Flags:** multi-tenant
**Open Technical Questions:** Q10.6 which policies exist and who sets them (school or operator) is undefined; Q10.7 which constraints beyond UC-038/UC-048 (availability, certification, lesson type, language, age, ability) apply to schedule changes

---

## TR-033 — Agent boundary and AI provider controls

**Use Case:** UC-038, UC-039, UC-042, UC-043, UC-047
**Services:** Agent Gateway
**API Changes:** None public; all model calls go through the Agent Gateway: read-only tools, no adapter or write credentials, output schema-validated and treated as proposals or explanations only; a requested change creates a draft ResolutionPlan (TR-038), never a write; scores and confidence carry estimate = true until measured; providers used under no-training and no-retention terms with store: false; prompts and logs carry user ids, not emails
**Schema Changes:** None
**Auth:** system internal
**Flags:** multi-tenant
**Open Technical Questions:** Q10.8 which model provider(s) and whether no-training/no-retention terms are available ("where available" in overview); Q10.9 behavior when terms are unavailable (block feature or allow with consent)

---

## TR-034 — Six-level skill scale with recorded source

**Use Case:** UC-001, UC-003, UC-018, UC-021, UC-035, UC-047
**Services:** Account & Identity Service, Catalog & Lesson Service, Scheduling & Availability Service
**API Changes:** skillLevel becomes first_timer|beginner|advanced_beginner|intermediate|advanced|expert and skillLevelSource customer|inferred|instructor|unresolved is added on POST /api/v1/auth/register, POST /api/v1/guest-checkouts, POST /api/v1/households/:id/learners, POST /api/v1/users, POST /api/v1/lesson-types; GET /api/v1/availability ?skillLevel= takes the six levels
**Schema Changes:** Learner.skillLevel enum three-level to six-level; Learner.skillLevelSource enum; GuestCheckout.skillLevel, Booking.skillLevelAtBooking, LessonType.skillLevels to six-level
**Auth:** unchanged; source = instructor settable by instructor and school_admin only
**Flags:** i18n (level labels EN + FR), multi-tenant
**Open Technical Questions:** Q10.10 mapping of the current three-level enum to six levels (overview says "map during migration", mapping not defined)

---

## TR-035 — Import daily schedule and roster

**Use Case:** UC-035
**Services:** Import Service, POSAdapter (import adapter, read-only), Operating Model Service
**API Changes:** POST /api/v1/imports — start import for date or range (school_admin); GET /api/v1/imports/:id — created, updated and flagged counts; re-import updates changed records and keeps POSReferences; no POS write method is reachable; completion refreshes today's issues (TR-037)
**Schema Changes:** ImportBatch (tenantId, source, rangeStart, rangeEnd, status, counts) new; POSReference per mapped record; minimal LearnerProfile with skillLevelSource = unresolved for learners with no profile
**Auth:** school_admin; Phase 1 pilot console access per TR-041
**Flags:** multi-tenant, performance
**Open Technical Questions:** Q10.11 import mechanism (file upload, scheduled pull, vendor API) and refresh frequency; Q10.12 how imported lessons are stored: Booking requires cancellationPolicyId and payment links, Learner requires householdId and dateOfBirth, Instructor requires userId, so a separate lesson entity or relaxed constraints is needed

---

## TR-036 — Reject or flag an invalid import

**Use Case:** UC-036
**Services:** Import Service (validation)
**API Changes:** GET /api/v1/imports/:id/flags — flagged records with reason and source row; PATCH /api/v1/imports/:id/flags/:flagId — dismiss a flag (school_admin); structurally unreadable batch rejected with 422 IMPORT_UNREADABLE
**Schema Changes:** ImportFlag (importBatchId, sourceRow, recordType, reason, status open|dismissed|fixed, dismissedBy) new; incomplete marker on records missing optional data; flagged records excluded from issue detection until fixed
**Auth:** school_admin
**Flags:** multi-tenant
**Open Technical Questions:** Q10.13 is a batch with some invalid records imported partially or rejected whole

---

## TR-037 — View today's issues ranked by attention

**Use Case:** UC-037
**Services:** Issue Detection Service (deterministic rules), Operating Model Service
**API Changes:** GET /api/v1/issues?date=&type=&status= — ranked list with type, affected lessons, time to impact; GET /api/v1/issues/:id
**Schema Changes:** OperationalIssue (tenantId, type, status open|planned|resolved, affectedLessonRefs, detectedAt, impactAt, rankScore, rankInputs json) new; detection and ranking are pure functions of the imported model
**Auth:** school_admin (Phase 2); pilot console in Phase 1 per TR-041
**Flags:** multi-tenant, performance
**Open Technical Questions:** Q10.14 ranking criteria (severity, time to impact, affected guests) undefined; Q10.15 full issue type list beyond absence, group imbalance and overload

---

## TR-038 — Review a resolution plan

**Use Case:** UC-038
**Services:** Plan Service, Constraint Engine (TR-032), Agent Gateway (explanations only)
**API Changes:** GET /api/v1/issues/:id/plans — plans for an issue (side-by-side compare is client-side); GET /api/v1/plans/:id — reasoning per action, impact, ActionValidation results, estimate labels; a failed constraint blocks approval
**Schema Changes:** ResolutionPlan (issueId, version, planHash, status draft|validated|pending_approval|approved|rejected|executing|executed|failed|stale|closed, createdBy agent|system) new; ProposedAction (planId, actionType, targetRef, params json, expectedState json, reasoning) new; ActionValidation (actionId, ruleId, ruleVersion, result pass|fail, reason, evaluatedAt) new
**Auth:** school_admin
**Flags:** i18n, multi-tenant
**Open Technical Questions:** Q10.16 console language: decisions.md defers full admin bilingual support to Beta, so are reasoning texts English-only in Phase 1-2

---

## TR-039 — Ask the manager agent about operations

**Use Case:** UC-039
**Services:** Manager Agent Service, Agent Gateway (TR-033), Operating Model Service
**API Changes:** POST /api/v1/agent/conversations — start; POST /api/v1/agent/conversations/:id/messages — question, answer cites facts and rule ids and links the related issue or plan; GET /api/v1/agent/conversations/:id; a request to change the schedule creates a draft plan for TR-042, never a write
**Schema Changes:** [GATE] AgentConversation (tenantId, userId, startedAt) and AgentMessage (conversationId, role, content, citedFacts json, citedRuleIds, issueId, planId) new
**Auth:** school_admin; retrieval strictly tenant-scoped
**Flags:** multi-tenant
**Open Technical Questions:** Q10.17 retention and erasure of manager-agent conversations (TR-030 class); Q10.53 overview does not assign phases to UC-039, UC-042, UC-044, UC-045, UC-046, so they are placed provisionally

---

## TR-040 — Record whether a recommendation matched the manager's action

**Use Case:** UC-040
**Services:** Operating Model Service, Reporting Service
**API Changes:** POST /api/v1/plans/:id/observations — result matched|partly_matched|different|not_needed, optional reason; GET /api/v1/reports/pilot-matches?from=&to= — aggregates for pilot success metrics
**Schema Changes:** [GATE] OperationalObservation (planId, tenantId, result incl. unrecorded, reason text nullable, source self_reported|inferred, recordedBy, recordedAt) new; reason is free text
**Auth:** school_admin
**Flags:** multi-tenant
**Open Technical Questions:** Q10.41 in read-only mode, is "what the manager did" self-reported or inferred from later imports, and if inferred, how POS state is compared to plan actions

---

## TR-041 — Sign in to a tenant-scoped Manager Console

**Use Case:** UC-041
**Services:** Account & Identity Service, API gateway
**API Changes:** POST /api/v1/auth/login (existing); GET /api/v1/me/tenants — schools the user belongs to; POST /api/v1/auth/select-tenant — one tenant per session, issues JWT with tenantId and role; expired session returns to the same view
**Schema Changes:** TenantMembership (userId, tenantId, role) new — User.tenantId is a single FK and cannot express multi-school admins; every new overlay entity carries tenantId and queries are tenant-filtered at the data layer (tenant isolation tests required)
**Auth:** school_admin; tenant always from JWT, never a parameter
**Flags:** multi-tenant
**Open Technical Questions:** Q10.18 sign-in method (password or SSO) and overlay roles; password reset is OQ-062; Q10.19 how the Phase 1 pilot console is accessed before auth ships (overview puts auth in Phase 2)

---

## TR-042 — Approve or reject a resolution plan

**Use Case:** UC-042
**Services:** Orchestration Service (approval), Constraint Engine, Audit Service
**API Changes:** POST /api/v1/plans/:id/decision — { decision approve|reject, actionIds[]?, reason? }; re-validates first; 409 PLAN_STALE when the schedule changed since planHash; 422 PLAN_VALIDATION_FAILED when a constraint fails
**Schema Changes:** ManagerDecision (planId, planHash, userId, decision, approvedActionIds, reason, decidedAt) new, append-only; approved plan becomes ready_to_execute, rejected plan closed
**Auth:** school_admin with approval right (separate permission, proposed); agent and system actors can never approve
**Flags:** multi-tenant
**Open Technical Questions:** Q10.20 can a manager edit a plan before approving; Q10.21 is a rejection reason required; Q10.22 who holds the approval right

---

## TR-043 — Execute an approved plan and verify the result

**Use Case:** UC-043
**Services:** Orchestration Service (execution), POSAdapter (TR-031), Constraint Engine, Policy Engine
**API Changes:** POST /api/v1/plans/:id/execute — needs approved ManagerDecision with matching planHash; re-checks constraints and policy; sends each approved action through POSAdapter with idempotency key = actionId; reads back and compares to expectedState; GET /api/v1/plans/:id/outcomes; read-only adapter yields ADAPTER_READ_ONLY and manual_pending outcomes tracked via TR-040
**Schema Changes:** ActionOutcome (actionId, status pending|executed|verified|failed|manual_pending, adapterRequestId, observedState json, verifiedAt, error) new; frozen after final status, AuditLog entry per transition
**Auth:** school_admin triggers; Orchestration Service is the only holder of write credentials
**Flags:** multi-tenant
**Open Technical Questions:** Q10.23 rollback or retry policy after failed verification; Q10.24 partial-plan failure semantics (stop or continue) and per-lesson locking against concurrent POS edits

---

## TR-044 — View decision and action audit history

**Use Case:** UC-044
**Services:** Audit Service
**API Changes:** GET /api/v1/audit/decisions?from=&to=&issueType=&userId=&outcome= — decisions and outcomes with user, time, plan, actions, verification; GET /api/v1/audit/decisions/:id; GET /api/v1/audit/decisions/export — CSV of the filtered list; no write endpoints
**Schema Changes:** None new; joins ManagerDecision, ActionOutcome, ResolutionPlan and AuditLog; no UPDATE or DELETE grants on ManagerDecision and finalized ActionOutcome; AuditLog logs userId only, never raw email
**Auth:** school_admin
**Flags:** multi-tenant
**Open Technical Questions:** Q10.25 retention period for overlay audit data (the 3-year AuditLog cap covers Booking Core only)

---

## TR-045 — Rank a waitlist by slot, ability, goals and instructor fit

**Use Case:** UC-045
**Services:** Matching Service, Constraint Engine
**API Changes:** GET /api/v1/waitlist/ranking?slotRef= — hard filter on slot, lesson type, ability, then deterministic score on goals and instructor fit, with fit reasons and estimate label; unresolved skill ranked lower and flagged; manual order via existing PATCH /api/v1/waitlist/:id/promote
**Schema Changes:** None; ranking is computed, not stored
**Auth:** school_admin
**Flags:** multi-tenant, performance
**Open Technical Questions:** Q10.26 where overlay waitlist entries originate (POS import or entered in Slopebook); OQ-034 fit-based vs FIFO default

---

## TR-046 — Offer a waitlist slot without creating a reservation

**Use Case:** UC-046
**Services:** Waitlist (Booking Engine data), Notification Service, scheduled expiry job
**API Changes:** POST /api/v1/waitlist/:id/offers — manager-approved offer, 2-hour window; POST /api/v1/waitlist/offers/:id/accept and /decline — guest via signed link; expiry closes the offer and surfaces the next ranked entry; offer path never calls Booking Engine or Payment Service (tested)
**Schema Changes:** WaitlistOffer (waitlistEntryId, slotRef, status offered|accepted|declined|expired, offeredBy, offeredAt, expiresAt = offeredAt + 2h fixed) new; WaitlistEntry.accepted stays a Booking Core state
**Auth:** school_admin offers; guest accepts by signed link
**Flags:** i18n, multi-tenant
**Open Technical Questions:** Q10.27 who creates the reservation after acceptance (manager in POS or adapter write); Q10.28 guest notification channel without Booking Core notifications; Q10.29 Tenant.waitlistAcceptWindowMinutes (data-model) conflicts with the fixed 2-hour decision

---

## TR-047 — Complete a conversational booking intake

**Use Case:** UC-047
**Services:** SkiMatch Intake Service, Agent Gateway
**API Changes:** POST /api/v1/intakes [PUBLIC via school link token] — start; POST /api/v1/intakes/:id/messages — turn; GET /api/v1/intakes/:id/summary; PATCH /api/v1/intakes/:id/profile — guest corrections; POST /api/v1/intakes/:id/confirm; minor learner without ConsentRecord returns 403 CONSENT_REQUIRED
**Schema Changes:** [GATE] IntakeSession and IntakeMessage (tenantId, consentRef, language, status) new; [GATE] LearnerProfile (learnerId, goals, terrain, confidence, preferences; each value + originalWording + source) new; unclear skill stored as unresolved, never guessed (schema-validated extraction)
**Auth:** [PUBLIC] link token scoped to tenant, rate limited
**Flags:** i18n, multi-tenant
**Open Technical Questions:** Q10.30 EN/FR conversation handling; Q10.31 how intake relates to the school's own checkout (overview risk 4); Q10.32 subject identity before linking, since Learner requires householdId

---

## TR-048 — See instructor matches with fit reasons and mismatches

**Use Case:** UC-048
**Services:** Matching Service, Constraint Engine
**API Changes:** GET /api/v1/intakes/:id/matches — hard constraints (availability from import, certification, lesson type, language, age) then rules-based soft score, with fit reasons and mismatches; PATCH /api/v1/intakes/:id/preferred-instructor; no match returns waitlist or manager-review option
**Schema Changes:** InstructorProfile (instructorId, specialties, terrain, teachingStyle, communicationStyle, learnedProfile json) new; IntakeMatch (intakeId, instructorId, score, fitReasons, mismatches, computedAt) new, estimate-labeled
**Auth:** [PUBLIC] intake token (read own matches); guest-visible InstructorProfile fields are an allow-list
**Flags:** i18n, performance
**Open Technical Questions:** Q10.33 which learned-profile fields about instructors guests may see (coaching inputs, not evaluations)

---

## TR-049 — Submit a school-composed group placement request

**Use Case:** UC-049
**Services:** SkiMatch Intake Service, Catalog & Lesson Service
**API Changes:** POST /api/v1/group-placement-requests — lesson type, preferred date; GET /api/v1/group-placement-requests (school_admin); PATCH /api/v1/group-placement-requests/:id — place, propose alternatives; customer-selected lesson types route to GroupSession booking (UC-026)
**Schema Changes:** GroupPlacementRequest (tenantId, intakeId, lessonTypeId, preferredDate, age, abilityLevel, goals, status pending|placed|unplaceable) new; LessonType.groupMode enum(customer_selected, school_composed)
**Auth:** [PUBLIC] intake token creates; school_admin manages
**Flags:** multi-tenant
**Open Technical Questions:** Q10.34 group composition rules (ability spread, age bands)

---

## TR-050 — Link a SkiMatch intake to a POS reservation

**Use Case:** UC-050
**Services:** SkiMatch Intake Service, POSAdapter
**API Changes:** GET /api/v1/intakes/:id/candidate-reservations — deterministic candidates from imported reservations; POST /api/v1/intakes/:id/link — admin confirms { posReferenceId }; DELETE /api/v1/intakes/:id/link — unlink; POS record unchanged
**Schema Changes:** POSReference entityType intake|learner to external reservation id (no new entity)
**Auth:** school_admin
**Flags:** multi-tenant
**Open Technical Questions:** Q10.35 linking is manual, automatic by customer and time, or by booking reference

---

## TR-051 — Student completes a post-lesson interview

**Use Case:** UC-051
**Services:** Learning Loop Service, Agent Gateway, Notification Service
**API Changes:** GET /api/v1/interviews/student/:token [PUBLIC token]; POST /api/v1/interviews/student/:token/answers — partial answers kept; allowed only after lesson completion per import and minor consent
**Schema Changes:** [GATE] StudentLessonAssessment (lessonRef, learnerId, respondent adult|learner, answers json with originalWording, status complete|partial, completedAt) new; LearnerProfile updated by deterministic merge with source tagging
**Auth:** [PUBLIC] signed token, tenant scoped, single learner
**Flags:** i18n, multi-tenant
**Open Technical Questions:** Q10.36 delivery channel and trigger without Booking Core notifications; relation to rating and tip (Booking Core only)

---

## TR-052 — Instructor completes a post-lesson interview

**Use Case:** UC-052
**Services:** Learning Loop Service, Agent Gateway
**API Changes:** GET /api/v1/instructor-interviews?status=open; POST /api/v1/instructor-interviews/:lessonRef/answers — per student with whole-group shortcut; deferral leaves it open
**Schema Changes:** [GATE] InstructorLessonAssessment (lessonRef, learnerId, instructorId, answers json, status) new; learnedProfile updates feed coaching and assignment only, never an evaluation or employment endpoint
**Auth:** instructor (own lessons); learnedProfile readable by school_admin and the instructor, not guests
**Flags:** i18n, multi-tenant
**Open Technical Questions:** Q10.37 Instructor App is not a Phase 2 deliverable, so the interview delivery channel is undecided

---

## TR-053 — View a next-lesson recommendation

**Use Case:** UC-053
**Services:** Learning Loop Service, Matching Service
**API Changes:** GET /api/v1/learners/:id/next-lesson-recommendation — type, level, instructor with reasons, estimate label; not enough data returns a new-intake offer; request goes through TR-047
**Schema Changes:** [GATE] NextLessonRecommendation (learnerId, lessonTypeId, level, instructorId, reasons json, inputRefs, status shown|requested|dismissed, createdAt) new; deterministic from profile, both assessments and availability
**Auth:** guest (own household learners)
**Flags:** i18n, multi-tenant
**Open Technical Questions:** Q10.38 do managers and instructors also see it, and can guests book from it directly

---

## TR-054 — Export or erase a learner's profile and conversation data

**Use Case:** UC-054
**Services:** Privacy Service
**API Changes:** POST /api/v1/learners/:id/data-export — downloadable copy; POST /api/v1/learners/:id/erasure-requests; GET /api/v1/privacy-requests/:id; finds data through the DataClassPolicy registry (TR-030) so no gated class is missed
**Schema Changes:** PrivacyRequest (tenantId, learnerId, type export|erasure, requesterId, status, retainedCategories json, posNotifiedAt, completedAt) new; retained finance and audit records are listed to the requester; POS-owned records are not erased and the school is notified; completion logged without raw personal data
**Auth:** guest (verified head of household for the learner); school_admin on request
**Flags:** multi-tenant
**Open Technical Questions:** Q10.39 who may request on a school's behalf and how instructor learnedProfile data derived from the learner is erased

---

## TR-055 — Parent or guardian consents for a minor

**Use Case:** UC-055
**Services:** Privacy Service, Account & Identity Service
**API Changes:** GET /api/v1/learners/:id/consent-text — versioned; POST /api/v1/learners/:id/consents; POST /api/v1/learners/:id/consents/:consentId/withdraw — stops collection and offers TR-054; gated minor writes return 403 CONSENT_REQUIRED
**Schema Changes:** ConsentRecord (learnerId, adultUserId, consentVersion, grantedAt, withdrawnAt) new; relationship to Learner.parentalConsentGiven (Booking Core booking consent) left as-is
**Auth:** guest (head of household linked to the learner)
**Flags:** i18n, multi-tenant
**Open Technical Questions:** Q10.40 age threshold by province/state and consent wording (legal review pending)

---

# Section B — Booking Core (Phase 3)

## TR-001 — Browse availability with age and skill level filtering

**Use Case:** UC-001
**Services:** Scheduling & Availability Service
**API Changes:** GET /api/v1/availability — `?age=` and `?skillLevel=` params (now in api-design.md); filter by LessonType.skillLevels (six levels, TR-034) and enforce OQ-007 (min age 5)
**Schema Changes:** None (age computed at query time)
**Auth:** [PUBLIC] — no JWT required
**Flags:** i18n (lesson type names returned in EN + FR), performance
**Open Technical Questions:** age param integer or date: GuestCheckout needs learnerDateOfBirth and UC-001 does not say how a date of birth is derived without asking again (Q10.42); how age and skill are gathered per learner for UC-005 (Q10.43)

---

## TR-002 — Soft-hold mechanism (SlotReservation)

**Use Case:** UC-001
**Services:** Booking Engine, Scheduling & Availability Service
**API Changes:** POST /api/v1/slot-reservations — create SlotReservation; return reservationId, sessionToken, expiresAt (TTL = 15 min)
**Schema Changes:** SlotReservation entity exists in v0.7; no changes needed
**Auth:** [PUBLIC] — slot reservation precedes authentication
**Flags:** performance (concurrent reservation race; unique partial index on active slots)

---

## TR-003 — Guest checkout flow

**Use Case:** UC-003
**Services:** Booking Engine, Account & Identity Service, Payment Service
**API Changes:** POST /api/v1/guest-checkouts — record built from session-carried age and skillLevel (not asked again at checkout, decisions.md 2026-03-20); POST /api/v1/bookings — learnerId null, guestCheckoutId set, paymentMethodId null; processor per tenant (TR-070, TR-071)
**Schema Changes:** GuestCheckout entity in v0.7; Booking.learnerId nullable; Booking CHECK (learnerId IS NOT NULL OR guestCheckoutId IS NOT NULL)
**Auth:** [PUBLIC] — guest checkout precedes account creation
**Flags:** PCI (card capture via processor SDK embed), i18n (preferredLanguage on GuestCheckout), multi-tenant
**Open Technical Questions:** Q10.44 post-payment account creation: OQ-048 auto-creates a self-Learner but the pre-populated profile is the guest's learner (possibly a minor); sub-profile vs self-Learner, and whether the guest Booking is re-linked, is undefined

---

## TR-004 — Booking creation with payment capture

**Use Case:** UC-003, UC-004, UC-005
**Services:** Booking Engine, Payment Service
**API Changes:** POST /api/v1/bookings — full payload per api-design.md; sessionToken validated; Payment created atomically; household checkout creates one Booking and one Payment per selected learner
**Schema Changes:** Booking.softReservationId FK → SlotReservation; Payment.paymentType = booking_charge DEFAULT; Payment.platformFeeCents = 1.5% of amountCents
**Auth:** guest (authenticated) or [PUBLIC] (guest checkout)
**Flags:** PCI, multi-tenant
**Open Technical Questions:** 3 DB-write retries after capture (OQ-047), void on final failure (OQ-056); Q10.45 UC-005 multi-learner: number of SlotReservations and sessionTokens, per-learner capacity check, one capture or one per Booking, handling of partial failure

---

## TR-005 — Payment processor abstraction (Stripe + Shift4)

**Use Case:** UC-003, UC-004, UC-005, UC-070, UC-071
**Services:** Payment Service
**API Changes:** POST /api/v1/webhooks/stripe [PUBLIC]; POST /api/v1/webhooks/shift4 [PUBLIC] — webhook receivers for payment events
**Schema Changes:** Tenant.paymentProcessor enum(stripe, shift4); Tenant.paymentCredentials encrypted json (OQ-024)
**Auth:** [PUBLIC] for webhooks; internal-only for charge endpoint
**Flags:** PCI — processorTokenId encrypted at rest via AWS KMS (OQ-046); Shift4 requires Growth+ tier (OQ-005)

---

## TR-006 — Card-on-file storage and one-click checkout

**Use Case:** UC-004, UC-005
**Services:** Account & Identity Service, Payment Service
**API Changes:** POST /api/v1/payment-methods [PCI]; GET /api/v1/payment-methods; DELETE /api/v1/payment-methods/:id; PATCH /api/v1/payment-methods/:id/default
**Schema Changes:** PaymentMethod.processorTokenId encrypted via KMS (token itself lives in the processor-managed vault); PaymentMethod.isValid boolean (false on processor switch; no cross-processor mapping in v1.0)
**Auth:** guest role
**Flags:** PCI

---

## TR-007 — Post-lesson review submission

**Use Case:** UC-007
**Services:** Booking Engine
**API Changes:** POST /api/v1/bookings/:id/review — requires Booking.status = completed (BOOKING_NOT_COMPLETED otherwise); RATING_ALREADY_SUBMITTED if InstructorRating exists; email-link access by booking reference token, no login
**Schema Changes:** InstructorRating entity in v0.7 (bookingId unique; rating 1-5 CHECK); Instructor.averageRating recomputed on insert
**Auth:** guest role (own bookings only) or booking reference token
**Open Technical Questions:** Q10.46 lifetime and revocation of the booking-reference token (for example after cancellation or no-show)

---

## TR-008 — Post-lesson tip submission

**Use Case:** UC-058 (UC-007 entry point)
**Services:** Booking Engine, Payment Service
**API Changes:** POST /api/v1/bookings/:id/tip [PCI] — requires Booking.status = completed; 48h window after Booking.endAt (TIP_WINDOW_EXPIRED); Idempotency-Key required; TIP_ALREADY_SUBMITTED if tip exists; charged through the tenant's processor (TR-070, TR-071)
**Schema Changes:** Payment.paymentType = tip; unique partial index on Payment(bookingId, paymentType) WHERE paymentType = 'tip' — one tip per booking at DB layer
**Auth:** guest role (own bookings only) or booking reference token
**Flags:** PCI
**Open Technical Questions:** tip requires paymentMethodId (stored card); guest-checkout users arriving via email link have no stored card, so a link-based tokenized payment path or account creation is needed

---

## TR-009 — Waitlist join and accept

**Use Case:** UC-008, UC-016
**Services:** Booking Engine
**API Changes:** POST /api/v1/waitlist [PUBLIC or authenticated]; POST /api/v1/waitlist/:id/accept; DELETE /api/v1/waitlist/:id; PATCH /api/v1/waitlist/:id/promote (school_admin)
**Schema Changes:** WaitlistEntry entity in v0.7; CHECK (learnerId IS NOT NULL OR guestEmail IS NOT NULL); position for FIFO (OQ-034); accept window is a fixed 2-hour platform constant (decisions.md 2026-03-26), not Tenant.waitlistAcceptWindowMinutes (Q10.29)
**Auth:** [PUBLIC or authenticated] for join; guest for accept/delete; school_admin for promote
**Flags:** i18n (waitlist notification in preferredLanguage), multi-tenant

---

## TR-010 — Session notes read endpoint

**Use Case:** UC-009, UC-012
**Services:** Booking Engine
**API Changes:** GET /api/v1/bookings/:id/notes — scoped by role (instructor all notes on own bookings; guest only isSharedWithGuest = true)
**Schema Changes:** BookingNote entity in v0.7; no changes
**Auth:** instructor (own bookings); guest (isSharedWithGuest = true only); school_admin (all)

---

## TR-011 — Student check-in endpoint

**Use Case:** UC-010
**Services:** Booking Engine
**API Changes:** PATCH /api/v1/bookings/:id/checkin — sets Booking.checkedInAt = now; status remains confirmed; idempotent
**Schema Changes:** Booking.checkedInAt timestamp nullable (in v0.7)
**Auth:** instructor (own assigned bookings only)

---

## TR-012 — Cancellation and refund

**Use Case:** UC-006
**Services:** Booking Engine, Payment Service
**API Changes:** PATCH /api/v1/bookings/:id/cancel — evaluates CancellationPolicy.refundRules; refund issued through the processor that captured the charge; Booking.status = cancelled
**Schema Changes:** Booking.cancelledAt and cancellationReason in v0.7; CancellationPolicy entity in v0.7
**Auth:** guest (own bookings; guest checkout cannot self-cancel, OQ-033); instructor (own lessons per OQ-058); school_admin (all tenant bookings)
**Flags:** PCI (refund via processor), i18n

---

## TR-013 — Manual lesson completion

**Use Case:** UC-013
**Services:** Booking Engine, Notification Service
**API Changes:** PATCH /api/v1/bookings/:id/complete — Booking.status = completed; autoCompletedAt = null; fires booking.completed (unlocks UC-007/UC-058 flow including the confirmation-email link)
**Schema Changes:** Booking.autoCompletedAt nullable (v0.7); status enum excludes in_progress (OQ-055)
**Auth:** instructor (own assigned bookings); school_admin
**Flags:** i18n (post-lesson email in student's preferredLanguage)

---

## TR-013a — Auto-completion scheduled job

**Use Case:** UC-013
**Services:** Booking Engine (background job)
**API Changes:** None — internal job
**Schema Changes:** Booking.autoCompletedAt set by job (endAt + 2h); AuditLog entry actorType = system
**Auth:** system (no JWT)
**Flags:** performance
**Open Technical Questions:** OQ-065 — scheduler interval TBD (5 min recommended; 15 min acceptable; event-driven requires job queue)

---

## TR-014 — Admin schedule view and real-time updates

**Use Case:** UC-014
**Services:** Scheduling & Availability Service, Booking Engine
**API Changes:** GET /api/v1/schedule?date=&instructorId=; push mechanism for real-time updates TBD (OQ-063)
**Schema Changes:** None
**Auth:** school_admin
**Flags:** performance (opening-day spike)
**Open Technical Questions:** OQ-063 — SSE vs WebSocket vs polling; shared with Manager Console refresh (TR-035)

---

## TR-015 — Instructor reassignment

**Use Case:** UC-014
**Services:** Booking Engine
**API Changes:** PATCH /api/v1/bookings/:id/reassign — { instructorId, reason }; validates conflict (BOOKING_CONFLICT); AuditLog records previous instructorId and reason
**Schema Changes:** None (AuditLog metadata json)
**Auth:** school_admin
**Open Technical Questions:** OQ-066 — reassign payload spec still listed unresolved in UC-014

---

## TR-016 — Bulk cancel

**Use Case:** UC-014, UC-019
**Services:** Booking Engine, Payment Service, Notification Service
**API Changes:** POST /api/v1/bookings/bulk-cancel — { date, instructorId, lessonTypeId }; returns count + total refund; full refunds regardless of policy (OQ-051); fires lesson.weather_cancel
**Schema Changes:** None
**Auth:** school_admin
**Flags:** performance (hundreds of cancellations and refunds in one call), i18n, PCI

---

## TR-017 — Admin walk-up customer account creation

**Use Case:** UC-021
**Services:** Account & Identity Service
**API Changes:** POST /api/v1/users (school_admin) — creates User + Household + Learner atomically; collects learnerDateOfBirth and six-level skillLevel with source in the walk-up form (decisions.md 2026-11-01); returns { userId, householdId, learnerId }
**Schema Changes:** None (User, Household, Learner in v0.7; skill scale per TR-034)
**Auth:** school_admin
**Flags:** i18n, multi-tenant

---

## TR-018 — Certification management

**Use Case:** UC-015
**Services:** Instructor Service
**API Changes:** GET/POST /api/v1/instructors/:id/certifications; PATCH /api/v1/instructors/:id/certifications/:certId
**Schema Changes:** Certification entity in v0.7
**Auth:** school_admin (write); instructor (read own); [PUBLIC] certificationStatus computed field

---

## TR-019 — Cancellation policy management

**Use Case:** UC-017
**Services:** Catalog & Lesson Service
**API Changes:** GET/POST /api/v1/cancellation-policies; PATCH /api/v1/cancellation-policies/:id and /:id/default
**Schema Changes:** CancellationPolicy entity in v0.7; UNIQUE partial index (tenantId, isDefault) WHERE isDefault = true
**Auth:** school_admin
**Flags:** multi-tenant

---

## TR-020 — Notification events and .ics attachment

**Use Case:** UC-020
**Services:** Notification Service
**API Changes:** No HTTP endpoint; events: booking.confirmed (+ .ics and post-lesson link), booking.cancelled, booking.completed, waitlist.slot_available (2-hour link), booking.reminder, lesson.weather_cancel, instructor.cert_expiry
**Schema Changes:** None
**Auth:** system internal
**Flags:** i18n
**Open Technical Questions:** SendGrid confirmed (OQ-016); overlay-side notifications (TR-046, TR-051) have no event contract yet (Q10.28, Q10.36)

---

## TR-021 — Password reset endpoints

**Use Case:** OQ-062 (P0 vs P1 unresolved)
**Services:** Account & Identity Service
**API Changes:** POST /api/v1/auth/forgot-password [PUBLIC]; POST /api/v1/auth/reset-password [PUBLIC]
**Schema Changes:** PasswordResetToken in v0.7 (single-use)
**Auth:** [PUBLIC]
**Open Technical Questions:** OQ-062 — P0 or P1; entity ships now, endpoints behind a feature flag if deferred; also gates Manager Console sign-in (Q10.18)

---

## TR-022 — Language preference update

**Use Case:** UC-022
**Services:** Account & Identity Service
**API Changes:** PATCH /api/v1/me — preferredLanguage
**Schema Changes:** User.preferredLanguage and GuestCheckout.preferredLanguage in v0.7
**Auth:** guest, instructor, school_admin
**Flags:** i18n

---

## TR-023 — Instructor availability with RRULE recurrence

**Use Case:** UC-023
**Services:** Scheduling & Availability Service
**API Changes:** POST /api/v1/instructors/:id/availability; PATCH and DELETE /api/v1/instructors/:id/availability/:slotId
**Schema Changes:** Availability.recurrence json → text (RRULE) per v0.7 migration
**Auth:** instructor (own); school_admin (all)

---

## TR-056 — Bulk create lessons for a group program

**Use Case:** UC-056
**Services:** Catalog & Lesson Service, Scheduling & Availability Service, Booking Engine (GroupSession)
**API Changes:** POST /api/v1/group-programs (path proposed; api-design endpoint to be defined) — { lessonTypeId, weekday, startTime, startDate, weeks, instructorId }; one request creates one GroupSession per weekly occurrence; returns { created[], flagged[{week, reason}] }; a conflicting week is flagged and not created, other weeks are created (partial success); Idempotency-Key required
**Schema Changes:** GroupSession.programId uuid nullable — generated per request to group a program's sessions (additive, no new entity); capacity from LessonType.maxCapacity
**Auth:** school_admin
**Flags:** multi-tenant, performance
**Open Technical Questions:** Q10.47 final endpoint path and request shape; Q10.48 timezone and DST handling for weekly occurrences and maximum weeks per request; Q10.49 how the admin later fixes a flagged week (retry one week vs new request)

---

## TR-057 — Modify one booking without affecting others

**Use Case:** UC-057
**Services:** Booking Engine
**API Changes:** None defined: api-design.md has only the admin PATCH /api/v1/bookings/:id/reassign; any modify endpoint must re-validate availability (BOOKING_CONFLICT) and touch only the chosen Booking and its own Payment
**Schema Changes:** None
**Auth:** guest (own household bookings); school_admin
**Flags:** multi-tenant
**Open Technical Questions:** Q10.50 what is modifiable (time, instructor, learner) and whether fees or policy windows apply; blocks the API definition

---

## TR-070 — Charge a booking via Stripe

**Use Case:** UC-070
**Services:** Payment Service
**API Changes:** POST /api/v1/payments/charge (internal) — Stripe path in tenant currency, integer cents, platformFeeCents = 1.5%, Idempotency-Key scoped to reservationId; POST /api/v1/webhooks/stripe verified with webhookSecret; refunds (UC-006) and tips (UC-058) use the same account
**Schema Changes:** Tenant.paymentCredentials validated as { secretKey, webhookSecret } both required, KMS-encrypted; Payment.processor = stripe (v0.7)
**Auth:** internal charge; [PUBLIC] webhook
**Flags:** PCI, multi-tenant
**Open Technical Questions:** Q10.51 webhook tenant resolution: one path for all tenants but each has its own webhookSecret, so tenant lookup (path slug or event account id) must be defined

---

## TR-071 — Charge a booking via Shift4 (Growth+ tenants)

**Use Case:** UC-071
**Services:** Payment Service
**API Changes:** POST /api/v1/payments/charge (internal) — Shift4 path, same contract as TR-070; POST /api/v1/webhooks/shift4 verified with webhookSecret; setting paymentProcessor = shift4 on a Starter tenant is refused (422 SHIFT4_TIER_REQUIRED, proposed code)
**Schema Changes:** Tenant.paymentCredentials validated as { model: direct, apiKey, merchantId, webhookSecret } all required, KMS-encrypted; no platform MID or PayFac
**Auth:** internal charge; [PUBLIC] webhook; processor config by school_admin or operator
**Flags:** PCI, multi-tenant
**Open Technical Questions:** Q10.52 same webhook tenant resolution as Q10.51; processor switch invalidates stored cards (PaymentMethod.isValid = false, v1.0 decision)

---

## Gap Analysis

1. No overlay endpoint (imports, issues, plans, decisions, outcomes, audit, agent) exists in api-design.md (TR-035 to TR-044)
2. No SkiMatch endpoint (intakes, matches, placement, linking, interviews, recommendation) exists in api-design.md (TR-047 to TR-053)
3. No privacy endpoint (consent, export, erasure, data-class policy) in api-design.md (TR-030, TR-054, TR-055)
4. data-model.md v0.7 has none of the operating-model, SkiMatch, privacy or POSAdapter entities (see summary)
5. Imported POS lessons, learners and instructors cannot be stored with current constraints (Booking.cancellationPolicyId, Learner.householdId/dateOfBirth, Instructor.userId) (Q10.12)
6. Six-level skill scale and source absent from data-model.md and api-design.md (register, guest-checkouts, availability, lesson-types) (TR-034)
7. POST /api/v1/group-programs (bulk group program) absent from api-design.md; GroupSession has no endpoints at all (TR-056)
8. No guest-facing booking modification endpoint (UC-057, TR-057)
9. Tenant.waitlistAcceptWindowMinutes in data-model.md conflicts with the fixed 2-hour decision (Q10.29)
10. User.tenantId single FK cannot express admins of several schools (TR-041)
11. Retention periods and erasure behavior for new data types are undefined, and decisions.md erasure scope covers Booking Core types only (TR-030)
12. Overlay audit retention undefined; AuditLog 3-year cap is Booking Core only (Q10.25)
13. Notification Service has no overlay events (offers, interview links); Booking Core events only (Q10.28, Q10.36)
14. Instructor App is not a Phase 2 deliverable but UC-052 needs it (Q10.37)
15. Multi-learner household checkout (UC-005) has no reservation or payment semantics (Q10.45)
16. Webhook tenant resolution for /webhooks/stripe and /webhooks/shift4 undefined (Q10.51)
17. Phase 1 pilot console access and auth model undefined (Q10.19)
18. Model provider and no-training/no-retention terms undecided (Q10.8)
19. Real-time/refresh mechanism for import and console (OQ-063) and auto-completion interval (OQ-065) unresolved
20. OQ-062 password reset scope unresolved and blocks console sign-in method; GET /api/v1/instructors/:id/earnings has no response payload

---

## Schema Changes Summary

All entities below are new proposals absent from data-model.md v0.7. Run 9 changes already applied in v0.7 are omitted.

Entity.field — type — additive/destructive — TR reference
1. POSReference — new entity — additive — TR-031, TR-035, TR-050
2. PosConnection — new entity — additive — TR-031
3. Tenant.operatingMode (enum overlay, booking_core) and Tenant.realDataEnabled (boolean default false) — additive — TR-031, TR-030
4. DataClassPolicy — new entity — additive — TR-030
5. PolicyRule — new entity — additive — TR-032
6. Learner.skillLevel — enum three-level to six-level — destructive (migration) — TR-034
7. Learner.skillLevelSource — enum — additive — TR-034
8. GuestCheckout.skillLevel, Booking.skillLevelAtBooking, LessonType.skillLevels — six-level enum — destructive (migration) — TR-034
9. ImportBatch, ImportFlag — new entities — additive — TR-035, TR-036
10. OperationalIssue — new entity — additive — TR-037
11. ResolutionPlan — new entity — additive — TR-038
12. ProposedAction — new entity — additive — TR-038
13. ActionValidation — new entity — additive — TR-038, TR-032
14. AgentConversation, AgentMessage — new entities [GATE] — additive — TR-039
15. OperationalObservation — new entity [GATE] — additive — TR-040
16. TenantMembership — new entity — additive — TR-041
17. ManagerDecision — new entity — additive — TR-042
18. ActionOutcome — new entity — additive — TR-043
19. WaitlistOffer — new entity — additive — TR-046
20. IntakeSession, IntakeMessage — new entities [GATE] — additive — TR-047
21. LearnerProfile — new entity [GATE] — additive — TR-047
22. InstructorProfile — new entity — additive — TR-048
23. IntakeMatch — new entity — additive — TR-048
24. GroupPlacementRequest — new entity — additive — TR-049
25. LessonType.groupMode — enum(customer_selected, school_composed) — additive — TR-049
26. StudentLessonAssessment — new entity [GATE] — additive — TR-051
27. InstructorLessonAssessment — new entity [GATE] — additive — TR-052
28. NextLessonRecommendation — new entity [GATE] — additive — TR-053
29. PrivacyRequest, ConsentRecord — new entities — additive — TR-054, TR-055
30. GroupSession.programId — uuid nullable — additive — TR-056
