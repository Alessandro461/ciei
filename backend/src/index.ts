console.log("¡Hola! Node sí está leyendo mi archivo.");
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';
import documentosRoutes from './routes/documentos.routes';
import authRoutes from './routes/auth.routes'; 
import solicitudesRoutes from './routes/solicitudes.routes'; 
import usuariosRoutes from './routes/usuarios.routes'; // <-- 1. Aquí lo importamos
import adminRoutes from './routes/admin.routes'; // <-- 2. ¡Y aquí también!
import portalRoutes from './routes/portal.routes';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Definición de Rutas
app.use('/api/auth', authRoutes); 
app.use('/api/solicitudes', solicitudesRoutes); 
app.use('/api/documentos', documentosRoutes);
app.use('/api/usuarios', usuariosRoutes); // <-- 2. ¡ESTA ES LA LÍNEA MÁGICA QUE FALTABA!
app.use('/api/admin', adminRoutes); // <-- 3. ¡Y ESTA TAMBIÉN! Rutas para administración (usuarios, configuraciones, etc.)
app.use('/api/portal', portalRoutes); // <-- 4. Rutas para la Landing Page (video, avisos, etc.)
// Ruta de prueba
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      mensaje: '¡El motor del sistema CIEI está funcionando al 100%!',
      hora_servidor: result.rows[0].now
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falla al conectar con la base de datos' });
  }
});

// Levantar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
});