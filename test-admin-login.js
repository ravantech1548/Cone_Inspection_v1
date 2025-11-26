import pg from 'pg';
import bcrypt from 'bcrypt';
const { Pool } = pg;

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'textile_inspector',
  user: 'textile_user',
  password: 'textile_pass_123'
});

async function testAdminLogin() {
  try {
    console.log('Testing Admin Login...\n');
    
    const username = 'admin';
    const password = 'admin123';
    
    // Query user from database
    console.log(`1. Checking if user '${username}' exists...`);
    const result = await pool.query(
      'SELECT id, username, password_hash, role, created_at FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log(`✗ User '${username}' not found in database`);
      console.log('\nTo create the user, run:');
      console.log(`psql -U textile_user -d textile_inspector -h 127.0.0.1`);
      console.log(`INSERT INTO users (username, password_hash, role)`);
      console.log(`VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');`);
      return;
    }
    
    const user = result.rows[0];
    console.log(`✓ User found in database`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Created: ${user.created_at}`);
    console.log(`  Password Hash: ${user.password_hash.substring(0, 30)}...`);
    
    // Test password
    console.log(`\n2. Testing password '${password}'...`);
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (isValid) {
      console.log(`✓ Password is CORRECT!`);
      console.log(`\nLogin should work with:`);
      console.log(`  Username: ${username}`);
      console.log(`  Password: ${password}`);
    } else {
      console.log(`✗ Password is INCORRECT!`);
      console.log(`\nThe password hash in the database doesn't match '${password}'`);
      console.log(`\nTo fix this, you need to update the password hash.`);
      console.log(`Run this script to generate a new hash:`);
      console.log(`  node generate-password-hash.js`);
      console.log(`\nThen update the database:`);
      console.log(`  psql -U textile_user -d textile_inspector -h 127.0.0.1`);
      console.log(`  UPDATE users SET password_hash = '<new_hash>' WHERE username = 'admin';`);
    }
    
    // List all users
    console.log(`\n3. All users in database:`);
    const allUsers = await pool.query('SELECT id, username, role FROM users ORDER BY id');
    allUsers.rows.forEach(u => {
      console.log(`  - ${u.username} (${u.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === '28P01') {
      console.error('\n✗ Database authentication failed!');
      console.error('The password for textile_user is incorrect.');
      console.error('Fix it with: psql -U postgres -c "ALTER USER textile_user WITH PASSWORD \'textile_pass_123\';"');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n✗ Cannot connect to database!');
      console.error('Make sure PostgreSQL is running on 127.0.0.1:5432');
    }
  } finally {
    await pool.end();
  }
}

testAdminLogin();

