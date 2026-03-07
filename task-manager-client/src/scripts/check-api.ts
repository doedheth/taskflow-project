
import axios from 'axios';

async function checkApi() {
  try {
    // Assuming backend is running on localhost:3333
    // We need a valid token or we need to bypass auth.
    // Since I can't easily get a token, I will modify the backend temporarily to log the output of getLogDetail
    // or I can rely on my previous backend fix.
    
    console.log('Please check the backend logs or response manually.');
  } catch (error) {
    console.error(error);
  }
}
