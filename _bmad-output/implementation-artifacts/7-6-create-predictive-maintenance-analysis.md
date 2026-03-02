# Story 7.6: Create Predictive Maintenance Analysis (Historical-Based)

Status: completed

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **supervisor/manager**,
I want **AI to predict machine breakdown risk based on historical patterns**,
So that **I can schedule preventive maintenance before failures occur**.

## Acceptance Criteria

### AC1: Daily Predictive Analysis Job
**Given** predictive analysis job runs (daily at 5 AM)
**When** job analyzes each machine
**Then** risk score (0-100) is calculated based on:
  - Days since last PM
  - Breakdown frequency (last 90 days)
  - Average MTBF (Mean Time Between Failures)
  - Machine age
  - Historical pattern matching with past breakdowns

### AC2: High-Risk Machine Dashboard Widget
**Given** machine has risk score > 70
**When** supervisor/manager views dashboard
**Then** AI Predictive Insights widget shows high-risk machines
**And** each entry shows: machine name, risk score, predicted failure window, reasoning
**And** action buttons: "Buat WO Inspeksi", "Schedule PM"

### AC3: Prediction Detail Modal
**Given** user clicks on prediction detail
**When** detail modal opens
**Then** full reasoning is shown
**And** similar past incidents are listed
**And** recommended actions are displayed

### AC4: Prediction Accuracy Tracking
**Given** prediction was accurate (breakdown occurred)
**When** breakdown is logged
**Then** prediction accuracy is recorded for model improvement

## Tasks / Subtasks

- [x] Task 1: Create AI Predictions Database Schema (AC: 1, 4)
  - [x] 1.1: Create `ai_predictions` table with columns: id, machine_id, risk_score, predicted_failure_window, reasoning, confidence_level, factors (JSON), similar_incidents (JSON), recommendations (JSON), created_at, expires_at
  - [x] 1.2: Create `ai_prediction_feedback` table for accuracy tracking: id, prediction_id, actual_outcome (breakdown/no_breakdown), occurred_at, notes
  - [x] 1.3: Add database migration/initialization for both tables

- [x] Task 2: Create Predictive Maintenance Service (AC: 1)
  - [x] 2.1: Create `src/services/ai/PredictiveMaintenanceService.ts` service class
  - [x] 2.2: Implement `calculateRiskScore()` method with weighted factors:
    - Days since last PM (25% weight)
    - Breakdown frequency last 90 days (25% weight)
    - Average MTBF (20% weight)
    - Machine age (15% weight)
    - Historical pattern matching (15% weight)
  - [x] 2.3: Implement `analyzeMachine()` method that gathers all data for single machine
  - [x] 2.4: Implement `generateReasoning()` method using gpt-4o for natural language explanation
  - [x] 2.5: Implement `findSimilarIncidents()` method to find matching historical patterns
  - [x] 2.6: Implement `generateRecommendations()` method for actionable suggestions

- [x] Task 3: Create Background Job for Daily Analysis (AC: 1)
  - [x] 3.1: Create `src/jobs/PredictiveMaintenanceJob.ts` with cron scheduling
  - [x] 3.2: Implement `runDailyAnalysis()` that processes all machines
  - [x] 3.3: Store predictions in `ai_predictions` table with expiration (24 hours)
  - [x] 3.4: Add job initialization to server startup
  - [x] 3.5: Implement error handling and logging for job failures

- [x] Task 4: Create Prediction API Endpoints (AC: 2, 3, 4)
  - [x] 4.1: Create `GET /api/v2/ai/predictions` endpoint - returns high-risk predictions (score > 70)
  - [x] 4.2: Create `GET /api/v2/ai/predictions/:id` endpoint - returns full prediction detail
  - [x] 4.3: Create `POST /api/v2/ai/predictions/:id/feedback` endpoint - records prediction accuracy
  - [x] 4.4: Add role filtering (supervisor/manager/admin only)
  - [x] 4.5: Add TypeScript types to `src/types/ai.ts`

