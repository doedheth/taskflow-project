/**
 * View Incoming Material Mockup Data Details
 */
import { initDb, prepare } from './database/db';

async function viewMockupData() {
  await initDb();

  console.log('\n═══════════════════════════════════════════════');
  console.log('  INCOMING MATERIAL MOCKUP DATA DETAILS');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Suppliers
  console.log('📦 SUPPLIERS:\n');
  const suppliers = prepare(`
    SELECT id, code, name, contact_person, phone
    FROM suppliers
    ORDER BY code
  `).all() as any[];

  suppliers.forEach((s) => {
    console.log(`   ${s.id}. [${s.code}] ${s.name}`);
    console.log(`      Contact: ${s.contact_person} (${s.phone})\n`);
  });

  // 2. Inspections with details
  console.log('📋 INCOMING INSPECTIONS:\n');
  const inspections = prepare(`
    SELECT
      i.id,
      i.inspection_no,
      i.inspection_date,
      i.po_no,
      i.item_name,
      i.total_items_received,
      i.status,
      s.code as supplier_code,
      s.name as supplier_name,
      qc.qc_score,
      qc.fs_score,
      qc.decision
    FROM incoming_inspections i
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    LEFT JOIN inspection_qc_params qc ON i.id = qc.inspection_id
    ORDER BY i.inspection_date DESC
  `).all() as any[];

  inspections.forEach((insp) => {
    const statusIcon = insp.status === 'completed' ? '✅' : '⏳';
    const decisionIcon = insp.decision === 'Diterima' ? '✅' : insp.decision === 'AOD' ? '⚠️' : '❌';

    console.log(`   ${statusIcon} ${insp.inspection_no} | ${insp.inspection_date}`);
    console.log(`      PO: ${insp.po_no} | Supplier: [${insp.supplier_code}] ${insp.supplier_name}`);
    console.log(`      Item: ${insp.item_name}`);
    console.log(`      Qty: ${insp.total_items_received} karton`);
    console.log(`      QC Score: ${insp.qc_score}/100 | FS Score: ${insp.fs_score}/100`);
    console.log(`      Decision: ${decisionIcon} ${insp.decision}`);
    console.log(`      Status: ${insp.status.toUpperCase()}\n`);
  });

  // 3. Summary Statistics
  console.log('═══════════════════════════════════════════════');
  console.log('  STATISTICS');
  console.log('═══════════════════════════════════════════════\n');

  // Total by status
  const statusStats = prepare(`
    SELECT status, COUNT(*) as count
    FROM incoming_inspections
    GROUP BY status
  `).all() as any[];

  console.log('📊 By Status:');
  statusStats.forEach((stat) => {
    console.log(`   ${stat.status}: ${stat.count}`);
  });

  // Total by decision
  const decisionStats = prepare(`
    SELECT decision, COUNT(*) as count
    FROM inspection_qc_params
    GROUP BY decision
  `).all() as any[];

  console.log('\n📊 By QC Decision:');
  decisionStats.forEach((stat) => {
    const icon = stat.decision === 'Diterima' ? '✅' : stat.decision === 'AOD' ? '⚠️' : '❌';
    console.log(`   ${icon} ${stat.decision}: ${stat.count}`);
  });

  // Average scores
  const avgScores = prepare(`
    SELECT
      AVG(qc_score) as avg_qc,
      AVG(fs_score) as avg_fs
    FROM inspection_qc_params
  `).get() as any;

  console.log('\n📊 Average Scores:');
  console.log(`   QC Score: ${avgScores.avg_qc.toFixed(1)}/100`);
  console.log(`   FS Score: ${avgScores.avg_fs.toFixed(1)}/100`);

  // Total quantities
  const totalQty = prepare(`
    SELECT SUM(total_items_received) as total
    FROM incoming_inspections
  `).get() as any;

  console.log('\n📊 Total Material Received:');
  console.log(`   ${totalQty.total.toLocaleString('id-ID')} karton\n`);

  console.log('═══════════════════════════════════════════════\n');
  console.log('💡 API Endpoints to test:');
  console.log('   GET  /api/v2/suppliers');
  console.log('   GET  /api/v2/inspections');
  console.log('   GET  /api/v2/inspections/:id');
  console.log('   POST /api/v2/suppliers');
  console.log('   POST /api/v2/inspections\n');

  process.exit(0);
}

viewMockupData();
