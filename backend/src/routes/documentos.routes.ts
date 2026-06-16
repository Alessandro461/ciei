import { Router } from 'express';
import { 
    subirDocumento, 
    obtenerDocumentosPorSolicitud, 
    descargarDocumento,
    descargarDocumentoSeguimiento
} from '../controllers/documentos.controller';
import { verificarToken } from '../middlewares/authMiddleware';

// Mantenemos tu ruta original exacta
import { uploadDocumentos } from '../middlewares/upload.middleware';

const router = Router();

// 1. Ruta para subir el documento (Drag & Drop)
router.post('/subir', verificarToken, uploadDocumentos.single('archivo'), subirDocumento);

// 2. ¡NUEVA RUTA! Para cargar el Timeline de versiones
router.get('/solicitud/:id', verificarToken, obtenerDocumentosPorSolicitud);

// 3. ¡NUEVA RUTA! Para descargar archivos antiguos del historial
router.get('/descargar/:id', verificarToken, descargarDocumento);

// 4. ¡NUEVA RUTA! Para descargar archivos del Seguimiento Post-Aprobación
router.get('/seguimiento/:id/descargar', verificarToken, descargarDocumentoSeguimiento);

export default router;