// Test login endpoint to see the actual error
import https from 'https';
import fetch from 'node-fetch';

const BACKEND_URL = 'https://192.168.0.17:3002';

// Create agent that accepts self-signed certificates
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testLogin() {
  console.log('Testing login endpoint...\n');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://192.168.0.17:5175'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
      agent
    });
    
    const data = await response.json().catch(() => ({ error: 'No JSON response' }));
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✓ Login successful!');
    } else {
      console.log('\n✗ Login failed');
      if (data.error) {
        console.log(`Error: ${data.error}`);
      }
      if (data.stack) {
        console.log(`Stack trace: ${data.stack}`);
      }
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testLogin();

