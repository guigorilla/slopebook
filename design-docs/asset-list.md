# Slopebook — UI/UX Asset List

**Document Status:** Draft — Run 2
**Last Updated:** 2026-03-26
**Author:** UI/UX Lead Agent

**Source Documents:**
- `design-docs/drafts/use-cases.md` (Run 2 — UC-001 through UC-043, all open questions resolved)
- `design-docs/drafts/tech-requirements.md` (Run 2 — TR-F-001 through TR-F-123, TR-NF-001 through TR-NF-027)
- `design-docs/ux-flows.md` (inline — four app surfaces, booking widget flow, account dashboard, instructor PWA, admin scheduler, operator portal)

**Run 2 Changes Summary:**
- All "Subject to OQ-XXX" and "TBD" qualifications replaced with definitive specifications.
- DS-067 WaiverSignaturePad (custom canvas) replaced by DS-067 ThirdPartyESignEmbed wrapper (OQ-008).
- DS-TIP-001 Tip Selector component added (OQ-018).
- CUST-PKG-001 through CUST-PKG-004 lesson package screens added (OQ-019).
- ADMIN-PKG-001 admin package sales view added (OQ-019).
- ADMIN-LRN-001 admin learner skill level override UI added (OQ-020).
- ADMIN-GDPR-001 right-to-erasure admin tool added (OQ-012).
- NOTIF-PREF-001 email/SMS unsubscribe preference center added (OQ-016).
- INSTR-009 (Google Calendar Sync) removed from v1.0 scope; moved to Deferred section (OQ-021).
- FORM-019 Waiver Signature Capture updated to reflect third-party e-signature embed (OQ-008).
- Bilingual column updated throughout: customer and instructor assets = bilingual required at Alpha; admin and operator assets = bilingual required at Beta.
- CUST-024 waitlist window updated to dynamic tenant-configured duration (OQ-009).
- CUST-008 updated to include tip selector (OQ-018).
- Tier enforcement: FR toggle and group lesson screens hidden on Starter tier; upsell prompts specified (OQ-002).
- PWA assets: home screen install prompt (INSTR-017), offline state (INSTR-015 confirmed), push notification permission (INSTR-016 confirmed) (OQ-003).

---

## 1. Design System / Shared Components

All components below belong to the `packages/ui` shared library and are consumed across multiple apps via the `@slopebook/ui` package.

**Bilingual column key:**
- `Alpha` — bilingual (EN/FR) required at Alpha launch. Applies to customer and instructor surfaces.
- `Beta` — bilingual (EN/FR) required at Beta launch. Applies to admin and operator surfaces.
- `N` — no translatable copy (icon-only or purely structural); no bilingual requirement.

No hardcoded English (or French) copy strings may appear in any component file. All display text must be passed as externally-supplied translated strings via the i18n framework (`next-intl` or `react-i18next`). All string keys must be namespaced in `packages/ui` from day one.

| ID | Component Name | Description | Apps | Bilingual |
|----|----------------|-------------|------|-----------|
| DS-001 | PrimaryButton | Solid filled CTA button. Variants: default, destructive, loading (spinner). Sizes: sm, md, lg. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-002 | SecondaryButton | Outlined / ghost button for secondary actions. Same variants and sizes as DS-001. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-003 | IconButton | Square button containing only an icon (no label). Used for toolbar actions, close/dismiss. | customer, instructor, admin, operator | N |
| DS-004 | TextInput | Single-line text field with label, helper text, error state, and disabled state. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-005 | PasswordInput | TextInput variant with show/hide toggle. Used for auth forms. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-006 | EmailInput | TextInput variant with email keyboard hint and format validation. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-007 | PhoneInput | TextInput variant with country-code prefix and phone format validation. | customer, admin | Alpha (customer); Beta (admin) |
| DS-008 | TextArea | Multi-line text input with character counter. Used for bios, session notes, feedback. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-009 | SelectDropdown | Single-select dropdown with search/filter option. Supports async data loading. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-010 | MultiSelect | Multi-value select with chip display. Used for lesson types, skill levels. | admin, operator | Beta |
| DS-011 | DatePicker | Calendar-based date selector. Mobile-friendly tap interface. Shows availability overlay. | customer, instructor, admin | Alpha (customer/instructor); Beta (admin) |
| DS-012 | TimePicker | Hour/minute selector. 12h and 24h format support. | instructor, admin | Alpha (instructor); Beta (admin) |
| DS-013 | DateRangePicker | Dual-date picker for from/to ranges. Used in reporting and availability management. | instructor, admin, operator | Alpha (instructor); Beta (admin/operator) |
| DS-014 | Toggle / Switch | Boolean on/off control. Used for language pref, session notes sharing, feature flags. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-015 | Checkbox | Standard checkbox with label. Supports indeterminate state for bulk selection. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-016 | RadioGroup | Single-select radio buttons. Used for waitlist mode, processor selection, refund type. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-017 | Badge | Small status label. Variants: success (green), warning (yellow), error (red), info (blue), neutral (grey). | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-018 | StatusBadge | Booking-status-specific badge using DS-017. Maps statuses: confirmed, in_progress, completed, cancelled, no_show, waitlisted. The `in_progress` variant uses a blue fill with label "In Progress" (EN) / "En cours" (FR). | customer, instructor, admin | Alpha (customer/instructor); Beta (admin) |
| DS-019 | Avatar | Circular or rounded-square user/instructor photo. Fallback to initials monogram. Sizes: xs, sm, md, lg. | customer, instructor, admin | N |
| DS-020 | Card | General-purpose elevated container with optional header, body, footer, and action slot. | customer, instructor, admin, operator | N |
| DS-021 | LessonCard | Specialised card for a booking/lesson. Shows learner name, skill level, lesson type, time, instructor, status badge. | customer, instructor, admin | Alpha (customer/instructor); Beta (admin) |
| DS-022 | InstructorCard | Profile card showing instructor photo (DS-019), display name, certifications, languages spoken, average rating. | customer, admin | Alpha (customer); Beta (admin) |
| DS-023 | Modal / Dialog | Overlay dialog with header, content, and action footer. Supports focus trap and Escape-to-close. Sizes: sm, md, lg, full. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-024 | ConfirmDialog | Specialised DS-023 for destructive confirmation (cancel booking, bulk cancel, delete). Requires explicit text confirmation or strong CTA. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-025 | Toast / Snackbar | Transient notification: success, error, warning, info. Auto-dismisses with configurable duration. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-026 | Alert Banner | Persistent inline alert (not dismissible by default). Used for system notices, waitlist warnings, certification expiry warnings. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-027 | EmptyState | Illustrated placeholder for zero-data views. Accepts title, description, and optional CTA. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-028 | LoadingSpinner | Accessible circular progress indicator. Full-page and inline variants. | customer, instructor, admin, operator | N |
| DS-029 | SkeletonLoader | Animated content placeholder for async data. Matches the shape of the loaded component. | customer, instructor, admin, operator | N |
| DS-030 | ErrorState | Full-section error display with message and retry CTA. Used when API calls fail. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-031 | Breadcrumb | Navigation path indicator. Used in admin and operator multi-level navigation. | admin, operator | Beta |
| DS-032 | Tabs | Horizontal tab bar for switching views within a page. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-033 | Stepper | Horizontal progress indicator for multi-step flows (booking, onboarding). Shows step count, current step, completion state. | customer, instructor, admin | Alpha (customer/instructor); Beta (admin) |
| DS-034 | Table | Sortable, filterable data table with pagination. Column resizing on desktop. | admin, operator | Beta |
| DS-035 | DataTableToolbar | Toolbar above DS-034: search input, column visibility toggle, filter chips, export button. | admin, operator | Beta |
| DS-036 | Pagination | Page number navigation for DS-034. Shows total count. | admin, operator | Beta |
| DS-037 | FilterPanel | Collapsible side panel or inline panel with filter controls (date range, status, instructor, lesson type). | admin, operator | Beta |
| DS-038 | Calendar / WeekView | Full-screen week-grid calendar for scheduling. Drag-and-drop support. Lane per instructor. | admin | Beta |
| DS-039 | CalendarDayView | Single-day column schedule, showing bookings as time-slotted blocks. | instructor, admin | Alpha (instructor); Beta (admin) |
| DS-040 | CalendarMonthView | Monthly grid. Shows booking count per day. Click-to-expand day. | admin | Beta |
| DS-041 | TimeSlotPicker | Horizontal or grid list of available time slots for a given date. Each slot shows time and instructor(s). | customer | Alpha |
| DS-042 | AvailabilityBlock | Visual block on the availability / week view representing an instructor's available or blocked window. Drag to resize/move. | instructor, admin | Alpha (instructor); Beta (admin) |
| DS-043 | FileUpload | Drag-and-drop + click-to-browse file input. Shows upload progress, preview (for images), and remove control. | instructor, admin | Alpha (instructor); Beta (admin) |
| DS-044 | ImageCropper | Modal cropper for uploaded photos (instructor profile, operator logo). Outputs a constrained aspect ratio. | instructor, admin, operator | N |
| DS-045 | CurrencyInput | Numeric input pre-formatted for monetary amounts. Respects tenant currency symbol (USD / CAD). | admin, operator | Beta |
| DS-046 | PercentageInput | Numeric input constrained 0–100. Used for refund policy percentages. | admin, operator | N |
| DS-047 | ColorPicker | Hex/RGB color selector for white-label theming. Includes preset palette and manual input. | operator | N |
| DS-048 | CodeBlock | Read-only, copy-to-clipboard code display. Used for embed snippet, API key display (one-time). | operator | N |
| DS-049 | SearchInput | Standalone search field with clear button, debounce, and optional result suggestion list. | admin, operator | Beta |
| DS-050 | LanguageToggle | EN / FR switcher. Persists preference to user account. Visible on all surfaces. On Starter-tier tenants the FR option is suppressed in the customer app (OQ-002, TR-F-104). Active on customer and instructor apps at Alpha; active on admin and operator apps at Beta. | customer, instructor, admin, operator | N |
| DS-051 | StarRating | Read-only star display (for instructor average rating). | customer, admin | N |
| DS-052 | ProgressBar | Horizontal fill bar. Used for earnings goals, reporting charts. | instructor, admin, operator | N |
| DS-053 | Chart / BarChart | Responsive bar chart. Used in revenue and utilization reports. Relies on a chart library (Recharts preferred; Chart.js acceptable). | admin, operator | Beta |
| DS-054 | Chart / LineChart | Responsive line chart for trend views (earnings over time, seasonal). | instructor, admin, operator | Alpha (instructor); Beta (admin/operator) |
| DS-055 | PricingTag | Displays lesson price in tenant currency. Handles integer cents-to-display conversion. | customer, admin | Alpha (customer); Beta (admin) |
| DS-056 | SectionHeader | Page-level section heading with optional subtitle and action slot. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-057 | FormSection | Grouped form block with optional heading and divider. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-058 | InlineErrorMessage | Field-level validation error text, rendered below the associated input. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-059 | Tooltip | Hover/focus tooltip for contextual help (icon buttons, truncated text). | admin, operator | Beta |
| DS-060 | Drawer / SidePanel | Slide-in panel from the right or bottom. Used for detail views on mobile (lesson detail, instructor detail). | customer, instructor, admin | Alpha (customer/instructor); Beta (admin) |
| DS-061 | BottomSheet | Mobile-specific bottom drawer. Used for action menus on touch devices. | customer, instructor | Alpha |
| DS-062 | NavigationBar (Bottom) | Mobile bottom navigation with icons and labels for primary routes. | customer, instructor | Alpha |
| DS-063 | Sidebar (Desktop) | Left-rail navigation for admin and operator apps. Collapsible. Shows active route highlight. | admin, operator | Beta |
| DS-064 | TopBar / Header | App-level top bar with logo slot, page title, language toggle, user menu. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-065 | UserMenu | Dropdown from the top bar: profile, language, sign out. | customer, instructor, admin, operator | Alpha (customer/instructor); Beta (admin/operator) |
| DS-066 | NotificationDot | Small red indicator badge on icons to signal unread alerts/notifications. | instructor, admin | N |
| DS-067 | ThirdPartyESignEmbed | Wrapper component that mounts a third-party e-signature provider's iframe or SDK embed at the check-in screen. Replaces the custom canvas waiver pad from Run 1. Accepts: `waiverUrl` (provider-supplied signing URL), `onComplete(waiverToken, waiverVersion)` callback, `onError(errorCode)` callback. Slopebook stores only the reference token and timestamp — no raw signature image or full document. The check-in screen (INSTR-004) shows a DS-017 waiver status badge ("Waiver Signed" / "Waiver Pending") for previously signed waivers (per `Learner.waiverSignedAt`). Keyboard-accessible fallback: typed name confirmation field + DS-015 legal acknowledgment checkbox for users unable to interact with the embed. (OQ-008, TR-F-085) | instructor | Alpha |
| DS-068 | PhoneVerification | OTP input + resend timer for phone number verification (if SMS is enabled). | customer | Alpha |
| DS-069 | PaymentCardInput | Processor-hosted card field or processor JS SDK mount point (Stripe Elements / Shift4 hosted fields). Renders last4/brand after tokenisation. Raw card data never reaches Slopebook servers (TR-F-019). | customer | Alpha |
| DS-070 | SavedCardRow | Displays a stored card: brand icon, last 4 digits, expiry, default badge, remove + set-default actions. Cards invalidated by a processor switch display a disabled "No longer valid" label and cannot be set as default (UC-015, TR-F-031). | customer | Alpha |
| DS-TIP-001 | TipSelector | Tip amount selector shown at checkout when `Tenant.tipsEnabled = true`. Four preset option buttons: 0%, 10%, 15%, 20%. Plus a custom amount entry field (DS-045 variant, free monetary input in tenant currency). Selected preset shows an active/highlighted state. Custom entry clears any selected preset. Final selected tip shown as a separate "Tip" line item in the order summary above the total. When `Tenant.tipsEnabled = false`, this component is not rendered and `Payment.tipAmountCents` is null. Not shown during lesson package purchases (TR-F-034). Preset buttons must be keyboard navigable; active state communicated via `aria-pressed`. Custom field must have a visible label. (OQ-018, TR-F-033) | customer | Alpha |

