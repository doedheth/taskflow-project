import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Sparkles,
  MessageSquare,
  PenTool,
  UserCheck,
  Target,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Settings,
  Save,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  Shield,
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AIUsageStats {
  today: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalTokens: number;
    estimatedCost: number;
    avgResponseTime: number;
  };
  thisMonth: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalTokens: number;
    estimatedCost: number;
  };
  byEndpoint: Array<{
    endpoint: string;
    calls: number;
    tokens: number;
    cost: number;
  }>;
  byUser: Array<{
    userId: number;
    userName: string;
    calls: number;
    tokens: number;
  }>;
  recentErrors: Array<{
    id: number;
    userId: number;
    userName: string;
    endpoint: string;
    errorMessage: string;
    createdAt: string;
  }>;
}

interface AISetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
}

export default function AISettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch AI settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const response = await aiAPI.getSettings();
      return response.data as AISetting[];
    },
    enabled: user?.role === 'admin',
  });

  // Fetch AI usage stats
  const { data: usageStats, refetch: refetchStats } = useQuery({
    queryKey: ['ai-usage-stats'],
    queryFn: async () => {
      const response = await aiAPI.getUsageStats();
      return response.data as AIUsageStats;
    },
    enabled: ['admin', 'manager'].includes(user?.role || ''),
    refetchInterval: 60000, // Refresh every minute
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      await aiAPI.updateSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      setHasChanges(false);
      setEditedSettings({});
    },
  });

  // Initialize edited settings when data loads
  useEffect(() => {
    if (settingsData) {
      const initial: Record<string, string> = {};
      settingsData.forEach(s => {
        initial[s.setting_key] = s.setting_value;
      });
      setEditedSettings(initial);
    }
  }, [settingsData]);

  const handleSettingChange = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(editedSettings);
  };

  // Check admin access
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Akses Terbatas</h2>
          <p className="text-text-muted">Halaman ini hanya dapat diakses oleh Admin atau Manager</p>
        </div>
      </div>
    );
  }

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      ai_enabled: 'AI Master Switch',
      ai_chatbot_enabled: 'AI Chatbot',
      ai_writing_assistant_enabled: 'AI Writing Assistant',
      ai_smart_assignment_enabled: 'AI Smart Assignment',
      ai_priority_recommendations_enabled: 'AI Priority Recommendations',
      ai_rate_limit_per_user_per_hour: 'Rate Limit per User/Hour',
      ai_rate_limit_per_day: 'Global Rate Limit per Day',
      ai_model_default: 'Default AI Model',
      ai_max_tokens_per_request: 'Max Tokens per Request',
      ai_allowed_roles: 'Allowed Roles',
    };
    return labels[key] || key;
  };

  const getSettingIcon = (key: string) => {
    const icons: Record<string, JSX.Element> = {
      ai_enabled: <Bot className="w-5 h-5" />,
      ai_chatbot_enabled: <MessageSquare className="w-5 h-5" />,
      ai_writing_assistant_enabled: <PenTool className="w-5 h-5" />,
      ai_smart_assignment_enabled: <UserCheck className="w-5 h-5" />,
      ai_priority_recommendations_enabled: <Target className="w-5 h-5" />,
    };
    return icons[key] || <Settings className="w-5 h-5" />;
  };

  const isBooleanSetting = (key: string): boolean => {
    return ['ai_enabled', 'ai_chatbot_enabled', 'ai_writing_assistant_enabled', 'ai_smart_assignment_enabled', 'ai_priority_recommendations_enabled'].includes(key);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">AI Settings</h1>
            <p className="text-sm text-text-muted">Kelola fitur AI dan monitor penggunaan</p>
          </div>
        </div>
        {user?.role === 'admin' && hasChanges && (
          <button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateSettingsMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Perubahan
          </button>
        )}
      </div>

      {/* Stats Overview */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border-subtle rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">API Calls Hari Ini</span>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{usageStats.today.totalCalls}</div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-status-success flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {usageStats.today.successfulCalls}
              </span>
              <span className="text-status-error flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {usageStats.today.failedCalls}
              </span>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Tokens Hari Ini</span>
              <BarChart3 className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {usageStats.today.totalTokens.toLocaleString()}
            </div>
            <div className="text-xs text-text-muted mt-1">
              ~${usageStats.today.estimatedCost.toFixed(4)} estimated cost
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Avg Response Time</span>
              <Clock className="w-4 h-4 text-status-warning" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{usageStats.today.avgResponseTime}ms</div>
            <div className="text-xs text-text-muted mt-1">Rata-rata waktu respons</div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Bulan Ini</span>
              <TrendingUp className="w-4 h-4 text-status-info" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{usageStats.thisMonth.totalCalls}</div>
            <div className="text-xs text-text-muted mt-1">
              {usageStats.thisMonth.totalTokens.toLocaleString()} tokens
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Toggles (Admin Only) */}
        {user?.role === 'admin' && (
          <div className="bg-surface border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Feature Toggles
            </h2>
            {settingsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-surface-elevated rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {settingsData
                  ?.filter(s => isBooleanSetting(s.setting_key))
                  .map(setting => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${editedSettings[setting.setting_key] === 'true' ? 'bg-primary/10 text-primary' : 'bg-surface text-text-muted'}`}>
                          {getSettingIcon(setting.setting_key)}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{getSettingLabel(setting.setting_key)}</div>
                          <div className="text-xs text-text-muted">{setting.description}</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleSettingChange(
                            setting.setting_key,
                            editedSettings[setting.setting_key] === 'true' ? 'false' : 'true'
                          )
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          editedSettings[setting.setting_key] === 'true'
                            ? 'bg-primary'
                            : 'bg-border'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            editedSettings[setting.setting_key] === 'true'
                              ? 'translate-x-7'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Rate Limits & Config (Admin Only) */}
        {user?.role === 'admin' && (
          <div className="bg-surface border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Rate Limits & Configuration
            </h2>
            {settingsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-surface-elevated rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {settingsData
                  ?.filter(s => !isBooleanSetting(s.setting_key))
                  .map(setting => (
                    <div key={setting.id} className="p-3 bg-surface-elevated rounded-lg">
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        {getSettingLabel(setting.setting_key)}
                      </label>
                      <p className="text-xs text-text-muted mb-2">{setting.description}</p>
                      <input
                        type={setting.setting_key.includes('limit') || setting.setting_key.includes('tokens') ? 'number' : 'text'}
                        value={editedSettings[setting.setting_key] || ''}
                        onChange={e => handleSettingChange(setting.setting_key, e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Usage by Endpoint */}
        {usageStats && usageStats.byEndpoint.length > 0 && (
          <div className="bg-surface border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-status-info" />
              Usage by Endpoint
            </h2>
            <div className="space-y-3">
              {usageStats.byEndpoint.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                  <div>
                    <div className="font-medium text-text-primary text-sm">{item.endpoint}</div>
                    <div className="text-xs text-text-muted">{item.tokens.toLocaleString()} tokens</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">{item.calls}</div>
                    <div className="text-xs text-text-muted">calls</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Users */}
        {usageStats && usageStats.byUser.length > 0 && (
          <div className="bg-surface border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Top Users (Bulan Ini)
            </h2>
            <div className="space-y-3">
              {usageStats.byUser.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary text-sm">{item.userName || `User #${item.userId}`}</div>
                      <div className="text-xs text-text-muted">{item.tokens.toLocaleString()} tokens</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">{item.calls}</div>
                    <div className="text-xs text-text-muted">calls</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Errors */}
      {usageStats && usageStats.recentErrors.length > 0 && (
        <div className="bg-surface border border-border-subtle rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-status-error" />
            Recent Errors
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-text-muted font-medium">User</th>
                  <th className="text-left py-2 px-3 text-text-muted font-medium">Endpoint</th>
                  <th className="text-left py-2 px-3 text-text-muted font-medium">Error</th>
                  <th className="text-left py-2 px-3 text-text-muted font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {usageStats.recentErrors.map(error => (
                  <tr key={error.id} className="border-b border-border-subtle/50 hover:bg-surface-elevated">
                    <td className="py-2 px-3 text-text-primary">{error.userName || `User #${error.userId}`}</td>
                    <td className="py-2 px-3 text-text-secondary">{error.endpoint}</td>
                    <td className="py-2 px-3 text-status-error text-xs max-w-xs truncate">{error.errorMessage}</td>
                    <td className="py-2 px-3 text-text-muted text-xs">
                      {new Date(error.createdAt).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {usageStats && usageStats.today.totalCalls === 0 && usageStats.thisMonth.totalCalls === 0 && (
        <div className="bg-surface border border-border-subtle rounded-xl p-12 text-center">
          <Bot className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Belum Ada Data Penggunaan</h3>
          <p className="text-text-muted">Data penggunaan AI akan muncul di sini setelah fitur AI digunakan.</p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={() => refetchStats()}
          className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>
    </div>
  );
}
