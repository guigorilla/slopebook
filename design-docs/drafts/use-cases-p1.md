# Slopebook — Use Cases (P1 / P2)

**Document Status:** Draft — Generate Pipeline Run 6
**Last Updated:** 2026-03-28
**Author:** Product-Lead Agent
**Scope:** P1 (Beta — Q3 2026) and P2 (v1.0 GA — Q4 2026) use cases only

---

## P1 — Beta Use Cases

---

## UC-023 — Manage learner sub-profiles

**Persona:** Head of Household
**Goal:** Add, edit, or remove learner sub-profiles in a household account.
**Preconditions:**
- User is signed in; Household exists.

**Main Flow:**
1. User opens household management in account settings.
2. User adds a new Learner (firstName, lastName, dateOfBirth, skillLevel).
3. If age < 18 → parentalConsentGiven required at profile creation (OQ-032).
4. User edits an existing Learner's skill level or name.
5. User attempts to delete a Learner; system checks for active bookings.
6. If Learner has active bookings → 409 LEARNER_HAS_ACTIVE_BOOKINGS; deletion blocked (OQ-036).

**Alternate Flows:**
- Admin overrides skill level → logged in AuditLog per OQ-020.

**Postconditions:**
- Learner added/updated; deletion blocked if active bookings exist.

**Priority:** P1

---

## UC-024 — Purchase a lesson package

**Persona:** Guest (signed-in) / Head of Household
**Goal:** Buy a multi-lesson package at a discounted rate.
**Preconditions:**
- User is authenticated; Household exists.
- LessonPackage product exists and is active.

**Main Flow:**
1. User selects a lesson package from the catalog.
2. System shows package price; 1.5% platform fee applied at purchase (OQ-027).
3. User selects payment method and confirms purchase.
4. LessonPackage and initial PackageRedemption records created; LessonPackage.remainingCount set.
5. Confirmation email sent.

**Alternate Flows:**
- Package expires before all credits used → remaining credits forfeited (OQ-025); admin can extend expiresAt manually.

**Postconditions:**
- LessonPackage.remainingCount set; package credits available for booking.

**Priority:** P1

---

## UC-025 — Switch payment processor

**Persona:** Resort Operator / School Admin
**Goal:** Change the tenant's active payment processor from Stripe to Shift4 or vice versa.
**Preconditions:**
- Operator is signed in with operator role.
- New processor credentials are available.

**Main Flow:**
1. Operator navigates to Payment Processor Configuration.
2. Operator selects the new processor and enters credentials (encrypted at rest per OQ-046).
3. System updates Tenant.paymentProcessor and Tenant.paymentCredentials.
4. System marks all existing PaymentMethod records for this tenant with isValid = false (OQ-004).

**Alternate Flows:**
- In-flight refunds on old processor → resolved manually by operator (OQ-035).
- Old processor webhooks fail HMAC → resolved manually (OQ-035).

**Postconditions:**
- Tenant.paymentProcessor updated; old card vault tokens invalidated.

**Priority:** P1

---

## UC-026 — Process a right-to-erasure request

**Persona:** School Admin (acting on customer request)
**Goal:** Delete or anonymise all PII associated with a user or guest checkout record.
**Preconditions:**
- Admin is signed in; target entity (User, GuestCheckout) is identified.

**Main Flow:**
1. Admin locates the User or GuestCheckout in admin tools.
2. System checks for active bookings → if any exist, block erasure until bookings conclude.
3. Admin confirms; system anonymises all PII fields (email, name, phone, dateOfBirth) on User, Household, Learner, GuestCheckout.
4. Booking records retain anonymised references for financial reporting (OQ-026).
5. Smartwaiver document deletion not in scope for v1.0 (OQ-045).

**Postconditions:**
- PII anonymised across all linked records; audit trail retained.

**Priority:** P1

---

## UC-027 — Join waitlist (time-slot mode)

**Persona:** Guest / Head of Household
**Goal:** Join a waitlist for a specific date and time when no slots are available.
**Preconditions:**
- No availability exists for the requested date/time/lesson type combination.

**Main Flow:**
1. Guest sees empty availability state and taps Join Waitlist.
2. Guest selects mode = time_slot; provides email (or uses Learner for authenticated path).
3. System creates WaitlistEntry with status = waiting, position = null (FIFO end of queue).
4. When a slot opens: system notifies guest via email; sets WaitlistEntry.notifiedAt and opens acceptance window (Tenant.waitlistAcceptWindowMinutes, default 120).

**Alternate Flows:**
- No one on waitlist accepts → nothing happens; slot released back to general availability (OQ-034).

