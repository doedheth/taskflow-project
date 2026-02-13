# Story 9.2: PLN Induk Webhook Integration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **admin**,
I want **to provide a secure Webhook endpoint for the Power Meter**,
so that **PLN metrics (BP, LBP, Total, VARH, PF) can be automatically recorded in real-time without manual input**.

## Acceptance Criteria

### AC1: Webhook Endpoint Implementation
**Given** a POST request from the field Power Meter
**When** it hits `POST /api/v2/energy/webhook/pln`
**Then** the system must:
  - Validate the request payload format.
  - Authenticate the request using a shared secret or API Key (configured in `.env`).
  - Map the payload to the `pln_metrics` table structure.
  - Save the data using `PLNMetricRepository`.

### AC2: Payload Validation & Error Handling
**Given** an incoming webhook request
**When** the payload is missing required fields (`bp`, `lbp`, `total`, `varh`, `power_factor`)
**Then** the system must return `400 Bad Request` with descriptive errors.
**And** if authentication fails, return `401 Unauthorized`.

### AC3: Data Transformation
**Given** raw data from the meter
**When** processing the webhook
**Then** the system must ensure:
  - Numeric values are stored as floats.
  - `recorded_at` uses the meter's timestamp (if provided) or defaults to current system time.
  - `power_factor` is validated to be between 0 and 1.

## Tasks / Subtasks

- [x] Task 1: API Route & Controller Setup (AC: 1)
  - [x] 1.1: Create `src/routes/v2/energy.ts` and register the webhook route
  - [x] 1.2: Create `src/controllers/EnergyController.ts` with `handlePLNWebhook` method
  - [x] 1.3: Update `src/index.ts` or main router to include energy routes
- [x] Task 2: Service Layer Implementation (AC: 1, 3)
  - [x] 2.1: Create `src/services/EnergyService.ts` to handle business logic
  - [x] 2.2: Implement shared secret authentication (check `X-Webhook-Token` header)
  - [x] 2.3: Integrate with `PLNMetricRepository` to persist data
- [x] Task 3: Input Validation (AC: 2)
  - [x] 3.1: Define validation rules using `express-validator`
  - [x] 3.2: Implement error response middleware for the endpoint
- [x] Task 4: Testing & Documentation (AC: All)
  - [x] 4.1: Create unit tests for `EnergyController`
  - [x] 4.2: Add Swagger documentation for the new endpoint

## Dev Notes

### Architecture Compliance
- **Pattern**: Follow Routes -> Controller -> Service -> Repository.
- **Security**: Use a shared secret stored in `PLN_WEBHOOK_SECRET` environment variable.
- **Payload Format (Expected)**:
  ```json
  {
    "bp": 125.5,
    "lbp": 450.2,
    "total": 575.7,
    "varh": 12.3,
    "power_factor": 0.92,
    "recorded_at": "2026-01-30T10:00:00Z"
  }
  ```

### Technical Requirements
- Webhook returns `201 Created` immediately upon successful validation and save.
- Authentication uses `X-Webhook-Token` header.

### Project Structure Notes
- Routes: `task-manager-server/src/routes/v2/energy.ts`
- Controller: `task-manager-server/src/controllers/EnergyController.ts`
- Service: `task-manager-server/src/services/EnergyService.ts`

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-9.2]
- [Source: _bmad-output/planning-artifacts/prd.md#FR20]
- [Previous Story: 9-1-database-schema-for-pln-metrics.md]

## Dev Agent Record

### Agent Model Used

gemini-3-flash[1m]

### Debug Log References

### Completion Notes List

- ✅ `EnergyController` and `EnergyService` implemented following the OOP pattern.
- ✅ Webhook endpoint `POST /api/v2/energy/webhook/pln` registered and secured with token validation.
- ✅ Input validation implemented using `express-validator`.
- ✅ Unit tests created in `tests/controllers/EnergyController.test.ts` and passed (3/3).
- ✅ Swagger documentation added to the route file.

### File List

- [task-manager-server/src/services/EnergyService.ts](task-manager-server/src/services/EnergyService.ts)
- [task-manager-server/src/controllers/EnergyController.ts](task-manager-server/src/controllers/EnergyController.ts)
- [task-manager-server/src/routes/v2/energy.ts](task-manager-server/src/routes/v2/energy.ts)
- [task-manager-server/src/index.ts](task-manager-server/src/index.ts)
- [task-manager-server/tests/controllers/EnergyController.test.ts](task-manager-server/tests/controllers/EnergyController.test.ts)
