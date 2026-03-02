---
project_name: 'projectSAP'
user_name: 'Dedy'
date: '2026-01-10'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'naming_conventions', 'backend_architecture', 'design_tokens', 'react_query', 'responsive', 'testing', 'code_quality', 'anti_patterns', 'security', 'file_organization', 'mobile_app']
status: 'complete'
rule_count: 85
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Frontend (Port 3000):**
- React 18.3.1 + TypeScript 5.6.3
- Vite 5.4.10 (build tool)
- Tailwind CSS 3.4.14 (styling)
- React Router DOM 6.28.0 (routing)
- @tanstack/react-query v5.x (server state - NEW)
- Axios 1.7.7 (HTTP client)
- date-fns 3.6.0 (date utilities)
- Recharts 3.6.0 (charts)
- lucide-react 0.454.0 (icons)

**Backend (Port 5000):**
- Node.js + Express 4.21.1
- TypeScript 5.9.3
- sql.js 1.11.0 (SQLite in-memory)
- jsonwebtoken 9.0.2 (JWT auth)
- bcryptjs 2.4.3 (password hashing)
- Jest 29.7.0 (testing)

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict mode ENABLED** - All code must pass strict TypeScript checks
- **Path aliases**: Use `@/*` for `src/*` imports (frontend)
- **No unused variables/parameters** - `noUnusedLocals: true`, `noUnusedParameters: true`
- **No implicit any** - All types must be explicit
- **Use async/await** - Prefer over Promise chains

### Framework-Specific Rules (React)

- **Functional components only** - No class components
- **Custom hooks** - Prefix with `use`, e.g., `useDashboardMyDay`
- **React Query for server state** - Use `useQuery` with proper key namespacing
- **Context for global state** - AuthContext, ThemeContext (existing)
- **No prop drilling** - Use Context or hooks for deep data passing

### Naming Conventions (CRITICAL)

| Element | Convention | Example |
|---------|------------|---------|
| React Components | PascalCase | `MachineStatusWidget.tsx` |
| Hooks | camelCase with `use` prefix | `useDashboardKPI.ts` |
| Variables/Functions | camelCase | `userId`, `getWorkOrder()` |
| TypeScript Interfaces | PascalCase | `interface WorkOrder {}` |
| Database Tables | snake_case, plural | `work_orders`, `downtime_logs` |
| Database Columns | snake_case | `user_id`, `created_at` |
| API Endpoints | kebab-case, plural | `/api/work-orders` |
| CSS Classes | Tailwind utilities | `bg-surface text-primary` |
| UI Labels | **Indonesian** | "Tambah Tugas", "Simpan" |
| Code/Comments | **English** | `// Fetch work orders` |

### Backend Architecture Rules (OOP Layered)

```
Routes → Controllers → Services → Repositories → Database
```

- **Routes**: HTTP handling, validation only
- **Controllers**: Request/response mapping, no business logic
- **Services**: All business logic, can call multiple repositories
- **Repositories**: Data access only, single entity focus

### Design Token Rules (NEW for Enhancement)

- **NEVER hardcode colors** - Use semantic tokens
- **Token format**: `--color-{category}-{variant}`
- **Use Tailwind classes**: `bg-surface`, `text-text-primary`
- **Light/Dark support**: Tokens auto-switch via `.dark` class

**Token Categories:**
```css
--color-surface          /* Main background */
--color-surface-elevated /* Cards, modals */
--color-text-primary     /* Main text */
--color-text-secondary   /* Muted text */
--color-border           /* Default borders */
--color-status-success   /* Green states */
--color-status-warning   /* Yellow states */
--color-status-error     /* Red states */
```

### React Query Rules (NEW for Enhancement)

- **Query keys**: Array format with namespace `['dashboard', 'feature', params]`
- **Polling**: Use `refetchInterval: 30000` for dashboard widgets
- **Stale time**: 10 seconds default
- **Error handling**: Let React Query handle retries (2x default)

### Responsive Design Rules

- **Mobile-first approach** - Base styles for mobile
- **Tailwind breakpoints**: `md:` (640px), `lg:` (1024px)
- **Touch targets**: Minimum 44px for interactive elements
- **Widget grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Testing Rules

