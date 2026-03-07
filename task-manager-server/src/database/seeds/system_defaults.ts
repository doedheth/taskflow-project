import { prepare, saveDb } from '../db';

export function seedSystemDefaults(): void {
  console.log('🌱 Seeding system defaults...');

  try {
    // 1. AI Settings
    const settingsCount = prepare('SELECT COUNT(*) as count FROM ai_settings').get() as { count: number };
    if (settingsCount.count === 0) {
      const defaultSettings = [
        ['ai_enabled', 'true', 'Master switch for AI features'],
        ['ai_chatbot_enabled', 'true', 'Enable AI Chatbot globally'],
        ['ai_writing_assistant_enabled', 'true', 'Enable AI Writing Assistant'],
        ['ai_smart_assignment_enabled', 'true', 'Enable AI Smart Assignment'],
        ['ai_priority_recommendations_enabled', 'true', 'Enable AI Priority Recommendations'],
        ['ai_rate_limit_per_user_per_hour', '50', 'Max AI requests per user per hour'],
        ['ai_rate_limit_per_day', '500', 'Max AI requests globally per day'],
        ['ai_model_default', 'gpt-3.5-turbo', 'Default AI model'],
        ['ai_max_tokens_per_request', '1500', 'Max tokens per AI request'],
        ['ai_allowed_roles', 'admin,manager,supervisor,technician,operator,member', 'Roles allowed to use AI'],
        ['ai_predictive_maintenance_enabled', 'true', 'Enable Predictive Maintenance AI'],
        ['ai_root_cause_analysis_enabled', 'true', 'Enable Root Cause Analysis AI'],
        ['ai_smart_wo_enabled', 'true', 'Enable Smart Work Order Generation'],
        ['ai_duplicate_detection_enabled', 'true', 'Enable Duplicate Detection'],
        ['ai_report_generation_enabled', 'true', 'Enable AI Report Generation'],
        ['ai_pm_suggestion_enabled', 'true', 'Enable PM Suggestion AI'],
        ['ai_openai_api_key_masked', '', 'OpenAI API key (masked for display)'],
        ['ai_default_model', 'gpt-4o', 'Default AI model for advanced features'],
        ['ai_fallback_model', 'gpt-3.5-turbo', 'Fallback AI model for basic features'],
        ['ai_cost_warning_threshold', '10', 'Daily cost warning threshold in USD'],
        ['ai_max_daily_requests', '1000', 'Maximum AI requests per day globally'],
      ];

      const stmt = prepare('INSERT OR IGNORE INTO ai_settings (setting_key, setting_value, description) VALUES (?, ?, ?)');
      defaultSettings.forEach(([key, value, description]) => {
        stmt.run(key, value, description);
      });
      console.log('✅ Seeded default AI settings');
    }

    // 2. AI Feature Toggles
    const togglesCount = prepare('SELECT COUNT(*) as count FROM ai_feature_toggles').get() as { count: number };
    if (togglesCount.count === 0) {
      const features = [
        'chatbot', 'smart_wo', 'duplicate_detection', 'task_prioritization',
        'predictive_maintenance', 'report_generation', 'root_cause_analysis',
        'writing_assistant', 'pm_suggestion',
      ];
      const roles = ['admin', 'manager', 'supervisor', 'technician', 'operator', 'member'];
      const stmt = prepare('INSERT INTO ai_feature_toggles (feature, role, enabled) VALUES (?, ?, 1)');
      for (const feature of features) {
        for (const role of roles) {
          stmt.run(feature, role);
        }
      }
      console.log('✅ Seeded default AI feature toggles');
    }

    // 3. Slideshow Configs
    const slideshowCount = prepare('SELECT COUNT(*) as count FROM slideshow_configs').get() as { count: number };
    if (slideshowCount.count === 0) {
      const defaultSlides = [
        ['kpi-summary', 1, 30], ['production', 2, 30], ['maintenance', 3, 30],
        ['downtime', 4, 30], ['solar', 5, 30], ['team-performance', 6, 30], ['oee', 7, 30]
      ];
      const stmt = prepare('INSERT INTO slideshow_configs (slide_type, slide_order, duration_seconds) VALUES (?, ?, ?)');
      for (const [type, order, duration] of defaultSlides) {
        stmt.run(type, order, duration);
      }
      console.log('✅ Seeded default slideshow configurations');
    }

    // 4. Production Quick Actions
    const qaCount = prepare('SELECT COUNT(*) as count FROM production_quick_actions').get() as { count: number };
    if (qaCount.count === 0) {
      const defaultActions = [
        ['Ganti Produk', '🔄', 'bg-blue-500 hover:bg-blue-600', 'CO-PRODUCT', 1],
        ['Ganti Mold', '🔧', 'bg-purple-500 hover:bg-purple-600', 'CO-MOLD', 2],
        ['Setup Mesin', '⚙️', 'bg-orange-500 hover:bg-orange-600', 'CO-SETUP', 3],
        ['Tunggu Material', '📦', 'bg-yellow-500 hover:bg-yellow-600', 'MAT-WAIT', 4],
        ['Ganti Warna', '🎨', 'bg-pink-500 hover:bg-pink-600', 'CO-COLOR', 5],
        ['Quality Issue', '⚠️', 'bg-red-500 hover:bg-red-600', 'QC-REJECT', 6],
      ];
      const stmt = prepare('INSERT INTO production_quick_actions (label, icon, color, classification_code, sort_order) VALUES (?, ?, ?, ?, ?)');
      defaultActions.forEach(([label, icon, color, code, order]) => {
        stmt.run(label, icon, color, code, order);
      });
      console.log('✅ Seeded default production quick actions');
    }

    // 5. Default Products
    const productCount = prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    if (productCount.count === 0) {
      const defaultProducts = [
        ['TUTUP-S120-BIRU', 'TUTUP BOTOL BIRU MUDA SOLID S.120 @5000', 'HDPE 6070 + LLDPE ASRENE UF 1810 T', 1.80, 'BOX'],
        ['TUTUP-S120-MERAH', 'TUTUP BOTOL MERAH SOLID S.120 @5000', 'HDPE 6070 + LLDPE ASRENE UF 1810 T', 1.80, 'BOX'],
        ['TUTUP-S120-HIJAU', 'TUTUP BOTOL HIJAU SOLID S.120 @5000', 'HDPE 6070 + LLDPE ASRENE UF 1810 T', 1.80, 'BOX'],
        ['TUTUP-S38-BIRU', 'TUTUP BOTOL BIRU S.38 @10000', 'HDPE 5502', 0.95, 'KARUNG'],
        ['TUTUP-S38-PUTIH', 'TUTUP BOTOL PUTIH S.38 @10000', 'HDPE 5502', 0.95, 'KARUNG']
      ];
      const stmt = prepare('INSERT OR IGNORE INTO products (code, name, material, weight_gram, default_packaging) VALUES (?, ?, ?, ?, ?)');
      defaultProducts.forEach(product => {
        stmt.run(...product);
      });
      console.log('✅ Seeded default products');
    }

    // 6. Maintenance Defaults (Categories, Failure Codes, Shifts, Classifications)
    const categoryCount = prepare('SELECT COUNT(*) as count FROM asset_categories').get() as { count: number };
    if (categoryCount.count === 0) {
      const categories = [
        ['Thermoforming Machine', 'Mesin thermoforming utama untuk produksi'],
        ['Mold/Die', 'Cetakan/mold untuk thermoforming'],
        ['Conveyor', 'Conveyor belt dan sistem transportasi'],
        ['Chiller', 'Sistem pendingin'],
        ['Compressor', 'Kompresor udara dan sistem pneumatik'],
        ['Auxiliary Equipment', 'Peralatan pendukung lainnya'],
      ];
      const stmt = prepare('INSERT OR IGNORE INTO asset_categories (name, description) VALUES (?, ?)');
      categories.forEach(([name, desc]) => stmt.run(name, desc));
      console.log('✅ Seeded default asset categories');
    }

    const failureCount = prepare('SELECT COUNT(*) as count FROM failure_codes').get() as { count: number };
    if (failureCount.count === 0) {
      const failureCodes = [
        ['EL-001', 'Electrical', 'Motor failure/overload'],
        ['EL-002', 'Electrical', 'Sensor malfunction'],
        ['EL-003', 'Electrical', 'Control panel issue'],
        ['EL-004', 'Electrical', 'Wiring/connection problem'],
        ['MC-001', 'Mechanical', 'Bearing failure'],
        ['MC-002', 'Mechanical', 'Belt/chain wear'],
        ['MC-003', 'Mechanical', 'Gear/gearbox issue'],
        ['MC-004', 'Mechanical', 'Structural damage'],
        ['PN-001', 'Pneumatic', 'Air leak'],
        ['PN-002', 'Pneumatic', 'Valve malfunction'],
        ['PN-003', 'Pneumatic', 'Pressure issue'],
        ['HY-001', 'Hydraulic', 'Oil leak'],
        ['HY-002', 'Hydraulic', 'Pump failure'],
        ['HY-003', 'Hydraulic', 'Cylinder issue'],
        ['TF-001', 'Thermoforming', 'Heater failure'],
        ['TF-002', 'Thermoforming', 'Vacuum leak'],
        ['TF-003', 'Thermoforming', 'Forming issue'],
        ['TF-004', 'Thermoforming', 'Material feeding problem'],
        ['MD-001', 'Mold', 'Surface damage'],
        ['MD-002', 'Mold', 'Alignment issue'],
        ['MD-003', 'Mold', 'Wear/erosion'],
        ['OT-001', 'Other', 'Operator error'],
        ['OT-002', 'Other', 'External factor'],
        ['OT-003', 'Other', 'Unknown cause'],
      ];
      const stmt = prepare('INSERT OR IGNORE INTO failure_codes (code, category, description) VALUES (?, ?, ?)');
      failureCodes.forEach(([code, cat, desc]) => stmt.run(code, cat, desc));
      console.log('✅ Seeded default failure codes');
    }

    const shiftCount = prepare('SELECT COUNT(*) as count FROM shift_patterns').get() as { count: number };
    if (shiftCount.count === 0) {
      const shifts = [
        ['Shift 1', '06:00', '14:00', 60],
        ['Shift 2', '14:00', '22:00', 60],
        ['Shift 3', '22:00', '06:00', 60],
      ];
      const stmt = prepare('INSERT OR IGNORE INTO shift_patterns (name, start_time, end_time, break_minutes) VALUES (?, ?, ?, ?)');
      shifts.forEach(([name, start, end, breakMin]) => stmt.run(name, start, end, breakMin));
      console.log('✅ Seeded default shift patterns');
    }

    const classificationCount = prepare('SELECT COUNT(*) as count FROM downtime_classifications').get() as { count: number };
    if (classificationCount.count === 0) {
      const classifications = [
        ['BD-PROD', 'Breakdown during Production', 'Kerusakan saat jadwal produksi aktif', 1, 'breakdown'],
        ['BD-IDLE', 'Breakdown during Idle', 'Kerusakan saat tidak ada order', 0, 'breakdown'],
        ['PM-PROD', 'Planned Maintenance during Production', 'PM saat jadwal produksi', 1, 'planned_maintenance'],
        ['PM-IDLE', 'Planned Maintenance during Idle', 'PM saat tidak ada order', 0, 'planned_maintenance'],
        ['PM-WINDOW', 'Planned Maintenance in Window', 'PM di jadwal maintenance window', 0, 'planned_maintenance'],
        ['CO-PROD', 'Changeover during Production', 'Setup/changeover saat produksi', 1, 'changeover'],
        ['IDLE-NO-ORDER', 'Idle - No Production Order', 'Idle karena tidak ada order', 0, 'idle'],
        ['IDLE-MATERIAL', 'Idle - Waiting Material', 'Idle menunggu material', 1, 'idle'],
        ['IDLE-OPERATOR', 'Idle - No Operator', 'Idle karena tidak ada operator', 1, 'idle'],
        // Production specific classifications
        ['CO-PRODUCT', 'Ganti Produk', 'Changeover untuk ganti produk', 1, 'production'],
        ['CO-MOLD', 'Ganti Mold', 'Ganti mold/die', 1, 'production'],
        ['CO-SETUP', 'Setup Mesin', 'Setup awal atau adjustment', 1, 'production'],
        ['CO-COLOR', 'Ganti Warna', 'Changeover warna material', 1, 'production'],
        ['QC-REJECT', 'Quality Issue', 'Stop karena reject/rework', 1, 'production'],
        ['QC-INSPECT', 'Inspeksi QC', 'Stop untuk inspeksi kualitas', 0, 'production'],
        ['MAT-WAIT', 'Tunggu Material', 'Menunggu material/bahan baku', 1, 'production'],
        ['MAT-CHANGE', 'Ganti Material', 'Proses ganti material', 1, 'production'],
        ['OPR-BREAK', 'Istirahat Operator', 'Scheduled operator break', 0, 'production'],
        ['OPR-ABSENT', 'Operator Tidak Ada', 'Tidak ada operator tersedia', 1, 'production'],
        ['MINOR-ADJ', 'Minor Adjustment', 'Stop singkat untuk adjustment', 0, 'production'],
      ];
      const stmt = prepare('INSERT OR IGNORE INTO downtime_classifications (code, name, description, counts_as_downtime, category) VALUES (?, ?, ?, ?, ?)');
      classifications.forEach(([code, name, desc, counts, cat]) => stmt.run(code, name, desc, counts, cat));
      console.log('✅ Seeded default downtime classifications');
    }

    // 7. Work Order Counter
    const currentYear = new Date().getFullYear();
    const counterExists = prepare('SELECT id FROM work_order_counter WHERE year = ?').get(currentYear);
    if (!counterExists) {
      prepare('INSERT OR IGNORE INTO work_order_counter (id, year, counter) VALUES (1, ?, 0)').run(currentYear);
      console.log('✅ Seeded work order counter for current year');
    }

    saveDb();
    console.log('✅ System defaults seeding completed');
  } catch (error) {
    console.error('❌ System defaults seeding failed:', error);
  }
}
