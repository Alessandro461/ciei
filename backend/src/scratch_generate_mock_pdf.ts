import { PdfTemplateService } from './services/PdfTemplateService';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const solicitud = {
    numero_expediente: 'CIEI-2026-TEST',
    titulo_proyecto: 'Efecto de la altura y la hipoxia en el desarrollo de la función cognitiva en residentes de Puno'
  };

  const checklistData = {
    tipo_anexo: 'G',
    respuestas_json: [
      { id: 'g_just_suficiente', valoracion: 'Adecuado', justificacion_texto: '', texto: '¿Existe una justificación suficiente?' },
      { id: 'g_just_prioridad', valoracion: 'Insuficiente', justificacion_texto: 'El planteamiento no delimita con claridad la prioridad regional del estudio según los lineamientos de salud pública de la región Puno.', texto: '¿El estudio responde a prioridades de salud?' },
      { id: 'g_just_cientifico', valoracion: 'Adecuado', justificacion_texto: '', texto: '¿Existe un valor científico?' },
      { id: 'g_prob_magnitud', valoracion: 'Inadecuado', justificacion_texto: 'No se describe adecuadamente la magnitud del problema y el grupo poblacional a estudiar presenta contradicciones metodológicas severas en el tamaño de muestra.', texto: '¿Se describe la magnitud del problema?' },
      { id: 'g_marco_teorias', valoracion: 'No aplica', justificacion_texto: '', texto: '¿El marco teórico sustenta las hipótesis?' },
      { id: 'g_metod_diseno', valoracion: 'Insuficiente', justificacion_texto: 'El diseño metodológico describe un estudio retrospectivo pero luego propone intervenciones activas que contradicen la naturaleza del diseño sugerido. Esto invalida parte de las garantías del consentimiento informado.', texto: '¿El diseño del estudio es adecuado?' },
      { id: 'g_etico_aut_consentimiento', valoracion: 'Insuficiente', justificacion_texto: 'La hoja de información para el consentimiento informado tiene un lenguaje técnico sumamente complejo que no resultará comprensible para la población rural seleccionada. Adicionalmente, el texto de justificación excede el espacio regular del recuadro para demostrar de forma fehaciente cómo el motor de overflow del sistema digital CIEI UNA-Puno genera una nueva página en blanco para continuar la redacción de las justificaciones extensas, respetando los límites de diseño normativo del manual 2022.', texto: '¿Se garantiza el proceso de consentimiento informado?' }
    ]
  };

  try {
    const pdfBuffer = await PdfTemplateService.generarChecklistTemplatePDF(solicitud, checklistData);
    const outputPath = path.join(process.cwd(), 'uploads/evaluaciones/ejemplo_checklist_anexog.pdf');
    
    // Ensure dir exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ PDF ejemplo generado con éxito en: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error al generar el PDF de ejemplo:', error);
  }
  process.exit(0);
}

run();