- **Jest for backend** - Unit and integration tests
- **Test file location**: Co-located `*.test.ts` or `__tests__/` folder
- **Mock external services** - Never hit real APIs in tests
- **Coverage target**: Focus on business logic in services

### Code Quality Rules

- **ESLint + Prettier** - Run before commit
- **No console.log in production** - Use proper logging
- **Error boundaries** - Wrap widgets in ErrorBoundary
- **Graceful degradation** - Widget failures don't crash dashboard

### Critical Anti-Patterns to AVOID

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| Hardcoded colors `bg-gray-900` | Use tokens `bg-surface` |
| Generic hook names `useFetch` | Namespaced `useDashboardXxx` |
| Desktop-first media queries | Mobile-first with `md:`, `lg:` |
| Business logic in controllers | Move to services |
| Direct DB access in controllers | Use repositories |
| Inline error handling in render | ErrorBoundary wrapper |
| Direct API calls in components | Custom hooks with React Query |
| Class components | Functional components only |
| `any` types | Explicit TypeScript types |

### Security Rules

- **JWT auth** - All protected routes require valid token
- **RBAC filtering** - Backend must filter data by user role
- **Input validation** - Use express-validator on all inputs
- **No secrets in code** - Use environment variables
- **Sanitize user input** - Prevent XSS/injection

### File Organization Rules

**Frontend:**
```
src/
├── pages/          # Route components
├── components/     # Reusable UI components
├── hooks/          # Custom hooks (organized by feature)
├── services/       # API calls
├── contexts/       # React Context providers
└── types/          # TypeScript interfaces
```

**Backend:**
```
src/
├── routes/         # Express route definitions
├── controllers/    # Request handlers
├── services/       # Business logic
├── repositories/   # Data access
├── models/         # Type definitions
└── middleware/     # Express middleware
```

---

## Mobile App (Flutter/Dart) Implementation Rules

### Technology Stack & Versions

**Mobile Framework:**
- Flutter 3.x + Dart 3.x (null safety required)
- go_router 14.x (navigation with StatefulShellRoute)
- Riverpod 2.x (state management)
- Freezed 2.x + json_serializable (code generation)

**Data & Network:**
- Dio 5.x with interceptor chain (Auth, Connectivity, Retry, Logging, Error)
- Drift 2.x (SQLite offline database)
- connectivity_plus (network detection)

**Security & UX:**
- local_auth + flutter_secure_storage (biometric + secure token)
- flutter_native_splash + flutter_launcher_icons (branding)

### Language-Specific Rules (Dart)

- **Null safety REQUIRED** - All code must be null-safe
- **Sound null safety** - No `// @dart=2.9` legacy mode
- **Prefer `final`** - Use `final` for variables that won't change
- **Named parameters** - Use `required` keyword for mandatory named params
- **Either pattern** - Use `Either<Failure, Success>` for error handling (dartz)
- **Freezed unions** - Use `@freezed` for sealed classes and state unions

### Framework-Specific Rules (Flutter/Riverpod)

**Widget Rules:**
- **StatelessWidget preferred** - Use ConsumerWidget for Riverpod
- **Const constructors** - Use `const` where possible for performance
- **Keys for lists** - Always provide keys for ListView items
- **56dp touch targets** - Minimum for glove-friendly industrial use

**Riverpod Rules:**
- **Provider suffix** - `workOrdersProvider`, `authStateProvider`
- **Family for params** - Use `.family` for parameterized providers
- **AutoDispose** - Use `autoDispose` for screen-scoped state
- **AsyncValue pattern** - Handle `.when(data:, loading:, error:)`

**State Management Pattern:**
```dart
@riverpod
class WorkOrderNotifier extends _$WorkOrderNotifier {
  @override
  FutureOr<List<WorkOrder>> build() => _fetchWorkOrders();
}
```

### Naming Conventions (Mobile)

