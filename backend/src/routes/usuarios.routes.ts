import { Router } from 'express';
// ¡AQUÍ ESTABA EL DETALLE! Agregamos "obtenerMiPerfil" a la lista
import { 
    obtenerUsuarios, 
    crearUsuarioAdmin, 
    cambiarRol, 
    actualizarMiPerfil,
    obtenerMiPerfil,
    firmarDeclaracionCoI,
    obtenerEstadoDeclaracionCoI,
    aceptarConfidencialidadAnexoL,
    subirFirmaUsuario
} from '../controllers/usuarios.controller';
import { verificarToken } from '../middlewares/authMiddleware';
import { uploadFirma } from '../middlewares/upload.middleware';

const router = Router();

// ==========================================
// RUTAS DEL PERFIL (Tu usuario)
// ==========================================
router.get('/perfil', verificarToken, obtenerMiPerfil);    // Leer datos (DNI, correo)
router.put('/perfil', verificarToken, actualizarMiPerfil); // Guardar cambios
router.post('/perfil/firma', verificarToken, uploadFirma.single('firma'), subirFirmaUsuario); // Subir firma en imagen

// ==========================================
// RUTAS DE DECLARACIONES Y CONFIDENCIALIDAD
// ==========================================
router.post('/declarar-coi', verificarToken, firmarDeclaracionCoI);
router.get('/declarar-coi/estado', verificarToken, obtenerEstadoDeclaracionCoI);
router.post('/aceptar-confidencialidad', verificarToken, aceptarConfidencialidadAnexoL);

// ==========================================
// RUTAS DE ADMINISTRACIÓN (Terceros)
// ==========================================
router.get('/', verificarToken, obtenerUsuarios);
router.post('/', verificarToken, crearUsuarioAdmin);
router.put('/:id/rol', verificarToken, cambiarRol);

export default router;