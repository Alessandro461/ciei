import { pool } from './db';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🏁 Iniciando migración de base de datos para la Fase 6...');

    // 1. Columnas adicionales en la tabla 'solicitudes'
    console.log('Creando columnas en tabla solicitudes...');
    await client.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS identidad_revelada BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS tipo_revision VARCHAR(20) DEFAULT 'completa';
    `);

    // 2. Columnas adicionales en la tabla 'usuarios'
    console.log('Creando columnas en tabla usuarios...');
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS es_invitado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS acepto_confidencialidad_anexol BOOLEAN DEFAULT false;
    `);

    // 3. Alterar enum 'estado_solicitud_enum'
    console.log('Agregando estado "revision_enmienda" a estado_solicitud_enum...');
    try {
      await client.query("ALTER TYPE public.estado_solicitud_enum ADD VALUE 'revision_enmienda'");
      console.log('✅ Estado "revision_enmienda" agregado con éxito.');
    } catch (err: any) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('ℹ️ El valor "revision_enmienda" ya existe en el enum.');
      } else {
        console.warn('⚠️ No se pudo alterar el enum automáticamente. Es posible que ya exista o requiera cambios manuales:', err.message);
      }
    }

    // 4. Crear tabla 'evaluaciones_checklist'
    console.log('Creando tabla evaluaciones_checklist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.evaluaciones_checklist (
          id SERIAL PRIMARY KEY,
          dictamen_id INTEGER NOT NULL REFERENCES public.dictamenes(id) ON DELETE CASCADE,
          tipo_anexo VARCHAR(10) NOT NULL, -- 'G' o 'H'
          aspecto_metodologico_calif VARCHAR(20) NOT NULL, -- 'Adecuado', 'Insuficiente', 'Inadecuado', 'No aplica'
          aspecto_metodologico_just TEXT,
          aspecto_etico_calif VARCHAR(20) NOT NULL,
          aspecto_etico_just TEXT,
          aspecto_legal_calif VARCHAR(20) NOT NULL,
          aspecto_legal_just TEXT,
          aspecto_presupuestal_calif VARCHAR(20) NOT NULL,
          aspecto_presupuestal_just TEXT,
          hoja_informacion_calif VARCHAR(20) NOT NULL,
          hoja_informacion_just TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Crear tabla 'declaraciones_coi'
    console.log('Creando tabla declaraciones_coi...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.declaraciones_coi (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
          anio INTEGER NOT NULL,
          firma_digital TEXT NOT NULL,
          fecha_firma TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Crear tabla 'seguimiento_post_aprobacion'
    console.log('Creando tabla seguimiento_post_aprobacion...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.seguimiento_post_aprobacion (
          id SERIAL PRIMARY KEY,
          solicitud_id INTEGER NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
          tipo_reporte VARCHAR(30) NOT NULL, -- 'informe_avance', 'evento_adverso', 'enmienda'
          titulo VARCHAR(255) NOT NULL,
          descripcion TEXT,
          ruta_archivo VARCHAR(255),
          estado_seguimiento VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'observado'
          fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('🎉 Migración de base de datos finalizada con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
