import { Router } from 'express';
import { listarUsuarios, obtenerConfiguracion } from '../controllers/admin.controller';
import { verificarToken } from '../middlewares/authMiddleware';
const router = Router();

// Solo el rol 'admin' debería acceder a estas rutas
router.get('/usuarios', verificarToken, listarUsuarios);
router.get('/configuracion', verificarToken, obtenerConfiguracion);

export default router;