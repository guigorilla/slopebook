# Slopebook — Cross-Document Consistency Report

**Document Status:** Draft — Run 3
**Last Updated:** 2026-03-26
**Author:** Consistency-Checker Agent
**Pipeline Run:** Run 3 (2026-03-26)
**Documents Read:**
- `design-docs/overview.md`
- `design-docs/data-model.md` (v0.2)
- `design-docs/api-design.md`
- `design-docs/ux-flows.md`
- `design-docs/open-questions.md` (Run 2 resolved decisions + Run 3 draft update)
- `design-docs/drafts/use-cases.md` (Run 3)
- `design-docs/drafts/tech-requirements.md` (Run 3)
- `design-docs/drafts/asset-list-proposed.md` (Run 3)
- `design-docs/drafts/data-model-proposed.md` (v0.3)
- `design-docs/drafts/open-questions-proposed.md` (Run 3)
- `design-docs/drafts/critique.md` (Run 3)

---

## Terminology Conflicts

### TC-001 — `currentCapacity` vs `currentEnrollment` (GroupSession)

- **Term A:** `currentCapacity` — used in `data-model.md` (v0.2) §GroupSession
- **Term B:** `currentEnrollment` — used in `tech-requirements.md` TR-019, TR-020; `use-cases.md` UC-019, UC-020
- **Where each appears:**
  - `data-model.md` v0.2: `currentCapacity integer, default 0`
  - `tech-requirements.md` TR-019: "v0.2 uses `currentCapacity` as the field name; use cases use `currentEnrollment`. Rename to `currentEnrollment` for clarity. (SC-019.)"
  - `use-cases.md` UC-019: "`GroupSession.currentEnrollment` incremented"
  - `data-model-proposed.md` v0.3: field renamed to `currentEnrollment` via SC-019
- **Recommendation:** Standardise on `currentEnrollment`. The rename is already applied in `data-model-proposed.md` v0.3. `data-model.md` v0.2 is the only remaining document using the old name and will be superseded when v0.3 is promoted.

---

### TC-002 — `priceAmount` vs `priceAmountCents` (LessonType)

- **Term A:** `priceAmount decimal` — used in `data-model.md` (v0.2) §LessonType; `tech-requirements.md` (baseline TR-DC-009 references `LessonType.priceAmount`)
- **Term B:** `priceAmountCents integer` — used in `data-model-proposed.md` v0.3 §LessonType (SC-015 rename)
- **Where each appears:**
  - `data-model.md` v0.2: `priceAmount decimal`
  - `data-model-proposed.md` v0.3: `priceAmountCents integer`
  - `tech-requirements.md` GAP-003 proposed `LessonPackageTemplate` schema uses `priceAmount decimal` (line 947), inconsistent with the v0.3 rename
- **Recommendation:** Standardise on `priceAmountCents integer`. The v0.3 rename is motivated by a valid platform-wide rule (monetary amounts in integer cents). The `LessonPackageTemplate` schema in `tech-requirements.md` GAP-003 must be updated to match.

---

### TC-003 — `purchasePaymentId` vs `paymentId` (LessonPackage payment reference)

- **Term A:** `purchasePaymentId` — used in `tech-requirements.md` GAP-003 proposed `LessonPackage` schema
- **Term B:** `paymentId` — used in `data-model-proposed.md` v0.3 §LessonPackage (`paymentId uuid, FK → Payment`)
- **Where each appears:**
  - `tech-requirements.md` GAP-003: `purchasePaymentId uuid, FK → Payment`
  - `data-model-proposed.md` v0.3: `paymentId uuid, FK → Payment`
- **Recommendation:** Standardise on `paymentId` as defined in `data-model-proposed.md` v0.3. The tech-requirements document must be updated.

---

### TC-004 — `lessonCount` / `totalCount` vs `creditCount` (LessonPackage credits)

- **Term A:** `lessonCount` — used in `tech-requirements.md` GAP-003 `LessonPackage` (`totalCount integer`, `remainingCount integer`)
- **Term B:** `creditCount` — used elsewhere in `data-model-proposed.md` v0.3 context
- **Note:** `data-model-proposed.md` v0.3 §LessonPackageTemplate uses `lessonCount integer` and §LessonPackage uses `remainingCount integer`. The proposed `LessonPackage` in `tech-requirements.md` GAP-003 has both `totalCount` and `remainingCount` while v0.3 has only `remainingCount` (no `totalCount` stored separately).
- **Where each appears:**
  - `tech-requirements.md` GAP-003: `totalCount integer`, `remainingCount integer` on `LessonPackage`
  - `data-model-proposed.md` v0.3: `remainingCount integer` only on `LessonPackage`; `lessonCount integer` is on `LessonPackageTemplate`
