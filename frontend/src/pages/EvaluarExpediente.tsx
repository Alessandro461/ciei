import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChecklistEvaluacion from '../components/ChecklistEvaluacion';

// Detecta automáticamente la URL del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Interfaz para el tipado de TypeScript
interface Documento {
  id: number;
  tipo_anexo: string;
  nombre_archivo_original: string;
  fecha_subida: string;
  version?: number;
  anexo_clave?: string;
}

export default function EvaluarExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ==========================================
  // ESTADOS DEL SISTEMA
  // ==========================================
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [datosProyecto, setDatosProyecto] = useState<any>(null); 
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tabArchivos, setTabArchivos] = useState<'clasificados' | 'historial'>('clasificados');

  const [miRolAsignacion, setMiRolAsignacion] = useState<string | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<any[]>([]);

  // Estados del Visor Principal (Columna Derecha)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('');

  // Estados del Formulario de Dictamen Avanzado
  const [dictamen, setDictamen] = useState({
    estadoElegido: '',
    comentariosGenerales: ''
  });

  const [checklistDataPayload, setChecklistDataPayload] = useState<any>(null);

  const SLOTS_INFORMACION: { [key: string]: string } = {
    proyecto: 'Protocolo de Investigación (Anexo A / Anexo 1)',
    consentimiento: 'Consentimiento Informado / Asentimiento (Anexo C / Anexo 4)',
    instrumento: 'Instrumentos de Recolección (Anexo D)',
    anexo_e: 'Ficha Técnica / Validez (Anexo E)',
    anexo_f: 'Declaración de Compromiso (Anexo F)',
    anexo_g: 'Protocolo de Muestras Biológicas (Anexo G)',
    anexo_2: 'Protocolo de Uso de Animales (Anexo 2)',
    anexo_3: 'Declaración de Compromiso (Anexo 3)',
    anexo_5: 'Certificados de Capacitación (Anexo 5)',
    anexo_6: 'Ficha Técnica de Sustancias (Anexo 6)',
    voucher: 'Comprobante / Voucher de Pago',
    otros: 'Documentación de Soporte Adicional'
  };

  const agruparDocumentosPorSlot = () => {
    const grupos: { [key: string]: Documento[] } = {};
    documentos.forEach(doc => {
      const clave = doc.anexo_clave || 'otros';
      if (!grupos[clave]) {
        grupos[clave] = [];
      }
      grupos[clave].push(doc);
    });
    // Ordenar por versión descendente
    Object.keys(grupos).forEach(clave => {
      grupos[clave].sort((a, b) => (b.version || 0) - (a.version || 0));
    });
    return grupos;
  };

  // ==========================================
  // EFECTO DE CARGA INICIAL
  // ==========================================
  useEffect(() => {
    const cargarDatosYAnexos = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Cargar el historial de documentos
        const resDocs = await axios.get(`${API_URL}/api/documentos/solicitud/${id}`, { headers });
        setDocumentos(resDocs.data.documentos || []);

        // 2. Cargar los datos de la ficha técnica del proyecto
        try {
          const resDatos = await axios.get(`${API_URL}/api/solicitudes/${id}`, { headers });
          const data = resDatos.data;
          setDatosProyecto(data.solicitud || data || null);
          setMiRolAsignacion(data.miRolAsignacion || null);
          setRecomendaciones(data.recomendaciones || []);
        } catch (error) {
          console.warn("No se pudo cargar los detalles del proyecto.");
        }

      } catch (error) {
        console.error('Error al cargar la información del expediente', error);
      }
    };
    cargarDatosYAnexos();
  }, [id]);

  // ==========================================
  // FUNCIONES PRINCIPALES
  // ==========================================

  // Procesar y enviar el formulario de evaluación (Recomendación Técnica o Veredicto Consolidado)
  const procesarDictamen = async () => {
    if (!dictamen.estadoElegido) {
      setMensaje("⚠️ Debe seleccionar un resultado de evaluación (Aprobado, Observado o Rechazado).");
      return;
    }

    const confirmMsg = miRolAsignacion === 'principal'
      ? `¿Está seguro de enviar el veredicto consolidado de este comité como ${dictamen.estadoElegido.toUpperCase()}?`
      : `¿Está seguro de enviar su recomendación técnica individual como ${dictamen.estadoElegido.toUpperCase()}?`;

    if (window.confirm(confirmMsg)) {
      setCargando(true);
      setMensaje('');

      const tipoAnexo = datosProyecto?.tipo_investigacion === 'animales' ? '7' : 'G';

      // Compilar el texto final dependiendo de lo que el revisor llenó
      let comentarioFinal = dictamen.comentariosGenerales || '';
      
      comentarioFinal += `\n\n--- EVALUACIÓN DETALLADA (ANEXO ${tipoAnexo === '7' ? '7' : 'G'}) ---\n`;
      if (checklistDataPayload && Array.isArray(checklistDataPayload.respuestas_json)) {
        checklistDataPayload.respuestas_json.forEach((resp: any) => {
          const just = resp.justificacion_texto || '';
          if (just.trim() !== '') {
            comentarioFinal += `• [${resp.valoracion.toUpperCase()}] ${resp.texto}: ${just}\n`;
          }
        });
      }

      const checklistData = {
        tipo_anexo: tipoAnexo,
        respuestas_json: checklistDataPayload?.respuestas_json || []
      };

      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/solicitudes/${id}/recomendar`, 
          { 
            resultado: dictamen.estadoElegido, 
            comentarios: comentarioFinal,
            checklist: checklistData
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert(miRolAsignacion === 'principal' 
          ? 'Veredicto consolidado registrado y enviado al Presidente exitosamente.'
          : 'Recomendación técnica individual registrada exitosamente.'
        );
        navigate('/comite'); // Regresamos a la bandeja principal del revisor
      } catch (error) {
        setMensaje('❌ Error al procesar la recomendación en el servidor.');
      } finally {
        setCargando(false);
      }
    }
  };

  // Descargar el documento original al PC del Revisor
  const manejarDescarga = async (documentoId: number, nombreOriginal: string) => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await axios.get(`${API_URL}/api/documentos/descargar/${documentoId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', 
      });

      const url = window.URL.createObjectURL(new Blob([respuesta.data]));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.setAttribute('download', nombreOriginal);
      document.body.appendChild(enlace);
      enlace.click();
      
      enlace.parentNode?.removeChild(enlace);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Hubo un problema al intentar descargar el archivo.');
    }
  };

  // Previsualizar el PDF en el iFrame de la derecha
  const manejarPrevisualizacion = async (documentoId: number, nombreOriginal: string) => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await axios.get(`${API_URL}/api/documentos/descargar/${documentoId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', 
      });

      const extension = nombreOriginal.split('.').pop()?.toLowerCase() || '';
      const esPDF = extension === 'pdf';
      
      const blob = new Blob([respuesta.data], { 
        type: esPDF ? 'application/pdf' : (respuesta.headers['content-type'] as string || 'application/msword') 
      });
      const url = window.URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setPreviewName(nombreOriginal);
      setPreviewType(extension);
      
    } catch (error) {
      alert('Error al intentar abrir el visor.');
    }
  };

  // Formato elegante para la fecha de subida
  const formatearFecha = (fechaISO: string) => {
    if (!fechaISO) return 'Fecha desconocida';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // Ordenar documentos: El más nuevo SIEMPRE se pinta arriba de la lista
  const documentosOrdenados = [...documentos].sort((a, b) => 
    new Date(b.fecha_subida).getTime() - new Date(a.fecha_subida).getTime()
  );

  // Alerta de subsanación: si hay más de 1 documento, significa que subieron una versión 2
  const esSubsanacion = documentosOrdenados.length > 1;

  // ==========================================
  // RENDERIZADO VISUAL (UI)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      
      {/* NAVEGACIÓN SUPERIOR */}
      <nav className="bg-slate-900 text-white p-4 border-b-4 border-blue-500 shadow-md">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/comite')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
              ← Volver a la Bandeja
            </button>
            <span className="font-bold text-lg">Evaluación Técnica | Expediente #{id}</span>
          </div>
          {esSubsanacion && (
            <span className="bg-teal-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.5)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Revisando Subsanación
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* ========================================================= */}
        {/* COLUMNA IZQUIERDA: Panel de Revisión, Archivos y Formularios */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[480px] flex flex-col gap-5 lg:h-[calc(100vh-120px)] lg:min-h-[750px] overflow-y-auto pr-2 pb-4">
          
          {mensaje && <div className="bg-red-100 text-red-700 p-4 rounded-xl font-bold shrink-0 shadow-sm border border-red-200">{mensaje}</div>}

          {/* TARJETA 1: Ficha Técnica del Proyecto */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              📋 Datos del Proyecto
            </h2>
            
            {datosProyecto ? (
              <div className="space-y-4 text-sm">
                {/* Alertas de Manual de Procedimientos para el Revisor */}
                {(datosProyecto.usa_muestras_biologicas || datosProyecto.involucra_grupos_vulnerables || datosProyecto.es_invasivo) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                    <strong className="block text-[10px] font-black uppercase tracking-wider text-amber-900">⚠️ CONSTRICCIÓN DE NORMATIVA</strong>
                    <p className="font-medium text-[11px] leading-tight">
                      Este proyecto exige evaluación completa en Sesión Ordinaria según el Manual del CIEI por involucrar:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 font-bold text-[10px]">
                      {datosProyecto.usa_muestras_biologicas && (
                        <li>Muestras biológicas ({datosProyecto.tipo_muestras_biologicas})</li>
                      )}
                      {datosProyecto.involucra_grupos_vulnerables && (
                        <li>Grupos vulnerables: {datosProyecto.descripcion_vulnerabilidad}</li>
                      )}
                      {datosProyecto.es_invasivo && (
                        <li>Estudio invasivo en seres humanos</li>
                      )}
                    </ul>
                  </div>
                )}

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Título de la Investigación</span>
                  <p className="font-bold text-slate-800 leading-snug">{datosProyecto.titulo_proyecto || datosProyecto.titulo || 'No especificado'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facultad</span>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{datosProyecto.facultad || '---'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escuela Prof.</span>
                    <p className="font-semibold text-slate-700 text-xs mt-0.5">{datosProyecto.escuela_profesional || '---'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo</span>
                    <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-1 rounded uppercase tracking-wider">
                      {datosProyecto.tipo_investigacion?.replace('_', ' ') || 'Estándar'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duración</span>
                    <p className="font-semibold text-slate-700">{datosProyecto.duracion_proyectada || datosProyecto.duracion || '---'}</p>
                  </div>
                </div>

                {(datosProyecto.resumen || datosProyecto.objetivos) && (
                  <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
                    {datosProyecto.resumen && (
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resumen Científico</span>
                        <div className="text-xs text-slate-600 max-h-24 overflow-y-auto pr-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {datosProyecto.resumen}
                        </div>
                      </div>
                    )}
                    {datosProyecto.objetivos && (
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Objetivos</span>
                        <div className="text-xs text-slate-600 max-h-24 overflow-y-auto pr-1 whitespace-pre-wrap bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {datosProyecto.objetivos}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase animate-pulse">Cargando información técnica...</p>
              </div>
            )}
          </div>

          {/* TARJETA 2: Visor de Archivos por Anexo o Historial */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
              🗂️ Documentos Adjuntos
            </h2>

            {/* Selector de Pestañas de Archivos */}
            <div className="flex border-b border-slate-200 mb-4">
              <button 
                onClick={() => setTabArchivos('clasificados')} 
                className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 text-center transition-colors ${tabArchivos === 'clasificados' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                🗂️ Por Anexo
              </button>
              <button 
                onClick={() => setTabArchivos('historial')} 
                className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 text-center transition-colors ${tabArchivos === 'historial' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                🕒 Historial
              </button>
            </div>
            
            {tabArchivos === 'clasificados' ? (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-2">
                {(() => {
                  if (!datosProyecto) return <p className="text-xs text-slate-400 italic text-center">Cargando requisitos...</p>;
                  const esHumanos = datosProyecto.tipo_investigacion === 'humanos';
                  const anexos = [];
                  if (esHumanos) {
                    anexos.push({ clave: 'proyecto', label: 'Anexo A: Formato básico de protocolo' });
                    anexos.push({ clave: 'consentimiento', label: 'Anexo C: Formato de Consentimiento Informado' });
                    anexos.push({ clave: 'instrumento', label: 'Anexo D: Instrumentos de recolección de datos' });
                    anexos.push({ clave: 'anexo_e', label: 'Anexo E: Ficha técnica o validez' });
                    anexos.push({ clave: 'anexo_f', label: 'Anexo F: Declaración de compromiso' });
                    if (datosProyecto.usa_muestras_biologicas) {
                      anexos.push({ clave: 'anexo_g', label: 'Anexo G: Protocolo de muestras biológicas' });
                    }
                  } else {
                    anexos.push({ clave: 'proyecto', label: 'Anexo 1: Solicitud de evaluación' });
                    anexos.push({ clave: 'anexo_2', label: 'Anexo 2: Protocolo de uso de animales' });
                    anexos.push({ clave: 'anexo_3', label: 'Anexo 3: Declaración de compromiso' });
                    anexos.push({ clave: 'consentimiento', label: 'Anexo 4: Consentimiento del propietario (si aplica)' });
                    anexos.push({ clave: 'anexo_5', label: 'Anexo 5: Certificados de capacitación' });
                    anexos.push({ clave: 'anexo_6', label: 'Anexo 6: Ficha técnica de sustancias' });
                  }
                  
                  if (!datosProyecto.exonerado_pago) {
                    anexos.push({ clave: 'voucher', label: 'Voucher de Pago: Derechos de trámite' });
                  }

                  return anexos.map((anexo) => {
                    const docsSubidos = documentos.filter(d => (d as any).anexo_clave === anexo.clave);
                    const tieneDoc = docsSubidos.length > 0;
                    const docReciente = tieneDoc ? docsSubidos[0] : null;

                    return (
                      <div key={anexo.clave} className={`p-3 rounded-xl border transition-all ${tieneDoc ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Espacio oficial</span>
                            <h4 className="font-bold text-slate-800 text-xs leading-snug truncate" title={anexo.label}>{anexo.label}</h4>
                          </div>
                          {tieneDoc ? (
                            <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">Subido</span>
                          ) : (
                            <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-100 px-2 py-0.5 rounded shrink-0">Pendiente</span>
                          )}
                        </div>

                        {tieneDoc && docReciente ? (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-blue-900 bg-blue-50/50 p-1.5 rounded border border-blue-100 truncate" title={docReciente.nombre_archivo_original}>
                              📄 {docReciente.nombre_archivo_original}
                            </p>
                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                              <span>Versión: V{docReciente.version || docsSubidos.length}</span>
                              <span>{formatearFecha(docReciente.fecha_subida)}</span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => manejarPrevisualizacion(docReciente.id, docReciente.nombre_archivo_original)} className="flex-1 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-2 py-1 rounded-lg transition-all flex items-center justify-center gap-1">
                                👁️ Visor
                              </button>
                              <button onClick={() => manejarDescarga(docReciente.id, docReciente.nombre_archivo_original)} className="flex-1 text-[10px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-lg transition-all flex items-center justify-center gap-1">
                                ⬇️ Descargar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-medium italic">Aún no se ha subido ningún archivo en este espacio.</p>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2">
                {(() => {
                  const grupos = agruparDocumentosPorSlot();
                  const slotsConDocs = Object.keys(grupos).filter(k => grupos[k].length > 0);

                  if (slotsConDocs.length === 0) {
                    return <p className="text-xs text-slate-400 italic text-center py-6">Sin archivos registrados.</p>;
                  }

                  return slotsConDocs.map((clave) => {
                    const docsGrupo = grupos[clave];
                    const nombreSlot = SLOTS_INFORMACION[clave] || `Documento (${clave})`;

                    return (
                      <div key={clave} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="border-b border-slate-200 pb-1.5">
                          <span className="block text-[8px] font-bold text-blue-600 uppercase tracking-wider">Ranura</span>
                          <h4 className="font-bold text-slate-800 text-xs leading-snug truncate" title={nombreSlot}>{nombreSlot}</h4>
                        </div>
                        <div className="space-y-2">
                          {docsGrupo.map((doc, idx) => {
                            const esElMasNuevo = idx === 0;
                            const versionNum = doc.version || (docsGrupo.length - idx);

                            return (
                              <div key={doc.id} className={`p-2.5 rounded-lg border text-xs flex flex-col gap-2 transition-all ${esElMasNuevo ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-100/50 border-slate-200 text-slate-500'}`}>
                                <div className="flex justify-between items-start gap-1">
                                  <div className="min-w-0 flex-1">
                                    <p className={`font-bold truncate ${esElMasNuevo ? 'text-slate-800' : 'text-slate-500'}`} title={doc.nombre_archivo_original}>
                                      📄 {doc.nombre_archivo_original}
                                    </p>
                                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                                      {formatearFecha(doc.fecha_subida)}
                                    </span>
                                  </div>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${esElMasNuevo ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                    V{versionNum} {esElMasNuevo ? 'Reciente' : ''}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => manejarPrevisualizacion(doc.id, doc.nombre_archivo_original)} className="flex-1 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 py-1 rounded-md transition-all flex items-center justify-center gap-0.5">
                                    👁️ Visor V{versionNum}
                                  </button>
                                  <button onClick={() => manejarDescarga(doc.id, doc.nombre_archivo_original)} className="flex-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 py-1 rounded-md transition-all flex items-center justify-center gap-0.5">
                                    ⬇️ Bajar V{versionNum}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* TARJETA 3: Formulario de Dictamen Avanzado */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-200 shrink-0">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">⚖️ Emisión de Dictamen</h2>
            
            {/* Sección de Evaluaciones de Revisores Secundarios (Solo para Revisor Principal) */}
            {miRolAsignacion === 'principal' && recomendaciones.filter(r => r.revisor_rol_asignacion === 'secundario').length > 0 && (
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4 mb-5">
                <h3 className="text-xs font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                  👥 Recomendaciones de Revisores Secundarios
                </h3>
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {recomendaciones
                    .filter(r => r.revisor_rol_asignacion === 'secundario')
                    .map((rec) => (
                      <div key={rec.id} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/50 text-xs space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200">{rec.revisor_nombres} {rec.revisor_apellidos}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            rec.resultado === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            rec.resultado === 'observado' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {rec.resultado}
                          </span>
                        </div>

                        {rec.comentarios && (
                          <p className="bg-slate-900/60 p-2 rounded border border-slate-700/60 text-slate-300 italic">
                            "{rec.comentarios.split('--- EVALUACIÓN DETALLADA')[0].trim()}"
                          </p>
                        )}

                        <div className="space-y-1.5 bg-slate-900/30 p-3 rounded-xl border border-slate-700/20 text-[10px] text-slate-400">
                          {rec.checklist_respuestas ? (
                            (() => {
                              const resps = Array.isArray(rec.checklist_respuestas) 
                                ? rec.checklist_respuestas 
                                : (typeof rec.checklist_respuestas === 'object' && rec.checklist_respuestas !== null 
                                    ? Object.keys(rec.checklist_respuestas).map(k => ({ id: k, ...rec.checklist_respuestas[k] })) 
                                    : []);
                              
                              return resps.length > 0 ? (
                                resps.map((resp: any, rIdx: number) => {
                                  const textToShow = resp.texto || resp.id;
                                  const calif = resp.valoracion || resp.calif || 'No aplica';
                                  const just = resp.justificacion_texto || resp.just || '';
                                  
                                  return (
                                    <div key={rIdx} className="border-b border-slate-800/60 pb-1 last:border-0 last:pb-0">
                                      <span className="font-bold text-slate-300">• {textToShow}: </span>
                                      <span className={`font-bold ${calif === 'Adecuado' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        [{calif}]
                                      </span>
                                      {just && <span className="italic text-slate-400 block pl-3">↳ "{just}"</span>}
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="italic">No se registraron respuestas detalladas en el checklist.</span>
                              );
                            })()
                          ) : (
                            <>
                              {rec.aspecto_metodologico_calif && (
                                <div>
                                  <span className="font-bold">1. Metodológico:</span>
                                  <span className={`ml-1 font-bold ${rec.aspecto_metodologico_calif === 'Adecuado' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    [{rec.aspecto_metodologico_calif}]
                                  </span>
                                  {rec.aspecto_metodologico_just && <span className="italic"> - {rec.aspecto_metodologico_just}</span>}
                                </div>
                              )}
                              {rec.aspecto_etico_calif && (
                                <div>
                                  <span className="font-bold">2. Ético:</span>
                                  <span className={`ml-1 font-bold ${rec.aspecto_etico_calif === 'Adecuado' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    [{rec.aspecto_etico_calif}]
                                  </span>
                                  {rec.aspecto_etico_just && <span className="italic"> - {rec.aspecto_etico_just}</span>}
                                </div>
                              )}
                              {rec.aspecto_legal_calif && (
                                <div>
                                  <span className="font-bold">3. Legal:</span>
                                  <span className={`ml-1 font-bold ${rec.aspecto_legal_calif === 'Adecuado' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    [{rec.aspecto_legal_calif}]
                                  </span>
                                  {rec.aspecto_legal_just && <span className="italic"> - {rec.aspecto_legal_just}</span>}
                                </div>
                              )}
                              {rec.aspecto_presupuestal_calif && (
                                <div>
                                  <span className="font-bold">4. Presupuestal:</span>
                                  <span className={`ml-1 font-bold ${rec.aspecto_presupuestal_calif === 'Adecuado' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    [{rec.aspecto_presupuestal_calif}]
                                  </span>
                                  {rec.aspecto_presupuestal_just && <span className="italic"> - {rec.aspecto_presupuestal_just}</span>}
                                </div>
                              )}
                              {rec.hoja_informacion_calif && (
                                <div>
                                  <span className="font-bold">5. Consentimiento:</span>
                                  <span className={`ml-1 font-bold ${rec.hoja_informacion_calif === 'Adecuado' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    [{rec.hoja_informacion_calif}]
                                  </span>
                                  {rec.hoja_informacion_just && <span className="italic"> - {rec.hoja_informacion_just}</span>}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              
              {/* Selector de Resultado */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  {miRolAsignacion === 'principal' ? 'Veredicto Final Consolidado (Comité)' : 'Resultado de su Recomendación'}
                </label>
                <select 
                  value={dictamen.estadoElegido}
                  onChange={(e) => setDictamen({...dictamen, estadoElegido: e.target.value})}
                  className="w-full px-3 py-3 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:border-blue-500 bg-slate-50 cursor-pointer transition-colors"
                >
                  <option value="" disabled>
                    {miRolAsignacion === 'principal' ? '-- Elija el veredicto consolidado final --' : '-- Elija su recomendación --'}
                  </option>
                  <option value="aprobado">🟢 APROBADO (Cumple los requisitos éticos)</option>
                  <option value="observado">🟠 OBSERVADO (Tiene observaciones a subsanar)</option>
                  <option value="rechazado">🔴 RECHAZADO (No cumple requisitos éticos)</option>
                </select>
              </div>

              {/* Comentarios Generales */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">
                    {miRolAsignacion === 'principal' ? 'Síntesis y Observaciones Consolidadas' : 'Comentarios Generales / Justificación'}
                  </label>
                  {miRolAsignacion === 'principal' && recomendaciones.filter(r => r.revisor_rol_asignacion === 'secundario').length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const textos = recomendaciones
                          .filter(r => r.revisor_rol_asignacion === 'secundario')
                          .map(r => {
                            let txt = `Revisor Secundario (${r.revisor_nombres} ${r.revisor_apellidos}):\n`;
                            if (r.comentarios) {
                              const mainComment = r.comentarios.split('--- EVALUACIÓN DETALLADA')[0].trim();
                              txt += `- Comentarios: ${mainComment}\n`;
                            }
                            
                            const obsList: string[] = [];
                            if (r.checklist_respuestas) {
                              const resps = Array.isArray(r.checklist_respuestas) 
                                ? r.checklist_respuestas 
                                : (typeof r.checklist_respuestas === 'object' && r.checklist_respuestas !== null 
                                    ? Object.keys(r.checklist_respuestas).map(k => ({ id: k, ...r.checklist_respuestas[k] })) 
                                    : []);
                              resps.forEach((resp: any) => {
                                const just = resp.justificacion_texto || resp.just || '';
                                const textToShow = resp.texto || resp.id;
                                if (just && just.trim() !== '') {
                                    obsList.push(`${textToShow}: ${just}`);
                                }
                              });
                            } else {
                              if (r.aspecto_metodologico_just) obsList.push(`Aspecto Metodológico: ${r.aspecto_metodologico_just}`);
                              if (r.aspecto_etico_just) obsList.push(`Aspecto Ético: ${r.aspecto_etico_just}`);
                              if (r.aspecto_legal_just) obsList.push(`Aspecto Legal: ${r.aspecto_legal_just}`);
                              if (r.aspecto_presupuestal_just) obsList.push(`Aspecto Presupuestal: ${r.aspecto_presupuestal_just}`);
                              if (r.hoja_informacion_just) obsList.push(`Hoja de Información: ${r.hoja_informacion_just}`);
                            }
                            
                            if (obsList.length > 0) {
                              txt += `- Observaciones detalladas:\n  * ` + obsList.join('\n  * ') + `\n`;
                            }
                            return txt;
                          })
                          .join('\n');
                        
                        setDictamen(prev => ({
                          ...prev,
                          comentariosGenerales: (prev.comentariosGenerales ? prev.comentariosGenerales + '\n\n' : '') + textos
                        }));
                      }}
                      className="text-[10px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      🪄 Auto-consolidar Observaciones
                    </button>
                  )}
                </div>
                <textarea
                  rows={4} 
                  value={dictamen.comentariosGenerales} 
                  onChange={(e) => setDictamen({...dictamen, comentariosGenerales: e.target.value})}
                  placeholder="Redacte una síntesis o conclusión de su evaluación..."
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-medium"
                />
              </div>

              {/* CHECKLIST ESTRUCTURADA DINÁMICA DE EVALUACIÓN (Anexo G/7) */}
              <ChecklistEvaluacion
                tipoAnexo={datosProyecto?.tipo_investigacion === 'animales' ? '7' : 'G'}
                onChange={(data) => setChecklistDataPayload(data)}
              />
              </div>

            <button 
              disabled={cargando || !dictamen.estadoElegido} 
              onClick={procesarDictamen} 
              className={`w-full mt-6 py-4 rounded-xl font-black text-sm transition-all shadow-lg text-white flex items-center justify-center gap-2 ${
                cargando || !dictamen.estadoElegido ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' :
                dictamen.estadoElegido === 'aprobado' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' :
                dictamen.estadoElegido === 'observado' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' :
                'bg-red-600 hover:bg-red-700 shadow-red-600/30'
              }`}
            >
              {cargando ? 'Procesando en el servidor...' : 
                miRolAsignacion === 'principal' 
                  ? 'Registrar y Notificar Veredicto Consolidado' 
                  : 'Enviar Recomendación Técnica Individual'
              }
            </button>
          </div>

        </div>

        {/* ========================================================= */}
        {/* COLUMNA DERECHA: Visor Interactivo (iFrame) */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[calc(100%-480px)] bg-slate-300 rounded-2xl shadow-inner border border-slate-300 overflow-hidden flex flex-col h-[650px] lg:h-[calc(100vh-120px)] lg:min-h-[750px] relative">
          {previewUrl ? (
            <>
              <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 truncate pr-4">
                  <span className="bg-blue-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Visor Activo</span>
                  <span className="font-bold text-sm truncate">{previewName}</span>
                </div>
                <button onClick={() => { setPreviewUrl(null); setPreviewName(''); }} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 shadow-sm">
                  Cerrar Visor
                </button>
              </div>
              
              <div className="flex-1 w-full bg-[#525659] relative">
                {previewType === 'pdf' ? (
                  <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none" title="Visor PDF" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                    <span className="text-6xl mb-4">📝</span>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Archivo de Microsoft Word</h3>
                    <p className="text-slate-600 font-medium max-w-md mb-6">
                      El navegador web no puede abrir documentos Word de forma segura. Descargue el archivo para revisarlo localmente.
                    </p>
                    <button 
                      onClick={() => manejarDescarga(documentos.find(d => d.nombre_archivo_original === previewName)?.id || 0, previewName)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4"/></svg>
                      Descargar archivo .DOCX
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-200/50">
              <svg className="w-24 h-24 mb-4 opacity-40 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <p className="font-bold text-xl text-slate-500">Mesa de Auditoría</p>
              <p className="text-sm mt-2 text-slate-500 max-w-sm text-center">Seleccione el botón <span className="bg-white border px-2 py-0.5 rounded text-[10px] font-bold mx-1">👁️ Abrir en Visor</span> en cualquier archivo del historial para inspeccionar el documento aquí.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}