**Postconditions:**
- WaitlistEntry.status = waiting; guest receives notification when slot opens.

**Priority:** P1

---

## UC-028 — Join waitlist (instructor-specific mode)

**Persona:** Guest / Head of Household
**Goal:** Join a waitlist specifically for a chosen instructor, regardless of time slot.
**Preconditions:**
- Preferred instructor has no availability on target date.

**Main Flow:**
1. Guest selects preferred instructor and taps Notify Me.
2. System creates WaitlistEntry with mode = instructor, targetInstructorId set.
3. When instructor's availability opens → notification sent; acceptance window opens.

**Postconditions:**
- WaitlistEntry linked to specific instructor; notified when that instructor has a slot.

**Priority:** P1

---

## UC-029 — Accept a waitlist offer

**Persona:** Guest / Head of Household
**Goal:** Claim a slot after receiving a waitlist notification.
**Preconditions:**
- WaitlistEntry.status = notified; acceptance window has not expired.

**Main Flow:**
1. Guest receives notification email with one-click accept link.
2. Guest taps accept; system creates SlotReservation and redirects to payment (UC-003 or UC-004).
3. On payment success: WaitlistEntry.status = accepted; slot confirmed.

**Alternate Flows:**
- Acceptance window expires → WaitlistEntry.status = expired; slot offered to next entry in FIFO order (OQ-034).

**Postconditions:**
- WaitlistEntry.status = accepted; Booking created.

**Priority:** P1

---

## UC-030 — Admin manages waitlist

**Persona:** School Admin
**Goal:** View, reorder, or manually promote waitlisted customers.
**Preconditions:**
- Admin is signed in; active WaitlistEntry records exist.

**Main Flow:**
1. Admin opens Waitlist Panel; views all active waitlist entries filterable by type, date, status.
2. Admin manually promotes a specific entry (PATCH /api/v1/waitlist/:id/promote); system notifies that guest first regardless of FIFO order.
3. Admin can reorder entries by updating WaitlistEntry.position.
4. Admin views notification history (notifiedAt, whether accepted).

**Postconditions:**
- WaitlistEntry.position updated; promotion notification sent.

**Priority:** P1

---

## UC-031 — Create and manage a group session

**Persona:** School Admin
**Goal:** Create a group lesson session and manage its roster.
**Preconditions:**
- Admin is signed in; LessonType with category = group exists and is active.

**Main Flow:**
1. Admin creates a GroupSession (lessonTypeId, instructorId, startAt, endAt, maxCapacity, meetingPoint).
2. GroupSession.status = open; session is bookable by customers.
3. As customers book, GroupSession.currentCapacity increments; at maxCapacity status = full.

**Postconditions:**
- GroupSession available for customer enrollment (UC-032).

**Priority:** P1

---

## UC-031a — Cascade-cancel a group session

**Persona:** School Admin
**Goal:** Cancel an entire group session and issue full refunds to all enrolled students.
**Preconditions:**
- GroupSession.status ∈ {open, full}; at least one confirmed Booking exists.

**Main Flow:**
1. Admin selects the group session and taps Cancel Session.
2. System shows confirmation modal with count of affected bookings and total refund amount.
3. Admin confirms; system sets GroupSession.status = cancelled; GroupSession.cancelledAt = now.
4. System cancels all enrolled Bookings (status = cancelled).
5. Full refund issued for each Booking regardless of snapshot CancellationPolicy — company-initiated cancellation always refunds in full (OQ-051).
6. Cancellation emails sent to all enrolled students with refund confirmation.

**Alternate Flows:**
- Partial refund already issued on a booking → remaining amountCents refunded.

**Postconditions:**
- All Bookings cancelled; full refunds issued; students notified.

**Priority:** P1

---

## UC-032 — Enroll in a group session

**Persona:** Guest / Head of Household
**Goal:** Book a spot in an open group lesson session.
**Preconditions:**
- GroupSession.status = open (currentCapacity < maxCapacity).
- Guest meets skill level requirement.

**Main Flow:**
1. Guest browses group sessions and selects an open one.
2. Flow follows UC-003 (guest) or UC-004 (authenticated) for payment.
3. System links Booking.groupSessionId and increments GroupSession.currentCapacity.
4. If currentCapacity reaches maxCapacity after this booking → GroupSession.status = full.

**Postconditions:**
- Booking confirmed; group session capacity updated.

**Priority:** P1

---

## UC-033 — Cancel a package-redeemed booking

