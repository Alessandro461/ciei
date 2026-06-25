import { Response } from 'express';
import { pool } from '../db';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middlewares/authMiddleware';

// CU-12: Obtener todos los usuarios (Solo Admin)
export const obtenerUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // VERIFICACIÓN ROBUSTA: Consultamos el rol real a la Base de Datos
        const usuarioReq = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.usuario.id]);
        
        if (usuarioReq.rowCount === 0 || usuarioReq.rows[0].rol !== 'admin') {
            res.status(403).json({ error: 'Acceso denegado. Área exclusiva de administración.' });
            return;
        }

        const result = await pool.query(
            `SELECT id, dni, nombres, apellidos, correo_institucional, rol, estado, created_at 
             FROM usuarios 
             ORDER BY created_at DESC`
        );

        res.json({ usuarios: result.rows });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Falla interna al cargar el directorio de usuarios.' });
    }
};

// CU-13: Crear un nuevo usuario desde el panel (Solo Admin)
export const crearUsuarioAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // VERIFICACIÓN ROBUSTA
        const usuarioReq = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.usuario.id]);
        
        if (usuarioReq.rowCount === 0 || usuarioReq.rows[0].rol !== 'admin') {
            res.status(403).json({ error: 'Acceso denegado.' });
            return;
        }

        const { dni, nombres, apellidos, correo_institucional, password, rol } = req.body;

        // Validación de complejidad de contraseña (mínimo 8 caracteres, al menos 1 letra y 1 número)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password || '')) {
            res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres y contener letras y números.' });
            return;
        }

        // Encriptamos la contraseña ingresada
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, rol) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, nombres, apellidos, rol`,
            [dni, nombres, apellidos, correo_institucional, password_hash, rol]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente en el sistema.',
            usuario: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error al crear usuario:', error);
        // Código 23505 de PostgreSQL = Unique Violation (Dato repetido)
        if (error.code === '23505') {
            res.status(400).json({ error: 'El DNI o Correo institucional ya están registrados en el sistema.' });
            return;
        }
        res.status(500).json({ error: 'Falla interna al registrar el usuario.' });
    }
};

// CU-14: Cambiar el rol de un usuario (Solo Admin)
export const cambiarRol = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // VERIFICACIÓN ROBUSTA: Consultamos el rol real a la Base de Datos
        const usuarioReq = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.usuario.id]);
        
        if (usuarioReq.rowCount === 0 || usuarioReq.rows[0].rol !== 'admin') {
            res.status(403).json({ error: 'Acceso denegado. Área exclusiva de administración.' });
            return;
        }

        const { id } = req.params;
        const { rol } = req.body;

        // Actualizamos el rol en la base de datos
        await pool.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, id]);

        res.json({ message: 'Rol de usuario actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({ error: 'Falla interna al actualizar el rol del usuario.' });
    }
};

// ==========================================
// NUEVAS FUNCIONES DE PERFIL (KODIAK)
// ==========================================

// CU-15: Obtener mi propio perfil
export const obtenerMiPerfil = async (req: any, res: any): Promise<void> => {
    try {
        // Obtenemos el ID del usuario que inició sesión desde el token
        const usuarioId = req.usuario.id; 

        // Consultamos a PostgreSQL pidiendo explícitamente el DNI y el CORREO
        const result = await pool.query(
            `SELECT id, nombres, apellidos, correo_institucional, dni, rol, es_invitado, acepto_confidencialidad_anexol, firma_imagen_ruta 
             FROM usuarios 
             WHERE id = $1`, 
            [usuarioId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Usuario no encontrado.' });
            return;
        }

        // Enviamos la respuesta exitosa al frontend
        res.json({ usuario: result.rows[0] });
    } catch (error) {
        console.error('🔥 Error crítico al obtener el perfil:', error);
        res.status(500).json({ error: 'Error interno al cargar los datos del perfil.' });
    }
};

// CU-15: Actualizar mi propio perfil y contraseña (FUSIONADO)
export const actualizarMiPerfil = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const usuarioId = req.usuario.id; // Lo sacamos del token, ¡super seguro!
        const { 
            nombres, apellidos, correo_institucional, 
            dni, telefono, facultad, escuela_profesional, tipo_investigador, // <-- Nuevos campos KODIAK
            passwordActual, passwordNueva 
        } = req.body;

        // 1. Buscamos al usuario en la base de datos
        const userRes = await pool.query('SELECT * FROM usuarios WHERE id = $1', [usuarioId]);
        if (userRes.rowCount === 0) {
            res.status(404).json({ error: 'Usuario no encontrado.' });
            return;
        }
        
        const usuarioDB = userRes.rows[0];
        
        // Preparamos los parámetros básicos
        let queryParams: any[] = [
            nombres, apellidos, correo_institucional, 
            dni || null, telefono || null, facultad || null, escuela_profesional || null, tipo_investigador || null, 
            usuarioId
        ];
        
        let updateQuery = `
            UPDATE usuarios 
            SET nombres = $1, apellidos = $2, correo_institucional = $3, 
                dni = $4, telefono = $5, facultad = $6, escuela_profesional = $7, tipo_investigador = $8, 
                updated_at = NOW() 
            WHERE id = $9 
            RETURNING id, nombres, apellidos, correo_institucional, rol, dni, telefono, facultad, escuela_profesional, tipo_investigador, firma_imagen_ruta`;

        // 2. Si el usuario llenó los campos de contraseña, la cambiamos
        if (passwordActual && passwordNueva) {
            // Comparamos la contraseña que escribió con la encriptada en la BD
            const validPassword = await bcrypt.compare(passwordActual, usuarioDB.password_hash);
            if (!validPassword) {
                res.status(400).json({ error: 'La contraseña actual es incorrecta. No se hicieron cambios.' });
                return;
            }
            
            // Si es correcta, encriptamos la nueva
            const salt = await bcrypt.genSalt(10);
            const nuevoHash = await bcrypt.hash(passwordNueva, salt);

            updateQuery = `
                UPDATE usuarios 
                SET nombres = $1, apellidos = $2, correo_institucional = $3, 
                    dni = $4, telefono = $5, facultad = $6, escuela_profesional = $7, tipo_investigador = $8, 
                    password_hash = $9, updated_at = NOW() 
                WHERE id = $10 
                RETURNING id, nombres, apellidos, correo_institucional, rol, dni, telefono, facultad, escuela_profesional, tipo_investigador, firma_imagen_ruta`;
            
            queryParams = [
                nombres, apellidos, correo_institucional, 
                dni || null, telefono || null, facultad || null, escuela_profesional || null, tipo_investigador || null, 
                nuevoHash, usuarioId
            ];
        }

        // 3. Ejecutamos la actualización
        const result = await pool.query(updateQuery, queryParams);

        res.json({
            message: 'Perfil actualizado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error: any) {
        console.error('[PERFIL] Error al actualizar:', error);
        if (error.code === '23505') {
            res.status(400).json({ error: 'El DNI o correo institucional ya está en uso por otra persona.' });
            return;
        }
        res.status(500).json({ error: 'Falla interna al intentar actualizar el perfil.' });
    }
};

export const firmarDeclaracionCoI = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const usuarioId = req.usuario.id;
        const { firma_digital } = req.body;
        const anio = new Date().getFullYear();

        if (!firma_digital) {
            res.status(400).json({ error: 'La firma digital es obligatoria.' });
            return;
        }

        // Verificar si ya existe para este año
        const check = await pool.query(
            'SELECT id FROM declaraciones_coi WHERE usuario_id = $1 AND anio = $2',
            [usuarioId, anio]
        );

        if (check.rowCount !== null && check.rowCount > 0) {
            res.status(400).json({ error: 'Ya has firmado tu Declaración de Conflicto de Interés para este año.' });
            return;
        }

        await pool.query(
            'INSERT INTO declaraciones_coi (usuario_id, anio, firma_digital, fecha_firma) VALUES ($1, $2, $3, NOW())',
            [usuarioId, anio, firma_digital]
        );

        res.status(201).json({ mensaje: 'Declaración de Conflicto de Interés firmada exitosamente.' });
    } catch (error) {
        console.error('Error al firmar CoI:', error);
        res.status(500).json({ error: 'Error interno del servidor al firmar CoI.' });
    }
};

export const obtenerEstadoDeclaracionCoI = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const usuarioId = req.usuario.id;
        const anio = new Date().getFullYear();

        const result = await pool.query(
            'SELECT * FROM declaraciones_coi WHERE usuario_id = $1 AND anio = $2',
            [usuarioId, anio]
        );

        res.json({ firmado: result.rowCount !== null && result.rowCount > 0, declaracion: result.rows[0] || null });
    } catch (error) {
        console.error('Error al obtener estado CoI:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener estado CoI.' });
    }
};

export const aceptarConfidencialidadAnexoL = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const usuarioId = req.usuario.id;

        await pool.query(
            'UPDATE usuarios SET acepto_confidencialidad_anexol = true, updated_at = NOW() WHERE id = $1',
            [usuarioId]
        );

        res.json({ mensaje: 'Acuerdo de Confidencialidad (Anexo L) aceptado exitosamente.' });
    } catch (error) {
        console.error('Error al aceptar acuerdo L:', error);
        res.status(500).json({ error: 'Error interno al aceptar el acuerdo de confidencialidad.' });
    }
};

export const subirFirmaUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const usuarioId = req.usuario.id;
        const archivo = (req as any).file;

        if (!archivo) {
            res.status(400).json({ error: 'No se ha proporcionado ninguna imagen de firma.' });
            return;
        }

        // Guardar la ruta del archivo en la base de datos
        await pool.query(
            'UPDATE usuarios SET firma_imagen_ruta = $1, updated_at = NOW() WHERE id = $2',
            [archivo.path, usuarioId]
        );

        res.json({
            mensaje: 'Firma subida y registrada exitosamente.',
            firma_imagen_ruta: archivo.path
        });
    } catch (error) {
        console.error('Error al subir firma de usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor al subir la firma.' });
    }
};