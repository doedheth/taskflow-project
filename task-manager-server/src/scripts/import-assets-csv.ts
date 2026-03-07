
import fs from 'fs';
import path from 'path';
import { initDb, prepare, run } from '../database/db';

const csvPath = 'd:\\SAP\\docs\\Daftar Mesin dan Utility 2025.csv';

interface AssetRow {
  No: string;
  Kode: string;
  Kategori: string;
  Merk: string;
  Tahun: string;
  Serial: string;
  Lokasi: string;
  Keterangan: string;
}

async function importAssets() {
  try {
    await initDb();
    console.log('Database initialized.');

    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found:', csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    // Skip header
    const dataLines = lines.slice(1);

    // Ensure Categories Exist
    const categories = [
      { name: 'Thermoforming Machine', description: 'Mesin thermoforming utama' },
      { name: 'Extrusion', description: 'Mesin ekstrusi' },
      { name: 'Printing', description: 'Mesin printing cup' },
      { name: 'Compression Moulding', description: 'Mesin pembuat tutup botol (Sacmi)' },
      { name: 'Preform Moulding', description: 'Mesin preform moulding' },
      { name: 'Compressor', description: 'Kompresor udara' },
      { name: 'Chiller', description: 'Mesin pendingin' },
      { name: 'Air Dryer', description: 'Pengering udara' },
      { name: 'Filter', description: 'Filter udara' },
      { name: 'Auxiliary', description: 'Peralatan pendukung lainnya' }
    ];

    for (const cat of categories) {
      const existing = prepare('SELECT id FROM asset_categories WHERE name = ?').get(cat.name);
      if (!existing) {
        run('INSERT INTO asset_categories (name, description) VALUES (?, ?)', [cat.name, cat.description]);
        console.log(`Created category: ${cat.name}`);
      }
    }

    // Refresh categories map
    const categoryMap: Record<string, number> = {};
    const allCats = prepare('SELECT id, name FROM asset_categories').all() as { id: number, name: string }[];
    allCats.forEach(c => categoryMap[c.name] = c.id);

    console.log('Processing assets...');

    for (const line of dataLines) {
      const cols = line.split(';');
      if (cols.length < 2) continue;

      const row: AssetRow = {
        No: cols[0]?.trim(),
        Kode: cols[1]?.trim(),
        Kategori: cols[2]?.trim(), // This acts as Name mostly
        Merk: cols[3]?.trim(),
        Tahun: cols[4]?.trim(),
        Serial: cols[5]?.trim(),
        Lokasi: cols[6]?.trim(),
        Keterangan: cols[7]?.trim()
      };

      if (!row.Kode) continue;

      // Determine Category ID
      let categoryId = categoryMap['Auxiliary']; // Default

      const keterangan = row.Keterangan.toLowerCase();
      const kategori = row.Kategori.toLowerCase();

      if (keterangan.includes('thermoforming') || kategori.includes('thermoform')) {
        categoryId = categoryMap['Thermoforming Machine'];
      } else if (keterangan.includes('extrusion') || kategori.includes('extrusion')) {
        categoryId = categoryMap['Extrusion'];
      } else if (keterangan.includes('print') || kategori.includes('printing')) {
        categoryId = categoryMap['Printing'];
      } else if (keterangan.includes('tutup botol') || kategori.includes('compression')) {
        categoryId = categoryMap['Compression Moulding'];
      } else if (keterangan.includes('preform') || kategori.includes('preform')) {
        categoryId = categoryMap['Preform Moulding'];
      } else if (keterangan.includes('compressor') || kategori.includes('compressor')) {
        categoryId = categoryMap['Compressor'];
      } else if (keterangan.includes('pendingin') || kategori.includes('chiller')) {
        categoryId = categoryMap['Chiller'];
      } else if (keterangan.includes('air dryer') || kategori.includes('air dryer') || kategori.includes('ad ')) {
        categoryId = categoryMap['Air Dryer'];
      } else if (keterangan.includes('filter') || kategori.includes('filter') || kategori.includes('fm ')) {
        categoryId = categoryMap['Filter'];
      }

      // Determine Name
      let name = row.Kategori;
      if (name === 'Compression Moulding') {
        name = `${name} (${row.Kode})`;
      }
      
      // Check if asset exists
      const existingAsset = prepare('SELECT id FROM assets WHERE asset_code = ?').get(row.Kode) as { id: number } | undefined;

      if (existingAsset) {
        console.log(`Updating asset: ${row.Kode}`);
        run(`UPDATE assets SET 
          name = ?, category_id = ?, location = ?, manufacturer = ?, 
          serial_number = ?, specifications = ?, notes = ?, updated_at = datetime('now')
          WHERE id = ?`, 
          [
            name, categoryId, row.Lokasi, row.Merk, 
            row.Serial, `Year: ${row.Tahun}`, row.Keterangan, 
            existingAsset.id
          ]
        );
      } else {
        console.log(`Creating asset: ${row.Kode}`);
        run(`INSERT INTO assets (
          asset_code, name, category_id, location, manufacturer, 
          serial_number, specifications, notes, status, criticality, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'operational', 'medium', datetime('now'), datetime('now'))`,
        [
          row.Kode, name, categoryId, row.Lokasi, row.Merk,
          row.Serial, `Year: ${row.Tahun}`, row.Keterangan
        ]);
      }
    }

    console.log('Import complete.');

  } catch (error) {
    console.error('Error importing assets:', error);
  }
}

importAssets();