- **Recommendation:** Standardise on the v0.3 split: `lessonCount` on `LessonPackageTemplate` (the template definition); `remainingCount` on `LessonPackage` (the active instance). No `totalCount` stored separately — initial value can be derived from the template.

---

### TC-005 — "upcoming" vs "confirmed" (Booking status in narrative)

- **Term A:** "upcoming" — used in `use-cases.md` UC-008 preconditions ("bookings in 'upcoming' or 'confirmed' status"), UC-023 alternate flow 5a ("override status back to 'upcoming'"); `ux-flows.md` implicit phrasing
- **Term B:** `confirmed` — the only pre-lesson active status in `Booking.status enum(confirmed, in_progress, completed, cancelled, no_show)` in `data-model.md` v0.2 and `data-model-proposed.md` v0.3
- **Where each appears:**
  - `use-cases.md` UC-008: "At least one upcoming booking exists in 'upcoming' or 'confirmed' status"
  - `use-cases.md` UC-023 alt 5a: "admin overrides `Booking.status` back to `upcoming`"
  - `data-model.md` v0.2 / `data-model-proposed.md` v0.3: no `upcoming` in the status enum
- **Recommendation:** Standardise on `confirmed`. "Upcoming" is acceptable as a UI display label but must not be used as an enum value. UC-008 and UC-023 should refer to `confirmed` status. The revert target in UC-023 alt 5a should be `confirmed` or `in_progress` depending on whether the lesson has already begun.

---

## Cross-Document Contradictions

### CON-001 — Tip charge endpoint: `POST /api/v1/bookings/:id/tip` vs `POST /api/v1/bookings/:id/review`

- **Document A:** `use-cases.md` UC-010 step 6: "system initiates a separate charge via `POST /api/v1/bookings/:id/tip`"
- **Document B:** `api-design.md` §Booking Engine: "`POST /api/v1/bookings/:id/review` — Submit tip and rating after lesson completion"; `tech-requirements.md` TR-010: "Must validate `Booking.status = completed` before accepting submission" (explicitly referring to `POST /api/v1/bookings/:id/review`)
- **Sections in conflict:**
  - `use-cases.md` §UC-010, step 6
  - `api-design.md` §Booking Engine (last entry)
  - `tech-requirements.md` TR-010
  - `open-questions.md` OQ-023 decision: "Tip and rating submitted via a separate post-lesson flow" (does not name the endpoint explicitly but TR-010 does)
- **Precedence:** `api-design.md` and `tech-requirements.md` are consistent with each other. `use-cases.md` UC-010 step 6 contains the incorrect endpoint name. **`api-design.md` (`/review`) should take precedence.** `use-cases.md` UC-010 step 6 must be corrected to use `POST /api/v1/bookings/:id/review`.

---

### CON-002 — Weather cancellation booking status: `cancelled_weather` vs `cancelled` + `cancellationReason = "weather"`

- **Document A:** `use-cases.md` UC-029 step 5: "System cancels all selected bookings, sets status to `cancelled_weather`"
- **Document B:** `tech-requirements.md` TR-029: "Booking status for weather cancellations: use `Booking.status = cancelled` + `Booking.cancellationReason = 'weather'`. Do not add a `cancelled_weather` enum value"
- **Document C:** `data-model-proposed.md` v0.3 §Booking: "`cancellationReason string, nullable — weather cancellations use value 'weather' per TR-029; no additional enum value added`"
- **Sections in conflict:**
  - `use-cases.md` §UC-029, step 5
  - `tech-requirements.md` TR-029
  - `data-model-proposed.md` v0.3 §Booking notes
- **Precedence:** `tech-requirements.md` and `data-model-proposed.md` are consistent with each other. `use-cases.md` UC-029 introduces a non-existent enum value. **`tech-requirements.md` should take precedence.** `use-cases.md` UC-029 step 5 must be corrected — `cancelled_weather` does not exist in the Booking status enum.

