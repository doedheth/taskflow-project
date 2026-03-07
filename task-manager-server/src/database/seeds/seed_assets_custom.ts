
import fs from 'fs';
import path from 'path';
import { initDb, prepare, exec } from '../db';

const csvData = `
No;Kode;Kategori;Merk;Tahun;Serial;Lokasi;Keterangan;
1;TF 1;Thermoform 1;GABLER M92L;2004;4697;Gedung 1;Thermoforming;
2;TF 2;Thermoform 2;GABLER M92L;2006;4777;Gedung 1;Thermoforming;
3;TF 3;Thermoform 3;DESIGNER;2015;F-70B-S150;Gedung 1;Thermoforming;
4;TRAY;Thermoform 4;POLYPRINT TRAY;2020;;Gedung 2;Thermoforming;
5;EXT 1;Extrusion 1;JWELL;2023;BZ-2209-154;Gedung 1;Extrusion;
6;EXT 2;Extrusion 2;BATTENFELD;2004;BEX 1 - 60 - 34 DV;Gedung 1;Extrusion;
7;EXT 3;Extrusion 3;EXTRUDER DESIGNER;2015;;Gedung 1;Extrusion;
8;P 1;Printing 1;OMSO Key Cup;2007;145 0233 06;Gedung 1;Print Cup;
9;P 2;Printing 2;OMSO Key Cup;2008;145 0238 07;Gedung 1;Print Cup;
10;P 3;Printing 3;OMSO Key Cup;2013;145 0255 13;Gedung 1;Print Cup;
11;P4;Printing 4;POLYPRINT;2022;20220723;Gedung 1;Print Cup;
12;S 1;Compression Moulding;SACMI CCM48SA;2007;10023702;Gedung 1;Pembuatan Tutup Botol;
13;S 2;Compression Moulding;SACMI CCM48SA;2010;10074286;Gedung 1;Pembuatan Tutup Botol;
14;S 3;Compression Moulding;SACMI CCM48SB;2016;10226071;Gedung 1;Pembuatan Tutup Botol;
15;S 4;Compression Moulding;SACMI CM48SD_S30W4;2023;10512628;Gedung 1;Pembuatan Tutup Botol;
16;KM 1;Preform Moulding 1;KRAUSS MAFFEI 320-4500 CS PET;2013;61018239;Gedung 1;Preform Mulding;
17;KM 2;Preform Moulding 2;KRAUSS MAFFEI 320-4500 CS PET;2014;61020240;Gedung 1;Preform Mulding;
18;IPS;Preform Moulding 3;SACMI IPS30086802;2024;10478815;Gedung 1;Preform Mulding;
19;CP 1;Compressor 1;KAESER 100HP CSD 125 - 2022;2022;1119-8654998;Gedung 1;Compressor;
20;CP 2;Compressor 7;KAESER 100HP CSD125 - 2019;2019;1031-7177176;Gedung 1;Compressor;
21;CP 3;Compressor 6;KAESER 100HP CSD125 - 2017;2017;1163;Gedung 1;Compressor;
22;CP 4;Compressor 5;KAESER 100HP CSD125 - 2013;2013;1126;Gedung 1;Compressor;
23;CP 5;Compressor 3;KAESER 100HP CSD 122;2007;2841;Gedung 1;Compressor;
24;CP 6;Compressor 4;ATLAS COPCO GA18FF;2023;ITJ750673;Gedung 1;Compressor;
25;CP 7;Compressor 2;BOGE 100HP S100-2;2007;5032857;Gedung 1;Compressor;
26;CP 8;Compressor 8;BOGE S29-2;-;-;Gedung 2;Compressor Mesin Tray;
36;CH 1;Chiller 1;KKT KRAUS KLB-S52T;2004;IK4460-01-04;Gedung 1;Untuk pendingin mesin Gabler TF-1;
37;CH 2;Chiller 2;KKT KRAUS KLB-S52T;2006;IK5666-01-06;Gedung 1;Untuk pendingin mesin Gabler TF-2;
38;CH 3;Chiller 3;DAIKIN EWAP140MBYNN;2004;6600897;Gedung 1;Untuk pendingin mesin Thermo 1,2,3;
39;CH 4;Chiller 4;INDUSTRIAL FRIGO MK200 PET;2009;090093/2;Gedung 1;Untuk pendingin mesin Thermo 1,2,3;
40;CH 5;Chiller 5;WENSUI;-;-;Gedung 1;Untuk pendingin mesin Thermo 1,2,3;
41;CH 6;Chiller 6;FUJICO KECIL;2015;-;Gedung 1;Untuk pendingin mesin designer;
42;CH 7;Chiller 7;FUJICO BESAR;2015;-;Gedung 1;Untuk pendingin backup chiller thermo;
43;CH 8;Chiller 8;INDUSTRIAL FRIGO GRAC 250/ZX;2015;37226;Gedung 1;Untuk pendingin mesin Thermo 1,2,3 Backup Chiller Master;
44;CH 9;Chiller 9;INDUSTRIAL FRIGO GRWC 380/Z/X;2016;40058;Gedung 1;Untuk Pendingin TF 1,2,3 Chiller Master TF;
45;CH 10;Chiller 10;FUJICO TIMUR (FC 100H);2016;1186;Gedung 1;Untuk pendingin printing 1,2,3;
46;CH 11;Chiller 11;FUJICO BARAT (FC 100H);2013;1119;Gedung 1;Untuk pendingin printing 1,2,3;
47;CH 12;Chiller 12;INDUSTRIAL FRIGO GRAC 165;2022;57526;Gedung 1;Untuk pendingin mesin Sacmi-1;
48;CH 13;Chiller 13;INDUSTRIAL FRIGO GR1AC 100/Z;2010;26499;Gedung 1;Untuk pendingin mesin Sacmi-2;
49;CH 14;Chiller 14;INDUSTRIAL FRIGO GR1AC 100/Z;2007;0406/07;Gedung 1;Untuk pendingin mesin Sacmi-2 Backup;
50;CH 15;Chiller 15;INDUSTRIAL FRIGO GRAC 120/Z/AX;2015;38275;Gedung 1;Untuk pendingin ex mesin Sacmi-3;
51;CH 16;Chiller 16;INDUSTRIAL FRIGO 125/Z;2013;32545;Gedung 1;Untuk pendingin mesin sacmi 3;
52;CH 17;Chiller 17;INDUSTRIAL FRIGO GR1AC 240/Z/AX;2023;58327;Gedung 1;Untuk pendingin mesin Sacmi 4;
53;CH 18;Chiller 18;DAIKIN EWAP140MBYNN;2006;6600897;Gedung 1;Untuk pendingin mesin KM 1 & 2;
54;CH 19;Chiller 19;GWK PET COOL 235-A-45;2013;267948-01-01;Gedung 1;Untuk Pendingin Mesin KraussMaffei 1;
55;CH 20;Chiller 20;INDUSTRIAL FRIGO GRAC 420/X;2021;52802;Gedung 1;Untuk pendingin KM 2;
56;CH 21;Chiller 21;INDUSTRIAL FRIGO GRAC 210/Z/AX;2023;59506;Gedung 1;Untuk pendingin HIGH TEMP Mesin IPS;
57;CH 22;Chiller 22;INDUSTRIAL FRIGO GRAC 480/Z/AX/X;2023;59513;Gedung 1;Untuk pendingin LOW TEMP Mesin IPS;
58;CH 23;Chiller 23;INDUSTRIAL FRIGO GRAC 210/Z/X;2016;40057;Gedung 1;Untuk pendingin CT;
27;AD 1;Air Dryer 1;STERLING SD500/;2004;29083980;Gedung 1;Sensoris Compressor;
28;AD 2;Air Dryer 2;BOGE ED 137;2010;EDI372300710035;Gedung 1;Sensoris Compressor;
29;AD 3;Air Dryer 3;AIR DRYER KAESER TE 121;2013;3651;Gedung 1;Sensoris Compressor;
30;AD 4;Air Dryer 4;AIR DRYER KAESER TE 121;2015;4168;Gedung 1;Sensoris Kompresor;
31;AD 5;Air Dryer 5;AIR DRYER KAESER TE 121;2007;2072;Gedung 1;Sensoris Kompresor;
32;AD 6;Air Dryer 8;AIR DRYER KAESER TE 122;2022;1833-8591312;Gedung 1;Sensoris Kompresor;
33;AD 7;Air Dryer 9;AIR DRYER KAESER TE 122;2019;1028-7087868;Gedung 1;Sensoris Kompresor;
34;AD 7;Air Dryer 9;AIR DRYER TRAY;-;-;Gedung 2;Sensoris Kompresor;
`;

