import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


// Extendemos la interfaz de Request
export interface AuthRequest extends Request {
    usuario?: any;
}

// Fíjate que aquí volvemos a usar 'Request' normal para que Express no se queje
export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: 'Acceso denegado. No hay token.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        // Aquí hacemos la magia: forzamos a TypeScript a tratarlo como AuthRequest
        (req as AuthRequest).usuario = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token no válido.' });
    }
};