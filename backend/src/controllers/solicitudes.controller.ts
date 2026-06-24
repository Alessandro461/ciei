import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { pool } from '../db';
import PDFDocument from 'pdfkit';
import { enviarCorreo } from '../utils/mailer';
import fs from 'fs';
import path from 'path';
import { sellarDocumentosAprobados } from '../utils/pdfStamper';
import { getAnexoByTipo } from '../constants/anexosChecklist';
import { PdfTemplateService } from '../services/PdfTemplateService';

// Helper: Formatea fecha en español con formato dd de mm del yyyy (con opción de rellenar día con ceros)
const formatSpanishDate = (date: Date, padDay: boolean = true): string => {
    const dayVal = date.getDate();
    const day = padDay ? String(dayVal).padStart(2, '0') : String(dayVal);
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} del ${year}`;
};

// Helper: Formatea fecha en español con formato dd de mm yyyy (sin "del" antes del año, para listas de documentos)
const formatSpanishDateNoDel = (date: Date, padDay: boolean = true): string => {
    const dayVal = date.getDate();
    const day = padDay ? String(dayVal).padStart(2, '0') : String(dayVal);
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} ${year}`;
};

// Helper: Dibuja el encabezado institucional formal (logos y texto centralizado)
const drawHeader = (doc: PDFKit.PDFDocument, tipo: 'carta' | 'constancia' = 'carta') => {
    const logoCieiPath = path.join(__dirname, '../assets/logos/logo_ciei.png');
    const logoUnapPath = path.join(__dirname, '../assets/logos/logo_unap.png');
    
    doc.save();

    // Temporarily set margins to 0 to prevent automatic page breaks when drawing header
    const oldMargins = { ...doc.page.margins };
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

    if (fs.existsSync(logoUnapPath)) {
        try {
            // UNAP Shield on the left, height=55
            doc.image(logoUnapPath, 50, 30, { height: 55 });
        } catch (e) {
            console.error("Error al incrustar logo UNAP:", e);
        }
    }
    
    if (fs.existsSync(logoCieiPath)) {
        try {
            // CIEI banner on the right, width=75
            doc.image(logoCieiPath, 480, 38, { width: 75 });
        } catch (e) {
            console.error("Error al incrustar logo CIEI:", e);
        }
    }

    doc.fillColor('#1C325A');
    
    // Primera línea: Universidad Nacional del Altiplano – Puno
    doc.fontSize(12).font('Times-Bold').text('Universidad Nacional del Altiplano – Puno', 110, 42, { align: 'center', width: 360 });
    
    // Segunda línea: VICERRECTORADO DE INVESTIGACIÓN
    doc.fontSize(10).font('Times-Bold').text('VICERRECTORADO DE INVESTIGACIÓN', 110, 58, { align: 'center', width: 360 });
    
    // Tercera línea:
    const linea3 = tipo === 'carta' 
        ? 'COMITÉ INSTITUCIONAL DE ÉTICA EN INVESTIGACIÓN'
        : 'COMITÉ INSTITUCIONAL DE ETICA EN INVESTIGACION';
    doc.fontSize(10).font('Times-Bold').text(linea3, 110, 72, { align: 'center', width: 360 });

    doc.moveTo(50, 92).lineTo(560, 92).lineWidth(1.5).strokeColor('#1C325A').stroke();
    
    // Restore margins
    doc.page.margins = oldMargins;
    doc.restore();
};

// Helper: Dibuja el pie de página
const drawFooter = (doc: PDFKit.PDFDocument, tipo: 'carta' | 'constancia', anio: number) => {
    doc.save();
    
    // Temporarily set margins to 0 to prevent automatic page breaks when drawing footer
    const oldMargins = { ...doc.page.margins };
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

    doc.fontSize(10).font('Times-Roman').fillColor('#000000');
    
    if (tipo === 'carta') {
        doc.text('C.c. Archivo', 50, 765, { align: 'left' });
        doc.text(String(anio), 50, 777, { align: 'left' });
        doc.text('ETP/demp', 50, 789, { align: 'left' });
    } else {
        doc.text('C.c. Archivo', 50, 770, { align: 'left' });
        doc.text(String(anio), 50, 782, { align: 'left' });
    }
    
    // Restore margins
    doc.page.margins = oldMargins;
    doc.restore();
};

// Helper: Analizador de observaciones para dividirlas en aspectos específicos
const parseComentarios = (comentarios: string) => {
    const sections = {
        metodologicos: [] as string[],
        legales: [] as string[],
        hojaInformacion: [] as string[],
        otros: [] as string[]
    };

    if (!comentarios) return sections;

    const lines = comentarios.split('\n');
    let currentSection: 'metodologicos' | 'legales' | 'hojaInformacion' | 'otros' = 'otros';

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Limpiar marcadores de lista comunes (*, -, viñetas) al inicio
        const cleanedLine = trimmed.replace(/^[-*•\s\d\.)]+/, '').trim();
        if (!cleanedLine) continue;

        const lower = trimmed.toLowerCase();
        if (lower.includes('aspectos metodológicos') || lower.includes('aspectos metodologicos') || lower.includes('metodología') || lower.includes('metodologia')) {
            currentSection = 'metodologicos';
        } else if (lower.includes('aspectos legales') || lower.includes('legal')) {
            currentSection = 'legales';
        } else if (lower.includes('hoja de información') || lower.includes('hoja de informacion') || lower.includes('consentimiento') || lower.includes('participantes')) {
            currentSection = 'hojaInformacion';
        } else {
            // Evitar agregar encabezados vacíos como parte del texto de observaciones
            const isHeaderOnly = (
                lower === 'aspectos metodológicos' || 
                lower === 'aspectos metodologicos' || 
                lower === 'metodologia' || 
                lower === 'metodología' ||
                lower === 'aspectos legales' || 
                lower === 'legal' ||
                lower === 'hoja de información para participantes:' || 
                lower === 'hoja de información para participantes' || 
                lower === 'hoja de informacion' || 
                lower === 'consentimiento'
            );
            if (isHeaderOnly) continue;
            
            sections[currentSection].push(cleanedLine);
        }
    }
    return sections;
};