---

## 2. Pages & Views by App

### 2.1 Customer App (port 3000) — Mobile-First

**Bilingual requirement:** All customer screens are bilingual (EN/FR) at Alpha.

**Starter-tier note (OQ-002):** Group lesson type cards are hidden on Starter-tier tenants; if a Starter user reaches a group lesson URL directly the system renders CUST-031 (upsell prompt). The FR toggle (DS-050) is hidden on Starter-tier tenants.

| ID | Name | Use Case(s) | Key UI Elements | Device | Auth Required | Bilingual |
|----|------|-------------|-----------------|--------|---------------|-----------|
| CUST-001 | Booking Widget — Lesson Type Selection | UC-001 | Lesson type cards (group lesson cards hidden on Starter tier; upsell CTA card shown in their place), skill level selector (DS-016), progress stepper (DS-033), DS-056 | Both | Guest OK | Alpha |
| CUST-002 | Booking Widget — Skill Self-Assessment | UC-001 (alt 4a) | Short questionnaire (DS-016 radio), instructional copy explaining each level: Beginner = never skied/snowboarded; Intermediate = comfortable on green/blue runs; Advanced = comfortable on black runs. Self-report only — no prior instructor validation required (OQ-020). Back/next buttons (DS-001/002). | Both | Guest OK | Alpha |
| CUST-003 | Booking Widget — Instructor Browse | UC-002 | Instructor card list (DS-022), skip button (DS-002), DS-049 search, DS-051 star rating | Both | Guest OK | Alpha |
| CUST-004 | Booking Widget — Instructor Profile Detail | UC-002 | DS-019 photo, bio (bilingual EN/FR with fallback to available language if one variant is missing), certifications, languages, DS-051 rating, "Select" CTA | Both | Guest OK | Alpha |
| CUST-005 | Booking Widget — Date & Time Selection | UC-003 | DS-011 calendar with availability overlay, DS-041 time slot grid, soft-hold countdown timer (platform-fixed 15 min per OQ-011; displayed as MM:SS countdown in a DS-026 persistent banner; on expiry a DS-024 modal notifies guest and returns to calendar) | Mobile | Guest OK | Alpha |
| CUST-006 | Booking Widget — Auth Gate | UC-004, UC-005, UC-006 | Three options: Guest Checkout, Sign In, Create Account. DS-016 choice cards. | Both | Guest OK | Alpha |
| CUST-007 | Booking Widget — Learner Selection / Add Learner | UC-011, UC-012 | Household member list, "Add New Learner" inline (DS-024 modal or DS-060 drawer), DS-057 form section. Under-18 learners require parental consent checkbox (DS-015) before the sub-profile can be saved (TR-F-052). Under-5 learners show DS-026 guidance text — not a hard block (OQ-007, TR-F-051). | Both | Y | Alpha |
| CUST-008 | Booking Widget — Payment | UC-004, UC-006, UC-013 | Booking summary; DS-069 card input or DS-070 saved card list; billing email; DS-017 trust badges; DS-TIP-001 tip selector (shown only when `Tenant.tipsEnabled = true` and this is not a package-redemption booking); DS-016 "Apply Package" option when compatible `LessonPackage` records exist (see CUST-PKG-004); order summary shows lesson subtotal + tip (if any) + total. Submit button disabled while processing (TR-F-005 idempotency). (OQ-018) | Both | Guest OK | Alpha |
| CUST-009 | Booking Widget — Booking Confirmation | UC-004, UC-005, UC-006 | Success illustration (ILLUS-001), booking summary in readable text (all details independent of .ics file), .ics download link, "Add to Calendar" button, "View Account" CTA | Both | Guest OK | Alpha |
| CUST-010 | Sign In | UC-006 | DS-006 email, DS-005 password, forgot password link, DS-001 submit, DS-002 "Create account" | Both | Guest OK | Alpha |
| CUST-011 | Create Account | UC-005 | DS-004 name, DS-006 email, DS-005 password, DS-016 language preference (EN/FR), terms acceptance checkbox (DS-015) | Both | Guest OK | Alpha |
| CUST-012 | Forgot Password | UC-005 (supporting) | DS-006 email input, submit button, confirmation message | Both | Guest OK | Alpha |
| CUST-013 | Reset Password | UC-005 (supporting) | DS-005 new password, DS-005 confirm, submit, success message | Both | Guest OK | Alpha |
| CUST-014 | Account Dashboard — Upcoming Lessons | UC-012, UC-014 | DS-021 lesson card list grouped by date, empty state (DS-027), "Book a Lesson" CTA | Both | Y | Alpha |
| CUST-015 | Account Dashboard — Booking Detail | UC-007, UC-008 | Full lesson details, instructor card (DS-022), DS-018 status badge, receipt summary (with "Tip" line item if tip > 0), Cancel button (DS-002), session notes section (hidden with DS-027 placeholder when no notes are shared by instructor; "Notes shared" indicator when instructor has shared notes) | Both | Y | Alpha |
| CUST-016 | Account Dashboard — Cancel Booking | UC-008 | DS-024 confirm dialog, refund amount display with policy-explanation text (which window applies, hours remaining, refund percentage), DS-001 confirm, DS-002 cancel. Non-refundable path shows clear "No refund will be issued" message before confirmation (TR-F-028). | Both | Y | Alpha |
| CUST-017 | Account Dashboard — Booking History | UC-007 | List of past lessons (DS-021), filter by learner (DS-009), receipt download link. Receipt includes tip line item if applicable. | Both | Y | Alpha |
| CUST-018 | Account Dashboard — Household Members | UC-011 | Learner sub-profile list, "Add Learner" CTA, edit learner modal (DS-023) | Both | Y | Alpha |
| CUST-019 | Account Dashboard — Add/Edit Learner | UC-011 | FORM-003, inline inside DS-023 modal. Includes parental consent checkbox (DS-015) for under-18 learners; DS-026 guidance text for under-5 learners (OQ-007). | Both | Y | Alpha |
| CUST-020 | Account Dashboard — Payment Methods | UC-015 | DS-070 saved card list (invalidated cards shown disabled with "No longer valid — please add a new card" label), "Add Card" CTA (DS-001), remove card (DS-024 confirm with warning if last valid card has upcoming booking per TR-F-025), set-default control | Both | Y | Alpha |
| CUST-021 | Account Dashboard — Language Preference | UC-009 | DS-050 language toggle, DS-025 success toast on save. Screen not shown on Starter-tier tenants where FR is suppressed (OQ-002). | Both | Y | Alpha |
| CUST-022 | Account Dashboard — Profile / Account Settings | UC-005, UC-009 | DS-004 name, DS-006 email, change password link, DS-050 language toggle, DS-001 save | Both | Y | Alpha |
| CUST-023 | Waitlist Join Flow | UC-016 | No-availability message, DS-016 waitlist mode selector (any instructor / specific instructor), optional instructor selector (DS-009), conditional email input for unauthenticated users (shown instead of household learner selector when guest is not authenticated), DS-033 step indicator | Both | Guest OK | Alpha |
| CUST-024 | Waitlist Confirmation | UC-016 | Success illustration (ILLUS-002), waitlist entry summary, accept-window duration shown dynamically from `Tenant.waitlistAcceptWindowMinutes` (e.g., "You will have 2 hours to accept once a slot opens" — never hard-coded; default 120 min, configurable 30 min–48 hr per OQ-009 / TR-F-045), "Return Home" CTA | Both | Guest OK | Alpha |
| CUST-025 | Waitlist Accept Landing Page | UC-017 | Booking summary, DS-069 payment or DS-070 saved card, DS-TIP-001 tip selector (if `Tenant.tipsEnabled = true`), DS-001 "Confirm Booking", expiry countdown timer (remaining time until `WaitlistEntry.expiresAt`) | Both | Guest OK | Alpha |
| CUST-026 | Waitlist Expired Page | UC-017 (alt 3a) | ILLUS-008, expired-window message, "Join Waitlist Again" CTA, "Browse Other Dates" CTA | Both | Guest OK | Alpha |
| CUST-027 | Error — Generic | All | DS-030 with message, request ID, retry button | Both | Guest OK | Alpha |
| CUST-028 | Error — Payment Failed | UC-004, UC-006 (alt 4a/5a) | Processor-agnostic error message (TR-F-022 — no processor-specific codes surfaced to user), ILLUS-011, inline card re-entry option within the payment step (not a separate page), DS-001 "Try Again" | Both | Guest OK | Alpha |
| CUST-029 | Error — Slot No Longer Available | UC-003 (alt 4a) | Slot-taken message, DS-011 calendar to reselect, DS-027 empty state if no alternatives | Both | Guest OK | Alpha |
| CUST-030 | Booking Widget — Embedded / Standalone Shell | UC-001–UC-009 | White-label logo slot (LOGO-003 if operator-configured, otherwise LOGO-001), custom color theme vars (THEME-001), locale from `lang` URL param, DS-064 top bar minimal variant. Accepts `lessonTypeId` and `skillLevel` URL params for deep-link rebooking entry (NOTIF-005 weather rebooking path). | Both | Guest OK | Alpha |
| CUST-031 | Starter Tier — Group Lesson Upsell Prompt | OQ-002, TR-F-102 | DS-026 alert banner: "Group lessons are available on the Growth plan and above." Upgrade CTA (DS-001) linking to operator-configured upgrade URL or Slopebook marketing page. DS-002 "Go Back" secondary CTA. Shown when a Starter-tier user attempts to browse or book a group lesson type. | Both | Guest OK | Alpha |
| CUST-PKG-001 | Lesson Packages — Browse & Purchase | UC-010 | Package cards (name, included lesson count, eligible lesson types, expiry terms, price in tenant currency using DS-055), DS-027 empty state when no packages available, DS-001 "Buy Package" CTA per card, DS-033 stepper leading to CUST-PKG-002. No tip selector shown at purchase (TR-F-034). (OQ-019) | Both | Y | Alpha |
| CUST-PKG-002 | Lesson Packages — Purchase Confirmation Step | UC-010 | Package purchase summary (name, lessons included, eligible lesson types, expiry date if applicable, price), DS-069 card input or DS-070 saved card list, DS-001 "Confirm Purchase", ILLUS-013 on success. No tip selector. (OQ-019) | Both | Y | Alpha |
| CUST-PKG-003 | Lesson Packages — Dashboard / Redemption Balance | UC-010, UC-013 | List of packages per DS-020 card: name, remaining count, eligible lesson types, expiry date with DS-017 warning badge if expiry < 30 days, DS-017 status badge (active / exhausted / expired). ILLUS-014 empty state if no packages. "Buy More" CTA. (OQ-019) | Both | Y | Alpha |
| CUST-PKG-004 | Lesson Packages — Apply Package at Checkout | UC-013 | Rendered inline on CUST-008 when compatible packages are detected on the account. DS-016 radio: "Pay with Package" alongside standard card payment. Selected package shows name and remaining count. Order summary: "$0.00 (package credit)" plus any tip. If multiple eligible packages exist, DS-009 dropdown to select which package to redeem. Expired or incompatible packages not shown. (OQ-019, TR-F-116) | Both | Y | Alpha |

