import { Router } from 'express';
import { 
  registrarUsuario, 
  loginUsuario, 
  consultarDNI, 
  solicitarRecuperacionPassword, 
  restablecerPassword 
} from '../controllers/auth.controller';

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/dni/:numero', consultarDNI);

// Rutas para recuperación de contraseña
router.post('/recuperar-password', solicitarRecuperacionPassword);
router.post('/restablecer-password', restablecerPassword);

export default router;