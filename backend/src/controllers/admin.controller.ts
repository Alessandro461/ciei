import { Request, Response } from 'express';
import { pool } from '../db';

// CU-04: Gestionar usuarios y roles (Admin)
export const listarUsuarios = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, nombres, apellidos, dni, correo, rol FROM usuarios');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
};

// CU-15: Configurar parámetros (Avisos, cronogramas, etc.)
export const obtenerConfiguracion = async (req: Request, res: Response) => {
    // Aquí podrías consultar una tabla de configuraciones si la tuvieras
    res.json({ mensaje: "Configuraciones obtenidas correctamente" });
};