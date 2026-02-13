# TaskFlow - Source Tree Analysis

**Generated:** 2026-02-05
**Scan Level:** Deep Scan (Manual Update)

---

## Project Root Structure

```
projectSAP/
├── .claude/                      # Claude Code settings
├── .cursor/                      # Cursor IDE settings
│   └── plans/                    # Legacy planning documents
├── _bmad/                        # BMad Method resources
│   ├── bmm/                      # Business Method Module
│   │   ├── agents/               # Agent configurations
│   │   ├── workflows/            # Workflow definitions
│   │   └── config.yaml           # Project configuration
│   └── core/                     # Core BMAD resources
├── _bmad-output/                 # Generated artifacts
│   ├── architecture.md           # System architecture (EXHAUSTIVE)
│   ├── data-models.md            # Database schema (EXHAUSTIVE)
│   ├── project-context.md        # AI agent rules
│   ├── index.md                  # Previous documentation index
│   ├── planning-artifacts/       # PRD, Architecture plans
│   └── implementation-artifacts/ # Story files, sprint status
├── docs/                         # Project documentation
│   ├── index.md                  # THIS INDEX
│   ├── project-overview.md       # Project overview
│   └── *.md                      # Other documentation
├── node_modules/                 # Root dependencies
├── task-manager-client/          # ★ FRONTEND (React)
├── task-manager-server/          # ★ BACKEND (Express)
├── package.json                  # Root package (monorepo scripts)
└── .cursorrules                  # Cursor AI rules
```

---

## Frontend Source Tree (task-manager-client/)

