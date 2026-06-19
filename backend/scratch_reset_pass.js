const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'ciei_db',
});

async function main() {
  const hash = bcrypt.hashSync('123', 10);
  console.log('Generating hash:', hash);
  const result = await pool.query('UPDATE usuarios SET password_hash = $1', [hash]);
  console.log('Updated rows:', result.rowCount);
  await pool.end();
}

main().catch(console.error);
