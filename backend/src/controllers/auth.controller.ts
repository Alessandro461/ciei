import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import crypto from 'crypto';
import { enviarCorreo } from '../utils/mailer';

export const registrarUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const { dni, nombres, apellidos, correo_institucional, password, rol, facultad } = req.body;

        // Validación de complejidad de contraseña (mínimo 8 caracteres, al menos 1 letra y 1 número)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password || '')) {
            res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres y contener letras y números.' });
            return;
        }

        // 1. Verificar si el usuario o DNI ya existen en la base de datos
        const userExists = await pool.query(
            'SELECT * FROM usuarios WHERE correo_institucional = $1 OR dni = $2', 
            [correo_institucional, dni]
        );

        if (userExists.rows.length > 0) {
            res.status(400).json({ error: 'El usuario con ese correo o DNI ya está registrado.' });
            return;
        }

        // 2. Encriptar la contraseña (bcrypt)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Insertar el nuevo usuario (Usando la columna exacta)
        const result = await pool.query(
            `INSERT INTO usuarios (dni, nombres, apellidos, correo_institucional, password_hash, rol, facultad)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nombres, correo_institucional, rol`,
            [dni, nombres, apellidos, correo_institucional, passwordHash, rol, facultad]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar.' });
    }
};  

export const loginUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("\n[LOGIN] -----------------------------------------");
        
        // Atrapamos la variable, sin importar si React la manda como 'correo' o 'correo_institucional'
        const correoRecibido = req.body.correo_institucional || req.body.correo;
        const password = req.body.password;

        console.log(`[LOGIN] Datos recibidos - Correo: "${correoRecibido}", Password: "${password}"`);

        if (!correoRecibido || !password) {
            console.log("[LOGIN] FALLO: Faltan credenciales.");
            res.status(400).json({ error: 'Faltan credenciales' });
            return;
        }

        // Buscamos estrictamente en la columna 'correo_institucional'
        const userResult = await pool.query(
            'SELECT * FROM usuarios WHERE correo_institucional = $1',
            [correoRecibido]
        );

        if (userResult.rows.length === 0) {
            console.log(`[LOGIN] FALLO: El correo ${correoRecibido} no existe en la Base de Datos.`);
            res.status(401).json({ error: 'Credenciales incorrectas' });
            return;
        }

        const usuario = userResult.rows[0];
        console.log(`[LOGIN] Usuario encontrado. Validando Hash...`);

        // Verificamos que la contraseña encriptada coincida
        const validPassword = await bcrypt.compare(password, usuario.password_hash);
        console.log(`[LOGIN] ¿La contraseña coincide?: ${validPassword}`);

        if (!validPassword) {
            console.log("[LOGIN] FALLO: La contraseña no coincide con el Hash de la BD.");
            res.status(401).json({ error: 'Credenciales incorrectas' });
            return;
        }

        console.log(`[LOGIN] ÉXITO! Generando acceso para: ${usuario.rol}`);

        // Generar el Token
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET || 'firma_de_respaldo',
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('[LOGIN] Error crítico en el servidor:', error);
        res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
    }
};
export const consultarDNI = async (req: Request, res: Response): Promise<void> => {
    try {
        const { numero } = req.params;
        console.log(`\n[RENIEC] Buscando DNI real: ${numero}...`);
        
        // Llamada a la API pública oficial
        const response = await fetch(`https://api.apis.net.pe/v1/dni?numero=${numero}`);
        
        if (!response.ok) {
            console.log(`[RENIEC] El DNI ${numero} no existe o es inválido.`);
            res.status(404).json({ error: 'DNI no encontrado' });
            return;
        }

        const data = await response.json();
        console.log(`[RENIEC] Nombres reales encontrados:`, data.nombres);
        
        res.json({
            nombres: data.nombres,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno
        });
    } catch (error) {
        console.error('[RENIEC] Error en el servidor al buscar DNI:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const solicitarRecuperacionPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { correo_institucional } = req.body;

        if (!correo_institucional) {
            res.status(400).json({ error: 'El correo electrónico es requerido.' });
            return;
        }

        // 1. Buscar si el usuario existe
        const userResult = await pool.query(
            'SELECT * FROM usuarios WHERE correo_institucional = $1',
            [correo_institucional]
        );

        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'El correo electrónico no está registrado.' });
            return;
        }

        const usuario = userResult.rows[0];

        // 2. Generar token único y expiración (1 hora)
        const token = crypto.randomBytes(20).toString('hex');
        const expiracion = new Date(Date.now() + 3600000); // 1 hora

        // 3. Guardar token en base de datos
        await pool.query(
            'UPDATE usuarios SET token_recuperacion = $1, token_recuperacion_expiracion = $2 WHERE id = $3',
            [token, expiracion, usuario.id]
        );

        // 4. Crear enlace de recuperación
        const origin = req.headers.origin || 'http://localhost:5173';
        const enlaceRecuperacion = `${origin}/reset-password?token=${token}`;

        console.log(`\n🔑 [RECUPERACIÓN] Enlace generado para ${correo_institucional}:\n${enlaceRecuperacion}\n`);

        // 5. Enviar el correo
        const asunto = 'CIEI UNA Puno - Recuperación de Contraseña';
        const mensajeHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #0b132b; font-weight: 800; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Recuperación de Contraseña</h2>
                <p>Estimado(a) <strong>${usuario.nombres} ${usuario.apellidos}</strong>,</p>
                <p>Usted ha solicitado restablecer su contraseña para acceder a la Plataforma del Comité de Ética en Investigación Científica (CIEI).</p>
                <p>Haga clic en el botón de abajo para cambiar su contraseña. Este enlace expira en 1 hora:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${enlaceRecuperacion}" style="background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Restablecer Contraseña
                    </a>
                </div>
                <p style="font-size: 12px; color: #64748b;">Si usted no realizó esta solicitud, puede ignorar este mensaje de forma segura.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Comité CIEI - Universidad Nacional del Altiplano</p>
            </div>
        `;

        const enviado = await enviarCorreo(correo_institucional, asunto, mensajeHtml);

        if (enviado) {
            res.json({ mensaje: 'Se ha enviado un enlace de recuperación a su correo institucional.' });
        } else {
            console.warn(`[RECUPERACIÓN] Falló el servicio SMTP al enviar el correo. Devolviendo el enlace en la respuesta.`);
            res.json({ 
                mensaje: 'Se generó la solicitud, pero falló el envío de correo.', 
                debugLink: enlaceRecuperacion, 
                advertencia: 'El servicio de correo institucional no está disponible temporalmente. Use el enlace de desarrollo para pruebas.'
            });
        }

    } catch (error) {
        console.error('Error al solicitar recuperación de contraseña:', error);
        res.status(500).json({ error: 'Error interno al procesar la solicitud de recuperación.' });
    }
};

export const restablecerPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            res.status(400).json({ error: 'El token y la nueva contraseña son requeridos.' });
            return;
        }

        // Validación de complejidad de contraseña (mínimo 8 caracteres, al menos 1 letra y 1 número)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password || '')) {
            res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres y contener letras y números.' });
            return;
        }

        // 1. Buscar si el token es válido y no ha expirado
        const userResult = await pool.query(
            'SELECT * FROM usuarios WHERE token_recuperacion = $1 AND token_recuperacion_expiracion > NOW()',
            [token]
        );

        if (userResult.rows.length === 0) {
            res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado.' });
            return;
        }

        const usuario = userResult.rows[0];

        // 2. Encriptar la nueva contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Actualizar contraseña y limpiar tokens
        await pool.query(
            'UPDATE usuarios SET password_hash = $1, token_recuperacion = NULL, token_recuperacion_expiracion = NULL WHERE id = $2',
            [passwordHash, usuario.id]
        );

        res.json({ mensaje: 'Su contraseña ha sido restablecida exitosamente. Ya puede iniciar sesión.' });

    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ error: 'Error interno al procesar el cambio de contraseña.' });
    }
};