# Slopebook — Use Cases

**Document Status:** Draft
**Last Updated:** 2026-03-26
**Author:** Product Lead Agent
**Pipeline Run:** Run 3 (2026-03-26)

---

## 1. Overview

This document defines the formal use cases for Slopebook, a cloud-based SaaS platform for ski resort lesson management. It covers all five primary personas — Guest (Student), Head of Household, Instructor, School Admin, and Resort Operator — across the full lesson lifecycle: discovery, booking, payment, instruction, post-lesson review, and platform configuration.

The use cases are derived from the product overview (`overview.md`), UX flow specifications (`ux-flows.md`), and the resolved open questions log (`open-questions.md`). All open questions OQ-001 through OQ-029 are resolved and reflected herein without qualification. OQ-030, OQ-031, and OQ-032 remain unresolved; affected use cases are flagged.

**Release scope per section:**
- **Alpha (Q2 2026):** Core booking engine, Stripe + Shift4 payment abstraction, instructor availability, admin scheduler. EN/FR on `customer` app and `instructor` PWA. Bilingual booking widget. USD + CAD.
- **Beta (Q3 2026):** Group lessons, lesson packages, household accounts with learner sub-profiles, card-on-file tokens, dual-mode waitlist, earnings dashboard, post-lesson tip + rating flow. EN/FR on `admin` and `operator` apps.
- **v1.0 GA (Q4 2026):** White-label widget, resort operator portal, revenue analytics. Full public launch.

**Priority key:**
- **P0** — Must ship in Alpha. Blocking.
- **P1** — Must ship by Beta. Core product experience.
- **P2** — Must ship by v1.0 GA. Completes the platform.

**Personas covered:**
- Guest (Student) — anonymous or authenticated user booking a lesson
- Head of Household — authenticated adult managing bookings for family members
- Instructor — certified ski instructor managing schedule, check-ins, and earnings
- School Admin — operations manager running a ski school
- Resort Operator — resort-level administrator configuring multi-school policy and white-label settings

**Application surfaces referenced:**
- `customer` app (port 3000) — Guest and Head of Household
- `admin` app (port 3001) — School Admin
- `instructor` app (port 3002) — Instructor (PWA)
- `operator` app (port 3003) — Resort Operator

---

## 2. Use Cases — Guest (Student)

---

## UC-001 — Browse and Select a Lesson Type

**Persona:** Guest (anonymous or authenticated)
**Goal:** Identify the right lesson type and skill level to begin the booking flow.
**Preconditions:** The booking widget is accessible (embedded on resort site or standalone). At least one lesson type is configured and active for the resort.
**Main Flow:**
  1. Guest navigates to the booking widget (standalone URL or embedded iframe/JS snippet).
  2. System renders the widget in the resort's configured default language (EN or FR); guest may toggle language.
  3. System presents available lesson types: private, semi-private, group, half-day, full-day. Group lessons appear only for Growth-tier tenants and above.
  4. Guest selects a lesson type.
  5. Guest selects their skill level: beginner, intermediate, or advanced.
  6. System filters eligible instructors and available dates based on the selected type and skill level combination.
**Alternate Flows:**
  - 5a. Guest skips explicit skill-level selection — system prompts with a brief self-assessment before proceeding; selection is required.
  - 6a. No instructors are eligible for the selected combination — system displays a message and suggests alternative dates, lesson types, or the waitlist option.
  - 3a. Guest's browser locale is FR and the resort supports FR — widget defaults to FR without requiring a manual toggle.
**Postconditions:** Lesson type and skill level are selected; booking flow proceeds to instructor browse or date selection.
**Priority:** P0
**Open Questions:** None. OQ-030 (FR suppression on Starter tier) is unresolved and affects whether the language toggle renders for Starter tenants. Flag for tech-lead: render toggle for all tiers on `customer` app until OQ-030 is resolved.

---

## UC-002 — Browse Instructor Profiles

**Persona:** Guest (anonymous or authenticated)
**Goal:** Optionally choose a preferred instructor before selecting a date and time.
**Preconditions:** UC-001 completed. At least one instructor is eligible for the selected lesson type and skill level.
**Main Flow:**
  1. System displays a list of eligible instructor profile cards.
  2. Each card shows: photo, display name, bio in the user's current language (EN or FR), certifications (PSIA/CSIA), languages spoken, and average rating.
  3. Average rating is shown as a star display with raw average (e.g., 4.7). Ratings are internal-only (visible to guests browsing but not publicly indexed); there is no minimum booking count required before a rating displays (OQ-028 resolved).
  4. Guest optionally selects a preferred instructor.
  5. Flow proceeds to date and time selection scoped to that instructor's availability.
**Alternate Flows:**
  - 4a. Guest skips instructor selection — flow proceeds to date/time selection showing all available instructors for each slot.
  - 2a. A specific content field (e.g., instructor bio) has only been entered in one language — system falls back to the available language rather than displaying a blank field.
**Postconditions:** Guest has optionally chosen a preferred instructor; date/time selection step is reached.
**Priority:** P0
**Open Questions:** None. Rating visibility policy resolved in OQ-028: ratings are internal-only to the platform (visible to authenticated and guest users browsing instructors, but not exposed via public API or search engine indexing). Moderation is platform-admin only.

---

## UC-003 — Select a Date and Time Slot (with Soft Hold)

**Persona:** Guest (anonymous or authenticated)
**Goal:** Choose a specific lesson date and time, securing a temporary slot hold while checkout is completed.
**Preconditions:** UC-001 completed. Optionally UC-002 completed.
**Main Flow:**
  1. System displays a calendar showing dates with at least one available slot matching the lesson criteria.
  2. Guest selects a date.
  3. System displays available time slots for that date, each showing the available instructor(s).
  4. Guest selects a time slot.
  5. System creates a `SlotReservation` record with a 15-minute TTL (platform constant, not configurable per OQ-011). The `sessionToken` (string) and `reservationId` (UUID) are issued and held client-side for the checkout session.
  6. A countdown timer is displayed to the guest indicating time remaining to complete checkout.
**Alternate Flows:**
  - 2a. No available dates exist for the criteria — system presents the waitlist option (see UC-014 and UC-015).
  - 4a. The last available slot is taken between step 3 and step 5 (race condition) — system detects the conflict on reservation creation, notifies the guest, and refreshes the calendar.
  - 6a. The 15-minute soft-hold expires before checkout is completed — system invalidates the `SlotReservation`, releases the slot to inventory, and redirects the guest to re-select a time slot.
**Postconditions:** A specific date, time slot, and instructor are associated with the pending booking. A `SlotReservation` is active with a 15-minute TTL. `sessionToken` and `reservationId` are held for inclusion in the booking payload (OQ-023).
**Priority:** P0
**Open Questions:** None. Soft-hold TTL confirmed as 15 minutes platform constant (OQ-011). `reservationId` and `sessionToken` field spec confirmed in OQ-023.

---

## UC-004 — Complete Guest Checkout (No Account)

**Persona:** Guest (anonymous)
**Goal:** Confirm and pay for a booking without creating an account.
**Preconditions:** UC-003 completed with an active soft hold. Guest does not have or does not wish to create an account.
**Main Flow:**
  1. System presents the booking summary: lesson type, instructor, date, time, skill level, and price in the resort's configured currency (USD or CAD).
  2. System presents the authentication gate; guest selects "Guest Checkout."
  3. Guest enters their email address.
  4. Guest enters payment card details; card is tokenized via the configured processor (Stripe or Shift4) and is not stored.
  5. Guest reviews the booking summary and confirms.
  6. System submits `POST /api/v1/bookings` including `reservationId` (UUID, nullable) and `sessionToken` (string, nullable) from the soft-hold, and `tipAmountCents` is NOT included at this stage (tips are submitted post-lesson per OQ-023).
  7. System charges the card, creates a `Booking` record and a `GuestCheckout` record, and releases the soft hold.
  8. System sends a confirmation email in the guest's browser language (EN or FR) with: lesson details, receipt, and an `.ics` calendar attachment.
**Alternate Flows:**
  - 4a. Payment is declined — system displays a processor-agnostic error and prompts guest to re-enter card details or use a different card. No charge is captured.
  - 5a. Guest opts to save their card — system redirects to account creation (UC-005) before proceeding. The soft-hold timer continues during this step.
  - 6a. The soft-hold has expired between steps 5 and 6 — system rejects the booking submission, informs the guest, and returns them to the calendar.
  - 7a. A `GuestCheckout` record is created for GDPR/PIPEDA right-to-erasure compliance. PII fields (`firstName`, `lastName`, `email`, `phone`) are pseudonymisable via the admin erasure tool. Financial fields in `Payment` are retained per tax obligations (7 yr US / 6 yr CA) per OQ-026.
**Postconditions:** Booking is confirmed and in "upcoming" status. Guest has received a confirmation email with `.ics` attachment. No account created; `GuestCheckout` record exists for erasure compliance.
**Priority:** P0
**Open Questions:** None. Field spec for `reservationId` and `sessionToken` confirmed in OQ-023. `tipAmountCents` removed from booking payload (OQ-023); tip submitted post-lesson via UC-013. Guest data erasure scope confirmed in OQ-026.

---

## UC-005 — Create an Account and Book a Lesson

