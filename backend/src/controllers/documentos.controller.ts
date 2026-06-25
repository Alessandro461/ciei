import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';
import path from 'path';
import fs from 'fs';
import { enviarCorreo } from '../utils/mailer';

export const subirDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { solicitudId, tipo_documento } = req.body;
        const archivo = (req as any).file;

        if (!archivo || !solicitudId) {
            res.status(400).json({ error: 'Faltan datos para subir el documento.' });
            return;
        }

        // Validar firma del archivo (Magic Numbers) para evitar extensiones falsas
        const buffer = fs.readFileSync(archivo.path);
        const header = buffer.toString('hex', 0, 4); // Leer primeros 4 bytes
        
        let validFirma = false;
        const ext = path.extname(archivo.originalname).toLowerCase();
        
        if (ext === '.pdf') {
            // Un PDF debe empezar con 25504446 (%PDF)
            validFirma = header === '25504446';
        } else if (ext === '.doc' || ext === '.docx') {
            // DOC/DOCX suelen empezar con 504b0304 (ZIP) o d0cf11e0 (OLE)
            validFirma = header === '504b0304' || header === 'd0cf11e0';
        }

        if (!validFirma) {
            fs.unlinkSync(archivo.path);
            res.status(400).json({ error: 'Firma de archivo inválida. El contenido del archivo no coincide con su extensión permitida.' });
            return;
        }

        // Interceptar si es un documento especial de Seguimiento Post-Aprobación
        if (tipo_documento && ['enmienda', 'reporte_avance', 'evento_adverso'].includes(tipo_documento)) {
            const titulo = tipo_documento === 'enmienda' ? 'Solicitud de Enmienda' :
                           tipo_documento === 'reporte_avance' ? 'Reporte de Avance o Cierre' : 'Reporte de Evento Adverso';
            
            const insertSeg = await pool.query(
                `INSERT INTO seguimiento_post_aprobacion (solicitud_id, tipo_reporte, titulo, descripcion, ruta_archivo, estado_seguimiento, fecha_creacion)
                 VALUES ($1, $2, $3, $4, $5, 'pendiente', NOW()) RETURNING *`,
                [solicitudId, tipo_documento, titulo, req.body.descripcion || '', archivo.path]
            );

            // Si es Enmienda, cambiar el estado del proyecto a 'revision_enmienda'
            if (tipo_documento === 'enmienda') {
                await pool.query(
                    `UPDATE solicitudes SET estado_actual = 'revision_enmienda', updated_at = NOW() WHERE id = $1`,
                    [solicitudId]
                );
            }

            // Si es Evento Adverso, disparar alerta de correo urgente al Secretario
            if (tipo_documento === 'evento_adverso') {
                try {
                    const secRes = await pool.query(`SELECT correo_institucional, nombres FROM usuarios WHERE rol = 'secretario'`);
                    if (secRes.rowCount !== null && secRes.rowCount > 0) {
                        for (let secRow of secRes.rows) {
                            const asunto = `🚨 ALERTA URGENTE: Reporte de Evento Adverso - Expediente #${solicitudId}`;
                            const mensajeHtml = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #ef4444; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(239,68,68,0.1);">
                                    <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                                        <h2 style="margin: 0; text-transform: uppercase; tracking-wider: 1px;">🚨 Alerta de Seguridad Médica/Ética 🚨</h2>
                                    </div>
                                    <div style="padding: 25px; line-height: 1.6;">
                                        <p>Estimado/a Secretario/a Técnico/a <b>${secRow.nombres}</b>,</p>
                                        <p>Se ha reportado un <b>EVENTO ADVERSO URGENTE</b> en el sistema para el expediente con ID <b>#${solicitudId}</b>.</p>
                                        <p>Por favor, ingrese de inmediato al Panel de Administración del Comité para evaluar el informe adjunto y tomar las acciones pertinentes para salvaguardar el bienestar de los sujetos de estudio.</p>
                                        <hr style="border: 0; border-top: 1px solid #fee2e2; margin: 20px 0;">
                                        <p style="color: #6b7280; font-size: 11px;">Este es un correo automático urgente de alta prioridad generado por el Sistema CIEI UNA Puno.</p>
                                    </div>
                                </div>
                            `;
                            enviarCorreo(secRow.correo_institucional, asunto, mensajeHtml);
                        }
                    }
                } catch (emailError) {
                    console.error('Error enviando correos de alerta de evento adverso:', emailError);
                }
            }

            // También lo agregamos a la tabla general de documentos para la trazabilidad histórica de anexos
            await pool.query(
                `INSERT INTO documentos (solicitud_id, nombre_archivo_original, ruta_archivo, tipo_anexo, version, anexo_clave, subido_por, fecha_subida)
                 VALUES ($1, $2, $3, 'subsanacion', 1, $4, $5, NOW())`,
                [solicitudId, archivo.originalname, archivo.path, tipo_documento, req.usuario.id]
            );

            res.status(201).json({
                mensaje: `${titulo} subido y registrado exitosamente.`,
                documento: insertSeg.rows[0]
            });
            return;
        }

        // 1. Obtener anexo_clave y mapear tipo_anexo para la base de datos
        const anexoClave = req.body.anexo_clave || 'proyecto';
        let tipoAnexo = req.body.tipo_anexo || 'proyecto';
        const enumPermitidos = ['proyecto', 'consentimiento', 'instrumento', 'voucher', 'subsanacion'];
        if (!enumPermitidos.includes(tipoAnexo)) {
            const lowerAnexo = tipoAnexo.toLowerCase();
            if (lowerAnexo.includes('voucher') || lowerAnexo.includes('pago')) {
                tipoAnexo = 'voucher';
            } else if (lowerAnexo.includes('consentimiento') || lowerAnexo.includes('anexo_c') || lowerAnexo.includes('anexo_4')) {
                tipoAnexo = 'consentimiento';
            } else if (lowerAnexo.includes('instrumento') || lowerAnexo.includes('ficha') || lowerAnexo.includes('anexo_d') || lowerAnexo.includes('anexo_e') || lowerAnexo.includes('anexo_5') || lowerAnexo.includes('anexo_6')) {
                tipoAnexo = 'instrumento';
            } else if (lowerAnexo.includes('compromiso') || lowerAnexo.includes('anexo_f') || lowerAnexo.includes('anexo_3') || lowerAnexo.includes('subsanacion') || lowerAnexo.includes('biologica')) {
                tipoAnexo = 'subsanacion';
            } else {
                tipoAnexo = 'proyecto'; 
            }
        }

        // 2. Control de versiones preciso por ranura (anexo_clave)
        const versionRes = await pool.query(
            'SELECT MAX(version) as max_ver FROM documentos WHERE solicitud_id = $1 AND anexo_clave = $2',
            [solicitudId, anexoClave]
        );
        
        const maxVer = versionRes.rows[0].max_ver || 0;
        const nuevaVersion = maxVer + 1;

        // 3. Insertar el documento con la versión y clave de ranura
        const query = `
            INSERT INTO documentos (
                solicitud_id, 
                nombre_archivo_original, 
                ruta_archivo, 
                tipo_anexo, 
                version,
                anexo_clave,
                subido_por, 
                fecha_subida
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
            RETURNING *
        `;

        const values = [
            solicitudId,
            archivo.originalname,
            archivo.path,
            tipoAnexo,
            nuevaVersion,
            anexoClave,
            req.usuario.id
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            mensaje: 'Documento subido correctamente',
            documento: result.rows[0]
        });

    } catch (error) {
        console.error('Error al subir documento:', error);
        // Si falló la inserción en base de datos, eliminamos el archivo físico para que no sea huérfano
        const archivo = (req as any).file;
        if (archivo && fs.existsSync(archivo.path)) {
            try {
                fs.unlinkSync(archivo.path);
            } catch (err) {
                console.error('Error al eliminar archivo huérfano:', err);
            }
        }
        res.status(500).json({ error: 'Falla interna al registrar el documento en la base de datos.' });
    }
};

// Obtener todos los documentos de una solicitud específica (Mantenemos tu código intacto)
export const obtenerDocumentosPorSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userRole = req.usuario?.rol;

        // Consultar el estado de la identidad del expediente
        const solRes = await pool.query('SELECT identidad_revelada FROM solicitudes WHERE id = $1', [id]);
        const identidadRevelada = solRes.rowCount !== null && solRes.rowCount > 0 ? solRes.rows[0].identidad_revelada : false;

        const result = await pool.query(
            `SELECT id, tipo_anexo, nombre_archivo_original, fecha_subida, version, anexo_clave 
             FROM documentos 
             WHERE solicitud_id = $1 
             ORDER BY fecha_subida DESC`,
            [id]
        );

        let docs = result.rows;

        // Si es Revisor y la identidad es ciega, filtrar CVs y hojas de vida
        if (userRole === 'revisor' && !identidadRevelada) {
            docs = docs.filter((doc: any) => {
                const nameLower = (doc.nombre_archivo_original || '').toLowerCase();
                const keyLower = (doc.anexo_clave || '').toLowerCase();
                const esCV = nameLower.includes('cv') || 
                             nameLower.includes('curriculum') || 
                             nameLower.includes('hoja_de_vida') || 
                             nameLower.includes('resume') || 
                             keyLower.includes('cv');
                return !esCV;
            });
        }

        res.json({
            mensaje: 'Documentos recuperados',
            documentos: docs
        });

    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({ error: 'Falla interna al buscar los anexos.' });
    }
};

// CU-09: Descargar el archivo físico de un documento (Mantenemos tu código intacto)
export const descargarDocumento = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userRole = req.usuario?.rol;

        const result = await pool.query(
            'SELECT solicitud_id, ruta_archivo, nombre_archivo_original, anexo_clave FROM documentos WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Documento no encontrado en la base de datos.' });
            return;
        }

        const documento = result.rows[0];

        // Bloqueo de seguridad: Evitar que revisores descarguen CVs si la revisión es ciega
        if (userRole === 'revisor') {
            const solRes = await pool.query('SELECT identidad_revelada FROM solicitudes WHERE id = $1', [documento.solicitud_id]);
            const identidadRevelada = solRes.rowCount !== null && solRes.rowCount > 0 ? solRes.rows[0].identidad_revelada : false;

            if (!identidadRevelada) {
                const nameLower = (documento.nombre_archivo_original || '').toLowerCase();
                const keyLower = (documento.anexo_clave || '').toLowerCase();
                const esCV = nameLower.includes('cv') || 
                             nameLower.includes('curriculum') || 
                             nameLower.includes('hoja_de_vida') || 
                             nameLower.includes('resume') || 
                             keyLower.includes('cv');
                if (esCV) {
                    res.status(403).json({ error: 'Acceso denegado. No se permite descargar este documento bajo revisión ciega.' });
                    return;
                }
            }
        }
        const rutaAbsoluta = path.resolve(documento.ruta_archivo);

        if (!fs.existsSync(rutaAbsoluta)) {
            res.status(404).json({ error: 'El archivo físico se perdió o fue eliminado del servidor.' });
            return;
        }

        res.download(rutaAbsoluta, documento.nombre_archivo_original);

    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({ error: 'Falla interna al intentar descargar el anexo.' });
    }
};

export const descargarDocumentoSeguimiento = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT ruta_archivo FROM seguimiento_post_aprobacion WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Registro de seguimiento no encontrado.' });
            return;
        }
        const fileRow = result.rows[0];
        const rutaAbsoluta = path.resolve(fileRow.ruta_archivo);
        if (!fs.existsSync(rutaAbsoluta)) {
            res.status(404).json({ error: 'El archivo físico no se encuentra en el servidor.' });
            return;
        }
        const filename = path.basename(fileRow.ruta_archivo);
        res.download(rutaAbsoluta, filename);
    } catch (error) {
        console.error('Error al descargar archivo de seguimiento:', error);
        res.status(500).json({ error: 'Error interno al descargar el archivo de seguimiento.' });
    }
};