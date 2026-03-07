/**
 * AI Type Definitions
 */

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  conversationId?: string;
  toolsUsed?: string[];
}

// ============================================
// Smart Assignment Types
// ============================================

export interface AssignmentRecommendation {
  user_id: number;
  user_name: string;
  score: number;
  reasons: string[];
}

export interface SmartAssignmentRequest {
  ticket_id?: number; // Optional - may not exist when creating new ticket
  title: string;
  description?: string;
  type: string;
  priority: string;
  department_id?: number;
}

export interface SmartAssignmentResponse {
  success: boolean;
  recommendations: AssignmentRecommendation[];
  analysis?: string;
}

// ============================================
// Writing Assistant Types
// ============================================

export type WritingType =
  | 'ticket_title'
  | 'ticket_description'
  | 'wo_description'
  | 'comment'
  | 'solution'
  | 'report';

export interface WritingContext {
  ticket?: {
    id: number;
    ticket_number: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    recent_comments?: string[];
  };
  asset?: {
    id: number;
    name: string;
    code: string;
    category?: string;
    specifications?: string;
  };
  workOrder?: {
    id: number;
    wo_number: string;
    title: string;
    status: string;
  };
  recentWorkOrders?: Array<{
    wo_number: string;
    title: string;
    status: string;
    root_cause?: string;
    solution?: string;
  }>;
  commonIssues?: string[];
}

export interface WriteAssistRequest {
  prompt: string;
  type?: WritingType;
  context?: string;
  ticket_id?: number;
  asset_id?: number;
  work_order_id?: number;
  richContext?: WritingContext;
}

export interface WriteAssistResponse {
  success: boolean;
  result: string;
  type?: WritingType;
}

// ============================================
// AI Tool Types
// ============================================

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================
// Conversation Types
// ============================================

export interface Conversation {
  id: string;
  user_id: number;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Analysis Types
// ============================================

export interface WorkloadAnalysis {
  user_id: number;
  user_name: string;
  total_assigned: number;
  in_progress: number;
  completed_this_week: number;
  avg_completion_days: number;
}

export interface TeamCapacityAnalysis {
  team: WorkloadAnalysis[];
  recommendations: string[];
}

// ============================================
// Quick Action Types
// ============================================

export interface AIQuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  category?: string;
}

export const DEFAULT_QUICK_ACTIONS: AIQuickAction[] = [
  { id: 'status', label: '📊 Status Proyek', prompt: 'Berikan ringkasan status proyek saat ini' },
  {
    id: 'overdue',
    label: '⏰ Tiket Terlambat',
    prompt: 'Tampilkan tiket yang terlambat atau mendekati deadline',
  },
  { id: 'workload', label: '👥 Beban Kerja Tim', prompt: 'Analisis beban kerja tim saat ini' },
  { id: 'pending_wo', label: '🔧 WO Pending', prompt: 'Tampilkan work order yang belum selesai' },
  { id: 'downtime', label: '⬇️ Analisis Downtime', prompt: 'Berikan analisis downtime minggu ini' },
];

// ============================================
// Task Prioritization Types (Story 7.3)
// ============================================

export interface PriorityScoreBreakdown {
  dueDate: { score: number; weight: number; reason: string };
  machineCriticality: { score: number; weight: number; reason: string };
  issueSeverity: { score: number; weight: number; reason: string };
  cumulativeDowntime: { score: number; weight: number; reason: string };
  dependencyChain: { score: number; weight: number; reason: string };
}

export interface TaskPriorityScore {
  taskId: number;
  taskType: 'work_order' | 'ticket';
  totalScore: number;
  breakdown: PriorityScoreBreakdown;
  overallReason: string;
  colorClass: string;
}

export interface PrioritizeTasksRequest {
  taskIds: number[];
  taskType: 'work_order' | 'ticket';
  userId?: number;
}

export interface PrioritizeTasksResponse {
  success: boolean;
  scores: TaskPriorityScore[];
  cachedAt?: string;
}