**Persona:** Guest
**Goal:** Create an account during checkout to enable card-on-file, booking history, and household management.
**Preconditions:** UC-003 completed with an active soft hold. Guest selects "Create Account" at the authentication gate.
**Main Flow:**
  1. Guest enters name, email address, and password.
  2. System validates the email is not already registered and creates the account.
  3. Guest is logged in immediately.
  4. Guest optionally sets language preference (EN or FR); defaults to the browser locale.
  5. Flow returns to payment step: guest enters card details, which are tokenized and optionally saved as a `PaymentMethod` record.
  6. System submits the booking with `reservationId` and `sessionToken` from the soft hold.
  7. System charges the card, creates the `Booking` record, and releases the soft hold.
  8. Booking is confirmed and appears in the account dashboard.
  9. Confirmation email sent in the account's language preference.
**Alternate Flows:**
  - 1a. Email address is already registered — system prompts guest to sign in instead (UC-006 path).
  - 5a. Guest declines to save the card — card is used for this transaction only, token not persisted.
**Postconditions:** Account exists. Booking is confirmed and visible in the account dashboard. Card token is stored if opted in. `PaymentMethod` record created if card saved.
**Priority:** P0
**Open Questions:** None.

---

## UC-006 — Sign In and Book with Card on File

**Persona:** Guest (returning, authenticated)
**Goal:** Complete a booking quickly using a stored payment method.
**Preconditions:** UC-003 completed with an active soft hold. Guest has an existing account with at least one stored `PaymentMethod` token.
**Main Flow:**
  1. Guest selects "Sign In" at the authentication gate.
  2. Guest enters credentials and authenticates.
  3. System displays stored card(s) (masked card number, card type, expiry); default card is pre-selected.
  4. Guest reviews booking summary and confirms with one tap or click.
  5. System submits `POST /api/v1/bookings` with `reservationId` and `sessionToken`.
  6. System charges the default card on file.
  7. Booking is confirmed; confirmation email and `.ics` attachment sent in account language.
**Alternate Flows:**
  - 3a. Guest selects a non-default stored card.
  - 3b. Guest chooses to enter a new card — enters details, tokenized and optionally saved.
  - 6a. Charge to card on file fails (expired, declined) — system prompts guest to update payment method or enter a new card. `PaymentMethod.isValid` is set to `false` if the processor confirms the token is invalid (OQ-004).
  - 6b. The soft-hold has expired — system rejects the booking and returns guest to the calendar.
**Postconditions:** Booking confirmed. Charge captured. Booking visible in account dashboard.
**Priority:** P0
**Open Questions:** None. Card-on-file token invalidation on processor switch confirmed in OQ-004.

---

## UC-007 — View Booking History and Receipts

**Persona:** Guest (authenticated)
**Goal:** Review past lessons, receipts, and instructor session notes.
**Preconditions:** Guest is signed in. At least one past booking exists.
**Main Flow:**
  1. Guest navigates to Account Dashboard > Booking History.
  2. System displays past lessons with date, instructor, lesson type, and amount paid (in resort currency).
  3. Guest selects a past booking.
  4. System displays the full receipt and, if the instructor shared session notes, the progress notes for that session.
**Alternate Flows:**
  - 4a. Instructor has not shared session notes — notes section is hidden or shows a placeholder message.
  - 4b. Booking was made as a guest checkout (no account at time of booking) — receipt is accessible only via the confirmation email link; not visible in account history.
**Postconditions:** Guest has reviewed past booking details and/or receipt.
**Priority:** P1
**Open Questions:** None.

---

## UC-008 — Modify or Cancel an Upcoming Booking

**Persona:** Guest (authenticated)
**Goal:** Cancel an upcoming booking and receive a refund per the school's cancellation policy.
**Preconditions:** Guest is signed in. At least one upcoming booking exists in "upcoming" or "confirmed" status.
**Main Flow:**
  1. Guest navigates to Account Dashboard > Upcoming Lessons.
  2. Guest selects a booking and chooses "Cancel."
  3. System retrieves the school's configured cancellation policy and calculates the applicable refund amount.
  4. System displays the refund amount and the policy explanation to the guest.
  5. Guest confirms the cancellation.
  6. System cancels the booking, sets `Booking.status = cancelled`, releases the slot to inventory, and initiates the refund via the payment processor.
  7. System sends a cancellation confirmation email in the guest's language with the refund details.
**Alternate Flows:**
  - 3a. Booking is within the non-refundable window per the cancellation policy (default: non-refundable per OQ-014) — system shows that no refund will be issued; guest must explicitly confirm before the cancellation proceeds.
  - 6a. Refund initiation fails on the processor side — system flags the booking for school admin review and sends an admin alert. Guest is notified that the refund is pending manual processing.
  - 2a. Guest attempts to modify the lesson (date/time/instructor change) — system does not support in-place modification in v1.0; guest must cancel and rebook.
**Postconditions:** Booking is cancelled. Slot is released back to inventory. Refund is initiated per policy. Guest is notified.
**Priority:** P0
**Open Questions:** None. Default cancellation policy is non-refundable (OQ-014). Booking modification (rescheduling) is not in scope for v1.0 — flag for tech-lead: cancel-and-rebook is the only path.

---

## UC-009 — Switch Language Preference

**Persona:** Guest (authenticated)
**Goal:** Change the UI and communication language between English and French.
**Preconditions:** Guest is signed in.
**Main Flow:**
  1. Guest navigates to Account Dashboard > Language Preference.
  2. Guest toggles between English (EN) and French (FR).
  3. System updates the UI immediately and persists `User.languagePreference` to the account.
  4. All future email and SMS communications are sent in the selected language.
**Alternate Flows:**
  - None.
**Postconditions:** Language preference is saved. UI and all future communications reflect the selected language.
**Priority:** P0
**Open Questions:** OQ-030 (unresolved) — whether FR is suppressed on the `customer` app for Starter-tier tenants. Until resolved, FR is available to all tiers on the `customer` app per TR-F-104.

---

## UC-010 — Submit a Post-Lesson Tip and Rating

**Persona:** Guest (authenticated or guest-checkout)
**Goal:** Tip the instructor and submit a rating after a lesson is marked complete.
**Preconditions:** A booking has `Booking.status = completed`. If the tenant has `tipsEnabled = true` (OQ-018 resolved). Rating submission is always available regardless of tips setting.
**Main Flow:**
  1. System detects that a booking has transitioned to `completed` status.
  2. System sends the guest (or household manager) an email prompt to rate and optionally tip the instructor.
  3. Guest clicks the prompt link and is presented with the post-lesson flow screen.
  4. Guest selects a star rating (1–5). Rating is stored as `InstructorRating` and linked to `Instructor.ratingAvg` and `ratingCount` (denormalised fields updated). Ratings are internal-only; moderation is platform-admin only (OQ-028).
  5. If `Tenant.tipsEnabled = true`: Guest is presented with a tip selector (preset amounts and a custom entry). Guest optionally enters a tip amount (`tipAmountCents`, integer, must be >= 0 if present).
  6. If a tip is entered, system initiates a separate charge via `POST /api/v1/bookings/:id/tip` using the guest's stored card on file, or prompts for card entry for guest-checkout users.
  7. Tip amount flows 100% to the instructor; platform fee (1.5%) does NOT apply to tip amounts (OQ-027).
  8. System records the tip in `Payment.tipAmountCents` and updates the instructor's earnings dashboard.
  9. System confirms submission and thanks the guest.
**Alternate Flows:**
  - 4a. Guest skips the rating — tip can still be submitted; rating submission is optional.
  - 5a. `Tenant.tipsEnabled = false` — tip selector is hidden; only rating is collected.
  - 6a. Guest-checkout user does not have a card on file — system presents a card entry form for the tip charge. If declined or abandoned, tip is not recorded.
  - 6b. Tip charge fails — system notifies the guest and offers a retry. Rating already submitted is not rolled back.
  - 2a. Guest does not respond to the prompt — no reminder is sent; the window remains open indefinitely (no time window per OQ-028).
**Postconditions:** `InstructorRating` record created (if submitted). `Payment.tipAmountCents` recorded (if tip submitted). Instructor earnings dashboard updated. Rating affects `Instructor.ratingAvg`.
**Priority:** P1 (Beta deliverable per OQ-023 and OQ-028 resolution)
**Open Questions:** None. Tip/rating split into a separate post-lesson flow per OQ-023. Rating visibility and timing confirmed in OQ-028. Platform fee exemption on tips confirmed in OQ-027.

---

## 3. Use Cases — Head of Household

---

## UC-011 — Set Up a Household Account with Learner Sub-Profiles

**Persona:** Head of Household
**Goal:** Add family members as learner sub-profiles so lessons can be booked on their behalf.
**Preconditions:** Head of Household has a signed-in account (created via UC-005 or directly). Household management is a Beta feature.
**Main Flow:**
  1. Head of Household navigates to Account Dashboard > Household Members.
  2. Selects "Add Learner."
  3. Enters learner details: first name, last name, date of birth, and skill level.
  4. For learners under 18: system displays a required parental/guardian consent checkbox (TR-F-052). Head of Household checks the box to confirm consent. System records consent. Note: `parentalConsentGiven` and `parentalConsentAt` fields should be added to the `Learner` entity (OQ-032 pending).
  5. System validates date of birth: learners below the platform minimum age of 5 years are blocked (OQ-007). System shows guidance text rather than a hard error wall.
  6. System creates the `Learner` sub-profile linked to the household account.
  7. Repeat steps 2–6 for each additional family member.
