/**
 * PDF Generator Utility for AI Reports
 *
 * Uses browser print functionality for PDF generation
 * This approach avoids additional dependencies while still providing PDF export
 */

import { GeneratedReport } from '../hooks/useAIReport';

/**
 * Generate a printable HTML content and trigger browser print dialog
 */
export function printReportAsPDF(report: GeneratedReport): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up diblokir. Izinkan pop-up untuk mencetak laporan.');
    return;
  }

  const htmlContent = generatePrintableHTML(report);
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Download report as HTML file
 */
export function downloadReportAsHTML(report: GeneratedReport): void {
  const htmlContent = generatePrintableHTML(report);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `laporan-maintenance-${report.period_label.replace(/\s+/g, '-').toLowerCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate printable HTML content
 */
function generatePrintableHTML(report: GeneratedReport): string {
  const { metrics, top_issues, recommendations, team_highlights } = report;

  const trendArrow = (direction: string, isPositive: boolean) => {
    const color = isPositive ? 'green' : 'red';
    if (direction === 'up') return `<span style="color: ${color}">↑</span>`;
    if (direction === 'down') return `<span style="color: ${color}">↓</span>`;
    return '<span style="color: gray">→</span>';
  };

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Maintenance - ${report.period_label}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3B82F6;
    }
    .header h1 { font-size: 24px; color: #1E40AF; margin-bottom: 5px; }
    .header .period { font-size: 18px; color: #374151; }
    .header .date { font-size: 11px; color: #6B7280; margin-top: 5px; }
    .section { margin-bottom: 25px; }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #1E40AF;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #E5E7EB;
    }
    .summary { white-space: pre-wrap; line-height: 1.8; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    th, td {
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #E5E7EB;
    }
    th {
      background-color: #F3F4F6;
      font-weight: 600;
      color: #374151;
    }
    .text-right { text-align: right; }
    .recommendation {
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 4px solid;
    }
    .recommendation.high { background: #FEE2E2; border-color: #EF4444; }
    .recommendation.medium { background: #FEF3C7; border-color: #F59E0B; }
    .recommendation.low { background: #D1FAE5; border-color: #10B981; }
    .recommendation-title { font-weight: 600; margin-bottom: 5px; }
    .team-stats {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }
    .stat-box {
      flex: 1;
      padding: 10px;
      background: #F3F4F6;
      border-radius: 6px;
      text-align: center;
    }
    .stat-value { font-size: 20px; font-weight: 700; color: #1E40AF; }
    .stat-label { font-size: 11px; color: #6B7280; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      font-size: 10px;
      color: #9CA3AF;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Laporan Maintenance</h1>
    <div class="period">${report.period_label}</div>
    <div class="date">Generated: ${new Date(report.generated_at).toLocaleString('id-ID')}</div>
  </div>

  <div class="section">
    <div class="section-title">📊 Ringkasan Eksekutif</div>
    <div class="summary">${report.executive_summary}</div>
  </div>

  <div class="section">
    <div class="section-title">📈 Metrik Kinerja</div>
    <table>
      <thead>
        <tr>
          <th>Metrik</th>
          <th class="text-right">Periode Ini</th>
          <th class="text-right">Periode Lalu</th>
          <th class="text-right">Trend</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total Work Order</td>
          <td class="text-right">${metrics.current_period.total_work_orders}</td>
          <td class="text-right">${metrics.previous_period.total_work_orders}</td>
          <td class="text-right">${metrics.trend.find(t => t.metric.includes('Total'))
            ? trendArrow(metrics.trend.find(t => t.metric.includes('Total'))!.direction, metrics.trend.find(t => t.metric.includes('Total'))!.is_positive)
            : '-'}</td>
        </tr>
        <tr>
          <td>WO Selesai</td>
          <td class="text-right">${metrics.current_period.completed_work_orders}</td>
          <td class="text-right">${metrics.previous_period.completed_work_orders}</td>
          <td class="text-right">${metrics.trend.find(t => t.metric.includes('Completed'))
            ? trendArrow(metrics.trend.find(t => t.metric.includes('Completed'))!.direction, metrics.trend.find(t => t.metric.includes('Completed'))!.is_positive)
            : '-'}</td>
        </tr>
        <tr>
          <td>PM Compliance</td>
          <td class="text-right">${metrics.current_period.pm_compliance_rate}%</td>
          <td class="text-right">${metrics.previous_period.pm_compliance_rate}%</td>
          <td class="text-right">${metrics.trend.find(t => t.metric.includes('PM'))
            ? trendArrow(metrics.trend.find(t => t.metric.includes('PM'))!.direction, metrics.trend.find(t => t.metric.includes('PM'))!.is_positive)
            : '-'}</td>
        </tr>
        <tr>
          <td>MTTR (jam)</td>
          <td class="text-right">${metrics.current_period.mttr_hours.toFixed(1)}</td>
          <td class="text-right">${metrics.previous_period.mttr_hours.toFixed(1)}</td>
          <td class="text-right">${metrics.trend.find(t => t.metric.includes('MTTR'))
            ? trendArrow(metrics.trend.find(t => t.metric.includes('MTTR'))!.direction, metrics.trend.find(t => t.metric.includes('MTTR'))!.is_positive)
            : '-'}</td>
        </tr>
        <tr>
          <td>MTBF (jam)</td>
          <td class="text-right">${metrics.current_period.mtbf_hours.toFixed(1)}</td>
          <td class="text-right">${metrics.previous_period.mtbf_hours.toFixed(1)}</td>
          <td class="text-right">${metrics.trend.find(t => t.metric.includes('MTBF'))
            ? trendArrow(metrics.trend.find(t => t.metric.includes('MTBF'))!.direction, metrics.trend.find(t => t.metric.includes('MTBF'))!.is_positive)
            : '-'}</td>
        </tr>
        <tr>
          <td>Total Downtime (jam)</td>
          <td class="text-right">${metrics.current_period.downtime_hours.toFixed(1)}</td>
          <td class="text-right">${metrics.previous_period.downtime_hours.toFixed(1)}</td>
          <td class="text-right">${metrics.trend.find(t => t.metric.includes('Downtime'))
            ? trendArrow(metrics.trend.find(t => t.metric.includes('Downtime'))!.direction, metrics.trend.find(t => t.metric.includes('Downtime'))!.is_positive)
            : '-'}</td>
        </tr>
        <tr>
          <td>Jumlah Breakdown</td>
          <td class="text-right">${metrics.current_period.breakdown_count}</td>
          <td class="text-right">${metrics.previous_period.breakdown_count}</td>
          <td class="text-right">${metrics.trend.find(t => t.metric.includes('Breakdown'))
            ? trendArrow(metrics.trend.find(t => t.metric.includes('Breakdown'))!.direction, metrics.trend.find(t => t.metric.includes('Breakdown'))!.is_positive)
            : '-'}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${top_issues.length > 0 ? `
  <div class="section">
    <div class="section-title">⚠️ Top Issues</div>
    <table>
      <thead>
        <tr>
          <th>Issue</th>
          <th class="text-right">Kejadian</th>
          <th class="text-right">Persentase</th>
          <th class="text-right">Trend</th>
        </tr>
      </thead>
      <tbody>
        ${top_issues.map(issue => `
          <tr>
            <td>${issue.issue}</td>
            <td class="text-right">${issue.count}</td>
            <td class="text-right">${issue.percentage}%</td>
            <td class="text-right">${
              issue.trend === 'up' ? '<span style="color: red">↑</span>' :
              issue.trend === 'down' ? '<span style="color: green">↓</span>' : '→'
            }</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${recommendations.length > 0 ? `
  <div class="section">
    <div class="section-title">💡 Rekomendasi AI</div>
    ${recommendations.map(rec => `
      <div class="recommendation ${rec.priority}">
        <div class="recommendation-title">[${rec.priority.toUpperCase()}] ${rec.title}</div>
        <div>${rec.description}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">👥 Performa Tim</div>
    <div class="team-stats">
      <div class="stat-box">
        <div class="stat-value">${team_highlights.completion_rate}%</div>
        <div class="stat-label">Tingkat Penyelesaian</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${team_highlights.average_response_time}</div>
        <div class="stat-label">Rata-rata Response Time</div>
      </div>
    </div>
    ${team_highlights.top_performers.length > 0 ? `
    <div><strong>Top Performers:</strong></div>
    <ol style="margin-top: 5px; margin-left: 20px;">
      ${team_highlights.top_performers.map(m => `
        <li>${m.user_name} - ${m.completion_rate}% completion rate (${m.completion_count} WO)</li>
      `).join('')}
    </ol>
    ` : ''}
  </div>

  <div class="footer">
    <p>Laporan ini dihasilkan oleh AI Report Generator</p>
    <p>ProjectSAP Maintenance Management System</p>
  </div>
</body>
</html>
  `;
}

export default { printReportAsPDF, downloadReportAsHTML };