export interface TechnicianSuggestion {
  userId: number;
  userName: string;
  matchScore: number;
  reason: string;
  currentWorkload: number;
  skillMatch: number;
  estimatedAvailability: string;
}

export interface SuggestAssigneeRequest {
  taskType: 'work_order' | 'ticket';
  title: string;
  priority: string;
  assetId?: number;
  departmentId?: number;
}

export interface SuggestAssigneeResponse {
  success: boolean;
  suggestions: TechnicianSuggestion[];
}

// ============================================
// Smart Work Order Generation Types (Story 7.4)
// ============================================

export interface GenerateWORequest {
  description: string;
  asset_id?: number;
  wo_type?: 'preventive' | 'corrective' | 'emergency';
}

export interface GeneratedWOFields {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  wo_type: 'preventive' | 'corrective' | 'emergency';
  estimated_duration: number;
  category?: string;
}

export interface SimilarWO {
  id: number;
  wo_number: string;
  title: string;
  asset_name: string;
  similarity_reason: string;
  root_cause?: string;
  solution?: string;
}

export interface GenerateWOResponse {
  success: boolean;
  generated: GeneratedWOFields;
  technicianSuggestion?: {
    userId: number;
    userName: string;
    matchScore: number;
    reason: string;
  };
  similarWOs: SimilarWO[];
  aiIndicator: string;
  error?: string;
  warning?: string;
}

// ============================================
// Duplicate Detection Types (Story 7.5)
// ============================================

export interface CheckDuplicateRequest {
  text: string;              // Description to check
  type: 'ticket' | 'wo';     // Entity type
  asset_id?: number;         // Optional - boost score for same asset
  exclude_id?: number;       // Optional - exclude current entity when editing
}

export interface SimilarEntry {
  id: number;
  title: string;
  similarity_score: number;  // 0-100 percentage
  status: string;            // open, in_progress, resolved, closed, etc.
  created_at: string;
  entity_type: 'ticket' | 'wo';
  entity_number?: string;    // ticket_number or wo_number
}

export interface CheckDuplicateResponse {
  success: boolean;
  hasDuplicates: boolean;
  similar: SimilarEntry[];
  suggestion?: string;       // Context-aware suggestion message
  warning?: string;          // Error/warning message
}

// ============================================
// Predictive Maintenance Types (Story 7.6)
// ============================================