**Alternate Flows:**
  - 5a. Learner's age calculates below 5 years — system blocks creation and displays guidance (e.g., "We welcome skiers aged 5 and up. Please contact the school for younger children.").
  - 3a. Head of Household adds themselves as a learner — allowed; the account holder can also be a student.
  - 4a. Learner is 18 or older — consent checkbox is not displayed.
**Postconditions:** One or more `Learner` sub-profiles exist under the household. Each has name, date of birth, skill level, and parental consent record (if under 18).
**Priority:** P1 (Beta)
**Open Questions:** OQ-032 (unresolved) — `parentalConsentGiven boolean` and `parentalConsentAt timestamp` fields not yet confirmed in `Learner` entity schema. Tech-lead must add these fields before Beta schema freeze.

---

## UC-012 — Book a Lesson on Behalf of a Household Member

**Persona:** Head of Household
**Goal:** Complete a booking for a specific family member using household sub-profiles.
**Preconditions:** Head of Household is signed in. At least one `Learner` sub-profile exists (UC-011). UC-003 completed with an active soft hold.
**Main Flow:**
  1. At the learner selection step in the booking flow, system presents the list of household sub-profiles.
  2. Head of Household selects the learner for whom the lesson is being booked.
  3. System pre-fills the skill level from the `Learner` sub-profile; Head of Household may override it for this booking.
  4. Override does not update the sub-profile's default skill level (OQ-020: skill level is self-reported; admin can override via the admin app).
  5. Flow continues to payment (UC-006 card-on-file path or new card entry).
  6. Booking is confirmed and associated with the selected `Learner` sub-profile.
  7. Confirmation email sent to Head of Household in their account language.
**Alternate Flows:**
  - 1a. Head of Household adds a new learner inline during checkout — system opens the add-learner form (UC-011 steps 2–6) inline; soft-hold timer continues.
  - 3a. Learner has no prior skill level on file — Head of Household must select one before proceeding.
**Postconditions:** Booking is confirmed and linked to the `Learner` sub-profile. Visible in the household's upcoming lessons view.
**Priority:** P1 (Beta)
**Open Questions:** None.

---

## UC-013 — View All Upcoming Lessons for the Household

**Persona:** Head of Household
**Goal:** See a unified view of all upcoming lessons for all household members.
**Preconditions:** Head of Household is signed in. At least one upcoming booking exists for any household member.
**Main Flow:**
  1. Head of Household navigates to Account Dashboard > Upcoming Lessons.
  2. System displays all upcoming lessons across all household members: learner name, date, time, instructor, lesson type.
  3. Bookings are sorted chronologically, grouped by date.
  4. Head of Household taps or clicks a booking to view details or initiate a cancellation (UC-008).
**Alternate Flows:**
  - 2a. Multiple bookings exist on the same date — displayed chronologically within the day group.
  - 2b. No upcoming bookings exist — system shows an empty state with a prompt to book a lesson.
**Postconditions:** Head of Household has a complete view of all household lesson commitments.
**Priority:** P1 (Beta)
**Open Questions:** None.

---

## UC-014 — Manage Stored Payment Methods

**Persona:** Head of Household (also applies to any authenticated Guest)
**Goal:** Add, remove, or change the default stored payment card.
**Preconditions:** User is signed in.
**Main Flow:**
  1. User navigates to Account Dashboard > Payment Methods.
  2. System displays all stored cards: masked card number, card type (Visa/MC/Amex), expiry date, and default indicator.
  3. User may add a new card: enters details; card is tokenized via the resort's configured processor (Stripe or Shift4) and stored as a `PaymentMethod` record.
  4. User may remove an existing card.
  5. User may set a different card as the default.
**Alternate Flows:**
  - 4a. User attempts to remove the only stored card while an upcoming booking is pending — system warns the user that the card is required for an upcoming charge and requests confirmation before deletion.
  - 3a. A previously stored card's `PaymentMethod.isValid` is `false` (processor switch or token expiry per OQ-004) — system displays a banner prompting re-entry of card details.
**Postconditions:** Payment method list is updated. Default card is set per user preference. Invalid card tokens are surfaced to the user.
**Priority:** P1 (Beta)
**Open Questions:** None. Cross-processor vault migration deferred to v1.5 (OQ-004).

---

## 4. Use Cases — Waitlist

---

## UC-015 — Join the Waitlist for a Lesson Slot

**Persona:** Guest or Head of Household
**Goal:** Reserve a place in the waitlist for a fully-booked lesson slot, in either any-instructor or specific-instructor mode.
**Preconditions:** UC-001 and UC-003 attempted. The desired date/time/instructor combination has no available slots.
**Main Flow:**
  1. System detects no availability for the selected criteria and presents the waitlist option.
  2. User selects "Join Waitlist."
  3. System presents two waitlist modes:
     - **Any instructor** — user accepts any available instructor on this date and time.
     - **Specific instructor** — user wants only a particular instructor on this date and time.
  4. User selects a mode and confirms.
  5. If authenticated: waitlist entry is linked to the user's account. If not authenticated: user enters their email address (`WaitlistEntry.guestEmail`).
  6. System creates a `WaitlistEntry` record with `status = waiting`.
  7. System sends a confirmation email acknowledging the waitlist entry and stating the accept window duration (`Tenant.waitlistAcceptWindowMinutes`, default 120 min per OQ-009; range 30 min–48 hr).
**Alternate Flows:**
  - 4a. Specific-instructor mode selected and the instructor is not scheduled on that date — system logs the preference and notifies the admin; the entry is held as a standing request.
  - 5a. User is on the waitlist but then finds another available slot — user can book directly; their waitlist entry remains active until they manually remove it or it expires.
**Postconditions:** `WaitlistEntry` is active with `status = waiting`. User will be notified when a matching slot opens.
**Priority:** P1 (Beta)
**Open Questions:** None. Accept window configurability confirmed in OQ-009. `WaitlistEntry.guestEmail` erasure confirmed in OQ-026 (full record deletion required for right-to-erasure).

---

## UC-016 — Accept a Waitlist Notification and Confirm Booking

**Persona:** Guest or Head of Household
**Goal:** Respond to a waitlist opening notification and secure the booking within the accept window.
**Preconditions:** User has an active `WaitlistEntry` (UC-015). A slot has become available matching their waitlist criteria.
**Main Flow:**
  1. System detects an opening (booking cancellation, admin-added availability, or instructor availability expanded).
  2. System sets `WaitlistEntry.status = notified` and sends an email and/or SMS notification to the user with a one-click accept link.
  3. The accept window begins (`Tenant.waitlistAcceptWindowMinutes`; default 120 min).
  4. User clicks the accept link within the window.
  5. System presents the booking summary and payment step (using card on file if authenticated, or card entry if guest-checkout user).
  6. User confirms payment.
  7. System confirms the booking, sets `WaitlistEntry.status = accepted`, removes the waitlist hold, and sends a full confirmation email with `.ics` attachment.
**Alternate Flows:**
  - 3a. User does not respond within the accept window — `WaitlistEntry.status` transitions to `expired`; slot is offered to the next waitlisted user (by position, then by registration time).
  - 3b. User clicks a "Decline" link in the notification email — `WaitlistEntry.status = expired`; slot is offered to the next user immediately.
  - 6a. Payment fails — system retries once automatically; if it still fails, the user is notified and the slot is offered to the next waitlist entrant. `WaitlistEntry.status = expired`.
**Postconditions:** Booking is confirmed. `WaitlistEntry.status = accepted`. Slot is no longer available.
**Priority:** P1 (Beta)
**Open Questions:** None.

---

## 5. Use Cases — Lesson Packages

---

## UC-017 — Purchase a Lesson Package

**Persona:** Guest (authenticated) or Head of Household
**Goal:** Pre-purchase a multi-lesson package to receive a discounted rate or convenience of bulk booking credits.
**Preconditions:** Guest is signed in. The school has at least one active `LessonPackage` offering configured. Beta release required.
**Main Flow:**
  1. Guest navigates to the booking widget or account dashboard and selects "View Packages."
  2. System displays available lesson packages: name, number of lessons included, price, validity period (`LessonPackage.validityDays`).
  3. Guest selects a package and proceeds to payment.
  4. System charges the package price at time of purchase. The 1.5% platform fee applies to the full package purchase price (OQ-027).
  5. System creates a `LessonPackage` record with `status = active`, `remainingCount` set to the purchased lesson count, and `expiresAt = purchaseDate + validityDays`.
  6. A `Payment` record is created with `paymentType = package_purchase`.
  7. System sends a confirmation email with package details and expiry date.
**Alternate Flows:**
  - 4a. Payment is declined — system displays an error; no package is created.
  - 2a. No packages are available — section is hidden in the booking widget.
**Postconditions:** `LessonPackage` record is active. Guest has `remainingCount` credits available to redeem. Platform fee captured at purchase time.
**Priority:** P1 (Beta)
**Open Questions:** None. Fee timing confirmed in OQ-027: fee charged at purchase, not per redemption. Tip charges on package-redeemed bookings do attract the platform fee (OQ-027). Expiry behaviour confirmed in OQ-025.

---

## UC-018 — Redeem a Lesson Package Credit for a Booking

