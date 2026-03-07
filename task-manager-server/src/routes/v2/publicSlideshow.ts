import express, { Request, Response } from 'express';
import db from '../../database/db';
import { solarService } from '../../services/SolarService';

const router = express.Router();

/**
 * GET /api/v2/public/slideshow
 * Returns aggregated data for the slideshow. Publicly accessible.
 */
router.get('/slideshow', async (req: Request, res: Response) => {
  console.log('[DEBUG] /api/v2/public/slideshow endpoint hit');
  try {
    // 1. Get enabled slide configurations
    const configs = db.prepare(`
      SELECT slide_type, duration_seconds
      FROM slideshow_configs
      WHERE enabled = 1
      ORDER BY slide_order ASC
    `).all() as any[];
    console.log('[DEBUG] Enabled slides:', configs.map(c => c.slide_type).join(', '));

    if (configs.length === 0) {
      console.log('[DEBUG] No enabled slides found');
      res.json({ slides: [] });
      return;
    }

    // 2. Fetch data for each enabled slide
    const slidesData = await Promise.all(configs.map(async (config) => {
      let data: any = {};

      console.log(`[DEBUG] Processing slide type: ${config.slide_type}`);
      switch (config.slide_type) {
        case 'kpi-summary':
          data = getKPISummary();
          break;
        case 'production':
          data = getProductionSummary();
          break;
        case 'maintenance':
          data = getMaintenanceMetrics();
          break;
        case 'downtime':
          data = getDowntimeData();
          break;
        case 'solar':
          data = await getSolarData();
          break;
        case 'team-performance':
          data = getTeamPerformance();
          break;
        case 'oee':
          data = getOEEData();
          break;
        case 'scada':
          data = getScadaData();
          break;
        case 'alerts':
          data = getAlerts();
          break;
        default:
          console.log(`[DEBUG] Unknown slide type: ${config.slide_type}`);
      }
      console.log(`[DEBUG] Slide ${config.slide_type} data keys:`, Object.keys(data));

      return {
        type: config.slide_type,
        duration: config.duration_seconds,
        data
      };
    }));

    console.log('[DEBUG] All slides processed, sending response');
    res.json({
      slides: slidesData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Public slideshow error:', error);
    res.status(500).json({ error: 'Failed to fetch slideshow data' });
  }
});

// --- Helper functions to aggregate data from existing tables ---
// These replicate logic from dashboard.ts but focused on what's needed for the TV display

function getKPISummary() {
  const woCompleted = db.prepare(`
    SELECT COUNT(*) as count FROM work_orders
    WHERE status = 'completed' AND strftime('%Y-%m', actual_end) = strftime('%Y-%m', 'now')
  `).get() as any;

  const ticketsResolved = db.prepare(`
    SELECT COUNT(*) as count FROM tickets
    WHERE status = 'done' AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')
  `).get() as any;

  const machineStats = db.prepare(`
    SELECT COUNT(*) as total, SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END) as operational,
           SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down
    FROM assets WHERE status != 'retired'
  `).get() as any;

  // Additional metrics
  const todayWO = db.prepare(`
    SELECT COUNT(*) as count FROM work_orders
    WHERE date(created_at) = date('now')
  `).get() as any;

  const criticalTickets = db.prepare(`
    SELECT COUNT(*) as count FROM tickets
    WHERE priority = 'critical' AND status != 'done'
  `).get() as any;

  // Sparkline data (last 7 days)
  const sparkline = db.prepare(`
    SELECT date(created_at) as name, COUNT(*) as value
    FROM work_orders
    WHERE created_at >= date('now', '-7 days')
    GROUP BY name
    ORDER BY name ASC
  `).all();

  // Weekly trend
  const weeklyTrend = db.prepare(`
    SELECT date(created_at) as name, COUNT(*) as value
    FROM work_orders
    WHERE created_at >= date('now', '-14 days')
    GROUP BY name
    ORDER BY name ASC
  `).all();

  // AI Insights
  const aiInsights = {
    status: (machineStats?.down || 0) > 0 ? 'warning' : 'optimal',
    recommendation: (machineStats?.down || 0) > 0 
      ? `${machineStats.down} mesin membutuhkan perhatian segera.`
      : 'Semua mesin beroperasi normal. Pertahankan performa!',
    efficiency_trend: woCompleted?.count > 100 ? 'increasing' : 'stable'
  };

  return {
    work_orders: woCompleted?.count || 0,
    tickets: ticketsResolved?.count || 0,
    uptime: machineStats?.total > 0 ? Math.round((machineStats.operational / machineStats.total) * 100) : 100,
    down_machines: machineStats?.down || 0,
    today_wo: todayWO?.count || 0,
    critical_tickets: criticalTickets?.count || 0,
    total_machines: machineStats?.total || 0,
    sparkline,
    weeklyTrend,
    aiInsights
  };
}

function getProductionSummary() {
  // Production stats for the last 14 days for more density
  const schedule = db.prepare(`
    SELECT date as name, COUNT(*) as value
    FROM production_schedule
    WHERE date >= date('now', '-14 days')
    GROUP BY date
    ORDER BY date ASC
  `).all();

  // Status breakdown
  const statusBreakdown = db.prepare(`
    SELECT status as name, COUNT(*) as value
    FROM production_schedule
    WHERE date >= date('now', '-7 days')
    GROUP BY status
  `).all();

  // Production efficiency
  const completedToday = db.prepare(`
    SELECT COUNT(*) as count FROM production_schedule
    WHERE date = date('now') AND status = 'completed'
  `).get() as any;

  const plannedToday = db.prepare(`
    SELECT COUNT(*) as count FROM production_schedule
    WHERE date = date('now')
  `).get() as any;

  const efficiency = plannedToday?.count > 0 
    ? Math.round((completedToday?.count / plannedToday?.count) * 100) 
    : 100;

  // Daily output trend
  const dailyOutput = db.prepare(`
    SELECT date as name, COUNT(*) as value
    FROM production_schedule
    WHERE status = 'completed' AND date >= date('now', '-7 days')
    GROUP BY date
    ORDER BY date ASC
  `).all();

  return { 
    schedule, 
    statusBreakdown,
    completed_today: completedToday?.count || 0,
    planned_today: plannedToday?.count || 0,
    efficiency,
    daily_output: dailyOutput
  };
}

function getMaintenanceMetrics() {
  const pending = db.prepare(`SELECT COUNT(*) as count FROM work_orders WHERE status = 'open'`).get() as any;
  const inProgress = db.prepare(`SELECT COUNT(*) as count FROM work_orders WHERE status = 'in_progress'`).get() as any;
  const overduePM = db.prepare(`
    SELECT COUNT(*) as count FROM maintenance_schedules
    WHERE is_active = 1 AND next_due < date('now')
  `).get() as any;

  const completedToday = db.prepare(`
    SELECT COUNT(*) as count FROM work_orders
    WHERE status = 'completed' AND date(actual_end) = date('now')
  `).get() as any;

  const typeBreakdown = db.prepare(`
    SELECT type as name, COUNT(*) as value
    FROM work_orders
    WHERE status != 'completed'
    GROUP BY type
  `).all();

  // Priority breakdown
  const priorityBreakdown = db.prepare(`
    SELECT priority as name, COUNT(*) as value
    FROM work_orders
    WHERE status != 'completed'
    GROUP BY priority
  `).all();

  // AI Insights
  const aiInsights = {
    status: (overduePM?.count || 0) > 0 ? 'critical' : (pending?.count || 0) > 10 ? 'warning' : 'optimal',
    recommendation: (overduePM?.count || 0) > 0 
      ? `${overduePM.count} PM overdue. Segera jadwalkan maintenance.`
      : (pending?.count || 0) > 10 
      ? 'Banyak WO pending. Review prioritas.'
      : 'Maintenance schedule berjalan optimal.',
    top_type: (typeBreakdown[0] as any)?.name || 'N/A'
  };

  return {
    pending: pending?.count || 0,
    inProgress: inProgress?.count || 0,
    overduePM: overduePM?.count || 0,
    completed_today: completedToday?.count || 0,
    typeBreakdown,
    priorityBreakdown,
    aiInsights
  };
}

function getDowntimeData() {
  const recentDowntime = db.prepare(`
    SELECT d.id, a.name as asset_name, d.duration_minutes, d.start_time, dc.name as classification
    FROM downtime_logs d
    LEFT JOIN assets a ON d.asset_id = a.id
    LEFT JOIN downtime_classifications dc ON d.classification_id = dc.id
    ORDER BY d.start_time DESC
    LIMIT 10
  `).all();

  // Get active downtimes (where end_time is NULL) - for countdown display
  const activeDowntime = db.prepare(`
    SELECT dl.id, dl.asset_id, a.asset_code, a.name as asset_name, 
           dl.start_time, dl.downtime_type, dl.reason,
           dc.name as classification_name, dc.counts_as_downtime,
           CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER) as duration_minutes
    FROM downtime_logs dl
    LEFT JOIN assets a ON dl.asset_id = a.id
    LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
    WHERE dl.end_time IS NULL
    ORDER BY dl.start_time DESC
    LIMIT 5
  `).all();

  const classificationBreakdown = db.prepare(`
    SELECT dc.name as name, SUM(dl.duration_minutes) as value
    FROM downtime_logs dl
    JOIN downtime_classifications dc ON dl.classification_id = dc.id
    WHERE dl.start_time >= date('now', '-7 days')
    GROUP BY dc.name
    ORDER BY value DESC
  `).all();

  // Calculate additional metrics
  const totalDowntime = classificationBreakdown.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
  const criticalCount = db.prepare(`
    SELECT COUNT(*) as count FROM downtime_logs d
    JOIN downtime_classifications dc ON d.classification_id = dc.id
    WHERE dc.name IN ('Technical', 'Quality') AND d.start_time >= date('now', '-7 days')
  `).get() as any;

  const avgDuration = totalDowntime > 0 && recentDowntime.length > 0 
    ? Math.round(totalDowntime / recentDowntime.length) 
    : 0;

  // Daily trend for chart
  const dailyTrend = db.prepare(`
    SELECT date(d.start_time) as name, SUM(d.duration_minutes) as value
    FROM downtime_logs d
    WHERE d.start_time >= date('now', '-7 days')
    GROUP BY date(d.start_time)
    ORDER BY name ASC
  `).all();

  // AI Insights for downtime
  const aiInsights = {
    status: totalDowntime > 60 ? 'critical' : totalDowntime > 30 ? 'warning' : 'optimal',
    recommendation: totalDowntime > 60 
      ? 'Multiple critical interruptions detected. Immediate maintenance required.'
      : totalDowntime > 30 
      ? 'Downtime elevated. Review maintenance schedules.'
      : 'System operating within normal parameters.',
    forecast: 'Predicted 2-3 more interruptions if PM not scheduled.',
    topIssue: (classificationBreakdown[0] as any)?.name || 'N/A'
  };

  return { 
    recentDowntime, 
    activeDowntime,
    classificationBreakdown,
    totalDowntime,
    criticalCount: criticalCount?.count || 0,
    avgDuration,
    dailyTrend,
    aiInsights
  };
}

async function getSolarData() {
  console.log('[DEBUG] getSolarData() - Fetching comprehensive data from Huawei API');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch real-time energy flow from Huawei FusionSolar API
    const realtimeData = await solarService.fetchEnergyFlow();
    console.log('[DEBUG] Realtime data received');

    // Fetch today's trend data (dimension 2 = Day - shows hourly data)
    const trendData = await solarService.fetchEnergyTrend(today, 2);
    console.log('[DEBUG] Trend data received');

    // Fetch comparison data (last 30 days) for chart
    const comparisonData = await solarService.getComparisonData(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      today
    );

    // Format trend data untuk slideshow chart
    const chartData = parseTrendData(trendData, comparisonData, 2);
    
    // Calculate metrics
    const totalYield = trendData?.totalProductPower || 
                       (Array.isArray(trendData?.productPower) ? trendData.productPower.reduce((a: number, b: any) => a + (parseFloat(b?.toString()) || 0), 0) : 0);

    // Calculate additional metrics
    const avgDailyYield = comparisonData.length > 0 
      ? comparisonData.reduce((sum: number, d: any) => sum + (d.product_power || 0), 0) / comparisonData.length
      : 0;
    
    const totalManualKwh = comparisonData.reduce((sum: number, d: any) => sum + (d.manual_kwh || 0), 0);
    const accuracy = totalManualKwh > 0 ? ((totalYield - totalManualKwh) / totalManualKwh * 100) : 0;
    const efficiency = Math.min(100, Math.max(0, 94 + (Math.random() * 6 - 3))); // Simulated 94-97%
    
    // CO2 savings (assume 0.9kg CO2 per kWh)
    const co2Savings = totalYield * 0.9;
    
    // Revenue calculation (Rp 1,500 per kWh)
    const pricePerKwh = 1500;
    const revenue = totalYield * pricePerKwh;
    const monthlyRevenue = avgDailyYield * pricePerKwh * 30;

    // Get status from realtime data
    const status = realtimeData?.deviceOnline ? 'online' : 'offline';
    const livePower = realtimeData?.pvPower || 0;

    // Peak hours calculation (hours with production > 50% of max)
    const maxPower = Math.max(...chartData.map((d: any) => d.value), 1);
    const peakHours = chartData.filter((d: any) => d.value > maxPower * 0.5).length;

    // Monthly comparison data for bar chart
    const monthlyComparison = comparisonData.slice(-7).map((d: any) => ({
      name: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' }),
      huawei: d.product_power || 0,
      lokal: d.manual_kwh || 0
    }));

    const result = {
      // Main metrics
      energy_yield: totalYield,
      power_output: livePower,
      status: status,
      revenue: revenue,
      monthly_revenue: monthlyRevenue,
      
      // Additional metrics
      efficiency: efficiency.toFixed(1),
      accuracy: accuracy.toFixed(1),
      co2_savings: co2Savings.toFixed(1),
      peak_hours: peakHours,
      avg_daily_yield: avgDailyYield.toFixed(1),
      total_manual_kwh: totalManualKwh,
      comparison_days: comparisonData.length,
      
      // Data for visualizations
      realtime: realtimeData,
      trend_response: {
        xAxis: trendData?.xAxis || [],
        productPower: trendData?.productPower || [],
        totalProductPower: totalYield
      },
      trend: chartData,
      monthly_comparison: monthlyComparison,
      
      // AI Insights (simulated based on data)
      ai_insights: {
        status: 'optimal',
        recommendation: totalYield > avgDailyYield ? 'Produksi hari ini di atas rata-rata. Sistem bekerja optimal!' : 'Produksi sesuai target. Pertahankan performa!',
        forecast: 'Cuaca cerah diperkirakan berlanjut. Target produksi dapat tercapai.',
        alerts: livePower > 0 ? [] : ['Sistem dalam mode standby - menunggu sunrise']
      }
    };
    
    console.log('[DEBUG] getSolarData() returning comprehensive data');
    return result;
  } catch (error) {
    console.error('[DEBUG] getSolarData() error:', error);
    // Fallback to basic data
    const current = db.prepare(`
      SELECT product_power as energy_yield, 0 as power_output, 'offline' as status
      FROM solar_energy_data
      ORDER BY date DESC
      LIMIT 1
    `).get() as any;

    const trend = db.prepare(`
      SELECT date as name, product_power as value, manual_kwh as manualValue
      FROM solar_energy_data
      WHERE date >= date('now', '-14 days')
      ORDER BY date ASC
    `).all();

    return {
      ...(current || { energy_yield: 0, power_output: 0, status: 'offline' }),
      trend,
      efficiency: '94.2',
      revenue: 0,
      ai_insights: {
        status: 'offline',
        recommendation: 'Sistem sedang tidak tersedia',
        forecast: '-',
        alerts: ['Koneksi dengan inverter terputus']
      }
    };
  }
}

// Helper function to parse trend data (same logic as /solar page)
function parseTrendData(trendData: any, comparisonData: any[], timeDimension: number) {
  if (!trendData?.xAxis?.length) return [];
  
  const labels = trendData.xAxis;
  const productPower = trendData.productPower;
  const values = typeof productPower === 'string' 
    ? productPower.split(',') 
    : (Array.isArray(productPower) ? productPower : []);

  return labels.map((label: string, index: number) => {
    const val = values[index];
    let name = label;
    const match = comparisonData?.find((d: any) => d.date === label || d.date.startsWith(label));

    if (timeDimension === 2 && label.includes(' ')) {
      try { name = label.split(' ')[1].substring(0, 5); } catch (e) { name = label; }
    }

    return {
      name: name,
      value: (val === '--' || val === undefined || val === null) ? 0 : parseFloat(val.toString()),
      manualValue: match?.manual_kwh || 0
    };
  }).filter((item: any) => timeDimension === 2 ? item.value > 0 : true);
}

function getTeamPerformance() {
  const performance = db.prepare(`
    SELECT u.name, u.avatar, COUNT(woa.work_order_id) as completed_count
    FROM users u
    LEFT JOIN work_order_assignees woa ON u.id = woa.user_id
    LEFT JOIN work_orders wo ON woa.work_order_id = wo.id
    WHERE wo.status = 'completed' AND u.role IN ('member', 'supervisor')
    GROUP BY u.id
    ORDER BY completed_count DESC
    LIMIT 5
  `).all();

  // Team stats
  const totalWo = db.prepare(`
    SELECT COUNT(*) as count FROM work_orders
    WHERE status = 'completed' AND strftime('%Y-%m', actual_end) = strftime('%Y-%m', 'now')
  `).get() as any;

  const completedToday = db.prepare(`
    SELECT COUNT(*) as count FROM work_orders
    WHERE status = 'completed' AND date(actual_end) = date('now')
  `).get() as any;

  // Weekly trend
  const weeklyTrend = db.prepare(`
    SELECT date(actual_end) as name, COUNT(*) as value
    FROM work_orders
    WHERE status = 'completed' AND actual_end >= date('now', '-7 days')
    GROUP BY date(actual_end)
    ORDER BY name ASC
  `).all();

  // Calculate average efficiency (simulated based on completion rate)
  const avgEfficiency = totalWo?.count > 0 ? Math.round(85 + Math.random() * 10) : 92;
  const avgRating = totalWo?.count > 0 ? (4 + Math.random()).toFixed(1) : '4.7';

  return { 
    performance,
    teamStats: {
      totalWo: totalWo?.count || 0,
      avgEfficiency,
      avgRating: parseFloat(avgRating as string),
      completedToday: completedToday?.count || 0
    },
    weeklyTrend
  };
}

function getAlerts() {
  const alerts: any[] = [];

  // Machines down
  const machinesDown = db.prepare(`
    SELECT id, name, asset_code FROM assets WHERE status = 'down' LIMIT 3
  `).all() as any[];

  machinesDown.forEach(m => {
    alerts.push({
      type: 'critical',
      title: `Mesin Down: ${m.name}`,
      message: `Asset ${m.asset_code} membutuhkan perbaikan segera.`
    });
  });

  // Overdue PMs
  const overduePMs = db.prepare(`
    SELECT COUNT(*) as count FROM maintenance_schedules
    WHERE is_active = 1 AND next_due < date('now')
  `).get() as any;

  if (overduePMs?.count > 0) {
    alerts.push({
      type: 'warning',
      title: 'Jadwal PM Terlambat',
      message: `Ada ${overduePMs.count} jadwal pemeliharaan preventif yang melewati batas waktu.`
    });
  }

  return { alerts };
}

function getOEEData() {
  // Calculate OEE components from real data if possible
  const days = 7;

  // 1. Availability: (Scheduled - Downtime) / Scheduled
  const scheduled = db.prepare(`
    SELECT COALESCE(SUM(planned_production_minutes), 0) as total
    FROM production_schedule
    WHERE date >= date('now', '-${days} days')
  `).get() as any;

  const downtime = db.prepare(`
    SELECT COALESCE(SUM(duration_minutes), 0) as total
    FROM downtime_logs
    WHERE start_time >= datetime('now', '-${days} days')
  `).get() as any;

  const schedMins = scheduled?.total || (days * 1440 * 0.7); // Fallback to 70% of day
  const downMins = downtime?.total || 0;
  const availability = Math.max(0, Math.min(100, ((schedMins - downMins) / schedMins) * 100));

  // 2. Performance: Actual / Target (Mocked if table not present, but use realistic range)
  const performance = 85 + Math.random() * 10;

  // 3. Quality: Good / Total (Mocked)
  const quality = 95 + Math.random() * 4;

  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

  return {
    availability,
    performance,
    quality,
    oee
  };
}

// SCADA Data - fetches from assets table (only Thermoform, Compressors, Chillers, Preform Moulding)
function getScadaData() {
  // Fetch real assets from database - filter to only show Thermoform, Compressors, Chillers, Preform Moulding
  const assets = db.prepare(`
    SELECT a.id, a.asset_code, a.name, a.status, a.criticality, ac.name as category,
           COALESCE(
             (SELECT SUM(dl.duration_minutes) FROM downtime_logs dl 
              WHERE dl.asset_id = a.id AND dl.start_time >= date('now', '-7 days')
            ), 0
           ) as downtime_minutes_7d
    FROM assets a
    LEFT JOIN asset_categories ac ON a.category_id = ac.id
    WHERE a.status != 'retired'
      AND (
        ac.name = 'Thermoforming Machine'
        OR ac.name = 'Compressor' 
        OR ac.name = 'Chiller'
        OR ac.name = 'Preform Moulding'
      )
      AND a.name NOT LIKE '%Air Dryer%'
      AND a.name NOT LIKE '%Filter%'
    ORDER BY 
      CASE ac.name
        WHEN 'Compressor' THEN 1
        WHEN 'Chiller' THEN 2
        WHEN 'Thermoforming Machine' THEN 3
        WHEN 'Preform Moulding' THEN 4
        ELSE 5
      END,
      a.asset_code ASC
  `).all() as any[];

  // Map assets to SCADA equipment with simulated sensor data
  // In production, this would come from PLC/sensor data
  const equipment = assets.map((asset, index) => {
    const status = asset.status === 'operational' ? 'running' : 
                   asset.status === 'down' ? 'error' : 
                   asset.status === 'maintenance' ? 'maintenance' : 'stopped';
    
    // Simulate sensor data based on category and status
    const category = (asset.category || '').toLowerCase();
    let temperature = 25;
    let pressure = 0;
    let efficiency = 85;

    if (status === 'running') {
      if (category.includes('compressor')) {
        temperature = 70 + Math.floor(Math.random() * 15);
        pressure = 7 + Math.random() * 2;
        efficiency = 88 + Math.floor(Math.random() * 10);
      } else if (category.includes('chiller')) {
        temperature = 4 + Math.random() * 4;
        pressure = 1.5 + Math.random() * 1;
        efficiency = 85 + Math.floor(Math.random() * 10);
      } else if (category.includes('machine') || category.includes('mesin')) {
        temperature = 35 + Math.floor(Math.random() * 20);
        efficiency = 80 + Math.floor(Math.random() * 15);
      } else if (category.includes('ahu') || category.includes('ahc')) {
        temperature = 10 + Math.random() * 8;
        pressure = 1 + Math.random() * 0.5;
        efficiency = 82 + Math.floor(Math.random() * 12);
      }
    } else {
      temperature = 22 + Math.random() * 3;
      efficiency = 0;
    }

    return {
      id: `asset-${asset.id}`,
      asset_code: asset.asset_code,
      name: asset.name || asset.asset_code,
      type: category.includes('compressor') ? 'compressor' : 
            category.includes('chiller') ? 'chiller' :
            category.includes('ahu') || category.includes('ahc') ? 'ahc' :
            category.includes('preform') ? 'preform' : 'machine',
      status,
      downtime_7d: asset.downtime_minutes_7d,
      asset_id: asset.id
    };
  });

  // Define flow paths based on equipment types
  const flowPaths = [
    // Compressors to AHC
    ...equipment.filter(e => e.type === 'compressor').map(e => ({
      id: `flow-${e.id}-to-ahc`,
      from: e.id,
      to: 'ahc-1',
      type: 'air',
      active: e.status === 'running'
    })),
    // Chillers to AHC
    ...equipment.filter(e => e.type === 'chiller').map(e => ({
      id: `flow-${e.id}-to-ahc`,
      from: e.id,
      to: 'ahc-1',
      type: 'water',
      active: e.status === 'running'
    })),
    // AHC to Machines
    ...equipment.filter(e => e.type === 'machine').map(e => ({
      id: `flow-ahc-to-${e.id}`,
      from: 'ahc-1',
      to: e.id,
      type: 'air',
      active: e.status === 'running'
    })),
  ];

  // Calculate system status
  const runningEquipment = equipment.filter(e => e.status === 'running').length;
  const stoppedEquipment = equipment.filter(e => e.status === 'stopped').length;
  const errorEquipment = equipment.filter(e => e.status === 'error').length;
  const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance').length;

  return {
    equipment,
    flowPaths,
    lastUpdated: new Date().toISOString(),
    systemStatus: {
      totalEquipment: equipment.length,
      runningEquipment,
      stoppedEquipment,
      errorEquipment,
      maintenanceEquipment
    }
  };
}

/**
 * POST /api/v1/scada-layout
 * Saves SCADA diagram layout (nodes and edges)
 */
router.post('/scada-layout', async (req: Request, res: Response) => {
  try {
    const { nodes, edges } = req.body;
    
    // Create table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS scada_layouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        layout_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Upsert the layout (replace existing)
    const layoutData = JSON.stringify({ nodes, edges, updatedAt: new Date().toISOString() });
    
    const existing = db.prepare('SELECT id FROM scada_layouts ORDER BY id DESC LIMIT 1').get();
    if (existing) {
      db.prepare('UPDATE scada_layouts SET layout_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(layoutData, (existing as any).id);
    } else {
      db.prepare('INSERT INTO scada_layouts (layout_data) VALUES (?)').run(layoutData);
    }
    
    res.json({ success: true, message: 'Layout saved successfully' });
  } catch (error) {
    console.error('Error saving SCADA layout:', error);
    res.status(500).json({ error: 'Failed to save layout' });
  }
});

/**
 * GET /api/v1/scada-layout
 * Retrieves saved SCADA diagram layout (filtered to only show Compressor, Chiller, Thermoform, Preform)
 */
router.get('/scada-layout', async (req: Request, res: Response) => {
  try {
    const layout = db.prepare('SELECT layout_data FROM scada_layouts ORDER BY id DESC LIMIT 1').get() as any;
    
    if (layout) {
      const data = JSON.parse(layout.layout_data);
      
      // Get valid asset_ids for SCADA display
      const validAssetIds = db.prepare(`
        SELECT a.id FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        WHERE a.status != 'retired'
          AND (
            ac.name = 'Thermoforming Machine'
            OR ac.name = 'Compressor' 
            OR ac.name = 'Chiller'
            OR ac.name = 'Preform Moulding'
          )
          AND a.name NOT LIKE '%Air Dryer%'
          AND a.name NOT LIKE '%Filter%'
      `).all() as any[];
      
      const validIds = new Set(validAssetIds.map(a => `asset-${a.id}`));
      const validAssetIdNums = new Set(validAssetIds.map(a => a.id));
      
      // Filter nodes to only include valid assets
      const filteredNodes = (data.nodes || []).filter((node: any) => {
        if (!node.id || !node.id.startsWith('asset-')) return false;
        return validIds.has(node.id);
      });
      
      // Filter edges to only include edges between valid nodes
      const filteredEdges = (data.edges || []).filter((edge: any) => {
        return validIds.has(edge.source) && validIds.has(edge.target);
      });
      
      res.json({
        nodes: filteredNodes,
        edges: filteredEdges,
        updatedAt: new Date().toISOString()
      });
    } else {
      res.json({ nodes: [], edges: [] });
    }
  } catch (error) {
    console.error('Error fetching SCADA layout:', error);
    res.status(500).json({ error: 'Failed to fetch layout' });
  }
});

export default router;
