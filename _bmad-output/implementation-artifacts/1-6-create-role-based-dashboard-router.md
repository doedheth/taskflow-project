# Story 1.6: Create Role-Based Dashboard Router

Status: done

## Story

As a **user**,
I want **the dashboard to automatically show content appropriate for my role**,
So that **I see relevant information immediately after login without manual selection**.

## Acceptance Criteria

1. **Given** user with role "admin" navigates to /dashboard
   **When** Dashboard index component renders
   **Then** AdminDashboard component is rendered

2. **Given** user with role "manager" navigates to /dashboard
   **When** Dashboard index component renders
   **Then** ManagerDashboard component is rendered

3. **Given** user with role "supervisor" navigates to /dashboard
   **When** Dashboard index component renders
   **Then** SupervisorDashboard component is rendered

4. **Given** user with role "member" navigates to /dashboard
   **When** Dashboard index component renders
   **Then** MemberDashboard component is rendered

## Tasks / Subtasks

- [x] Task 1: Create role-specific dashboard placeholders (AC: #1, #2, #3, #4)
  - [x] 1.1: Create AdminDashboard.tsx with placeholder widgets
  - [x] 1.2: Create ManagerDashboard.tsx with placeholder widgets
  - [x] 1.3: Create SupervisorDashboard.tsx with placeholder widgets
  - [x] 1.4: Create MemberDashboard.tsx with placeholder widgets

- [x] Task 2: Create RoleDashboardRouter component (AC: #1, #2, #3, #4)
  - [x] 2.1: Create RoleDashboardRouter.tsx
  - [x] 2.2: Add role-based switch statement
  - [x] 2.3: Default to MemberDashboard for unknown roles

- [x] Task 3: Update module exports
  - [x] 3.1: Export all role dashboards from index.ts
  - [x] 3.2: Export RoleDashboardRouter as default
  - [x] 3.3: Verify TypeScript compilation

## Dev Notes

### Architecture Structure

```
src/pages/Dashboard/
├── DashboardLayout.tsx       # Shared layout wrapper
├── AdminDashboard.tsx        # Admin: System health, User activity
├── ManagerDashboard.tsx      # Manager: KPI, Team performance, Alerts
├── SupervisorDashboard.tsx   # Supervisor: Machine status, Team workload
├── MemberDashboard.tsx       # Member: My Day, Work Orders, PM Reminders
├── RoleDashboardRouter.tsx   # Role-based router
├── index.ts                  # Module exports
└── widgets/                  # Reusable widget components
```

### Role Mapping

| Role | Dashboard | Key Widgets |
|------|-----------|-------------|
| admin | AdminDashboard | System Health, User Activity, Quick Settings |
| manager | ManagerDashboard | KPI Summary, Team Performance, Alerts |
| supervisor | SupervisorDashboard | Machine Status, Team Workload, Yesterday Summary |
| member | MemberDashboard | My Day, Work Orders, PM Reminders, Workload |

### Usage

```tsx
// In App.tsx or routes
import RoleDashboard from '@/pages/Dashboard';

// Route
<Route path="/" element={<RoleDashboard />} />
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Dashboard Component Structure]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]

## Dev Agent Record

### Agent Model Used

gemini-claude-opus-4-5-thinking

### Debug Log References

N/A

### Completion Notes List

- Created 4 role-specific dashboard components with placeholder widgets
- Each dashboard uses DashboardLayout and WidgetCard components
- RoleDashboardRouter reads user role from AuthContext
- Defaults to MemberDashboard for unknown/undefined roles
- All components compile without TypeScript errors
- Module exports updated with default export for easy route usage

### File List

**Created:**
- `task-manager-client/src/pages/Dashboard/AdminDashboard.tsx`
- `task-manager-client/src/pages/Dashboard/ManagerDashboard.tsx`
- `task-manager-client/src/pages/Dashboard/SupervisorDashboard.tsx`
- `task-manager-client/src/pages/Dashboard/MemberDashboard.tsx`
- `task-manager-client/src/pages/Dashboard/RoleDashboardRouter.tsx`

**Modified:**
- `task-manager-client/src/pages/Dashboard/index.ts` - Added all exports