**Persona:** Guest (authenticated) or Head of Household
**Goal:** Apply an existing lesson package credit to a new booking instead of paying separately.
**Preconditions:** Guest is signed in. An active `LessonPackage` with `remainingCount > 0` exists and has not expired (`expiresAt` is in the future). UC-003 completed with an active soft hold.
**Main Flow:**
  1. At the payment step in the booking flow, system detects an eligible active package.
  2. System presents the option to redeem a package credit.
  3. Guest selects "Use Package Credit."
  4. System creates a `PackageRedemption` record linking the package to the booking.
  5. `LessonPackage.remainingCount` is decremented by 1.
  6. No new payment charge is made for the lesson itself (the fee was captured at package purchase, OQ-027).
  7. Booking is confirmed; confirmation email sent.
  8. If `Tenant.tipsEnabled = true`: after lesson completion, the post-lesson tip flow (UC-010) is triggered. A tip charge on a package-redeemed booking flows 100% to the instructor; the 1.5% fee does apply to the tip charge (OQ-027).
**Alternate Flows:**
  - 2a. Package has expired (`LessonPackage.expiresAt` has passed) — system does not present the redemption option; package credits are forfeited (OQ-025). Admin can manually extend the expiry (see UC-031).
  - 2b. Multiple active packages exist — system presents the one expiring soonest as the default; guest can select a different one.
  - 5a. `remainingCount` reaches 0 after redemption — `LessonPackage.status` transitions to `exhausted`.
**Postconditions:** `PackageRedemption` created. `LessonPackage.remainingCount` decremented. Booking confirmed with no new charge. Package marked `exhausted` if credits depleted.
**Priority:** P1 (Beta)
**Open Questions:** None. Expiry behaviour confirmed in OQ-025. Fee treatment on package-redeemed tips confirmed in OQ-027.

---

## 6. Use Cases — Group Lessons

---

## UC-019 — Book a Spot in a Group Lesson

**Persona:** Guest (anonymous or authenticated) or Head of Household
**Goal:** Reserve a spot in a scheduled group lesson session.
**Preconditions:** At least one `GroupSession` is active and has available capacity. Tenant is on Growth tier or above (group lessons are Growth+ only).
**Main Flow:**
  1. Guest selects "Group Lesson" as lesson type in the booking widget (UC-001).
  2. System displays available `GroupSession` entries: date, time, instructor(s), skill level, capacity remaining.
  3. Guest selects a session.
  4. System checks capacity: `GroupSession.currentEnrollment < GroupSession.maxCapacity` (three-level hierarchy: platform default → `LessonType.maxCapacity` → per-session override, per OQ-010).
  5. System checks instructor-to-student ratio: `GroupSession.instructorStudentRatio` (same hierarchy per OQ-013). If ratio would be exceeded, system prompts admin-override or blocks.
  6. Guest proceeds through authentication gate (UC-004 guest checkout or UC-005/006 account path).
  7. Booking confirmed; `GroupSession.currentEnrollment` incremented.
  8. Confirmation email sent with group session details and meeting point.
**Alternate Flows:**
  - 4a. Group session is at capacity — system presents the waitlist option (UC-015) specifically for this session.
  - 5a. Instructor-to-student ratio would be exceeded without an additional instructor — system flags the session to admin (UC-030) and does not allow further enrollment until resolved.
  - 3a. OQ-031 (unresolved) — if school-block billing is in scope, a group organiser could pay for multiple enrollments in one transaction. Currently, per-learner billing is the only supported model.
**Postconditions:** Booking confirmed. `GroupSession.currentEnrollment` incremented. All household members present in a group session have separate booking records.
**Priority:** P1 (Beta)
**Open Questions:** OQ-031 (unresolved) — school-block billing model: per-learner billing is the only supported path until OQ-031 is resolved. Tech-lead: do not implement `Payment.groupSessionId` until OQ-031 is resolved and confirmed in scope.

---

## UC-020 — View and Manage Group Session Enrollment (Admin)

**Persona:** School Admin
**Goal:** Monitor group session capacity, manage the instructor-to-student ratio, and handle enrollment edge cases.
**Preconditions:** Admin is signed in. At least one `GroupSession` exists.
**Main Flow:**
  1. Admin navigates to Schedule View and selects a group session.
  2. System displays enrolled students, capacity used vs. maximum, and current instructor-to-student ratio.
  3. Admin may add or remove enrolled students manually.
  4. Admin may override the per-session capacity cap (`GroupSession.maxCapacity`) or instructor-to-student ratio (`GroupSession.instructorStudentRatio`) — these are admin-only overrides.
  5. Admin may assign an additional instructor to the session if ratio is strained.
  6. System updates enrollment and notifies affected students of any changes.
**Alternate Flows:**
  - 4a. Admin raises capacity above the lesson-type default — system logs the override in `AuditLog`.
  - 3a. Admin removes a student — cancellation and refund policy applies (UC-026).
**Postconditions:** Group session enrollment is accurate. Capacity and ratio overrides are logged.
**Priority:** P1 (Beta)
**Open Questions:** OQ-031 (same as UC-019).

---

## 7. Use Cases — Instructor

---

## UC-021 — View Today's Schedule

**Persona:** Instructor
**Goal:** See all lessons assigned for the current day, including student details.
**Preconditions:** Instructor is signed in to the instructor PWA. At least one booking is assigned to the instructor for the current day.
**Main Flow:**
  1. Instructor opens the app to the Home screen.
  2. System displays all lesson cards for today in chronological order.
  3. Each card shows: student name (or "Family: [Household Name]" for household bookings), skill level, lesson type, and meeting point.
  4. Instructor taps a card to expand and view full booking details: student's contact, any notes from previous sessions, and learner history.
**Alternate Flows:**
  - 2a. No lessons are scheduled for today — system displays an empty state with the next scheduled lesson date.
  - 4a. Lesson is a group session — expanded view shows all enrolled students and the group skill level.
**Postconditions:** Instructor has reviewed the day's schedule and student details.
**Priority:** P0
**Open Questions:** None.

---

## UC-022 — Check In a Student

**Persona:** Instructor
**Goal:** Mark a student as arrived and begin the lesson, capturing waiver signature if required.
**Preconditions:** Instructor is signed in. A lesson is scheduled and the student is present. Lesson start time is within the check-in window.
**Main Flow:**
  1. Instructor taps the lesson card on the Home screen.
  2. Instructor taps "Check In."
  3. System checks `Learner.waiverStatus`: if waiver is not yet signed, system embeds the Smartwaiver signing interface (OQ-029 resolved: provider is Smartwaiver, which provides an API and mobile-compatible embed).
  4. Student or guardian completes the waiver. System stores `Learner.waiverToken`, `waiverSignedAt`, and `waiverVersion` via the Smartwaiver API.
  5. If embed times out (mountain wireless fallback), system presents a typed-name signature field. System stores the typed-name record; legal equivalence of typed-name fallback must be validated against US/Canadian liability law before Beta.
  6. Optionally, student or guardian provides an additional digital signature on the instructor's device.
  7. System marks the student as checked in, timestamps the event, and sets `Booking.status = in_progress`.
**Alternate Flows:**
  - 3a. Waiver is already signed (`Learner.waiverStatus = signed`) — system skips the waiver step and proceeds directly to check-in.
  - 2a. Instructor checks in a student early — system allows it but logs the actual check-in timestamp.
  - 3b. Student refuses to sign waiver — instructor may not complete check-in; system prompts instructor to contact admin.
**Postconditions:** Booking is marked `in_progress`. Check-in timestamp recorded. Waiver stored via Smartwaiver if applicable.
**Priority:** P0
**Open Questions:** None. Waiver provider confirmed as Smartwaiver (OQ-029). Typed-name fallback legal equivalence to be validated by legal before Beta.

---

## UC-023 — Mark a Student as No-Show

**Persona:** Instructor
**Goal:** Record that a student failed to appear for a scheduled lesson.
**Preconditions:** Instructor is signed in. A lesson's scheduled start time has passed and the student has not arrived.
**Main Flow:**
  1. Instructor taps the lesson card.
  2. Instructor taps "No-Show."
  3. System prompts for confirmation.
  4. Instructor confirms.
  5. System sets `Booking.status = no_show`, triggers an admin alert, and logs the event in `AuditLog`.
  6. The school's no-show policy is applied automatically (typically no refund; per the configured cancellation policy).
**Alternate Flows:**
  - 5a. Admin reviews the no-show alert and determines the student arrived late — admin overrides `Booking.status` back to `upcoming` or directly to `in_progress`. Override is logged.
  - 5b. Student arrives after no-show is marked — instructor must contact admin to reverse the no-show status.
**Postconditions:** Booking is in `no_show` status. Admin has been alerted. Refund policy applied per school configuration.
**Priority:** P0
**Open Questions:** None.

---

## UC-024 — Add Session Notes for a Student

**Persona:** Instructor
**Goal:** Document a student's progress after a lesson and optionally share notes with the student or household manager.
**Preconditions:** Instructor is signed in. A lesson has been completed (`Booking.status = completed`).
**Main Flow:**
  1. Instructor taps the completed lesson card.
  2. Instructor taps "Add Notes."
  3. Instructor types free-form progress notes for the student.
  4. Instructor selects sharing preference: share with student (and household manager) or keep internal.
  5. System saves the `BookingNote` linked to the booking and learner.
  6. If shared, notes become visible in the student's or household manager's booking history view (UC-007).
**Alternate Flows:**
  - 3a. Notes are written in French — stored as-is; no translation.
  - 4a. Instructor chooses not to share — notes visible only to the instructor and school admin. Not visible to guest/household.
  - 5a. Notes referencing identifiable student data: `BookingNote` records with `learnerId` FK are subject to the right-to-erasure policy. On erasure, the FK is replaced with an `ERASED_GUEST` placeholder and note content is retained (OQ-026). Notes older than 2 years are auto-purged.