- [x] Task 5: Create Predictive Insights Widget (AC: 2)
  - [x] 5.1: Create `PredictiveInsightsWidget.tsx` component for dashboard
  - [x] 5.2: Display list of high-risk machines with risk score badge (color-coded: 70-84 yellow, 85+ red)
  - [x] 5.3: Show machine name, risk score, predicted failure window
  - [x] 5.4: Add action buttons: "Buat WO Inspeksi", "Schedule PM" (via onPredictionClick handler)
  - [x] 5.5: Implement loading skeleton and error states

- [x] Task 6: Create usePredictiveInsights Hook (AC: 2)
  - [x] 6.1: Create `src/hooks/usePredictiveInsights.ts`
  - [x] 6.2: Implement React Query with proper cache settings
  - [x] 6.3: Handle loading, error, and empty states

- [x] Task 7: Create Prediction Detail Modal (AC: 3)
  - [x] 7.1: Create `PredictionDetailModal.tsx` component
  - [x] 7.2: Display full reasoning from AI
  - [x] 7.3: List similar past incidents with dates and outcomes
  - [x] 7.4: Display recommended actions with severity levels
  - [x] 7.5: Add feedback buttons to record prediction accuracy

- [x] Task 8: Integrate Widget with Dashboards (AC: 2)
  - [x] 8.1: Add PredictiveInsightsWidget to SupervisorDashboard.tsx
  - [x] 8.2: Add PredictiveInsightsWidget to ManagerDashboard.tsx
  - [x] 8.3: Added PredictionDetailModal with state management

- [x] Task 9: Implement Prediction Feedback Flow (AC: 4)
  - [x] 9.1: Add feedback buttons in PredictionDetailModal
  - [x] 9.2: Create usePredictionFeedback mutation hook
  - [x] 9.3: Record feedback via API endpoint

- [x] Task 10: Testing & Validation (AC: All)
  - [x] 10.1: TypeScript compilation passes for all new files
  - [x] 10.2: Risk score calculation implemented with weighted factors
  - [x] 10.3: API endpoints created with authentication
  - [x] 10.4: Widget integrated in dashboards

## Dev Notes

### Architecture Compliance

**Existing AI Infrastructure (from Story 7-5):**
- `src/services/ai/AIService.ts` - Main AI service with OpenAI integration
- `src/services/ai/DuplicateDetector.ts` - Similar pattern for embeddings and analysis
- OpenAI client configured with both `gpt-4o-mini` (fast) and `gpt-4o` (analysis)
- API routes in `src/routes/v2/ai.ts`
- AI types in `src/types/ai.ts`

**Pattern to Follow (from previous AI stories):**
- Backend: Create service class in `/services/ai/`
- API: Add routes to `src/routes/v2/ai.ts`
- Frontend: Create components in `/components/` or `/pages/Dashboard/widgets/`
- Hooks: Create in `/hooks/dashboard/` with `usePredictive*` prefix

### Technical Requirements

**Risk Score Calculation Algorithm:**

```typescript
interface RiskFactors {
  daysSinceLastPM: number;      // Higher = more risk
  breakdownCount90Days: number; // More breakdowns = higher risk
  averageMTBF: number;          // Lower MTBF = higher risk
  machineAgeYears: number;      // Older = higher risk
  patternMatchScore: number;    // AI similarity to past failures
}

function calculateRiskScore(factors: RiskFactors): number {
  const weights = {
    pmOverdue: 0.25,      // Days since last PM (normalized)
    breakdownFreq: 0.25,  // Breakdown frequency
    mtbfRisk: 0.20,       // MTBF inverse
    ageRisk: 0.15,        // Machine age factor
    patternMatch: 0.15,   // AI pattern matching
  };

  // Normalize each factor to 0-100 scale, apply weights, sum
  const score =
    (normalizePMOverdue(factors.daysSinceLastPM) * weights.pmOverdue) +
    (normalizeBreakdownFreq(factors.breakdownCount90Days) * weights.breakdownFreq) +
    (normalizeMTBF(factors.averageMTBF) * weights.mtbfRisk) +
    (normalizeAge(factors.machineAgeYears) * weights.ageRisk) +
    (factors.patternMatchScore * weights.patternMatch);

  return Math.min(100, Math.max(0, Math.round(score)));
}
```

**AI Predictions Database Schema:**

