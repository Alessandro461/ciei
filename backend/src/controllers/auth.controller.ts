import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';

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