**Postconditions:** `BookingNote` saved. If shared, visible in customer-facing booking history.
**Priority:** P0
**Open Questions:** None. Notes erasure scope confirmed in OQ-026.

---

## UC-025 — Manage Weekly Availability

**Persona:** Instructor
**Goal:** Set recurring and date-specific availability so that the booking calendar reflects accurate open slots.
**Preconditions:** Instructor is signed in.
**Main Flow:**
  1. Instructor navigates to Availability Management.
  2. System displays the current week with the instructor's availability blocks.
  3. Instructor sets recurring availability (e.g., available Mon–Fri 8 AM–4 PM).
  4. Instructor adds date-specific overrides (e.g., unavailable on Dec 26).
  5. System saves the availability and immediately updates the booking calendar's visible slots across all surfaces.
**Alternate Flows:**
  - 4a. The overridden date already has a confirmed booking — system warns the instructor that a conflict exists and that admin intervention is required to resolve it. The availability change is saved but the booking is not automatically cancelled.
  - 3a. Google Calendar sync — deferred to v1.5 (OQ-021). `OAuthToken` entity removed from v1.0 data model. References to Google Calendar sync must not appear in v1.0 instructor UI.
**Postconditions:** Instructor availability is updated. Future booking slots reflect the changes in real time. Conflict warnings surfaced where applicable.
**Priority:** P0
**Open Questions:** None. Google Calendar sync deferred to v1.5 (OQ-021).

---

## UC-026 — View Earnings Dashboard

**Persona:** Instructor
**Goal:** Review earnings by period and lesson type, including any tip income.
**Preconditions:** Instructor is signed in. At least one completed lesson exists.
**Main Flow:**
  1. Instructor navigates to the Earnings Dashboard.
  2. System displays earnings summaries: today, current week, and current season.
  3. Instructor can filter by a custom date range.
  4. Breakdown is shown by lesson type.
  5. If `Tenant.tipsEnabled = true`: a separate tips line item is shown, reflecting `Payment.tipAmountCents` records from completed post-lesson flows. Tips flow 100% to the instructor; platform fee does not apply to tip amounts (OQ-027).
  6. Earnings data feeds into the `WorkdayHandoff` reporting entity for payroll processing (OQ-006: report-only integration with Workday or equivalent; no direct deposit in v1.0).
**Alternate Flows:**
  - 2a. Instructor works at multiple resorts — earnings are displayed per tenant in full isolation; no cross-tenant earnings roll-up (OQ-015).
**Postconditions:** Instructor has a clear picture of their earnings, lesson activity, and tip income for any selected period.
**Priority:** P1 (Beta)
**Open Questions:** None. Earnings isolation per tenant confirmed in OQ-015. Payroll is report-only (OQ-006). Tips confirmed in scope (OQ-018).

---

## 8. Use Cases — School Admin

---

## UC-027 — Assign an Instructor to a Booking

**Persona:** School Admin
**Goal:** Manually assign or reassign an instructor to a pending or unassigned booking.
**Preconditions:** Admin is signed in to the admin app. An unassigned or pending booking exists in the scheduler.
**Main Flow:**
  1. Admin navigates to Schedule View.
  2. Admin locates the unassigned booking (highlighted in the drag-and-drop scheduler).
  3. Admin drags the booking card onto an available instructor slot, or uses the assignment dropdown.
  4. System performs a conflict check: verifies the instructor is available (`InstructorAvailability`) and has no overlapping bookings.
  5. System assigns the instructor, updates the `Booking` record, and transitions status to "confirmed."
  6. System notifies the instructor of the new booking via email (and push notification if PWA permissions granted).
**Alternate Flows:**
  - 4a. Conflict detected (double-booking) — system highlights the conflict and blocks the assignment until it is resolved. Admin must resolve the conflict first.
  - 3a. Admin manually overrides a detected conflict (e.g., lesson times are adjacent but do not truly overlap) — system requires explicit confirmation and logs the override in `AuditLog`.
**Postconditions:** Booking is assigned to an instructor. Instructor is notified. Booking status is "confirmed."
**Priority:** P0
**Open Questions:** None.

---

## UC-028 — Cancel a Booking and Apply Refund Policy

**Persona:** School Admin
**Goal:** Cancel an individual booking and issue the appropriate refund per the school's cancellation policy.
**Preconditions:** Admin is signed in. A booking in "upcoming" or "confirmed" status exists.
**Main Flow:**
  1. Admin navigates to Booking Management and locates the booking (filterable by instructor, lesson type, date, status).
  2. Admin selects "Cancel Booking."
  3. System calculates the applicable refund per the school's configured cancellation policy (default: non-refundable per OQ-014; custom full/partial refund windows are supported).
  4. System displays the refund amount and confirmation prompt.
  5. Admin confirms.
  6. System sets `Booking.status = cancelled`, releases the slot, and initiates the refund via the payment processor abstraction layer.
  7. System sends the student a cancellation email in their language with refund details.
**Alternate Flows:**
  - 3a. Admin applies a custom refund override (e.g., full refund as a customer-service gesture outside the policy window) — system allows the override but logs the admin user ID and reason in `AuditLog`.
  - 6a. Refund initiation fails on the processor — system flags the booking for manual review and alerts the admin. The booking status is set to `cancelled` regardless; refund resolution is manual.
**Postconditions:** Booking is cancelled. Slot is free. Refund is initiated per policy. Student is notified.
**Priority:** P0
**Open Questions:** None.

---

## UC-029 — Execute a Weather Cancellation (Bulk)

**Persona:** School Admin
**Goal:** Bulk-cancel all or a subset of lessons on a weather-affected date and initiate full refunds with rebooking links.
**Preconditions:** Admin is signed in. One or more lessons are scheduled for a date affected by weather closure.
**Main Flow:**
  1. Admin navigates to Booking Management and selects the affected date.
  2. Admin selects "Weather Cancellation" for the date, or scopes it to specific lesson types.
  3. System displays the count of affected bookings and total refund amount.
  4. Admin confirms the bulk cancellation.
  5. System cancels all selected bookings, sets status to `cancelled_weather`, and initiates full refunds for each.
  6. System sends each affected student a cancellation email in their language with: a weather-closure explanation, full refund confirmation, and a rebooking link (pre-filled with lesson type and skill level).
  7. All assigned instructors for those bookings are also notified by email.
**Alternate Flows:**
  - 2a. Admin scopes the cancellation to a specific lesson type only (e.g., cancels group lessons but keeps private lessons) — system applies the scope and skips lessons not matching the selected type.
  - 5a. A refund fails for a specific booking — system flags it individually; other refunds proceed. Admin sees a summary of failures.
**Postconditions:** All selected bookings are cancelled. Full refunds initiated. Students and instructors notified. Rebooking links sent.
**Priority:** P0
**Open Questions:** None.

---

## UC-030 — Reassign a Booking to a Different Instructor

**Persona:** School Admin
**Goal:** Move a confirmed booking to a different instructor due to instructor unavailability.
**Preconditions:** Admin is signed in. A booking is assigned to an instructor who is no longer available.
**Main Flow:**
  1. Admin locates the affected booking in the Schedule View.
  2. Admin selects "Reassign Instructor."
  3. System displays instructors who are available at the booking's date/time and are eligible for the lesson type and skill level.
  4. Admin selects the replacement instructor.
  5. System updates the booking, notifies the student of the instructor change (email in their language), and notifies both the original and new instructor.
**Alternate Flows:**
  - 3a. No eligible replacement instructor is available — system notifies admin. Admin may contact the student directly or initiate a cancellation (UC-028).
**Postconditions:** Booking is updated with the new instructor. All parties are notified.
**Priority:** P0
**Open Questions:** None.

---

## UC-031 — Manage Instructor Certification Records

**Persona:** School Admin
**Goal:** Track instructor certifications (PSIA/CSIA), receive expiry alerts, and block assignment of expired instructors.
**Preconditions:** Admin is signed in. An instructor profile exists in the system.
**Main Flow:**
  1. Admin navigates to Instructor Management > Staff Roster.
  2. Admin selects an instructor.
  3. Admin views or updates: certification body (PSIA or CSIA), certification level, and expiry date.
  4. System saves the record.
  5. System automatically flags the admin dashboard and sends an email alert when a certification is within 60 days of expiry.
  6. When a certification expires, system prevents the instructor from being assigned to new bookings until the record is updated.
**Alternate Flows:**
  - 5a. Admin dismisses the expiry alert — system re-surfaces it at 30 days and again at 7 days.
  - 6a. An expired instructor has existing upcoming bookings — system flags those bookings for admin review but does not automatically cancel them.
**Postconditions:** Certification record is current. Admin receives automated expiry alerts. Expired instructors are blocked from new assignments.
**Priority:** P0
**Open Questions:** None.

---

## UC-032 — Extend a Lesson Package Expiry

**Persona:** School Admin
**Goal:** Manually extend the expiry date on a guest's lesson package to accommodate illness, school closure, or other extenuating circumstances.
**Preconditions:** Admin is signed in. A `LessonPackage` record exists with an `expiresAt` date that is in the past or near-future, and `remainingCount > 0`.
**Main Flow:**
  1. Admin navigates to Booking Management > Lesson Packages.
  2. Admin searches for the guest's package by name, email, or package ID.
  3. Admin selects the package and chooses "Extend Expiry."
  4. Admin enters a new expiry date.
  5. System updates `LessonPackage.expiresAt` and logs the extension in `AuditLog` with the admin's user ID and reason.
  6. System sends the guest a notification email in their language confirming the extension.
