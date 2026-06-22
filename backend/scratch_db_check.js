const { Client } = require('pg');

const connectionString = process.argv[2];

if (!connectionString) {
  console.error('❌ Error: Debes proporcionar la URL de conexión pública de la base de datos (DATABASE_PUBLIC_URL).');
  console.error('Ejemplo: node scratch_db_check.js "postgresql://postgres:password@proxy.rlwy.net:port/railway"');
  process.exit(1);
}

async function main() {
  console.log('🔄 Conectando a la base de datos...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 ¡Conexión exitosa a la base de datos!');

    // 1. Verificar tablas existentes
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\n📊 Tablas encontradas en la base de datos:');
    if (tablesRes.rows.length === 0) {
      console.log('⚠️  No se encontraron tablas. La base de datos está vacía.');
    } else {
      tablesRes.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }

    // 2. Verificar usuarios
    const usersRes = await client.query(`
      SELECT id, dni, nombres, apellidos, correo_institucional, rol, estado 
      FROM usuarios
    `);
    console.log('\n👥 Usuarios registrados:');
    if (usersRes.rows.length === 0) {
      console.log('⚠️  No hay usuarios registrados.');
    } else {
      usersRes.rows.forEach(user => {
        console.log(`  - ID: ${user.id} | Email: ${user.correo_institucional} | Rol: ${user.rol} | Estado: ${user.estado} (${user.nombres} ${user.apellidos})`);
      });
    }

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  } finally {
    await client.end();
  }
}

main();