```
task-manager-client/
├── src/
│   ├── App.tsx                   # Main app component, routes
│   ├── main.tsx                  # Entry point, providers
│   ├── index.css                 # Global CSS, Tailwind, design tokens
│   ├── vite-env.d.ts             # Vite type declarations
│   │
│   ├── components/               # ★ Reusable UI Components
│   │   ├── Layout.tsx            # Main layout wrapper
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── Header.tsx            # Top header bar
│   │   ├── ThemeToggle.tsx       # Dark/Light mode toggle
│   │   ├── ChatBot.tsx           # AI chatbot component
│   │   ├── RichTextEditor.tsx    # Quill-based editor
│   │   ├── AIWritingAssistant.tsx # AI text enhancement
│   │   ├── AISuggestionPanel.tsx # Context suggestions
│   │   ├── SpellCheckInput.tsx   # Spell-checked input
│   │   ├── SpellCheckTextarea.tsx # Spell-checked textarea
│   │   ├── SmartWOButton.tsx     # Smart WO generation trigger
│   │   ├── SmartWOSuggestionPanel.tsx # Smart WO suggestions
│   │   ├── DuplicateWarningBanner.tsx # Duplicate detection banner
│   │   ├── CreateTicketModal.tsx # Ticket creation modal
│   │   ├── CreateEpicModal.tsx   # Epic creation modal
│   │   ├── CreateSprintModal.tsx # Sprint creation modal
│   │   ├── AssigneeMultiSelect.tsx # Multi-user selector
│   │   ├── AssigneeAvatars.tsx   # Avatar display
│   │   ├── NotificationDropdown.tsx # Notifications
│   │   ├── ImageLightbox.tsx     # Image viewer
│   │   ├── maintenance/          # Maintenance-specific
│   │   │   ├── index.ts
│   │   │   ├── AssetStatusBadge.tsx
│   │   │   ├── KPICard.tsx
│   │   │   ├── DowntimeTimer.tsx
│   │   │   └── ScheduleCheckBadge.tsx
│   │   └── Dashboard/            # Dashboard-specific
│   │       └── PriorityBadge.tsx # Priority indicator
│   │
│   ├── pages/                    # ★ Route-Level Pages
│   │   ├── Login.tsx             # Login page
│   │   ├── Register.tsx          # Registration page
│   │   ├── Profile.tsx           # User profile
│   │   ├── Tickets.tsx           # Ticket list
│   │   ├── TicketDetail.tsx      # Ticket detail
│   │   ├── KanbanBoard.tsx       # Kanban view
│   │   ├── Epics.tsx             # Epic list
│   │   ├── EpicDetail.tsx        # Epic detail
│   │   ├── Sprints.tsx           # Sprint list
│   │   ├── SprintBoard.tsx       # Sprint board
│   │   ├── Timeline.tsx          # Gantt view
│   │   ├── WorkOrders.tsx        # Work order list
│   │   ├── WorkOrderDetail.tsx   # Work order detail
│   │   ├── Assets.tsx            # Asset list
│   │   ├── AssetDetail.tsx       # Asset detail
│   │   ├── DowntimeTracker.tsx   # Downtime monitoring
│   │   ├── MaintenanceCalendar.tsx # PM calendar
│   │   ├── MaintenanceKPI.tsx    # Maintenance metrics
│   │   ├── ProductionSchedule.tsx # Production calendar
│   │   ├── ProductionDowntime.tsx # Quick downtime
│   │   ├── ProductionKPI.tsx     # Production metrics
│   │   ├── LegacyDashboard.tsx   # Old dashboard
│   │   ├── Users.tsx             # User management
│   │   ├── Departments.tsx       # Department setup
│   │   ├── ShiftSettings.tsx     # Shift config
│   │   ├── FailureCodes.tsx      # Failure codes
│   │   ├── DowntimeClassifications.tsx # Classifications
│   │   ├── TeamPerformance.tsx   # Team metrics
│   │   ├── UserPerformance.tsx   # Individual metrics
│   │   ├── AISettings.tsx        # AI configuration
│   │   │
│   │   └── Dashboard/            # ★ DASHBOARD SYSTEM (Epic 1-5)
│   │       ├── index.ts          # Exports
│   │       ├── DashboardLayout.tsx # Dashboard wrapper
│   │       ├── RoleDashboardRouter.tsx # Role-based routing
│   │       ├── SupervisorDashboard.tsx # Supervisor view
│   │       ├── MemberDashboard.tsx # Member view
│   │       ├── ManagerDashboard.tsx # Manager view
│   │       ├── AdminDashboard.tsx # Admin view
│   │       └── widgets/          # Dashboard widgets
│   │           ├── index.ts      # Widget exports
│   │           ├── WidgetCard.tsx # Base card component
│   │           ├── WidgetSkeleton.tsx # Loading state
│   │           ├── WidgetError.tsx # Error state
│   │           ├── MachineStatusWidget.tsx # Machine status
│   │           ├── TeamWorkloadWidget.tsx # Team workload
│   │           ├── YesterdaySummaryWidget.tsx # Yesterday summary
│   │           ├── MyDayWidget.tsx # Personal daily view
│   │           ├── AssignedWorkOrdersWidget.tsx # Assigned WOs
│   │           ├── PMReminderWidget.tsx # PM reminders
│   │           ├── PersonalWorkloadWidget.tsx # Personal workload
│   │           ├── KPISummaryWidget.tsx # KPI metrics
│   │           ├── TeamPerformanceWidget.tsx # Team performance
│   │           ├── AlertsWidget.tsx # Alerts display
│   │           ├── SystemHealthWidget.tsx # System health
│   │           ├── UserActivityWidget.tsx # User activity
│   │           ├── SettingsQuickAccessWidget.tsx # Quick settings
│   │           ├── PredictiveInsightsWidget.tsx # AI predictions
│   │           └── PredictionDetailModal.tsx # Prediction detail
│   │
│   ├── hooks/                    # ★ Custom Hooks
│   │   ├── useQueryConfig.ts     # React Query defaults
│   │   ├── useSupervisorDashboard.ts # Supervisor data
│   │   ├── useMemberDashboard.ts # Member data
│   │   ├── useManagerDashboard.ts # Manager data
│   │   ├── useAdminDashboard.ts  # Admin data
│   │   ├── useSpellCheck.ts      # Spell checking
│   │   ├── useTaskPrioritization.ts # AI prioritization
│   │   ├── useSmartWOGeneration.ts # Smart WO
│   │   ├── useDuplicateCheck.ts  # Duplicate detection
│   │   └── usePredictiveInsights.ts # AI predictions
│   │
│   ├── services/                 # ★ API Client Layer
│   │   ├── api.ts                # Main API service
│   │   └── api-v2.ts             # V2 API endpoints
│   │
│   ├── context/                  # React Context
│   │   ├── AuthContext.tsx       # Authentication state
│   │   ├── ThemeContext.tsx      # Theme state
│   │   └── MobileMenuContext.tsx # Mobile navigation
│   │
│   ├── providers/                # Query Provider
│   │   └── QueryProvider.tsx     # TanStack Query setup
│   │
│   ├── types/                    # TypeScript Interfaces
│   │   └── index.ts              # Type definitions
│   │
│   └── utils/                    # Utilities
│       └── dateUtils.ts          # Date helpers
│
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

---

## Backend Source Tree (task-manager-server/)

```
task-manager-server/
├── src/
│   ├── index.ts                  # ★ Entry point, Express setup
│   │
│   ├── routes/                   # ★ API Routes
│   │   ├── auth.ts               # Authentication routes
│   │   ├── comments.ts           # Comment routes
│   │   ├── departments.ts        # Department routes
│   │   ├── epics.ts              # Epic routes
│   │   ├── notifications.ts      # Notification routes
│   │   ├── quickActions.ts       # Quick action routes
│   │   ├── sprints.ts            # Sprint routes
│   │   ├── upload.ts             # File upload routes
│   │   ├── maintenance.ts        # Maintenance routes
│   │   ├── dashboard.ts          # Dashboard routes
│   │   └── v2/                   # ★ OOP-Refactored Routes
│   │       ├── tickets.ts        # Ticket routes (v2)
│   │       ├── workOrders.ts     # Work order routes (v2)
│   │       ├── assets.ts         # Asset routes (v2)
│   │       ├── downtime.ts       # Downtime routes (v2)
│   │       ├── reports.ts        # Report routes (v2)
│   │       ├── users.ts          # User routes (v2)
│   │       ├── ai.ts             # AI routes (v2)
│   │       ├── energy.ts         # Energy monitoring routes (v2)
│   │       ├── solar.ts          # Solar monitoring routes (v2)
│   │       └── publicSlideshow.ts # Public slideshow routes (v2)
│   │
│   ├── controllers/              # ★ Request Handlers
│   │   ├── index.ts              # Controller exports
│   │   ├── BaseController.ts     # Base controller class
│   │   ├── UserController.ts     # User operations
│   │   ├── TicketController.ts   # Ticket operations
│   │   ├── WorkOrderController.ts # Work order operations
│   │   ├── AssetController.ts    # Asset operations
│   │   ├── DowntimeController.ts # Downtime operations
│   │   ├── ReportController.ts   # Report operations
│   │   └── AIController.ts       # AI operations
│   │
│   ├── services/                 # ★ Business Logic
│   │   ├── index.ts              # Service exports
│   │   ├── BaseService.ts        # Base service class
│   │   ├── UserService.ts        # User logic
│   │   ├── TicketService.ts      # Ticket logic
│   │   ├── WorkOrderService.ts   # Work order logic
│   │   ├── AssetService.ts       # Asset logic
│   │   ├── DowntimeService.ts    # Downtime logic
│   │   ├── ReportService.ts      # Report logic
│   │   └── ai/                   # ★ AI Services
│   │       ├── index.ts          # AI exports
│   │       ├── AIService.ts      # Core AI service
│   │       ├── AIToolsService.ts # Tool definitions
│   │       ├── AISettingsService.ts # Settings management
│   │       ├── AITaskPrioritizer.ts # Priority suggestions
│   │       ├── SmartWOService.ts # Smart WO generation
│   │       ├── DuplicateDetector.ts # Duplicate detection
│   │       └── PredictiveMaintenanceService.ts # Predictions
│   │
│   ├── models/                   # ★ Data Access (Repositories)
│   │   ├── index.ts              # Model exports
│   │   ├── BaseRepository.ts     # Base repository class
│   │   ├── UserRepository.ts     # User data access
│   │   ├── TicketRepository.ts   # Ticket data access
│   │   ├── WorkOrderRepository.ts # Work order data access
│   │   ├── AssetRepository.ts    # Asset data access
│   │   ├── DowntimeRepository.ts # Downtime data access
│   │   └── ReportRepository.ts   # Report data access
│   │
│   ├── middleware/               # Express Middleware
│   │   └── auth.ts               # JWT authentication
│   │
│   ├── database/                 # ★ Database Layer
│   │   ├── db.ts                 # sql.js database instance
│   │   ├── setup.ts              # Database initialization
│   │   ├── setup.js              # JS version for scripts
│   │   ├── run-maintenance-migration.ts # Migration runner
│   │   └── migrations/           # Database migrations
│   │       ├── add_chat_memory.js
│   │       ├── add_maintenance_tables.js
│   │       ├── add_supervisor_role.js
│   │       ├── add_work_order_assignees.ts
│   │       ├── add_ai_usage_tracking.ts
│   │       ├── add_ai_predictions.ts # Predictive maintenance
│   │       ├── add_pln_metrics_table.ts # PLN metrics
│   │       ├── add_solar_tables.ts # Solar monitoring tables
│   │       └── ...               # Other migrations
│   │
│   ├── jobs/                     # ★ Background Jobs
│   │   └── PredictiveMaintenanceJob.ts # Daily prediction cron
│   │
│   └── types/                    # TypeScript Interfaces
│       ├── index.ts              # Type exports
│       ├── common.ts             # Common types
│       ├── express.d.ts          # Express augmentation
│       ├── user.ts               # User types
│       ├── ticket.ts             # Ticket types
│       ├── workOrder.ts          # Work order types
│       ├── asset.ts              # Asset types
│       ├── downtime.ts           # Downtime types
│       ├── report.ts             # Report types
│       └── ai.ts                 # AI types
│
├── data/                         # Database storage
│   └── taskmanager.db            # SQLite database file
├── uploads/                      # File uploads
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest configuration
├── eslint.config.js              # ESLint configuration
├── .prettierrc                   # Prettier configuration
└── package.json                  # Dependencies
```

---

## Critical Directories Summary

| Directory | Purpose | Part |
|-----------|---------|------|
| `src/pages/Dashboard/` | Role-based dashboard system | Client |
| `src/pages/Dashboard/widgets/` | Dashboard widget components | Client |
| `src/hooks/` | Custom React hooks (data fetching) | Client |
| `src/services/` | API client layer | Client |
| `src/routes/v2/` | OOP-refactored API routes | Server |
| `src/controllers/` | Request handlers | Server |
| `src/services/` | Business logic layer | Server |
| `src/services/ai/` | AI service implementations | Server |
| `src/models/` | Data access repositories | Server |
| `src/database/migrations/` | Database schema changes | Server |
| `src/jobs/` | Background cron jobs | Server |

---

## Entry Points

| Part | Entry Point | Description |
|------|-------------|-------------|
| Frontend | `src/main.tsx` | React app initialization |
| Backend | `src/index.ts` | Express server startup |

---

## Integration Points

| From | To | Connection |
|------|-----|------------|
| Client services | Server routes | HTTP `/api/*` via Vite proxy |
| Dashboard hooks | Dashboard endpoints | React Query with polling |
| AI hooks | AI endpoints | Axios POST requests |
| Energy hooks | Energy/Solar API | Real-time monitoring |
| Predictive Job | AI Service | Daily cron at 5 AM |

---

*Generated: 2026-01-01 | Quick Scan (Pattern-based)*
