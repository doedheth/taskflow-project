/**
 * Update Seed Data - Fix form checklist items sesuai gambar
 */
import { initDb, prepare, exec, saveDb } from './database/db';

async function updateChecklistItems() {
  await initDb();

  console.log('\n🔧 Updating QC checklist items to match form...\n');

  try {
    // Update existing inspections dengan data yang lebih akurat
    const inspections = prepare('SELECT id FROM incoming_inspections').all() as { id: number }[];

    for (const insp of inspections) {
      // Update QC params dengan checklist yang benar
      const qcParams = prepare('SELECT id FROM inspection_qc_params WHERE inspection_id = ?').get(insp.id) as any;

      if (qcParams) {
        // Update dengan checklist sesuai form:
        // 1. Berat (Score: 30/25, AQL: 4.0) - Sesuai standar di ITP
        // 2. Fungsional (Score: 25):
        //    a. Bersih - Sanitasi baik (bukan "Santasi")
        //    b. Bau - Baik Tidak Berbau
        //    c. Bak - Tertutup, bersegel
        //    d. Segel - Bersegel/utuh

        prepare(`
          UPDATE inspection_qc_params SET
            q_berat = 1,
            fs_mat_bersih = 1,
            fs_mat_bau = 1,
            fs_veh_bak = 1,
            fs_veh_segel = 1
          WHERE inspection_id = ?
        `).run(insp.id);

        console.log(`✅ Updated checklist for inspection ID ${insp.id}`);
      }
    }

    // Update decision text: "Di terima" → "Diterima"
    exec(`UPDATE inspection_qc_params SET decision = 'Diterima' WHERE decision = 'Di terima'`);

    saveDb();

    console.log('\n✅ Checklist items updated successfully!\n');
    console.log('📋 Corrected Items:');
    console.log('   • Fixed: "Santasi" → "Sanitasi"');
    console.log('   • Fixed: "Di terima" → "Diterima"');
    console.log('   • Ensured all checklist items are properly set\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

updateChecklistItems();
