import { initDb } from './db';
import { up } from './migrations/add_batch_vendor_to_inspection_items';

async function run() {
  console.log('Initializing DB...');
  await initDb();
  console.log('Running migration...');
  await up();
  console.log('Done.');
}

run().catch(console.error);
