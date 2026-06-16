import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NuevoExpedienteModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  
  // Todos los campos exigidos en el Requisito 6
  const [formData, setFormData] = useState({
    titulo_proyecto: '',
    tipo_investigacion: 'humanos',
    facultad: '',
    escuela_profesional: '',
    resumen: '',
    objetivos: '',
    metodologia: '',
    investigadores_asociados: '',
    duracion: '',
    usa_muestras_biologicas: false,
    tipo_muestras_biologicas: '',
    origen_fondos: 'autofinanciado',
    involucra_grupos_vulnerables: false,
    descripcion_vulnerabilidad: '',
    es_invasivo: false
  });

  if (!isOpen) return null;

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    
    try {
      const token = localStorage.getItem('token');
      const respuesta = await axios.post(`${API_URL}/api/solicitudes`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSuccess(); 
      onClose(); 
      navigate(`/expediente/${respuesta.data.solicitudId}`);
      
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear el expediente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera Fija */}
        <div className="bg-blue-950 p-6 flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          <h3 className="text-xl font-black text-white relative z-10 flex items-center gap-3">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Crear Nuevo Expediente
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors relative z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        {/* Cuerpo con Scroll para los campos largos */}
        <div className="p-8 overflow-y-auto bg-slate-50 custom-scrollbar">
          <form id="expedienteForm" onSubmit={manejarEnvio} className="space-y-6">
            
            <div className="bg-blue-100 border border-blue-200 rounded-xl p-4 flex gap-3 text-sm text-blue-800 shadow-sm">
              <svg className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="font-bold">Complete la información del protocolo. Los archivos adjuntos se subirán en el siguiente paso.</p>
            </div>

            {/* SECCIÓN 1: Datos Generales */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h4 className="font-black text-slate-800 border-b border-slate-100 pb-2">1. Datos Generales</h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título del Proyecto</label>
                <textarea required rows={2} value={formData.titulo_proyecto} onChange={(e) => setFormData({...formData, titulo_proyecto: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50" placeholder="Ej: Impacto de la inteligencia artificial..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Facultad</label>
                  <input required type="text" value={formData.facultad} onChange={(e) => setFormData({...formData, facultad: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="Ej: Ingeniería Estadística" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Escuela Profesional</label>
                  <input required type="text" value={formData.escuela_profesional} onChange={(e) => setFormData({...formData, escuela_profesional: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="Ej: Estadística e Informática" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Investigación</label>
                  <select value={formData.tipo_investigacion} onChange={(e) => setFormData({...formData, tipo_investigacion: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-black text-blue-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/50 cursor-pointer">
                    <option value="humanos">Investigación en Humanos</option>
                    <option value="animales">Investigación en Animales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duración Proyectada</label>
                  <input type="text" value={formData.duracion} onChange={(e) => setFormData({...formData, duracion: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="Ej: 6 meses" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Investigadores Asociados (Opcional)</label>
                <input type="text" value={formData.investigadores_asociados} onChange={(e) => setFormData({...formData, investigadores_asociados: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="Nombres separados por comas" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Origen de los Fondos</label>
                  <select 
                    value={formData.origen_fondos} 
                    onChange={(e) => setFormData({...formData, origen_fondos: e.target.value})} 
                    className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
                  >
                    <option value="autofinanciado">Autofinanciado (Exonerado)</option>
                    <option value="fedu">FEDU - UNA Puno (Exonerado)</option>
                    <option value="externo">Financiamiento Externo (Requiere Pago)</option>
                    <option value="otros">Otros Convenios (Requiere Pago)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">¿Utiliza Muestras Biológicas?</label>
                  <select 
                    value={formData.usa_muestras_biologicas ? "true" : "false"} 
                    onChange={(e) => setFormData({...formData, usa_muestras_biologicas: e.target.value === "true"})} 
                    className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
                  >
                    <option value="false">No utiliza muestras biológicas</option>
                    <option value="true">Sí utiliza muestras biológicas</option>
                  </select>
                </div>
              </div>

              {formData.usa_muestras_biologicas && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Describa las Muestras Biológicas y su procedencia</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.tipo_muestras_biologicas} 
                    onChange={(e) => setFormData({...formData, tipo_muestras_biologicas: e.target.value})} 
                    className="w-full px-4 py-3 border border-slate-200 font-medium text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" 
                    placeholder="Ej: Muestras de sangre venosa, hisopado bucal, biopsia de tejido..." 
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">¿Involucra Grupos Vulnerables?</label>
                  <select 
                    value={formData.involucra_grupos_vulnerables ? "true" : "false"} 
                    onChange={(e) => setFormData({...formData, involucra_grupos_vulnerables: e.target.value === "true"})} 
                    className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
                  >
                    <option value="false">No involucra grupos vulnerables</option>
                    <option value="true">Sí involucra grupos vulnerables (Niños, gestantes, comunidades, etc.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">¿Es un estudio invasivo?</label>
                  <select 
                    value={formData.es_invasivo ? "true" : "false"} 
                    onChange={(e) => setFormData({...formData, es_invasivo: e.target.value === "true"})} 
                    className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
                  >
                    <option value="false">No es invasivo</option>
                    <option value="true">Sí es invasivo</option>
                  </select>
                </div>
              </div>

              {formData.involucra_grupos_vulnerables && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Describa la población vulnerable a participar y justifique su inclusión</label>
                  <textarea 
                    required 
                    rows={2}
                    value={formData.descripcion_vulnerabilidad} 
                    onChange={(e) => setFormData({...formData, descripcion_vulnerabilidad: e.target.value})} 
                    className="w-full px-4 py-3 border border-slate-200 font-medium text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none" 
                    placeholder="Describa si son niños, embarazadas, personas con problemas de salud mental, etc." 
                  />
                </div>
              )}
            </div>

            {/* SECCIÓN 2: Resumen Científico */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h4 className="font-black text-slate-800 border-b border-slate-100 pb-2">2. Resumen Científico</h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resumen del Proyecto</label>
                <textarea required rows={3} value={formData.resumen} onChange={(e) => setFormData({...formData, resumen: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50" placeholder="Breve descripción del estudio..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Objetivos (General y Específicos)</label>
                <textarea required rows={3} value={formData.objetivos} onChange={(e) => setFormData({...formData, objetivos: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50" placeholder="1. Objetivo General&#10;2. Objetivos Específicos..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Metodología a emplear</label>
                <textarea required rows={3} value={formData.metodologia} onChange={(e) => setFormData({...formData, metodologia: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50" placeholder="Diseño de estudio, muestra, instrumentos..." />
              </div>
            </div>

          </form>
        </div>

        {/* Pie Fijo: Botones de Acción */}
        <div className="bg-white border-t border-slate-200 p-6 shrink-0 flex justify-end gap-4 rounded-b-3xl">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button 
            type="submit" 
            form="expedienteForm"
            disabled={cargando}
            className={`px-8 py-3 rounded-xl font-black text-white shadow-md transition-all flex items-center gap-2 ${
              cargando ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 hover:-translate-y-0.5 shadow-blue-700/30'
            }`}
          >
            {cargando ? 'Creando Borrador...' : 'Guardar y Subir Archivos'}
            {!cargando && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>}
          </button>
        </div>

      </div>
    </div>
  );
}