---

### CON-003 — Google Calendar sync: present in `ux-flows.md`, deferred to v1.5 by OQ-021

- **Document A:** `ux-flows.md` §3 Instructor App — Availability Management: "└── Sync with Google Calendar (optional)"
- **Document B:** OQ-021 decision (in `open-questions.md`): "Deferred to v1.5. `OAuthToken` entity removed from data model v0.3. Must not appear in any v1.0 code path (DEFERRED-001)."
- **Document C:** `use-cases.md` UC-025 alt flow 3a: "Google Calendar sync — deferred to v1.5 (OQ-021)... References to Google Calendar sync must not appear in v1.0 instructor UI."
- **Sections in conflict:**
  - `ux-flows.md` §3 Availability Management
  - `open-questions.md` OQ-021 resolved decision
  - `use-cases.md` UC-025 alt 3a
- **Precedence:** OQ-021 is a resolved decision. **`open-questions.md` and `use-cases.md` should take precedence.** `ux-flows.md` must remove the Google Calendar sync line from the Availability Management section and add a DEFERRED-001 note.

---

### CON-004 — OAuthToken entity present in `data-model.md` (v0.2) but explicitly deferred by OQ-021

- **Document A:** `data-model.md` v0.2 §OAuthToken: full entity definition including `accessToken`, `refreshToken`, encryption scope, and key-relationships diagram entry
- **Document B:** OQ-021 decision: "Deferred to v1.5. `OAuthToken` entity removed from data model v0.3. Must not appear in any v1.0 code path (DEFERRED-001)."
- **Sections in conflict:**
  - `data-model.md` v0.2 §OAuthToken, §3 Key Relationships, §5 Encryption & PCI Scope
  - `open-questions.md` OQ-021 resolved decision
- **Precedence:** OQ-021 is a resolved decision and `data-model-proposed.md` v0.3 has already removed the entity (CR-001). **`data-model-proposed.md` v0.3 is correct; `data-model.md` v0.2 is stale on this point.** Engineering must use v0.3 as the schema source of truth for `OAuthToken`.

---

### CON-005 — `Payment.groupSessionId` defined in `data-model.md` (v0.2) but blocked by OQ-031

- **Document A:** `data-model.md` v0.2 §Payment: "`groupSessionId uuid, FK → GroupSession, nullable`" with a CHECK constraint requiring either `bookingId` or `groupSessionId` to be non-null
- **Document B:** `tech-requirements.md` TR-019: "OQ-031 (unresolved): `Payment.groupSessionId` must NOT be implemented."
- **Document C:** `data-model-proposed.md` v0.3: field removed with DEFERRED-002 callout; CHECK constraint relaxed
- **Sections in conflict:**
  - `data-model.md` v0.2 §Payment
  - `tech-requirements.md` TR-019
  - `data-model-proposed.md` v0.3 §Payment
- **Precedence:** `tech-requirements.md` and `data-model-proposed.md` v0.3 are consistent. The v0.2 CHECK constraint is also incompatible with `paymentType = package_purchase` records (a concrete data-integrity bug identified in critique CR-002). **`data-model-proposed.md` v0.3 should take precedence.** Engineering must not implement `Payment.groupSessionId` until OQ-031 is resolved.

---

### CON-006 — OQ-023 decision text vs its own `tipAmountCents` guidance (internal contradiction)

- **Document A:** `open-questions.md` OQ-023 **Status/Decision** block, first paragraph: "`tipAmountCents` removed from booking payload. Tip and rating submitted via a separate post-lesson flow."
- **Document B:** `open-questions.md` OQ-023 **Status/Decision** block, second paragraph: "POST /api/v1/bookings payload additions: - tipAmountCents: integer, nullable, must be >= 0 if present"
- **Sections in conflict:** Both within `open-questions.md` OQ-023 decision text
- **Precedence:** The first paragraph is the authoritative decision. The second paragraph appears to be a draft artefact containing `tipAmountCents` in the booking payload despite the decision explicitly removing it. `tech-requirements.md` TR-004 and TR-010 both correctly reflect the removal. **The second paragraph of the OQ-023 decision text must be corrected** — `tipAmountCents` should be removed from the listed booking payload additions.

---

### CON-007 — InstructorRating visibility: "internal-only" vs visible to guests browsing

