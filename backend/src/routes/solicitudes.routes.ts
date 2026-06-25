import { Router } from 'express';
import { 
    crearSolicitudBorrador, 
    obtenerMisSolicitudes, 
    enviarSolicitud, 
    obtenerSolicitudesComite,
    dictaminarSolicitud,
    asignarRevisor,
    subsanarSolicitud,
    descargarResolucion,
    aprobarSolicitud,
    obtenerSolicitudPorId,
    recomendarDictamen,
    descargarCartaObservaciones,
    revelarIdentidad,
    clasificarTipoRevision,
    descargarChecklistPDF,
    descargarCartaRevisionPDF,
    reactivarEvaluacion
} from '../controllers/solicitudes.controller';
import { verificarToken } from '../middlewares/authMiddleware';
import { pool } from '../db'; 

const router = Router();

// ==========================================
// RUTAS DEL PRESIDENTE Y COMITÉ
// ==========================================
router.get('/comite/todas', verificarToken, obtenerSolicitudesComite);
router.put('/:id/dictamen', verificarToken, dictaminarSolicitud);
router.put('/:id/reactivar-evaluacion', verificarToken, reactivarEvaluacion);
router.put('/:id/asignar', verificarToken, asignarRevisor); 
router.put('/:id/aprobar', verificarToken, aprobarSolicitud);
router.put('/:id/revelar-identidad', verificarToken, revelarIdentidad);
router.put('/:id/tipo-revision', verificarToken, clasificarTipoRevision);
router.get('/dictamen/:dictamenId/checklist-pdf', verificarToken, descargarChecklistPDF);
router.get('/:id/carta-revision-pdf', verificarToken, descargarCartaRevisionPDF);

// Ruta rápida para obtener la lista de usuarios con rol "revisor"
router.get('/revisores/lista', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nombres, apellidos,
                   (SELECT COUNT(*)::int FROM asignaciones_revision ar 
                    WHERE ar.revisor_id = usuarios.id AND ar.estado_revision != 'dictaminado') AS carga_activa
            FROM usuarios 
            WHERE rol = 'revisor'
        `);
        res.json({ revisores: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar los revisores' });
    }
});

// ==========================================
// RUTAS DEL INVESTIGADOR
// ==========================================
router.get('/', verificarToken, obtenerMisSolicitudes);
router.post('/', verificarToken, crearSolicitudBorrador);

// --- Rutas Dinámicas (Con :id) ---
router.get('/:id/resolucion', verificarToken, descargarResolucion);
router.get('/:id/carta-observacion', verificarToken, descargarCartaObservaciones);
router.put('/:id/subsanar', verificarToken, subsanarSolicitud); 
router.put('/:id/enviar', verificarToken, enviarSolicitud);
router.put('/:id/recomendar', verificarToken, recomendarDictamen);

// ¡AQUÍ ESTÁ LA MAGIA QUE FALTABA! (La ponemos al final por seguridad)
router.get('/:id', verificarToken, obtenerSolicitudPorId);

export default router;