import { pool } from './db';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🏁 Iniciando migración de base de datos para SLA y Control de Tiempos...');

    // 1. Agregar campo fecha_limite a asignaciones_revision
    console.log('Agregando columna fecha_limite a asignaciones_revision...');
    await client.query(`
      ALTER TABLE asignaciones_revision 
      ADD COLUMN IF NOT EXISTS fecha_limite TIMESTAMP;
    `);

    console.log('🎉 Migración de base de datos de SLA finalizada con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando la migración de SLA:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