// CU-05: Crear solicitud (borrador)
export const crearSolicitudBorrador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const investigador_id = req.usuario.id; 
        // Atrapamos los nuevos campos del frontend para muestras y pagos
        const { 
            tipo_investigacion, titulo_proyecto, facultad, escuela_profesional,
            resumen, objetivos, metodologia, investigadores_asociados, duracion,
            usa_muestras_biologicas, tipo_muestras_biologicas, origen_fondos,
            involucra_grupos_vulnerables, descripcion_vulnerabilidad, es_invasivo
        } = req.body; 

        const anio = new Date().getFullYear();
        const numero_aleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const numero_expediente = `CIEI-${anio}-${numero_aleatorio}`;

        // Cálculo automático de la exoneración de pago según origen de fondos
        const esExonerado = (origen_fondos === 'autofinanciado' || origen_fondos === 'fedu');

        // Insertamos absolutamente todo en la base de datos
        const result = await pool.query(
            `INSERT INTO solicitudes (
                numero_expediente, investigador_id, tipo_investigacion, titulo_proyecto, 
                facultad, escuela_profesional, resumen, objetivos, metodologia, 
                investigadores_asociados, duracion, estado_actual,
                usa_muestras_biologicas, tipo_muestras_biologicas, origen_fondos, exonerado_pago,
                involucra_grupos_vulnerables, descripcion_vulnerabilidad, es_invasivo
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'borrador', $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
            [
                numero_expediente, 
                investigador_id, 
                tipo_investigacion, 
                titulo_proyecto, 
                facultad || 'No especificada', 
                escuela_profesional || 'No especificada',
                resumen || '', 
                objetivos || '', 
                metodologia || '', 
                investigadores_asociados || '', 
                duracion || '',
                usa_muestras_biologicas || false,
                tipo_muestras_biologicas || '',
                origen_fondos || 'autofinanciado',
                esExonerado,
                involucra_grupos_vulnerables || false,
                descripcion_vulnerabilidad || '',
                es_invasivo || false
            ]
        );

        res.status(201).json({
            mensaje: 'Borrador de solicitud creado exitosamente',
            solicitudId: result.rows[0].id, 
            solicitud: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear solicitud:', error);
        res.status(500).json({ error: 'Error interno al guardar la solicitud.' });
    }
};

// CU-02: Obtener mis solicitudes (Investigador)
export const obtenerMisSolicitudes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const investigador_id = req.usuario.id;
        const result = await pool.query(
            `SELECT id, numero_expediente, tipo_investigacion, titulo_proyecto, estado_actual, comentarios_comite, created_at 
             FROM solicitudes 
             WHERE investigador_id = $1 
             ORDER BY created_at DESC`,
            [investigador_id]
        );
        res.json({ mensaje: 'Solicitudes recuperadas', solicitudes: result.rows });
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ error: 'Falla interna al cargar los expedientes del investigador.' });
    }
};

// CU-07: Obtener todas las solicitudes para el panel del Comité (Admin/Presidente/Revisor)
export const obtenerSolicitudesComite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let query = '';
        let params: any[] = [];

        if (req.usuario.rol === 'revisor') {
            query = `
                SELECT DISTINCT s.id, s.numero_expediente, s.tipo_investigacion, s.titulo_proyecto, s.estado_actual, s.created_at,
                       CASE WHEN s.identidad_revelada = true THEN u.nombres ELSE '[OCULTO]' END AS nombres,
                       CASE WHEN s.identidad_revelada = true THEN u.apellidos ELSE 'REVISIÓN CIEGA' END AS apellidos,
                       ar.rol_asignacion, ar.estado_revision, ar.fecha_limite,
                       (SELECT COUNT(*)::int FROM dictamenes d 
                        JOIN asignaciones_revision ar2 ON d.asignacion_id = ar2.id 
                        WHERE ar2.solicitud_id = s.id) AS total_recomendaciones,
                       s.usa_muestras_biologicas, s.involucra_grupos_vulnerables, s.es_invasivo
                FROM solicitudes s
                JOIN usuarios u ON s.investigador_id = u.id
                JOIN asignaciones_revision ar ON ar.solicitud_id = s.id
                WHERE s.estado_actual != 'borrador' AND ar.revisor_id = $1
                ORDER BY s.created_at ASC
            `;
            params = [req.usuario.id];
        } else {
            query = `
                SELECT s.id, s.numero_expediente, s.tipo_investigacion, s.titulo_proyecto, s.estado_actual, s.created_at, 
                        u.nombres, u.apellidos, s.identidad_revelada, s.tipo_revision,
                        (SELECT MIN(fecha_limite) FROM asignaciones_revision WHERE solicitud_id = s.id AND estado_revision = 'pendiente') AS fecha_limite,
                        (SELECT COUNT(*)::int FROM dictamenes d 
                         JOIN asignaciones_revision ar ON d.asignacion_id = ar.id 
                         WHERE ar.solicitud_id = s.id) AS total_recomendaciones,
                        s.usa_muestras_biologicas, s.involucra_grupos_vulnerables, s.es_invasivo
                FROM solicitudes s
                JOIN usuarios u ON s.investigador_id = u.id
                WHERE s.estado_actual != 'borrador'
                ORDER BY s.created_at ASC
            `;
        }

        const result = await pool.query(query, params);
        res.json({ mensaje: 'Solicitudes para revisión recuperadas', solicitudes: result.rows });
    } catch (error) {
        console.error('Error al obtener solicitudes para el comité:', error);
        res.status(500).json({ error: 'Falla interna al cargar la bandeja del comité.' });
    }
};

// CU-08: Dictaminar expediente (Aprobar, Observar, Rechazar) + ENVÍO DE CORREO
export const dictaminarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nuevo_estado, comentarios, categoria_riesgo } = req.body; 
        const solicitudId = parseInt(id as string, 10);

        // Validar restricción de riesgo alto según el Manual
        if (nuevo_estado === 'aprobado' && categoria_riesgo === 'alto') {
            res.status(400).json({ error: 'No se puede aprobar un proyecto de Riesgo Alto. Según el Art. 6.2.c del Manual de Procedimientos de Investigación en Humanos de la UNA-Puno, las investigaciones de riesgo alto no pueden ser aprobadas por el CIEI UNA-Puno y deben ser derivadas al Instituto Nacional de Salud (INS).' });
            return;
        }

        // 1. Actualizamos el estado y riesgo en la base de datos
        const result = await pool.query(
            `UPDATE solicitudes 
             SET estado_actual = $1, comentarios_comite = $2, categoria_riesgo = COALESCE($3, categoria_riesgo), updated_at = NOW()
             WHERE id = $4 
             RETURNING *`,
            [nuevo_estado, comentarios || null, categoria_riesgo || null, solicitudId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        const solicitud = result.rows[0];

        // Sellar documentos si el nuevo estado es "aprobado"
        if (nuevo_estado === 'aprobado') {
            await sellarDocumentosAprobados(solicitudId);
        }

        // 2. MAGIA KODIAK: Buscar el correo del investigador y enviar alerta
        try {
            const userRes = await pool.query('SELECT nombres, correo_institucional FROM usuarios WHERE id = $1', [solicitud.investigador_id]);
            
            if (userRes.rowCount !== null && userRes.rowCount > 0) {
                const investigador = userRes.rows[0];
                let asunto = '';
                let mensajeHtml = '';

                // Plantillas de correo según la decisión del comité
                if (nuevo_estado === 'aprobado') {
                    asunto = `✅ ¡Proyecto Aprobado! - Expediente ${solicitud.numero_expediente}`;
                    mensajeHtml = `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                            <div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
                                <h2 style="margin: 0;">¡Dictamen Favorable!</h2>
                            </div>
                            <div style="padding: 30px;">
                                <p>Estimado/a <b>${investigador.nombres}</b>,</p>
                                <p>Le informamos que su proyecto titulado <b>"${solicitud.titulo_proyecto}"</b> ha sido revisado y <b>APROBADO</b> satisfactoriamente.</p>
                                <p>Ya puede ingresar al sistema del CIEI para descargar su Constancia de Aprobación oficial en formato PDF.</p>
                                <br>
                                <p>Atentamente,<br><b>El Comité de Ética (CIEI) - UNA Puno</b></p>
                            </div>
                        </div>
                    `;
                } else if (nuevo_estado === 'observado') {
                    asunto = `⚠️ Observaciones en su Proyecto - Expediente ${solicitud.numero_expediente}`;
                    mensajeHtml = `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                            <div style="background-color: #f59e0b; padding: 20px; text-align: center; color: white;">
                                <h2 style="margin: 0;">Atención Requerida</h2>
                            </div>
                            <div style="padding: 30px;">
                                <p>Estimado/a <b>${investigador.nombres}</b>,</p>
                                <p>El comité ha revisado su proyecto <b>"${solicitud.titulo_proyecto}"</b> y ha emitido el siguiente dictamen con observaciones:</p>
                                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-style: italic;">
                                    ${comentarios}
                                </div>
                                <p>Por favor, ingrese al sistema para subsanar estas observaciones y subir la nueva versión corregida de sus documentos.</p>
                                <br>
                                <p>Atentamente,<br><b>El Comité de Ética (CIEI) - UNA Puno</b></p>
                            </div>
                        </div>
                    `;
                }

                // Disparamos el correo (No bloquea el código si el internet falla)
                if (asunto !== '') {
                    enviarCorreo(investigador.correo_institucional, asunto, mensajeHtml);
                }
            }
        } catch (mailError) {
            console.error('Error al intentar enviar el correo automático:', mailError);
        }

        // 3. Respondemos al frontend que todo fue un éxito
        res.json({ mensaje: `El expediente ha sido cambiado a: ${nuevo_estado}`, solicitud: result.rows[0] });

    } catch (error) {
        console.error('Error al dictaminar:', error);
        res.status(500).json({ error: 'Falla interna al procesar el dictamen.' });
    }
};

// CU-10: Asignar revisores a un expediente (Exclusivo del Presidente)
export const asignarRevisor = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const solicitudId = parseInt(id as string, 10);
        
        let { revisor_id, principal_id, secundarios_ids } = req.body;

        // Soporte de compatibilidad hacia atrás
        if (revisor_id && !principal_id) {
            principal_id = parseInt(revisor_id, 10);
        }
        if (!secundarios_ids) {
            secundarios_ids = [];
        }

        if (!principal_id) {
            res.status(400).json({ error: 'Debe especificar el Revisor Principal.' });
            return;
        }

        // 1. Obtener la solicitud para validar conflicto de interés
        const solRes = await pool.query(
            'SELECT investigador_id, investigadores_asociados FROM solicitudes WHERE id = $1',
            [solicitudId]
        );
        if (solRes.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }
        const solicitud = solRes.rows[0];

        // Todos los revisores a validar: principal + secundarios
        const todosLosRevisores = [
            { id: principal_id, rol: 'principal' },
            ...secundarios_ids.map((sId: number) => ({ id: sId, rol: 'secundario' }))
        ];

        // Bucle de validación de conflictos e inhabilitaciones
        for (const revConfig of todosLosRevisores) {
            const revRes = await pool.query(
                "SELECT id, nombres, apellidos, es_invitado, acepto_confidencialidad_anexol FROM usuarios WHERE id = $1 AND rol = 'revisor'",
                [revConfig.id]
            );
            if (revRes.rowCount === 0) {
                res.status(404).json({ error: `El revisor con ID ${revConfig.id} no existe o no tiene el rol de revisor.` });
                return;
            }
            const revisor = revRes.rows[0];

            // 1. Autoevaluación
            if (revisor.id === solicitud.investigador_id) {
                res.status(400).json({ error: `Conflicto de Interés: El revisor ${revisor.nombres} ${revisor.apellidos} es el Investigador Principal de este proyecto.` });
                return;
            }

            // 2. Investigadores asociados
            const asocTexto = (solicitud.investigadores_asociados || '').toLowerCase();
            const nombresRev = revisor.nombres.toLowerCase();
            const apellidosRev = revisor.apellidos.toLowerCase();
            if (asocTexto.includes(nombresRev) || asocTexto.includes(apellidosRev)) {
                res.status(400).json({ error: `Conflicto de Interés: El revisor ${revisor.nombres} ${revisor.apellidos} figura como Investigador Asociado en este proyecto.` });
                return;
            }

            // 3. Declaración de CoI (Anexo N) - ELIMINADO POR REQUERIMIENTO (Se firma de forma física/descargable)
            /*
            const anio = new Date().getFullYear();
            const coiRes = await pool.query(
                'SELECT id FROM declaraciones_coi WHERE usuario_id = $1 AND anio = $2',
                [revConfig.id, anio]
            );
            if (coiRes.rowCount === 0) {
                res.status(400).json({ error: `El revisor ${revisor.nombres} ${revisor.apellidos} no ha firmado su Declaración Jurada de Conflicto de Interés (Anexo N) para el año vigente.` });
                return;
            }
            */

            // 4. Confidencialidad (Anexo L) para invitados - ELIMINADO POR REQUERIMIENTO
            /*
            if (revisor.es_invitado && !revisor.acepto_confidencialidad_anexol) {
                res.status(400).json({ error: `El revisor externo/invitado ${revisor.nombres} ${revisor.apellidos} aún no ha firmado el Acuerdo de Confidencialidad obligatorio (Anexo L).` });
                return;
            }
            */
        }

        // Si todas las validaciones pasaron, actualizamos y registramos las asignaciones
        // 1. Guardar el revisor principal en solicitudes.revisor_id para compatibilidad
        await pool.query(
            `UPDATE solicitudes 
             SET revisor_id = $1, estado_actual = 'en_revision', updated_at = NOW()
             WHERE id = $2`,
            [principal_id, solicitudId]
        );

        // 2. Limpiar asignaciones anteriores no dictaminadas
        await pool.query(
            "DELETE FROM asignaciones_revision WHERE solicitud_id = $1 AND estado_revision != 'dictaminado'",
            [solicitudId]
        );

        // 3. Insertar la asignación del principal
        await pool.query(
            `INSERT INTO asignaciones_revision (solicitud_id, revisor_id, rol_asignacion, estado_revision, fecha_asignacion, fecha_limite)
             VALUES ($1, $2, 'principal', 'pendiente', NOW(), NOW() + INTERVAL '30 days')`,
            [solicitudId, principal_id]
        );

        // 4. Insertar asignaciones de los secundarios
        for (const secId of secundarios_ids) {
            await pool.query(
                `INSERT INTO asignaciones_revision (solicitud_id, revisor_id, rol_asignacion, estado_revision, fecha_asignacion, fecha_limite)
                 VALUES ($1, $2, 'secundario', 'pendiente', NOW(), NOW() + INTERVAL '30 days')`,
                [solicitudId, secId]
            );
        }

        res.json({ mensaje: 'Revisores asignados con éxito. El expediente se encuentra en estado de revisión.' });
    } catch (error) {
        console.error('Error al asignar revisores:', error);
        res.status(500).json({ error: 'Falla interna del servidor al asignar los revisores.' });
    }
};

// CU-16: Recomendar Dictamen (Acción del Revisor Técnico)
export const recomendarDictamen = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { resultado, comentarios, checklist } = req.body;
        const solicitudId = parseInt(id as string, 10);
        const revisorId = req.usuario.id;

        if (!resultado) {
            res.status(400).json({ error: 'Debe especificar el resultado de la recomendación.' });
            return;
        }

        // 1. Buscar la asignación de revisión activa
        const asigRes = await pool.query(
            `SELECT id, rol_asignacion FROM asignaciones_revision 
             WHERE solicitud_id = $1 AND revisor_id = $2 AND estado_revision != 'dictaminado'
             ORDER BY fecha_asignacion DESC LIMIT 1`,
            [solicitudId, revisorId]
        );

        if (asigRes.rowCount === 0) {
            res.status(404).json({ error: 'No se encontró una asignación de revisión activa para este revisor en este expediente.' });
            return;
        }

        const asignacionId = asigRes.rows[0].id;
        const rolAsignacion = asigRes.rows[0].rol_asignacion;

        // 2. Insertar en la tabla dictamenes
        const dictamenResult = await pool.query(
            `INSERT INTO dictamenes (asignacion_id, resultado, comentarios_investigador, comentarios_internos, fecha_emision)
             VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
            [asignacionId, resultado, comentarios || '', '']
        );
        const dictamenId = dictamenResult.rows[0].id;

        // 3. Insertar Checklist Estructurado si viene en el cuerpo de la petición
        if (checklist) {
            await pool.query(
                `INSERT INTO evaluaciones_checklist (
                    dictamen_id, tipo_anexo, respuestas_json
                 ) VALUES ($1, $2, $3)`,
                [
                    dictamenId,
                    checklist.tipo_anexo || 'G',
                    JSON.stringify(checklist.respuestas_json || checklist.respuestas || checklist)
                ]
            );
        }

        // 4. Actualizar la tabla asignaciones_revision a dictaminado
        await pool.query(
            `UPDATE asignaciones_revision 
             SET estado_revision = 'dictaminado' 
             WHERE id = $1`,
            [asignacionId]
        );

        // 5. Actualizar fecha de modificación de la solicitud
        await pool.query(
            `UPDATE solicitudes 
             SET updated_at = NOW() 
             WHERE id = $1`,
            [solicitudId]
        );

        // 6. Generar el PDF Individual del Checklist
        try {
            const pdfChecklistRuta = await generarChecklistPDF(solicitudId, dictamenId, revisorId, checklist);
            await pool.query('UPDATE dictamenes SET pdf_checklist_ruta = $1 WHERE id = $2', [pdfChecklistRuta, dictamenId]);
        } catch (pdfErr) {
            console.error('Error al generar PDF del checklist:', pdfErr);
        }

        // 7. Si es el Revisor Principal, generar la Carta de Revisión Consolidada
        if (rolAsignacion === 'principal') {
            try {
                const pdfCartaRuta = await generarCartaRevisionPDF(solicitudId, dictamenId, resultado, comentarios, revisorId);
                await pool.query('UPDATE solicitudes SET ruta_carta_revision = $1 WHERE id = $2', [pdfCartaRuta, solicitudId]);
            } catch (pdfErr) {
                console.error('Error al generar PDF de la carta de revisión:', pdfErr);
            }
        }

        res.json({ mensaje: 'Recomendación registrada exitosamente. Ha sido enviada al Presidente para la decisión final.' });

    } catch (error) {
        console.error('Error al recomendar dictamen:', error);
        res.status(500).json({ error: 'Falla interna al registrar la recomendación del revisor.' });
    }
};

