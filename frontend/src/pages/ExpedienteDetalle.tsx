import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

interface Expediente {
  id: number;
  numero_expediente: string;
  titulo_proyecto: string;
  tipo_investigacion: string;
  facultad: string;
  escuela_profesional: string;
  estado_actual: string;
  comentarios_comite?: string;
  nombre_archivo?: string;
  updated_at: string;
  usa_muestras_biologicas?: boolean;
  exonerado_pago?: boolean;
  origen_fondos?: string;
  tipo_muestras_biologicas?: string;
  involucra_grupos_vulnerables?: boolean;
  descripcion_vulnerabilidad?: string;
  es_invasivo?: boolean;
  categoria_riesgo?: string;
  investigador_correo?: string;
  investigador_nombres?: string;
  investigador_apellidos?: string;
}

interface DocumentoHistorial {
  id: number;
  tipo_anexo: string;
  nombre_archivo_original: string;
  fecha_subida: string;
  version?: number;
  anexo_clave?: string;
}

// Interfaz para controlar el Modal Post-Aprobación
interface ModalPostAprobacion {
  visible: boolean;
  tipo_documento: string;
  titulo: string;
  descripcion: string;
  colorTema: string;
}

export default function ExpedienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [historial, setHistorial] = useState<DocumentoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const puedeEditar = expediente?.estado_actual === 'borrador' || expediente?.estado_actual === 'observado';
  const estaAprobado = expediente?.estado_actual === 'aprobado';

  // Toast notifications state
  interface Toast {
    id: number;
    mensaje: string;
    tipo: 'success' | 'error' | 'warning' | 'info';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = (mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const toastId = Date.now() + Math.random();
    setToasts(prev => [...prev, { id: toastId, mensaje, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 5000);
  };

  // Keyword dictionary for document slots
  const KEYWORD_MAP: { [clave: string]: string[] } = {
    carta_presentacion: ['carta de presentacion', 'carta de presentación', 'presentacion', 'presentación'],
    proyecto: ['anexo a', 'formato basico', 'formato básico'],
    proyecto_principal: ['proyecto de investigacion', 'proyecto de investigación', 'protocolo', 'version digital', 'versión digital'],
    consentimiento: ['anexo c', 'consentimiento', 'asentimiento', 'informado'],
    cv_actualizado: ['cv', 'curriculum', 'currículo', 'hoja de vida'],
    aval_institucional: ['anexo d', 'aval', 'declaracion del investigador', 'declaración del investigador'],
    anexo_e: ['anexo e', 'procedimientos eticos', 'procedimientos éticos'],
    anexo_f: ['anexo f', 'detalles financieros', 'conflictos de interes', 'conflictos de interés'],
    manual_procedimientos_biologicos: ['manual del investigador', 'procedimientos biologicos', 'procedimientos biológicos'],
    poliza_seguro: ['poliza', 'póliza', 'seguro'],
    certificado_gcp: ['gcp', 'buenas practicas', 'buenas prácticas', 'clinicas', 'clínicas'],
    anexo_1: ['anexo 1', 'solicitud de evaluacion', 'solicitud de evaluación'],
    anexo_2: ['anexo 2', 'uso de animales', 'animales de experimentacion', 'animales de experimentación'],
    anexo_3: ['anexo 3', 'declaracion de compromiso', 'declaración de compromiso'],
    anexo_5: ['anexo 5', 'capacitacion', 'capacitación'],
    anexo_6: ['anexo 6', 'sustancias'],
    voucher: ['voucher', 'comprobante', 'pago', 'derechos de tramite', 'derechos de trámite']
  };

  // Drag & drop state
  const [draggedOverSlot, setDraggedOverSlot] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, slotClave: string) => {
    if (!puedeEditar) return;
    e.preventDefault();
    setDraggedOverSlot(slotClave);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!puedeEditar) return;
    e.preventDefault();
    setDraggedOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, slotClave: string, mappedEnum: string) => {
    if (!puedeEditar) return;
    e.preventDefault();
    setDraggedOverSlot(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await manejarSubidaAnexo(slotClave, mappedEnum, file);
    }
  };

  // Highlighting matching slots
  const obtenerSlotsObservados = () => {
    if (!expediente || expediente.estado_actual !== 'observado' || !expediente.comentarios_comite) {
      return new Set<string>();
    }
    const comentariosLower = expediente.comentarios_comite.toLowerCase();
    const slotsObservados = new Set<string>();

    Object.keys(KEYWORD_MAP).forEach(clave => {
      const keywords = KEYWORD_MAP[clave];
      const matches = keywords.some(keyword => comentariosLower.includes(keyword));
      if (matches) {
        slotsObservados.add(clave);
      }
    });

    return slotsObservados;
  };

  const slotsObservados = obtenerSlotsObservados();

  // Definición dinámica de los anexos requeridos según las reglas bioéticas del CIEI
  const obtenerAnexosRequeridos = () => {
    if (!expediente) return [];
    const esHumanos = expediente.tipo_investigacion === 'humanos';
    const anexos = [];
    
    if (esHumanos) {
      anexos.push({ clave: 'carta_presentacion', label: '1. Carta de Presentación del Proyecto dirigida al Presidente del CIEI', obligatorio: true, mappedEnum: 'proyecto' });
      anexos.push({ clave: 'proyecto', label: '2. Formato Básico para la Aprobación de Investigaciones (Anexo A)', obligatorio: true, mappedEnum: 'proyecto' });
      anexos.push({ clave: 'proyecto_principal', label: '3. Proyecto de Investigación en versión digital (con fecha y versión en cada página)', obligatorio: true, mappedEnum: 'proyecto' });
      anexos.push({ clave: 'consentimiento', label: '4. Documento de Consentimiento y/o Asentimiento Informado (Anexo C)', obligatorio: true, mappedEnum: 'consentimiento' });
      anexos.push({ clave: 'cv_actualizado', label: '5. Currículo Vitae (CV) actualizado del Investigador Principal y equipo', obligatorio: true, mappedEnum: 'subsanacion' });
      anexos.push({ clave: 'aval_institucional', label: '6. Declaración del Investigador Principal y aval institucional (Anexos D / D-1 / D-2 / D-3)', obligatorio: true, mappedEnum: 'proyecto' });
      anexos.push({ clave: 'anexo_e', label: '7. Declaración Jurada de Procedimientos Éticos (Anexo E)', obligatorio: true, mappedEnum: 'subsanacion' });
      anexos.push({ clave: 'anexo_f', label: '8. Declaración Jurada de Detalles Financieros y Conflictos de Interés (Anexo F)', obligatorio: true, mappedEnum: 'subsanacion' });
      if (expediente.usa_muestras_biologicas) {
        anexos.push({ clave: 'manual_procedimientos_biologicos', label: '9a. Manual del Investigador para Procedimientos Biológicos (Muestras)', obligatorio: true, mappedEnum: 'instrumento' });
        anexos.push({ clave: 'poliza_seguro', label: '9b. Póliza de Seguro del Patrocinador (Muestras)', obligatorio: true, mappedEnum: 'instrumento' });
        anexos.push({ clave: 'certificado_gcp', label: '9c. Certificado de Buenas Prácticas Clínicas (GCP) y Ética (Muestras)', obligatorio: true, mappedEnum: 'instrumento' });
      }
    } else {
      anexos.push({ clave: 'proyecto', label: 'Anexo 1: Solicitud de evaluación de protocolos', obligatorio: true, mappedEnum: 'proyecto' });
      anexos.push({ clave: 'anexo_2', label: 'Anexo 2: Protocolo de uso de animales de experimentación', obligatorio: true, mappedEnum: 'proyecto' });
      anexos.push({ clave: 'anexo_3', label: 'Anexo 3: Declaración de compromiso del investigador', obligatorio: true, mappedEnum: 'subsanacion' });
      anexos.push({ clave: 'consentimiento', label: 'Anexo 4: Consentimiento del propietario del animal (si aplica)', obligatorio: false, mappedEnum: 'consentimiento' });
      anexos.push({ clave: 'anexo_5', label: 'Anexo 5: Certificados de capacitación del personal', obligatorio: true, mappedEnum: 'instrumento' });
      anexos.push({ clave: 'anexo_6', label: 'Anexo 6: Ficha técnica de sustancias u otros', obligatorio: true, mappedEnum: 'instrumento' });
    }

    
    return anexos;
  };

  const manejarSubidaAnexo = async (clave: string, mappedEnum: string, file: File) => {
    if (!validarArchivo(file)) return;
    setSubiendo(true);
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('solicitudId', id || '');
    formData.append('tipo_anexo', mappedEnum);
    formData.append('anexo_clave', clave);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/documentos/subir`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });
      showToast("¡Anexo subido con éxito!", "success");
      cargarDetalles();
    } catch (error: any) {
      showToast(error.response?.data?.error || "Error al subir el anexo.", "error");
    } finally {
      setSubiendo(false);
    }
  };

  const puedeEnviar = () => {
    const reqs = obtenerAnexosRequeridos();
    const obligatorios = reqs.filter(r => r.obligatorio);
    return obligatorios.every(r => historial.some(h => (h as any).anexo_clave === r.clave));
  };

  // NUEVO: Estado para el Modal de acciones Post-Aprobación
  const [modalPost, setModalPost] = useState<ModalPostAprobacion | null>(null);

  const cargarDetalles = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const resExpediente = await axios.get(`${API_URL}/api/solicitudes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpediente(resExpediente.data.solicitud);

      const resHistorial = await axios.get(`${API_URL}/api/documentos/solicitud/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorial(resHistorial.data.documentos || []);

    } catch (error: any) {
      console.error("Error al cargar el expediente:", error);
      const msg = error.response?.data?.error || "No se pudo obtener la información del expediente.";
      showToast(msg, "error");
      setTimeout(() => navigate('/dashboard'), 2000);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDetalles();
  }, [id]);

  const validarArchivo = (file: File): boolean => {
    const extensionesPermitidas = ['.pdf', '.doc', '.docx'];
    const nombreArchivo = file.name.toLowerCase();
    const extValida = extensionesPermitidas.some(ext => nombreArchivo.endsWith(ext));
    
    if (!extValida) {
      showToast("Formato no permitido. Solo se aceptan archivos PDF, DOC o DOCX.", "warning");
      return false;
    }

    const limitePeso = 20 * 1024 * 1024; 
    if (file.size > limitePeso) {
      showToast("El archivo excede el límite permitido de 20MB.", "warning");
      return false;
    }
    return true;
  };


  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validarArchivo(file)) setArchivo(file);
  };

  // Envío del proyecto principal o subsanación
  const enviarExpedienteComite = async () => {
    if (!puedeEnviar()) {
      showToast("Por favor, cargue todos los anexos obligatorios antes de enviar.", "warning");
      return;
    }
    setSubiendo(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/solicitudes/${id}/enviar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast("¡Expediente enviado exitosamente al Comité de Ética!", "success");
      setArchivo(null);
      cargarDetalles(); 
    } catch (error: any) {
      showToast(error.response?.data?.error || "Error al procesar el envío.", "error");
    } finally {
      setSubiendo(false);
    }
  };

  // NUEVO: Envío de documentos Post-Aprobación (Enmiendas, Reportes, Eventos)
  const enviarDocumentoPostAprobacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !modalPost) return showToast("Por favor seleccione un archivo.", "warning");

    setSubiendo(true);
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('solicitudId', id || '');
    formData.append('tipo_documento', modalPost.tipo_documento); 

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/documentos/subir`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      showToast(`¡${modalPost.titulo} enviado exitosamente al comité!`, "success");
      cerrarModalPost();
      cargarDetalles(); 
    } catch (error: any) {
      showToast(error.response?.data?.error || "Error al subir el documento especial.", "error");
    } finally {
      setSubiendo(false);
    }
  };

  const abrirModalPost = (tipo: string, titulo: string, descripcion: string, colorTema: string) => {
    setArchivo(null); 
    setModalPost({ visible: true, tipo_documento: tipo, titulo, descripcion, colorTema });
  };
  const cerrarModalPost = () => {
    setModalPost(null);
    setArchivo(null);
  };

  const descargarResolucionFinal = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/${id}/resolucion`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Resolucion_Aprobacion_${expediente?.numero_expediente}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showToast("Error al descargar el documento oficial.", "error");
    }
  };

  const descargarCartaObs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/${id}/carta-observacion`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Carta_Observaciones_${expediente?.numero_expediente}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showToast("Error al descargar la carta de observaciones oficial.", "error");
    }
  };

  const descargarArchivoHistorial = async (idDocumento: number, nombreOriginal: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/documentos/descargar/${idDocumento}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreOriginal);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showToast("Error al descargar el archivo del historial.", "error");
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-bold animate-pulse text-lg">Cargando detalles del expediente...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative">
      
      {/* NAVEGACIÓN SUPERIOR UNIFICADA */}
      <nav className="bg-gradient-to-r from-[#0B132B] to-[#121E3A] text-white shadow-xl z-10 relative border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5 text-xs font-bold text-slate-350 hover:text-white transition-all hover:translate-x-[-2px] cursor-pointer">
            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span>Volver a Mis Expedientes</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-white/10 border border-slate-700/60 px-3 py-1.5 rounded-lg font-black tracking-widest uppercase text-slate-300">
              ID Código: #{expediente?.id}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10 w-full flex-1 space-y-8">
        
        {/* ENCABEZADO Y ESTADO SEMÁFORO */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-black tracking-widest uppercase text-blue-600 block">Número de Trámite</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{expediente?.numero_expediente || 'Borrador'}</h1>
            <p className="text-slate-700 font-bold text-lg leading-snug">{expediente?.titulo_proyecto}</p>
          </div>
          
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado Actual</span>
            <span className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl border ${
              expediente?.estado_actual === 'borrador' ? 'bg-slate-100 text-slate-700 border-slate-300' :
              expediente?.estado_actual === 'enviado' ? 'bg-blue-100 text-blue-700 border-blue-300' :
              expediente?.estado_actual === 'en_revision' ? 'bg-purple-100 text-purple-700 border-purple-300' :
              expediente?.estado_actual === 'observado' ? 'bg-orange-50 text-orange-700 border-orange-300 animate-pulse' :
              expediente?.estado_actual === 'subsanado' ? 'bg-teal-100 text-teal-700 border-teal-300' :
              'bg-emerald-100 text-emerald-700 border-emerald-300'
            }`}>
              {expediente?.estado_actual.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* ALERTA CRÍTICA: SI TIENE OBSERVACIONES */}
        {expediente?.estado_actual === 'observado' && expediente.comentarios_comite && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-8 border-orange-500 rounded-3xl p-8 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 flex-1">
              <h3 className="text-orange-950 font-black text-xl flex items-center gap-2">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Dictamen de Observaciones Emitido
              </h3>
              <div className="bg-white/80 p-4 rounded-xl border border-orange-200 text-slate-700 text-sm font-medium whitespace-pre-wrap max-h-40 overflow-y-auto">
                {expediente.comentarios_comite}
              </div>
              <p className="text-xs text-orange-700 font-bold">⚠️ Instrucción: Modifique sus documentos y suba las nuevas versiones corregidas en cada ranura correspondiente a continuación.</p>
            </div>
            <button onClick={descargarCartaObs} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-xl font-black text-sm flex items-center gap-2 transition-transform active:scale-95 shrink-0 shadow-lg shadow-orange-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Descargar Carta Oficial PDF
            </button>
          </div>
        )}

        {/* RECOMPENSA Y PANEL POST-APROBACIÓN */}
        {estaAprobado && (
          <div className="space-y-4">
            <div className="bg-emerald-600 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
              <div>
                <h3 className="text-2xl font-black mb-1">¡Proyecto Certificado con Éxito!</h3>
                <p className="text-emerald-100 text-sm font-medium">El Comité de Ética ha certificado que su protocolo cumple con los principios bioéticos vigentes.</p>
              </div>
              <button onClick={descargarResolucionFinal} className="bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-4 rounded-xl font-black text-sm flex items-center gap-2 transition-transform active:scale-95 shrink-0 shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Descargar Resolución PDF
              </button>
            </div>

            {/* LOS 3 MÓDULOS AVANZADOS (Solo visibles si está aprobado) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-lg mb-1">Gestión Continua del Proyecto</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Cumpla con los requisitos éticos posteriores a la aprobación del estudio.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => abrirModalPost('enmienda', 'Solicitud de Enmienda', 'Adjunte el documento detallando las modificaciones a su protocolo original.', 'blue')} className="group flex flex-col items-center justify-center p-6 border border-slate-200/60 hover:border-blue-200/80 hover:bg-blue-50/30 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <span className="font-black text-slate-800 text-sm">Solicitar Enmienda</span>
                  <span className="text-xs text-slate-500 mt-1 text-center">Cambios en metodología o equipo</span>
                </button>

                <button onClick={() => abrirModalPost('reporte_avance', 'Reporte de Avance o Cierre', 'Suba su informe periódico o el informe final de conclusión del estudio.', 'teal')} className="group flex flex-col items-center justify-center p-6 border border-slate-200/60 hover:border-teal-200/80 hover:bg-teal-50/30 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <span className="font-black text-slate-800 text-sm">Avance y Cierre</span>
                  <span className="text-xs text-slate-500 mt-1 text-center">Informes de cumplimiento ético</span>
                </button>

                <button onClick={() => abrirModalPost('evento_adverso', 'Reporte de Evento Adverso', 'Notificación urgente de riesgos, efectos secundarios o daños a participantes.', 'red')} className="group flex flex-col items-center justify-center p-6 border border-red-100 hover:border-red-300 hover:bg-red-50/30 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:animate-pulse">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  </div>
                  <span className="font-black text-red-700 text-sm">Evento Adverso</span>
                  <span className="text-xs text-red-500 mt-1 text-center font-medium">Notificación inmediata obligatoria</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUERPO CENTRAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: Ficha y TIMELINE */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">Ficha del Protocolo</h3>
              
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tipo de Enfoque</span>
                <p className="text-sm font-bold text-slate-700 capitalize">{expediente?.tipo_investigacion.replace('_', ' ')}</p>
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Facultad Destino</span>
                <p className="text-sm font-bold text-slate-700">{expediente?.facultad}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Muestras Biológicas</span>
                <p className="text-sm font-bold text-slate-700">
                  {expediente?.usa_muestras_biologicas ? `Sí (${expediente.tipo_muestras_biologicas})` : 'No'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Grupos Vulnerables</span>
                <p className="text-sm font-bold text-slate-700">
                  {expediente?.involucra_grupos_vulnerables ? `Sí (${expediente.descripcion_vulnerabilidad})` : 'No'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">¿Estudio Invasivo?</span>
                <p className="text-sm font-bold text-slate-700">
                  {expediente?.es_invasivo ? 'Sí (Evaluación Plena Obligatoria)' : 'No'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tasa de Trámite / Pago</span>
                <p className="text-sm font-bold text-slate-700">
                  {expediente?.exonerado_pago 
                    ? 'Exonerado (Autofinanciado o FEDU)' 
                    : (expediente?.investigador_correo?.endsWith('@unap.edu.pe') 
                        ? '2% del monto financiado (Docente UNA-Puno)' 
                        : '3% del monto financiado (Investigador Externo)')}
                </p>
              </div>

              {expediente?.categoria_riesgo && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Categoría de Riesgo</span>
                  <span className={`px-2 py-1 inline-block text-[10px] font-black uppercase rounded mt-1 border ${
                    expediente.categoria_riesgo === 'alto' ? 'bg-red-50 text-red-700 border-red-200' :
                    expediente.categoria_riesgo === 'moderado' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {expediente.categoria_riesgo.replace('bajo', 'Bajo o Ningún Riesgo').replace('moderado', 'Riesgo Moderado').replace('alto', 'Riesgo Alto')}
                  </span>
                </div>
              )}
            </div>

            {/* TIMELINE DE ARCHIVOS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Historial de Documentos
              </h3>
              
              {historial.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium italic text-center py-4">Aún no se han subido documentos.</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {historial.map((doc, index) => (
                    <div key={doc.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-blue-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"></div>
                      <div className="w-[calc(100%-2rem)] p-3 rounded-xl border border-slate-100 bg-slate-50 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">V{doc.version || (historial.length - index)}</span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(doc.fecha_subida).toLocaleDateString('es-PE', { day:'2-digit', month:'short' })}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 truncate mb-2" title={doc.nombre_archivo_original}>
                          {doc.nombre_archivo_original}
                        </p>
                        <button onClick={() => descargarArchivoHistorial(doc.id, doc.nombre_archivo_original)} className="text-[10px] font-black text-slate-500 hover:text-blue-700 flex items-center gap-1 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> 
                          Descargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA GIGANTE: Zona de Archivos Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Requisitos y Anexos Obligatorios</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Suba cada archivo correspondiente en su ranura respectiva. Todos los marcados como obligatorios son necesarios.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {obtenerAnexosRequeridos().map((anexo) => {
                  // Buscar el documento más reciente subido para esta ranura (anexo.clave)
                  const docsSubidos = historial.filter(d => (d as any).anexo_clave === anexo.clave);
                  const tieneDoc = docsSubidos.length > 0;
                  const docReciente = tieneDoc ? docsSubidos[0] : null;
                  const isObserved = slotsObservados.has(anexo.clave);
                  const isDragActive = draggedOverSlot === anexo.clave;

                  return (
                    <div 
                      key={anexo.clave} 
                      onDragOver={(e) => handleDragOver(e, anexo.clave)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, anexo.clave, anexo.mappedEnum)}
                      className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 min-h-[200px] hover:shadow-sm relative ${
                        isDragActive
                          ? 'border-[#D4AF37] bg-amber-50/40 scale-[1.01] border-dashed ring-2 ring-[#D4AF37]/20 shadow-md shadow-[#D4AF37]/5'
                          : isObserved
                            ? 'border-orange-400 bg-orange-50/30 ring-2 ring-orange-400/15 shadow-md shadow-orange-500/5'
                            : tieneDoc 
                              ? 'bg-emerald-50/30 border-emerald-200' 
                              : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              isObserved 
                                ? 'bg-orange-500 animate-pulse' 
                                : tieneDoc 
                                  ? 'bg-emerald-500' 
                                  : 'bg-rose-450'
                            }`}></span>
                            <h4 className="font-bold text-xs text-slate-800 leading-tight" title={anexo.label}>
                              {anexo.label}
                            </h4>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {isObserved && (
                              <span className="text-[8px] font-black uppercase text-orange-700 bg-orange-100 px-2 py-0.5 rounded tracking-wider border border-orange-200 animate-pulse">
                                ⚠️ Corregir
                              </span>
                            )}
                            {anexo.obligatorio ? (
                              <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded shrink-0 tracking-wider">Obligatorio</span>
                            ) : (
                              <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded shrink-0 tracking-wider">Opcional</span>
                            )}
                          </div>
                        </div>
                        
                        {tieneDoc && docReciente ? (
                          <div className="text-[11px] text-slate-600 space-y-1.5 font-medium min-w-0">
                            <p className="truncate text-blue-755 font-bold bg-blue-50/60 px-2.5 py-1.5 rounded border border-blue-100/50 w-full animate-fade-in" title={docReciente.nombre_archivo_original}>
                              📄 {docReciente.nombre_archivo_original}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              Versión: <span className="text-blue-600 font-black">V{docReciente.version || docsSubidos.length}</span> | {new Date(docReciente.fecha_subida).toLocaleDateString('es-PE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 font-medium italic">Pendiente de carga de archivo.</p>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/40 flex justify-end">
                        {puedeEditar ? (
                          <label className={`w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                            tieneDoc 
                              ? 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50' 
                              : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:scale-[1.01]'
                          }`}>
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                            <span>{tieneDoc ? 'Actualizar' : 'Cargar Archivo'}</span>
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) manejarSubidaAnexo(anexo.clave, anexo.mappedEnum, file);
                              }} 
                              className="hidden" 
                            />
                          </label>
                        ) : (
                          tieneDoc && docReciente && (
                            <button onClick={() => descargarArchivoHistorial(docReciente.id, docReciente.nombre_archivo_original)} className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-sm">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                              <span>Descargar</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón de Envío Oficial */}
              {puedeEditar && (
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  {!puedeEnviar() && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-xs text-rose-800 shadow-sm font-semibold">
                      <svg className="w-5 h-5 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      <p>Ranuras obligatorias pendientes. Por favor cargue todos los archivos indicados como obligatorios antes de poder enviar su expediente al Comité de Ética.</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={enviarExpedienteComite} 
                    disabled={subiendo || !puedeEnviar()}
                    className={`w-full py-4.5 rounded-xl font-black text-sm transition-all text-white shadow-md flex items-center justify-center gap-2 ${
                      subiendo || !puedeEnviar()
                        ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500' 
                        : expediente?.estado_actual === 'observado'
                        ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 hover:-translate-y-0.5'
                        : 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/20 hover:-translate-y-0.5'
                    }`}
                  >
                    {subiendo ? 'Subiendo y procesando solicitud...' : 
                     expediente?.estado_actual === 'observado' ? 'Confirmar y Enviar Subsanación de Observaciones' : 'Confirmar y Enviar al Comité de Ética'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL FLOTANTE PARA POST-APROBACIÓN */}
      {modalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl scale-100 transition-transform">
            
            <div className={`px-6 py-4 border-b flex justify-between items-center bg-${modalPost.colorTema}-50 border-${modalPost.colorTema}-100`}>
              <h3 className={`text-lg font-black text-${modalPost.colorTema}-800`}>{modalPost.titulo}</h3>
              <button onClick={cerrarModalPost} className="text-slate-400 hover:text-slate-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={enviarDocumentoPostAprobacion} className="p-6 space-y-6">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                {modalPost.descripcion}
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <input 
                  type="file" id="post-file" accept=".pdf,.doc,.docx" required
                  onChange={manejarSeleccionArchivo} className="hidden"
                />
                
                {archivo ? (
                  <div className="space-y-2">
                    <svg className={`w-10 h-10 mx-auto text-${modalPost.colorTema}-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className={`text-sm font-bold text-${modalPost.colorTema}-700 truncate`}>{archivo.name}</p>
                    <label htmlFor="post-file" className="text-xs text-slate-500 font-bold underline cursor-pointer hover:text-slate-700">Cambiar archivo</label>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <label htmlFor="post-file" className="text-sm font-bold text-slate-700 cursor-pointer hover:text-blue-600 transition-colors">
                      Haga clic aquí para seleccionar su documento
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Formatos: PDF, DOCX (Max 20MB)</p>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModalPost} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={subiendo || !archivo} className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md ${
                  subiendo || !archivo ? 'bg-slate-300 shadow-none cursor-not-allowed' : `bg-${modalPost.colorTema}-600 hover:bg-${modalPost.colorTema}-700`
                }`}>
                  {subiendo ? 'Enviando...' : 'Confirmar Envío'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map(toast => {
          let bgClass = 'bg-[#0B132B] text-white border-slate-700 shadow-slate-950/40';
          let icon = 'ℹ️';
          if (toast.tipo === 'success') {
            bgClass = 'bg-emerald-950/95 border-emerald-500/30 text-emerald-100 shadow-emerald-900/20';
            icon = '✅';
          } else if (toast.tipo === 'error') {
            bgClass = 'bg-rose-900/95 border-rose-500/30 text-rose-100 shadow-rose-900/20';
            icon = '❌';
          } else if (toast.tipo === 'warning') {
            bgClass = 'bg-amber-900/95 border-amber-550/30 text-amber-100 shadow-amber-900/20';
            icon = '⚠️';
          }
          return (
            <div 
              key={toast.id} 
              className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-3 pointer-events-auto animate-slide-in transition-all duration-300 ${bgClass}`}
            >
              <span className="text-base shrink-0 mt-0.5">{icon}</span>
              <div className="flex-grow text-xs font-bold leading-relaxed">{toast.mensaje}</div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white/60 hover:text-white shrink-0 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}