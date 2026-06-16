import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { getCoordinatesByTipo } from '../constants/pdfCoordinates';

export class PdfTemplateService {
  /**
   * Genera el PDF del checklist estampando los datos sobre la plantilla correspondiente.
   */
  public static async generarChecklistTemplatePDF(solicitud: any, checklistData: any): Promise<Buffer> {
    const tipoAnexo = checklistData.tipo_anexo || 'G';
    // Determinar archivo de plantilla
    const fileName = tipoAnexo === '7' || tipoAnexo === 'animales' ? 'Anexo_7.pdf' : 'Anexo_G.pdf';
    
    // Buscar la ruta del archivo de forma robusta
    let templatePath = path.join(process.cwd(), 'src/assets/templates', fileName);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'backend/src/assets/templates', fileName);
    }
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(__dirname, '../assets/templates', fileName);
    }
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(__dirname, '../../src/assets/templates', fileName);
    }
    if (!fs.existsSync(templatePath)) {
      // Fallback absoluto por seguridad
      templatePath = `C:\\Users\\Alessandro\\Documents\\ciei-sistema-main\\backend\\src\\assets\\templates\\${fileName}`;
    }

    if (!fs.existsSync(templatePath)) {
      throw new Error(`No se pudo encontrar la plantilla PDF en la ruta: ${templatePath}`);
    }

    // Cargar plantilla en memoria
    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const config = getCoordinatesByTipo(tipoAnexo);

    // 1. Estampar datos administrativos en la página 1
    const firstPage = pages[0];
    
    // Código de Expediente
    if (solicitud.numero_expediente) {
      firstPage.drawText(solicitud.numero_expediente, {
        x: config.administrative.codigo.x,
        y: config.administrative.codigo.y,
        size: 9
      });
    }

    // Fecha del dictamen
    const fechaTexto = new Date().toLocaleDateString('es-PE');
    firstPage.drawText(fechaTexto, {
      x: config.administrative.fecha.x,
      y: config.administrative.fecha.y,
      size: 9
    });

    // Título del proyecto
    if (solicitud.titulo_proyecto) {
      // Cortar el título si es extremadamente largo para que no se desborde del campo de cabecera
      const tituloCorto = solicitud.titulo_proyecto.length > 80 
        ? solicitud.titulo_proyecto.substring(0, 77) + '...'
        : solicitud.titulo_proyecto;
      firstPage.drawText(tituloCorto, {
        x: config.administrative.titulo.x,
        y: config.administrative.titulo.y,
        size: 8
      });
    }

    // Investigador Principal (OCULTO POR EVALUACIÓN CIEGA)
    firstPage.drawText('[OCULTO POR REVISIÓN CIEGA]', {
      x: config.administrative.investigador.x,
      y: config.administrative.investigador.y,
      size: 9
    });

    // 2. Procesar respuestas del checklist
    const respuestasRaw = checklistData.respuestas_json || checklistData.respuestas || [];
    const respuestas = Array.isArray(respuestasRaw) ? respuestasRaw : [];
    
    // Group justifications by their target observation box
    const obsListByBox: { [boxKey: string]: { obsPage: number; obsEndY: number; text: string }[] } = {};

    respuestas.forEach((resp: any) => {
      if (!resp || !resp.id) return;

      const qConfig = config.questions[resp.id];
      if (!qConfig) return;

      const page = pages[qConfig.pageIndex];
      if (!page) return;

      // Estampar la "X" en la valoración correspondiente
      const val = resp.valoracion || resp.calif || 'No aplica';
      const columnX = qConfig.columns[val];
      if (columnX !== undefined) {
        page.drawText('X', {
          x: columnX,
          y: qConfig.y,
          size: 10
        });
      }

      // Recolectar justificaciones para observaciones
      const just = resp.justificacion_texto || resp.just || '';
      if (just && just.trim() !== '') {
        const obsPage = qConfig.obsPage;
        const obsStartY = qConfig.obsStartY;
        const obsEndY = qConfig.obsEndY;
        const boxKey = `${obsPage}_${obsStartY}`;

        if (!obsListByBox[boxKey]) {
          obsListByBox[boxKey] = [];
        }
        const textPregunta = resp.texto || resp.id;
        obsListByBox[boxKey].push({
          obsPage,
          obsEndY,
          text: `• ${textPregunta}: ${just}`
        });
      }
    });

    // Helper simple de text wrapping
    const wrapText = (text: string, maxLength: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        if ((currentLine + ' ' + word).trim().length <= maxLength) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // 3. Escribir observaciones y acumular desbordes
    const overflowLines: string[] = [];
    const lineHeight = 12;
    const maxLength = 95;
    const startX = 60;

    for (const boxKey of Object.keys(obsListByBox)) {
      const items = obsListByBox[boxKey];
      if (items.length === 0) continue;

      const [obsPageIdxStr, obsStartYStr] = boxKey.split('_');
      const obsPageIdx = parseInt(obsPageIdxStr, 10);
      const obsStartY = parseInt(obsStartYStr, 10);
      const page = pages[obsPageIdx];
      if (!page) continue;

      let currentY = obsStartY;
      const obsEndY = items[0].obsEndY;

      for (const item of items) {
        const lines = wrapText(item.text, maxLength);
        for (const line of lines) {
          if (currentY >= obsEndY) {
            page.drawText(line, {
              x: startX,
              y: currentY,
              size: 8
            });
            currentY -= lineHeight;
          } else {
            // Se desbordó del cuadro de la página, va al overflow al final del PDF
            overflowLines.push(line);
          }
        }
        // Separador menor entre observaciones de distintas preguntas
        currentY -= 4;
      }
    }

    // 4. Lógica de Overflow: Añadir páginas en blanco si hay observaciones sobrantes
    if (overflowLines.length > 0) {
      let overflowPage = pdfDoc.addPage();
      let currentY = 740;
      const startX = 60;
      const endY = 60;
      const lineHeight = 12;

      // Título en la nueva página
      overflowPage.drawText('ANEXO: OBSERVACIONES Y JUSTIFICACIONES ADICIONALES (CONTINUACIÓN)', {
        x: 60,
        y: 780,
        size: 10
      });
      overflowPage.drawText(`Expediente Nº: ${solicitud.numero_expediente || ''}`, {
        x: 60,
        y: 764,
        size: 8
      });

      for (const line of overflowLines) {
        if (currentY >= endY) {
          overflowPage.drawText(line, {
            x: startX,
            y: currentY,
            size: 8
          });
          currentY -= lineHeight;
        } else {
          // Agregar otra página de overflow si la primera también se llena
          overflowPage = pdfDoc.addPage();
          overflowPage.drawText('ANEXO: OBSERVACIONES Y JUSTIFICACIONES ADICIONALES (CONTINUACIÓN)', {
            x: 60,
            y: 780,
            size: 10
          });
          overflowPage.drawText(`Expediente Nº: ${solicitud.numero_expediente || ''}`, {
            x: 60,
            y: 764,
            size: 8
          });
          currentY = 740;
          
          overflowPage.drawText(line, {
            x: startX,
            y: currentY,
            size: 8
          });
          currentY -= lineHeight;
        }
      }
    }

    // Guardar el PDF y retornar como Buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
