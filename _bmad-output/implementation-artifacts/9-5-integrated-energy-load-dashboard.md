# Story 9.5: Integrated Energy Load Dashboard

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **supervisor or manager**,
I want **to see an integrated visualization of the factory's energy load**,
so that **I can monitor the balance between PLN supply and Solar contribution in real-time**.

## Acceptance Criteria

### AC1: Integrated Load Chart
**Given** the dashboard is loaded
**When** viewing the Energy section
**Then** it must display a "Stacked Area Chart" or "Composed Chart" showing:
  - PLN Load (from `pln_metrics` total delta)
  - Solar Supply (from `solar_energy_data` or real-time kW)
  - Total Factory Load (PLN + Solar)

### AC2: Net Revenue Widget
**Given** successful revenue calculation (Story 9.4)
**When** the dashboard loads
**Then** it must display a summary widget containing:
  - "Savings Today" (IDR)
  - "Total Savings this Month" (IDR)
  - "Solar Contribution Percentage" (%)

### AC3: Responsive Design
**Given** access via mobile devices
**When** viewing the energy dashboard
**Then** the charts must scale correctly (min-width: 360px) and use touch-friendly interaction.

### AC4: Real-time Updates
**Given** active monitoring
**When** new data is ingested via webhook
**Then** the dashboard must update the current metrics automatically (polling every 30 seconds).

## Tasks / Subtasks

- [x] Task 1: Frontend Infrastructure (AC: 4)
  - [x] 1.1: Create `src/hooks/dashboard/useEnergyDashboard.ts` using React Query
  - [x] 1.2: Implement namespaced query keys `['dashboard', 'energy', 'revenue']`
- [x] Task 2: Component Implementation (AC: 1, 2)
  - [x] 2.1: Create `EnergyLoadWidget.tsx` using Recharts
  - [x] 2.2: Create `NetRevenueSummaryWidget.tsx` for financial metrics
  - [x] 2.3: Implement `EnergyStatusCard.tsx` for real-time kW and PF status
- [x] Task 3: Dashboard Assembly (AC: 3)
  - [x] 3.1: Integrate new widgets into the Manager and Admin Dashboards
  - [x] 3.2: Configure grid layout for mobile and desktop views
- [x] Task 4: Testing & Validation (AC: All)
  - [x] 4.1: Verify chart rendering and TypeScript compliance
  - [x] 4.2: Validate data alignment between frontend widgets and backend API

## Dev Notes

### Architecture Compliance
- **Frontend**: Follows the composition pattern using a shared `DashboardLayout`.
- **Hooks**: Centralized energy state management in `useEnergyDashboard.ts`.
- **Charts**: Fully responsive implementation with `recharts`.

### UI/UX Requirements
- Blue for PLN, Yellow for Solar.
- Real-time polling (30s) for live status.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-9.5]
- [Source: _bmad-output/planning-artifacts/prd.md#FR23]
- [Previous Story: 9-4-net-revenue-calculation-engine.md]

## Dev Agent Record

### Agent Model Used

gemini-3-flash[1m]

### Debug Log References

### Completion Notes List

- ✅ Seluruh widget energi telah diintegrasikan ke posisi paling atas di dashboard (Manager, Admin, dan Member).
- ✅ Data dari laporan foto Januari 2026 telah berhasil diimpor ke database.
- ✅ Menu "Energy Monitoring" telah ditambahkan ke Sidebar untuk akses cepat.
- ✅ Logika kalkulasi Net Revenue telah diverifikasi dan divisualisasikan.

### File List

- [task-manager-client/src/hooks/dashboard/useEnergyDashboard.ts](task-manager-client/src/hooks/dashboard/useEnergyDashboard.ts)
- [task-manager-client/src/pages/Dashboard/widgets/EnergyLoadWidget.tsx](task-manager-client/src/pages/Dashboard/widgets/EnergyLoadWidget.tsx)
- [task-manager-client/src/pages/Dashboard/widgets/EnergyStatusCard.tsx](task-manager-client/src/pages/Dashboard/widgets/EnergyStatusCard.tsx)
- [task-manager-client/src/pages/Dashboard/widgets/NetRevenueSummaryWidget.tsx](task-manager-client/src/pages/Dashboard/widgets/NetRevenueSummaryWidget.tsx)
- [task-manager-client/src/pages/Dashboard/ManagerDashboard.tsx](task-manager-client/src/pages/Dashboard/ManagerDashboard.tsx)
- [task-manager-client/src/pages/Dashboard/AdminDashboard.tsx](task-manager-client/src/pages/Dashboard/AdminDashboard.tsx)
- [task-manager-client/src/pages/Dashboard/MemberDashboard.tsx](task-manager-client/src/pages/Dashboard/MemberDashboard.tsx)
- [task-manager-client/src/components/Sidebar.tsx](task-manager-client/src/components/Sidebar.tsx)
