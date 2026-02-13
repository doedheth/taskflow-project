# Story 1.1: Setup React Query Provider

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **React Query configured as the data fetching infrastructure**,
So that **all dashboard widgets can leverage caching, polling, and state management**.

## Acceptance Criteria

1. **Given** the application is starting
   **When** React Query provider is initialized
   **Then** QueryClient is created with default options (staleTime: 10s, refetchInterval: 30s, retry: 2)
   **And** QueryClientProvider wraps the entire application
   **And** React Query DevTools is available in development mode

2. **Given** a component uses useQuery hook
   **When** fetching data
   **Then** the query uses the global QueryClient configuration
   **And** caching works correctly across components

3. **Given** the application is in development mode
   **When** React Query DevTools are rendered
   **Then** DevTools toggle button is visible at bottom-right corner
   **And** clicking toggle shows query cache and states

## Tasks / Subtasks

- [x] Task 1: Install React Query dependencies (AC: #1)
  - [x] 1.1: Run `npm install @tanstack/react-query @tanstack/react-query-devtools`
  - [x] 1.2: Verify packages added to package.json with correct versions (@tanstack/react-query v5.x)

- [x] Task 2: Create QueryProvider component (AC: #1, #2)
  - [x] 2.1: Create `src/providers/QueryProvider.tsx` file
  - [x] 2.2: Initialize QueryClient with staleTime: 10000 (10s)
  - [x] 2.3: Configure default refetchInterval: 30000 (30s) for dashboard widgets
  - [x] 2.4: Set retry: 2 for failed queries
  - [x] 2.5: Set refetchOnWindowFocus: true
  - [x] 2.6: Export QueryProvider component that wraps children with QueryClientProvider

- [x] Task 3: Add DevTools for development (AC: #3)
  - [x] 3.1: Import ReactQueryDevtools from @tanstack/react-query-devtools
  - [x] 3.2: Conditionally render DevTools only in development mode
  - [x] 3.3: Position DevTools at bottom-right (default)

- [x] Task 4: Integrate QueryProvider into App (AC: #1, #2)
  - [x] 4.1: Import QueryProvider in main App.tsx or index.tsx
  - [x] 4.2: Wrap the entire application with QueryProvider (outermost provider)
  - [x] 4.3: Ensure QueryProvider wraps Router and other existing providers

- [x] Task 5: Create test hook to verify setup (AC: #2)
  - [x] 5.1: Create a simple test query hook to validate configuration
  - [x] 5.2: Verify query uses correct staleTime and refetchInterval from global config
  - [x] 5.3: Clean up test after verification (or keep as example)

- [ ] Task 6: Write unit tests (AC: #1, #2, #3) - DEFERRED
  - [ ] 6.1: Test QueryClient is created with correct default options
  - [ ] 6.2: Test QueryProvider renders children correctly
  - [ ] 6.3: Test DevTools are only rendered in development mode
  - **Note:** Deferred until frontend test framework (Jest/Vitest) is configured. Does not block story completion per team decision.

## Dev Notes

### Architecture Requirements

**From Architecture Document:**
- React Query (TanStack Query) v5.x is the chosen data fetching strategy
- Query keys use array format with namespace: `['dashboard', 'feature', params]`
- Polling: Use `refetchInterval: 30000` for dashboard widgets
- Stale time: 10 seconds default
- Error handling: Let React Query handle retries (2x default)

**From Project Context:**
- Technology Stack: React 18.3.1 + TypeScript 5.6.3
- Use `@/*` path alias for `src/*` imports (frontend)
- Functional components only
- Custom hooks prefix with `use`

### Technical Implementation Guide

**QueryClient Configuration:**
```tsx
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,        // 10 seconds
      refetchInterval: 30000,   // 30 seconds for dashboard polling
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

**Integration in App.tsx:**
```tsx
// Ensure QueryProvider is the outermost provider
import { QueryProvider } from '@/providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            {/* ... rest of app */}
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
```

### Project Structure Notes

**File Location:**
- New file: `src/providers/QueryProvider.tsx`
- Modification: `src/App.tsx` or `src/main.tsx` (whichever is the root)

**Existing Providers to Maintain:**
- AuthContext (existing)
- ThemeContext (existing)

**Provider Hierarchy (CRITICAL):**
```
StrictMode (React wrapper)
  └── QueryProvider (outermost - React Query needs to be available everywhere)
      └── BrowserRouter (routing available to all providers)
          └── ThemeProvider
              └── AuthProvider
                  └── App Routes
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Fetching Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#React Query Key Conventions]
- [Source: _bmad-output/project-context.md#React Query Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]

### Critical Anti-Patterns to AVOID

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| Creating new QueryClient per component | Single QueryClient instance |
| Hardcoding query options in each hook | Use global defaults, override when needed |
| Including DevTools in production build | Conditional import/render for dev only |
| Generic query keys like `['data']` | Namespaced keys `['dashboard', 'feature']` |

### Testing Notes

**Test Framework:** Jest (existing in backend, may need setup for frontend)
**Test Location:** Co-located `*.test.ts` or `__tests__/` folder

**Key Test Cases:**
1. QueryClient has correct default options
2. QueryProvider renders children
3. DevTools conditional rendering based on environment

## Dev Agent Record

### Agent Model Used

gemini-claude-opus-4-5-thinking

### Debug Log References

N/A

### Completion Notes List

- **React Query v5.90.16** was already installed in the project; only DevTools needed to be added
- Created `src/providers/QueryProvider.tsx` with QueryClient configured per architecture specs
- Integrated QueryProvider as outermost provider in `src/main.tsx` (after React.StrictMode)
- Created `src/hooks/useQueryConfig.ts` as a verification hook for testing configuration
- Created `src/vite-env.d.ts` to fix TypeScript errors with `import.meta.env` across the project
- Provider hierarchy: `StrictMode → QueryProvider → BrowserRouter → ThemeProvider → AuthProvider → App`
- Unit tests deferred: Frontend test framework (Jest/Vitest) not yet configured in project
- All new files compile without TypeScript errors

### File List

**Created:**
- `task-manager-client/src/providers/QueryProvider.tsx` - React Query provider with DevTools
- `task-manager-client/src/hooks/useQueryConfig.ts` - Verification hook for config
- `task-manager-client/src/vite-env.d.ts` - Vite TypeScript definitions

**Modified:**
- `task-manager-client/src/main.tsx` - Added QueryProvider wrapper, updated to use @/ path aliases
- `task-manager-client/package.json` - Added @tanstack/react-query-devtools dependency
- `task-manager-client/vite.config.ts` - Added path alias resolver for @/ imports (code review fix)

