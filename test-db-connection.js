// Test database connection
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function testDB() {
  try {
    console.log('Testing database connection...\n');
    
    // Test connection
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    
    // Test query
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`✓ Query successful: ${result.rows[0].count} users found`);
    
    // Test admin user
    const adminResult = await client.query(
      'SELECT id, username, role FROM users WHERE username = $1',
      ['admin']
    );
    
    if (adminResult.rows.length > 0) {
      console.log(`✓ Admin user found:`, adminResult.rows[0]);
    } else {
      console.log('✗ Admin user not found');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    if (error.code === '28P01') {
      console.error('  Authentication failed. Check username/password.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('  Connection refused. Is PostgreSQL running?');
    }
    process.exit(1);
  }
}

testDB();