**Alternate Flows:**
  - 4a. Admin enters an expiry date in the past — system prevents submission and displays a validation error.
  - 2a. Package has already been fully redeemed (`remainingCount = 0`) — extension is not applicable; system notifies admin.
**Postconditions:** `LessonPackage.expiresAt` updated. Extension logged. Guest notified. Unused credits are now redeemable until the new expiry.
**Priority:** P1 (Beta)
**Open Questions:** None. Expiry behaviour confirmed in OQ-025: forfeiture is the default; admin extension is the only exception path.

---

## UC-033 — Configure Lesson Types and Pricing

**Persona:** School Admin
**Goal:** Create, edit, and activate lesson types and their pricing so they appear in the booking widget.
**Preconditions:** Admin is signed in. The school is active with a valid subscription.
**Main Flow:**
  1. Admin navigates to Lesson Configuration.
  2. Admin selects "Create New Lesson Type" or edits an existing one.
  3. Admin enters: name (EN and FR), description (EN and FR), applicable skill levels, capacity (for group lessons), instructor-to-student ratio (for group lessons), duration, and base price.
  4. Admin sets whether the lesson type is active or draft.
  5. System saves the configuration; active lesson types appear in the booking widget immediately.
**Alternate Flows:**
  - 3a. Admin sets group lesson capacity at the lesson-type level — per-session overrides are possible from the schedule view (OQ-010).
  - 3b. Admin uses bulk lesson creation for a recurring group program (e.g., a 6-week junior academy) — system creates all session instances at once with shared configuration.
  - 3c. Admin enters a name only in one language — system accepts but flags the missing translation with a warning banner.
**Postconditions:** Lesson type is active and bookable. Pricing and capacity configuration are in effect.
**Priority:** P0
**Open Questions:** None.

---

## UC-034 — Generate a Revenue and Utilization Report

**Persona:** School Admin
**Goal:** Analyse revenue and instructor utilization for a given period, with CSV export capability.
**Preconditions:** Admin is signed in. At least one completed booking with a captured payment exists.
**Main Flow:**
  1. Admin navigates to Reporting.
  2. Admin selects report parameters: date range, instructor (optional filter), lesson type (optional filter), currency (preset to resort currency).
  3. System generates a revenue report: gross revenue, platform fee (1.5%), net revenue, broken down by instructor and lesson type.
  4. Admin views the report in the browser.
  5. Admin optionally exports to CSV.
**Alternate Flows:**
  - 2a. Admin selects utilization report — system shows booked instructor-hours vs. total available instructor-hours for the period, per instructor.
  - 5a. Export includes tip amounts as a separate column (line items from `Payment.tipAmountCents`).
**Postconditions:** Report generated and displayed. CSV export available if requested.
**Priority:** P0
**Open Questions:** None.

---

## UC-035 — Manage the Waitlist Panel

**Persona:** School Admin
**Goal:** Monitor all active waitlist entries, manually promote a student, and view notification history.
**Preconditions:** Admin is signed in. At least one active `WaitlistEntry` exists.
**Main Flow:**
  1. Admin navigates to the Waitlist Panel.
  2. System displays all active waitlist entries, filterable by: waitlist type (time-slot vs. specific-instructor), date, and status (waiting, notified, accepted, expired).
  3. Admin reviews notification history for each entry: when the accept window opened and whether it was accepted.
  4. Admin may manually promote a waitlisted student: selects the entry and clicks "Promote."
  5. System checks for an available slot matching the waitlist criteria.
  6. If a slot is available: system sends the student the standard accept notification (triggering UC-016 with the configured accept window).
  7. If no slot exists: system prompts admin to first create instructor availability.
**Alternate Flows:**
  - 4a. Admin promotes a student who is already expired — system prevents promotion and prompts admin to contact the student directly.
  - 2a. Admin filters by "specific-instructor" type to identify students waiting for a particular instructor — useful before reassigning that instructor.
**Postconditions:** Promoted student has received an accept notification. Admin has full visibility into waitlist state.
**Priority:** P1 (Beta)
**Open Questions:** None.

---

## UC-036 — Instructor Onboarding and Approval Workflow

**Persona:** Instructor (applicant) + School Admin (approver)
**Goal:** Bring a new instructor onto the platform with admin-reviewed profile approval before they are bookable.
**Preconditions:** A new instructor has been invited by a school admin or has self-registered via the instructor app.
**Main Flow:**
  1. Instructor completes their profile: name, photo, bio (EN and/or FR), certifications (PSIA/CSIA with level and expiry), languages spoken, and lesson types they are qualified to teach.
  2. Instructor submits the profile for admin review.
  3. School Admin reviews the submission in the Staff Roster view of the admin app.
  4. Admin approves the profile (or rejects it with written feedback).
  5. Upon approval: instructor's profile becomes visible in the booking widget's instructor browse view (UC-002). Instructor receives a notification that their profile is live.
  6. Certification expiry tracking is automatically activated (UC-031).
**Alternate Flows:**
  - 4a. Admin rejects the profile — instructor receives notification with feedback and can resubmit after corrections. Profile remains in draft status.
  - 1a. Certification document upload is required — system accepts the upload and flags it for admin review. Document is stored via Smartwaiver or an equivalent document storage path (OQ-029).
**Postconditions:** Instructor is approved and bookable. Certifications are on record with expiry tracking active.
**Priority:** P0
**Open Questions:** None.

---

## UC-037 — Perform a Right-to-Erasure Request

**Persona:** School Admin (on behalf of a guest request)
**Goal:** Pseudonymise or delete the personal data of a guest who has submitted a right-to-erasure (GDPR/PIPEDA) request.
**Preconditions:** Admin is signed in. A valid erasure request has been received. The guest is identified by email or booking reference.
**Main Flow:**
  1. Admin navigates to the erasure tool (admin settings > data management).
  2. Admin searches for the guest by email or `GuestCheckout` ID.
  3. System displays all PII-bearing records linked to the guest.
  4. Admin confirms the erasure.
  5. System applies the following dispositions per OQ-026:
     - `GuestCheckout`: `firstName`, `lastName`, `email`, `phone` → pseudonymised to "ERASED". All other fields retained.
     - `Payment`: `guestCheckoutId` FK → set to null. All financial fields retained (tax retention: 7 yr US / 6 yr CA).
     - `WaitlistEntry` (guest email): record deleted entirely. Auto-purge of expired/fulfilled entries also runs after 90 days (scheduled job).
     - `BookingNote`: `learnerId` / `guestCheckoutId` FK → replaced with `ERASED_GUEST` placeholder. Note content retained. Notes older than 2 years auto-purged.
     - `AuditLog`: retained in full (legal basis: fraud prevention, financial compliance). Max retention 3 years. Going forward, logs contain `userId` only, never raw email addresses.
  6. System logs the erasure action in `AuditLog` with admin user ID and timestamp.
  7. System confirms the erasure is complete.
**Alternate Flows:**
  - 2a. Guest has both a `GuestCheckout` record and an authenticated account — both sets of records must be included in the erasure scope. Admin is shown a combined view.
  - 4a. Guest has an active upcoming booking — system warns admin that cancelling the booking first is recommended before erasure. Erasure can proceed regardless.
**Postconditions:** Guest PII is pseudonymised or deleted per the defined scope. Financial records retained. Erasure action logged.
**Priority:** P1 (Beta — GDPR/PIPEDA compliance)
**Open Questions:** OQ-032 (unresolved) — if `parentalConsentGiven` and `parentalConsentAt` are added to `Learner`, these fields must be explicitly excluded from right-to-erasure (they constitute a legal consent record). Tech-lead: flag these fields as erasure-exempt once OQ-032 is resolved.

---

## 9. Use Cases — Resort Operator

---

## UC-038 — Configure Resort-Level Policies

**Persona:** Resort Operator
**Goal:** Set the resort's operating currency, default language, pricing floors, and default cancellation policy.
**Preconditions:** Operator is signed in to the operator portal. A resort entity exists in the system. Operator portal is a v1.0 GA surface.
**Main Flow:**
  1. Operator navigates to Resort Policies.
  2. Operator sets the resort's operating currency (USD or CAD).
  3. Operator sets the default language (EN or FR).
  4. Operator configures pricing floors and seasonal rate cards.
  5. Operator sets the default cancellation policy (default: non-refundable per OQ-014). Child schools inherit this default but may override it.
  6. System saves all settings and applies them immediately to the booking widget and all child schools.
**Alternate Flows:**
  - 2a. Operator changes currency mid-season with active bookings — system warns that existing bookings in the old currency are unaffected. Only new bookings will use the updated currency. No FX conversion is performed (each resort operates in one currency; no real-time FX per ux-flows.md).
  - 3a. Default language set to FR — booking widget defaults to FR for new sessions; users may still toggle to EN.
**Postconditions:** Resort-level policies are active. All associated schools inherit the defaults.
**Priority:** P2 (v1.0 GA)
**Open Questions:** None.

---

## UC-039 — Configure Payment Processor

