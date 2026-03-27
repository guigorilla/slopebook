# Slopebook — Use Cases

**Document Status:** Draft
**Last Updated:** 2026-03-24
**Author:** Product Lead

---

## 1. Overview

This document defines the formal use cases for Slopebook, a cloud-based SaaS platform for ski resort lesson management. It covers all five primary personas — Guest (Student), Head of Household, Instructor, School Admin, and Resort Operator — across the full lesson lifecycle: discovery, booking, payment, instruction, post-lesson review, and platform configuration.

The use cases are derived from the product overview, UX flow specifications, and open questions log. They represent the intended behavior of the four application surfaces (customer, instructor, admin, operator) and span both the Alpha and Beta releases, with v1.0 GA features clearly distinguished. Use cases deferred beyond v1.0 are enumerated in Section 4. Open questions that directly affect specific use cases are cross-referenced in Section 5.

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

## 2. Use Cases by Persona

---

### 2.1 Guest (Student)

---

#### UC-001: Browse and Select a Lesson Type

- **Actor:** Guest
- **Preconditions:** The booking widget is accessible (embedded on resort site or standalone). At least one lesson type is configured and active for the resort.
- **Main Flow:**
  1. Guest navigates to the booking widget.
  2. System presents available lesson types (private, semi-private, group, half-day, full-day).
  3. Guest selects a lesson type.
  4. Guest selects their skill level (beginner, intermediate, advanced).
  5. System filters and displays eligible instructors and available dates based on the selected type and skill level.
- **Alternate Flows / Extensions:**
  - 4a. Guest does not select a skill level — system prompts with a brief skill self-assessment before proceeding.
  - 5a. No instructors are eligible for the selected combination — system displays a message and suggests alternative dates or lesson types.
- **Postconditions:** Guest has a lesson type and skill level selected; the booking flow proceeds to instructor or date selection.

---

#### UC-002: Browse Instructor Profiles

