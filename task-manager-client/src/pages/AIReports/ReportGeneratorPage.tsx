import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Mail,
  RefreshCw,
  ChevronLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Loader2,
  History,
  Printer,
  X,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useAIReports,
  useReportDetail,
  GeneratedReport,
  ReportRecommendation,
  TrendIndicator,
  TopIssue,
} from '../../hooks/useAIReport';
import { printReportAsPDF, downloadReportAsHTML } from '../../utils/pdfGenerator';
import { aiAPI } from '../../services/api';

// ============================================
// Helper Components
// ============================================

function TrendIcon({ trend }: { trend: TrendIndicator }) {
  if (trend.direction === 'up') {
    return (
      <span className={`flex items-center gap-1 ${trend.is_positive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp size={14} />
        <span>+{Math.abs(trend.change_percentage)}%</span>
      </span>
    );
  } else if (trend.direction === 'down') {
    return (
      <span className={`flex items-center gap-1 ${trend.is_positive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingDown size={14} />
        <span>-{Math.abs(trend.change_percentage)}%</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-gray-500">
      <Minus size={14} />
      <span>0%</span>
    </span>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };
  const labels = { high: 'Prioritas Tinggi', medium: 'Prioritas Sedang', low: 'Prioritas Rendah' };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[priority]}`}>
      {labels[priority]}
    </span>
  );
}

// ============================================
// Section Components
// ============================================

// Email Modal Component
function EmailModal({
  report,
  onClose,
}: {
  report: GeneratedReport;
  onClose: () => void;
}) {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState(`Laporan Maintenance - ${report.period_label}`);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!recipients.trim()) {
      setError('Masukkan minimal satu email penerima');
      return;
    }

    // Validate email format
    const emailList = recipients.split(',').map(e => e.trim()).filter(e => e);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(e => !emailRegex.test(e));

    if (invalidEmails.length > 0) {
      setError(`Email tidak valid: ${invalidEmails.join(', ')}`);
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await aiAPI.emailReport(report.id, {
        recipients: emailList,
        subject,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengirim email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface-elevated rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Kirim Laporan via Email
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-text-primary font-medium">Email berhasil dikirim!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Penerima (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="email1@company.com, email2@company.com"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-surface p-3 rounded-lg">
                <p className="text-sm text-text-secondary">
                  Laporan <strong>{report.period_label}</strong> akan dilampirkan dalam email.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Kirim
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ExecutiveSummarySection({ summary }: { summary: string }) {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-blue-500" size={20} />
        <h3 className="text-lg font-semibold text-text-primary">Ringkasan Eksekutif</h3>
      </div>
      <div className="prose prose-sm max-w-none text-text-secondary whitespace-pre-wrap">
        {summary}
      </div>
    </div>
  );
}

function MetricsTable({ report }: { report: GeneratedReport }) {
  const { current_period, previous_period, trend } = report.metrics;

  const metrics = [
    { key: 'total_work_orders', label: 'Total Work Order', format: (v: number) => v.toString() },
    { key: 'completed_work_orders', label: 'WO Selesai', format: (v: number) => v.toString() },
    { key: 'pm_compliance_rate', label: 'PM Compliance', format: (v: number) => `${v}%` },
    { key: 'mttr_hours', label: 'MTTR (jam)', format: (v: number) => v.toFixed(1) },
    { key: 'mtbf_hours', label: 'MTBF (jam)', format: (v: number) => v.toFixed(1) },
    { key: 'downtime_hours', label: 'Total Downtime (jam)', format: (v: number) => v.toFixed(1) },
    { key: 'breakdown_count', label: 'Jumlah Breakdown', format: (v: number) => v.toString() },
  ];

  return (
    <div className="bg-surface-elevated rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="text-purple-500" size={20} />
        <h3 className="text-lg font-semibold text-text-primary">Metrik Kinerja</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-text-secondary">Metrik</th>
              <th className="text-right py-2 px-3 font-medium text-text-secondary">Periode Ini</th>
              <th className="text-right py-2 px-3 font-medium text-text-secondary">Periode Lalu</th>
              <th className="text-right py-2 px-3 font-medium text-text-secondary">Trend</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, idx) => {
              const currentVal = current_period[metric.key as keyof typeof current_period] as number;
              const prevVal = previous_period[metric.key as keyof typeof previous_period] as number;
              const trendData = trend.find(t => t.metric.toLowerCase().includes(metric.label.toLowerCase().split(' ')[0]));

              return (
                <tr key={metric.key} className={idx % 2 === 0 ? 'bg-surface' : ''}>
                  <td className="py-2 px-3 text-text-primary">{metric.label}</td>
                  <td className="py-2 px-3 text-right font-medium text-text-primary">
                    {metric.format(currentVal)}
                  </td>
                  <td className="py-2 px-3 text-right text-text-secondary">
                    {metric.format(prevVal)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {trendData ? (
                      <TrendIcon trend={trendData} />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopIssuesSection({ issues }: { issues: TopIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="bg-surface-elevated rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-orange-500" size={20} />
          <h3 className="text-lg font-semibold text-text-primary">Top Issues</h3>
        </div>
        <p className="text-text-secondary text-sm">Tidak ada issue yang tercatat untuk periode ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-orange-500" size={20} />
        <h3 className="text-lg font-semibold text-text-primary">Top Issues</h3>
      </div>
      <div className="space-y-3">
        {issues.map((issue, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">{issue.issue}</span>
                <span className="text-sm text-text-secondary">{issue.count} kejadian</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${issue.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-text-secondary w-10 text-right">
                  {issue.percentage}%
                </span>
              </div>
            </div>
            <div className="w-16 text-right">
              {issue.trend === 'up' && <TrendingUp size={14} className="inline text-red-500" />}
              {issue.trend === 'down' && <TrendingDown size={14} className="inline text-green-500" />}
              {issue.trend === 'stable' && <Minus size={14} className="inline text-gray-400" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsSection({
  recommendations,
  onAction,
}: {
  recommendations: ReportRecommendation[];
  onAction: (rec: ReportRecommendation) => void;
}) {
  const actionLabels: Record<string, string> = {
    create_wo: 'Buat Work Order',
    update_pm: 'Update PM Schedule',
    review_asset: 'Review Asset',
    other: 'Lihat Detail',
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-surface-elevated rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="text-yellow-500" size={20} />
          <h3 className="text-lg font-semibold text-text-primary">Rekomendasi AI</h3>
        </div>
        <p className="text-text-secondary text-sm">Tidak ada rekomendasi untuk periode ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-yellow-500" size={20} />
        <h3 className="text-lg font-semibold text-text-primary">Rekomendasi AI</h3>
      </div>
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`p-4 rounded-lg border ${
              rec.priority === 'high'
                ? 'bg-red-50 border-red-200'
                : rec.priority === 'medium'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <PriorityBadge priority={rec.priority} />
                </div>
                <h4 className="font-medium text-text-primary mb-1">{rec.title}</h4>
                <p className="text-sm text-text-secondary">{rec.description}</p>
              </div>
              <button
                onClick={() => onAction(rec)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                {actionLabels[rec.action_type] || 'Aksi'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamHighlightsSection({ report }: { report: GeneratedReport }) {
  const { team_highlights } = report;

  return (
    <div className="bg-surface-elevated rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-indigo-500" size={20} />
        <h3 className="text-lg font-semibold text-text-primary">Performa Tim</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-surface p-3 rounded-lg">
          <div className="text-2xl font-bold text-text-primary">{team_highlights.completion_rate}%</div>
          <div className="text-sm text-text-secondary">Tingkat Penyelesaian</div>
        </div>
        <div className="bg-surface p-3 rounded-lg">
          <div className="text-2xl font-bold text-text-primary">{team_highlights.average_response_time}</div>
          <div className="text-sm text-text-secondary">Rata-rata Response Time</div>
        </div>
        <div className="bg-surface p-3 rounded-lg">
          <div className="text-2xl font-bold text-text-primary">{team_highlights.top_performers.length}</div>
          <div className="text-sm text-text-secondary">Top Performers</div>
        </div>
      </div>

      {team_highlights.top_performers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">Top Performers:</h4>
          <div className="flex flex-wrap gap-2">
            {team_highlights.top_performers.map((member, idx) => (
              <div
                key={member.user_id}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full"
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                  idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                  idx === 1 ? 'bg-gray-300 text-gray-700' :
                  'bg-orange-300 text-orange-800'
                }`}>
                  {idx + 1}
                </span>
                <span className="text-sm text-text-primary">{member.user_name}</span>
                <span className="text-xs text-text-secondary">({member.completion_rate}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ReportGeneratorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const {
    reports,
    isLoadingList,
    generateReport,
    isGenerating,
    generatedReport,
    generateError,
    resetGeneration,
  } = useAIReports();

  const { data: reportDetailData, isLoading: isLoadingDetail } = useReportDetail(
    selectedReportId || 0,
    { enabled: selectedReportId !== null }
  );

  const activeReport = selectedReportId && reportDetailData?.report
    ? reportDetailData.report
    : generatedReport;

  // Check role permissions
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Akses Terbatas</h2>
          <p className="text-text-secondary">
            Fitur AI Report hanya tersedia untuk Manager dan Admin.
          </p>
        </div>
      </div>
    );
  }

  const handleGenerateReport = async () => {
    resetGeneration();
    setSelectedReportId(null);
    try {
      await generateReport({
        period_type: 'monthly',
        year: selectedYear,
        month: selectedMonth,
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleRecommendationAction = (rec: ReportRecommendation) => {
    switch (rec.action_type) {
      case 'create_wo':
        navigate('/work-orders?action=create');
        break;
      case 'update_pm':
        navigate('/maintenance-calendar');
        break;
      case 'review_asset':
        navigate('/assets');
        break;
      default:
        break;
    }
  };

  const handleSelectHistoryReport = (reportId: number) => {
    setSelectedReportId(reportId);
    resetGeneration();
    setShowHistory(false);
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-6 min-h-screen bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Laporan AI Maintenance</h1>
            <p className="text-sm text-text-secondary">
              Generate laporan maintenance komprehensif dengan analisis AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <History size={18} />
            Riwayat
          </button>
          {activeReport && (
            <>
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:bg-surface-elevated rounded-lg transition-colors"
              >
                <Mail size={18} />
                Email
              </button>
              <button
                onClick={() => printReportAsPDF(activeReport)}
                className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:bg-surface-elevated rounded-lg transition-colors"
              >
                <Printer size={18} />
                Print PDF
              </button>
              <button
                onClick={() => downloadReportAsHTML(activeReport)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Download size={18} />
                Download HTML
              </button>
            </>
          )}
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowHistory(false)} />
          <div className="relative w-80 bg-surface-elevated h-full shadow-xl p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Riwayat Laporan</h3>
            {isLoadingList ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : reports.length === 0 ? (
              <p className="text-sm text-text-secondary">Belum ada laporan.</p>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => handleSelectHistoryReport(report.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedReportId === report.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border hover:bg-surface'
                    }`}
                  >
                    <div className="font-medium text-text-primary">{report.period_label}</div>
                    <div className="text-xs text-text-secondary">
                      {new Date(report.generated_at).toLocaleDateString('id-ID')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-surface-elevated rounded-lg border border-border p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-secondary">Periode:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {monthNames.map((month, idx) => (
              <option key={idx} value={idx + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {generateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <span>Gagal generate laporan: {(generateError as Error).message}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isGenerating || isLoadingDetail) && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-text-secondary">
            {isGenerating
              ? 'Sedang menganalisis data dan generate laporan...'
              : 'Memuat laporan...'}
          </p>
          <p className="text-sm text-text-secondary mt-2">Proses ini mungkin memakan waktu 10-30 detik</p>
        </div>
      )}

      {/* Report Content */}
      {activeReport && !isGenerating && !isLoadingDetail && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Laporan Maintenance - {activeReport.period_label}
              </h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                <Clock size={14} />
                Generated: {new Date(activeReport.generated_at).toLocaleString('id-ID')}
              </div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>

          {/* Report Sections */}
          <ExecutiveSummarySection summary={activeReport.executive_summary} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricsTable report={activeReport} />
            <TopIssuesSection issues={activeReport.top_issues} />
          </div>

          <RecommendationsSection
            recommendations={activeReport.recommendations}
            onAction={handleRecommendationAction}
          />

          <TeamHighlightsSection report={activeReport} />
        </div>
      )}

      {/* Empty State */}
      {!activeReport && !isGenerating && !isLoadingDetail && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Belum Ada Laporan
          </h3>
          <p className="text-text-secondary max-w-md mb-6">
            Pilih periode dan klik "Generate Report" untuk membuat laporan maintenance
            komprehensif dengan analisis AI.
          </p>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && activeReport && (
        <EmailModal
          report={activeReport}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
