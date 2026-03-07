
import { initDb, prepare } from './database/db';

async function checkDepartments() {
  try {
    console.log('Initializing DB...');
    await initDb();

    console.log('Querying departments...');
    const depts = prepare('SELECT * FROM departments').all();

    console.log('Departments found:', depts.length);
    console.log(JSON.stringify(depts, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDepartments();
