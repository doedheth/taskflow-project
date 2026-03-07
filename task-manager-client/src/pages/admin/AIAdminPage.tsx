/**
 * AI Admin Page
 *
 * Admin dashboard for AI usage monitoring, performance metrics,
 * and feature configuration.
 *
 * Story 7.9: Implement AI Admin Controls & Analytics
 */

import React, { useState } from 'react';
import {
  Bot,
  BarChart3,
  Settings,
  AlertTriangle,
  DollarSign,
  Users,
  Zap,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Key,
} from 'lucide-react';
import {
  useAIAdminStats,
  useAIPerformanceMetrics,
  useAICostSummary,
  useAIFeatureToggles,
  useUpdateFeatureToggles,
  useAIErrors,
  getFeatureDisplayName,
  getRoleDisplayName,
  formatCost,
  formatNumber,
  AIFeatureUsage,
  AIFeatureToggle,
} from '../../hooks/useAIAdmin';
import { APIKeyManager } from './components/APIKeyManager';

// ============================================
// Sub-components
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'blue' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-status-success/10 text-status-success',
    yellow: 'bg-status-warning/10 text-status-warning',
    red: 'bg-status-error/10 text-status-error',
    purple: 'bg-accent/10 text-accent',
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">{title}</p>
          <p className="text-2xl font-bold mt-1 text-text-primary">{value}</p>
          {trend && (
            <p className="text-xs text-text-muted mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Usage Stats Component
// ============================================

const UsageStatsSection: React.FC<{ data: AIFeatureUsage[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Belum ada data penggunaan AI
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Fitur
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Total Panggilan
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Total Token
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Biaya
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Avg Response
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Success Rate
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((feature) => (
            <tr key={feature.feature} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {getFeatureDisplayName(feature.feature)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                {formatNumber(feature.totalCalls)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                {formatNumber(feature.totalTokens)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                {formatCost(feature.totalCost)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                {feature.avgResponseTime}ms
              </td>
              <td className="px-4 py-3 text-sm text-right">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    feature.successRate >= 95
                      ? 'bg-green-100 text-green-800'
                      : feature.successRate >= 80
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {feature.successRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// Feature Toggles Component
// ============================================

interface FeatureTogglesProps {
  features: string[];
  toggles: AIFeatureToggle[];
  onUpdate: (updates: Array<{ feature: string; role: string; enabled: boolean }>) => void;
  isUpdating: boolean;
}

const FeatureTogglesSection: React.FC<FeatureTogglesProps> = ({
  features,
  toggles,
  onUpdate,
  isUpdating,
}) => {
  const roles = ['admin', 'manager', 'supervisor', 'technician', 'operator', 'member'];

  const getToggleValue = (feature: string, role: string): boolean => {
    const toggle = toggles.find((t) => t.feature === feature && t.role === role);
    return toggle?.enabled ?? true;
  };

  const handleToggle = (feature: string, role: string, currentValue: boolean) => {
    onUpdate([{ feature, role, enabled: !currentValue }]);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
              Fitur
            </th>
            {roles.map((role) => (
              <th
                key={role}
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
              >
                {getRoleDisplayName(role)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {features.map((feature) => (
            <tr key={feature} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                {getFeatureDisplayName(feature)}
              </td>
              {roles.map((role) => {
                const enabled = getToggleValue(feature, role);
                return (
                  <td key={role} className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(feature, role, enabled)}
                      disabled={isUpdating}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        enabled ? 'bg-green-500' : 'bg-gray-300'
                      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                          enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

const AIAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'toggles' | 'errors' | 'apikey'>('overview');
  const [days, setDays] = useState(30);

  // Queries
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useAIAdminStats(days);
  const { data: metricsData, isLoading: metricsLoading } = useAIPerformanceMetrics();
  const { data: costData, isLoading: costLoading } = useAICostSummary();
  const { data: togglesData, isLoading: togglesLoading } = useAIFeatureToggles();
  const { data: errorsData, isLoading: errorsLoading } = useAIErrors(20);

  // Mutations
  const updateToggles = useUpdateFeatureToggles();

  const stats = statsData?.data;
  const metrics = metricsData?.data;
  const cost = costData?.data;
  const toggles = togglesData?.data;
  const errors = errorsData?.data;

  const isLoading = statsLoading || metricsLoading || costLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Monitor dan kontrol fitur AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={7}>7 Hari</option>
            <option value={30}>30 Hari</option>
            <option value={90}>90 Hari</option>
          </select>
          <button
            onClick={() => refetchStats()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'usage', label: 'Penggunaan', icon: Zap },
          { key: 'toggles', label: 'Feature Toggles', icon: Settings },
          { key: 'apikey', label: 'API Key', icon: Key },
          { key: 'errors', label: 'Errors', icon: AlertTriangle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Panggilan"
                  value={formatNumber(metrics?.totalCalls || 0)}
                  icon={<Zap className="w-5 h-5" />}
                  trend={`${days} hari terakhir`}
                  color="blue"
                />
                <StatCard
                  title="Success Rate"
                  value={`${metrics?.successRate || 0}%`}
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="Avg Response"
                  value={`${metrics?.avgResponseTime || 0}ms`}
                  icon={<Clock className="w-5 h-5" />}
                  color="purple"
                />
                <StatCard
                  title="Error Rate"
                  value={`${metrics?.errorRate || 0}%`}
                  icon={<XCircle className="w-5 h-5" />}
                  color="red"
                />
              </div>

              {/* Cost Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Ringkasan Biaya
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Hari Ini</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCost(cost?.todayCost || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatNumber(cost?.todayTokens || 0)} tokens
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-500">Minggu Ini</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCost(cost?.weekCost || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatNumber(cost?.weekTokens || 0)} tokens
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-500">Bulan Ini</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCost(cost?.monthCost || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatNumber(cost?.monthTokens || 0)} tokens
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Users */}
              {stats?.topUsers && stats.topUsers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Top Users
                  </h3>
                  <div className="space-y-3">
                    {stats.topUsers.slice(0, 5).map((user, index) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium">{user.userName || `User #${user.userId}`}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatNumber(user.totalCalls)} panggilan</p>
                          <p className="text-xs text-gray-500">
                            {formatNumber(user.totalTokens)} tokens
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Penggunaan per Fitur
              </h3>
              <UsageStatsSection data={stats?.byFeature || []} />
            </div>
          )}

          {/* Feature Toggles Tab */}
          {activeTab === 'toggles' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Feature Toggles per Role
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Kontrol fitur AI yang tersedia untuk setiap role pengguna
              </p>
              {togglesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <FeatureTogglesSection
                  features={toggles?.features || []}
                  toggles={toggles?.toggles || []}
                  onUpdate={(updates) => updateToggles.mutate(updates)}
                  isUpdating={updateToggles.isPending}
                />
              )}
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Error Terbaru
              </h3>
              {errorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : errors && errors.length > 0 ? (
                <div className="space-y-3">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className="p-4 bg-red-50 border border-red-100 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-red-800">
                            {getFeatureDisplayName(error.feature)}
                          </p>
                          <p className="text-sm text-red-600 mt-1">{error.errorMessage}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{error.userName}</p>
                          <p>{new Date(error.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>Tidak ada error terbaru</p>
                </div>
              )}
            </div>
          )}

          {/* API Key Tab */}
          {activeTab === 'apikey' && (
            <div className="max-w-2xl">
              <APIKeyManager />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIAdminPage;
