export interface PreguntaChecklist {
  id: string;
  texto: string;
}

export interface SubseccionChecklist {
  titulo: string;
  preguntas: PreguntaChecklist[];
}

export interface SeccionChecklist {
  titulo: string;
  subsecciones: SubseccionChecklist[];
}

export interface AnexoChecklist {
  tipo: 'G' | '7';
  titulo: string;
  secciones: SeccionChecklist[];
}

export const ANEXO_G: AnexoChecklist = {
  tipo: 'G',
  titulo: 'Estudios Observacionales en Humanos (Anexo G)',
  secciones: [
    {
      titulo: 'Sección 1: Aspectos Metodológicos',
      subsecciones: [
        {
          titulo: 'Justificación del estudio',
          preguntas: [
            { id: 'g_just_suficiente', texto: '¿Existe una justificación suficiente para el estudio?' },
            { id: 'g_just_prioridad', texto: '¿Se justifica por la prioridad regional en investigación?' },
            { id: 'g_just_cientifico', texto: '¿Se justifica por el interés científico?' }
          ]
        },
        {
          titulo: 'Declaración del problema',
          preguntas: [
            { id: 'g_prob_magnitud', texto: '¿Se evidencia la magnitud del problema?' },
            { id: 'g_prob_propuesta', texto: '¿El estudio plantea propuestas a algún problema de salud?' }
          ]
        },
        {
          titulo: 'Marco teórico',
          preguntas: [
            { id: 'g_marco_teorias', texto: '¿Se plantean teorías suficientes y actualizadas?' },
            { id: 'g_marco_sustento', texto: '¿Las teorías sustentan un estadio original?' }
          ]
        },
        {
          titulo: 'Metodología',
          preguntas: [
            { id: 'g_metod_variables', texto: '¿Se identifican y describen las variables del estudio?' },
            { id: 'g_metod_diseno', texto: '¿El diseño es replicable?' },
            { id: 'g_metod_muestra', texto: '¿Es el tamaño muestral correcto?' }
          ]
        }
      ]
    },
    {
      titulo: 'Sección 2: Aspectos Éticos',
      subsecciones: [
        {
          titulo: 'Autonomía',
          preguntas: [
            { id: 'g_etico_aut_consentimiento', texto: 'Obtención del consentimiento informado' },
            { id: 'g_etico_aut_asentimiento', texto: 'Asentimiento' },
            { id: 'g_etico_aut_comprension', texto: 'Comprensión' }
          ]
        },
        {
          titulo: 'Beneficencia',
          preguntas: [
            { id: 'g_etico_ben_relacion', texto: 'Relación beneficio/riesgo' },
            { id: 'g_etico_ben_metodologia', texto: 'Metodología correcta' }
          ]
        },
        {
          titulo: 'Justicia',
          preguntas: [
            { id: 'g_etico_just_seleccion', texto: 'Selección equitativa de los participantes (criterios de inclusión/exclusión)' }
          ]
        },
        {
          titulo: 'Vulnerabilidad',
          preguntas: [
            { id: 'g_etico_vul_identificados', texto: '¿Se han identificado grupos vulnerables especiales?' },
            { id: 'g_etico_vul_garantias', texto: '¿Se han contemplado garantías adicionales de protección?' }
          ]
        }
      ]
    },
    {
      titulo: 'Sección 3: Aspectos Legales',
      subsecciones: [
        {
          titulo: '',
          preguntas: [
            { id: 'g_legal_helsinki', texto: 'Declaración de Helsinki' },
            { id: 'g_legal_datos', texto: 'Ley de protección de datos personales (Ley N° 29733)' }
          ]
        }
      ]
    },
    {
      titulo: 'Sección 4: Evaluación de la Hoja de Información',
      subsecciones: [
        {
          titulo: '',
          preguntas: [
            { id: 'g_hoja_descripcion', texto: 'Descripción del estudio (Riesgos, beneficios, duración)' },
            { id: 'g_hoja_derechos', texto: 'Derechos de los participantes (Retirada, confidencialidad, compensaciones)' }
          ]
        }
      ]
    }
  ]
};

export const ANEXO_7: AnexoChecklist = {
  tipo: '7',
  titulo: 'Estudios en Animales (Anexo 7)',
  secciones: [
    {
      titulo: 'Sección 1: Aspectos Metodológicos',
      subsecciones: [
        {
          titulo: 'Justificación',
          preguntas: [
            { id: 'a7_just_uso', texto: '¿Se justifica el uso de animales?' },
            { id: 'a7_just_reemplazo', texto: '¿Se analizan alternativas de reemplazo?' }
          ]
        },
        {
          titulo: 'Metodología',
          preguntas: [
            { id: 'a7_metod_aleatorizacion', texto: '¿Incluye procesos de aleatorización?' },
            { id: 'a7_metod_modelo', texto: '¿Es un modelo animal de enfermedad?' },
            { id: 'a7_metod_extrapolacion', texto: '¿Demuestra procesos de extrapolación?' }
          ]
        }
      ]
    },
    {
      titulo: 'Sección 2: Aspectos Éticos',
      subsecciones: [
        {
          titulo: '',
          preguntas: [
            { id: 'a7_etico_adquisicion', texto: 'La adquisición de los animales ¿será de entidades con bioterios acreditados?' },
            { id: 'a7_etico_avance', texto: '¿El uso de animales vivos en la investigación contribuirá al avance del conocimiento?' },
            { id: 'a7_etico_dolor', texto: '¿Los animales experimentarán dolor, molestia o angustia? (Frecuencia, duración, severidad)' },
            { id: 'a7_etico_eutanasia', texto: 'Eutanasia (¿Está indicada?, ¿Cuál es la disposición final?)' }
          ]
        }
      ]
    },
    {
      titulo: 'Sección 3: Aspectos Legales',
      subsecciones: [
        {
          titulo: '',
          preguntas: [
            { id: 'a7_legal_ley30407', texto: 'Ley N° 30407 (Ley de Protección y Bienestar Animal)' },
            { id: 'a7_legal_codigo_veterinario', texto: 'Código Deontológico del Colegio Médico Veterinario' }
          ]
        }
      ]
    },
    {
      titulo: 'Sección 4: Presupuesto y Seguimiento',
      subsecciones: [
        {
          titulo: '',
          preguntas: [
            { id: 'a7_presup_gastos', texto: '¿Supone gastos para la institución?' },
            { id: 'a7_presup_seguimiento', texto: '¿Se especifica el seguimiento detallado del proceso?' }
          ]
        }
      ]
    }
  ]
};

export const getAnexoByTipo = (tipo: 'G' | '7' | string): AnexoChecklist => {
  return tipo === '7' || tipo === 'animales' ? ANEXO_7 : ANEXO_G;
};
