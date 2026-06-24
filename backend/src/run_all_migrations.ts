import { pool } from './db';

async function runAllMigrations() {
  let client;
  let retries = 20;
  while (retries > 0) {
    try {
      client = await pool.connect();
      break;
    } catch (err: any) {
      console.log(`⏳ Esperando conexión con la base de datos... (${retries} intentos restantes). Error: ${err.message}`);
      retries -= 1;
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  }

  if (!client) {
    console.error('❌ No se pudo conectar a la base de datos después de múltiples intentos.');
    process.exit(1);
  }

  try {
    console.log('🏁 Iniciando ejecución de todas las migraciones acumuladas...');

    // 1. Solicitudes - Columnas adicionales de Fase 6
    console.log('Altering table solicitudes (Fase 6)...');
    await client.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS identidad_revelada BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS tipo_revision VARCHAR(20) DEFAULT 'completa',
      ADD COLUMN IF NOT EXISTS facultad VARCHAR(150) DEFAULT 'No especificada',
      ADD COLUMN IF NOT EXISTS escuela_profesional VARCHAR(150) DEFAULT 'No especificada',
      ADD COLUMN IF NOT EXISTS resumen TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS objetivos TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS metodologia TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS investigadores_asociados TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS duracion VARCHAR(50) DEFAULT '',
      ADD COLUMN IF NOT EXISTS usa_muestras_biologicas BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS tipo_muestras_biologicas VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS origen_fondos VARCHAR(50) DEFAULT 'autofinanciado',
      ADD COLUMN IF NOT EXISTS exonerado_pago BOOLEAN DEFAULT false;
    `);

    // 2. Usuarios - Columnas adicionales de Fase 6
    console.log('Altering table usuarios (Fase 6)...');
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS es_invitado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS acepto_confidencialidad_anexol BOOLEAN DEFAULT false;
    `);

    // 2.5 Documentos - Columnas adicionales
    console.log('Altering table documentos to add anexo_clave...');
    await client.query(`
      ALTER TABLE documentos 
      ADD COLUMN IF NOT EXISTS anexo_clave VARCHAR(100) DEFAULT 'proyecto';
    `);

    // 3. Alterar enum 'estado_solicitud_enum'
    console.log('Adding "revision_enmienda" to estado_solicitud_enum...');
    try {
      await client.query("ALTER TYPE public.estado_solicitud_enum ADD VALUE 'revision_enmienda'");
      console.log('✅ Estado "revision_enmienda" agregado con éxito.');
    } catch (err: any) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('ℹ️ El valor "revision_enmienda" ya existe en el enum.');
      } else {
        console.warn('⚠️ No se pudo alterar el enum automáticamente:', err.message);
      }
    }

    // 4. Crear tabla 'evaluaciones_checklist'
    console.log('Creating table evaluaciones_checklist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.evaluaciones_checklist (
          id SERIAL PRIMARY KEY,
          dictamen_id INTEGER NOT NULL REFERENCES public.dictamenes(id) ON DELETE CASCADE,
          tipo_anexo VARCHAR(10) NOT NULL, -- 'G' o 'H'
          aspecto_metodologico_calif VARCHAR(20) DEFAULT 'No aplica',
          aspecto_metodologico_just TEXT,
          aspecto_etico_calif VARCHAR(20) DEFAULT 'No aplica',
          aspecto_etico_just TEXT,
          aspecto_legal_calif VARCHAR(20) DEFAULT 'No aplica',
          aspecto_legal_just TEXT,
          aspecto_presupuestal_calif VARCHAR(20) DEFAULT 'No aplica',
          aspecto_presupuestal_just TEXT,
          hoja_informacion_calif VARCHAR(20) DEFAULT 'No aplica',
          hoja_informacion_just TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Agregar columnas JSONB a evaluaciones_checklist
    console.log('Adding respuestas_json to evaluaciones_checklist...');
    await client.query(`
      ALTER TABLE evaluaciones_checklist 
      ADD COLUMN IF NOT EXISTS respuestas_json JSONB;
    `);

    // 6. Eliminar columnas viejas de evaluaciones_checklist (si existen)
    console.log('Dropping old columns from evaluaciones_checklist...');
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

    // 7. Crear tabla 'declaraciones_coi'
    console.log('Creating table declaraciones_coi...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.declaraciones_coi (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
          anio INTEGER NOT NULL,
          firma_digital TEXT NOT NULL,
          fecha_firma TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Crear tabla 'seguimiento_post_aprobacion'
    console.log('Creating table seguimiento_post_aprobacion...');
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

    // 9. Asignaciones de revisión (Fase 7)
    console.log('Altering table asignaciones_revision (Fase 7)...');
    await client.query(`
      ALTER TABLE asignaciones_revision 
      ADD COLUMN IF NOT EXISTS rol_asignacion VARCHAR(20) DEFAULT 'secundario';
    `);

    // 10. Usuarios - Firma Imagen (Fase 7)
    console.log('Altering table usuarios for signature path (Fase 7)...');
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS firma_imagen_ruta VARCHAR(255);
    `);

    // 11. Dictamenes - Checklist PDF (Fase 7)
    console.log('Altering table dictamenes (Fase 7)...');
    await client.query(`
      ALTER TABLE dictamenes 
      ADD COLUMN IF NOT EXISTS pdf_checklist_ruta VARCHAR(255);
    `);

    // 12. Solicitudes - Carta de Revisión (Fase 7)
    console.log('Altering table solicitudes for review letter path (Fase 7)...');
    await client.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS ruta_carta_revision VARCHAR(255);
    `);

    // 13. Asignaciones de revisión - SLA / Control de Tiempos
    console.log('Altering table asignaciones_revision for SLA (SLA)...');
    await client.query(`
      ALTER TABLE asignaciones_revision 
      ADD COLUMN IF NOT EXISTS fecha_limite TIMESTAMP;
    `);

    // 14. Solicitudes - Cumplimiento del Manual de Procedimientos (Vulnerabilidad y Riesgos)
    console.log('Altering table solicitudes for manual compliance...');
    await client.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS involucra_grupos_vulnerables BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS descripcion_vulnerabilidad TEXT,
      ADD COLUMN IF NOT EXISTS es_invasivo BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS categoria_riesgo VARCHAR(20) DEFAULT 'bajo';
    `);

    console.log('🎉 ¡Todas las migraciones se ejecutaron con éxito!');
  } catch (error) {
    console.error('❌ Error ejecutando las migraciones agrupadas:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runAllMigrations().then(() => process.exit(0));
}

export { runAllMigrations };