// CU-11: Subsanar un expediente observado (Mantenemos como respaldo por si acaso, aunque enviarSolicitud ya lo hace)
export const subsanarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const investigador_id = req.usuario.id;

        const result = await pool.query(
            `UPDATE solicitudes 
             SET estado_actual = 'subsanado', updated_at = NOW()
             WHERE id = $1 AND investigador_id = $2 AND estado_actual = 'observado'
             RETURNING *`,
            [id, investigador_id]
        );

        if (result.rowCount === 0) {
            res.status(400).json({ error: 'No se puede subsanar. Verifique que el expediente esté en estado "observado".' });
            return;
        }
        res.json({ mensaje: 'Observaciones subsanadas. El expediente ha sido reenviado al comité.', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al subsanar expediente:', error);
        res.status(500).json({ error: 'Falla interna al enviar la subsanación.' });
    }
};

// CU-14: Generar Constancia de Aprobación en PDF
export const descargarResolucion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT s.id, s.numero_expediente, s.titulo_proyecto, s.estado_actual, s.investigadores_asociados, s.created_at, s.updated_at,
                    u.nombres, u.apellidos
             FROM solicitudes s
             JOIN usuarios u ON s.investigador_id = u.id
             WHERE s.id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        const expediente = result.rows[0];

        if (expediente.estado_actual !== 'aprobado') {
            res.status(400).json({ error: 'Solo se pueden emitir resoluciones de proyectos aprobados.' });
            return;
        }

        // Consultar documentos version = 1 para ver las fechas de recepción originales
        const documentosRes = await pool.query(
            `SELECT tipo_anexo, fecha_subida 
             FROM documentos 
             WHERE solicitud_id = $1 AND version = 1`,
            [id]
        );

        let proyectoFechaStr = 'No registrado';
        let consentimientoFechaStr = '';
        
        if (documentosRes && documentosRes.rows) {
            documentosRes.rows.forEach(docRow => {
                const fStr = formatSpanishDateNoDel(new Date(docRow.fecha_subida), true);
                if (docRow.tipo_anexo === 'proyecto') {
                    proyectoFechaStr = fStr;
                } else if (docRow.tipo_anexo === 'consentimiento') {
                    consentimientoFechaStr = fStr;
                }
            });
        }

        // Consultar presidente activo
        const presidenteRes = await pool.query(
            `SELECT nombres, apellidos FROM usuarios WHERE rol = 'presidente' LIMIT 1`
        );
        let presidenteNombre = 'Dra. Edith Tello Palma';
        if (presidenteRes && presidenteRes.rowCount !== null && presidenteRes.rowCount > 0) {
            const rawNom = `${presidenteRes.rows[0].nombres} ${presidenteRes.rows[0].apellidos}`;
            if (!rawNom.startsWith('Dr.') && !rawNom.startsWith('Dra.')) {
                if (rawNom.includes('Edith') || rawNom.includes('Tello')) {
                    presidenteNombre = `Dra. ${rawNom}`;
                } else {
                    presidenteNombre = `Dr. ${rawNom}`;
                }
            } else {
                presidenteNombre = rawNom;
            }
        }

        const doc = new PDFDocument({ 
            size: 'A4', 
            margins: { top: 110, bottom: 80, left: 50, right: 50 },
            bufferPages: true 
        });

        res.setHeader('Content-disposition', `attachment; filename="Resolucion_${expediente.numero_expediente}.pdf"`);
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res); 

        // Título de la Constancia
        const correlativo = String(expediente.id).padStart(3, '0');
        const anioEmision = new Date(expediente.updated_at || expediente.created_at).getFullYear();

        doc.fontSize(12).font('Times-Bold').fillColor('#000000').text(`CONSTANCIA N° ${correlativo}/CIEI UNA-Puno`, { align: 'center' });
        doc.moveDown(1.2);

        // Párrafo introductorio
        const dateReunion = new Date(expediente.updated_at || expediente.created_at).toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'long'
        });
        
        doc.fontSize(12).font('Times-Roman').fillColor('#000000').text(
            `El Presidente del Comité Institucional de Ética en Investigación de la Universidad Nacional del Altiplano de Puno (CIEI UNA-Puno), hace constar que el proyecto de investigación que se señala a continuación fue `,
            { continued: true, align: 'justify', lineGap: 4 }
        );
        doc.font('Times-Bold').text('APROBADO', { continued: true });
        doc.font('Times-Roman').text(' en reunión ordinaria de fecha ', { continued: true });
        doc.font('Times-Bold').text(`${dateReunion}`, { continued: true });
        doc.font('Times-Roman').text(' por el pleno de los miembros de CIEI UNA-Puno.', { continued: false });
        doc.moveDown(1.5);

        // Bloque de detalles alineados
        doc.fontSize(12).font('Times-Bold').text('Título del Proyecto            :', { align: 'justify' });
        doc.font('Times-Roman').text(`“${expediente.titulo_proyecto.toUpperCase()}”`, { align: 'justify', lineGap: 4 });
        doc.moveDown(1);

        doc.font('Times-Bold').text('Código de inscripción       :', { align: 'justify' });
        doc.font('Times-Roman').text(`${expediente.numero_expediente}-CIEI UNA Puno.`, { align: 'justify' });
        doc.moveDown(1);

        doc.font('Times-Bold').text('Investigador Principal 1   :', { align: 'justify' });
        doc.font('Times-Roman').text(`${expediente.nombres} ${expediente.apellidos}`, { align: 'justify' });
        doc.moveDown(1);

        if (expediente.investigadores_asociados) {
            const asociados = expediente.investigadores_asociados.split(/[,\n]/).map((a: string) => a.trim()).filter((a: string) => a.length > 0);
            asociados.forEach((asoc: string, idx: number) => {
                doc.font('Times-Bold').text(`Investigador Principal ${idx + 2}   :`, { align: 'justify' });
                doc.font('Times-Roman').text(`${asoc}`, { align: 'justify' });
                doc.moveDown(1);
            });
        }
        
        doc.moveDown(0.5);

        // Evaluación de documentos
        doc.fontSize(12).font('Times-Roman').text('La aprobación incluyó la evaluación de los ', { continued: true, lineGap: 4 })
           .font('Times-Bold').text('documentos finales', { continued: true })
           .font('Times-Roman').text(' siguientes:', { continued: false });
        doc.moveDown(0.5);
        doc.text(`• Proyecto de Investigación; recibido en fecha: ${proyectoFechaStr}.`, { indent: 15, lineGap: 4 });
        if (consentimientoFechaStr) {
            doc.text(`• Consentimiento Informado; recibido en fecha ${consentimientoFechaStr}.`, { indent: 15, lineGap: 4 });
        }
        doc.moveDown(1.5);

        // Párrafo estándar legal ético
        doc.fontSize(12).font('Times-Roman').text(
            'La APROBACIÓN, considera el cumplimiento de los estándares éticos nacionales e internacionales a los cuales se acoge la Universidad Nacional del Altiplano, los lineamientos científicos y éticos, el balance riesgo – beneficio, la calificación del equipo investigador y las características de confidencialidad y reserva de los datos obtenidos, entre otros.',
            { align: 'justify', lineGap: 4 }
        );
        doc.moveDown(1);

        doc.text(
            'Las enmiendas, eventualidades o cualquier cambio en las características del presente Proyecto de Investigación, deberá ser reportada de acuerdo a los plazos y normas establecidas. El investigador principal reportará cada seis meses el progreso del estudio y alcanzará el informe respectivo al término de éste.',
            { align: 'justify', lineGap: 4 }
        );
        doc.moveDown(1);

        // Párrafo de vigencia
        const dateInicio = new Date(expediente.updated_at || new Date());
        const dateFin = new Date(dateInicio);
        dateFin.setFullYear(dateInicio.getFullYear() + 1);
        const dateFinStr = formatSpanishDate(dateFin, false);

        doc.text(
            `La APROBACIÓN tiene vigencia desde la emisión del presente documento hasta el `,
            { continued: true, align: 'justify', lineGap: 4 }
        );
        doc.font('Times-Bold').text(`${dateFinStr}`, { continued: true });
        doc.font('Times-Roman').text(', pudiendo ser renovada, previa evaluación del estado del Proyecto de Investigación por lo menos 30 días previo a la fecha de vencimiento.', { continued: false });
        doc.moveDown(1.5);

        // Fecha Puno
        const dateCarta = formatSpanishDate(dateInicio, false);
        doc.fontSize(12).font('Times-Roman').text(`Puno, ${dateCarta}.`, { align: 'justify' });

        // Firma del Presidente (Dra. Edith Tello Palma)
        if (doc.y > 670) {
            doc.addPage();
        }

        doc.moveDown(3);
        doc.fontSize(10).font('Times-Bold').fillColor('#000000').text(presidenteNombre, { align: 'center' });
        doc.text('Presidente', { align: 'center' });
        doc.text('Comité Institucional de Ética en Investigación', { align: 'center' });
        doc.text('UNA-Puno', { align: 'center' });

        // Pintar encabezado y pies de página dinámicos al final
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            drawHeader(doc, 'constancia');
            drawFooter(doc, 'constancia', anioEmision);
        }

        doc.end();

    } catch (error) {
        console.error('Error al generar PDF de constancia:', error);
        res.status(500).json({ error: 'Falla interna al generar la resolución.' });
    }
};

