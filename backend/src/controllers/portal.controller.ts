import { Request, Response } from 'express';
import { pool } from '../db';
import path from 'path';
import fs from 'fs';

export const getContenido = async (req: Request, res: Response): Promise<void> => {
    try {
        const videoRes = await pool.query("SELECT valor FROM configuracion_portal WHERE clave = 'video_url'");
        
        // Magia: Traemos todos los avisos activos, ordenados del más nuevo al más viejo
        const avisosRes = await pool.query("SELECT * FROM avisos WHERE activo = true ORDER BY id DESC");
        
        res.json({
            videoUrl: videoRes.rows.length > 0 ? videoRes.rows[0].valor : null,
            avisos: avisosRes.rows 
        });
    } catch (error) {
        console.error('[PORTAL] Error al obtener contenido:', error);
        res.status(500).json({ error: 'Error al obtener contenido' });
    }
};

export const updateVideo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { videoUrl } = req.body;
        await pool.query(
            "INSERT INTO configuracion_portal (clave, valor) VALUES ('video_url', $1) ON CONFLICT (clave) DO UPDATE SET valor = $1",
            [videoUrl]
        );
        res.json({ message: 'Video actualizado correctamente' });
    } catch (error) {
        console.error('[PORTAL] Error al actualizar video:', error);
        res.status(500).json({ error: 'Error al guardar el video' });
    }
};

// ¡NUEVA FUNCIÓN! Para guardar los avisos con su imagen
export const crearAviso = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tipo, color, fecha, titulo, texto, imagen_url } = req.body;
        await pool.query(
            "INSERT INTO avisos (tipo, color, fecha, titulo, texto, imagen_url) VALUES ($1, $2, $3, $4, $5, $6)",
            [tipo, color, fecha, titulo, texto, imagen_url || null]
        );
        res.json({ message: 'Aviso publicado en la Landing Page' });
    } catch (error) {
        console.error('[PORTAL] Error al crear aviso:', error);
        res.status(500).json({ error: 'Error al publicar el aviso' });
    }
};
// NUEVO: Función para eliminar un aviso del historial
export const eliminarAviso = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM avisos WHERE id = $1", [id]);
        res.json({ message: 'Aviso eliminado correctamente' });
    } catch (error) {
        console.error('[PORTAL] Error al eliminar aviso:', error);
        res.status(500).json({ error: 'Error al eliminar el aviso' });
    }
};
export const editarAviso = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { tipo, color, fecha, titulo, texto, imagen_url } = req.body;
        await pool.query(
            "UPDATE avisos SET tipo=$1, color=$2, fecha=$3, titulo=$4, texto=$5, imagen_url=$6 WHERE id=$7",
            [tipo, color, fecha, titulo, texto, imagen_url || null, id]
        );
        res.json({ message: 'Aviso editado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al editar el aviso' });
    }
};
// ==========================================
// 3. GESTIÓN DINÁMICA DE FORMATOS INSTITUCIONALES
// ==========================================

// Listar todos los formatos disponibles
export const listarFormatosMetadatos = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT id, titulo, nombre_archivo_original, actualizado_at, categoria FROM formatos_oficiales ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar formatos.' });
    }
};

// Crear un nuevo formato (Solo registra el título y la categoría, luego se le sube el archivo)
export const crearFormato = async (req: Request, res: Response): Promise<void> => {
    try {
        const { titulo, categoria } = req.body;
        await pool.query('INSERT INTO formatos_oficiales (titulo, categoria) VALUES ($1, $2)', [titulo, categoria || 'humanos']);
        res.json({ message: 'Nuevo formato creado exitosamente. Ahora puedes subirle un archivo.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el formato.' });
    }
};

// Editar solo el título de un formato
export const editarTituloFormato = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { titulo } = req.body;
        await pool.query('UPDATE formatos_oficiales SET titulo = $1 WHERE id = $2', [titulo, id]);
        res.json({ message: 'Título actualizado correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al editar el título.' });
    }
};

// Eliminar un formato por completo
export const eliminarFormato = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM formatos_oficiales WHERE id = $1', [id]);
        res.json({ message: 'Formato eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el formato.' });
    }
};

// Subir el archivo Word/PDF a un formato específico usando su ID
export const actualizarFormatoOficial = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const file = (req as any).file;

        if (!file) {
            res.status(400).json({ error: 'No se detectó ningún archivo.' });
            return;
        }

        await pool.query(
            `UPDATE formatos_oficiales 
             SET nombre_archivo_original = $1, ruta_archivo = $2, actualizado_at = NOW() 
             WHERE id = $3`,
            [file.originalname, file.path, id]
        );

        res.json({ mensaje: 'Archivo subido correctamente.', nombre_archivo: file.originalname });
    } catch (error) {
        res.status(500).json({ error: 'Falla al procesar el archivo.' });
    }
};

// Descargar formato público usando su ID
export const descargarFormatoPublico = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT ruta_archivo, nombre_archivo_original FROM formatos_oficiales WHERE id = $1', [id]);
        
        if (result.rowCount === 0 || !result.rows[0].ruta_archivo) {
            res.status(404).json({ error: 'El archivo aún no ha sido subido por el administrador.' });
            return;
        }

        const formato = result.rows[0];
        const rutaAbsoluta = path.resolve(formato.ruta_archivo);

        if (!fs.existsSync(rutaAbsoluta)) {
            res.status(404).json({ error: 'El archivo físico se perdió del servidor.' });
            return;
        }

        res.download(rutaAbsoluta, formato.nombre_archivo_original);
    } catch (error) {
        res.status(500).json({ error: 'Error al descargar.' });
    }
};