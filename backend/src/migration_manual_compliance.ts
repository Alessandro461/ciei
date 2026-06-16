import { pool } from './db';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🏁 Iniciando migración de base de datos para cumplimiento del Manual de Procedimientos CIEI...');

    // 1. Agregar columnas a la tabla solicitudes
    console.log('Agregando columnas de vulnerabilidad, es_invasivo y categoria_riesgo a solicitudes...');
    await client.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS involucra_grupos_vulnerables BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS descripcion_vulnerabilidad TEXT,
      ADD COLUMN IF NOT EXISTS es_invasivo BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS categoria_riesgo VARCHAR(20) DEFAULT 'bajo';
    `);

    console.log('🎉 Migración de cumplimiento del Manual finalizada con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando la migración del Manual:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
