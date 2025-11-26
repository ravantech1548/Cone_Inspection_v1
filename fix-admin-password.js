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

async function fixAdminPassword() {
  try {
    console.log('Fixing admin password...\n');
    
    const username = 'admin';
    const password = 'admin123';
    
    // Generate new hash
    console.log(`1. Generating bcrypt hash for password '${password}'...`);
    const hash = await bcrypt.hash(password, 10);
    console.log(`✓ Hash generated: ${hash.substring(0, 30)}...`);
    
    // Verify hash works
    console.log(`\n2. Verifying hash...`);
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      console.error('✗ Hash verification failed!');
      return;
    }
    console.log(`✓ Hash is valid`);
    
    // Update database
    console.log(`\n3. Updating admin user in database...`);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username, role',
      [hash, username]
    );
    
    if (result.rows.length === 0) {
      console.log(`✗ User '${username}' not found. Creating...`);
      await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [username, hash, 'admin']
      );
      console.log(`✓ User created`);
    } else {
      console.log(`✓ User updated`);
      console.log(`  Username: ${result.rows[0].username}`);
      console.log(`  Role: ${result.rows[0].role}`);
    }
    
    // Test login
    console.log(`\n4. Testing login...`);
    const testResult = await pool.query(
      'SELECT password_hash FROM users WHERE username = $1',
      [username]
    );
    const testIsValid = await bcrypt.compare(password, testResult.rows[0].password_hash);
    
    if (testIsValid) {
      console.log(`✓ Login test PASSED!`);
      console.log(`\nYou can now login with:`);
      console.log(`  Username: ${username}`);
      console.log(`  Password: ${password}`);
    } else {
      console.log(`✗ Login test FAILED!`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === '28P01') {
      console.error('\n✗ Database authentication failed!');
      console.error('Fix it with: psql -U postgres -c "ALTER USER textile_user WITH PASSWORD \'textile_pass_123\';"');
    }
  } finally {
    await pool.end();
  }
}

fixAdminPassword();

