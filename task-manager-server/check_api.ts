
import fetch from 'node-fetch';

async function checkApi() {
  try {
    const response = await fetch('http://localhost:5000/api/downtime/active');
    const data = await response.json();
    console.log('--- Active Downtime Logs ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching API:', error);
  }
}

checkApi();
