// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/express.d.ts" />

console.log('🚀 Starting application...');

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs'; // <-- ADDED THIS LINE
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
console.log('📦 swagger imported');

dotenv.config();
console.log('📦 dotenv configured');

import { initDb, prepare, exec, saveDb } from './database/db';
console.log('📦 db imported');
import { migrateWorkOrderAssignees } from './database/migrations/add_work_order_assignees';
import { migrateIntegrations } from './database/migrations/add_integrations';
import { migrateAIUsageTracking } from './database/migrations/add_ai_usage_tracking';
import { migrateAIPredictions } from './database/migrations/add_ai_predictions';
import { migrateAIReports } from './database/migrations/add_ai_reports';
import { migrateAIProductionReports } from './database/migrations/add_ai_production_reports';
import { migrateAIRCA } from './database/migrations/add_ai_rca';
import { migrateAIFeatureToggles } from './database/migrations/add_ai_feature_toggles';
import { migrateSPKTables } from './database/migrations/add_spk_tables';
import { migrateIncomingMaterialTables } from './database/migrations/add_incoming_material_tables';
import { migrateProducersTable } from './database/migrations/add_producers_table';
import { migrateMaterialsTable } from './database/migrations/add_materials_table';
import { migratePlantsTable } from './database/migrations/add_plants_table';
import { migrateUpdateInspectionSchema } from './database/migrations/update_inspection_schema';
import { migrateAddInspectionAttachments } from './database/migrations/add_inspection_attachments';
import { migrateAddSupplierEmail } from './database/migrations/add_supplier_email';
import { up as migrateAddBatchVendor } from './database/migrations/add_batch_vendor_to_inspection_items';
import { migrateAddScaleWeightToInspectionItems } from './database/migrations/add_scale_weight_to_inspection_items';
import { migrateAddBatchVendorToInspectionWeights } from './database/migrations/add_batch_vendor_to_inspection_weights';
import { migrateSolarTables } from './database/migrations/add_solar_tables';
import { migrateComplaintTables } from './database/migrations/add_complaint_tables';
import { migratePLNMetricsTable } from './database/migrations/add_pln_metrics_table';
import { migrateSlideshow } from './database/migrations/add_slideshow';
import { seedSystemDefaults } from './database/seeds/system_defaults';
import { seedSampleData } from './database/seeds/sample_data';
import { seedSlideshowData } from './database/seeds/seed_slideshow_data';
import { migrateDowntimeDepartment } from './database/migrations/add_downtime_department';
import { migrateMachineParameterRanges } from './database/migrations/add_machine_parameter_ranges';
import { migrateMaintenanceTables } from './database/run-maintenance-migration';
import { migrateDigitalSignageV2 } from './database/migrations/add_digital_signage_v2';

// ============================================
// Legacy routes (modules without OOP version)
// ============================================
import authRoutes from './routes/auth';
import departmentRoutes from './routes/departments';
import commentRoutes from './routes/comments';
import dashboardRoutes from './routes/dashboard';
import epicRoutes from './routes/epics';
import sprintRoutes from './routes/sprints';
import notificationRoutes from './routes/notifications';
import uploadRoutes from './routes/upload';
import maintenanceRoutes from './routes/maintenance';
import quickActionsRoutes from './routes/quickActions';
import publicRoutes from './routes/public';

// ============================================
// V2 OOP Routes (Repository + Service + Controller)
// ============================================
import v2WorkOrderRoutes from './routes/v2/workOrders';
import v2TicketRoutes from './routes/v2/tickets';
import v2DowntimeRoutes from './routes/v2/downtime';
import v2AssetRoutes from './routes/v2/assets';
import v2UserRoutes from './routes/v2/users';
import v2ReportRoutes from './routes/v2/reports';
import v2AIRoutes from './routes/v2/ai';
import v2ProductRoutes from './routes/v2/products';
import v2SPKRoutes from './routes/v2/spk';
import v2SolarRoutes from './routes/v2/solar';
import v2EnergyRoutes from './routes/v2/energy';
import v2ProductionRoutes from './routes/v2/production';
import v2InspectionRoutes from './routes/v2/inspections';

import v2SparepartRoutes from './routes/v2/spareparts';
import publicSlideshowRoutes from './routes/v2/publicSlideshow';
import v2ComplaintRoutes from './routes/v2/complaints';
import v2DigitalSignageRoutes from './routes/v2/digitalSignage';

