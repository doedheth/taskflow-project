# Story 9.3: Real-time Power Factor Monitoring & Alert

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **admin or manager**,
I want **to receive automatic alerts when the Power Factor (PF) drops below 0.85**,
so that **I can take corrective action immediately and avoid reactive power penalties from PLN**.

## Acceptance Criteria

### AC1: Power Factor Threshold Detection
**Given** an incoming PLN metric via webhook
**When** the `power_factor` value is less than `0.85`
**Then** the system must trigger an internal alert.

### AC2: Notification Generation
**Given** a detected low Power Factor event
**When** the alert is triggered
**Then** the system must create a record in the `notifications` table for:
  - All users with `admin` role.
  - All users with `manager` role.
**And** the notification message should include:
  - Title: "⚠️ Peringatan: Power Factor Rendah"
  - Message: "Power Factor PLN terdeteksi di angka [nilai], di bawah ambang batas 0.85. Segera lakukan pengecekan capacitor bank."

### AC3: Real-time Execution
**Given** a successful webhook data ingestion (Story 9.2)
**When** the data is saved to the database
**Then** the PF check must execute immediately as part of the post-processing logic.

## Tasks / Subtasks

- [x] Task 1: Alert Logic implementation (AC: 1)
  - [x] 1.1: Add `checkPowerFactorAlert` method to `src/services/EnergyService.ts`
  - [x] 1.2: Implement logic to compare PF against the constant threshold (0.85)
- [x] Task 2: Notification Integration (AC: 2)
  - [x] 2.1: Implement logic to find all Admin and Manager users
  - [x] 2.2: Use the existing notification system to create alerts for identified users
  - [x] 2.3: Ensure duplicate alerts are not sent within a short timeframe (1 hour cooldown)
- [x] Task 3: Trigger setup (AC: 3)
  - [x] 3.1: Update `processPLNWebhook` in `EnergyService.ts` to call the alert check after successful persistence
- [x] Task 4: Testing & Validation (AC: All)
  - [x] 4.1: Create unit tests for the PF alert logic
  - [x] 4.2: Verify notifications are correctly created in the database when PF < 0.85
  - [x] 4.3: Ensure no notifications are created when PF >= 0.85

## Dev Notes

### Architecture Compliance
- **Pattern**: Enhanced `EnergyService.ts` to include alert processing.
- **Notification**: Created `NotificationRepository` and `NotificationService` for clean notification management.
- **Cooldown**: Implemented in `NotificationRepository.existsRecent` and `NotificationService.notify`.

### Technical Requirements
- Threshold `0.85` is defined as a private constant in `EnergyService`.
- Cooldown period set to 60 minutes.

### Project Structure Notes
- Repository: `task-manager-server/src/models/NotificationRepository.ts`
- Service: `task-manager-server/src/services/NotificationService.ts`

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-9.3]
- [Source: _bmad-output/planning-artifacts/prd.md#FR24]
- [Previous Story: 9-2-pln-induk-webhook-integration.md]

## Dev Agent Record

### Agent Model Used

gemini-3-flash[1m]

### Debug Log References

### Completion Notes List

- ✅ `NotificationRepository` and `NotificationService` implemented for centralized alert management.
- ✅ `EnergyService` updated with `checkPowerFactorAlert` logic and integrated into webhook processing.
- ✅ Cooldown logic implemented to prevent alert flooding (1-hour window).
- ✅ Unit tests created in `tests/services/EnergyService.test.ts` covering PF thresholds and token validation.

### File List

- [task-manager-server/src/models/NotificationRepository.ts](task-manager-server/src/models/NotificationRepository.ts)
- [task-manager-server/src/services/NotificationService.ts](task-manager-server/src/services/NotificationService.ts)
- [task-manager-server/src/services/EnergyService.ts](task-manager-server/src/services/EnergyService.ts)
- [task-manager-server/src/models/index.ts](task-manager-server/src/models/index.ts)
- [task-manager-server/tests/services/EnergyService.test.ts](task-manager-server/tests/services/EnergyService.test.ts)
