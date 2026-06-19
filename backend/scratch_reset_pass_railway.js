const { Client } = require('pg');
const bcrypt = require('bcrypt');

const connectionString = process.argv[2];

if (!connectionString) {
  console.error('❌ Error: Debes proporcionar la URL de conexión de la base de datos.');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  const hash = bcrypt.hashSync('123', 10);
  console.log('Generating hash:', hash);
  const result = await client.query('UPDATE usuarios SET password_hash = $1', [hash]);
  console.log('Updated rows:', result.rowCount);
  await client.end();
}

main().catch(console.error);
