import fs from 'fs';
import path from 'path';
import { pool } from '../db';
import { PDFDocument, rgb } from 'pdf-lib';

export async function sellarDocumentosAprobados(solicitudId: number): Promise<void> {
    try {
        console.log(`[PDF-STAMPER] Iniciando sellado de PDFs para solicitud ID #${solicitudId}...`);
        
        // 1. Obtener la última versión del proyecto y consentimiento
        const query = `
            SELECT d1.id, d1.ruta_archivo, d1.nombre_archivo_original, d1.tipo_anexo 
            FROM documentos d1
            WHERE d1.solicitud_id = $1 
              AND d1.tipo_anexo IN ('proyecto', 'consentimiento')
              AND d1.version = (
                  SELECT MAX(d2.version) 
                  FROM documentos d2 
                  WHERE d2.solicitud_id = $1 AND d2.anexo_clave = d1.anexo_clave
              )
        `;
        const result = await pool.query(query, [solicitudId]);

        if (result.rowCount === 0) {
            console.log(`[PDF-STAMPER] No se encontraron archivos de proyecto o consentimiento para sellar.`);
            return;
        }

        const correlativo = String(solicitudId).padStart(3, '0');
        const resolucionId = `${correlativo}`;
        const fechaAprobacion = new Date().toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const stampText = `Aprobado por el CIEI UNA-Puno | Resolucion: ${resolucionId} | Fecha: ${fechaAprobacion}`;

        for (const doc of result.rows) {
            const rutaAbsoluta = path.resolve(doc.ruta_archivo);
            
            // Verificar si el archivo existe y es PDF
            if (!fs.existsSync(rutaAbsoluta)) {
                console.warn(`[PDF-STAMPER] Archivo no encontrado en el disco: ${rutaAbsoluta}`);
                continue;
            }

            if (!doc.nombre_archivo_original.toLowerCase().endsWith('.pdf')) {
                console.log(`[PDF-STAMPER] Omitiendo sellado para ${doc.nombre_archivo_original} (no es un archivo PDF).`);
                continue;
            }

            console.log(`[PDF-STAMPER] Sellando archivo: ${doc.nombre_archivo_original}...`);

            try {
                // Cargar el PDF
                const fileBuffer = fs.readFileSync(rutaAbsoluta);
                const pdfDoc = await PDFDocument.load(fileBuffer);
                
                const pages = pdfDoc.getPages();
                
                // Estampar cada página en el margen inferior derecho
                for (const page of pages) {
                    const { width, height } = page.getSize();
                    page.drawText(stampText, {
                        x: width - 365,
                        y: 20,
                        size: 10,
                        color: rgb(0.06, 0.09, 0.16) // Color azul oscuro/gris pizarra
                    });
                }

                // Guardar PDF modificado
                const pdfBytes = await pdfDoc.save();
                fs.writeFileSync(rutaAbsoluta, pdfBytes);
                console.log(`[PDF-STAMPER] Archivo sellado con éxito y sobreescrito en: ${rutaAbsoluta}`);

            } catch (err) {
                console.error(`[PDF-STAMPER] Error al sellar el PDF ${doc.nombre_archivo_original}:`, err);
            }
        }

        console.log(`[PDF-STAMPER] Proceso de sellado terminado para la solicitud #${solicitudId}.`);

    } catch (error) {
        console.error('[PDF-STAMPER] Error crítico en el módulo de sellado:', error);
    }
}
