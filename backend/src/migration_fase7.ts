import { pool } from './db';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🏁 Iniciando migración de base de datos para la Fase 7...');

    // 1. Agregar campo rol_asignacion a asignaciones_revision
    console.log('Agregando columna rol_asignacion a asignaciones_revision...');
    await client.query(`
      ALTER TABLE asignaciones_revision 
      ADD COLUMN IF NOT EXISTS rol_asignacion VARCHAR(20) DEFAULT 'secundario';
    `);

    // 2. Agregar campo firma_imagen_ruta a usuarios
    console.log('Agregando columna firma_imagen_ruta a usuarios...');
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS firma_imagen_ruta VARCHAR(255);
    `);

    // 3. Agregar campo pdf_checklist_ruta a dictamenes
    console.log('Agregando columna pdf_checklist_ruta a dictamenes...');
    await client.query(`
      ALTER TABLE dictamenes 
      ADD COLUMN IF NOT EXISTS pdf_checklist_ruta VARCHAR(255);
    `);

    // 4. Agregar campo ruta_carta_revision a solicitudes
    console.log('Agregando columna ruta_carta_revision a solicitudes...');
    await client.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS ruta_carta_revision VARCHAR(255);
    `);

    console.log('🎉 Migración de base de datos de Fase 7 finalizada con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando la migración de Fase 7:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