// CU-17: Generar Carta de Observaciones en PDF
export const descargarCartaObservaciones = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT s.id, s.numero_expediente, s.titulo_proyecto, s.estado_actual, s.comentarios_comite, s.created_at, s.updated_at,
                    u.nombres, u.apellidos, u.correo_institucional
             FROM solicitudes s
             JOIN usuarios u ON s.investigador_id = u.id
             WHERE s.id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        const expediente = result.rows[0];

        if (expediente.estado_actual !== 'observado') {
            res.status(400).json({ error: 'Solo se pueden emitir cartas de observaciones para proyectos en estado observado.' });
            return;
        }

        // Consultar secretario activo
        const secretarioRes = await pool.query(
            `SELECT nombres, apellidos FROM usuarios WHERE rol = 'secretario' LIMIT 1`
        );
        let secretarioNombre = 'M.SC. JUAN GUILLERMO ARCAYA COYURI';
        if (secretarioRes && secretarioRes.rowCount !== null && secretarioRes.rowCount > 0) {
            const rawNom = `${secretarioRes.rows[0].nombres} ${secretarioRes.rows[0].apellidos}`.toUpperCase();
            if (!rawNom.startsWith('M.SC.') && !rawNom.startsWith('MSC.') && !rawNom.startsWith('DR.') && !rawNom.startsWith('DRA.')) {
                if (rawNom.includes('ARCAYA') || rawNom.includes('GUILLERMO')) {
                    secretarioNombre = `M.SC. ${rawNom}`;
                } else {
                    secretarioNombre = rawNom;
                }
            } else {
                secretarioNombre = rawNom;
            }
        }

        const doc = new PDFDocument({ 
            size: 'A4', 
            margins: { top: 110, bottom: 80, left: 50, right: 50 },
            bufferPages: true 
        });

        res.setHeader('Content-disposition', `attachment; filename="Carta_Observaciones_${expediente.numero_expediente}.pdf"`);
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res); 

        // Fecha de la carta
        const dateCarta = formatSpanishDate(new Date(), true);
        doc.fontSize(12).font('Times-Roman').fillColor('#000000').text(`Puno, ${dateCarta}`, { align: 'right' });
        doc.moveDown(0.5);

        // Código de Carta
        const correlativo = String(expediente.id).padStart(3, '0');
        const anio = new Date(expediente.created_at).getFullYear();
        const numCarta = `CARTA N° ${correlativo}-${anio}-CIEI-VRI-UNA PUNO.`;
        doc.fontSize(12).font('Times-Bold').text(numCarta, { align: 'left' });
        doc.moveDown(1.5);

        // Destinatario
        doc.fontSize(12).font('Times-Bold').text(`Dra. / Dr. ${expediente.nombres.toUpperCase()} ${expediente.apellidos.toUpperCase()}`);
        doc.fontSize(12).font('Times-Roman').text(`(${expediente.correo_institucional})`);
        doc.fontSize(12).font('Times-Roman').text('Investigador Principal');
        doc.fontSize(12).font('Times-Roman').text('Ciudad. -');
        doc.moveDown(1.5);

        // Saludo
        doc.fontSize(12).font('Times-Roman').text('De nuestra mayor consideración:');
        doc.moveDown(0.5);

        // Cuerpo de la carta
        const dateSession = formatSpanishDate(new Date(expediente.updated_at || expediente.created_at), true);
        const constanciaFutura = `${correlativo}/CIEI UNA Puno`;

        doc.fontSize(12).font('Times-Roman').text(
            `Por medio del presente, tenemos el agrado de dirigirnos a usted para saludarle muy cordialmente y en atención a la solicitud de autorización para el desarrollo del proyecto de Investigación `,
            { continued: true, align: 'justify', lineGap: 4 }
        );
        doc.font('Times-Bold').text(`“${expediente.titulo_proyecto.toUpperCase()}”`, { continued: true });
        doc.font('Times-Roman').text(
            `  indicarles que después de la evaluación en reunión ordinaria del CIEI de fecha `,
            { continued: true }
        );
        doc.font('Times-Bold').text(`${dateSession}`, { continued: true });
        doc.font('Times-Roman').text(
            `, luego de una evaluación el dictamen de `,
            { continued: true }
        );
        doc.font('Times-Bold').text(`APROBADO CON OBSERVACIONES`, { continued: true });
        doc.font('Times-Roman').text(
            `, por lo cual se emitirá la `,
            { continued: true }
        );
        doc.font('Times-Bold').text(`CONSTANCIA DE APROBACIÓN N° ${constanciaFutura}`, { continued: true });
        doc.font('Times-Roman').text(
            `; y a su vez  deberá: `,
            { continued: true }
        );
        doc.font('Times-Italic').text(`“presentar en físico el proyecto para la firma y sello correspondiente en cada una de sus partes”`, { continued: true });
        doc.font('Times-Roman').text(`.`, { continued: false });
        doc.moveDown(1.2);

        doc.font('Times-Bold').text('Para la entrega de la Constancia de Aprobación', { continued: true, lineGap: 4 })
           .font('Times-Roman').text(' correspondiente, ', { continued: true })
           .font('Times-Bold').text('deberá cumplir con revisar y corregir lo siguiente:', { continued: false });
        doc.moveDown(1);

        // Clasificar observaciones
        const sections = parseComentarios(expediente.comentarios_comite);

        const renderSection = (title: string, list: string[]) => {
            if (list.length === 0) return;
            doc.fontSize(12).font('Times-Bold').text(title, { lineGap: 4 });
            doc.moveDown(0.3);
            list.forEach(item => {
                doc.fontSize(12).font('Times-Roman').text(`• ${item}`, {
                    indent: 15,
                    align: 'justify',
                    lineGap: 4
                });
                doc.moveDown(0.2);
            });
            doc.moveDown(0.8);
        };

        if (sections.metodologicos.length > 0 || sections.legales.length > 0 || sections.hojaInformacion.length > 0) {
            renderSection('Aspectos metodológicos', sections.metodologicos);
            renderSection('Aspectos legales', sections.legales);
            renderSection('Hoja de información para participantes:', sections.hojaInformacion);
            renderSection('Otras observaciones', sections.otros);
        } else {
            const rawComments = (expediente.comentarios_comite || 'No se detallaron observaciones específicas.').split('\n');
            rawComments.forEach(line => {
                const trimmed = line.trim();
                if (trimmed) {
                    doc.fontSize(12).font('Times-Roman').text(`• ${trimmed}`, {
                        indent: 15,
                        align: 'justify',
                        lineGap: 4
                    });
                    doc.moveDown(0.2);
                }
            });
            doc.moveDown(0.8);
        }

        // Advertencia legal
        doc.fontSize(12).font('Times-Roman').text(
            `Se requiere que el investigador principal presente un escrito en físico y digital (https://ciei.unap.edu.pe/) que evidencie el levantamiento de observaciones punto por punto, señalando número de folios y resaltar lo corregido para corroborar las correcciones efectuadas, todo ello dentro del plazo de 30 días, bajo apercibimiento de declarar el abandono del procedimiento (Art. 202 T.U.O. Ley N° 27444).`,
            { align: 'justify', lineGap: 4 }
        );
        doc.moveDown(2);

        // Firma del Secretario (M.SC. JUAN GUILLERMO ARCAYA COYURI)
        if (doc.y > 670) {
            doc.addPage();
        }

        doc.fontSize(12).font('Times-Roman').text('Atentamente.', { align: 'left' });
        doc.moveDown(4.5);

        doc.fontSize(11).font('Times-Bold').text(secretarioNombre, { align: 'center' });
        doc.fontSize(11).font('Times-Roman').text('Secretario Técnico del Comité Institucional de Ética en Investigación - UNAP', { align: 'center' });

        // Pintar encabezado y pies de página dinámicos al final
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            drawHeader(doc, 'carta');
            drawFooter(doc, 'carta', anio);
        }

        doc.end();

    } catch (error) {
        console.error('Error al generar PDF de observaciones:', error);
        res.status(500).json({ error: 'Falla interna al generar la carta de observaciones.' });
    }
};

