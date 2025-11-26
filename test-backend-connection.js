// Test script to check backend connectivity

const BACKEND_URL = 'http://192.168.0.17:3002';

async function testBackend() {
  console.log('Testing backend connection...\n');
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  
  try {
    // Test health endpoint
    console.log('1. Testing /health endpoint...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✓ Backend is running!');
      console.log(`  Status: ${healthData.status}`);
      console.log(`  Timestamp: ${healthData.timestamp}`);
    } else {
      console.log(`✗ Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }
    
    // Test login endpoint (should fail with 400/401, but should connect)
    console.log('\n2. Testing /api/auth/login endpoint...');
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
    
    console.log(`  Status: ${loginResponse.status} ${loginResponse.statusText}`);
    const loginData = await loginResponse.json().catch(() => ({ error: 'No JSON response' }));
    
    if (loginResponse.ok) {
      console.log('✓ Login endpoint is working!');
      console.log(`  Token received: ${loginData.token ? 'Yes' : 'No'}`);
    } else {
      console.log(`  Response: ${JSON.stringify(loginData)}`);
      if (loginResponse.status === 401) {
        console.log('  (401 is expected if credentials are wrong, but connection works)');
      }
    }
    
    // Check CORS headers
    console.log('\n3. Checking CORS headers...');
    const corsHeaders = {
      'Access-Control-Allow-Origin': loginResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': loginResponse.headers.get('Access-Control-Allow-Credentials'),
      'Access-Control-Allow-Methods': loginResponse.headers.get('Access-Control-Allow-Methods')
    };
    console.log('  CORS Headers:', JSON.stringify(corsHeaders, null, 2));
    
  } catch (error) {
    console.error('\n✗ Connection failed!');
    console.error(`  Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n  The backend server is not running or not accessible.');
      console.error('  Start it with: npm run dev:backend');
    } else if (error.message.includes('fetch')) {
      console.error('\n  Network error. Check:');
      console.error('  1. Is the backend running?');
      console.error('  2. Is the IP address correct?');
      console.error('  3. Is there a firewall blocking the connection?');
    }
  }
}

testBackend();