export interface PredictionSummary {
  id: number;
  machine_id: number;
  machine_name: string;
  asset_code?: string;
  risk_score: number;
  predicted_failure_window: string;
  confidence_level: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface PredictionFactorBreakdown {
  daysSinceLastPM: { value: number; score: number; };
  breakdownCount90Days: { value: number; score: number; };
  averageMTBF: { value: number; score: number; };
  machineAgeYears: { value: number; score: number; };
  patternMatchScore: { value: number; score: number; };
}

export interface PredictionSimilarIncident {
  date: string;
  description: string;
  resolution: string;
  similarity_score: number;
}

export interface PredictionRecommendation {
  priority: 'immediate' | 'short_term' | 'long_term';
  action: string;
  reasoning: string;
}

export interface PredictionDetail extends PredictionSummary {
  reasoning: string;
  factors: PredictionFactorBreakdown;
  similar_incidents: PredictionSimilarIncident[];
  recommendations: PredictionRecommendation[];
}

export interface GetPredictionsResponse {
  success: boolean;
  predictions: PredictionSummary[];
  total_high_risk: number;
  last_analysis_at: string | null;
}

export interface GetPredictionDetailResponse {
  success: boolean;
  prediction: PredictionDetail;
}

export interface PredictionFeedbackRequest {
  outcome: 'breakdown_occurred' | 'no_breakdown' | 'partial';
  notes?: string;
}

export interface PredictionFeedbackResponse {
  success: boolean;
  message: string;
}

// ============================================
// AI Report Generation Types (Story 7.7)
// ============================================

export interface ReportGenerationRequest {
  period_type: 'monthly' | 'weekly' | 'quarterly';
  year: number;
  month?: number;
  week?: number;
  quarter?: number;
}

export interface MetricSet {
  total_work_orders: number;
  completed_work_orders: number;
  pm_compliance_rate: number;
  mttr_hours: number;
  mtbf_hours: number;
  downtime_hours: number;
  breakdown_count: number;
}

export interface TrendIndicator {
  metric: string;
  change_percentage: number;
  direction: 'up' | 'down' | 'stable';
  is_positive: boolean;
}

export interface TopIssue {
  issue: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_type: 'create_wo' | 'update_pm' | 'review_asset' | 'other';
  action_data?: Record<string, unknown>;
}

export interface TeamMember {
  user_id: number;
  user_name: string;
  completion_count: number;
  completion_rate: number;
}

export interface TeamHighlights {
  top_performers: TeamMember[];
  completion_rate: number;
  average_response_time: string;
}

export interface GeneratedReport {
  id: number;
  period_type: string;
  period_label: string;
  generated_at: string;
  generated_by: number;
  executive_summary: string;
  metrics: {
    current_period: MetricSet;
    previous_period: MetricSet;
    trend: TrendIndicator[];
  };
  top_issues: TopIssue[];
  recommendations: ReportRecommendation[];
  team_highlights: TeamHighlights;
}

export interface ReportListItem {
  id: number;
  period_type: string;
  period_label: string;
  generated_at: string;
  generated_by: number;
}

export interface GenerateReportResponse {
  success: boolean;
  report?: GeneratedReport;
  error?: string;
}

export interface GetReportsResponse {
  success: boolean;
  reports: ReportListItem[];
}

export interface GetReportDetailResponse {
  success: boolean;
  report?: GeneratedReport;
  error?: string;
}

// ============================================
// Root Cause Analysis Types (Story 7.8)
// ============================================

export interface RCAAnalysisRequest {
  breakdown_id?: number;
  machine_id?: number;
  lookback_days?: number;
}

export interface SymptomEvent {
  date: string;
  event_type: 'warning' | 'breakdown' | 'repair' | 'pm';
  description: string;
}

export interface ContributingFactor {
  factor: string;
  weight: number;
  evidence: string;
}

export interface RCASimilarIncident {
  breakdown_id: number;
  date: string;
  description: string;
  resolution: string;
  similarity_score: number;
}

export interface RCARecommendation {
  id: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  action: string;
  reasoning: string;
  action_type: 'create_wo' | 'update_pm' | 'review_asset' | 'training' | 'other';
  action_data?: {
    wo_type?: string;
    wo_title?: string;
    pm_schedule_id?: number;
    asset_id?: number;
  };
}

export interface RCAAnalysis {
  id: number;
  breakdown_id?: number;
  machine_id: number;
  machine_name: string;
  probable_root_cause: string;
  confidence_level: 'low' | 'medium' | 'high';
  confidence_score: number;
  reasoning: {
    summary: string;
    symptom_progression: SymptomEvent[];
    contributing_factors: ContributingFactor[];
    historical_comparison: string;
  };
  similar_incidents: RCASimilarIncident[];
  recommendations: RCARecommendation[];
  analysis_metadata: {
    data_points_analyzed: number;
    breakdown_count: number;
    time_span_days: number;
  };
  created_at: string;
}

export interface RCASummary {
  id: number;
  machine_id: number;
  machine_name: string;
  probable_root_cause: string;
  confidence_level: 'low' | 'medium' | 'high';
  confidence_score: number;
  created_at: string;
}

export interface RCAFeedbackRequest {
  feedback_type: 'accurate' | 'inaccurate' | 'partial';
  actual_root_cause?: string;
  notes?: string;
}

export interface RCAFeedbackResponse {
  success: boolean;
  message: string;
}

export interface GetRCAResponse {
  success: boolean;
  analysis?: RCAAnalysis;
  error?: string;
}

export interface GetMachineRCASummaryResponse {
  success: boolean;
  analyses: RCASummary[];
  recurring_issues: string[];
  pattern_summary?: string;
}