// CU-15: Aprobar Expediente
export const aprobarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (req.usuario.rol !== 'presidente' && req.usuario.rol !== 'admin') {
            res.status(403).json({ error: 'Solo el Presidente del CIEI puede aprobar proyectos.' });
            return;
        }
        const result = await pool.query(
            `UPDATE solicitudes SET estado_actual = 'aprobado', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );

        // Sellar los documentos aprobados (Proyecto y Consentimiento)
        const solicitudId = parseInt(id as string, 10);
        await sellarDocumentosAprobados(solicitudId);

        res.json({ mensaje: '¡Proyecto Aprobado Oficialmente!', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al aprobar:', error);
        res.status(500).json({ error: 'Falla interna al aprobar el expediente.' });
    }
};

// ==========================================
// FUNCIONES KODIAK PARA LA SALA DE EDICIÓN
// ==========================================

// Obtener los detalles de UN solo expediente
export const obtenerSolicitudPorId = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT s.*, u.correo_institucional AS investigador_correo, u.nombres AS investigador_nombres, u.apellidos AS investigador_apellidos
             FROM solicitudes s
             JOIN usuarios u ON s.investigador_id = u.id
             WHERE s.id = $1`,
            [id]
        );
        
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        const solicitud = result.rows[0];

        let miRolAsignacion = null;
        let miEstadoRevision = null;
        let miFechaLimite = null;

        // Si es Revisor, verificar asignación obligatoria
        if (req.usuario?.rol === 'revisor') {
            const checkAssignment = await pool.query(
                "SELECT rol_asignacion, estado_revision, fecha_limite FROM asignaciones_revision WHERE solicitud_id = $1 AND revisor_id = $2",
                [id, req.usuario.id]
            );
            if (checkAssignment.rowCount === 0) {
                res.status(403).json({ error: 'Acceso denegado. No está asignado a este expediente.' });
                return;
            }
            miRolAsignacion = checkAssignment.rows[0].rol_asignacion;
            miEstadoRevision = checkAssignment.rows[0].estado_revision;
            miFechaLimite = checkAssignment.rows[0].fecha_limite;

            // Módulo de Evaluación Ciega: Enmascarar datos si la identidad no ha sido revelada
            if (!solicitud.identidad_revelada) {
                solicitud.investigador_id = null;
                solicitud.investigador_correo = "[OCULTO]";
                solicitud.investigador_nombres = "[OCULTO]";
                solicitud.investigador_apellidos = "[OCULTO]";
                solicitud.investigadores_asociados = "[OCULTO - REVISIÓN CIEGA]";
                solicitud.facultad = "[OCULTO - REVISIÓN CIEGA]";
                solicitud.escuela_profesional = "[OCULTO - REVISIÓN CIEGA]";
                solicitud.origen_fondos = "[OCULTO - REVISIÓN CIEGA]";
            }
        }

        // Recuperar recomendaciones/dictamenes de revisores e incluir checklists estructurados y rol de asignación
        const dictamenesResult = await pool.query(
            `SELECT d.*, u.nombres AS revisor_nombres, u.apellidos AS revisor_apellidos,
                    ar.revisor_id, ar.rol_asignacion AS revisor_rol_asignacion,
                    ec.tipo_anexo AS checklist_tipo,
                    ec.respuestas_json AS checklist_respuestas
             FROM dictamenes d
             JOIN asignaciones_revision ar ON d.asignacion_id = ar.id
             JOIN usuarios u ON ar.revisor_id = u.id
             LEFT JOIN evaluaciones_checklist ec ON ec.dictamen_id = d.id
             WHERE ar.solicitud_id = $1
             ORDER BY d.fecha_emision DESC`,
            [id]
        );

        let recomendaciones = dictamenesResult.rows || [];

        // Filtro de Independencia: Revisor secundario sólo ve su dictamen, Revisor principal ve todos
        if (req.usuario?.rol === 'revisor' && miRolAsignacion === 'secundario') {
            recomendaciones = recomendaciones.filter((r: any) => r.revisor_id === req.usuario.id);
        }
        
        // Obtener el historial de seguimiento post-aprobación
        const seguimientoResult = await pool.query(
            'SELECT * FROM seguimiento_post_aprobacion WHERE solicitud_id = $1 ORDER BY fecha_creacion DESC',
            [id]
        );

        res.json({ 
            solicitud,
            recomendaciones,
            seguimiento: seguimientoResult.rows || [],
            miRolAsignacion,
            miEstadoRevision,
            miFechaLimite
        });
    } catch (error) {
        console.error('[SOLICITUDES] Error al cargar detalles:', error);
        res.status(500).json({ error: 'Falla del servidor al cargar el expediente.' });
    }
};