async function seedAssets() {
  try {
    console.log('🌱 Seeding assets from CSV data...');
    await initDb();

    // Disable Foreign Keys temporarily
    exec('PRAGMA foreign_keys = OFF');

    // 1. Clear existing assets
    console.log('🗑️ Clearing existing assets table...');
    exec('DELETE FROM assets');
    // Optional: Reset auto-increment
    exec('DELETE FROM sqlite_sequence WHERE name="assets"');

    // Re-enable Foreign Keys
    exec('PRAGMA foreign_keys = ON');

    // 2. Process CSV
    const lines = csvData.trim().split('\n');
    let count = 0;

    // Cache categories to avoid repeated selects
    const categoryCache = new Map<string, number>();

    for (const line of lines) {
      if (!line || line.startsWith('No;')) continue; // Skip header and empty lines

      const parts = line.split(';');
      // Format: No;Kode;Kategori(Name);Merk;Tahun;Serial;Lokasi;Keterangan(Category);
      const no = parts[0];
      const code = parts[1]?.trim();
      const name = parts[2]?.trim(); // "Kategori" column in CSV acts as Name
      const manufacturer = parts[3]?.trim();
      const yearStr = parts[4]?.trim();
      const serial = parts[5]?.trim();
      const location = parts[6]?.trim();
      const categoryName = parts[7]?.trim(); // "Keterangan" column in CSV acts as Category

      if (!code || !name) {
        console.warn(`Skipping invalid line: ${line}`);
        continue;
      }

      // Handle Purchase Date
      let purchaseDate = null;
      if (yearStr && yearStr !== '-' && !isNaN(parseInt(yearStr))) {
        purchaseDate = `${yearStr}-01-01`;
      }

      // Handle Category ID
      let categoryId = null;
      if (categoryName && categoryName !== '-') {
        if (categoryCache.has(categoryName)) {
          categoryId = categoryCache.get(categoryName);
        } else {
          // Check if category exists
          const existingCat = prepare('SELECT id FROM asset_categories WHERE name = ?').get(categoryName) as { id: number } | undefined;
          if (existingCat) {
            categoryId = existingCat.id;
          } else {
            // Create new category
            const result = prepare('INSERT INTO asset_categories (name) VALUES (?)').run(categoryName);
            categoryId = result.lastInsertRowid as number;
            console.log(`Created new category: ${categoryName}`);
          }
          categoryCache.set(categoryName, categoryId as number);
        }
      }

      // Handle Serial Number
      const serialValue = serial && serial !== '-' ? serial : null;

      // Insert Asset
      try {
        prepare(`
          INSERT INTO assets (
            asset_code, name, category_id, location, manufacturer,
            purchase_date, serial_number, status, criticality
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'operational', 'medium')
        `).run(
          code,
          name,
          categoryId,
          location,
          manufacturer,
          purchaseDate,
          serialValue
        );
        count++;
      } catch (err) {
        console.error(`Error inserting asset ${code}:`, err);
      }
    }

    console.log(`✅ Successfully seeded ${count} assets.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

seedAssets();
