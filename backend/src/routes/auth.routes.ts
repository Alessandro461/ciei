import { Router } from 'express';
// Asegúrate de importar consultarDNI junto a las otras funciones que ya tienes
import { registrarUsuario, loginUsuario, consultarDNI } from '../controllers/auth.controller';

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

// ¡Esta es la nueva ruta puente para el DNI!
router.get('/dni/:numero', consultarDNI);

export default router;