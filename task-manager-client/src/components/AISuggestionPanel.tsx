import { useState } from 'react';
import { aiAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAIFeature, AI_FEATURES } from '../context/AIFeatureContext';
import {
  Sparkles,
  User,
  TrendingUp,
  Briefcase,
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Bot,
  Lightbulb,
  Brain,
  Lock,
} from 'lucide-react';

interface AISuggestion {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
  scores: {
    workload: number;
    expertise: number;
    department: number;
    priority: number;
    activity: number;
    final: number;
  };
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface GPTAnalysis {
  recommended_user_id: number;
  recommended_user_name: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  alternative_user_id?: number;
  alternative_user_name?: string;
  workload_warning?: boolean;
  tips?: string[];
}

interface AISuggestionPanelProps {
  ticketType: string;
  priority: string;
  departmentId: number | null;
  title: string;
  description: string;
  onSelectAssignee: (userId: number) => void;
  selectedAssignees: number[];
}

export default function AISuggestionPanel({
  ticketType,
  priority,
  departmentId,
  title,
  description,
  onSelectAssignee,
  selectedAssignees,
}: AISuggestionPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { isFeatureEnabled, isLoading: featureLoading } = useAIFeature();
  const isSmartAssignEnabled = isFeatureEnabled(AI_FEATURES.TASK_PRIORITIZATION);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [gptAnalysis, setGptAnalysis] = useState<GPTAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useGPT, setUseGPT] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Feature disabled message
  if (!featureLoading && !isSmartAssignEnabled) {
    return (
      <div className={`rounded-xl border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-400/20">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI Assignment Agent
              </h4>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Fitur ini tidak tersedia untuk role Anda
              </p>
            </div>
          </div>
        </div>
        <div className={`p-4 text-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">AI Smart Assignment tidak diaktifkan untuk role Anda.</p>
          <p className="text-xs mt-1 opacity-75">Hubungi admin untuk mengaktifkan fitur ini.</p>
        </div>
      </div>
    );
  }

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (useGPT) {
        // Use GPT-powered smart assignment
        const response = await aiAPI.smartAssign({
          ticket_type: ticketType,
          priority,
          department_id: departmentId,
          title,
          description,
        });
        
        setGptAnalysis(response.data.aiAnalysis);
        // Convert traditional suggestions to match format
        const formattedSuggestions = response.data.traditionalSuggestions?.map((s: any) => ({
          user: s.user,
          scores: { ...s.scores, workload: 0, expertise: 0, department: 0, priority: 0, activity: 0 },
          reasons: [],
          confidence: 'medium' as const
        })) || [];
        setSuggestions(formattedSuggestions);
      } else {
        // Use new AITaskPrioritizer service (Story 7.3)
        const response = await aiAPI.suggestTechnician({
          taskType: ticketType as 'work_order' | 'ticket',
          priority,
          departmentId: departmentId || undefined,
          title,
          assetId: undefined, // Could be passed if available in parent
        });

        // Map new service response to UI format
        const formattedSuggestions: AISuggestion[] = response.suggestions.map((s: any) => ({
          user: {
            id: s.userId,
            name: s.userName,
            email: '', // Not returned by new service for privacy/simplicity
            role: 'technician',
            avatar: null,
          },
          scores: {
            workload: Math.round(s.matchScore * 0.4), // Approximation for display
            expertise: s.skillMatch,
            department: 100,
            priority: 100,
            activity: 100,
            final: s.matchScore,
          },
          reasons: [s.reason, `Availability: ${s.estimatedAvailability}`],
          confidence: s.matchScore >= 80 ? 'high' : s.matchScore >= 60 ? 'medium' : 'low',
        }));

        setSuggestions(formattedSuggestions);
        setGptAnalysis(null);
      }
      setHasAnalyzed(true);
    } catch (err) {
      setError('Failed to get AI suggestions. Please try again.');
      console.error('AI suggestion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-gray-50 border-gray-200'}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI Assignment Agent
              </h4>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Smart assignee recommendations
              </p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
              isLoading
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                {hasAnalyzed ? 'Re-analyze' : 'Analyze'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setUseGPT(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              useGPT
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : isDark ? 'bg-dark-700 text-dark-400' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            GPT Powered
          </button>
          <button
            onClick={() => setUseGPT(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !useGPT
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : isDark ? 'bg-dark-700 text-dark-400' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Rule-Based
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm mb-4">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!hasAnalyzed && !isLoading && (
          <div className={`text-center py-6 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Click "Analyze" to get {useGPT ? 'GPT-powered' : 'rule-based'} assignee recommendations
            </p>
            <p className="text-xs mt-1 opacity-75">
              {useGPT 
                ? 'Using OpenAI GPT for intelligent context analysis' 
                : 'Based on workload, expertise, and department match'}
            </p>
          </div>
        )}

        {/* GPT Analysis Result */}
        {hasAnalyzed && gptAnalysis && (
          <div className={`mb-4 p-4 rounded-xl border ${
            isDark ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30' 
                   : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    GPT Recommendation
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getConfidenceColor(gptAnalysis.confidence)}`}>
                    {gptAnalysis.confidence} confidence
                  </span>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                  {gptAnalysis.reasoning}
                </p>
                
                {/* Recommended User */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => onSelectAssignee(gptAnalysis.recommended_user_id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      selectedAssignees.includes(gptAnalysis.recommended_user_id)
                        ? 'bg-blue-500 text-white'
                        : isDark 
                          ? 'bg-dark-700 hover:bg-dark-600 text-white' 
                          : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDark ? 'bg-dark-600' : 'bg-gray-200'
                    }`}>
                      {gptAnalysis.recommended_user_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{gptAnalysis.recommended_user_name}</span>
                    {selectedAssignees.includes(gptAnalysis.recommended_user_id) && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </button>
                  
                  {gptAnalysis.alternative_user_id && gptAnalysis.alternative_user_name && (
                    <button
                      onClick={() => onSelectAssignee(gptAnalysis.alternative_user_id!)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        selectedAssignees.includes(gptAnalysis.alternative_user_id)
                          ? 'bg-blue-500/50 text-white'
                          : isDark 
                            ? 'bg-dark-800 hover:bg-dark-700 text-dark-300' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="text-xs">Alternative:</span>
                      <span>{gptAnalysis.alternative_user_name}</span>
                    </button>
                  )}
                </div>

                {/* Tips */}
                {gptAnalysis.tips && gptAnalysis.tips.length > 0 && (
                  <div className={`flex flex-wrap gap-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    {gptAnalysis.tips.map((tip, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs">
                        <Lightbulb className="w-3 h-3 text-yellow-400" />
                        {tip}
                      </span>
                    ))}
                  </div>
                )}

                {gptAnalysis.workload_warning && (
                  <div className="flex items-center gap-2 mt-2 text-yellow-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    Team workload is high - consider distributing tasks carefully
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {hasAnalyzed && !gptAnalysis && suggestions.length === 0 && (
          <div className={`text-center py-6 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No suitable assignees found</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.user.id}
                className={`rounded-xl border transition-all ${
                  selectedAssignees.includes(suggestion.user.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : isDark
                    ? 'border-dark-700 hover:border-dark-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Main Row */}
                <div className="p-3 flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : index === 1
                      ? 'bg-gray-400/20 text-gray-400'
                      : index === 2
                      ? 'bg-orange-500/20 text-orange-400'
                      : isDark
                      ? 'bg-dark-700 text-dark-400'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isDark ? 'bg-dark-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {suggestion.user.avatar ? (
                      <img
                        src={suggestion.user.avatar}
                        alt={suggestion.user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      suggestion.user.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {suggestion.user.name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                        {suggestion.confidence}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {suggestion.user.email}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(suggestion.scores.final)}`}>
                      {suggestion.scores.final}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>score</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectAssignee(suggestion.user.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedAssignees.includes(suggestion.user.id)
                          ? 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-dark-700 text-white hover:bg-dark-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {selectedAssignees.includes(suggestion.user.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        'Assign'
                      )}
                    </button>
                    <button
                      onClick={() => setShowDetails(showDetails === suggestion.user.id ? null : suggestion.user.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-200'
                      }`}
                    >
                      {showDetails === suggestion.user.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {showDetails === suggestion.user.id && (
                  <div className={`px-3 pb-3 pt-0 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                    {/* Reasons */}
                    <div className="mt-3">
                      <p className={`text-xs font-medium mb-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        Why this person?
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestion.reasons.map((reason, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-lg text-xs ${
                              isDark ? 'bg-dark-700 text-dark-300' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {[
                        { label: 'Availability', value: suggestion.scores.workload, icon: Activity },
                        { label: 'Expertise', value: suggestion.scores.expertise, icon: TrendingUp },
                        { label: 'Dept Match', value: suggestion.scores.department, icon: Briefcase },
                        { label: 'Priority', value: suggestion.scores.priority, icon: AlertTriangle },
                        { label: 'Activity', value: suggestion.scores.activity, icon: Zap },
                      ].map((score) => (
                        <div key={score.label} className="text-center">
                          <score.icon className={`w-4 h-4 mx-auto mb-1 ${getScoreColor(score.value)}`} />
                          <div className={`h-1.5 rounded-full ${isDark ? 'bg-dark-700' : 'bg-gray-200'} overflow-hidden`}>
                            <div
                              className={`h-full rounded-full ${getScoreBarColor(score.value)}`}
                              style={{ width: `${score.value}%` }}
                            />
                          </div>
                          <p className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            {score.label}
                          </p>
                          <p className={`text-xs font-medium ${getScoreColor(score.value)}`}>
                            {score.value}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

