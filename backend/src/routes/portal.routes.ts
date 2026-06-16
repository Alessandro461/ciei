import { Router } from 'express';
import { 
    getContenido, 
    updateVideo, 
    crearAviso, 
    editarAviso, 
    eliminarAviso,
    listarFormatosMetadatos,
    crearFormato,
    editarTituloFormato,
    eliminarFormato,
    actualizarFormatoOficial, 
    descargarFormatoPublico
} from '../controllers/portal.controller';
import { verificarToken } from '../middlewares/authMiddleware'; 
import { uploadFormatos } from '../middlewares/upload.middleware'; 

const router = Router();

// ==========================================
// 1. RUTAS PÚBLICAS (Landing Page)
// ==========================================
router.get('/contenido', getContenido);
router.get('/formatos/descargar/:id', descargarFormatoPublico); // Descarga ahora por ID
router.get('/formatos/metadatos', listarFormatosMetadatos)
// ==========================================
// 2. RUTAS PRIVADAS (Panel del Administrador)
// ==========================================
router.put('/video', verificarToken, updateVideo);
router.post('/avisos', verificarToken, crearAviso);
router.put('/avisos/:id', verificarToken, editarAviso);
router.delete('/avisos/:id', verificarToken, eliminarAviso);

// --- NUEVO CRUD DINÁMICO DE FORMATOS INSTITUCIONALES ---
router.get('/formatos/metadatos', verificarToken, listarFormatosMetadatos);
router.post('/formatos', verificarToken, crearFormato); // Crear nuevo formato
router.put('/formatos/:id/titulo', verificarToken, editarTituloFormato); // Editar solo el título
router.delete('/formatos/:id', verificarToken, eliminarFormato); // Eliminar formato
router.put('/formatos/subir/:id', verificarToken, uploadFormatos.single('formato'), actualizarFormatoOficial); // Subir archivo por ID
router.get('/formatos/metadatos', verificarToken, listarFormatosMetadatos);
export default router;