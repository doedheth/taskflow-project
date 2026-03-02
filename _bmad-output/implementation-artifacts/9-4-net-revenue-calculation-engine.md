# Story 9.4: Net Revenue (Savings) Calculation Engine

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **admin or finance manager**,
I want **an automated calculation engine to compute Net Revenue**,
so that **I can track daily energy cost savings provided by the Solar Panel system compared to PLN costs**.

## Acceptance Criteria

### AC1: PLN Cost Calculation (WBP/LWBP)
**Given** recorded PLN metrics (BP and LBP)
**When** the calculation engine runs
**Then** it must compute the daily cost based on configurable rates:
  - `Cost = (BP * WBP_Rate) + (LBP * LWBP_Rate)`
  - Default rates (if not configured): WBP = 1.5 * Base Rate, LWBP = 1.0 * Base Rate.

### AC2: Solar Savings Calculation
**Given** recorded Solar Yield data
**When** computing savings
**Then** it must use the formula:
  - `Savings = Solar_Yield_kWh * Price_Per_kWh`
  - `Price_Per_kWh` must be retrieved from `solar_config`.

### AC3: Net Revenue Computation
**Given** PLN Costs and Solar Savings
**When** requested for a specific date range
**Then** the engine must return:
  - Total PLN Cost (IDR)
  - Total Solar Savings (IDR)
  - Net Revenue (Solar Savings - Maintenance/Operational costs if any, currently defaults to Solar Savings)
  - Savings Percentage vs Total Energy Cost.

### AC4: API Exposure
**Given** the calculation engine is implemented
**When** calling `GET /api/v2/energy/revenue?startDate=...&endDate=...`
**Then** it must return a JSON response with the aggregated financial metrics.

## Tasks / Subtasks

- [ ] Task 1: Configuration Enhancement (AC: 1, 2)
  - [ ] 1.1: Ensure `solar_config` has fields for `pln_base_rate`, `wbp_multiplier`, and `lwbp_multiplier`
  - [ ] 1.2: Add methods to `SolarRepository` to fetch these financial configurations
- [ ] Task 2: Calculation Engine Logic (AC: 1, 2, 3)
  - [ ] 2.1: Implement `calculateRevenue` method in `EnergyService.ts`
  - [ ] 2.2: Implement logic to aggregate PLN metrics (BP/LBP delta) for a given period
  - [ ] 2.3: Implement logic to aggregate Solar production for the same period
- [ ] Task 3: API Endpoint implementation (AC: 4)
  - [ ] 3.1: Add `getRevenueStats` method to `EnergyController.ts`
  - [ ] 3.2: Register route `GET /api/v2/energy/revenue` in `src/routes/v2/energy.ts`
- [ ] Task 4: Testing & Validation (AC: All)
  - [ ] 4.1: Create unit tests for the revenue calculation formulas
  - [ ] 4.2: Validate calculations with sample data (e.g., 100 kWh BP @ 2000, 200 kWh LWBP @ 1500)

## Dev Notes

### Architecture Compliance
- **Logic Location**: `EnergyService.ts` should be the primary owner of the financial formulas.
- **Data Source**: Use both `PLNMetricRepository` and `SolarRepository` (or the existing solar data tables).

### Financial Formulas (Default)
- **PLN Base Rate**: Rp 1.444,70 / kWh (Standard Industrial B3/TM)
- **WBP (Waktu Beban Puncak)**: 18:00 - 22:00 (Usually 1.5x multiplier)
- **LWBP (Luar Waktu Beban Puncak)**: 22:00 - 18:00 (1.0x multiplier)

### Project Structure Notes
- The engine must handle gaps in data gracefully (e.g., if a day is missing, interpolate or note as incomplete).

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-9.4]
- [Source: _bmad-output/planning-artifacts/prd.md#FR22-FR23]

## Dev Agent Record

### Agent Model Used

gemini-3-flash[1m]

### Debug Log References

### Completion Notes List

### File List