- **Document A:** `open-questions.md` OQ-028 decision: "(a) Instructor rating is internal only."
- **Document B:** `use-cases.md` UC-002 step 3: "Ratings are internal-only (visible to guests browsing but not publicly indexed)"
- **Document C:** `tech-requirements.md` TR-002: "Aggregate rating values (`ratingAvg`, `ratingCount`) are included in public responses per OQ-028."
- **Document D:** `data-model-proposed.md` v0.3 §InstructorRating: "Ratings are internal-only (OQ-028). Visible to guests browsing within the tenant. Not exposed via public search-indexed endpoints."
- **Sections in conflict:**
  - `open-questions.md` OQ-028 decision ("internal only" as a single phrase)
  - `use-cases.md` UC-002 step 3, TR-002, `data-model-proposed.md` v0.3 (all clarify that aggregate values are visible to browsing guests but not publicly indexed)
- **Precedence:** The OQ-028 decision uses "internal only" loosely. The consistent interpretation across use-cases, tech-requirements, and data-model-proposed is that aggregate denormalised fields (`ratingAvg`, `ratingCount`) appear in the booking-widget instructor browse response (i.e., visible to unauthenticated guests within a tenant's widget), but individual `InstructorRating` records are never exposed and no external search-engine-indexed endpoint exists. This interpretation is internally consistent across three documents and is the more precise reading. **OQ-028's "internal only" phrasing is ambiguous and should be clarified to match the three-document consensus.**

---

### CON-008 — Ratings: "no minimum booking count" vs display gating discussion

- **Document A:** `open-questions.md` OQ-028 decision: "(c) no minimum"
- **Document B:** `use-cases.md` UC-002 step 3: "there is no minimum booking count required before a rating displays (OQ-028 resolved)"
- **Consistency:** These two documents agree. No contradiction.

---

## Use Case / API Misalignments

### UAP-001 — UC-022 (Check-In a Student): no `PATCH /api/v1/bookings/:id/checkin` in `api-design.md`

- **Use Case:** UC-022 — Check In a Student (P0)
- **Required endpoint per `tech-requirements.md` TR-022:** `PATCH /api/v1/bookings/:id/checkin`
- **Status in `api-design.md`:** Absent. The Booking Engine section lists `PATCH /api/v1/bookings/:id/complete` and `PATCH /api/v1/bookings/:id/no-show` but not `/checkin`.
- **Impact:** The check-in flow sets `Booking.status = in_progress` and records `checkedInAt`. Without the endpoint in the API contract, the instructor PWA and booking engine will be built against inconsistent assumptions. This is a P0 use case.

---

### UAP-002 — UC-031 (Manage Instructor Certification Records): five certification endpoints absent from `api-design.md`

- **Use Case:** UC-031 (P0)
- **Required endpoints per `tech-requirements.md` TR-031:**
  - `GET /api/v1/instructors/:id/certifications`
  - `POST /api/v1/instructors/:id/certifications`
  - `PATCH /api/v1/instructors/:id/certifications/:certId`
  - `DELETE /api/v1/instructors/:id/certifications/:certId`
  - `POST /api/v1/instructors/:id/certifications/:certId/document`
- **Status in `api-design.md`:** All five are absent.
- **Impact:** Certification tracking, expiry alerting, and assignment blocking (all P0) cannot be built without these endpoints.

---

### UAP-003 — UC-037 (Right-to-Erasure): no erasure endpoints in `api-design.md`

- **Use Case:** UC-037 (P1, Beta, GDPR/PIPEDA compliance)
- **Required endpoints per `tech-requirements.md` TR-037:**
  - `POST /api/v1/admin/erasure-requests`
  - `POST /api/v1/admin/erasure-requests/:id/confirm`
- **Status in `api-design.md`:** Absent.
- **Impact:** GDPR/PIPEDA compliance feature for Beta has no API contract. The feature cannot be built.

---

### UAP-004 — UC-038 (Configure Resort-Level Policies): `PATCH /api/v1/tenants/:id` absent from `api-design.md`

- **Use Case:** UC-038 (P2, v1.0 GA)
- **Required endpoint per `tech-requirements.md` TR-038:** `PATCH /api/v1/tenants/:id`
- **Status in `api-design.md`:** Absent (identified as GAP-011 in TR-038).
- **Impact:** The Resort Operator cannot configure currency, default language, or cancellation policy defaults without this endpoint.

---

### UAP-005 — UC-039 (Configure Payment Processor): two payment-config endpoints absent from `api-design.md`

- **Use Case:** UC-039 (P2, v1.0 GA)
- **Required endpoints per `tech-requirements.md` TR-039:**
  - `POST /api/v1/tenants/:id/payment-config`
  - `POST /api/v1/tenants/:id/payment-config/test`
- **Status in `api-design.md`:** Absent.
- **Impact:** No API contract for payment processor configuration. Operator portal cannot be built for v1.0 GA.

---

### UAP-006 — UC-040 (White-Label Widget): three white-label endpoints absent from `api-design.md`

- **Use Case:** UC-040 (P2, v1.0 GA)
- **Required endpoints per `tech-requirements.md` TR-040:**
  - `POST /api/v1/tenants/:id/white-label`
  - `PATCH /api/v1/tenants/:id/white-label`
  - `GET /api/v1/tenants/:id/white-label/verify`
- **Status in `api-design.md`:** Absent.
- **Impact:** No API contract for the white-label configuration feature.

---

### UAP-007 — UC-017 (Purchase a Lesson Package): two package endpoints absent from `api-design.md`

- **Use Case:** UC-017 (P1, Beta)
- **Required endpoints per `tech-requirements.md` TR-017:**
  - `GET /api/v1/lesson-packages/templates`
  - `POST /api/v1/lesson-packages/purchase`
- **Status in `api-design.md`:** Absent.
- **Impact:** Lesson package purchase — a confirmed Beta deliverable — has no API contract.

---

### UAP-008 — UC-019/UC-020 (Group Lessons): group-session endpoints absent from `api-design.md`

- **Use Cases:** UC-019, UC-020 (P1, Beta)
- **Required endpoints per `tech-requirements.md` TR-019, TR-020:**
  - `GET /api/v1/group-sessions?lessonTypeId=&date=`
  - `GET /api/v1/group-sessions/:id`
  - `PATCH /api/v1/group-sessions/:id`
  - `POST /api/v1/group-sessions/:id/instructors`
  - `POST /api/v1/group-sessions/bulk-create`
- **Status in `api-design.md`:** Absent.
- **Impact:** Group lesson booking and management — confirmed Beta deliverables — have no API contract.

---

### UAP-009 — UC-003 (Soft Hold): `POST /api/v1/slot-reservations` and `DELETE /api/v1/slot-reservations/:id` absent from `api-design.md`

- **Use Case:** UC-003 (P0, Alpha)
- **Required endpoints per `tech-requirements.md` TR-003:**
  - `POST /api/v1/slot-reservations`
  - `DELETE /api/v1/slot-reservations/:id`
- **Status in `api-design.md`:** Absent.
- **Impact:** The soft-hold mechanism is a hard Alpha requirement. Without these endpoints in the API contract, both the booking widget and the booking engine have no formal interface to implement against.

---

### UAP-010 — UC-042 (API Keys and Webhooks): API key and webhook management endpoints absent from `api-design.md`

- **Use Case:** UC-042 (P2, v1.0 GA)
- **Required endpoints per `tech-requirements.md` TR-042:**
  - `POST /api/v1/api-keys`
  - `DELETE /api/v1/api-keys/:id`
  - `POST /api/v1/webhooks`
  - `PATCH /api/v1/webhooks/:id`
  - `DELETE /api/v1/webhooks/:id`
  - `POST /api/v1/webhooks/:id/test`
- **Status in `api-design.md`:** Absent (though the operator portal UX flow mentions webhook configuration, no API contract exists).
- **Impact:** Integration features for v1.0 GA have no API contract.

---

### UAP-011 — UC-032 (Extend Package Expiry): `PATCH /api/v1/lesson-packages/:id/extend` absent from `api-design.md`

- **Use Case:** UC-032 (P1, Beta)
- **Required endpoint per `tech-requirements.md` TR-032:** `PATCH /api/v1/lesson-packages/:id/extend`
- **Status in `api-design.md`:** Absent.

---

## Use Case / Screen Misalignments

### UAS-001 — UC-036 instructor self-registration / invite-link landing: no screen defined

- **Use Case:** UC-036 (P0) — Instructor Onboarding and Approval Workflow
- **Gap:** `asset-list-proposed.md` defines an "Instructor App — Onboarding Profile" screen at `/profile/setup` for the profile-completion step but identifies no entry-point screen for the initial registration or invite-link landing.
- **Asset list flag:** `asset-list-proposed.md` §Flags explicitly notes: "UC-036 Instructor self-registration — ux-flows.md has no entry point for new-instructor registration or invite-link landing. Need a `/register` or `/invite/:token` screen."

---

### UAS-002 — UC-016 expired waitlist token landing: no dedicated screen defined

- **Use Case:** UC-016 — Accept a Waitlist Notification
- **Gap:** The `asset-list-proposed.md` "Customer App — Waitlist Accept" screen at `/waitlist/:token/accept` includes an "expired" terminal state, but the flag section explicitly calls out that an expired-token landing screen needs a dedicated design pass.
- **Asset list flag:** "UC-016 Waitlist token expiry — expired-token landing screen required for `/waitlist/:token/accept` when TTL has passed."

---

### UAS-003 — UC-022 offline/mountain mode: no defined screen or state

- **Use Case:** UC-022 — Check In a Student (P0, Alpha)
- **Gap:** The instructor PWA must function on degraded mountain wireless. `asset-list-proposed.md` notes the WaiverEmbed component has an `offlineMode` prop and the Check-In screen has an "offline-fallback" state, but no full offline shell or degraded-mode screen is specified.
- **Asset list flag:** "UC-022 Offline/mountain mode — ux-flows.md does not address PWA offline state. WaiverEmbed fallback and general offline shell need a design pass before Alpha."

---

### UAS-004 — UC-045 processor-agnostic payment error copy: no screen or content spec

- **Use Case:** UC-045 — Payment Processing Abstraction (P0, Alpha)
- **Gap:** No payment error message screen or content specification exists in `asset-list-proposed.md`. Error copy must be written in EN + FR before Alpha, and raw processor codes must not be exposed.
- **Asset list flag:** "UC-045 Processor-agnostic error copy — payment error messages must be written in EN + FR before Alpha."

---

### UAS-005 — UC-010 post-lesson review for guest-checkout path: no dedicated screen for one-time token entry

- **Use Case:** UC-010 step 6a — guest-checkout user without a card on file submitting a tip
- **Gap:** The "Customer App — Post-Lesson: Rate & Tip" screen at `/lessons/:id/review` is defined. However, the asset list does not distinguish the guest-checkout path (one-time review token in email, no JWT, card entry required for tip) from the authenticated path. No separate screen or distinct state is called out for the unauthenticated token-auth variant of this screen.

---

## Data Model / API Misalignments

### DAP-001 — `api-design.md` booking payload references `learnerId` as required; `data-model-proposed.md` makes it nullable

- **API document:** `api-design.md` §Booking Engine booking request payload: `"learnerId": "uuid"` (no indication of nullability)
- **Data model:** `data-model.md` v0.2 and `data-model-proposed.md` v0.3 §Booking: `learnerId uuid, FK → Learner, nullable` (nullable to support guest checkout, CRT-H-003)
- **Impact:** The API contract implies `learnerId` is always required. Guest checkout — which is a P0 Alpha feature — uses `guestCheckoutId` instead and has no `learnerId`. The booking payload in `api-design.md` must be updated to reflect nullable `learnerId` and the mutually exclusive `guestCheckout` object.
- **Tech-requirements reference:** TR-004 correctly documents the guest-checkout payload variant with `guestCheckout: { email, firstName, lastName, phone? }` replacing `learnerId`.

---

### DAP-002 — `api-design.md` booking payload does not include `reservationId` or `sessionToken` (OQ-023 resolved)

- **API document:** `api-design.md` §Booking Engine booking request payload: contains `"reservationId": "uuid | null"` and `"sessionToken": "string | null"` — these are actually present in the existing api-design.md
- **Status:** No misalignment. OQ-023 is resolved and the fields appear in `api-design.md`. **No issue.**

---

### DAP-003 — `Instructor` response fields referenced in API include `ratingAvg` and `ratingCount`, absent from `data-model.md` v0.2

- **API document:** `tech-requirements.md` TR-002: "Response must include: `photoUrl`, `displayName`, `bioEn`, `bioFr`, `languagesSpoken`, certifications (body + level), `ratingAvg`, `ratingCount`."
- **Data model:** `data-model.md` v0.2 §Instructor: neither `ratingAvg` nor `ratingCount` is present
- **Proposed fix:** `data-model-proposed.md` v0.3 adds both fields (SC-001, SC-002)
- **Impact:** Any engineer building against `data-model.md` v0.2 alone will produce an `Instructor` table missing the rating fields required by the API response. v0.3 must be promoted before Beta development begins.

---

### DAP-004 — Certification sub-resource endpoints in `tech-requirements.md` reference `Certification` entity fields not yet in `api-design.md`

- **API document:** `api-design.md` §Instructor Service: no certification sub-resource endpoints
- **Data model:** `data-model-proposed.md` v0.3 defines the `Certification` entity with `body`, `level`, `expiresAt`, `alert60SentAt`, `alert30SentAt`, `alert7SentAt`, `documentUrl`
- **Impact:** Five endpoints are absent from `api-design.md` (see UAP-002). The three-threshold alert fields (`alert60SentAt`, `alert30SentAt`, `alert7SentAt`) replacing the single `alertSentAt` in v0.2 are inconsistent with the background-job query described in `data-model.md` v0.2 §Certification notes (which references only a single `alertSentAt`).

---

### DAP-005 — `LessonPackageTemplate` admin CRUD endpoints referenced in data model but absent from `api-design.md`

- **Data model note:** `data-model-proposed.md` v0.3 §LessonPackageTemplate: "Admin CRUD endpoints for templates (`POST/PATCH/DELETE /api/v1/lesson-package-templates`) are not yet in `api-design.md`. See GAP-G in critique.md."
- **Status in `api-design.md`:** Absent.
- **Impact:** Admins cannot create or manage package offerings without these endpoints. Beta lesson-package feature is blocked.

---

### DAP-006 — `InstructorTenant.onboardingStatus` enum in `api-design.md` context vs data model

- **API document:** `api-design.md` §Instructor Service: `PATCH /api/v1/instructors/:id/approve` — the endpoint only covers approval, not rejection
- **Data model:** `data-model-proposed.md` v0.3 `InstructorTenant.onboardingStatus enum(pending, approved, rejected, inactive)` adds the `rejected` state (CR-008)
- **Impact:** There is no `PATCH /api/v1/instructors/:id/reject` endpoint in `api-design.md`. The rejection use case (UC-036 alt flow 4a) has no API surface.

---

### DAP-007 — `Payment` entity in `data-model.md` v0.2 missing `paymentType` field referenced throughout API and use case flows

- **API flow:** `tech-requirements.md` TR-017, TR-010, TR-045 all reference `Payment.paymentType enum(standard, package_purchase, tip)`
- **Data model:** `data-model.md` v0.2 §Payment: no `paymentType` field
- **Proposed fix:** `data-model-proposed.md` v0.3 adds the field (SC-007, CR-003)
- **Impact:** Package purchase payments, tip payments, and the platform fee exemption on tips (`platformFeeCents = 0` on tip-only records) cannot be distinguished without this field. v0.3 must be promoted before Beta.

---

### DAP-008 — `GroupSession.instructorId` single FK vs multi-instructor support required by UC-020

- **API document:** `tech-requirements.md` TR-020: "New endpoint: `POST /api/v1/group-sessions/:id/instructors` — assign additional instructors when ratio is strained." Requires `GroupSessionInstructor` join table.
- **Data model:** `data-model.md` v0.2 §GroupSession: `instructorId uuid, FK → Instructor` (single FK only)
- **Proposed fix:** `data-model-proposed.md` v0.3 adds `GroupSessionInstructor` join table and renames `instructorId` to `leadInstructorId` (SC-018)
- **Impact:** Multi-instructor group sessions cannot be modelled with v0.2 schema. The `POST /api/v1/group-sessions/:id/instructors` endpoint has no schema to write to.

---

## Roadmap / Feature Conflicts

### RFC-001 — Google Calendar sync present in `ux-flows.md` as an in-scope instructor feature

- **Feature:** Google Calendar sync (Instructor App — Availability Management)
- **`ux-flows.md`:** Lists "Sync with Google Calendar (optional)" as a bullet under Availability Management with no deferral caveat
- **`overview.md` roadmap:** v1.5 deliverable — "Google Calendar sync" is listed under the v1.5 phase (Q1 2027)
- **OQ-021 resolution:** "Deferred to v1.5. `OAuthToken` entity removed from data model v0.3. Must not appear in any v1.0 code path (DEFERRED-001)."
- **Conflict:** `ux-flows.md` implies this is in-scope for v1.0. This directly contradicts the roadmap and the resolved OQ-021 decision. Any engineer reading `ux-flows.md` without cross-referencing OQ-021 will build the Google Calendar sync integration.

---

### RFC-002 — SOC 2 and PIPEDA compliance audit scoped to v1.5 in roadmap but PIPEDA compliance obligations begin at v1.0 GA

- **`overview.md` roadmap v1.5:** "SOC 2 certification, PIPEDA compliance audit"
- **`use-cases.md` UC-037 / `tech-requirements.md` TR-037:** Right-to-erasure tool is a P1 Beta feature driven by "GDPR/PIPEDA compliance"
- **`open-questions.md` OQ-026:** Frames PIPEDA Article 17 compliance as a compliance gap with current urgency
- **Potential conflict:** The roadmap defers the "PIPEDA compliance audit" to v1.5, but `use-cases.md` and `tech-requirements.md` treat certain PIPEDA obligations (right-to-erasure, CASL email opt-out) as Beta/v1.0 requirements. This may be a valid distinction between ongoing compliance obligations (addressed in Beta) and a formal third-party audit (v1.5), but the documents do not explicitly draw this line. This should be clarified to avoid confusion about when PIPEDA obligations must be met vs audited.

---

### RFC-003 — Multi-school management appears as v1.5 in roadmap but multi-school operator portal is v1.0 GA

- **`overview.md` roadmap v1.5:** "multi-school management"
- **`overview.md` pricing tiers:** Pro tier ($799/mo): "multi-school"
- **`ux-flows.md` §5 Operator Portal:** "Multi-School Dashboard — Aggregated view across all schools in the resort"
- **`use-cases.md` UC-041:** "View Consolidated Resort Revenue Report" (Priority P2, v1.0 GA) — aggregates across multiple schools
- **Potential conflict:** The roadmap lists "multi-school management" under v1.5, but the operator portal (v1.0 GA) and the Pro tier already imply multi-school aggregation. The resolution likely hinges on definition: "management" in v1.5 may refer to a single admin managing multiple schools under one account, while the v1.0 operator portal provides read-only aggregated reporting across schools without cross-school admin control. The documents do not explicitly resolve this distinction. If these are the same feature, there is a roadmap conflict.

---

## Overall Consistency Score

**AMBER**

**Rationale:**

The core data model (`data-model-proposed.md` v0.3), tech requirements, and use cases are broadly internally consistent where they overlap, and the Run 3 drafts have resolved several blocking issues from Run 2 (OQ-021 deferral applied in v0.3, soft-hold TTL fixed, tip endpoint defined). However, the following contradictions require resolution before development proceeds:

1. **CON-001** (tip endpoint name) — `use-cases.md` references a non-existent `/tip` endpoint; `api-design.md` uses `/review`. Low risk to fix but will cause dev confusion if left unresolved.
2. **CON-002** (weather cancellation status) — `use-cases.md` introduces `cancelled_weather` as a status enum value that does not exist in the data model. Any engineer implementing UC-029 from `use-cases.md` alone will add a spurious enum value.
3. **CON-003 / RFC-001** (Google Calendar sync in `ux-flows.md`) — A P0 visual artefact directly contradicting a resolved deferral decision. Engineers reading `ux-flows.md` will build out-of-scope work.
4. **UAP-001 through UAP-011** — Eleven use cases (including three that are P0 Alpha) have no corresponding endpoints in `api-design.md`. This is the most significant gap: the API design document is substantially incomplete relative to the scope defined in use cases and tech requirements. Development cannot begin on these features without a formal API contract.
5. **DAP-001** — The booking payload in `api-design.md` does not reflect nullable `learnerId` and the guest-checkout object, which are required for the P0 guest checkout path.

None of these issues would cause unrecoverable data loss on their own, but items 2 and 4 would directly cause rework if developers build against the current `use-cases.md` and `api-design.md` without correction.