// Enviar/Subsanar (Cambio de estado inteligente KODIAK)
export const enviarSolicitud = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const investigador_id = req.usuario.id;

        const checkRes = await pool.query('SELECT estado_actual FROM solicitudes WHERE id = $1 AND investigador_id = $2', [id, investigador_id]);
        
        if (checkRes.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado o no te pertenece.' });
            return;
        }

        const estadoActual = checkRes.rows[0].estado_actual;
        const nuevoEstado = estadoActual === 'observado' ? 'subsanado' : 'enviado';

        await pool.query(
            'UPDATE solicitudes SET estado_actual = $1, updated_at = NOW() WHERE id = $2',
            [nuevoEstado, id]
        );

        res.json({ message: `Expediente actualizado exitosamente a: ${nuevoEstado}` });
    } catch (error) {
        console.error('[SOLICITUDES] Error al enviar:', error);
        res.status(500).json({ error: 'Error al enviar el expediente al comité.' });
    }
};
export const cambiarEstadoAPendientePago = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query(
            "UPDATE solicitudes SET estado_actual = 'pendiente_pago', updated_at = CURRENT_TIMESTAMP WHERE id = $1", 
            [id]
        );
        res.json({ mensaje: "Estado actualizado a pendiente de pago" });
    } catch (error) {
        res.status(500).json({ error: "Error interno" });
    }
};

