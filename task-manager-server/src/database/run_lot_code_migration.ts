import { initDb } from './db';
import { migrateAddLotCodeToInspectionItems } from './migrations/add_lot_code_to_inspection_items';

async function run() {
  console.log('Initializing DB...');
  await initDb();
  console.log('Running lot_code migration for inspection_items...');
  migrateAddLotCodeToInspectionItems();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