- **Actor:** Guest
- **Preconditions:** UC-001 completed. At least one instructor is eligible for the selected lesson type and skill level.
- **Main Flow:**
  1. System displays a list of eligible instructor profile cards.
  2. Each card shows: photo, display name, bio (in the resort's configured language, EN or FR), certifications (PSIA/CSIA), languages spoken, and average rating.
  3. Guest optionally selects a preferred instructor.
  4. Flow proceeds to date and time selection scoped to that instructor's availability.
- **Alternate Flows / Extensions:**
  - 3a. Guest skips instructor selection — flow proceeds to date/time selection showing any available instructor for each slot.
- **Postconditions:** Guest has optionally chosen a preferred instructor; date/time selection step is reached.

---

#### UC-003: Select a Date and Time Slot

- **Actor:** Guest
- **Preconditions:** UC-001 completed. Optionally UC-002 completed.
- **Main Flow:**
  1. System displays a calendar showing dates that have at least one available slot matching the lesson criteria.
  2. Guest selects a date.
  3. System displays available time slots for that date, each showing the available instructor(s).
  4. Guest selects a time slot.
  5. System reserves the slot temporarily (soft hold) for the duration of the booking session.
- **Alternate Flows / Extensions:**
  - 2a. No available dates exist — system presents the waitlist option (see UC-014).
  - 4a. The last available slot is taken between step 3 and step 5 — system notifies the guest and refreshes the calendar.
- **Postconditions:** A specific date, time slot, and instructor are associated with the pending booking. A soft hold is active on the slot.

---

#### UC-004: Complete Guest Checkout (No Account)

- **Actor:** Guest
- **Preconditions:** UC-003 completed. Guest does not have or does not wish to create an account.
- **Main Flow:**
  1. System presents the booking summary: lesson type, instructor, date, time, skill level, price in resort currency (USD or CAD).
  2. System presents the authentication gate; guest selects "Guest Checkout."
  3. Guest enters email address.
  4. Guest enters payment card details; card is tokenized via the configured processor (Stripe or Shift4).
  5. Guest optionally accepts option to save card for future bookings (requires account creation).
  6. Guest reviews and confirms the booking.
  7. System charges the card, creates a booking record, and releases the soft hold.
  8. System sends confirmation email with lesson details, receipt, and .ics calendar attachment, in the guest's browser language.
- **Alternate Flows / Extensions:**
  - 4a. Payment is declined — system displays a processor-agnostic error message and prompts the guest to re-enter card details or use a different card.
  - 6a. Guest abandons checkout — soft hold expires after session timeout; slot returns to available inventory.
- **Postconditions:** Booking is confirmed and in "upcoming" status. Guest has received a confirmation email. No account has been created.

---

#### UC-005: Create an Account and Book a Lesson

- **Actor:** Guest
- **Preconditions:** UC-003 completed. Guest selects "Create Account" at the authentication gate.
- **Main Flow:**
  1. Guest enters name, email address, and password.
  2. System creates the account and logs the guest in.
  3. Guest optionally sets language preference (EN or FR).
  4. Flow continues to payment (see UC-004 steps 4–8).
  5. System stores a card token if the guest opts in.
  6. Booking is confirmed and appears in the account dashboard.
- **Alternate Flows / Extensions:**
  - 1a. Email address is already registered — system prompts guest to sign in instead.
- **Postconditions:** Account exists. Booking is confirmed and visible in the account dashboard. Card token is stored if opted in.

---

#### UC-006: Sign In and Book with Card on File

- **Actor:** Guest (returning, authenticated)
- **Preconditions:** UC-003 completed. Guest has an existing account with at least one stored payment token.
- **Main Flow:**
  1. Guest selects "Sign In" at the authentication gate.
  2. Guest enters credentials and authenticates.
  3. System displays the stored card(s); default card is pre-selected.
  4. Guest reviews the booking summary and confirms with one tap/click.
  5. System charges the default card on file.
  6. Booking is confirmed; confirmation email and .ics attachment sent.
- **Alternate Flows / Extensions:**
  - 3a. Guest selects a non-default card from the stored list.
  - 3b. Guest chooses to enter a new card — enters details, tokenized and optionally saved.
  - 5a. Charge to card on file fails — system prompts guest to update payment method.
- **Postconditions:** Booking confirmed. Charge captured. Booking visible in account dashboard.

---

#### UC-007: View Booking History and Receipts

- **Actor:** Guest (authenticated)
- **Preconditions:** Guest is signed in. At least one past booking exists.
- **Main Flow:**
  1. Guest navigates to Account Dashboard > Booking History.
  2. System displays a list of past lessons with date, instructor, lesson type, and amount paid.
  3. Guest selects a past booking.
  4. System displays the full receipt and, if the instructor shared session notes, the progress notes for that session.
- **Alternate Flows / Extensions:**
  - 4a. Instructor has not shared session notes — notes section is hidden or shows a placeholder.
- **Postconditions:** Guest has reviewed past booking details and/or receipt.

---

#### UC-008: Modify or Cancel an Upcoming Booking

- **Actor:** Guest (authenticated)
- **Preconditions:** Guest is signed in. At least one upcoming booking exists.
- **Main Flow:**
  1. Guest navigates to Account Dashboard > Upcoming Lessons.
  2. Guest selects a booking and chooses "Cancel."
  3. System displays the applicable cancellation policy and calculates the refund amount.
  4. Guest confirms the cancellation.
  5. System cancels the booking, releases the slot, and initiates the refund per the configured policy.
  6. System sends a cancellation confirmation email.
- **Alternate Flows / Extensions:**
  - 3a. Booking is within the non-refundable window — system displays that no refund will be issued; guest must confirm.
  - 5a. Refund fails on the processor side — system flags the booking for admin review and notifies the school admin.
- **Postconditions:** Booking is cancelled. Slot is released back to inventory. Refund is initiated per policy.

---

#### UC-009: Switch Language Preference

- **Actor:** Guest (authenticated)
- **Preconditions:** Guest is signed in.
- **Main Flow:**
  1. Guest navigates to Account Dashboard > Language Preference.
  2. Guest toggles between English and French.
  3. System updates the UI immediately and persists the preference to the account.
  4. All future email and SMS communications are sent in the selected language.
- **Alternate Flows / Extensions:**
  - N/A
- **Postconditions:** Language preference is saved. UI and all future communications are in the selected language.

---

### 2.2 Head of Household

---

#### UC-010: Set Up a Household Account with Learner Sub-Profiles

- **Actor:** Head of Household
- **Preconditions:** Head of Household has an account (created via UC-005 or directly). No learner sub-profiles exist yet.
- **Main Flow:**
  1. Head of Household navigates to Account Dashboard > Household Members.
  2. Selects "Add Learner."
  3. Enters learner details: name, date of birth, skill level.
  4. System creates a sub-profile linked to the household account.
  5. Repeat steps 2–4 for each additional family member.
- **Alternate Flows / Extensions:**
  - 3a. Learner's date of birth indicates they are below the platform minimum age threshold — system blocks creation and displays guidance. (See OQ-007.)
  - 3b. Head of Household adds themselves as a learner as well — allowed; the account holder can also be a student.
- **Postconditions:** One or more learner sub-profiles exist under the household. Each sub-profile has a name, date of birth, and skill level.

---

#### UC-011: Book a Lesson on Behalf of a Household Member

- **Actor:** Head of Household
- **Preconditions:** Head of Household is signed in. At least one learner sub-profile exists (UC-010). UC-003 completed.
- **Main Flow:**
  1. At the learner selection step in the booking flow, system presents the list of household sub-profiles.
  2. Head of Household selects the learner for whom the lesson is being booked.
  3. System pre-fills the skill level from the sub-profile; Head of Household may override it.
  4. Flow continues to payment (UC-006 card-on-file path or new card entry).
  5. Booking is confirmed and associated with the selected learner's sub-profile.
  6. Confirmation email sent to Head of Household.
- **Alternate Flows / Extensions:**
  - 1a. Head of Household adds a new learner inline during checkout rather than navigating to household management first.
  - 3a. Head of Household overrides skill level — system uses the overridden value for this booking but does not update the sub-profile's default.
- **Postconditions:** Booking is confirmed and linked to the learner sub-profile. Visible in the household's upcoming lessons view.

---

#### UC-012: View All Upcoming Lessons for the Household

- **Actor:** Head of Household
- **Preconditions:** Head of Household is signed in. At least one upcoming booking exists for any household member.
- **Main Flow:**
  1. Head of Household navigates to Account Dashboard > Upcoming Lessons.
  2. System displays all upcoming lessons across all household members, showing learner name, date, instructor, lesson type, and time.
  3. Head of Household can tap/click any booking to view details or initiate a cancellation (see UC-008).
- **Alternate Flows / Extensions:**
  - 2a. Multiple bookings exist on the same date — displayed chronologically per day.
- **Postconditions:** Head of Household has a complete view of all household lesson commitments.

---

#### UC-013: Manage Stored Payment Methods

- **Actor:** Head of Household (also applies to any authenticated Guest)
- **Preconditions:** User is signed in.
- **Main Flow:**
  1. User navigates to Account Dashboard > Payment Methods.
  2. System displays all stored cards (masked card number, card type, expiry).
  3. User may: add a new card (tokenized via processor), remove an existing card, or set a different card as the default.
- **Alternate Flows / Extensions:**
  - 3a. User attempts to remove the only stored card while an upcoming booking's auto-charge is pending — system warns the user before deletion.
- **Postconditions:** Payment method list is updated. Default card is set per user preference.

---

### 2.3 Waitlist (Guest and Head of Household)

---

#### UC-014: Join the Waitlist for a Lesson Slot

- **Actor:** Guest or Head of Household
- **Preconditions:** UC-003 attempted. The desired slot has no availability.
- **Main Flow:**
  1. System detects no availability for the selected date/time/lesson type and presents the waitlist option.
  2. User selects "Join Waitlist."
  3. System presents two waitlist modes:
     - **Any instructor** — user wants any available instructor at this date/time.
     - **Specific instructor** — user wants only a specific instructor at this date/time.
  4. User selects a mode and confirms.
  5. If the user is authenticated, waitlist entry is linked to their account. If not, user provides email address.
  6. System creates a waitlist entry in "waiting" status (canonical initial state; `WaitlistEntry.status enum(waiting, notified, accepted, expired)` per `data-model-proposed.md`).
  7. System sends a confirmation email acknowledging the waitlist entry, including the 2-hour accept window policy.
- **Alternate Flows / Extensions:**
  - 3a. User selects specific instructor mode and the instructor is not yet teaching on that date — system notifies admin and logs the preference.
- **Postconditions:** Waitlist entry is active. User will be notified when a slot opens.

---

#### UC-015: Accept a Waitlist Notification and Confirm Booking

- **Actor:** Guest or Head of Household
- **Preconditions:** User is on the waitlist (UC-014). A slot has become available matching their waitlist entry.
- **Main Flow:**
  1. System detects an opening (booking cancellation or instructor availability added).
  2. System sends a notification (email and/or SMS) to the user with a one-click accept link.
  3. User receives the notification and clicks the accept link within the 2-hour window.
  4. System presents the booking summary and payment step.
  5. User confirms payment (card on file or new card).
  6. System confirms the booking, removes the user from the waitlist, and sends a full confirmation email with .ics attachment.
- **Alternate Flows / Extensions:**
  - 3a. User does not respond within 2 hours — waitlist entry is marked as "expired"; slot is offered to the next waitlisted user.
  - 3b. User declines — waitlist entry is removed; slot is offered to the next user.
  - 5a. Payment fails — system retries once, then notifies the user and moves to the next waitlist entrant.
- **Postconditions:** Booking is confirmed. Waitlist entry is resolved. Slot is no longer available.

---

### 2.4 Instructor

---

#### UC-016: View Today's Schedule

- **Actor:** Instructor
- **Preconditions:** Instructor is signed in to the instructor PWA. At least one booking is assigned to the instructor for the current day.
- **Main Flow:**
  1. Instructor opens the app to the Home screen.
  2. System displays all lesson cards for today in chronological order.
  3. Each card shows: student name (or "Family: [Household Name]"), skill level, lesson type, and meeting point.
  4. Instructor taps a card to expand and view full booking details.
- **Alternate Flows / Extensions:**
  - 2a. No lessons are scheduled for today — system displays an appropriate empty state with the next scheduled lesson date.
- **Postconditions:** Instructor has reviewed the day's schedule.

---

#### UC-017: Check In a Student

- **Actor:** Instructor
- **Preconditions:** Instructor is signed in. A lesson is scheduled and the student is present. Lesson start time is within the check-in window.
- **Main Flow:**
  1. Instructor taps the lesson card on the Home screen.
  2. Instructor taps "Check In."
  3. System marks the student as checked in and timestamps the event.
  4. Optionally, student or guardian provides a digital signature on the instructor's device.
  5. System updates the booking status to "in progress."
- **Alternate Flows / Extensions:**
  - 4a. Electronic waiver capture is required — system prompts for waiver acknowledgment and signature before check-in completes. (See OQ-008.)
  - 2a. Instructor checks in a student early — system allows it but logs the actual check-in time.
- **Postconditions:** Booking is marked as in progress. Check-in time is recorded. Waiver signature stored if applicable.

---

#### UC-018: Mark a Student as No-Show

- **Actor:** Instructor
- **Preconditions:** Instructor is signed in. A lesson's scheduled start time has passed and the student has not arrived.
- **Main Flow:**
  1. Instructor taps the lesson card.
  2. Instructor taps "No-Show."
  3. System prompts for confirmation.
  4. Instructor confirms.
  5. System marks the booking as "no-show," triggers an alert to the school admin, and logs the event.
- **Alternate Flows / Extensions:**
  - 5a. Admin reviews the no-show alert and determines a late arrival is acceptable — admin overrides the status back to "upcoming."
- **Postconditions:** Booking is in "no-show" status. Admin has been alerted. Refund policy is applied per school configuration (typically no refund for no-show).

---

#### UC-019: Add Session Notes for a Student

- **Actor:** Instructor
- **Preconditions:** Instructor is signed in. A lesson has been completed (checked in and concluded).
- **Main Flow:**
  1. Instructor taps the completed lesson card.
  2. Instructor taps "Add Notes."
  3. Instructor types free-form progress notes for the student.
  4. Instructor selects whether to share the notes with the student (and household manager).
  5. System saves the notes linked to the booking record.
  6. If shared, the notes become visible in the student's or household manager's booking history.
- **Alternate Flows / Extensions:**
  - 3a. Notes are written in French — system stores as-is; no translation is performed.
  - 4a. Instructor chooses not to share — notes are visible only to the instructor and school admin.
- **Postconditions:** Session notes are saved. If shared, notes are visible in the customer-facing booking history.

---

#### UC-020: Manage Weekly Availability

- **Actor:** Instructor
- **Preconditions:** Instructor is signed in.
- **Main Flow:**
  1. Instructor navigates to Availability Management.
  2. System displays the current week with the instructor's availability blocks.
  3. Instructor sets recurring availability (e.g., available Mon–Fri 8 AM–4 PM).
  4. Instructor adds date-specific overrides (e.g., unavailable on a specific date for a personal event).
  5. System saves the availability and immediately updates the booking calendar's visible slots.
- **Alternate Flows / Extensions:**
  - 4a. The overridden date already has a confirmed booking — system warns the instructor that a conflict exists and requires admin intervention to resolve.
  - 3a. Instructor syncs with Google Calendar (v1.0 feature) — availability is reflected bidirectionally. (See UC-029.)
- **Postconditions:** Instructor availability is updated. Future booking slots reflect the changes in real time.

---

#### UC-021: View Earnings Dashboard

- **Actor:** Instructor
- **Preconditions:** Instructor is signed in. At least one completed lesson exists.
- **Main Flow:**
  1. Instructor navigates to the Earnings Dashboard.
  2. System displays earnings summaries for: today, current week, and current season.
  3. Instructor can view a breakdown by lesson type.
  4. If tips are enabled by the school, a separate tips line item is shown.
- **Alternate Flows / Extensions:**
  - 2a. Instructor selects a custom date range — system filters earnings to that range.
- **Postconditions:** Instructor has a clear picture of their earnings and lesson activity.

---

### 2.5 School Admin

---

#### UC-022: Assign an Instructor to a Booking

- **Actor:** School Admin
- **Preconditions:** Admin is signed in to the admin app. An unassigned or pending booking exists.
- **Main Flow:**
  1. Admin navigates to the Schedule View.
  2. Admin locates the unassigned booking (highlighted in the scheduler).
  3. Admin drags the booking card onto an available instructor slot, or uses the assignment dropdown.
  4. System performs a conflict check: verifies the instructor is available and has no overlapping bookings.
  5. System assigns the instructor and updates the booking record.
  6. System notifies the instructor of the new booking (push notification or email).
- **Alternate Flows / Extensions:**
  - 4a. Conflict detected — system highlights the conflict and prevents the assignment until resolved.
  - 3a. Admin manually overrides a conflict — system requires explicit confirmation and logs the override.
- **Postconditions:** Booking is assigned to an instructor. Instructor is notified. Booking status transitions to "confirmed."

---

#### UC-023: Cancel a Booking and Apply Refund Policy

- **Actor:** School Admin
- **Preconditions:** Admin is signed in. A booking in "upcoming" or "confirmed" status exists.
- **Main Flow:**
  1. Admin navigates to Booking Management and locates the booking.
  2. Admin selects "Cancel Booking."
  3. System calculates the applicable refund per the school's configured cancellation policy.
  4. System displays the refund amount and asks for confirmation.
  5. Admin confirms.
  6. System cancels the booking, releases the slot, and initiates the refund through the payment processor.
  7. System sends the student a cancellation email with refund details.
- **Alternate Flows / Extensions:**
  - 3a. Admin selects a custom refund override (e.g., full refund as a customer-service gesture) — system logs the override and the admin's user ID.
- **Postconditions:** Booking is cancelled. Slot is free. Refund is initiated. Student is notified.

---

#### UC-024: Execute a Weather Cancellation (Bulk)

- **Actor:** School Admin
- **Preconditions:** Admin is signed in. One or more lessons are scheduled for a date affected by weather closure.
- **Main Flow:**
  1. Admin navigates to Booking Management and selects the affected date.
  2. Admin selects "Weather Cancellation" for the date or a subset of lesson types.
  3. System displays the count of affected bookings and the total refund amount.
  4. Admin confirms the bulk cancellation.
  5. System cancels all affected bookings and initiates full refunds for each.
  6. System sends each affected student a cancellation email with a rebooking link and a message explaining the weather closure.
  7. Instructors assigned to those bookings are also notified.
- **Alternate Flows / Extensions:**
  - 2a. Admin scopes the cancellation to a specific lesson type only (e.g., cancels group lessons but keeps private lessons) — system applies the scope accordingly.
- **Postconditions:** All selected bookings are cancelled. Full refunds initiated. Students and instructors notified. Rebooking links sent.

---

#### UC-025: Reassign a Booking to a Different Instructor

- **Actor:** School Admin
- **Preconditions:** Admin is signed in. A booking is assigned to an instructor who is no longer available (illness, emergency, etc.).
- **Main Flow:**
  1. Admin locates the affected booking in the Schedule View.
  2. Admin selects "Reassign Instructor."
  3. System displays a list of instructors who are available at the booking's date/time and are eligible for the lesson type and skill level.
  4. Admin selects the replacement instructor.
  5. System updates the booking, notifies the student of the instructor change, and notifies both the old and new instructor.
- **Alternate Flows / Extensions:**
  - 3a. No eligible replacement instructor is available — system notifies admin; admin may opt to contact the student directly or initiate a cancellation.
- **Postconditions:** Booking is updated with the new instructor. All parties are notified.

---

#### UC-026: Manage Instructor Certification Records

- **Actor:** School Admin
- **Preconditions:** Admin is signed in. An instructor profile exists in the system.
- **Main Flow:**
  1. Admin navigates to Instructor Management > Staff Roster.
  2. Admin selects an instructor.
  3. Admin views or updates certification details: certification body (PSIA or CSIA), certification level, and expiry date.
  4. System saves the updated record.
  5. System automatically alerts the admin (via dashboard flag and email) when a certification is within 60 days of expiry.
- **Alternate Flows / Extensions:**
  - 5a. Certification expires without renewal — system prevents the instructor from being assigned to new bookings until the record is updated.
- **Postconditions:** Certification record is current. Admin will receive automated expiry alerts.

---

#### UC-027: Generate a Revenue Report

- **Actor:** School Admin
- **Preconditions:** Admin is signed in. At least one completed booking with a captured payment exists.
- **Main Flow:**
  1. Admin navigates to Reporting.
  2. Admin selects report parameters: date range, instructor (optional), lesson type (optional), currency.
  3. System generates a revenue report showing gross revenue, platform fee (1.5%), and net revenue, broken down by instructor and lesson type.
  4. Admin views the report in the browser.
  5. Admin optionally exports the report to CSV.
- **Alternate Flows / Extensions:**
  - 2a. Admin selects "utilization rate" report — system shows booked slots vs. total available instructor-hours for the period.
- **Postconditions:** Report is generated. CSV export is available if requested.

---

#### UC-028: Promote a Waitlisted Student (Manual)

- **Actor:** School Admin
- **Preconditions:** Admin is signed in. At least one active waitlist entry exists.
- **Main Flow:**
  1. Admin navigates to the Waitlist Panel.
  2. Admin locates a waitlisted student and selects "Promote."
  3. System checks for an available slot matching the waitlist criteria.
  4. If a slot is available, system sends the student an accept notification (triggering the same 2-hour window as UC-015).
  5. Admin can view the notification history for each waitlist entry.
- **Alternate Flows / Extensions:**
  - 3a. No matching slot currently exists — system prompts admin to first create availability before promoting.
- **Postconditions:** Waitlisted student has received an acceptance notification. Normal waitlist acceptance flow (UC-015) applies.

---

#### UC-029: Configure Lesson Types and Pricing

- **Actor:** School Admin
- **Preconditions:** Admin is signed in. The school is active and has at least one subscription tier.
- **Main Flow:**
  1. Admin navigates to Lesson Configuration.
  2. Admin selects "Create New Lesson Type" or edits an existing one.
  3. Admin enters: name, description (EN and FR), applicable skill levels, capacity (for group lessons), duration, and base price.
  4. System saves the configuration; the lesson type becomes available in the booking widget immediately.
- **Alternate Flows / Extensions:**
  - 3a. Group lesson capacity limit — admin sets capacity at the lesson type level. (See OQ-010, which explores whether capacity should also be settable at the school level.)
  - 3b. Admin uses bulk lesson creation for a recurring group program (e.g., a 6-week group series) — system creates all instances at once.
- **Postconditions:** Lesson type is active and bookable by customers.

---

### 2.6 Resort Operator

---

#### UC-030: Configure Resort-Level Settings

- **Actor:** Resort Operator
- **Preconditions:** Operator is signed in to the operator portal. A resort entity exists in the system.
- **Main Flow:**
  1. Operator navigates to Resort Policies.
  2. Operator sets the resort's operating currency (USD or CAD).
  3. Operator sets the default language (EN or FR).
  4. Operator configures pricing floors and seasonal rate cards.
  5. Operator sets the default cancellation policy (which propagates to all schools as a default, overridable at the school level).
  6. System saves all settings and immediately applies them to the booking widget and all child schools.
- **Alternate Flows / Extensions:**
  - 2a. Operator attempts to change currency mid-season with active bookings — system warns that existing bookings are unaffected and only new bookings will use the new currency.
- **Postconditions:** Resort-level policies are active. All associated schools inherit the defaults.

---

#### UC-031: Configure Payment Processor

- **Actor:** Resort Operator
- **Preconditions:** Operator is signed in. No processor is currently configured, or operator is switching processors.
- **Main Flow:**
  1. Operator navigates to Payment Processor Configuration.
  2. Operator selects the processor: Stripe or Shift4.
  3. Operator enters the required credentials (API keys, merchant ID, etc.).
  4. System encrypts and stores the credentials; they are never re-displayed after saving.
  5. System runs a test transaction to verify the integration.
  6. On success, the processor is active for all transactions at this resort.
- **Alternate Flows / Extensions:**
  - 5a. Test transaction fails — system displays a diagnostic error and prompts the operator to re-verify the credentials.
  - 2a. Shift4 is selected — the Shift4 merchant model (resort-supplied merchant ID vs. Slopebook as PayFac) must be clarified before credentials can be entered. (See OQ-005.)
- **Postconditions:** Payment processor is configured. All bookings at this resort are processed through the selected processor.

---

#### UC-032: Set Up White-Label Booking Widget

- **Actor:** Resort Operator
- **Preconditions:** Operator is signed in. Resort is on the Enterprise tier.
- **Main Flow:**
  1. Operator navigates to White-Label Configuration.
  2. Operator enters a custom domain.
  3. Operator uploads a logo and selects a color scheme.
  4. System generates an embed code (iframe and JS snippet).
  5. Operator copies the embed code and installs it on the resort's website.
  6. The booking widget renders with the resort's branding.
- **Alternate Flows / Extensions:**
  - 2a. Custom domain DNS is not yet verified — system displays a pending status and polls for verification.
- **Postconditions:** The booking widget displays resort branding. Guest-facing URLs reflect the custom domain.

---

#### UC-033: View Consolidated Resort Revenue Report

- **Actor:** Resort Operator
- **Preconditions:** Operator is signed in. At least one school has completed bookings.
- **Main Flow:**
  1. Operator navigates to Consolidated Reporting.
  2. Operator selects a date range.
  3. System aggregates revenue across all schools at the resort, broken down by school, lesson type, and currency.
  4. For multi-resort operators, system shows a multi-resort summary with a configurable base currency for comparison.
  5. Operator optionally exports to CSV or accounting software.
- **Alternate Flows / Extensions:**
  - 4a. Schools operate in different currencies — system presents each currency's totals separately; no FX conversion is performed.
- **Postconditions:** Operator has a complete revenue picture across all schools and properties.

---

#### UC-034: Manage API Keys and Webhooks

- **Actor:** Resort Operator
- **Preconditions:** Operator is signed in. An integration target (PMS, CRM, or marketing automation tool) exists.
- **Main Flow:**
  1. Operator navigates to Integrations.
  2. Operator generates a new API key and assigns it a descriptive label.
  3. Operator configures a webhook endpoint URL and selects which events to subscribe to (e.g., booking.confirmed, booking.cancelled, waitlist.promoted).
  4. System saves the webhook configuration and sends a test ping to the endpoint.
  5. Operator verifies receipt of the test ping in their external system.
- **Alternate Flows / Extensions:**
  - 4a. Test ping fails — system displays the HTTP response code and prompts operator to verify the endpoint URL.
  - 2a. Operator rotates an existing API key — system immediately revokes the old key and issues a new one.
- **Postconditions:** Webhook is active. External system receives real-time booking events. API key is valid for authenticated API calls.

---

## 3. Cross-Cutting Use Cases

---

#### UC-035: Language Selection and Bilingual Content Delivery

- **Actors:** Guest, Head of Household, Instructor, School Admin (configuration side)
- **Preconditions:** The resort has a configured default language (EN or FR). Lesson type descriptions and instructor bios have been entered in both languages (or at least the resort default).
- **Main Flow:**
  1. A user accesses any application surface.
  2. System detects the user's language preference (account setting, browser locale, or resort default — in that priority order).
  3. All UI labels, lesson type descriptions, instructor bios, and system-generated communications are rendered in the detected language.
  4. When the user changes their language preference (UC-009), all subsequent communications reflect the change.
- **Alternate Flows / Extensions:**
  - 3a. A specific content field (e.g., instructor bio) has only been entered in one language — system falls back to the available language rather than displaying a blank field.
- **Postconditions:** User experiences a fully bilingual interface consistent with their preference. All email and SMS notifications are sent in the correct language.

---

#### UC-036: Notification Delivery (Email and SMS)

- **Actors:** Guest, Head of Household, Instructor, School Admin (as recipient or trigger)
- **Preconditions:** A triggering event occurs (booking confirmed, cancelled, waitlist notification, no-show alert, certification expiry alert, etc.).
- **Main Flow:**
  1. System detects the triggering event.
  2. System selects the appropriate notification template based on event type and recipient language preference.
  3. System dispatches email to the recipient's registered address.
  4. If the recipient has a verified phone number, system also dispatches an SMS.
  5. For booking-related events, email includes an .ics calendar attachment.
- **Alternate Flows / Extensions:**
  - 3a. Email delivery fails — system retries up to 3 times; if all fail, the failure is logged for admin review.
  - 4a. SMS is not configured or the recipient has not provided a phone number — SMS step is skipped silently.
- **Postconditions:** Recipient has received the notification in their language. Calendar event is created in their calendar client if they accepted the .ics.

---

#### UC-037: Payment Processing Abstraction

- **Actors:** Guest, Head of Household (as payer); School Admin (as refund initiator); Resort Operator (as processor configurator)
- **Preconditions:** A payment or refund event is triggered. A processor (Stripe or Shift4) is configured for the resort.
- **Main Flow:**
  1. System receives a payment or refund request from an application surface.
  2. The payment abstraction layer routes the request to the resort's configured processor.
  3. The processor executes the transaction and returns a success or failure response.
  4. System records the transaction result against the booking record.
  5. On success, the appropriate confirmation or refund notification is dispatched.
- **Alternate Flows / Extensions:**
  - 3a. Processor returns a failure — system presents a user-facing error without exposing processor-specific codes.
  - 3b. Card on file token is expired or invalid — system prompts the user to update their payment method.
- **Postconditions:** Transaction is recorded. Booking status reflects the payment outcome. No processor-specific data is exposed in the application layer.

---

#### UC-038: Instructor Onboarding and Approval Workflow

- **Actors:** Instructor (applicant), School Admin (approver)
- **Preconditions:** A new instructor has been invited to join the platform by a school admin, or has self-registered.
- **Main Flow:**
  1. Instructor completes profile: name, photo, bio (EN and/or FR), certifications (PSIA/CSIA with level and expiry), languages spoken, and lesson types they are qualified to teach.
  2. Instructor submits profile for admin review.
  3. School Admin reviews the submission in the Staff Roster.
  4. Admin approves (or rejects with feedback) the instructor profile.
  5. Upon approval, the instructor's profile becomes visible in the booking widget's instructor browse view.
  6. Instructor receives a notification that their profile is live.
- **Alternate Flows / Extensions:**
  - 4a. Admin rejects — instructor receives a notification with feedback and can resubmit after corrections.
  - 1a. Certification document upload is required — system stores the upload and flags it for admin review. (Specific document retention requirements are subject to OQ-008.)
- **Postconditions:** Instructor is approved and bookable. Their certifications are on record with expiry tracking active (UC-026).

---

## 4. Use Cases Deferred to Later Releases

The following capabilities are explicitly out of scope for v1.0 GA and are deferred to v1.5 or v2.0 per the product roadmap.

| Deferred Use Case | Target Release | Reason |
|---|---|---|
| Native iOS app booking and schedule management | v2.0 | Responsive PWA is the v1.0 delivery; native apps require platform-specific development investment. See OQ-003. |
| Native Android app booking and schedule management | v2.0 | Same rationale as iOS. |
| AI-based instructor matching | v2.0 | Requires training data from live bookings; premature for v1.0. |
| Dynamic pricing | v2.0 | Requires demand data and pricing governance design not yet specified. |
| Gift card purchase and redemption | v1.5 | Payment flow variant; deferred to allow focus on core booking in v1.0. |
| QuickBooks and accounting software integration | v1.5 | CSV export covers v1.0 reporting needs; direct integration deferred. |
| Multi-school management under a single admin | v1.5 | Requires additional data modeling for cross-school admin roles. |
| Additional processor support beyond Stripe and Shift4 | v1.5 | Abstraction layer supports future processors; onboarding additional processors is post-v1.0. |
| Additional languages beyond English and French | v2.0 | Bilingual EN/FR is a core differentiator; additional languages are a future expansion. |
| Additional currencies beyond USD and CAD | v2.0 | Multi-currency expansion requires FX policy decisions not yet made. |
| Lift ticket sales and POS integration | Not on roadmap (v1 non-goal) | Out of scope for Slopebook's lesson management focus. |
| Equipment rental management | Not on roadmap (v1 non-goal) | Out of scope. |
| SOC 2 certification process | v1.5 | Compliance audit timeline aligned with v1.5. |
| PIPEDA compliance audit | v1.5 | Canadian privacy law audit scheduled for v1.5. |
| Instructor direct deposit / payroll integration | TBD | See OQ-006; decision pending on payroll vs. report-only model. |

---

## 5. Open Questions Affecting Use Cases

Each open question from `design-docs/open-questions.md` that directly impacts one or more use cases is listed below with the affected UC(s) and the nature of the impact.

| OQ ID | Question Summary | Affected UC(s) | Impact |
|---|---|---|---|
| OQ-001 | French translation priority: booking widget first vs. full admin dashboard simultaneously? | UC-035, UC-029, UC-001 | Determines whether School Admin can manage lesson type descriptions in French at launch, and whether the instructor browse experience is fully bilingual in Alpha. A widget-first approach means admin-facing content configuration may be English-only initially. |
| OQ-002 | Minimum viable Starter tier feature set | UC-001 through UC-009, UC-016 through UC-021 | Determines which booking and instructor features are available to independent instructors on the $49/mo tier. If household accounts or group lessons are excluded from Starter, UC-010 through UC-012 and group-related paths in UC-001 must be gated. |
| OQ-003 | Is a native iOS app required for instructor adoption, or is PWA sufficient for Alpha? | UC-016, UC-017, UC-018, UC-019, UC-020 | If PWA is insufficient for instructor adoption, all instructor-facing use cases (UC-016 through UC-021) may need to be re-scoped for a native app by v2.0 sooner than planned. Affects Alpha success criteria. |
| OQ-004 | Cross-processor card-on-file token vault: processor-managed vs. Slopebook cross-processor mapping | UC-006, UC-013, UC-037 | If Slopebook maintains a cross-processor token vault, UC-006 and UC-013 must support token portability when a resort switches processors. If processor-managed only, stored cards are tied to one processor and would be lost on a switch. |
| OQ-005 | Shift4 merchant model: resort-supplied merchant ID vs. Slopebook as PayFac | UC-031, UC-037 | Directly affects UC-031 (processor configuration UI and required credential fields differ between the two models) and UC-037 (settlement flow, liability, and fee structures differ). Must be resolved before Shift4 integration can be fully specified. |
| OQ-006 | Instructor payroll: direct deposit integration vs. report-only with Workday handoff | UC-021 | If direct deposit is in scope, UC-021 (Earnings Dashboard) must extend to include payout initiation and bank account details management. If report-only, UC-021 remains as specified. |
| OQ-007 | Minimum age threshold for learner sub-profiles | UC-010, UC-011 | Determines the validation rule in UC-010 step 3a. If the threshold is, e.g., 3 years old, bookings for infants are blocked; if there is no minimum, additional waiver or guardian confirmation flows may be required. Also affects whether minors can ever hold independent accounts. |
| OQ-008 | Electronic waiver storage requirements by state/province | UC-017, UC-038 | In UC-017, determines whether digital waiver capture at check-in is mandatory, optional, or not needed. In UC-038, determines whether certification document uploads must be stored with specific retention periods. Jurisdiction-specific rules may require conditional logic per resort location. |
| OQ-009 | Should the 2-hour waitlist accept window be configurable per resort, or fixed platform-wide? | UC-014, UC-015, UC-028 | If configurable, UC-030 (resort settings) must include a waitlist window field, and UC-014 (confirmation email) must dynamically state the resort's configured window. If fixed, the value is hardcoded and simpler to implement but less flexible for resorts with different operational rhythms. |
| OQ-010 | Group lesson capacity: set at school level, lesson type level, or both? | UC-029 | Directly affects the lesson configuration UI in UC-029. If capacity is settable at both levels, the system needs a precedence rule (e.g., lesson type overrides school default). Affects how the booking widget enforces capacity limits in UC-001. |