export const revelarIdentidad = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (req.usuario.rol !== 'presidente' && req.usuario.rol !== 'secretario' && req.usuario.rol !== 'admin') {
            res.status(403).json({ error: 'No autorizado para desvelar identidad.' });
            return;
        }

        const result = await pool.query(
            `UPDATE solicitudes SET identidad_revelada = true, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        res.json({ mensaje: 'Identidad desvelada con éxito.', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al revelar identidad:', error);
        res.status(500).json({ error: 'Falla interna al desvelar identidad.' });
    }
};

export const clasificarTipoRevision = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { tipo_revision } = req.body; // 'completa' o 'expedita'
        
        if (req.usuario.rol !== 'presidente' && req.usuario.rol !== 'secretario' && req.usuario.rol !== 'admin') {
            res.status(403).json({ error: 'No autorizado para clasificar la revisión.' });
            return;
        }

        const result = await pool.query(
            `UPDATE solicitudes SET tipo_revision = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [tipo_revision, id]
        );

        res.json({ mensaje: `Expediente clasificado como: ${tipo_revision.toUpperCase()}`, solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al clasificar tipo de revisión:', error);
        res.status(500).json({ error: 'Falla interna al clasificar la revisión.' });
    }
};

const dibujarEstampaDigital = (doc: PDFKit.PDFDocument, revisor: any, y: number) => {
    doc.y = y;
    doc.rect(120, y, 350, 80).lineWidth(1).strokeColor('#CBD5E1').fillAndStroke('#F8FAFC', '#CBD5E1');
    doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
    doc.text('FIRMADO DIGITALMENTE Y COMPROMETIDO BAJO ACUERDO DE CONFIDENCIALIDAD', 130, y + 10, { width: 330, align: 'center' });
    doc.font('Helvetica');
    doc.text(`Evaluador: ${revisor.nombres.toUpperCase()} ${revisor.apellidos.toUpperCase()}`, 130, y + 30);
    doc.text(`DNI: ${revisor.dni}`, 130, y + 42);
    doc.text(`Fecha y Hora de Firma: ${new Date().toLocaleString('es-PE')}`, 130, y + 54);
    doc.text(`Identificador Único: CIEI-HASH-${Math.floor(Math.random() * 1e12)}`, 130, y + 66);
    doc.y = y + 90;
};

const generarChecklistPDF = async (solicitudId: number, dictamenId: number, revisorId: number, checklistData: any): Promise<string> => {
    try {
        const solRes = await pool.query('SELECT numero_expediente, titulo_proyecto FROM solicitudes WHERE id = $1', [solicitudId]);
        if (solRes.rowCount === 0) {
            throw new Error('Solicitud no encontrada.');
        }
        const solicitud = solRes.rows[0];

        const dir = path.join(process.cwd(), 'uploads/evaluaciones');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const pdfName = `checklist_${solicitudId}_${revisorId}_${dictamenId}.pdf`;
        const pdfPath = path.join(dir, pdfName);
        const relativePath = `uploads/evaluaciones/${pdfName}`;

        const pdfBuffer = await PdfTemplateService.generarChecklistTemplatePDF(solicitud, checklistData);
        fs.writeFileSync(pdfPath, pdfBuffer);

        return relativePath;
    } catch (error) {
        console.error('Error al generar PDF del checklist:', error);
        throw error;
    }
};

const generarCartaRevisionPDF = async (solicitudId: number, dictamenId: number, veredicto: string, comentarios: string, revisorPrincipalId: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const solRes = await pool.query(
                `SELECT s.numero_expediente, s.titulo_proyecto, u.nombres AS inst_nombres, u.apellidos AS inst_apellidos
                 FROM solicitudes s
                 JOIN usuarios u ON s.investigador_id = u.id
                 WHERE s.id = $1`, 
                [solicitudId]
            );
            const revRes = await pool.query('SELECT nombres, apellidos, dni, firma_imagen_ruta FROM usuarios WHERE id = $1', [revisorPrincipalId]);

            if (solRes.rowCount === 0 || revRes.rowCount === 0) {
                throw new Error('Solicitud o Revisor Principal no encontrado.');
            }

            const solicitud = solRes.rows[0];
            const revisor = revRes.rows[0];

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            
            const dir = path.join(__dirname, '../../uploads/cartas_revision');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const pdfName = `carta_revision_${solicitudId}_${dictamenId}.pdf`;
            const pdfPath = path.join(dir, pdfName);
            const relativePath = `uploads/cartas_revision/${pdfName}`;

            const writeStream = fs.createWriteStream(pdfPath);
            doc.pipe(writeStream);

            drawHeader(doc);
            doc.y = 120;

            doc.fontSize(12).font('Helvetica-Bold').fillColor('#0F172A').text('CARTA DE REVISIÓN Y DICTAMEN CONSOLIDADO DEL COMITÉ', { align: 'center' });
            doc.moveDown(1);

            doc.fontSize(10).font('Helvetica-Bold').text('Nº Expediente: ', { continued: true }).font('Helvetica').text(solicitud.numero_expediente);
            doc.font('Helvetica-Bold').text('Proyecto: ', { continued: true }).font('Helvetica').text(`“${solicitud.titulo_proyecto}”`);
            doc.font('Helvetica-Bold').text('Investigador: ', { continued: true }).font('Helvetica').text(`${solicitud.inst_nombres} ${solicitud.inst_apellidos}`);
            doc.font('Helvetica-Bold').text('Revisor Principal (Consolidador): ', { continued: true }).font('Helvetica').text(`${revisor.nombres} ${revisor.apellidos}`);
            doc.font('Helvetica-Bold').text('Fecha del Dictamen: ', { continued: true }).font('Helvetica').text(new Date().toLocaleDateString('es-PE'));
            doc.moveDown(1.5);

            doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('OBSERVACIONES DETALLADAS DEL COMITÉ EVALUADOR:');
            doc.moveDown(0.5);

            const checklistsRes = await pool.query(
                `SELECT ec.*, u.nombres AS rev_nom, u.apellidos AS rev_ape, ar.rol_asignacion
                 FROM evaluaciones_checklist ec
                 JOIN dictamenes d ON ec.dictamen_id = d.id
                 JOIN asignaciones_revision ar ON d.asignacion_id = ar.id
                 JOIN usuarios u ON ar.revisor_id = u.id
                 WHERE ar.solicitud_id = $1`,
                [solicitudId]
            );

            if (checklistsRes.rowCount !== null && checklistsRes.rowCount > 0) {
                checklistsRes.rows.forEach((chk: any) => {
                    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text(`Evaluación de: ${chk.rev_nom} ${chk.rev_ape} (${chk.rol_asignacion === 'principal' ? 'Principal' : 'Secundario'})`);
                    doc.moveDown(0.3);

                    const tipoAnexo = chk.tipo_anexo || 'G';
                    const config = getAnexoByTipo(tipoAnexo);
                    
                    const respuestasMap: any = {};
                    const respuestasRaw = chk.respuestas_json || [];
                    if (Array.isArray(respuestasRaw)) {
                        respuestasRaw.forEach((r: any) => {
                            if (r && r.id) respuestasMap[r.id] = r;
                        });
                    } else if (typeof respuestasRaw === 'object' && respuestasRaw !== null) {
                        Object.keys(respuestasRaw).forEach(k => {
                            const val = respuestasRaw[k];
                            respuestasMap[k] = typeof val === 'string' ? { valoracion: val } : val;
                        });
                    }

                    let hasObservations = false;
                    
                    config.secciones.forEach(sec => {
                        sec.subsecciones.forEach(sub => {
                            sub.preguntas.forEach(q => {
                                const ans = respuestasMap[q.id];
                                const val = ans ? (ans.valoracion || ans.calif || 'No aplica') : 'No aplica';
                                const just = ans ? (ans.justificacion_texto || ans.just || '') : '';
                                
                                if (just && just.trim() !== '') {
                                    hasObservations = true;
                                    
                                    if (doc.y > 720) {
                                        doc.addPage();
                                        drawHeader(doc);
                                        doc.y = 120;
                                    }
                                    
                                    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text(`  • [${val.toUpperCase()}] ${q.texto}: `, { continued: true })
                                       .font('Helvetica').text(just);
                                    doc.moveDown(0.2);
                                }
                            });
                        });
                    });

                    if (!hasObservations) {
                        doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748B').text('  Sin observaciones particulares en las preguntas.');
                        doc.moveDown(0.3);
                    }
                    doc.moveDown(0.8);
                });
            } else {
                doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('No se registraron observaciones en el checklist de criterios.');
                doc.moveDown(0.5);
            }

            if (comentarios && comentarios.trim() !== '') {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('COMENTARIOS ADICIONALES DE CONSOLIDACIÓN:');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').fillColor('#334155').text(comentarios);
                doc.moveDown(1.5);
            }

            if (doc.y > 600) {
                doc.addPage();
                drawHeader(doc);
                doc.y = 120;
            }

            doc.rect(50, doc.y, 495, 45).lineWidth(1.5).strokeColor('#E2E8F0').fillAndStroke('#F8FAFC', '#E2E8F0');
            doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold');
            doc.text('VEREDICTO FINAL DEL COMITÉ EVALUADOR:', 65, doc.y + 15, { continued: true });
            
            let verColor = '#10B981';
            if (veredicto === 'observado') verColor = '#F59E0B';
            if (veredicto === 'rechazado') verColor = '#EF4444';

            doc.fillColor(verColor).text(` ${veredicto.toUpperCase()}`, { align: 'left' });
            doc.y += 60;

            const signatureY = doc.y;
            if (revisor.firma_imagen_ruta) {
                const absoluteFirmaPath = path.resolve(revisor.firma_imagen_ruta);
                if (fs.existsSync(absoluteFirmaPath)) {
                    try {
                        doc.image(absoluteFirmaPath, 200, signatureY, { width: 150 });
                        doc.y = signatureY + 80;
                    } catch (e) {
                        dibujarEstampaDigital(doc, revisor, signatureY);
                    }
                } else {
                    dibujarEstampaDigital(doc, revisor, signatureY);
                }
            } else {
                dibujarEstampaDigital(doc, revisor, signatureY);
            }

            doc.end();

            writeStream.on('finish', () => {
                resolve(relativePath);
            });

            writeStream.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
};