**Persona:** Resort Operator
**Goal:** Connect Stripe or Shift4 to the resort so all bookings are processed through the selected gateway.
**Preconditions:** Operator is signed in. No processor is configured, or operator is switching processors.
**Main Flow:**
  1. Operator navigates to Payment Processor Configuration.
  2. Operator selects the processor: Stripe or Shift4.
     - Shift4 requires Growth tier or above (`Tenant.subscriptionTier >= growth`). Starter tier is Stripe-only (OQ-024).
  3. Operator enters the required credentials per the processor schema (OQ-024 resolved):
     - **Stripe**: `secretKey` (required), `webhookSecret` (required).
     - **Shift4 (Growth+)**: `model = "direct"` (required), `apiKey` (required), `merchantId` (required), `webhookSecret` (required).
  4. System encrypts and stores credentials via AWS KMS envelope encryption (per-tenant DEK, KEK in AWS KMS, per OQ-022). Credentials are never re-displayed after saving.
  5. System runs a test transaction to verify the integration.
  6. On success, the processor is active for all transactions at this resort.
**Alternate Flows:**
  - 5a. Test transaction fails — system displays a diagnostic error (no raw processor codes exposed) and prompts re-verification of credentials.
  - 2a. Starter-tier operator attempts to select Shift4 — system blocks selection and displays a tier-upgrade prompt.
  - 4a. Operator rotates credentials — existing credentials are replaced and immediately superseded; active transactions are not affected mid-flight.
**Postconditions:** Payment processor is configured and encrypted. All new bookings at this resort route through the selected processor.
**Priority:** P2 (v1.0 GA)
**Open Questions:** None. Credential schemas confirmed in OQ-024. Encryption via AWS KMS confirmed in OQ-022. Starter = Stripe-only confirmed in OQ-024.

---

## UC-040 — Set Up White-Label Booking Widget

**Persona:** Resort Operator
**Goal:** Customise the booking widget with resort branding (logo, colours, custom domain) and generate an embeddable snippet.
**Preconditions:** Operator is signed in. Resort is on the Enterprise tier.
**Main Flow:**
  1. Operator navigates to White-Label Configuration.
  2. Operator enters a custom domain (e.g., `lessons.alpineresort.com`).
  3. System provides DNS verification instructions and polls for verification.
  4. Operator uploads a logo and selects a colour scheme (primary and accent colours).
  5. System generates an embed code: both iframe and JS snippet variants.
  6. Operator copies the embed code and installs it on the resort's website.
  7. The booking widget renders with resort branding. Guest-facing URLs reflect the custom domain.
**Alternate Flows:**
  - 3a. Custom domain DNS is not yet verified — system displays a pending status; embed code generation is available but the custom domain will not resolve until verification passes.
  - 1a. Resort is not on Enterprise tier — white-label configuration is locked; system displays a tier-upgrade prompt.
**Postconditions:** Booking widget displays resort branding. Custom domain is active (once DNS verified). Embed code is ready for deployment.
**Priority:** P2 (v1.0 GA)
**Open Questions:** None.

---

## UC-041 — View Consolidated Resort Revenue Report

**Persona:** Resort Operator
**Goal:** See aggregated revenue across all schools at the resort (and across multiple resorts if applicable), with CSV export.
**Preconditions:** Operator is signed in. At least one school has completed bookings with captured payments.
**Main Flow:**
  1. Operator navigates to Consolidated Reporting.
  2. Operator selects a date range.
  3. System aggregates revenue across all schools at the resort: broken down by school, lesson type, and currency.
  4. For multi-resort operators: system shows a multi-resort summary with operator's configured base currency for cross-resort comparison. Schools in different currencies are presented with separate totals; no FX conversion is applied.
  5. Operator optionally exports to CSV or accounting software format.
**Alternate Flows:**
  - 4a. Schools operate in different currencies — each currency's totals are presented separately; no automated FX conversion.
  - 5a. Export includes platform fee and net revenue columns in addition to gross revenue.
**Postconditions:** Operator has a complete revenue picture across all schools and properties. CSV is available for accounting software import.
**Priority:** P2 (v1.0 GA)
**Open Questions:** None.

---

## UC-042 — Manage API Keys and Webhook Configuration

**Persona:** Resort Operator
**Goal:** Connect Slopebook to external systems (PMS, CRM, marketing automation) via webhooks and API keys.
**Preconditions:** Operator is signed in. An integration target exists.
**Main Flow:**
  1. Operator navigates to Integrations.
  2. Operator generates a new API key and assigns it a descriptive label (e.g., "CRM Integration – HubSpot").
  3. Operator configures a webhook endpoint URL and selects which events to subscribe to: e.g., `booking.confirmed`, `booking.cancelled`, `waitlist.promoted`, `lesson.completed`.
  4. System saves the webhook configuration and sends a test ping to the endpoint.
  5. Operator verifies receipt of the test ping in their external system.
  6. Webhook is now active; events are delivered in real time.
**Alternate Flows:**
  - 4a. Test ping fails — system displays the HTTP response code (without exposing internal details) and prompts operator to verify the endpoint URL.
  - 2a. Operator rotates an existing API key — system immediately revokes the old key and issues a new one. Operator is responsible for updating the external system.
  - 3a. Webhook endpoint is unreachable on subsequent deliveries — system retries with exponential backoff (implementation details for tech-lead); after N failures, the webhook is disabled and admin is notified.
**Postconditions:** Webhook is active. External systems receive real-time booking events. API key is valid for authenticated API calls.
**Priority:** P2 (v1.0 GA)
**Open Questions:** None. Retry/backoff policy for failed webhook deliveries not yet specified — tech-lead should define the retry count and backoff curve before v1.0 implementation.

---

## 10. Cross-Cutting Use Cases

---

## UC-043 — Language Selection and Bilingual Content Delivery

**Persona:** Guest, Head of Household, Instructor, School Admin, Resort Operator
**Goal:** Ensure all UI, content, and communications are delivered in the user's chosen language (EN or FR).
**Preconditions:** The resort has a configured default language. Content fields (lesson type descriptions, instructor bios) are entered in at least one language.
**Main Flow:**
  1. User accesses any application surface.
  2. System detects language in priority order: (1) account preference, (2) browser locale, (3) resort default.
  3. All UI labels, lesson descriptions, instructor bios, and system-generated emails/SMS are rendered in the detected language.
  4. When the user changes preference (UC-009), all subsequent communications reflect the change.
**Alternate Flows:**
  - 3a. A content field is only available in one language — system falls back to the available language rather than displaying blank.
  - 3b. EN/FR availability by app surface and release phase: `customer` and `instructor` apps: EN/FR at Alpha (OQ-001). `admin` and `operator` apps: EN/FR at Beta (OQ-001).
**Postconditions:** User experiences a consistent bilingual interface. All emails and SMS are in the correct language.
**Priority:** P0
**Open Questions:** OQ-030 (unresolved) — whether FR is suppressed on Starter tier for `customer` app and `instructor` PWA. Until resolved, FR is treated as available on all tiers for these two surfaces.

---

## UC-044 — Notification Delivery (Email and SMS)

**Persona:** Guest, Head of Household, Instructor, School Admin
**Goal:** Ensure all transactional notifications (booking confirmations, cancellations, waitlist alerts, no-show alerts, certification expiries) are reliably delivered in the recipient's language.
**Preconditions:** A triggering event occurs. The recipient has a registered email address.
**Main Flow:**
  1. System detects the triggering event (e.g., booking confirmed, booking cancelled, waitlist slot opened).
  2. System selects the notification template based on event type and recipient's language preference.
  3. System dispatches email via SendGrid (OQ-016).
  4. If the recipient has a verified phone number and has not opted out (`User.smsOptOut = false`): system dispatches an SMS.
  5. For booking-related confirmations: email includes a `.ics` calendar attachment.
  6. CASL compliance: unsubscribe link is present in all marketing-adjacent emails. Transactional emails are exempt from unsubscribe requirements but must not include marketing content. `User.emailOptOut` is respected; transactional booking emails are sent regardless (guests must receive booking confirmations).
**Alternate Flows:**
  - 3a. Email delivery fails — SendGrid retries per its retry policy; if all fail, the failure is logged for admin review.
  - 4a. Recipient has not provided a phone number — SMS step skipped silently.
  - 4b. Recipient has `User.smsOptOut = true` — SMS step skipped; no notification of the suppression is shown to the user.
**Postconditions:** Recipient has received the notification in their language. Calendar event created in their client if they accepted the `.ics`.
**Priority:** P0
**Open Questions:** None. SendGrid confirmed as provider (OQ-016). CASL and `emailOptOut`/`smsOptOut` confirmed (OQ-016).

---

## UC-045 — Payment Processing Abstraction

**Persona:** Guest / Head of Household (payer); School Admin (refund initiator); Resort Operator (processor configurator)
**Goal:** Route all payment and refund operations through the correct processor (Stripe or Shift4) transparently, without exposing processor-specific details to application surfaces.
**Preconditions:** A payment or refund event is triggered. A processor is configured and active for the resort (UC-039).
**Main Flow:**
  1. System receives a payment or refund request from an application surface.
  2. The payment abstraction layer reads `Tenant.paymentProcessor` and `Tenant.paymentModel` to determine the routing target.
  3. Abstraction layer decrypts `Tenant.paymentCredentials` via AWS KMS to retrieve the required fields (OQ-022, OQ-024).
  4. Abstraction layer submits the request to the processor and returns a normalised success or failure response to the calling service.
  5. System records the transaction result in `Payment`, including `platformFeeCents` (1.5% of `amountCents`, excluding `tipAmountCents`).
  6. On success: appropriate confirmation or refund notification is dispatched (UC-044).