```sql
CREATE TABLE ai_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  predicted_failure_window TEXT, -- e.g., "7-14 hari"
  reasoning TEXT NOT NULL,       -- AI-generated explanation
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  factors TEXT NOT NULL,         -- JSON: risk factor breakdown
  similar_incidents TEXT,        -- JSON: array of similar past incidents
  recommendations TEXT,          -- JSON: array of recommended actions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,  -- Usually created_at + 24 hours
  FOREIGN KEY (machine_id) REFERENCES assets(id)
);

CREATE INDEX idx_predictions_machine ON ai_predictions(machine_id);
CREATE INDEX idx_predictions_risk ON ai_predictions(risk_score);
CREATE INDEX idx_predictions_expires ON ai_predictions(expires_at);

CREATE TABLE ai_prediction_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prediction_id INTEGER NOT NULL,
  actual_outcome TEXT NOT NULL CHECK (actual_outcome IN ('breakdown_occurred', 'no_breakdown', 'partial')),
  occurred_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prediction_id) REFERENCES ai_predictions(id)
);
```

**API Response Types:**

```typescript
interface PredictionSummary {
  id: number;
  machine_id: number;
  machine_name: string;
  risk_score: number;
  predicted_failure_window: string;
  confidence_level: 'low' | 'medium' | 'high';
  created_at: string;
}

interface PredictionDetail extends PredictionSummary {
  reasoning: string;
  factors: {
    daysSinceLastPM: { value: number; score: number; };
    breakdownCount90Days: { value: number; score: number; };
    averageMTBF: { value: number; score: number; };
    machineAgeYears: { value: number; score: number; };
    patternMatchScore: { value: number; score: number; };
  };
  similar_incidents: {
    date: string;
    description: string;
    resolution: string;
    similarity_score: number;
  }[];
  recommendations: {
    priority: 'immediate' | 'short_term' | 'long_term';
    action: string;
    reasoning: string;
  }[];
}

interface GetPredictionsResponse {
  success: boolean;
  predictions: PredictionSummary[];
  total_high_risk: number;
  last_analysis_at: string;
}
```

**OpenAI Integration for Reasoning:**

```typescript
// Use gpt-4o for complex analysis and reasoning generation
const response = await this.openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: `Kamu adalah AI maintenance analyst. Analisis data mesin dan berikan prediksi risiko breakdown dalam bahasa Indonesia. Fokus pada:
1. Identifikasi pola dari data historis
2. Jelaskan faktor-faktor risiko utama
3. Berikan rekomendasi yang actionable
4. Gunakan bahasa yang mudah dipahami oleh supervisor/manager`
    },
    {
      role: 'user',
      content: JSON.stringify(machineData)
    }
  ],
  temperature: 0.3, // Lower for more consistent analysis
});
```

**Background Job Implementation:**

```typescript
// src/jobs/PredictiveMaintenanceJob.ts
import cron from 'node-cron';

class PredictiveMaintenanceJob {
  private service: PredictiveMaintenanceService;

  constructor() {
    this.service = new PredictiveMaintenanceService();
  }

  start() {
    // Run daily at 5 AM
    cron.schedule('0 5 * * *', async () => {
      console.log('[PredictiveMaintenanceJob] Starting daily analysis...');
      try {
        await this.runDailyAnalysis();
        console.log('[PredictiveMaintenanceJob] Daily analysis completed');
      } catch (error) {
        console.error('[PredictiveMaintenanceJob] Analysis failed:', error);
      }
    });

    console.log('[PredictiveMaintenanceJob] Scheduled for 5 AM daily');
  }

  async runDailyAnalysis() {
    // Get all active machines
    const machines = await this.getMachines();

    // Clear expired predictions
    await this.clearExpiredPredictions();

    // Analyze each machine
    for (const machine of machines) {
      const prediction = await this.service.analyzeMachine(machine.id);
      await this.service.storePrediction(prediction);
    }
  }
}
```

### File Structure Requirements

