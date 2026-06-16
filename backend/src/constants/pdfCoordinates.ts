export interface Coordenada {
  pageIndex: number;
  y: number;
  columns: {
    [key: string]: number;
  };
  obsPage: number;
  obsStartY: number;
  obsEndY: number;
}

export interface PlantillaConfig {
  administrative: {
    codigo: { pageIndex: number; x: number; y: number };
    fecha: { pageIndex: number; x: number; y: number };
    titulo: { pageIndex: number; x: number; y: number };
    investigador: { pageIndex: number; x: number; y: number };
  };
  questions: {
    [questionId: string]: Coordenada;
  };
}

export const COORDINATES_ANEXO_G: PlantillaConfig = {
  administrative: {
    codigo: { pageIndex: 0, x: 180, y: 595 },
    fecha: { pageIndex: 0, x: 400, y: 338 },
    titulo: { pageIndex: 0, x: 180, y: 620 },
    investigador: { pageIndex: 0, x: 180, y: 445 }
  },
  questions: {
    // Sección 1: Aspectos Metodológicos (Page 1 & 2)
    // Columns: Adecuado=241, Insuficiente=306, Inadecuado=374, No se describe=449, No aplica=519
    // Observation Box: Page 2 (index 1), startY=325, endY=308
    g_just_suficiente: {
      pageIndex: 0,
      y: 89.0,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_just_prioridad: {
      pageIndex: 0,
      y: 59.3,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_just_cientifico: {
      pageIndex: 1,
      y: 791.0,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_prob_magnitud: {
      pageIndex: 1,
      y: 761.3,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_prob_propuesta: {
      pageIndex: 1,
      y: 709.0,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_marco_teorias: {
      pageIndex: 1,
      y: 637.5,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_marco_sustento: {
      pageIndex: 1,
      y: 607.9,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_metod_variables: {
      pageIndex: 1,
      y: 475.0,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_metod_diseno: {
      pageIndex: 1,
      y: 534.2,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },
    g_metod_muestra: {
      pageIndex: 1,
      y: 370.0,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 325, obsEndY: 308
    },

    // Sección 2: Aspectos Éticos (Page 2 & 3)
    // Columns Page 2: Adecuado=380, Insuficiente=506, Inadecuado=506, No se describe=506, No aplica=443
    // Columns Page 3: Adecuado=378, Insuficiente=505, Inadecuado=505, No se describe=505, No aplica=441.5
    // Observation Box: Page 3 (index 2), startY=485, endY=478
    g_etico_aut_consentimiento: {
      pageIndex: 1,
      y: 222.8,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 2, obsStartY: 485, obsEndY: 478
    },
    g_etico_aut_asentimiento: {
      pageIndex: 1,
      y: 208.3,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 2, obsStartY: 485, obsEndY: 478
    },
    g_etico_aut_comprension: {
      pageIndex: 1,
      y: 193.7,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 2, obsStartY: 485, obsEndY: 478
    },
    g_etico_ben_relacion: {
      pageIndex: 1,
      y: 118.9,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 2, obsStartY: 485, obsEndY: 478
    },
    g_etico_ben_metodologia: {
      pageIndex: 1,
      y: 88.8,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 2, obsStartY: 485, obsEndY: 478
    },
    g_etico_just_seleccion: {
      pageIndex: 2,
      y: 753.2,
      columns: { 'Adecuado': 378, 'Insuficiente': 505, 'Inadecuado': 505, 'No se describe': 505, 'No aplica': 441.5 },
      obsPage: 2, obsStartY: 485, obsEndY: 478
    },
    g_etico_vul_identificados: {
      pageIndex: 2,
      y: 663.9,
      columns: { 'Adecuado': 378, 'Insuficiente': 505, 'Inadecuado': 505, 'No se describe': 505, 'No aplica': 441.5 },
      obsPage: 2, obsStartY: 485, obsEndY: 478
    },
    g_etico_vul_garantias: {
      pageIndex: 2,
      y: 634.3,
      columns: { 'Adecuado': 378, 'Insuficiente': 505, 'Inadecuado': 505, 'No se describe': 505, 'No aplica': 441.5 },
      obsPage: 2, obsStartY: 485, obsEndY: 478
    },

    // Sección 3: Aspectos Legales (Page 3 & 4)
    // Columns: Adecuado=273, Insuficiente=333, Inadecuado=397, No se describe=464, No aplica=524
    // Observation Box: Page 4 (index 3), startY=345, endY=295
    g_legal_helsinki: {
      pageIndex: 2,
      y: 363.2,
      columns: { 'Adecuado': 273, 'Insuficiente': 333, 'Inadecuado': 397, 'No se describe': 464, 'No aplica': 524 },
      obsPage: 3, obsStartY: 345, obsEndY: 295
    },
    g_legal_datos: {
      pageIndex: 2,
      y: 276.8,
      columns: { 'Adecuado': 273, 'Insuficiente': 333, 'Inadecuado': 397, 'No se describe': 464, 'No aplica': 524 },
      obsPage: 3, obsStartY: 345, obsEndY: 295
    },

    // Sección 4: Evaluación de la Hoja de Información (Page 4 & 5)
    // Columns: Adecuado=373, Insuficiente=447, Inadecuado=447, No se describe=447, No aplica=518
    // Observation Box: Page 5 (index 4), startY=100, endY=50
    g_hoja_descripcion: {
      pageIndex: 3,
      y: 211.9,
      columns: { 'Adecuado': 373, 'Insuficiente': 447, 'Inadecuado': 447, 'No se describe': 447, 'No aplica': 518 },
      obsPage: 4, obsStartY: 100, obsEndY: 50
    },
    g_hoja_derechos: {
      pageIndex: 4,
      y: 733.5,
      columns: { 'Adecuado': 373, 'Insuficiente': 447, 'Inadecuado': 447, 'No se describe': 447, 'No aplica': 518 },
      obsPage: 4, obsStartY: 100, obsEndY: 50
    }
  }
};

export const COORDINATES_ANEXO_7: PlantillaConfig = {
  administrative: {
    codigo: { pageIndex: 0, x: 180, y: 595 },
    fecha: { pageIndex: 0, x: 400, y: 338 },
    titulo: { pageIndex: 0, x: 180, y: 620 },
    investigador: { pageIndex: 0, x: 180, y: 445 }
  },
  questions: {
    // Sección 1: Aspectos Metodológicos
    // Subsección Justificación (Page 1)
    // Columns: Adecuado=241, Insuficiente=306, Inadecuado=374, No se describe=449, No aplica=519
    // Observation Box: Page 2 (index 1), startY=575, endY=530
    a7_just_uso: {
      pageIndex: 0,
      y: 195.4,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 575, obsEndY: 530
    },
    a7_just_reemplazo: {
      pageIndex: 0,
      y: 145.7,
      columns: { 'Adecuado': 241, 'Insuficiente': 306, 'Inadecuado': 374, 'No se describe': 449, 'No aplica': 519 },
      obsPage: 1, obsStartY: 575, obsEndY: 530
    },

    // Subsección Metodología (Page 3)
    // Columns: Adecuado=273, Insuficiente=333, Inadecuado=397, No se describe=464, No aplica=524
    // Observation Box: Page 3 (index 2), startY=425, endY=365
    a7_metod_aleatorizacion: {
      pageIndex: 2,
      y: 783.1,
      columns: { 'Adecuado': 273, 'Insuficiente': 333, 'Inadecuado': 397, 'No se describe': 464, 'No aplica': 524 },
      obsPage: 2, obsStartY: 425, obsEndY: 365
    },
    a7_metod_modelo: {
      pageIndex: 2,
      y: 706.2,
      columns: { 'Adecuado': 273, 'Insuficiente': 333, 'Inadecuado': 397, 'No se describe': 464, 'No aplica': 524 },
      obsPage: 2, obsStartY: 425, obsEndY: 365
    },
    a7_metod_extrapolacion: {
      pageIndex: 2,
      y: 632.4,
      columns: { 'Adecuado': 273, 'Insuficiente': 333, 'Inadecuado': 397, 'No se describe': 464, 'No aplica': 524 },
      obsPage: 2, obsStartY: 425, obsEndY: 365
    },

    // Sección 2: Aspectos Éticos (Page 3 & 4)
    // Columns: Adecuado=380, Insuficiente=506, Inadecuado=506, No se describe=506, No aplica=443
    // Observation Box: Page 4 (index 3), Box 1 startY=525, endY=495
    a7_etico_adquisicion: {
      pageIndex: 2,
      y: 308.6,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 3, obsStartY: 525, obsEndY: 495
    },
    a7_etico_avance: {
      pageIndex: 2,
      y: 256.8,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 3, obsStartY: 525, obsEndY: 495
    },
    a7_etico_dolor: {
      pageIndex: 2,
      y: 227.3,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 3, obsStartY: 525, obsEndY: 495
    },
    a7_etico_eutanasia: {
      pageIndex: 2,
      y: 61.5,
      columns: { 'Adecuado': 380, 'Insuficiente': 506, 'Inadecuado': 506, 'No se describe': 506, 'No aplica': 443 },
      obsPage: 3, obsStartY: 525, obsEndY: 495
    },

    // Sección 3: Aspectos Legales (Page 4)
    // Columns: Adecuado=273, Insuficiente=333, Inadecuado=397, No se describe=464, No aplica=524
    // Observation Box: Page 4 (index 3), Box 2 startY=90, endY=55
    a7_legal_ley30407: {
      pageIndex: 3,
      y: 348.2,
      columns: { 'Adecuado': 273, 'Insuficiente': 333, 'Inadecuado': 397, 'No se describe': 464, 'No aplica': 524 },
      obsPage: 3, obsStartY: 90, obsEndY: 55
    },
    a7_legal_codigo_veterinario: {
      pageIndex: 3,
      y: 368.5,
      columns: { 'Adecuado': 273, 'Insuficiente': 333, 'Inadecuado': 397, 'No se describe': 464, 'No aplica': 524 },
      obsPage: 3, obsStartY: 90, obsEndY: 55
    },

    // Sección 4: Presupuesto y Seguimiento (Page 5)
    // Columns: Adecuado=278, Insuficiente=339, Inadecuado=404, No se describe=474, No aplica=542
    // Observation Box: Page 5 (index 4), startY=390, endY=50
    a7_presup_gastos: {
      pageIndex: 4,
      y: 731.6,
      columns: { 'Adecuado': 278, 'Insuficiente': 339, 'Inadecuado': 404, 'No se describe': 474, 'No aplica': 542 },
      obsPage: 4, obsStartY: 390, obsEndY: 50
    },
    a7_presup_seguimiento: {
      pageIndex: 4,
      y: 633.6,
      columns: { 'Adecuado': 278, 'Insuficiente': 339, 'Inadecuado': 404, 'No se describe': 474, 'No aplica': 542 },
      obsPage: 4, obsStartY: 390, obsEndY: 50
    }
  }
};

export const getCoordinatesByTipo = (tipo: 'G' | '7' | string): PlantillaConfig => {
  return tipo === '7' || tipo === 'animales' ? COORDINATES_ANEXO_7 : COORDINATES_ANEXO_G;
};