**Alternate Flows:**
  - 4a. Processor returns a failure — abstraction layer maps the error to a user-facing message without exposing raw processor error codes.
  - 4b. Stored card token is expired or invalid (`PaymentMethod.isValid = false`) — system prompts user to update their payment method before retrying.
  - 3a. Credentials decryption fails (KMS unavailable) — system returns a 503 and queues a retry; no partial charge is made.
**Postconditions:** Transaction is recorded. `Payment` record reflects outcome. No processor-specific data is exposed outside the abstraction layer.
**Priority:** P0
**Open Questions:** None. AWS KMS encryption confirmed (OQ-022). Credential schemas confirmed (OQ-024). Platform fee basis confirmed (OQ-027): 1.5% on `amountCents` only, tips excluded.

---

## 11. Use Cases Deferred to Later Releases

The following capabilities are explicitly out of scope for v1.0 GA and are deferred per the product roadmap.

| Deferred Use Case | Target Release | Reason / Source |
|---|---|---|
| Native iOS app — booking and schedule management | v2.0 | Responsive PWA is the v1.0 delivery; native app requires platform-specific development. OQ-003 resolved: PWA sufficient through Beta; formal usability gate at Alpha. |
| Native Android app — booking and schedule management | v2.0 | Same rationale as iOS. |
| AI-based instructor matching | v2.0 | Requires training data from live bookings; premature for v1.0. Non-goal in overview.md. |
| Dynamic pricing | v2.0 | Requires demand data and pricing governance not yet specified. Non-goal in overview.md. |
| Google Calendar sync | v1.5 | OQ-021 resolved: deferred. `OAuthToken` entity removed from v1.0 data model. Must not appear in any v1.0 code path (DEFERRED-001). |
| Gift card purchase and redemption | v1.5 | Payment flow variant; deferred to allow focus on core booking in v1.0. |
| QuickBooks and accounting software direct integration | v1.5 | CSV export covers v1.0 reporting needs. |
| Multi-school management under a single admin | v1.5 | Requires additional data modelling for cross-school admin roles. |
| Cross-processor card-on-file token vault migration | v1.5 | OQ-004: processor-managed vault per tenant in v1.0; cross-processor vault deferred. |
| Additional processor support beyond Stripe and Shift4 | v1.5 | Abstraction layer supports future processors; onboarding additional processors is post-v1.0. |
| Shift4 platform MID / PayFac model for Starter tier | v1.5 | OQ-024 resolved: Starter is Stripe-only in v1.0. No platform MID in v1.0. |
| Direct payroll deposit (instructor) | v2.0 | OQ-006: Workday handoff report-only in v1.0. Direct deposit deferred. |
| Additional languages beyond English and French | v2.0 | Bilingual EN/FR is core differentiator; further languages are future expansion. |
| Additional currencies beyond USD and CAD | v2.0 | Multi-currency expansion requires FX policy decisions not yet made. |
| Lift ticket sales and POS integration | Not on roadmap | Non-goal in overview.md. |
| Equipment rental management | Not on roadmap | Non-goal in overview.md. |
| SOC 2 certification process | v1.5 | Compliance audit timeline aligned with v1.5. |
| PIPEDA compliance audit | v1.5 | Audit timeline aligned with v1.5. |

---

## 12. Open Questions Cross-Reference

The following open questions from `open-questions.md` remain unresolved and directly affect use cases in this document. Downstream leads must not finalise the affected areas until these are resolved.

| OQ # | Status | Title | Affected Use Cases | Urgency |
|---|---|---|---|---|
| OQ-030 | Unresolved | French language suppression on Starter tier | UC-001, UC-009, UC-043 | MEDIUM |
| OQ-031 | Unresolved | GroupSession school-block billing in scope or deferred | UC-019, UC-020 | MEDIUM |
| OQ-032 | Unresolved | Parental consent fields schema and erasure exemption | UC-011, UC-037 | LOW |

All other open questions (OQ-001 through OQ-029) are resolved. Their decisions are embedded in the use cases above. See `open-questions.md` for the full decision log.

---

## 13. UX Flow Coverage Checklist

This section confirms that every named flow in `ux-flows.md` is covered by at least one use case.

| UX Flow Section | Covered By |
|---|---|
| 1. Customer Booking — landing, lesson type, skill level | UC-001 |
| 1. Customer Booking — browse instructors | UC-002 |
| 1. Customer Booking — select date, time slot, soft hold | UC-003 |
| 1. Customer Booking — authentication gate (guest checkout) | UC-004 |
| 1. Customer Booking — authentication gate (create account) | UC-005 |
| 1. Customer Booking — authentication gate (sign in, card on file) | UC-006 |
| 1. Customer Booking — learner selection (household) | UC-012 |
| 1. Customer Booking — payment (new card, card on file) | UC-005, UC-006 |
| 1. Customer Booking — confirmation (email, SMS, .ics) | UC-004, UC-005, UC-006 via UC-044 |
| 1. Waitlist path — join waitlist (any instructor / specific instructor) | UC-015 |
| 1. Waitlist path — accept notification, confirm booking | UC-016 |
| 2. Account & Household — upcoming lessons, modify/cancel | UC-013, UC-008 |
| 2. Account & Household — household members (add/edit/remove) | UC-011 |
| 2. Account & Household — payment methods | UC-014 |
| 2. Account & Household — booking history, session notes | UC-007 |
| 2. Account & Household — language preference | UC-009 |
| 3. Instructor PWA — today's schedule | UC-021 |
| 3. Instructor PWA — check-in, digital signature, waiver | UC-022 |
| 3. Instructor PWA — session notes | UC-024 |
| 3. Instructor PWA — no-show | UC-023 |
| 3. Instructor PWA — weekly availability management | UC-025 |
| 3. Instructor PWA — earnings dashboard (daily/weekly/seasonal, tips) | UC-026 |
| 4. Admin Dashboard — visual drag-and-drop scheduler | UC-027 |
| 4. Admin Dashboard — instructor management (certification, onboarding) | UC-031, UC-036 |
| 4. Admin Dashboard — booking management (cancel, weather cancel, reassign) | UC-028, UC-029, UC-030 |
| 4. Admin Dashboard — waitlist panel (promote, notification history) | UC-035 |
| 4. Admin Dashboard — lesson configuration (create/edit, bulk group) | UC-033 |
| 4. Admin Dashboard — reporting (revenue, utilization, CSV) | UC-034 |
| 5. Operator Portal — multi-school dashboard | UC-041 |
| 5. Operator Portal — white-label configuration | UC-040 |
| 5. Operator Portal — resort policies | UC-038 |
| 5. Operator Portal — payment processor configuration | UC-039 |
| 5. Operator Portal — integrations (webhooks, API keys) | UC-042 |
| 5. Operator Portal — consolidated reporting | UC-041 |
| Post-lesson tip + rating flow (OQ-023, OQ-028) | UC-010 |
| Lesson package purchase (OQ-019) | UC-017 |
| Lesson package redemption (OQ-019) | UC-018 |
| Lesson package expiry extension (OQ-025) | UC-032 |
| Group lesson booking (confirmed Beta) | UC-019 |
| Group lesson admin management | UC-020 |
| Right-to-erasure (OQ-026) | UC-037 |
| Cross-cutting: language and bilingual delivery | UC-043 |
| Cross-cutting: notification delivery | UC-044 |
| Cross-cutting: payment abstraction | UC-045 |

---

## 14. Missing Steps and Edge Cases Flagged in UX Flows

The following gaps were identified in `ux-flows.md` during use-case elaboration. These are flagged for the UX/UI lead and tech lead.

1. **Soft-hold expiry countdown** — `ux-flows.md` does not mention displaying a countdown timer to the guest. UC-003 adds this requirement. UX-lead: add a visible timer component to the checkout flow mockups.

2. **Waiver embed timeout fallback** — `ux-flows.md` shows check-in with "optional digital signature" but does not describe what happens when the Smartwaiver embed times out on mountain wireless. UC-022 adds a typed-name fallback. UX-lead: design the fallback screen. Legal must validate typed-name equivalence before Beta.

3. **Post-lesson rating/tip prompt** — `ux-flows.md` does not describe how the tip/rating prompt is delivered (it is a post-lesson email trigger, not an in-app screen in the instructor flow). UC-010 clarifies this. UX-lead: no additional screen needed in the instructor PWA for this flow; it is customer-app only.

4. **Group lesson capacity/ratio block** — `ux-flows.md` does not describe what happens when enrolling in a group lesson would exceed the instructor-to-student ratio. UC-019 step 5 adds this blocking path. UX-lead: add a "session full" or "ratio exceeded" state to the group lesson booking flow mockups.

5. **Package redemption at checkout** — `ux-flows.md` does not show a "use package credit" option at the payment step. UC-018 adds this. UX-lead: add a package-credit selector to the payment step in the customer app checkout mockups (appears only when the user has an active package).

6. **Language fallback in content fields** — `ux-flows.md` states instructor bios are shown in EN/FR but does not specify fallback behaviour when a bio is only in one language. UC-002 and UC-043 add the explicit fallback rule. UX-lead: no additional design required but copy guidelines should state "if only one language is available, show that language with a subtle indicator."

7. **Admin weather cancellation scope** — `ux-flows.md` mentions "bulk cancel with automated student notifications + rebooking link" but does not describe scoping to specific lesson types. UC-029 adds the scope selector. UX-lead: add a lesson-type filter checkbox to the weather cancellation confirmation modal.
