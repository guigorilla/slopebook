# Slopebook — API Design Amendments

**Document Status:** Draft
**Last Updated:** 2026-03-25
**Author:** Resolution pass (blocker remediation)
**Version:** 0.1 — addendum to `design-docs/api-design.md`

This document defines API endpoint groups that are entirely absent from `design-docs/api-design.md` but are required by blockers and HIGH-severity critique issues. It does not replace `api-design.md`; it supplements it. Each section references the critique ID that motivates it and the corresponding entity in `data-model-proposed.md`.

---

## 1. Slot Reservation Endpoints

**Motivating issue:** CRT-H-001 (BLOCKER) — soft-hold mechanism has no API surface.
**Corresponding entity:** `SlotReservation` (`data-model-proposed.md`)
**Service owner:** Booking Service

---

### POST /api/v1/slot-reservations

Create a soft hold on an instructor time slot for the duration of checkout. Called when the guest confirms a slot selection (UC-003 step 5).

**Auth:** Required (authenticated user or anonymous session token for guest checkout).

**Request body:**
```json
{
  "tenantId": "uuid",
  "instructorId": "uuid",
  "lessonTypeId": "uuid",
  "startAt": "ISO 8601 timestamp",
  "endAt": "ISO 8601 timestamp",
  "sessionToken": "string"
}
```

**Response 201 Created:**
```json
{
  "id": "uuid",
  "expiresAt": "ISO 8601 timestamp",
  "status": "active"
}
```

**Response 409 Conflict:** Returned when an active `SlotReservation` already exists for the requested `(instructorId, startAt, endAt)` window or the slot has a confirmed booking. Body: `{ "error": "slot_unavailable" }`.

**Notes:**
- The `id` (reservation ID) MUST be included in the subsequent `POST /api/v1/bookings` request as `reservationId`. The booking engine validates it before committing.
- TTL is enforced server-side (TR-F-002, TR-NF-018): no less than 10 minutes, no more than 30 minutes, configurable per OQ-011.
- A Redis key expiring at `expiresAt` is the recommended TTL enforcement mechanism in addition to the database record.

---

### DELETE /api/v1/slot-reservations/:id

Release a soft hold explicitly (guest abandons checkout or navigates away).

**Auth:** Required. The caller must be the owner of the session token associated with the reservation, or a platform admin.

**Path param:** `id` — `SlotReservation.id`

**Response 204 No Content:** Reservation released.

**Response 404 Not Found:** Reservation does not exist or is already expired/released.

**Notes:**
- Sets `SlotReservation.status = released`.
- The booking engine also calls this endpoint internally on booking confirmation (slot status transitions to `converted`).

---

## 2. Cancellation Policy Endpoints

**Motivating issue:** CRT-H-002 (BLOCKER) — `CancellationPolicy` entity has no API surface.
**Corresponding entity:** `CancellationPolicy` (`data-model-proposed.md`)
**Service owner:** Admin Service / Operator Service

---

### GET /api/v1/admin/cancellation-policies

List all cancellation policies for the authenticated admin's tenant.

**Auth:** Required. Role: `school_admin`, `operator`.

