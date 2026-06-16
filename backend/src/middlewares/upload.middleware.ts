import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Función para crear configuraciones de subida dinámicas
const crearConfiguracionUpload = (subCarpeta: string) => {
    const uploadDir = `uploads/${subCarpeta}`;
    
    // 1. Asegurar que la carpeta exista en el servidor
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 2. Configurar dónde y con qué nombre se guardan los archivos
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            // Nombre único: Fecha actual + número aleatorio + extensión original
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

    // 3. Aplicar filtros de tamaño (20MB) y tipos de archivo (.pdf, .doc, .docx)
    return multer({
        storage: storage,
        limits: { fileSize: 20 * 1024 * 1024 }, 
        fileFilter: (req, file, cb) => {
            const permitidos = ['.pdf', '.doc', '.docx'];
            const ext = path.extname(file.originalname).toLowerCase();
            
            if (permitidos.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error('Formato no permitido. Solo se acepta PDF o DOCX.'));
            }
        }
    });
};

// Exportamos tres configuraciones independientes
export const uploadDocumentos = crearConfiguracionUpload('documentos'); // Para los investigadores
export const uploadFormatos = crearConfiguracionUpload('formatos');     // Para los formatos del admin

// Configuración específica para firmas digitales (imágenes PNG/JPG/JPEG)
const storageFirmas = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/firmas';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'firma-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const uploadFirma = multer({
    storage: storageFirmas,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    fileFilter: (req, file, cb) => {
        const permitidos = ['.png', '.jpg', '.jpeg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (permitidos.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Formato no permitido. Solo se acepta PNG, JPG o JPEG.'));
        }
    }
});