// ============================================
// Background Jobs
// ============================================
import { predictiveMaintenanceJob } from './jobs/PredictiveMaintenanceJob';
import { solarSyncJob } from './jobs/SolarSyncJob';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory with absolute path
const UPLOADS_PATH = path.resolve('uploads');
app.use('/uploads', express.static(UPLOADS_PATH));
console.log(`📂 Serving static files from: ${UPLOADS_PATH}`);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Task Manager API Documentation',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Initialize database and start server
const startServer = async () => {
  console.log('🏁 Inside startServer...');
  try {
    console.log('💾 Initializing database...');
    await initDb();
    console.log('✅ Database initialized');

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`✅ Created uploads directory: ${uploadsDir}`);
    }

    // Run pending migrations
    try {
      const tableInfo = prepare('PRAGMA table_info(production_schedule)').all() as {
        name: string;
      }[];
      if (!tableInfo.some(col => col.name === 'product_name')) {
        exec('ALTER TABLE production_schedule ADD COLUMN product_name TEXT');
        saveDb();
        console.log('✅ Migration: Added product_name column');
      }
    } catch (migrationError) {
      console.log('ℹ️ Migration check skipped (table may not exist yet)');
    }

    // Run Machine Parameter Ranges migration
    try {
      migrateMachineParameterRanges();
      saveDb();
    } catch (migrationError) {
      console.error('Machine parameter ranges migration failed:', migrationError);
    }

    // Run work order assignees migration
    try {
      migrateWorkOrderAssignees();
      saveDb();
    } catch (migrationError) {
      console.error('Work order assignees migration failed:', migrationError);
    }

    // Run integrations migration (Task Manager <-> Maintenance)
    try {
      migrateIntegrations();
      saveDb();
    } catch (migrationError) {
      console.error('Integrations migration failed:', migrationError);
    }

    // Run AI usage tracking migration
    try {
      migrateAIUsageTracking();
      saveDb();
    } catch (migrationError) {
      console.error('AI usage tracking migration failed:', migrationError);
    }

    // Run AI predictions migration
    try {
      migrateAIPredictions();
      saveDb();
    } catch (migrationError) {
      console.error('AI predictions migration failed:', migrationError);
    }

    // Run AI reports migration
    try {
      migrateAIReports();
      saveDb();
    } catch (migrationError) {
      console.error('AI reports migration failed:', migrationError);
    }

    // Run AI production reports migration
    try {
      migrateAIProductionReports();
      saveDb();
    } catch (migrationError) {
      console.error('AI production reports migration failed:', migrationError);
    }

    // Run AI RCA migration
    try {
      migrateAIRCA();
      saveDb();
    } catch (migrationError) {
      console.error('AI RCA migration failed:', migrationError);
    }

    // Run AI Feature Toggles migration
    try {
      migrateAIFeatureToggles();
      saveDb();
    } catch (migrationError) {
      console.error('AI Feature Toggles migration failed:', migrationError);
    }

    // Run SPK tables migration
    try {
      migrateSPKTables();
      saveDb();
      console.log('✅ SPK tables migration completed');
    } catch (migrationError) {
      console.error('SPK tables migration failed:', migrationError);
    }

    // Run Incoming Material tables migration (+ Complaint tables + incremental tweaks)
    try {
      migrateIncomingMaterialTables();
      migrateProducersTable();
      migrateMaterialsTable();
      migratePlantsTable();
      migrateUpdateInspectionSchema();
      // Ensure inspection_items has batch_vendor column
      await migrateAddBatchVendor();
      // Ensure inspection_items has scale_weight column
      migrateAddScaleWeightToInspectionItems();
      // Ensure inspection_weights has batch_vendor column
      migrateAddBatchVendorToInspectionWeights();
      migrateAddInspectionAttachments();
      migrateAddSupplierEmail();
      migrateComplaintTables();
      // Dynamic migration: ensure 'unit' column exists in inspection_complaints
      try {
        const cols = prepare('PRAGMA table_info(inspection_complaints)').all() as { name: string }[];
        if (cols.length > 0 && !cols.some(c => c.name === 'unit')) {
          exec('ALTER TABLE inspection_complaints ADD COLUMN unit TEXT');
          console.log('✅ Migration: Added unit column to inspection_complaints');
        }
        if (cols.length > 0 && !cols.some(c => c.name === 'batch_no')) {
          exec('ALTER TABLE inspection_complaints ADD COLUMN batch_no TEXT');
          console.log('✅ Migration: Added batch_no column to inspection_complaints');
        }
      } catch (e) {
        console.warn('Skipping dynamic migration for inspection_complaints.unit:', e);
      }
      saveDb();
      console.log('✅ Incoming Material tables migration completed');
    } catch (migrationError) {
      console.error('Incoming Material tables migration failed:', migrationError);
    }

    // Run Solar tables migration
    try {
      migrateSolarTables();
      migratePLNMetricsTable();

      // Ensure price_per_kwh column exists (Dynamic migration)
      const solarConfigInfo = prepare('PRAGMA table_info(solar_config)').all() as { name: string }[];
      if (solarConfigInfo.length > 0 && !solarConfigInfo.some(col => col.name === 'price_per_kwh')) {
        exec('ALTER TABLE solar_config ADD COLUMN price_per_kwh REAL DEFAULT 1500');
        console.log('✅ Migration: Added price_per_kwh column to solar_config');
      }

      saveDb();
      console.log('✅ Solar tables migration completed');

      // Initialize solar_config from .env if empty or missing credentials
      const config = prepare('SELECT id, username, password FROM solar_config LIMIT 1').get() as any;
      const hasCredentials = config && config.username && config.password;

      if (!hasCredentials && process.env.SOLAR_USERNAME && process.env.SOLAR_PASSWORD) {
        console.log('ℹ️ Seeding/Updating solar_config from .env variables...');
        if (config) {
          prepare(`
            UPDATE solar_config
            SET username = ?, password = ?, station_dn = ?, price_per_kwh = ?
            WHERE id = ?
          `).run(
            process.env.SOLAR_USERNAME,
            process.env.SOLAR_PASSWORD,
            process.env.SOLAR_STATION_DN || 'NE=63775176',
            Number(process.env.SOLAR_PRICE_PER_KWH) || 1500,
            config.id
          );
        } else {
          prepare(`
            INSERT INTO solar_config (username, password, station_dn, price_per_kwh)
            VALUES (?, ?, ?, ?)
          `).run(
            process.env.SOLAR_USERNAME,
            process.env.SOLAR_PASSWORD,
            process.env.SOLAR_STATION_DN || 'NE=63775176',
            Number(process.env.SOLAR_PRICE_PER_KWH) || 1500
          );
        }
        saveDb();
        console.log('✅ Solar configuration seeded/updated from .env');
      }
    } catch (migrationError) {
      console.error('Solar tables migration failed:', migrationError);
    }

    // Run Slideshow migrations
    try {
      migrateSlideshow();
      seedSystemDefaults();
      // seedSampleData(); // Uncomment if sample data is needed for development
      saveDb();
    } catch (migrationError) {
      console.error('Slideshow/Seeding failed:', migrationError);
    }

    // Run Downtime Department migration
    try {
      migrateDowntimeDepartment();
      saveDb();
    } catch (migrationError) {
      console.error('Downtime Department migration failed:', migrationError);
    }

    // Run Maintenance tables migration
    try {
      migrateMaintenanceTables();
      saveDb();
    } catch (migrationError) {
      console.error('Maintenance migration failed:', migrationError);
    }

    // Run Digital Signage V2 migration
    try {
      migrateDigitalSignageV2();
      saveDb();
    } catch (migrationError) {
      console.error('Digital Signage V2 migration failed:', migrationError);
    }

    // ============================================
    // Legacy Routes (modules without OOP version)
    // ============================================
    app.use('/api/public', publicRoutes); // Added public route
    app.use('/api/auth', authRoutes);
    app.use('/api/departments', departmentRoutes);
    app.use('/api/comments', commentRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/epics', epicRoutes);
    app.use('/api/sprints', sprintRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/maintenance', maintenanceRoutes);
    app.use('/api/quick-actions', quickActionsRoutes);

    // ============================================
    // V2 OOP Routes (replacing legacy)
    // ============================================
    app.use('/api/users', v2UserRoutes);
    app.use('/api/tickets', v2TicketRoutes);
    app.use('/api/work-orders', v2WorkOrderRoutes);
    app.use('/api/downtime', v2DowntimeRoutes);
    app.use('/api/assets', v2AssetRoutes);
    app.use('/api/reports', v2ReportRoutes);
    app.use('/api/ai', v2AIRoutes);
    app.use('/api/v2/products', v2ProductRoutes);
    app.use('/api/v2/spk', v2SPKRoutes);
    app.use('/api/v2/solar', v2SolarRoutes);
    app.use('/api/v2/energy', v2EnergyRoutes);
    app.use('/api/v2/production', v2ProductionRoutes);

    app.use('/api/v2/inspections', v2InspectionRoutes);
    app.use('/api/v2/complaints', v2ComplaintRoutes);
    app.use('/api/v2/spareparts', v2SparepartRoutes);
    app.use('/api/v2/public', publicSlideshowRoutes);
    app.use('/api/v2/digital-signage', v2DigitalSignageRoutes);

    // Health check
    app.get('/api/health', (_req: Request, res: Response) => {
      res.json({ status: 'OK', message: 'Task Manager API is running' });
    });

    // Error handling middleware
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something went wrong!' });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('Server restarted at ' + new Date().toISOString());

      // Start background jobs
      predictiveMaintenanceJob.start();
      solarSyncJob.start();
    });
  } catch (error: unknown) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
