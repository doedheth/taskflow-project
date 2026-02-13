# Story 9.1: Database Schema for PLN Metrics

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **admin**,
I want **to implement a robust database schema for PLN Induk metrics**,
so that **the system can store and analyze energy consumption, costs, and power quality in real-time**.

## Acceptance Criteria

### AC1: Database Schema Definition
**Given** the need to store PLN metrics
**When** the migration is executed
**Then** the table `pln_metrics` must be created with the following columns:
  - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
  - `bp`: REAL (Beban Puncak / Peak Load)
  - `lbp`: REAL (Luar Waktu Beban Puncak / Off-Peak Load)
  - `total`: REAL (Total kWh)
  - `varh`: REAL (Reactive Energy)
  - `power_factor`: REAL (Power Factor value)
  - `recorded_at`: DATETIME (Timestamp from meter)
  - `created_at`: DATETIME (System timestamp)

### AC2: Performance Optimization
**Given** high-frequency data from webhooks
**When** querying metrics for dashboards
**Then** appropriate indexes must exist on:
  - `recorded_at` (for time-series queries)
  - `power_factor` (for alert filtering)

### AC3: Implementation Patterns
**Given** the existing backend architecture
**When** implementing the schema
**Then** it must follow:
  - Migration script in `src/database/migrations/`
  - TypeScript types in `src/types/energy.ts`
  - Repository extending `BaseRepository` in `src/models/PLNMetricRepository.ts`

## Tasks / Subtasks

- [x] Task 1: Database Migration (AC: 1, 2)
  - [x] 1.1: Create migration file `src/database/migrations/add_pln_metrics_table.ts`
  - [x] 1.2: Define `pln_metrics` table with all required columns
  - [x] 1.3: Create indexes for `recorded_at` and `power_factor`
  - [x] 1.4: Run and verify migration on local SQLite
- [x] Task 2: Backend Core Implementation (AC: 3)
  - [x] 2.1: Define `PLNMetric` and `CreatePLNMetricDTO` interfaces in `src/types/energy.ts`
  - [x] 2.2: Create `PLNMetricRepository` extending `BaseRepository`
  - [x] 2.3: Implement `findLatest()`, `findInPeriod()`, and `getStats()` methods
  - [x] 2.4: Export singleton instance from `src/models/index.ts`
- [x] Task 3: Validation & Testing (AC: All)
  - [x] 3.1: Create unit tests for `PLNMetricRepository`
  - [x] 3.2: Verify data integrity after insertions
  - [x] 3.3: Ensure compliance with project coding standards

## Dev Notes

### Architecture Compliance
- **Database**: SQLite (sql.js). Use `snake_case` for all table and column names.
- **Backend**: Layered architecture (Repository -> Service -> Controller).
- **Naming**:
  - Table: `pln_metrics`
  - Repository: `PLNMetricRepository`
  - Types: `PLNMetric`, `CreatePLNMetricDTO`

### Technical Requirements
- Metrics will be pushed via webhook in subsequent stories (9.2).
- Data frequency: Real-time (potentially every 1-5 minutes).
- `power_factor` must be stored as a decimal (e.g., 0.85).

### Project Structure Notes
- Align with `task-manager-server/src/database/migrations/` pattern.
- Ensure `BaseRepository` methods are used for standard CRUD.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-9.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR20-FR24]
- [Source: _bmad-output/planning-artifacts/architecture.md#Backend-API-Decisions]

## Dev Agent Record

### Agent Model Used

gemini-3-flash[1m]

### Debug Log References

### Completion Notes List

- ✅ Database migration `add_pln_metrics_table.ts` created and executed successfully.
- ✅ Table `pln_metrics` created with indexes on `recorded_at` and `power_factor`.
- ✅ TypeScript types and interfaces defined in `src/types/energy.ts`.
- ✅ `PLNMetricRepository` implemented with methods for latest metric, period filtering, and stats aggregation.
- ✅ Unit tests created in `tests/models/PLNMetricRepository.test.ts` and passed (4/4).

### File List

- [task-manager-server/src/database/migrations/add_pln_metrics_table.ts](task-manager-server/src/database/migrations/add_pln_metrics_table.ts)
- [task-manager-server/src/types/energy.ts](task-manager-server/src/types/energy.ts)
- [task-manager-server/src/models/PLNMetricRepository.ts](task-manager-server/src/models/PLNMetricRepository.ts)
- [task-manager-server/src/models/index.ts](task-manager-server/src/models/index.ts)
- [task-manager-server/tests/models/PLNMetricRepository.test.ts](task-manager-server/tests/models/PLNMetricRepository.test.ts)
