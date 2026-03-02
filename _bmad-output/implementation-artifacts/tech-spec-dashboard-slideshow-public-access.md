---
title: 'Dashboard Slideshow Visualization dengan Public Access'
slug: 'dashboard-slideshow-public-access'
created: '2026-01-31'
status: 'Implementation Complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 18', 'TypeScript', 'Express', 'Recharts', 'Tailwind CSS', 'Redis']
files_to_modify: ['c:\project SAP\task-manager-server\src\index.ts', 'c:\project SAP\task-manager-client\src\App.tsx']
code_patterns: ['Repository-Service-Controller', 'React Query', 'Design Tokens', 'Redis Caching']
test_patterns: ['Jest', 'Integration Tests', 'Load Testing']
party_mode_enhanced: true
estimated_duration: '4-5 days'
---

# Tech-Spec: Dashboard Slideshow Visualization dengan Public Access

**Created:** 2026-01-31

## Overview

### Problem Statement

Supervisor dan Manager membutuhkan monitoring wall (TV display 55" di area pabrik, viewing distance 3-4 meter) untuk memantau KPI operasional secara real-time tanpa perlu login. Saat ini tidak ada cara untuk menampilkan dashboard secara public dengan visualisasi yang berganti otomatis menampilkan berbagai laporan penting (KPI Summary, Production Summary, Maintenance Metrics, Downtime, Energy Monitoring). Deployment target: internal factory network only.

### Solution

Implementasi production-ready dashboard slideshow dengan:
- **Public access** (tanpa autentikasi JWT) untuk internal network
- **Redis-cached data layer** (30s TTL) untuk performance dan concurrent TV polling
- **Database-backed configuration** untuk flexible slide management
- **Admin Config UI** untuk reorder slides, toggle visibility, adjust durations
- **Auto-rotation** (configurable per slide, default 30s) dengan smooth transitions
- **Fullscreen mode** dengan hidden controls (visible on hover)
- **Auto-refresh** data setiap 30s via React Query polling
- **Error resilience** dengan blank screen + retry strategy saat backend down

### Scope

**In Scope:**
- ✅ Public endpoint `/api/dashboard/slideshow` (no JWT auth, network-only access)
- ✅ **Redis caching layer** (30s TTL, graceful fallback to DB if Redis down)
- ✅ **Database table `slideshow_configs`** untuk store slide configuration
- ✅ **Admin Config UI** (`/admin/slideshow-config`) dengan:
  - Drag-drop reordering (react-beautiful-dnd or native HTML5)
  - Enable/disable toggles per slide
  - Inline duration editing (validation: 10-120 seconds)
  - Protected route (admin role only)
- ✅ Frontend slideshow page (`/slideshow`) dengan:
  - Auto-rotation (configurable duration per slide, default 30s)
  - Manual fullscreen toggle button
  - Hidden controls (visible on hover): prev, next, pause/play
  - Keyboard shortcuts: Space (pause), Arrows (nav), F (fullscreen), Esc (exit)
- ✅ **5 Slide Types** dengan TV-optimized typography (55" @ 3-4m):
  - KPI Summary Slide
  - Production Summary Slide
  - Maintenance Metrics Slide
  - Downtime Report Slide
  - Energy Monitoring Slide (Solar + PLN)
- ✅ Auto-refresh data setiap 30s via React Query polling
- ✅ **Error handling**:
  - Backend unreachable → Blank screen + "Tidak dapat terhubung" + auto-retry (exponential backoff)
  - Data stale (>5 min) → Yellow banner warning dengan last update timestamp
  - Partial failure → Show successful widgets, placeholder untuk failed widgets
- ✅ Design specs:
  - Typography: Hero numbers (96px), Headers (36px), Body (24px), Small (20px)
  - Layout: 12-column grid, max 6 widgets per slide, p-8 padding, gap-6 spacing
  - Transitions: 0.4s ease-in-out fade
  - Colors: Design tokens compliant, 4.5:1 contrast ratio (WCAG AA)
- ✅ Infrastructure: Docker Compose Redis setup untuk development
- ✅ All data visible - no filtering/restriction (internal network trusted)

**Out of Scope:**
- ❌ IP whitelist (network isolation sufficient for MVP)
- ❌ Custom slide builder UI (only configure existing 5 slide types)
- ❌ Role-based data filtering untuk public view
- ❌ Mobile responsive optimization (TV display focus)
- ❌ Multi-language support (Indonesian only)
- ❌ Historical slide analytics/usage tracking
- ❌ Slide scheduling (time-based slide visibility)

## Context for Development

### Codebase Patterns

**Tech Stack:**
- Backend: Node.js + Express + TypeScript (OOP Pattern: Routes → Controllers → Services → Repositories)
- Frontend: React 18 + TypeScript + Vite
- State Management: React Query (TanStack Query v5) untuk server state
- Charts: Recharts 3.6.0
- Styling: Tailwind CSS dengan Design Tokens
- Database: SQLite
- **Cache Layer: Redis 7.x** (30s TTL, graceful fallback)

**Existing Dashboard System:**
- 4 role-based dashboards: `/api/dashboard/stats`, `/api/dashboard/supervisor`, `/api/dashboard/manager`, `/api/dashboard/member`
- 11+ report endpoints: `/api/reports/kpi/dashboard`, `/api/reports/production/summary`, `/api/reports/maintenance/metrics`, `/api/reports/downtime`, dll
- Frontend sudah menggunakan Recharts untuk visualisasi - **REUSE existing chart components**

**Authentication Pattern:**
- Middleware: `auth` (JWT required), `adminOnly`, `managerOrAdmin`, `supervisorOrAbove`
- **New middleware:** `publicAccess` - skip JWT validation, no audit trail
- Current roles: `admin`, `manager`, `supervisor`, `technician`, `operator`

**Design System (Project Context Rules):**
- Design tokens: `bg-surface`, `bg-surface-elevated`, `text-text-primary`, `text-text-secondary`, `border`, `status-success/warning/error`
- Typography: Use Tailwind text utilities (`text-8xl`, `text-4xl`, `text-2xl`, `text-xl`)
- Mobile-first responsive: `md:`, `lg:` breakpoints (TV display fokus `lg:`)
- **CRITICAL:** Never hardcode colors - use semantic tokens only
- ErrorBoundary wrapper untuk graceful widget degradation

**Code Quality Standards:**
- TypeScript strict mode enabled - no `any` types
- ESLint + Prettier before commit
- Repository-Service-Controller pattern (no business logic in controllers)
- Custom hooks prefix: `use` (e.g., `useSlideshowData`, `useSlideshowControls`)
- Test co-location: `*.test.ts` files or `__tests__/` folder

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `c:\project SAP\_bmad-output\project-context.md` | Critical implementation rules, naming conventions, architecture patterns |
| `c:\project SAP\task-manager-server\src\types\user.ts` | User role types reference |
| `c:\project SAP\task-manager-server\src\middleware\auth.ts` | Existing auth middleware pattern to emulate for publicAccess |
| `c:\project SAP\task-manager-server\src\controllers\v2\*.ts` | OOP controller pattern examples |
| `c:\project SAP\task-manager-server\src\services\*.ts` | Service layer pattern examples |
| `c:\project SAP\task-manager-server\src\repositories\*.ts` | Repository pattern examples |
| `c:\project SAP\task-manager-client\src\hooks\*.ts` | Custom hooks pattern (React Query usage) |
| `c:\project SAP\task-manager-client\src\components\*.tsx` | Existing Recharts widget components to reuse |
| TBD - akan diisi lengkap di Step 2 Investigation | Deep dive file analysis |

### Technical Decisions

**1. Configuration Storage Strategy (Winston's Recommendation):**
- ✅ **Database table `slideshow_configs`** - robust, versionable, supports admin UI
- Schema:
  ```sql
  CREATE TABLE slideshow_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slide_type TEXT NOT NULL,           -- 'kpi-summary', 'production', 'maintenance', 'downtime', 'energy'
    slide_order INTEGER NOT NULL,       -- Display order (1, 2, 3, ...)
    duration_seconds INTEGER DEFAULT 30, -- Per-slide duration (10-120s validation)
    enabled BOOLEAN DEFAULT 1,           -- Toggle visibility
    config_json TEXT,                    -- Slide-specific settings (future use)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  ```
- Environment variable: `SLIDESHOW_ENABLED=true` (kill switch)

**2. Caching Strategy (Winston's Recommendation):**
- ✅ **Redis cache** with 30s TTL (aligns with refresh interval)
- Key pattern: `slideshow:data:{slide_type}` (e.g., `slideshow:data:kpi-summary`)
- Graceful fallback: If Redis unavailable → query DB directly (log warning)
- Cache invalidation: On config update via admin UI
- Why Redis over in-memory: Handles concurrent TV polling elegantly, data survives Node restart

**3. Public Access Security (Winston's Recommendation):**
- ✅ Network-only access (factory internal network isolation)
- ✅ No IP whitelist for MVP (network already restricted)
- ✅ Rate limiting: Optional for future (not critical for internal use)
- Middleware: `publicAccess.ts` - skip JWT, no user context, no audit trail

**4. Admin UI Scope (Barry's Recommendation):**
- ✅ Include in MVP - prevents future refactoring
- Features: Drag-drop reorder, enable/disable toggles, inline duration edit
- Library: `react-beautiful-dnd` or native HTML5 drag-and-drop
- Route: `/admin/slideshow-config` (protected, admin-only)
- **NO custom slide builder** - only configure existing 5 slide types

**5. Design Specifications (Sally's Recommendation):**
- Target: 55" TV @ 1920x1080, viewing distance 3-4 meters
- Typography scale:
  - Hero numbers: `text-8xl` (96px) - KPI values, critical metrics
  - Section headers: `text-4xl` (36px) - Widget titles
  - Body text: `text-2xl` (24px) - Labels, descriptions
  - Small text: `text-xl` (20px) - Timestamps (minimum readable)
- Layout: 12-column grid, max 6 widgets per slide, `p-8` padding, `gap-6` spacing
- Transitions: CSS `transition: 0.4s ease-in-out` for slide changes
- Color accessibility: 4.5:1 contrast ratio (WCAG AA), avoid pure red/green (colorblind)
- Icons + color (double encoding) for status indicators

**6. Error Handling Strategy (Murat's Recommendation):**
- **Backend unreachable:**
  - Display: Blank screen + centered message "Tidak dapat terhubung ke server. Mencoba kembali..."
  - Auto-retry: Exponential backoff (5s → 10s → 30s → 60s max)
- **Data stale (last update > 5 minutes):**
  - Display: Show last known data + yellow top banner "Data terakhir: X menit yang lalu"
- **Partial widget failure:**
  - Display: Show successful widgets, replace failed dengan "Data tidak tersedia" placeholder
  - ErrorBoundary wrapper per widget - prevent entire slideshow crash

**7. Frontend Architecture:**
- Dedicated route: `/public/slideshow` (no auth guard in router)
- React Query: `refetchInterval: 30000` untuk auto-refresh
- State management:
  - `currentSlideIndex` - current slide (0-indexed)
  - `isPlaying` - auto-rotation state (play/pause)
  - `isFullscreen` - fullscreen mode toggle
- Keyboard controls:
  - `Space` - Pause/Play toggle
  - `Arrow Left/Right` - Navigate slides
  - `F` or `F11` - Fullscreen toggle
  - `Esc` - Exit fullscreen
- Controls visibility: `opacity-0 hover:opacity-100` transition

**8. Slide Component Reuse:**
- **DO NOT rebuild chart components** - reuse from existing dashboard pages
- Extract shared widgets into `src/components/widgets/*` if not already
- Props interface: `{ data: T, compact?: boolean }` (compact mode for slideshow)

## Implementation Plan

### Tasks

**Phase 1: Infrastructure Setup (Day 1)**

1. **Redis Setup**
   - Add Redis to `docker-compose.yml` (service: `redis:7-alpine`, port 6379)
   - Install dependencies: `npm install redis @types/redis`
   - Add env variable: `REDIS_URL=redis://localhost:6379`
   - Create `src/services/RedisCacheService.ts` (singleton, graceful connection handling)

2. **Database Migration**
   - Create migration: `database/migrations/XXX_create_slideshow_configs.sql`
   - Execute migration script
   - Seed initial data: 5 default slides (all enabled, order 1-5, duration 30s)

**Phase 2: Backend Implementation (Day 1-2)**

3. **Type Definitions**
   - Create `src/types/slideshow.ts` - interfaces for SlideConfig, SlideData, SlideshowResponse

4. **Repository Layer**
   - Create `src/repositories/SlideshowConfigRepository.ts`
   - Methods: `getAll()`, `getEnabled()`, `updateOrder()`, `toggleEnabled()`, `updateDuration()`

5. **Service Layer**
   - Create `src/services/SlideshowService.ts` (integrates Redis + multiple report services)
   - Methods:
     - `getSlideshowData()` - aggregate all slides with caching
     - `getSlideConfig()` - fetch config from DB
     - `invalidateCache(slideType)` - clear Redis cache

6. **Middleware**
   - Create `src/middleware/publicAccess.ts` - skip auth, CORS enabled

7. **Controllers**
   - Create `src/controllers/v2/PublicDashboardController.ts`
     - `getSlideshow()` - public endpoint handler
   - Create `src/controllers/v2/AdminSlideshowController.ts`
     - `getConfig()`, `updateConfig()`, `reorderSlides()` - admin endpoints

8. **Routes**
   - Create `src/routes/v2/publicDashboard.ts` - public routes
   - Create `src/routes/v2/adminSlideshow.ts` - admin routes (protected)
   - Register routes in `src/index.ts`

**Phase 3: Frontend - Slideshow UI (Day 2-3)**

9. **Custom Hooks**
   - Create `src/hooks/useSlideshowData.ts` - React Query hook (refetchInterval: 30000)
   - Create `src/hooks/useSlideshowControls.ts` - play/pause/nav/fullscreen state
   - Create `src/hooks/useSlideshowConfig.ts` - fetch config (admin only)

10. **Slide Components**
    - Create `src/components/slideshow/slides/KPISummarySlide.tsx`
    - Create `src/components/slideshow/slides/ProductionSlide.tsx`
    - Create `src/components/slideshow/slides/MaintenanceSlide.tsx`
    - Create `src/components/slideshow/slides/DowntimeSlide.tsx`
    - Create `src/components/slideshow/slides/EnergySlide.tsx`
    - **Reuse existing Recharts widgets** - import from dashboard components

11. **Carousel Component**
    - Create `src/components/slideshow/SlideCarousel.tsx`
    - Features: Auto-rotation timer, keyboard controls, transition animations

12. **Error Component**
    - Create `src/components/slideshow/ErrorScreen.tsx`
    - States: Connection error, stale data banner, widget placeholder

13. **Main Page**
    - Create `src/pages/PublicSlideshow.tsx`
    - Layout: Fullscreen container, controls overlay (hidden by default)
    - Add route to `src/App.tsx`: `/slideshow` (no auth guard)

**Phase 4: Frontend - Admin Config UI (Day 3-4)**

14. **Admin Components**
    - Create `src/components/admin/ConfigTable.tsx` - table view dengan drag-drop
    - Create `src/components/admin/DraggableRow.tsx` - single row component
    - Library: Install `react-beautiful-dnd` or use native HTML5 drag API

15. **Admin Page**
    - Create `src/pages/admin/AdminSlideshowConfig.tsx`
    - Features: Reorder, toggle enable, edit duration (validation 10-120s)
    - Add route: `/admin/slideshow-config` (auth guard: admin only)

**Phase 5: Testing & Polish (Day 4-5)**

16. **Backend Tests**
    - Create `tests/services/SlideshowService.test.ts` - unit tests
    - Create `tests/services/RedisCacheService.test.ts` - cache behavior tests
    - Create `tests/controllers/PublicDashboardController.test.ts` - integration tests

17. **Frontend Manual Testing**
    - Test on actual 55" TV display (fullscreen, keyboard controls, transitions)
    - Test error states (disconnect backend, stale data simulation)
    - Test admin UI (drag-drop, validation)

18. **Documentation**
    - Update `README.md` dengan Redis setup instructions
    - Add `.env.example` entry: `REDIS_URL=redis://localhost:6379`
    - Document slideshow URL: `http://localhost:3000/slideshow`

### Acceptance Criteria

**Backend API:**

- [ ] **AC-1:** `GET /api/dashboard/slideshow` endpoint accessible tanpa JWT token
  - **Given** no Authorization header
  - **When** I request `/api/dashboard/slideshow`
  - **Then** response 200 OK dengan array of slide objects

- [ ] **AC-2:** Slideshow data includes all enabled slides dalam correct order
  - **Given** config table has 3 enabled slides (order: 2, 1, 5)
  - **When** I fetch slideshow data
  - **Then** response contains 3 slides dalam order [1, 2, 5]

- [ ] **AC-3:** Redis cache serves data within 30s window
  - **Given** fresh data cached in Redis (TTL < 30s)
  - **When** I request slideshow data
  - **Then** data served from cache (verify via Redis key check)

- [ ] **AC-4:** Graceful fallback when Redis unavailable
  - **Given** Redis service is stopped
  - **When** I request slideshow data
  - **Then** response still returns data (from DB), logs warning

- [ ] **AC-5:** Admin can update slide configuration
  - **Given** I am authenticated as admin
  - **When** I `PUT /api/admin/slideshow/config` with new order
  - **Then** config updated in DB, Redis cache invalidated

**Frontend Slideshow:**

- [ ] **AC-6:** Auto-rotation advances slides at configured interval
  - **Given** slide duration is 30 seconds
  - **When** I open `/public/slideshow`
  - **Then** slide auto-advances every 30 seconds

- [ ] **AC-7:** Keyboard controls work correctly
  - **Given** slideshow is playing
  - **When** I press Space
  - **Then** slideshow pauses (timer stops)
  - **When** I press Arrow Right
  - **Then** manually advance to next slide

- [ ] **AC-8:** Fullscreen mode activates
  - **Given** I am viewing slideshow in normal mode
  - **When** I click fullscreen button or press F
  - **Then** browser enters fullscreen mode
  - **When** I press Esc
  - **Then** exit fullscreen

- [ ] **AC-9:** Controls hidden by default, visible on hover
  - **Given** slideshow is playing
  - **When** I hover over screen
  - **Then** controls fade in (prev/next/pause/fullscreen buttons)
  - **When** I move mouse away
  - **Then** controls fade out after 2 seconds

- [ ] **AC-10:** Data refreshes automatically every 30 seconds
  - **Given** slideshow is active
  - **When** 30 seconds elapse
  - **Then** React Query refetches data from backend
  - **And** UI updates if data changed

**Error Handling:**

- [ ] **AC-11:** Connection error displays blank screen with message
  - **Given** backend is unreachable
  - **When** I open slideshow
  - **Then** blank screen shows "Tidak dapat terhubung ke server. Mencoba kembali..."
  - **And** auto-retry with exponential backoff (5s, 10s, 30s, 60s)

- [ ] **AC-12:** Stale data shows warning banner
  - **Given** last successful fetch was 6 minutes ago
  - **When** slideshow displays data
  - **Then** yellow banner shows "Data terakhir: 6 menit yang lalu"

- [ ] **AC-13:** Partial widget failure handled gracefully
  - **Given** one widget API fails
  - **When** slide renders
  - **Then** other widgets display correctly
  - **And** failed widget shows "Data tidak tersedia" placeholder

**Admin Config UI:**

- [ ] **AC-14:** Admin can reorder slides via drag-drop
  - **Given** I am on `/admin/slideshow-config` as admin
  - **When** I drag slide #3 to position #1
  - **Then** order updates in table and saves to backend

- [ ] **AC-15:** Admin can toggle slide visibility
  - **Given** slide "Production" is enabled
  - **When** I click toggle switch
  - **Then** slide disabled, removed from public slideshow

- [ ] **AC-16:** Admin can edit slide duration with validation
  - **Given** I edit duration field
  - **When** I enter 5 (below min 10)
  - **Then** validation error "Minimum 10 detik"
  - **When** I enter 150 (above max 120)
  - **Then** validation error "Maksimum 120 detik"

**Visual/Design:**

- [ ] **AC-17:** Typography scales correctly for 55" TV
  - **Given** viewing on 55" display at 3-4m distance
  - **When** slideshow displays
  - **Then** hero numbers (96px) readable, headers (36px) clear

- [ ] **AC-18:** Transitions smooth with 0.4s fade
  - **Given** auto-rotation advances slide
  - **When** transition occurs
  - **Then** fade effect takes 0.4 seconds (not abrupt)

- [ ] **AC-19:** Design tokens used consistently (no hardcoded colors)
  - **Given** codebase review
  - **When** inspecting slide components
  - **Then** all colors use `bg-surface`, `text-text-primary`, etc. (no `bg-gray-900`)

**Performance:**

- [ ] **AC-20:** Slideshow loads within 2 seconds
  - **Given** normal network conditions
  - **When** I navigate to `/public/slideshow`
  - **Then** first slide visible within 2 seconds

- [ ] **AC-21:** Chart rendering completes within 1 second
  - **Given** production-scale data (100+ data points)
  - **When** Recharts renders chart
  - **Then** render completes within 1 second (no lag)

## Additional Context

### Dependencies

**Existing (Already Installed):**
- Recharts 3.6.0 - Chart library (reuse existing)
- React Query 5.x - Server state management (already configured)
- Tailwind CSS 3.4 - Design tokens ready
- Axios 1.7 - HTTP client
- Express 4.21 - Backend framework
- SQLite (sql.js) - Database

**New Dependencies:**

**Backend:**
- `redis` ^4.6.0 - Redis client for Node.js
- `@types/redis` ^4.0.0 - TypeScript definitions

**Frontend:**
- `react-beautiful-dnd` ^13.1.1 - Drag-and-drop library (for admin UI)
- `@types/react-beautiful-dnd` ^13.1.0 - TypeScript definitions
- **Alternative:** Native HTML5 Drag-and-Drop API (zero dependencies, more effort)

**Infrastructure:**
- Docker Compose - Redis service for development (`redis:7-alpine`)

**Installation Commands:**
```bash
# Backend
cd task-manager-server
npm install redis @types/redis

# Frontend
cd task-manager-client
npm install react-beautiful-dnd @types/react-beautiful-dnd

# Docker (development)
docker-compose up -d redis
```

### Testing Strategy

**Unit Tests (Backend - Jest):**

1. **RedisCacheService.test.ts**
   - Test: Cache set/get operations
   - Test: TTL expiration behavior
   - Test: Graceful handling when Redis connection fails
   - Test: Cache invalidation

2. **SlideshowService.test.ts**
   - Test: Data aggregation from multiple report services
   - Test: Cache hit scenario (data served from Redis)
   - Test: Cache miss scenario (data fetched from DB)
   - Test: Config filtering (only enabled slides returned)

3. **SlideshowConfigRepository.test.ts**
   - Test: CRUD operations (create, read, update, delete)
   - Test: Ordering logic (slides returned in correct order)
   - Test: Toggle enabled/disabled state

4. **PublicDashboardController.test.ts**
   - Test: GET /api/dashboard/slideshow returns 200 without auth
   - Test: Response structure matches expected format
   - Test: Error handling (500 when service fails)

5. **AdminSlideshowController.test.ts**
   - Test: Admin auth required (401 for non-admin)
   - Test: Config update endpoint
   - Test: Reorder slides endpoint

**Integration Tests:**

6. **Public Endpoint Access Test**
   - Test: Slideshow endpoint accessible without JWT token
   - Test: CORS headers correct for frontend origin

7. **Redis Integration Test**
   - Test: End-to-end flow with real Redis instance (Docker)
   - Test: Cache invalidation on config update

**Load Testing (Optional for Production):**

8. **Concurrent TV Polling Simulation**
   - Simulate 10 TVs polling every 30 seconds
   - Verify: No performance degradation, Redis handles load
   - Tool: Apache JMeter or Artillery.io

**Frontend Manual Testing (Critical):**

9. **TV Display Testing**
   - Test on actual 55" TV display (1920x1080 resolution)
   - Verify: Typography readable at 3-4m distance
   - Verify: Fullscreen mode works correctly
   - Verify: Keyboard controls responsive
   - Verify: Transitions smooth (0.4s fade, no lag)

10. **Error State Testing**
    - Test: Disconnect backend → verify blank screen + retry message
    - Test: Simulate stale data (stop backend for 6 min) → verify yellow banner
    - Test: Network slow → verify loading states

11. **Admin UI Testing**
    - Test: Drag-drop reorder functionality
    - Test: Toggle enable/disable switches
    - Test: Duration validation (min 10, max 120)
    - Test: Changes persist after page reload

**Accessibility Testing (WCAG AA):**

12. **Color Contrast**
    - Verify: All text meets 4.5:1 contrast ratio
    - Tool: Chrome DevTools Lighthouse

13. **Keyboard Navigation**
    - Verify: All controls accessible via keyboard
    - Verify: Tab order logical

**Performance Testing:**

14. **Chart Rendering Performance**
    - Test: Recharts render time with production data (100+ points)
    - Target: < 1 second render time
    - Test: Multiple charts on same slide (memory usage)

15. **Initial Load Performance**
    - Test: Time to first slide visible
    - Target: < 2 seconds
    - Tool: Chrome DevTools Performance tab

**Test Coverage Target:**
- Backend services: 80%+ coverage
- Critical paths (slideshow endpoint, config CRUD): 100% coverage
- Frontend: Manual testing sufficient for MVP (E2E tests optional future work)

### Notes

- Target deployment: TV display di factory floor (landscape orientation, 1920x1080 atau lebih besar)
- Performance consideration: Caching untuk slideshow data (optional optimization)
- Future enhancement: Admin UI untuk configure slide order dan interval