---

### 2.2 Admin App (port 3001) — Desktop-First

**Bilingual requirement:** Admin app ships English-only at Alpha; bilingual (EN/FR) required at Beta. String keys are namespaced from day one in `packages/ui` to enable the Beta rollout without architectural changes (OQ-001, TR-F-096).

| ID | Name | Use Case(s) | Key UI Elements | Device | Auth Required | Bilingual |
|----|------|-------------|-----------------|--------|---------------|-----------|
| ADMIN-001 | Sign In | UC-022–UC-029 | DS-006 email, DS-005 password, submit, forgot-password link | Desktop | Guest OK | Beta |
| ADMIN-002 | Dashboard / Home | UC-022–UC-029 | Summary KPI cards (today's bookings, revenue, open waitlist count), DS-026 certification expiry alert banner, DS-027 if no data | Desktop | Y | Beta |
| ADMIN-003 | Schedule View — Day | UC-022, UC-025 | DS-039 day-view grid, per-instructor lane, booking blocks (drag-and-drop; keyboard-accessible alternative via arrow keys + Enter to confirm), unassigned bookings panel, DS-009 instructor filter, DS-017 conflict badge on double-booking detection | Desktop | Y | Beta |
| ADMIN-004 | Schedule View — Week | UC-022, UC-025 | DS-038 week-grid calendar, booking density per day, DS-009 instructor filter, DS-017 conflict badge | Desktop | Y | Beta |
| ADMIN-005 | Schedule View — Month | UC-022 | DS-040 month grid, per-day booking count badge, click-to-day-view | Desktop | Y | Beta |
| ADMIN-006 | Booking Management — List | UC-023, UC-024, UC-025 | DS-034 filterable table (status, date, instructor, lesson type), DS-035 toolbar, DS-036 pagination, bulk-select checkboxes (DS-015) | Desktop | Y | Beta |
| ADMIN-007 | Booking Detail — Admin | UC-023, UC-025 | Full booking record, DS-018 status badge, instructor assignment dropdown (DS-009), cancel button, refund override form (system-calculated refund displayed alongside override input; inline validation: 0 ≤ override ≤ original amount per TR-F-029), audit log section, session notes with shared/unshared indicator | Desktop | Y | Beta |
| ADMIN-008 | Cancel Booking — Admin | UC-023 | DS-024 confirm dialog, refund calculation display with policy-explanation breakdown (window applied, hours remaining, percentage), DS-046 override refund amount input (side-by-side with calculated amount; validation: 0 ≤ override ≤ original payment amount), reason text area (DS-008), confirm/cancel | Desktop | Y | Beta |
| ADMIN-009 | Weather Bulk Cancellation | UC-024 | DS-011 date picker, DS-010 lesson type filter, affected booking count + total refund summary, DS-024 confirm, DS-029 skeleton progress during bulk operation | Desktop | Y | Beta |
| ADMIN-010 | Reassign Instructor | UC-025 | DS-009 instructor selector (shows only instructors with `onboardingStatus = approved` and no conflicting booking for the slot's time window per TR-F-011), conflict check result, DS-024 confirm | Desktop | Y | Beta |
| ADMIN-011 | Waitlist Panel | UC-028 | DS-034 waitlist entries table (date, learner, mode, status, notified time, accept-window duration shown dynamically from `Tenant.waitlistAcceptWindowMinutes`), DS-001 Promote button, notification history expandable row | Desktop | Y | Beta |
| ADMIN-012 | Instructor Roster | UC-026, UC-038 | DS-034 instructor table (name, certifications, status, per-row DS-017 warning badge for expiry < 60 days, DS-017 error badge "Blocked — certification expired" for instructors blocked from assignment), DS-026 expiry banners, add instructor CTA | Desktop | Y | Beta |
| ADMIN-013 | Instructor Profile — Admin View | UC-026, UC-038 | DS-019 photo, bio, certifications list with per-cert expiry alert, DS-018 status badge (pending/approved/inactive), blocked-from-assignment indicator if certification expired, approve/reject buttons, certification edit form | Desktop | Y | Beta |
| ADMIN-014 | Instructor Onboarding Review | UC-038 | Submitted profile detail, DS-016 approve/reject radio, DS-008 feedback textarea (required on reject), DS-001 submit | Desktop | Y | Beta |
| ADMIN-015 | Add / Edit Instructor | UC-038 | FORM-009 inline | Desktop | Y | Beta |
| ADMIN-016 | Lesson Configuration — List | UC-029 | DS-034 lesson type table, active/inactive toggle (DS-014), DS-001 "Create New", DS-049 search. Group lesson types display a DS-017 info badge "Growth+ only." | Desktop | Y | Beta |
| ADMIN-017 | Lesson Configuration — Create / Edit | UC-029 | FORM-010 full page / modal | Desktop | Y | Beta |
| ADMIN-018 | Reporting — Revenue | UC-027 | DS-013 date range picker, DS-009 instructor filter, DS-009 lesson type filter, DS-053 bar chart, DS-034 summary table with columns: gross revenue / tips / platform fee (1.5%) / net revenue, CSV export button | Desktop | Y | Beta |
| ADMIN-019 | Reporting — Utilization | UC-027 (alt 2a) | DS-013 date range picker, DS-009 instructor filter, DS-053 utilization chart (booked vs. available hours), DS-034 summary table, CSV export | Desktop | Y | Beta |
| ADMIN-020 | Reporting — Student Analytics | UC-027 | DS-013 date range, DS-053 chart, DS-034 student table, learner-level drill-down | Desktop | Y | Beta |
| ADMIN-021 | Settings — School Policy | UC-029 | Cancellation policy form (FORM-011), refund windows, no-show policy, DS-001 save | Desktop | Y | Beta |
| ADMIN-022 | Settings — Profile & Account | — | Admin name, email, change-password, DS-050 language toggle | Desktop | Y | Beta |
| ADMIN-023 | Error — Generic | All | DS-030 with message and request ID | Desktop | Y | Beta |
| ADMIN-024 | No-Show Override | UC-018 (alt 5a), TR-F-015 | DS-023 modal: booking info, override reason (DS-008, required field — form cannot submit without a reason), DS-024 confirm. After confirm: audit trail entry on ADMIN-007 shows actor name, timestamp, previous status ("no_show"), new status (reverted), and reason text. | Desktop | Y | Beta |
| ADMIN-PKG-001 | Package Sales — Admin View | UC-010, UC-013 | DS-034 table: package name, household name, purchased date, total lessons / remaining, expiry, DS-017 status badge (active / exhausted / expired). DS-035 toolbar: date range filter, status filter. CSV export. Click-to-expand row shows list of redemptions: booking ID, learner name, date redeemed. (OQ-019) | Desktop | Y | Beta |
| ADMIN-LRN-001 | Learner Detail — Admin Skill Level Override | TR-F-057, OQ-020 | Accessible from ADMIN-007 or a learner search panel. Shows learner name, current skill level (DS-009 selector). Instructional copy at top of panel explains what each level means (consistent with CUST-002 definitions). DS-008 reason textarea (required). DS-001 "Save Override". On save: `Learner.skillLevel` updated; `AuditLog` entry records admin user ID, previous value, new value, and reason. | Desktop | Y | Beta |
| ADMIN-GDPR-001 | Right-to-Erasure Tool | UC-043, TR-F-119–121 | Three-step flow within ADMIN app. Step 1 — Search: DS-006 email input + DS-001 "Search," scoped to admin's tenant; DS-034 results showing matching `GuestCheckout` records (name, email, booking count, last booking date); DS-027 empty state if no results. Step 2 — Preview: shows personal data fields to be erased/pseudonymised (name → "[ERASED]", email → "[ERASED]"); DS-026 alert "Booking and payment records will be retained for financial audit purposes"; DS-017 warning badge "This action cannot be undone." Step 3 — Confirm: DS-024 confirm dialog requiring admin to type the guest's email address before the DS-001 "Confirm Erasure" (destructive) button activates; "Confirm Erasure" remains disabled until typed email matches target. On success: DS-025 success toast + ILLUS-015. On failure: DS-030 error state with request ID. All erasure operations produce an `AuditLog` entry in the same DB transaction (TR-F-120). (OQ-012) | Desktop | Y | Beta |

---

### 2.3 Instructor App (port 3002) — PWA, Mobile-First

**Bilingual requirement:** All instructor screens are bilingual (EN/FR) at Alpha.

**PWA requirements (OQ-003):** Instructor app is a Progressive Web App. Required PWA assets: `manifest.json` with ICON-004 icons, Service Worker for push notifications (TR-F-066) and offline caching (TR-NF-002), home screen install prompt (INSTR-017), offline state screen (INSTR-015), push notification permission prompt (INSTR-016).

| ID | Name | Use Case(s) | Key UI Elements | Device | Auth Required | Bilingual |
|----|------|-------------|-----------------|--------|---------------|-----------|
| INSTR-001 | Sign In | UC-018–UC-021 | DS-006 email, DS-005 password, submit, forgot-password link | Mobile | Guest OK | Alpha |
| INSTR-002 | Today's Schedule (Home) | UC-018 | Chronological DS-021 lesson card list, date header, DS-027 empty state with next-lesson date, DS-062 bottom nav. Offline: Service Worker serves cached schedule with DS-026 stale-data banner showing last sync timestamp. | Mobile | Y | Alpha |
| INSTR-003 | Lesson Card — Expanded Detail | UC-018, UC-019, UC-020, UC-021 | Student name, skill level, lesson type, meeting point, DS-018 status badge, Check In / No-Show / Add Notes action buttons | Mobile | Y | Alpha |
| INSTR-004 | Check-In Screen | UC-019 | Student summary, DS-017 waiver status badge ("Waiver Signed" / "Waiver Pending"), DS-067 ThirdPartyESignEmbed rendered only when `Learner.waiverSignedAt` is null and tenant requires waiver, DS-001 "Check In" CTA (enabled after waiver is signed or if waiver is not required), DS-025 success toast. Offline: DS-026 banner "Check-in requires an internet connection" — check-in cannot be queued offline in v1.0. (OQ-008, OQ-003, TR-F-085) | Mobile | Y | Alpha |
| INSTR-005 | No-Show Confirmation | UC-020 | DS-024 confirm dialog, student name, DS-001 confirm / DS-002 cancel | Mobile | Y | Alpha |
| INSTR-006 | Session Notes | UC-021 | DS-008 notes textarea, DS-014 share-with-student toggle (labelled "Share with student" — when off, visible to instructor and admin only), DS-001 save, DS-025 confirmation toast | Mobile | Y | Alpha |
| INSTR-007 | Availability Management — Weekly View | UC-020 | DS-038 week view, DS-042 availability blocks (drag-to-create/resize; tap-to-select + confirmation as mobile-accessible alternative per Section 6.4), DS-016 block type selector (available / blocked), DS-026 conflict banner when override conflicts with existing confirmed bookings (admin resolution required — instructor cannot silently remove bookings, TR-F-037) | Mobile | Y | Alpha |
| INSTR-008 | Availability — Add Override | UC-020 | DS-011 date picker, DS-012 time pickers, DS-016 available/blocked, DS-001 save, DS-024 conflict-warning confirm | Mobile | Y | Alpha |
| INSTR-010 | Earnings Dashboard | UC-021 | Period selector tabs (today / week / season / custom), DS-054 line chart, earnings breakdown table per lesson type, tips as separate line item (shown when `Tenant.tipsEnabled = true`; hidden otherwise), DS-013 date range for custom period. (OQ-018, TR-F-073) | Mobile | Y | Alpha |
| INSTR-011 | Profile — Own View | UC-038 | DS-019 photo upload (DS-043), DS-004 name, DS-008 bio with EN/FR dual-input fields (each clearly labelled), certifications section, languages spoken, DS-001 save, DS-018 onboarding status badge | Mobile | Y | Alpha |
| INSTR-012 | Onboarding — Profile Setup | UC-038 | DS-033 step stepper, FORM-009 broken into steps, DS-001 submit for review | Mobile | Y | Alpha |
| INSTR-013 | Onboarding — Pending / Approved / Rejected State | UC-038 | Onboarding status illustration (ILLUS-005/006/007), status message (bilingual), feedback text (on rejection), DS-001 "Edit and Resubmit" (on rejection) | Mobile | Y | Alpha |
| INSTR-014 | Settings | UC-009 | DS-050 language toggle, DS-004 contact info, change-password link | Mobile | Y | Alpha |
| INSTR-015 | Error — Generic / Offline State | All | DS-030 offline-specific variant with ILLUS-010, retry button, last-synced time. On offline, INSTR-002 serves cached schedule with DS-026 stale-data banner. Check-in (INSTR-004) requires connection — offline check-in is not supported in v1.0. (OQ-003, TR-NF-002) | Mobile | Y | Alpha |
| INSTR-016 | Push Notification Permission Prompt | OQ-003, TR-F-066 | Shown once after first login (or if previously denied). Explains notifications sent: new lesson assignments, cancellations, reassignments. DS-001 "Allow Notifications", DS-002 "Not Now". If denied: DS-026 persistent banner on INSTR-002 "Notifications are off — tap to enable." If browser push is unavailable: fallback to email-only is noted. | Mobile | Y | Alpha |
| INSTR-017 | PWA — Home Screen Install Prompt | OQ-003 | Triggered by browser `beforeinstallprompt` event (not shown if already installed or previously dismissed within 14 days). DS-023 modal or DS-061 bottom sheet: ICON-004 app icon, "Add Slopebook to your home screen" headline, brief copy (offline access, quick launch), DS-001 "Install", DS-002 "Not Now". Dismiss stores a flag in localStorage; re-prompt suppressed for 14 days. | Mobile | Guest OK | Alpha |

**Note on INSTR-009:** Google Calendar Sync Setup (previously planned as INSTR-009) is removed from v1.0 scope by OQ-021. See Section 9 (Deferred Assets). The gap in INSTR-0xx numbering is intentional.

---

### 2.4 Operator App (port 3003) — Desktop-First

**Bilingual requirement:** Operator app ships English-only at Alpha; bilingual (EN/FR) required at Beta. String keys namespaced from day one (OQ-001, TR-F-096).

| ID | Name | Use Case(s) | Key UI Elements | Device | Auth Required | Bilingual |
|----|------|-------------|-----------------|--------|---------------|-----------|
| OPER-001 | Sign In | UC-030–UC-034 | DS-006 email, DS-005 password, submit | Desktop | Guest OK | Beta |
| OPER-002 | Multi-School Dashboard | UC-033 | School summary cards (booking count, revenue in school's currency, active instructors), DS-017 status badges, DS-026 alerts | Desktop | Y | Beta |
| OPER-003 | Resort Policies | UC-030 | FORM-012: currency selector (DS-016: USD/CAD), default language (DS-016: EN/FR), pricing floors (DS-045), cancellation policy defaults, seasonal rate card section, DS-026 mid-season currency-change warning | Desktop | Y | Beta |
| OPER-004 | Payment Processor Configuration | UC-031 | FORM-013: processor DS-016 selector (Stripe / Shift4), credential inputs (DS-004 — masked/redacted after save: field shows "••••••••" and becomes read-only; "Edit Credentials" button re-enables the field for new input; credentials never returned in any API response per TR-F-020 / OQ-022), DS-001 "Test Transaction" button, DS-017 test result badge, diagnostic message on failure (e.g., "Invalid API key — verify your credentials in the Stripe Dashboard"). | Desktop | Y | Beta |
| OPER-005 | White-Label Configuration | UC-032 | FORM-014: custom domain input (DS-004), DNS verification status (DS-017/DS-026), DS-043 logo upload, DS-044 image cropper, DS-047 color picker, DS-048 embed code (iframe + JS snippet), ILLUS-012 widget preview mockup | Desktop | Y | Beta |
| OPER-006 | White-Label — DNS Pending / Verified State | UC-032 (alt 2a) | DS-026 pending banner with step-by-step DNS record instructions panel, DS-002 "Re-check DNS" button (manual on-demand poll), polling interval indicator ("Next auto-check in Xm"), DS-017 verified badge on success, DS-017 error badge on verification failure with guidance (what record types to check, TTL notes). (TR-F-075) | Desktop | Y | Beta |
| OPER-007 | Consolidated Reporting | UC-033 | DS-013 date range, DS-009 school filter, DS-053 bar chart by school, DS-034 multi-school revenue table with separate USD and CAD columns (no FX conversion per TR-F-100), CSV export | Desktop | Y | Beta |
| OPER-008 | Integrations — API Keys | UC-034 | DS-034 API key table (label, created date, last used, status), DS-001 "Generate New Key", one-time key display modal: DS-048 CodeBlock showing raw key, DS-026 warning "This key will not be shown again — copy it now", DS-015 "I have copied my key" acknowledgment checkbox (must be checked before Dismiss activates), DS-024 revoke-key confirm. (TR-NF-015) | Desktop | Y | Beta |
| OPER-009 | Integrations — Webhooks | UC-034 | DS-034 webhook endpoint table, FORM-015 add/edit endpoint (URL, event subscriptions DS-015 checkboxes: booking.confirmed, booking.cancelled, waitlist.promoted), DS-001 "Send Test Ping", DS-017 last delivery status badge, DS-026 auto-deactivation notice if consecutive failure threshold exceeded | Desktop | Y | Beta |
| OPER-010 | Settings — Profile & Account | — | Admin name, email, change-password, DS-050 language toggle | Desktop | Y | Beta |
| OPER-011 | Error — Generic | All | DS-030 with message and request ID | Desktop | Y | Beta |

---

## 3. Notification Templates

### 3.1 Standard Notification Templates

All notification templates exist in both English (EN) and French (FR). EN/FR templates for customer app and instructor PWA events are required at Alpha; all remaining templates required at Beta. Channel abbreviations: E = email, S = SMS.

All copy referencing the waitlist accept window duration must be dynamically populated from `Tenant.waitlistAcceptWindowMinutes` — never hard-coded (OQ-009, TR-F-045). All email templates must include a plain-text alternative part. Images in email headers must have descriptive `alt` text. All emails must include a footer unsubscribe link pointing to NOTIF-PREF-001.

| ID | Trigger Event | Channel | Languages | Key Content / Variables | Alpha/Beta |
|----|--------------|---------|-----------|------------------------|------------|
| NOTIF-001 | Booking confirmed (new booking — guest checkout or authenticated) | E + S | EN, FR | `{{learnerName}}`, `{{lessonType}}`, `{{instructorName}}`, `{{date}}`, `{{time}}`, `{{meetingPoint}}`, `{{price}}`, `{{tipAmount}}` (if tip > 0; shown as separate line), `{{currency}}`, .ics attachment in email | Alpha |
| NOTIF-002 | Booking confirmed (waitlist accept path) | E + S | EN, FR | Same vars as NOTIF-001 plus `{{originalWaitlistDate}}` | Alpha |
| NOTIF-003 | Booking cancellation — initiated by guest | E | EN, FR | `{{learnerName}}`, `{{lessonType}}`, `{{date}}`, `{{refundAmount}}`, `{{currency}}`, `{{refundTimeline}}`, `{{cancellationReason}}` | Alpha |
| NOTIF-004 | Booking cancellation — initiated by admin | E | EN, FR | Same vars as NOTIF-003 plus `{{cancelledByAdminName}}` | Alpha |
| NOTIF-005 | Weather bulk cancellation | E + S | EN, FR | `{{learnerName}}`, `{{lessonType}}`, `{{date}}`, `{{refundAmount}}`, `{{currency}}`, `{{rebookingLink}}` (deep-link pre-populated with `lessonTypeId` and `skillLevelAtBooking` per TR-F-065), weather-closure explanation | Alpha |
| NOTIF-006 | Booking reassigned — guest notification | E | EN, FR | `{{learnerName}}`, `{{lessonType}}`, `{{date}}`, `{{newInstructorName}}`, `{{oldInstructorName}}` | Alpha |
| NOTIF-007 | Booking reassigned — new instructor notification | E | EN, FR | `{{learnerName}}`, `{{skillLevel}}`, `{{lessonType}}`, `{{date}}`, `{{time}}`, `{{meetingPoint}}` | Alpha |
| NOTIF-008 | Booking reassigned — original instructor notification | E | EN, FR | `{{lessonType}}`, `{{date}}`, `{{time}}` (booking removed from schedule) | Alpha |
| NOTIF-009 | New booking assigned to instructor | E + push (PWA Service Worker) | EN, FR | `{{learnerName}}`, `{{skillLevel}}`, `{{lessonType}}`, `{{date}}`, `{{time}}`, `{{meetingPoint}}` | Alpha |
| NOTIF-010 | 24-hour lesson reminder — guest | E + S | EN, FR | `{{learnerName}}`, `{{instructorName}}`, `{{lessonType}}`, `{{date}}`, `{{time}}`, `{{meetingPoint}}`, .ics attachment | Alpha |
| NOTIF-011 | 24-hour lesson reminder — instructor | E + push | EN, FR | `{{studentCount}}` or `{{learnerName}}`, `{{lessonType}}`, `{{date}}`, `{{time}}`, `{{meetingPoint}}` | Alpha |
| NOTIF-012 | Waitlist slot available (notification to user) | E + S | EN, FR | `{{lessonType}}`, `{{date}}`, `{{time}}`, `{{instructorName}}` (if specific-instructor mode), `{{acceptLink}}`, `{{acceptWindowDisplay}}` (dynamically rendered from `Tenant.waitlistAcceptWindowMinutes`, e.g., "2 hours" or "30 minutes" — never hard-coded per OQ-009) | Alpha |
| NOTIF-013 | Waitlist join confirmation | E | EN, FR | `{{lessonType}}`, `{{date}}`, `{{time}}`, `{{waitlistMode}}`, `{{acceptWindowDisplay}}` (dynamic from `Tenant.waitlistAcceptWindowMinutes`) | Alpha |
| NOTIF-014 | Waitlist entry expired (no response within window) | E | EN, FR | `{{lessonType}}`, `{{date}}`, link to re-join waitlist or browse other dates | Alpha |
| NOTIF-015 | Waitlist declined by user | E | EN, FR | Confirmation that entry was removed; link to browse other dates | Alpha |
| NOTIF-016 | Payment failed — charge to card on file | E + S | EN, FR | `{{learnerName}}`, `{{lessonType}}`, `{{date}}`, link to update payment method (TR-F-023) | Alpha |
| NOTIF-017 | Refund initiated | E | EN, FR | `{{learnerName}}`, `{{refundAmount}}`, `{{currency}}`, `{{refundTimeline}}` | Alpha |
| NOTIF-018 | Refund failed — flagged for admin | E (to admin) | EN, FR | `{{learnerName}}`, `{{bookingId}}`, `{{refundAmount}}`, link to admin booking detail | Beta |
| NOTIF-019 | No-show alert — to school admin | E + push (admin) | EN, FR | `{{learnerName}}`, `{{instructorName}}`, `{{lessonType}}`, `{{date}}`, `{{time}}`, link to admin booking detail | Beta |
| NOTIF-020 | Instructor certification expiry warning (60 days out) | E (to admin) | EN, FR | `{{instructorName}}`, `{{certificationBody}}`, `{{certificationLevel}}`, `{{expiryDate}}`, link to instructor profile | Beta |
| NOTIF-021 | Instructor certification expired — new assignments blocked | E (to admin) | EN, FR | `{{instructorName}}`, `{{certificationBody}}`, `{{expiryDate}}`, link to instructor profile | Beta |
| NOTIF-022 | Instructor onboarding approved | E (to instructor) | EN, FR | `{{instructorName}}`, `{{schoolName}}`, confirmation that profile is live | Alpha |
| NOTIF-023 | Instructor onboarding rejected | E (to instructor) | EN, FR | `{{instructorName}}`, `{{feedbackText}}`, link to edit profile and resubmit | Alpha |
| NOTIF-024 | Account registration confirmation | E | EN, FR | `{{userName}}`, welcome message, link to account dashboard | Alpha |
| NOTIF-025 | Password reset | E | EN, FR | `{{userName}}`, password reset link with TTL note | Alpha |
| NOTIF-026 | Phone number verification OTP | S | EN, FR | OTP code, expiry time | Alpha |
| NOTIF-027 | Delivery failure log / dead-letter alert | Internal (admin dashboard flag) | EN, FR | `{{notificationId}}`, `{{recipientEmail}}`, `{{eventType}}`, `{{failureReason}}`, timestamp | Beta |
| NOTIF-028 | Lesson package purchase confirmation | E | EN, FR | `{{householdName}}`, `{{packageName}}`, `{{lessonCount}}`, `{{eligibleLessonTypes}}`, `{{expiryDate}}` (if applicable, otherwise omitted), `{{price}}`, `{{currency}}`, redemption instructions. No tip line item. (OQ-019) | Beta |
| NOTIF-029 | Lesson package exhausted (last redemption used) | E | EN, FR | `{{householdName}}`, `{{packageName}}`, confirmation that the last lesson was redeemed and the package is now exhausted, CTA link to CUST-PKG-001 to purchase a new package. (OQ-019) | Beta |
| NOTIF-030 | Lesson package expiring soon (within 30 days) | E | EN, FR | `{{householdName}}`, `{{packageName}}`, `{{remainingCount}}`, `{{expiryDate}}`, CTA link to book a lesson to use remaining credits. (OQ-019) | Beta |
| NOTIF-031 | Stored payment methods invalidated (processor switch) | E | EN, FR | `{{householdName}}`, explanation that stored cards are no longer valid due to a payment system update, CTA link to CUST-020 to add a new card. (TR-F-031) | Alpha |

### 3.2 Unsubscribe Preference Center

| ID | Trigger / Access | Channel | Languages | Key Content | Alpha/Beta |
|----|-----------------|---------|-----------|-------------|------------|
| NOTIF-PREF-001 | Email footer unsubscribe link — present in the footer of all Slopebook email templates. Managed via SendGrid suppression list automation (OQ-016, TR-F-062). | Web page (linked from email footer unsubscribe token URL) | EN, FR | Recipient email pre-populated from unsubscribe token. DS-015 checkboxes for notification categories: Booking confirmations and reminders; Waitlist notifications; Promotional / marketing emails; Account and security alerts. "Unsubscribe from all" option. DS-001 "Save Preferences". DS-025 success toast. When opt-out saved: `User.emailOptOut` set to true; address added to SendGrid suppression list (TR-F-062). Re-subscribe path shown at top of page when currently suppressed ("You are unsubscribed — click here to re-subscribe"). Note: account/security and payment-failure transactional emails cannot be disabled; this restriction is stated clearly on the page. | Alpha (page live at Alpha); Beta (category-level granularity) |

---

## 4. Forms & Input Flows

### Naming convention
- FORM-001 through FORM-020 are distinct forms or multi-step flows.
- "Step N" headings describe discrete screens or logical sections within a multi-step context.
- Fields marked `[EN+FR]` require bilingual input (two separate text fields per content piece).

---

| ID | Name | Steps | Fields | Validation Rules (High-Level) | Bilingual |
|----|------|-------|--------|-------------------------------|-----------|
| FORM-001 | Booking Widget — Full 7-Step Flow | Step 1: Lesson Type + Skill Level; Step 2: Skill Self-Assessment (conditional on not selecting skill level in Step 1); Step 3: Instructor Browse / Select; Step 4: Date & Time; Step 5: Auth Gate; Step 6: Learner Selection; Step 7: Payment & Confirm (includes DS-TIP-001 and/or CUST-PKG-004 as applicable) | Lesson type, skill level, optional instructor, date, time slot, auth method, learner (select or add), email, card fields, save-card opt-in, tip amount (optional), package selection (optional) | Lesson type required; skill level required (or self-assessment completed); time slot must be available (soft hold check — platform TTL 15 min, OQ-011); learner must belong to authenticated household; email valid format; card data handled by processor SDK; tip ≥ 0 if shown; package must have remaining count > 0 and not be expired if selected | Alpha (EN/FR) |
| FORM-002 | Guest Checkout (No Account) | Contained within FORM-001 Step 7 | Email address, processor-tokenised card fields | Email: valid format, required; Card: tokenised by processor SDK before submission | Alpha (EN/FR) |
| FORM-003 | Add / Edit Learner | Single modal or inline step | First name, last name, date of birth (DS-011), skill level (DS-009), parental consent checkbox (DS-015, required when learner is under 18) | All fields required; DOB < 5 years: show DS-026 guidance text, not a hard block (OQ-007, TR-F-051); DOB < 18 years: parental consent checkbox must be checked before submit (OQ-007, TR-F-052); skill level must be a configured level | Alpha (EN/FR) |
| FORM-004 | Create Account | Single screen | Full name, email, password, language preference | Email unique; password minimum length; language one of (en, fr) | Alpha (EN/FR) |
| FORM-005 | Sign In | Single screen | Email, password | Both required; email format check | Alpha (EN/FR) |
| FORM-006 | Forgot Password | Single screen | Email | Valid format, required | Alpha (EN/FR) |
| FORM-007 | Reset Password | Single screen | New password, confirm password | Minimum length; both match | Alpha (EN/FR) |
| FORM-008 | Join Waitlist | Step 1: Waitlist mode (any instructor / specific); Step 2: If specific — instructor select; Step 3: Email (unauthenticated path only — conditional branch; authenticated users use household learner selector) | Waitlist mode (required), instructor ID (if specific mode), email (if unauthenticated, valid format required) | Mode required; if specific instructor, instructorId required; if unauthenticated, email required and valid; accept window shown dynamically on confirmation (OQ-009) | Alpha (EN/FR) |
| FORM-009 | Instructor Profile Setup / Onboarding | Step 1: Basic info (name, photo, bio); Step 2: Certifications; Step 3: Languages + lesson types; Step 4: Review & Submit | Display name, photo (DS-043), bio [EN+FR dual fields], certifications (body: PSIA/CSIA, level, expiry date DS-011), languages spoken (DS-010), lesson types qualified (DS-010) | Name required; at least one certification required; expiry date must be in the future; at least one lesson type required | Alpha (EN/FR) |
| FORM-010 | Lesson Type Create / Edit | Single page / modal | Name [EN+FR], description [EN+FR], category, applicable skill levels (DS-010), max capacity (group/semi-private), duration (minutes), base price (DS-045), active toggle (DS-014) | Name required in at least one language; price > 0; capacity required for group/semi-private; duration > 0; group lesson categories gated to Growth+ — API returns 402 on Starter, UI shows upsell prompt | Beta (admin; EN/FR) |
| FORM-011 | School Cancellation Policy | Single settings page | Full refund window (hours before lesson), partial refund window (hours), partial refund percentage (DS-046), no-refund window (hours), no-show policy (DS-016: no refund / partial / full) | All windows non-negative integers; partial refund % 1–99; logical ordering: full ≥ partial ≥ no-refund | Beta (admin; EN/FR) |
| FORM-012 | Resort Policies | Single settings page | Operating currency (DS-016: USD/CAD), default language (DS-016: EN/FR), pricing floor (DS-045), default cancellation policy, seasonal rate card (optional) | Currency and language required; pricing floor ≥ 0; mid-season currency change triggers DS-024 confirmation dialog | Beta (operator; EN/FR) |
| FORM-013 | Payment Processor Configuration | Step 1: Processor selection; Step 2: Credentials; Step 3: Test transaction | Processor (DS-016: Stripe/Shift4), API public key, API secret key (masked/redacted after save per OQ-022 / TR-F-020 — field shows "••••••••", read-only until "Edit Credentials" clicked; credentials never returned by API), merchant ID (Shift4 direct model only, required for Growth/Pro/Enterprise on Shift4 per TR-F-032; not shown for Starter Shift4 sub-merchant routing) | Processor required; all credential fields required; test transaction must succeed; credentials never returned in any API response | Beta (operator; EN/FR) |
| FORM-014 | White-Label Configuration | Step 1: Domain; Step 2: Branding; Step 3: Embed Code | Custom domain (DS-004), logo file (DS-043 + DS-044), primary color (DS-047), secondary color (DS-047) | Domain: valid FQDN; logo: PNG or SVG ≤ 2 MB; colors: valid hex; domain stays pending until DNS verified (TR-F-075); Enterprise tier required (TR-F-103) | Beta (operator; EN/FR) |
| FORM-015 | Webhook Endpoint Add / Edit | Single modal | Endpoint URL (DS-004), subscribed events (DS-015 checkboxes: booking.confirmed, booking.cancelled, waitlist.promoted) | URL: valid HTTPS URL, required; at least one event selected | Beta (operator; EN/FR) |
| FORM-016 | Admin Cancel Booking | Single modal / dialog | Cancellation reason (DS-008, optional), refund amount override (DS-045, optional; shown alongside system-calculated refund; TR-F-029), confirm checkbox | Override: 0 ≤ override ≤ original amount; reason logged to AuditLog | Beta (admin; EN/FR) |
| FORM-017 | Admin Reassign Instructor | Single modal | Instructor selector (DS-009, shows only instructors with `onboardingStatus = approved` and no conflict for the booking's time window) | Instructor required; system performs conflict check (TR-F-003) | Beta (admin; EN/FR) |
| FORM-018 | Add Payment Method | Single modal | DS-069 processor-hosted card input, billing name | Card fields handled by processor SDK; billing name required | Alpha (EN/FR) |
| FORM-019 | Waiver Capture — Third-Party E-Signature | Single screen / overlay at check-in | DS-067 ThirdPartyESignEmbed (mounts provider iframe/SDK), learner/guardian name (DS-004, pre-filled), timestamp (auto), DS-001 "Accept & Sign". Keyboard-accessible fallback: DS-004 typed name confirmation + DS-015 legal acknowledgment checkbox. On completion: provider `waiverToken` and `waiverVersion` posted to Slopebook API; Slopebook stores reference fields only — `Learner.waiverSignedAt`, `Learner.waiverVersion`, `Learner.waiverToken` (OQ-008, TR-F-085). | Alpha (EN/FR) |
| FORM-020 | Generate API Key | Single modal | Key label (DS-004) | Label required, max 80 characters; key displayed once via DS-048 with mandatory "I have copied my key" acknowledgment checkbox before dismiss (TR-NF-015) | Beta (operator; EN/FR) |

---

## 5. Static & Media Assets

### 5.1 Logo Slots

| Asset ID | Slot | Description | Used By | Format | Size Guidance |
|----------|------|-------------|---------|--------|---------------|
| LOGO-001 | Slopebook default logo (light) | Official Slopebook brand mark for non-white-labeled deployments. Light-background variant. | customer, instructor, admin, operator | SVG preferred; PNG fallback | Max 180 × 48 px display |
| LOGO-002 | Slopebook default logo (dark / reversed) | For dark headers or dark-mode contexts. | customer, instructor, admin, operator | SVG preferred; PNG fallback | Max 180 × 48 px display |
| LOGO-003 | Operator white-label logo slot | Uploaded by the resort operator via FORM-014. Replaces LOGO-001 in white-label deployments. | customer (widget), operator config UI | PNG or SVG, ≤ 2 MB | Cropped to 180 × 48 px display area via DS-044 |
| LOGO-004 | Operator white-label favicon | Small icon for browser tabs on custom-domain deployments. | customer (widget) | PNG or ICO, 32 × 32 px and 16 × 16 px | — |
| LOGO-005 | Email template header logo | Used in all notification email templates. Slopebook default or white-label override. | Notification Service (all emails) | PNG, 2× for HiDPI | 200 × 60 px display |

### 5.2 Icon Set

| Asset ID | Description |
|----------|-------------|
| ICON-001 | Functional icon set — minimum 80 icons covering: navigation (home, calendar, user, settings, back, close, menu), booking actions (check-in, no-show, cancel, reassign, notes, add), status (check, warning, error, info, lock, clock, refresh), lesson types (ski, group, private), payments (card, receipt, refund, tip), misc (download, upload, copy, filter, sort, search, language, star, plus, trash, edit, drag-handle, package, erase). |
| ICON-002 | Payment brand icons — Visa, Mastercard, Amex, Discover logos for DS-070 saved card display. |
| ICON-003 | Certification body logos / marks — PSIA, CSIA for CUST-004 and INSTR-011 display. |
| ICON-004 | App icon / PWA icon — Instructor PWA home screen icon at 192 × 192 px and 512 × 512 px for `manifest.json`. Required for INSTR-017 install prompt and PWA installability checks. (OQ-003) |
| ICON-005 | Favicon set — 16 × 16, 32 × 32, 180 × 180 (Apple touch icon) for all four apps. |

### 5.3 Instructor Profile Photos

| Asset ID | Description |
|----------|-------------|
| PHOTO-001 | Instructor profile photo upload slot — accepts JPEG or PNG. Minimum 400 × 400 px. Cropped to 1:1 ratio via DS-044. Stored at multiple resolutions: 48 × 48, 96 × 96, 200 × 200 px. |
| PHOTO-002 | Instructor profile photo placeholder — generic avatar SVG displayed when no photo is uploaded. Used in DS-019 fallback. |

### 5.4 Placeholder & Illustration Assets

| Asset ID | Description | Used In |
|----------|-------------|---------|
| ILLUS-001 | Booking confirmation success illustration | CUST-009 |
| ILLUS-002 | Waitlist confirmation illustration | CUST-024 |
| ILLUS-003 | Empty schedule illustration (no lessons today) | INSTR-002 empty state |
| ILLUS-004 | No search results illustration | DS-027 generic empty state |
| ILLUS-005 | Instructor onboarding pending illustration | INSTR-013 (pending state) |
| ILLUS-006 | Instructor onboarding approved illustration | INSTR-013 (approved state) |
| ILLUS-007 | Instructor onboarding rejected illustration | INSTR-013 (rejected state) |
| ILLUS-008 | Waitlist expired illustration | CUST-026 |
| ILLUS-009 | Generic error illustration | DS-030, CUST-027, ADMIN-023, INSTR-015, OPER-011 |
| ILLUS-010 | Offline / no connection illustration | INSTR-015 offline variant |
| ILLUS-011 | Payment failed illustration | CUST-028 |
| ILLUS-012 | White-label widget preview mockup (static) | OPER-005 — shows how the embedded widget looks before branding is applied |
| ILLUS-013 | Lesson package purchase confirmation illustration | CUST-PKG-002 success state |
| ILLUS-014 | Lesson package exhausted / empty illustration | CUST-PKG-003 — shown when all packages are exhausted or expired and the list is empty |
| ILLUS-015 | Right-to-erasure success illustration | ADMIN-GDPR-001 — shown in DS-025 toast area or inline after successful erasure |

### 5.5 .ics Calendar Template

| Asset ID | Description | Variables |
|----------|-------------|-----------|
| ICS-001 | Booking confirmation .ics attachment | `SUMMARY`: lesson type name (bilingual, per recipient language); `DTSTART` / `DTEND`: booking start and end time in UTC; `LOCATION`: meeting point; `DESCRIPTION`: instructor name, school name, booking reference ID; `ORGANIZER`: school email; `UID`: booking ID-based unique identifier. Generated per-booking by the Notification Service per TR-F-040. |

### 5.6 White-Label Color & Font Configuration

| Asset ID | Description |
|----------|-------------|
| THEME-001 | CSS custom property token set — defines overridable design tokens for white-label deployments: `--color-primary`, `--color-primary-dark`, `--color-on-primary`, `--color-surface`, `--color-background`, `--color-text`, `--color-error`. Set via operator-uploaded config; applied to the customer booking widget at render time. Admin, instructor, and operator apps always use the Slopebook brand palette and are not white-labelled. |
| THEME-002 | Font stack — default system font stack (Inter or similar) for all apps. White-label custom font selection is deferred to v1.5. For v1.0, the font is fixed to the platform default. |
| THEME-003 | Dark mode token set — mirrors THEME-001 tokens for dark background surfaces. Required for the instructor PWA (frequent outdoor/glare use case). Admin and operator app dark mode deferred to v1.5. Customer widget may achieve an effectively dark theme via THEME-001 overrides. |

---

## 6. Accessibility & i18n Requirements

### 6.1 WCAG Target

| Surface | Target | Notes |
|---------|--------|-------|
| customer app (booking widget) | WCAG 2.1 AA | Guest-facing, publicly accessible. AA compliance required to mitigate legal risk in CA and US markets. |
| instructor app (PWA) | WCAG 2.1 AA | Used on mobile devices outdoors; high-contrast and large-touch-target compliance critical. |
| admin app | WCAG 2.1 AA | Internal tool but must be accessible for all team members. |
| operator app | WCAG 2.1 AA | Same rationale as admin app. |

### 6.2 Language Switching Mechanism

- A persistent `LanguageToggle` component (DS-050) must appear in the global header / navigation on all four surfaces.
- On unauthenticated pages (booking widget, sign-in), language toggle must be accessible before authentication.
- Selected language priority order: (1) authenticated user's `User.preferredLanguage`, (2) `lang` query parameter in the booking widget embed URL, (3) browser `navigator.language` as fallback.
- Locale applied via i18n framework (`next-intl` or `react-i18next`). No hardcoded strings in any language may appear in any component file — all strings supplied via namespaced keys in `packages/ui`.
- All date formats, time formats, and currency displays must adapt to locale (e.g., `2026-03-26` vs. `26 mars 2026` for FR).
- **Phased rollout:** customer and instructor apps bilingual at Alpha. Admin and operator apps bilingual at Beta. String keys namespaced from day one — no architectural changes required at Beta (OQ-001, TR-F-095, TR-F-096).
- **Starter-tier FR restriction:** FR toggle hidden on Starter-tier tenants in the customer app (display-layer suppression only; underlying i18n strings remain present) (OQ-002, TR-F-104).
- RTL: English and French are both LTR. No RTL layout implementation required for v1.0. i18n framework must support future `dir="rtl"` addition without a full rework.

### 6.3 Screen Reader Requirements

| Component / Flow | Requirement |
|------------------|------------|
| DS-033 Stepper | Each step must have `aria-current="step"` on the active step. Completed steps must use `aria-label` indicating completion. |
| DS-011 DatePicker / DS-041 TimeSlotPicker | Calendar grid must use `role="grid"` with `role="gridcell"` per day. Available vs. unavailable cells must be differentiated by `aria-disabled` and visual indicator. Selected date must have `aria-selected="true"`. |
| DS-038 / DS-039 Scheduler (Admin / Instructor) | Drag-and-drop interactions must have keyboard-accessible equivalents (arrow keys to move blocks, Enter to confirm). Booking blocks must have descriptive `aria-label` (learner, time, lesson type). |
| DS-023 Modal / DS-060 Drawer | Must trap focus while open. Must restore focus to trigger element on close. Must announce open/close state via `aria-modal` and `role="dialog"`. |
| DS-067 ThirdPartyESignEmbed | Must provide keyboard-accessible fallback (typed name confirmation + legal acknowledgment checkbox) for users unable to interact with the embedded iframe. |
| NOTIF email templates | All emails must include a plain-text alternative part. Email header images must have descriptive `alt` text. |
| DS-069 PaymentCardInput | Processor-hosted card fields must pass accessibility requirements of the selected processor SDK. Integration QA must verify tabindex and label association. |
| DS-017 / DS-018 Badges | Color alone must not be the sole status indicator. Each badge variant must also include a text label or `aria-label` describing the status. |
| Booking confirmation .ics | CUST-009 must present all booking details in readable text independently of the .ics file. |
| DS-027 EmptyState / DS-030 ErrorState | Must include a live region (`aria-live="polite"`) so dynamically injected states are announced. |
| Language toggle (DS-050) | Switching language must update the `lang` attribute on the `<html>` element in real time. |
| DS-TIP-001 TipSelector | Preset buttons keyboard-navigable; active state communicated via `aria-pressed`. Custom amount field must have a visible label. Minimum touch target 44 × 44 px. |
| ADMIN-GDPR-001 | "Confirm Erasure" button must remain disabled until the admin has typed the target guest's email address. This prevents accidental destructive actions. |

### 6.4 Touch Target & Mobile-Specific Requirements

- Minimum touch target size: 44 × 44 px for all interactive elements.
- DS-042 availability blocks and DS-038 scheduling grid must be operable without precise drag gestures on mobile; tap-to-select + confirmation is an acceptable alternative.
- INSTR-002 (Today's Schedule) and INSTR-007 (Availability) must be optimised for single-thumb operation.
- DS-TIP-001 preset buttons must be minimum 44 × 44 px on mobile.

---

## 7. Resolved Asset Gaps (Run 2)

The following gaps from Run 1 have been resolved by the decisions enumerated in the Run 2 open-questions log. No further design work is blocked on these items.

| Gap ID | Original Description | Resolution |
|--------|---------------------|------------|
| UIGAP-001 | Waiver Signature Screen | Resolved by OQ-008. DS-067 custom canvas replaced by DS-067 ThirdPartyESignEmbed. INSTR-004 shows waiver status indicator; full embed shown only when waiver unsigned. FORM-019 updated. |
| UIGAP-003 | Soft-Hold Countdown Timer | Resolved by OQ-011. Platform TTL fixed at 15 minutes. CUST-005 shows MM:SS countdown in DS-026 banner; DS-024 modal on expiry. |
| UIGAP-005 | Push Notification Permission Screen | Resolved by OQ-003. INSTR-016 confirmed and fully specified. |
| UIGAP-019 | Google Calendar Sync UI | Resolved by OQ-021. INSTR-009 moved to deferred (DEFER-001). |
| UIGAP-020 | Tips Feature UI | Resolved by OQ-018. DS-TIP-001 added; CUST-008 updated; INSTR-010 shows tips as separate earnings line item. |
| UIGAP-022 | Minimum Learner Age Rejection State | Resolved by OQ-007. DS-026 guidance text for under-5 (not a hard block); parental consent checkbox required for under-18. FORM-003 and CUST-019 updated. |
| UIGAP-023 | PWA Offline / Cached Schedule | Resolved by OQ-003. INSTR-015 specifies cached schedule with stale-data banner. Check-in requires connection in v1.0. |

---

## 8. Open Asset Gaps (Carry Forward to Detailed Design Phase)

The following gaps were not fully resolved by the open-questions decisions and are carried forward for resolution in the detailed design phase.

| Gap ID | Description | Implied By | Priority |
|--------|-------------|------------|----------|
| UIGAP-002 | **Skill Self-Assessment Question Set (CUST-002)** — Instructional level descriptions are now specified. A specific 3-5 question decision tree for guests who are genuinely undecided about their level has not been written. Copy team to produce. | UC-001 alt 4a | High |
| UIGAP-004 | **Payment Failure Recovery UI Layout (CUST-028)** — Run 2 specifies inline update within CUST-008. Wireframe for the exact inline error + card re-entry layout needed. | UC-004 alt 4a, TR-F-022 | High |
| UIGAP-006 | **In-Progress Status Colour Token** — DS-018 `in_progress` variant specified as "blue." The specific design token (value in THEME-001) must be pinned by the design team. | UC-019, TR-F-013 | Medium |
| UIGAP-007 | **Session Notes Shared/Unshared UX Detail** — INSTR-006 share toggle specified. Admin view (ADMIN-007) and customer view (CUST-015) empty-state copy and shared-indicator need wireframe. | UC-021, TR-F-016 | Medium |
| UIGAP-008 | **Cancellation Policy Explanation Component** — Referenced in CUST-016 and ADMIN-008. Wireframe for the breakdown display (which window, hours remaining, refund percentage) needed. | UC-008, TR-F-028 | Medium |
| UIGAP-009 | **Weather Cancellation Rebooking Deep-Link Entry State** — CUST-030 shell accepts `lessonTypeId` and `skillLevel` URL params. Wireframe for the CUST-001 variant that receives this deep link and pre-populates the booking widget needed. | UC-024, TR-F-065 | Medium |
| UIGAP-010 | **API Key One-Time Display Modal Detail** — OPER-008 specifies acknowledgment checkbox. Detailed wireframe needed. | UC-034, TR-NF-015 | Medium |
| UIGAP-011 | **DNS Verification Polling State Detail** — OPER-006 specifies manual re-check and instructions panel. Wireframe and DNS record copy needed. | UC-032 alt 2a, TR-F-075 | Medium |
| UIGAP-012 | **Instructor Certification Expiry Visual Treatment** — ADMIN-012 and ADMIN-013 descriptions updated. Wireframe for per-row badge placement and blocked-from-assignment state in the roster table needed. | UC-026, TR-F-064 | Medium |
| UIGAP-013 | **No-Show Override Modal Wireframe** — ADMIN-024 description updated. Wireframe for modal and resulting audit log entry display on ADMIN-007 needed. | UC-018 alt 5a, TR-F-015 | Medium |
| UIGAP-014 | **Refund Override Dual-Amount Layout** — ADMIN-008 updated with side-by-side display. Wireframe for the calculated-vs-override layout needed. | UC-023 alt 3a, TR-F-029 | Medium |
| UIGAP-015 | **Unauthenticated Waitlist Branch Wireframe** — CUST-023 and FORM-008 reference conditional branch. Wireframe differentiating authenticated (learner selector) vs. unauthenticated (email capture) paths needed. | UC-016 step 5 | Medium |
| UIGAP-016 | **Processor Test Transaction Failure Copy** — OPER-004 includes diagnostic message. Per-scenario failure copy (invalid key, network error, insufficient permissions) to be written by copy team. | UC-031, TR-F-078 | Low |
| UIGAP-017 | **Loading State Wireframes** — DS-028/DS-029 exist. Placement and timing logic wireframes needed for: availability query (CUST-005), booking confirmation (CUST-008→CUST-009), report generation (ADMIN-018/019), bulk weather cancellation (ADMIN-009). | TR-NF-001, TR-NF-003 | High |
| UIGAP-018 | **Conflict Highlight on Scheduler Drag-and-Drop** — ADMIN-003 references DS-017 conflict badge. Visual treatment wireframe (red overlay on conflict cells, tooltip with conflict details, prevent-drop vs. warn-on-drop behaviour) needed. | UC-022, TR-F-003 | High |
| UIGAP-021 | **Idempotency / Duplicate Submission Prevention UI** — CUST-008 submit button disabled state during submission and "booking already exists" recovery message wireframe needed. | TR-F-005, TR-NF-017 | Medium |
| UIGAP-024 | **Rate-Limit Rejection UX** — No UI treatment for HTTP 429 yet designed. "Try again in X seconds" display needed. | TR-NF-025, TR-NF-026 | Low |
| UIGAP-025 | **Multi-Resort View in Operator App** — Layout and navigation pattern for operators managing multiple resorts (resort switcher, breadcrumb, consolidated vs. per-resort views) not yet designed. | UC-033, TR-F-072 | Low |

---

## 9. Deferred Assets

The following assets have been explicitly moved out of v1.0 scope. They must not be built for Alpha or Beta.

| Deferred ID | Original Asset | Reason for Deferral | Earliest Reconsideration |
|-------------|---------------|---------------------|--------------------------|
| DEFER-001 | INSTR-009 — Availability: Google Calendar Sync Setup | OQ-021: Google Calendar sync removed from v1.0 scope. OAuth connect flow, sync status display, error/reconnect for revoked tokens, and OAuth callback screen are all deferred. No Google OAuth credentials should be configured or exposed in v1.0. | v1.5 planning cycle |
| DEFER-002 | DS-067 (original Run 1 spec) — WaiverSignaturePad canvas | Superseded by DS-067 ThirdPartyESignEmbed per OQ-008. The custom canvas implementation must not be built. | Not applicable — replaced, not deferred |
| DEFER-003 | THEME-002 custom font (operator-uploaded web font) | White-label custom font selection deferred to v1.5 per the THEME-002 spec. Platform default font (Inter or similar) fixed for v1.0. | v1.5 planning cycle |
| DEFER-004 | Admin and operator dark mode | THEME-003 dark mode required for instructor PWA only. Dark mode for admin and operator apps deferred to v1.5. | v1.5 planning cycle |
| DEFER-005 | Self-service guest right-to-erasure endpoint | TR-F-121: no self-service erasure for guests in v1.0. Admin-initiated only via ADMIN-GDPR-001. | v1.5 or upon regulatory requirement |
| DEFER-006 | Native iOS / Android instructor app | No native app in v1.0. Instructor app is PWA only per OQ-003. | Post-GA pending adoption data |

---

*End of Slopebook UI/UX Asset List — Run 2*