export const descargarChecklistPDF = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { dictamenId } = req.params;
        
        // 1. Obtener dictamen y respuestas de checklist
        const dictamenResult = await pool.query(
            `SELECT d.*, ar.solicitud_id, ec.tipo_anexo, ec.respuestas_json
             FROM dictamenes d
             JOIN asignaciones_revision ar ON d.asignacion_id = ar.id
             LEFT JOIN evaluaciones_checklist ec ON ec.dictamen_id = d.id
             WHERE d.id = $1`,
            [dictamenId]
        );

        if (dictamenResult.rowCount === 0) {
            res.status(404).json({ error: 'Dictamen no encontrado.' });
            return;
        }

        const dictamenData = dictamenResult.rows[0];
        if (!dictamenData.respuestas_json) {
            res.status(404).json({ error: 'Este dictamen no tiene un checklist estructurado registrado.' });
            return;
        }

        // 2. Obtener datos de la solicitud
        const solicitudResult = await pool.query(
            `SELECT numero_expediente, titulo_proyecto, tipo_investigacion
             FROM solicitudes
             WHERE id = $1`,
            [dictamenData.solicitud_id]
        );

        if (solicitudResult.rowCount === 0) {
            res.status(404).json({ error: 'Solicitud no encontrada.' });
            return;
        }

        const solicitud = solicitudResult.rows[0];

        // 3. Generar el PDF estampado en memoria utilizando la plantilla
        const pdfBuffer = await PdfTemplateService.generarChecklistTemplatePDF(solicitud, {
            tipo_anexo: dictamenData.tipo_anexo,
            respuestas_json: dictamenData.respuestas_json
        });

        // 4. Enviar PDF al cliente con los headers correctos
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Checklist_Evaluacion_${dictamenId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error al descargar checklist PDF:', error);
        res.status(500).json({ error: 'Error interno al generar y descargar el checklist.' });
    }
};

export const descargarCartaRevisionPDF = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT ruta_carta_revision, numero_expediente FROM solicitudes WHERE id = $1', [id]);

        if (result.rowCount === 0 || !result.rows[0].ruta_carta_revision) {
            res.status(404).json({ error: 'PDF de Carta de Revisión no encontrado para este expediente.' });
            return;
        }

        const rutaAbsoluta = path.resolve(result.rows[0].ruta_carta_revision);
        if (!fs.existsSync(rutaAbsoluta)) {
            res.status(404).json({ error: 'El archivo físico de la carta de revisión no existe en el servidor.' });
            return;
        }

        res.download(rutaAbsoluta, `Carta_Revision_${result.rows[0].numero_expediente}.pdf`);
    } catch (error) {
        console.error('Error al descargar carta de revisión PDF:', error);
        res.status(500).json({ error: 'Error interno al descargar la carta de revisión.' });
    }
};

export const reactivarEvaluacion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const solicitudId = parseInt(id as string, 10);

        // 1. Obtener la solicitud
        const solRes = await pool.query('SELECT estado_actual FROM solicitudes WHERE id = $1', [solicitudId]);
        if (solRes.rowCount === 0) {
            res.status(404).json({ error: 'Expediente no encontrado.' });
            return;
        }

        const solicitud = solRes.rows[0];

        // 2. Verificar que esté en estado 'subsanado'
        if (solicitud.estado_actual !== 'subsanado') {
            res.status(400).json({ error: 'Solo se pueden reactivar evaluaciones de expedientes con estado "subsanado".' });
            return;
        }

        // 3. Buscar el último Revisor Principal asignado a esta solicitud
        const lastPrincipalRes = await pool.query(
            `SELECT revisor_id FROM asignaciones_revision 
             WHERE solicitud_id = $1 AND rol_asignacion = 'principal'
             ORDER BY fecha_asignacion DESC LIMIT 1`,
            [solicitudId]
        );

        if (lastPrincipalRes.rowCount === 0) {
            res.status(400).json({ error: 'No se encontró un Revisor Principal previo para este expediente.' });
            return;
        }

        const revisorId = lastPrincipalRes.rows[0].revisor_id;

        // 4. Cambiar el estado de la solicitud a 'en_revision'
        await pool.query(
            `UPDATE solicitudes 
             SET estado_actual = 'en_revision', updated_at = NOW()
             WHERE id = $1`,
            [solicitudId]
        );

        // 5. Limpiar asignaciones previas no dictaminadas
        await pool.query(
            "DELETE FROM asignaciones_revision WHERE solicitud_id = $1 AND estado_revision != 'dictaminado'",
            [solicitudId]
        );

        // 6. Insertar la nueva asignación para el Revisor Principal con fecha_limite a 30 días
        await pool.query(
            `INSERT INTO asignaciones_revision (solicitud_id, revisor_id, rol_asignacion, estado_revision, fecha_asignacion, fecha_limite)
             VALUES ($1, $2, 'principal', 'pendiente', NOW(), NOW() + INTERVAL '30 days')`,
            [solicitudId, revisorId]
        );

        res.json({ mensaje: 'Evaluación re-activada con éxito. Se ha asignado nuevamente al Revisor Principal de la ronda anterior.' });
    } catch (error) {
        console.error('Error al reactivar evaluación:', error);
        res.status(500).json({ error: 'Falla interna al reactivar la evaluación.' });
    }
};