**Response 200 OK:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "string",
      "isDefault": true,
      "refundRules": [
        { "hoursBeforeLesson": 48, "refundPercent": 100 },
        { "hoursBeforeLesson": 24, "refundPercent": 50 },
        { "hoursBeforeLesson": 0,  "refundPercent": 0 }
      ],
      "noShowPolicy": "no_refund",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ]
}
```

---

### POST /api/v1/admin/cancellation-policies

Create a new cancellation policy for the tenant.

**Auth:** Required. Role: `school_admin`, `operator`.

**Request body:**
```json
{
  "name": "string",
  "isDefault": false,
  "refundRules": [
    { "hoursBeforeLesson": 48, "refundPercent": 100 },
    { "hoursBeforeLesson": 24, "refundPercent": 50 },
    { "hoursBeforeLesson": 0,  "refundPercent": 0 }
  ],
  "noShowPolicy": "no_refund | partial | full"
}
```

**Response 201 Created:** Full policy object.

**Notes:**
- If `isDefault: true`, the previous default policy for the tenant is automatically set to `isDefault: false` (enforced by the partial UNIQUE constraint described in `data-model-proposed.md`).
- Every new tenant is seeded with a platform default `CancellationPolicy` at onboarding time (addresses OQ-014: no policy gap window). The platform default is: full refund > 48 hours; 50% refund 24–48 hours; no refund < 24 hours; no-show = no refund.

---

### GET /api/v1/admin/cancellation-policies/:id

Fetch a single policy by ID.

**Auth:** Required. Role: `school_admin`, `operator`. Tenant-scoped.

**Response 200 OK:** Full policy object.

---

### PATCH /api/v1/admin/cancellation-policies/:id

Update an existing policy. All fields are optional; unset fields are unchanged.

**Auth:** Required. Role: `school_admin`, `operator`.

**Request body:** Same shape as POST, all fields optional.

**Response 200 OK:** Updated policy object.

**Notes:**
- Changing a policy does NOT retroactively alter `Booking.cancellationPolicyId` on existing bookings (those carry a snapshot FK at booking time per `data-model-proposed.md`).

---

### DELETE /api/v1/admin/cancellation-policies/:id

Delete a policy. Blocked if any active booking references this policy via `Booking.cancellationPolicyId`.

**Auth:** Required. Role: `school_admin`, `operator`.

**Response 204 No Content.**

**Response 409 Conflict:** `{ "error": "policy_in_use", "activeBookingCount": N }`

---

## 3. Booking Endpoint Amendments

**Motivating issues:** CRT-H-003 (BLOCKER — guest checkout FK chain), CRT-H-008 (HIGH — missing assignment/reassignment/bulk-cancel endpoints).
**Service owner:** Booking Service / Admin Service

---

### POST /api/v1/bookings — guest checkout payload amendment

The existing `POST /api/v1/bookings` request payload must accept two mutually exclusive learner identification modes. This is an amendment to the existing endpoint, not a new endpoint.

**Amended request body (authenticated booking — existing behaviour):**
```json
{
  "reservationId": "uuid",
  "lessonTypeId": "uuid",
  "startAt": "ISO 8601 timestamp",
  "endAt": "ISO 8601 timestamp",
  "learnerId": "uuid",
  "skillLevelAtBooking": "beginner | intermediate | advanced"
}
```

**Amended request body (guest checkout — new behaviour, CRT-H-003):**
```json
{
  "reservationId": "uuid",
  "lessonTypeId": "uuid",
  "startAt": "ISO 8601 timestamp",
  "endAt": "ISO 8601 timestamp",
  "guest": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string (optional)"
  },
  "skillLevelAtBooking": "beginner | intermediate | advanced"
}
```

**Validation:** The booking engine MUST reject requests that provide both `learnerId` and `guest`, and MUST reject requests that provide neither. When `guest` is provided, a `GuestCheckout` record is created and `Booking.guestCheckoutId` is set; `Booking.learnerId` is null.

---

### PATCH /api/v1/bookings/:id/assign

Assign an instructor to an unassigned or admin-reassigned booking.

**Auth:** Required. Role: `school_admin`.

**Motivating issue:** CRT-H-008 / GAP-006, UC-022.

**Request body:**
```json
{ "instructorId": "uuid" }
```

**Response 200 OK:** Updated booking object.

**Response 409 Conflict:** Instructor has an overlapping confirmed booking or active slot reservation.

---

### PATCH /api/v1/bookings/:id/reassign

Reassign a booking from one instructor to another.

**Auth:** Required. Role: `school_admin`.

**Motivating issue:** CRT-H-008 / GAP-008, UC-025.

**Request body:**
```json
{
  "newInstructorId": "uuid",
  "reason": "string (optional)"
}
```

**Response 200 OK:** Updated booking object.

**Notes:** The `reason` is written to a system `BookingNote` (`authorRole: admin`, `isSharedWithGuest: false`) on the booking for audit purposes.

---

### POST /api/v1/bookings/bulk-cancel

Cancel multiple bookings at once (e.g., weather closure).

**Auth:** Required. Role: `school_admin`.

**Motivating issue:** CRT-H-008 / GAP-007, UC-024.

**Request body:**
```json
{
  "date": "YYYY-MM-DD",
  "lessonTypeIds": ["uuid"],
  "reason": "string",
  "notifyGuests": true
}
```

**Response 200 OK:**
```json
{
  "cancelledCount": 12,
  "notificationQueuedCount": 12
}
```

**Notes:**
- All matched bookings in `confirmed` or `in_progress` status on the given date are transitioned to `cancelled`.
- If `notifyGuests: true`, a NOTIF-005 (cancellation) notification is queued for each affected booking.
- Refunds are applied according to each booking's `Booking.cancellationPolicyId` snapshot (no-refund window check is skipped for weather cancellations — a full refund is issued regardless, per standard policy for operator-initiated cancellations).

---

## 4. Operator Payment Processor Endpoints

**Motivating issues:** CRT-H-008 / GAP-014 (processor test transaction), CRT-H-007 (processor switch card invalidation safeguard).
**Service owner:** Operator Service

---

### POST /api/v1/operator/payment-processor/test

Run a test transaction against the currently configured payment processor for the tenant.

**Auth:** Required. Role: `operator`.

**Request body:** Empty (uses the tenant's stored `paymentCredentials`).

**Response 200 OK:**
```json
{
  "success": true,
  "processorResponse": "string",
  "testedAt": "ISO 8601 timestamp"
}
```

**Response 422 Unprocessable Entity:** `{ "success": false, "error": "string" }` — credentials are invalid or the processor returned an error.

---

### PATCH /api/v1/operator/payment-processor

Update the tenant's payment processor configuration. Includes a mandatory acknowledgment gate for stored-card invalidation.

**Auth:** Required. Role: `operator`.

**Motivating issue:** CRT-H-007 — processor switch must warn about stored card invalidation.

**Request body:**
```json
{
  "paymentProcessor": "stripe | shift4",
  "paymentCredentials": { "...processor-specific fields..." },
  "acknowledgeStoredCardsWillBeInvalidated": true
}
```

**Validation:** If any `PaymentMethod` records exist for this tenant with `isValid = true`, the request MUST be rejected unless `acknowledgeStoredCardsWillBeInvalidated: true` is explicitly provided.

**Response 200 OK:** Updated tenant processor configuration (credentials redacted).

**Side effects:**
- All `PaymentMethod` records for the tenant are set to `isValid = false`.
- A NOTIF-* (stored card invalidation) notification is queued for all affected households.

---

## 5. White-Label Config Endpoints

**Motivating issues:** CRT-H-008 / GAP-010, UC-032 (v1.0 GA feature with no API surface).
**Corresponding entity:** `WhiteLabelConfig` (`data-model-proposed.md`)
**Service owner:** Operator Service

---

### GET /api/v1/operator/white-label

Fetch the white-label configuration for the authenticated operator's tenant.

**Auth:** Required. Role: `operator`.

**Response 200 OK:**
```json
{
  "customDomain": "lessons.alpineresort.com",
  "domainVerified": false,
  "logoUrl": "string | null",
  "faviconUrl": "string | null",
  "primaryColor": "#1A3C5E",
  "secondaryColor": "#F5A623",
  "embedCodeToken": "string"
}
```

---

### PUT /api/v1/operator/white-label

Create or update the white-label configuration (upsert).

**Auth:** Required. Role: `operator`. Requires Enterprise subscription tier.

**Request body:**
```json
{
  "customDomain": "string | null",
  "logoUrl": "string | null",
  "faviconUrl": "string | null",
  "primaryColor": "string (hex) | null",
  "secondaryColor": "string (hex) | null"
}
```

**Response 200 OK:** Full white-label config object.

**Notes:**
- Setting `customDomain` initiates DNS verification polling. `domainVerified` starts as `false` and transitions to `true` once the CNAME record is detected.
- The `embedCodeToken` is auto-generated on first creation and is immutable (rotate via a separate endpoint if needed).

---

### GET /api/v1/operator/white-label/dns-status

Poll the current DNS verification status for the configured custom domain.

**Auth:** Required. Role: `operator`.

**Response 200 OK:**
```json
{
  "customDomain": "string",
  "domainVerified": false,
  "lastCheckedAt": "ISO 8601 timestamp",
  "expectedCname": "slopebook-verify.example.com"
}
```

---

## 6. Summary of New Endpoint Groups

| Group | Count | Blocker/HIGH | Critique Ref |
|---|---|---|---|
| Slot Reservation | 2 | BLOCKER | CRT-H-001 |
| Cancellation Policy CRUD | 5 | BLOCKER | CRT-H-002 |
| Booking guest checkout payload | Amendment | BLOCKER | CRT-H-003 |
| Booking assign / reassign / bulk-cancel | 3 | HIGH | CRT-H-008 |
| Processor test + switch safeguard | 2 | HIGH | CRT-H-007, CRT-H-008 |
| White-label config | 3 | HIGH | CRT-H-008 |

These 16 endpoint definitions (including the booking payload amendment) address the 16 missing endpoint groups flagged in `consistency-report.md §4`. OAuth token flow endpoints (for Google Calendar sync, OQ-021) are deferred pending resolution of OQ-021.