**Files to Create:**
- `task-manager-server/src/services/ai/PredictiveMaintenanceService.ts` - Main analysis service
- `task-manager-server/src/jobs/PredictiveMaintenanceJob.ts` - Daily cron job
- `task-manager-server/src/repositories/PredictionRepository.ts` - Database access
- `task-manager-client/src/pages/Dashboard/widgets/PredictiveInsightsWidget.tsx` - Dashboard widget
- `task-manager-client/src/hooks/dashboard/usePredictiveInsights.ts` - React Query hook
- `task-manager-client/src/components/PredictionDetailModal.tsx` - Detail modal

**Files to Modify:**
- `task-manager-server/src/types/ai.ts` - Add prediction types
- `task-manager-server/src/controllers/AIController.ts` - Add prediction handlers
- `task-manager-server/src/routes/v2/ai.ts` - Add prediction routes
- `task-manager-server/src/app.ts` - Initialize background job
- `task-manager-client/src/services/api.ts` - Add prediction API functions
- `task-manager-client/src/pages/Dashboard/SupervisorDashboard.tsx` - Add widget
- `task-manager-client/src/pages/Dashboard/ManagerDashboard.tsx` - Add widget

### UI/UX Requirements

**Predictive Insights Widget:**
- Position: Prominent placement in dashboard (after machine status for supervisor)
- Title: "Prediksi Risiko Breakdown" with refresh icon
- Empty state: "Tidak ada mesin dengan risiko tinggi saat ini"
- Risk badge colors:
  - Score 70-84: Yellow/Warning (`bg-yellow-100 text-yellow-800`)
  - Score 85-100: Red/Critical (`bg-red-100 text-red-800`)

```tsx
<WidgetCard title="Prediksi Risiko Breakdown" icon={<AlertTriangle />}>
  {predictions.map(p => (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div>
        <span className="font-medium">{p.machine_name}</span>
        <p className="text-xs text-text-secondary">
          Prediksi: {p.predicted_failure_window}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <RiskBadge score={p.risk_score} />
        <button onClick={() => openDetail(p.id)}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  ))}
</WidgetCard>
```

**Prediction Detail Modal:**
- Sections: Summary, Risk Factors, Similar Incidents, Recommendations
- Action buttons at bottom with primary CTA

### Previous Story Learnings (from 7-5 Duplicate Detection)

**Patterns to Reuse:**
1. **OpenAI Service Pattern:** Use same initialization pattern from AIService.ts
2. **Type Definitions:** Follow same structure in `src/types/ai.ts`
3. **API Route Pattern:** Follow `/api/v2/ai/*` pattern
4. **Error Handling:** Use try-catch with fallback messages
5. **Widget Pattern:** Follow WidgetCard, loading/error states

**Key Differences from 7-5:**
- 7-6 uses **gpt-4o** for analysis (vs gpt-4o-mini for embeddings)
- 7-6 has **background job** (new pattern - not used in 7-5)
- 7-6 stores **predictions** (vs embeddings in 7-5)

### Testing Scenarios

1. **Risk Score Calculation:** Verify score 0-100 based on weighted factors
2. **High Risk Detection:** Machine with score > 70 appears in widget
3. **Daily Job:** Job runs and creates predictions for all machines
4. **API Authentication:** Only supervisor/manager/admin can access predictions
5. **Detail Modal:** Full reasoning and recommendations displayed
6. **Feedback Loop:** Breakdown logged correlates with prediction accuracy

### Performance Considerations

- Run daily job at 5 AM (low traffic time)
- Use batching for processing many machines
- Cache predictions for 24 hours (expires_at)
- Limit similar incidents to last 10 matches
- Use indexed queries on machine_id and risk_score

### Security Considerations

- Validate user role before returning predictions (supervisor/manager/admin only)
- Rate limit prediction API requests
- Log prediction access for audit trail
- Sanitize AI-generated content before display

### Dependencies

- `node-cron` - For scheduling daily job (check if already installed)
- OpenAI API - Already configured from previous stories

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.6]
- [Source: _bmad-output/project-context.md]
- [Source: _bmad-output/planning-artifacts/architecture.md]
- [Previous Story: 7-5-create-duplicate-detection.md]
- [Source: task-manager-server/src/services/ai/AIService.ts]
- [Source: task-manager-server/src/services/ai/DuplicateDetector.ts]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

