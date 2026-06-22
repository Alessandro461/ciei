const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sqlFilePath = path.join(__dirname, '../basededatos/aea.sql');
const connectionString = process.argv[2];

if (!connectionString) {
  console.error('❌ Error: Debes proporcionar la URL de conexión de la base de datos.');
  console.error('Ejemplo: node scratch_deploy_seed.js "postgresql://user:password@host:port/database"');
  process.exit(1);
}

async function run() {
  console.log('🔄 Conectando a la base de datos remota...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('🔗 ¡Conectado exitosamente!');

  console.log('📄 Leyendo archivo aea.sql...');
  const content = fs.readFileSync(sqlFilePath, 'utf8');
  const lines = content.split(/\r?\n/);

  console.log('🏁 Iniciando procesamiento del script SQL...');
  let currentStatement = '';
  let inCopyBlock = false;
  let copyTableName = '';
  let copyColumns = [];
  let copyRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar inicio de bloque COPY
    if (!inCopyBlock && line.trim().toUpperCase().startsWith('COPY ')) {
      const match = line.match(/^COPY\s+([\w\.]+)\s*\((.*?)\)\s*FROM\s+stdin;/i);
      if (match) {
        inCopyBlock = true;
        copyTableName = match[1];
        copyColumns = match[2].split(',').map(c => c.trim());
        copyRows = [];
        console.log(`📦 Encontrado bloque COPY para la tabla: ${copyTableName}`);
        continue;
      }
    }

    if (inCopyBlock) {
      if (line.trim() === '\\.') {
        // Fin del bloque COPY. Ejecutar las inserciones en lote o una a una
        inCopyBlock = false;
        if (copyRows.length > 0) {
          console.log(`📥 Insertando ${copyRows.length} filas en la tabla ${copyTableName}...`);
          const placeholders = copyColumns.map((_, idx) => `$${idx + 1}`).join(', ');
          const query = `INSERT INTO ${copyTableName} (${copyColumns.join(', ')}) VALUES (${placeholders})`;
          
          for (const row of copyRows) {
            try {
              await client.query(query, row);
            } catch (err) {
              console.error(`⚠️ Error al insertar fila en ${copyTableName}:`, err.message);
            }
          }
        }
      } else {
        // Fila de datos tabulada
        const values = line.split('\t').map(val => {
          if (val === '\\N') return null; // Convertir \N de Postgres a null
          return val;
        });
        copyRows.push(values);
      }
      continue;
    }

    // Ignorar líneas de comentarios de psql o comandos \
    if (line.trim().startsWith('\\') || line.trim().startsWith('--')) {
      continue;
    }

    currentStatement += line + '\n';

    // Si termina en punto y coma, ejecutar el comando
    if (line.trim().endsWith(';')) {
      if (currentStatement.trim() !== '') {
        try {
          await client.query(currentStatement);
        } catch (err) {
          // Ignorar ciertos errores comunes no críticos como propietarios de tipos o tablas
          if (!err.message.includes('owner of') && !err.message.includes('already exists')) {
            console.warn(`⚠️ Advertencia en sentencia SQL:`, err.message);
          }
        }
      }
      currentStatement = '';
    }
  }

  // Ejecutar migraciones incrementales del backend después de importar el esquema
  console.log('🔄 Ejecutando migraciones incrementales del backend...');
  try {
    // 1. Solicitudes - Columnas adicionales de Fase 6
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
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS es_invitado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS acepto_confidencialidad_anexol BOOLEAN DEFAULT false;
    `);

    // 3. Alterar enum 'estado_solicitud_enum'
    try {
      await client.query("ALTER TYPE public.estado_solicitud_enum ADD VALUE 'revision_enmienda'");
    } catch (err) {}

    // 4. Crear tabla 'evaluaciones_checklist'
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.evaluaciones_checklist (
          id SERIAL PRIMARY KEY,
          dictamen_id INTEGER NOT NULL REFERENCES public.dictamenes(id) ON DELETE CASCADE,
          tipo_anexo VARCHAR(10) NOT NULL,
          respuestas_json JSONB,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Crear tabla 'declaraciones_coi'
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.seguimiento_post_aprobacion (
          id SERIAL PRIMARY KEY,
          solicitud_id INTEGER NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
          tipo_reporte VARCHAR(30) NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          descripcion TEXT,
          ruta_archivo VARCHAR(255),
          estado_seguimiento VARCHAR(20) DEFAULT 'pendiente',
          fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Asignaciones de revisión
    await client.query(`
      ALTER TABLE asignaciones_revision 
      ADD COLUMN IF NOT EXISTS rol_asignacion VARCHAR(20) DEFAULT 'secundario',
      ADD COLUMN IF NOT EXISTS fecha_limite TIMESTAMP;
    `);

    // 8. Usuarios - Firma Imagen
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS firma_imagen_ruta VARCHAR(255);
    `);

    // 9. Dictamenes - Checklist PDF
    await client.query(`
      ALTER TABLE dictamenes 
      ADD COLUMN IF NOT EXISTS pdf_checklist_ruta VARCHAR(255);
    `);

    // 10. Solicitudes - Carta de Revisión
    await client.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS ruta_carta_revision VARCHAR(255);
    `);

    // 11. Solicitudes - Cumplimiento del Manual de Procedimientos
    await client.query(`
      ALTER TABLE solicitudes 
      ADD COLUMN IF NOT EXISTS involucra_grupos_vulnerables BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS descripcion_vulnerabilidad TEXT,
      ADD COLUMN IF NOT EXISTS es_invasivo BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS categoria_riesgo VARCHAR(20) DEFAULT 'bajo';
    `);

    console.log('🎉 ¡Todas las tablas e inserciones se completaron con éxito!');
  } catch (error) {
    console.error('❌ Error ejecutando las migraciones incrementales:', error.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
