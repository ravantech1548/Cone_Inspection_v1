// Test backend on port 3001
const BACKEND_URL = 'https://192.168.0.17:3001';

async function testBackend() {
  console.log('Testing backend on port 3001...\n');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✓ Backend is accessible!');
      console.log(`  Status: ${data.status}`);
      console.log(`  URL: ${BACKEND_URL}`);
    } else {
      console.log(`✗ Backend returned: ${healthResponse.status}`);
    }
    
    // Test login endpoint
    console.log('\nTesting login endpoint...');
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://192.168.0.17:5175'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✓ Login endpoint works!');
      console.log(`  Token received: ${loginData.token ? 'Yes' : 'No'}`);
    } else {
      console.log(`  Login response: ${loginResponse.status}`);
      console.log(`  Message: ${loginData.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      console.error('\n  Backend is not accessible. Check:');
      console.error('  1. Is the backend running?');
      console.error('  2. Is the port correct? (should be 3001)');
      console.error('  3. Are there firewall issues?');
    }
  }
}

testBackend();