| Element | Convention | Example |
|---------|------------|---------|
| Dart Files | snake_case | `work_order_screen.dart` |
| Classes/Widgets | PascalCase | `WorkOrderCard` |
| Variables/Functions | camelCase | `fetchWorkOrders()` |
| Providers | camelCase + Provider suffix | `workOrdersProvider` |
| Freezed Models | PascalCase | `@freezed class WorkOrder` |
| Database Tables | snake_case, plural | `work_orders` |
| Feature Folders | snake_case | `lib/features/work_orders/` |
| UI Labels | **Indonesian** | "Selesai", "Mulai Tugas" |

### Architecture Rules (Clean Architecture)

```
lib/
├── core/           # Shared utilities, themes, constants
├── features/       # Feature modules (vertical slices)
│   └── {feature}/
│       ├── data/           # Repository impl, DTOs, data sources
│       ├── domain/         # Entities, repository interfaces, use cases
│       └── presentation/   # Screens, widgets, providers
└── shared/         # Cross-feature components
```

**Layer Rules:**
- **Presentation → Domain only** - Never import data layer in widgets
- **Domain has NO dependencies** - Pure Dart, no Flutter imports
- **Data implements Domain** - Repository interfaces in domain, impl in data
- **Feature isolation** - Features don't import from other features directly

### Offline-First & Sync Rules

- **Queue-based sync** - All mutations go to `SyncQueue` first
- **Optimistic UI** - Update local state immediately
- **Exponential backoff** - With jitter for retry: `min(32s, 2^attempt) + random(0-1s)`
- **Conflict resolution** - Server wins, preserve local changes in conflict log
- **Sync status indicators** - Show pending/syncing/synced state per item

**Sync Queue Pattern:**
```dart
class SyncQueue {
  Future<void> enqueue(SyncOperation op);
  Stream<SyncStatus> get statusStream;
  Future<void> processQueue(); // Called on connectivity restore
}
```

### Testing Rules (Mobile)

- **Unit tests** - For domain logic, providers, repositories
- **Widget tests** - For critical UI flows with `WidgetTester`
- **Integration tests** - For full feature flows
- **Mock pattern** - Use `@riverpod` with `overrideWith` for testing
- **Test file location** - Co-located `*_test.dart` files

### Dio Interceptor Chain (CRITICAL ORDER)

```dart
dio.interceptors.addAll([
  AuthInterceptor(),        // 1. Inject JWT token
  ConnectivityInterceptor(), // 2. Check network, queue if offline
  RetryInterceptor(),       // 3. Retry with exponential backoff
  LoggingInterceptor(),     // 4. Log requests/responses
  ErrorInterceptor(),       // 5. Transform to domain Failures
]);
```

### Critical Anti-Patterns to AVOID (Mobile)

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| `setState()` in complex widgets | Use Riverpod providers |
| Direct API calls in widgets | Use repository + provider |
| Blocking UI during sync | Optimistic updates + queue |
| Hardcoded strings | Use constants or l10n |
| Missing `const` constructors | Add `const` for performance |
| `FutureBuilder` for async state | Use `AsyncValue` with Riverpod |
| Provider without `.autoDispose` | Add autoDispose for screen scope |
| Touch targets < 56dp | Minimum 56dp for industrial use |
| Sync on every action | Batch sync on connectivity restore |

### Security Rules (Mobile)

- **Biometric first** - Prompt biometric before PIN fallback
- **Secure storage** - JWT in flutter_secure_storage, never SharedPreferences
- **Token refresh** - Auto-refresh before expiry via AuthInterceptor
- **Session timeout** - Lock app after 5 minutes inactive
- **No sensitive logs** - Strip tokens from LoggingInterceptor

### Haptic Feedback Rules

- **Success actions** - `HapticFeedback.mediumImpact()`
- **Errors** - `HapticFeedback.heavyImpact()`
- **Selections** - `HapticFeedback.selectionClick()`
- **Use InteractionService** - Centralized haptic + audio feedback

---

_Updated: 2026-01-10 | Source: Architecture Decision Document + Mobile App Architecture_

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Web Dashboard: Follow React/TypeScript rules in first section
- Mobile App: Follow Flutter/Dart rules in second section

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time
