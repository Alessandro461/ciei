import { pool } from './db';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🏁 Iniciando migración de base de datos para Checklist en formato JSONB...');

    // 1. Agregar columna respuestas_json de tipo JSONB
    console.log('Agregando columna respuestas_json a evaluaciones_checklist...');
    await client.query(`
      ALTER TABLE evaluaciones_checklist 
      ADD COLUMN IF NOT EXISTS respuestas_json JSONB;
    `);

    // 2. Eliminar columnas viejas
    console.log('Eliminando columnas de aspectos viejos en evaluaciones_checklist...');
    await client.query(`
      ALTER TABLE evaluaciones_checklist
      DROP COLUMN IF EXISTS aspecto_metodologico_calif,
      DROP COLUMN IF EXISTS aspecto_metodologico_just,
      DROP COLUMN IF EXISTS aspecto_etico_calif,
      DROP COLUMN IF EXISTS aspecto_etico_just,
      DROP COLUMN IF EXISTS aspecto_legal_calif,
      DROP COLUMN IF EXISTS aspecto_legal_just,
      DROP COLUMN IF EXISTS aspecto_presupuestal_calif,
      DROP COLUMN IF EXISTS aspecto_presupuestal_just,
      DROP COLUMN IF EXISTS hoja_informacion_calif,
      DROP COLUMN IF EXISTS hoja_informacion_just;
    `);

    console.log('🎉 Migración de base de datos finalizada con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando la migración de JSONB:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
