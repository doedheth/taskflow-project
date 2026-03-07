/**
 * Seed Mockup Data for Incoming Material Inspection
 *
 * This script creates sample data for:
 * - Suppliers (vendors)
 * - Incoming Inspections
 * - Inspection Items (QC sampling)
 * - Inspection Weights (timbangan)
 * - QC Parameters
 */

import { initDb, prepare, exec, saveDb } from './database/db';

async function seedIncomingMaterialData() {
  await initDb();

  console.log('\n═══════════════════════════════════════════════');
  console.log('  SEEDING INCOMING MATERIAL MOCKUP DATA');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    exec('DELETE FROM inspection_weights');
    exec('DELETE FROM inspection_items');
    exec('DELETE FROM inspection_qc_params');
    exec('DELETE FROM incoming_inspections');
    exec('DELETE FROM suppliers');
    console.log('✅ Existing data cleared\n');

    // 1. CREATE SUPPLIERS
    console.log('📦 Creating suppliers...');
    const suppliers = [
      { code: 'SUP001', name: 'PT Indopack Pratama', address: 'Jl. Industri No. 123, Bekasi', contact_person: 'Budi Santoso', phone: '021-88776655' },
      { code: 'SUP002', name: 'CV Karton Jaya', address: 'Jl. Raya Serang KM 45, Tangerang', contact_person: 'Siti Nurhaliza', phone: '021-55443322' },
      { code: 'SUP003', name: 'PT Packaging Indonesia', address: 'Kawasan Industri Cikande, Serang', contact_person: 'Ahmad Dahlan', phone: '0254-123456' },
      { code: 'SUP004', name: 'UD Mitra Kemasan', address: 'Jl. Gatot Subroto 88, Jakarta', contact_person: 'Rina Wijaya', phone: '021-33445566' },
      { code: 'SUP005', name: 'PT Corrugated Box Nusantara', address: 'Jl. Pembangunan III No. 22, Bogor', contact_person: 'Hendra Kusuma', phone: '0251-887766' },
    ];

    const supplierIds: number[] = [];
    for (const supplier of suppliers) {
      const result = prepare(
        'INSERT INTO suppliers (code, name, address, contact_person, phone, is_active) VALUES (?, ?, ?, ?, ?, 1)'
      ).run(supplier.code, supplier.name, supplier.address, supplier.contact_person, supplier.phone);
      supplierIds.push(Number(result.lastInsertRowid));
      console.log(`   ✅ ${supplier.code} - ${supplier.name}`);
    }
    console.log(`\n✅ Created ${suppliers.length} suppliers\n`);

    // Get checker user (admin)
    const checker = prepare('SELECT id FROM users WHERE role = "admin" LIMIT 1').get() as { id: number };
    if (!checker) {
      console.error('❌ No admin user found! Please run db:setup first.');
      process.exit(1);
    }

    // 2. CREATE INCOMING INSPECTIONS
    console.log('📋 Creating incoming inspections...');

    const inspections = [
      {
        date: '2025-02-08',
        supplier_id: supplierIds[0],
        po_no: 'PO/2025/001',
        surat_jalan_no: 'SJ/SUP001/020801',
        pabrik_danone: 'Danone Cikupa',
        product_code: 'CB-1045-A',
        kode_produksi: 'LOT-250208-001',
        nama_produsen: 'PT Indopack Pratama',
        negara_produsen: 'Indonesia',
        logo_halal: 'Ada',
        expedition_name: 'JNE Cargo',
        vehicle_no: 'B 1234 XYZ',
        driver_name: 'Joko Susilo',
        driver_phone: '081234567890',
        expired_date: '2027-02-08',
        no_seal: 'SEAL-001234',
        arrival_time: '08:30',
        unloading_start_time: '09:00',
        unloading_end_time: '10:30',
        total_items_received: 500,
        total_items_received_text: 'Lima Ratus Karton',
        material_type: 'Corrugated Box',
        warna: 'Coklat Natural',
        jumlah_sampling: '10 pcs',
        tanggal_produksi: '2025-02-05',
        item_name: 'Master Box 40x30x25cm',
        status: 'completed',
        notes: 'Material diterima dalam kondisi baik',
        packaging_notes: 'Kemasan rapi, tidak ada yang rusak',
        vehicle_clean: 1,
        vehicle_no_odor: 1,
        vehicle_closed: 1,
        vehicle_on_time: 1,
        vehicle_on_time_delivery: 1,
        item_not_wet: 1,
        item_not_torn: 1,
        item_not_dusty: 1,
        item_closed_tight: 1,
        item_no_haram: 1,
        pkg_condition: 'Baik',
        pkg_name_check: 'Ada',
        pkg_hazard_label: 'Tidak Perlu',
        pkg_good: 1,
        pkg_label_ok: 1,
      },
      {
        date: '2025-02-07',
        supplier_id: supplierIds[1],
        po_no: 'PO/2025/002',
        surat_jalan_no: 'SJ/SUP002/020702',
        pabrik_danone: 'Danone Cikarang',
        product_code: 'CB-2030-B',
        kode_produksi: 'LOT-250207-002',
        nama_produsen: 'CV Karton Jaya',
        negara_produsen: 'Indonesia',
        logo_halal: 'Ada',
        expedition_name: 'Sicepat Cargo',
        vehicle_no: 'B 5678 ABC',
        driver_name: 'Agus Setiawan',
        driver_phone: '081345678901',
        expired_date: '2027-02-07',
        no_seal: 'SEAL-002345',
        arrival_time: '07:15',
        unloading_start_time: '07:45',
        unloading_end_time: '09:15',
        total_items_received: 800,
        total_items_received_text: 'Delapan Ratus Karton',
        material_type: 'Corrugated Box',
        warna: 'Coklat dengan Print 2 Warna',
        jumlah_sampling: '15 pcs',
        tanggal_produksi: '2025-02-04',
        item_name: 'Secondary Box 35x25x20cm',
        status: 'completed',
        notes: 'Kualitas cetakan sangat baik',
        packaging_notes: 'Pallet wrapping rapat',
        vehicle_clean: 1,
        vehicle_no_odor: 1,
        vehicle_closed: 1,
        vehicle_on_time: 1,
        vehicle_on_time_delivery: 1,
        item_not_wet: 1,
        item_not_torn: 1,
        item_not_dusty: 1,
        item_closed_tight: 1,
        item_no_haram: 1,
        pkg_condition: 'Baik',
        pkg_name_check: 'Ada',
        pkg_hazard_label: 'Tidak Perlu',
        pkg_good: 1,
        pkg_label_ok: 1,
      },
      {
        date: '2025-02-06',
        supplier_id: supplierIds[2],
        po_no: 'PO/2025/003',
        surat_jalan_no: 'SJ/SUP003/020603',
        pabrik_danone: 'Danone Cikupa',
        product_code: 'CB-3025-C',
        kode_produksi: 'LOT-250206-003',
        nama_produsen: 'PT Packaging Indonesia',
        negara_produsen: 'Indonesia',
        logo_halal: 'Ada',
        expedition_name: 'Lion Parcel',
        vehicle_no: 'B 9012 DEF',
        driver_name: 'Rudi Hartono',
        driver_phone: '081456789012',
        expired_date: '2027-02-06',
        no_seal: 'SEAL-003456',
        arrival_time: '10:00',
        unloading_start_time: '10:30',
        unloading_end_time: '11:45',
        total_items_received: 350,
        total_items_received_text: 'Tiga Ratus Lima Puluh Karton',
        material_type: 'Corrugated Box',
        warna: 'Putih dengan Print Full Color',
        jumlah_sampling: '12 pcs',
        tanggal_produksi: '2025-02-03',
        item_name: 'Display Box 30x30x15cm',
        status: 'completed',
        notes: 'Ada sedikit perbedaan warna pada 2 karton, masih dalam toleransi',
        packaging_notes: 'Sebagian plastik wrapping sedikit robek',
        vehicle_clean: 1,
        vehicle_no_odor: 1,
        vehicle_closed: 1,
        vehicle_on_time: 0,
        vehicle_on_time_delivery: 0,
        item_not_wet: 1,
        item_not_torn: 1,
        item_not_dusty: 1,
        item_closed_tight: 1,
        item_no_haram: 1,
        pkg_condition: 'Rusak Sebagian',
        pkg_name_check: 'Ada',
        pkg_hazard_label: 'Tidak Perlu',
        pkg_good: 1,
        pkg_label_ok: 1,
      },
      {
        date: '2025-02-05',
        supplier_id: supplierIds[3],
        po_no: 'PO/2025/004',
        surat_jalan_no: 'SJ/SUP004/020504',
        pabrik_danone: 'Danone Cikarang',
        product_code: 'CB-4015-D',
        kode_produksi: 'LOT-250205-004',
        nama_produsen: 'UD Mitra Kemasan',
        negara_produsen: 'Indonesia',
        logo_halal: 'Ada',
        expedition_name: 'Wahana',
        vehicle_no: 'B 3456 GHI',
        driver_name: 'Bambang Suryadi',
        driver_phone: '081567890123',
        expired_date: '2027-02-05',
        no_seal: 'SEAL-004567',
        arrival_time: '13:30',
        unloading_start_time: '14:00',
        unloading_end_time: '15:15',
        total_items_received: 1000,
        total_items_received_text: 'Seribu Karton',
        material_type: 'Corrugated Box',
        warna: 'Coklat Natural',
        jumlah_sampling: '20 pcs',
        tanggal_produksi: '2025-02-02',
        item_name: 'Shipper Box 50x40x30cm',
        status: 'pending',
        notes: 'Menunggu hasil lab test BCT',
        packaging_notes: 'Packing standard',
        vehicle_clean: 1,
        vehicle_no_odor: 1,
        vehicle_closed: 1,
        vehicle_on_time: 1,
        vehicle_on_time_delivery: 1,
        item_not_wet: 1,
        item_not_torn: 1,
        item_not_dusty: 1,
        item_closed_tight: 1,
        item_no_haram: 1,
        pkg_condition: 'Baik',
        pkg_name_check: 'Ada',
        pkg_hazard_label: 'Tidak Perlu',
        pkg_good: 1,
        pkg_label_ok: 1,
      },
      {
        date: '2025-02-04',
        supplier_id: supplierIds[4],
        po_no: 'PO/2025/005',
        surat_jalan_no: 'SJ/SUP005/020405',
        pabrik_danone: 'Danone Cikupa',
        product_code: 'CB-5020-E',
        kode_produksi: 'LOT-250204-005',
        nama_produsen: 'PT Corrugated Box Nusantara',
        negara_produsen: 'Indonesia',
        logo_halal: 'Ada',
        expedition_name: 'Tiki',
        vehicle_no: 'B 7890 JKL',
        driver_name: 'Sutrisno',
        driver_phone: '081678901234',
        expired_date: '2027-02-04',
        no_seal: 'SEAL-005678',
        arrival_time: '06:45',
        unloading_start_time: '07:00',
        unloading_end_time: '08:30',
        total_items_received: 600,
        total_items_received_text: 'Enam Ratus Karton',
        material_type: 'Corrugated Box',
        warna: 'Coklat dengan Print Hitam',
        jumlah_sampling: '18 pcs',
        tanggal_produksi: '2025-02-01',
        item_name: 'Transport Box 45x35x28cm',
        status: 'completed',
        notes: 'Material excellent quality',
        packaging_notes: 'Perfect packaging',
        vehicle_clean: 1,
        vehicle_no_odor: 1,
        vehicle_closed: 1,
        vehicle_on_time: 1,
        vehicle_on_time_delivery: 1,
        item_not_wet: 1,
        item_not_torn: 1,
        item_not_dusty: 1,
        item_closed_tight: 1,
        item_no_haram: 1,
        pkg_condition: 'Baik',
        pkg_name_check: 'Ada',
        pkg_hazard_label: 'Tidak Perlu',
        pkg_good: 1,
        pkg_label_ok: 1,
      },
    ];

    const inspectionIds: number[] = [];
    for (const insp of inspections) {
      // Generate inspection number
      const dateStr = insp.date.replace(/-/g, '');
      const count = prepare('SELECT COUNT(*) as count FROM incoming_inspections WHERE inspection_date = ?').get(insp.date) as { count: number };
      const seq = String((count?.count || 0) + 1).padStart(3, '0');
      const inspectionNo = `INSP-${dateStr}-${seq}`;

      const result = prepare(`
        INSERT INTO incoming_inspections (
          inspection_no, inspection_date, supplier_id, po_no, surat_jalan_no,
          pabrik_danone, product_code, kode_produksi, nama_produsen, negara_produsen, logo_halal,
          expedition_name, vehicle_no, driver_name, driver_phone, expired_date, no_seal,
          arrival_time, unloading_start_time, unloading_end_time, total_items_received, total_items_received_text,
          material_type, warna, jumlah_sampling, tanggal_produksi, item_name,
          checker_id, status, notes, packaging_notes,
          vehicle_clean, vehicle_no_odor, vehicle_closed, vehicle_on_time, vehicle_on_time_delivery,
          item_not_wet, item_not_torn, item_not_dusty, item_closed_tight, item_no_haram,
          pkg_condition, pkg_name_check, pkg_hazard_label, pkg_good, pkg_label_ok
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        inspectionNo, insp.date, insp.supplier_id, insp.po_no, insp.surat_jalan_no,
        insp.pabrik_danone, insp.product_code, insp.kode_produksi, insp.nama_produsen, insp.negara_produsen, insp.logo_halal,
        insp.expedition_name, insp.vehicle_no, insp.driver_name, insp.driver_phone, insp.expired_date, insp.no_seal,
        insp.arrival_time, insp.unloading_start_time, insp.unloading_end_time, insp.total_items_received, insp.total_items_received_text,
        insp.material_type, insp.warna, insp.jumlah_sampling, insp.tanggal_produksi, insp.item_name,
        checker.id, insp.status, insp.notes, insp.packaging_notes,
        insp.vehicle_clean, insp.vehicle_no_odor, insp.vehicle_closed, insp.vehicle_on_time, insp.vehicle_on_time_delivery,
        insp.item_not_wet, insp.item_not_torn, insp.item_not_dusty, insp.item_closed_tight, insp.item_no_haram,
        insp.pkg_condition, insp.pkg_name_check, insp.pkg_hazard_label, insp.pkg_good, insp.pkg_label_ok
      );

      const inspectionId = Number(result.lastInsertRowid);
      inspectionIds.push(inspectionId);
      console.log(`   ✅ ${inspectionNo} - ${insp.po_no}`);
    }
    console.log(`\n✅ Created ${inspections.length} inspections\n`);

    // 3. CREATE INSPECTION ITEMS (QC Sampling)
    console.log('🔍 Creating inspection items (QC sampling)...');
    let totalItems = 0;

    // For each inspection, create 3-5 sample items
    for (let i = 0; i < inspectionIds.length; i++) {
      const inspectionId = inspectionIds[i];
      const numSamples = Math.floor(Math.random() * 3) + 3; // 3-5 samples

      for (let j = 0; j < numSamples; j++) {
        const batchNo = `BATCH-${i + 1}-${j + 1}`;
        const paletNo = `PLT-${String(j + 1).padStart(3, '0')}`;
        const qty = Math.floor(Math.random() * 100) + 50; // 50-150
        const isOk = Math.random() > 0.1 ? 1 : 0; // 90% OK
        const notes = isOk ? 'Sesuai spesifikasi' : 'Ada sedikit cacat pada sudut';

        prepare(`
          INSERT INTO inspection_items (inspection_id, batch_no, expired_date, palet_no, qty, is_ok, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(inspectionId, batchNo, '2027-02-08', paletNo, qty, isOk, notes);

        totalItems++;
      }
    }
    console.log(`   ✅ Created ${totalItems} inspection items\n`);

    // 4. CREATE INSPECTION WEIGHTS (Timbangan Sampling)
    console.log('⚖️  Creating inspection weights...');
    let totalWeights = 0;

    for (let i = 0; i < inspectionIds.length; i++) {
      const inspectionId = inspectionIds[i];
      const numWeights = Math.floor(Math.random() * 3) + 2; // 2-4 weight samples

      for (let j = 0; j < numWeights; j++) {
        const batchNo = `BATCH-${i + 1}-${j + 1}`;
        const weight = (Math.random() * 2 + 18).toFixed(2); // 18-20 kg
        const photoUrl = j === 0 ? `/uploads/weights/sample-weight-${i + 1}.jpg` : null;

        prepare(`
          INSERT INTO inspection_weights (inspection_id, batch_no, weight, photo_url)
          VALUES (?, ?, ?, ?)
        `).run(inspectionId, batchNo, parseFloat(weight), photoUrl);

        totalWeights++;
      }
    }
    console.log(`   ✅ Created ${totalWeights} weight measurements\n`);

    // 5. CREATE QC PARAMETERS
    console.log('📊 Creating QC parameters...');

    for (const inspectionId of inspectionIds) {
      // Generate realistic QC scores
      const qcScore = Math.floor(Math.random() * 15) + 85; // 85-100
      const fsScore = Math.floor(Math.random() * 10) + 90; // 90-100

      let decision = 'Diterima';
      if (qcScore < 90 || fsScore < 95) {
        decision = 'AOD'; // Accept on Deviation
      }
      if (qcScore < 85 || fsScore < 90) {
        decision = 'Hold';
      }

      prepare(`
        INSERT INTO inspection_qc_params (
          inspection_id,
          q_berat, q_joint, q_creasing,
          q_coa_panjang, q_coa_lebar, q_coa_tinggi, q_coa_tebal,
          q_coa_bct, q_coa_cobb, q_coa_bursting, q_coa_batch_lot, q_coa_color_chip,
          q_visual_sobek, q_visual_cetakan, q_visual_flutting, q_visual_packaging, q_visual_warna, q_visual_clarity,
          fs_mat_bersih, fs_mat_bau,
          fs_veh_bersih, fs_veh_bau, fs_veh_bak, fs_veh_segel,
          qc_score, fs_score, decision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        inspectionId,
        1, 1, 1, // Kualitas: Berat, Joint, Creasing
        1, 1, 1, 1, // CoA: Panjang, Lebar, Tinggi, Tebal
        1, 1, 1, 1, 1, // CoA: BCT, Cobb, Bursting, Batch/Lot, Color Chip
        1, 1, 1, 1, 1, 1, // Visual: Sobek, Cetakan, Flutting, Packaging, Warna, Clarity
        1, 1, // Food Safety Material: Bersih, Bau
        1, 1, 1, 1, // Food Safety Vehicle: Bersih, Bau, Bak, Segel
        qcScore, fsScore, decision
      );
    }
    console.log(`   ✅ Created QC parameters for ${inspectionIds.length} inspections\n`);

    saveDb();

    // Summary
    console.log('═══════════════════════════════════════════════');
    console.log('  SEEDING COMPLETED SUCCESSFULLY! ✅');
    console.log('═══════════════════════════════════════════════\n');
    console.log('📊 Summary:');
    console.log(`   • Suppliers: ${suppliers.length}`);
    console.log(`   • Inspections: ${inspections.length}`);
    console.log(`   • QC Items: ${totalItems}`);
    console.log(`   • Weight Samples: ${totalWeights}`);
    console.log(`   • QC Parameters: ${inspectionIds.length}\n`);
    console.log('🎯 You can now test the incoming material inspection module!\n');

  } catch (error: any) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

seedIncomingMaterialData();