**Persona:** Guest (signed-in) / Head of Household
**Goal:** Cancel a booking that was paid for using a lesson package credit.
**Preconditions:**
- Booking was created via PackageRedemption; Booking.status = confirmed.

**Main Flow:**
1. User cancels via account dashboard (same UC-006 flow).
2. System checks cancellation timing against snapshot CancellationPolicy refund window.
3. Within refund window → LessonPackage.remainingCount incremented (credit reinstated) (OQ-039).
4. Outside refund window → credit forfeited; no reinstatement.

**Postconditions:**
- Booking cancelled; credit reinstated or forfeited per policy.

**Priority:** P1

---

## UC-034 — View instructor earnings

**Persona:** Instructor
**Goal:** See earnings summary broken down by lesson type and period.
**Preconditions:**
- Instructor is signed in; completed bookings exist.

**Main Flow:**
1. Instructor opens Earnings Dashboard.
2. System returns completed Bookings with payment amounts for this InstructorTenant.
3. Instructor views breakdown by lesson type, day, week, and season.
4. Instructor can trigger Workday payroll handoff (admin can also trigger per UC-035).

**Postconditions:**
- Read-only summary displayed; no state change.

**Priority:** P1

---

## UC-035 — Admin triggers Workday payroll handoff

**Persona:** School Admin
**Goal:** Export instructor earnings data to Workday for payroll processing.
**Preconditions:**
- Admin is signed in; period to export is defined.

**Main Flow:**
1. Admin selects instructor and pay period; taps Workday Handoff.
2. System creates WorkdayHandoff record (status = pending) with earningsSnapshotJson.
3. System delivers payload to Workday integration; updates status = delivered.
4. On failure: status = failed; admin retries manually.

**Postconditions:**
- WorkdayHandoff record created; earnings data delivered or flagged for retry.

**Priority:** P1

---

## P2 — v1.0 GA Use Cases

---

## UC-036 — Configure white-label booking widget

**Persona:** Resort Operator
**Goal:** Customise the booking widget with resort branding and deploy it on the resort website.
**Preconditions:**
- Operator is signed in with operator role; Enterprise tier.

**Main Flow:**
1. Operator uploads logo, sets primary/secondary color, font, custom domain.
2. System saves WhiteLabelConfig; generates embed snippet and embedCodeToken.
3. Operator copies iframe embed code and adds it to resort website.
4. Custom domain is verified; domainVerified = true.

**Postconditions:**
- Booking widget renders with resort branding at custom domain.

**Priority:** P2

---

## UC-037 — Manage API keys

**Persona:** Resort Operator / School Admin
**Goal:** Create and revoke API keys for third-party integrations.
**Preconditions:**
- Operator or admin is signed in.

**Main Flow:**
1. Operator creates API key with label and scopes.
2. System returns key on creation only (stored as keyHash; not re-displayable).
3. Operator revokes a key → ApiKey.isActive = false, revokedAt = now.

**Postconditions:**
- ApiKey created or revoked; external consumer can authenticate using key.

**Priority:** P2

---

## UC-038 — Configure webhooks

**Persona:** Resort Operator / School Admin
**Goal:** Register a webhook endpoint to receive booking events.
**Preconditions:**
- Operator or admin is signed in.

**Main Flow:**
1. Operator enters webhook URL (stored encrypted) and selects events.
2. System saves signingSecret (encrypted); delivers HMAC-signed payloads on events.
3. On repeated failure: Webhook.failureCount increments; admin alerted.

**Postconditions:**
- Webhook active; events delivered to registered URL.

**Priority:** P2

---

## UC-039 — Access revenue analytics

**Persona:** School Admin / Resort Operator
**Goal:** View revenue, utilisation, and student analytics for business decision-making.
**Preconditions:**
- Admin or operator is signed in; completed bookings exist.

**Main Flow:**
1. Admin opens Reporting section; selects report type (revenue, utilisation, students).
2. Admin applies date range and optional filters (instructorId, lesson type).
3. System returns report data; admin can export to CSV.

**Postconditions:**
- Report viewed or downloaded; no state change.

**Priority:** P2

---

## UC-040 — Operator configures resort policies

**Persona:** Resort Operator
**Goal:** Set resort-wide defaults for currency, language, and cancellation policy.
**Preconditions:**
- Operator is signed in.

**Main Flow:**
1. Operator sets Tenant.currency, Tenant.defaultLanguage.
2. Operator selects default CancellationPolicy (seeded at tenant creation per OQ-014).
3. Operator configures Tenant.waitlistAcceptWindowMinutes.

**Postconditions:**
- Tenant configuration updated; all new lesson types inherit defaults.

**Priority:** P2
