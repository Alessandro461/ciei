import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NuevoExpedienteModal from '../components/NuevoExpedienteModal';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

interface Solicitud {
  id: number;
  numero_expediente: string;
  tipo_investigacion: string;
  titulo_proyecto: string;
  estado_actual: string;
  created_at: string;
  comentarios_comite?: string;
}

export default function Dashboard() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [usuario, setUsuario] = useState<{ nombres: string; apellidos: string; rol: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const cargarExpedientes = async () => {
    const token = localStorage.getItem('token');
    try {
      const respuesta = await axios.get(`${API_URL}/api/solicitudes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudes(respuesta.data.solicitudes);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('usuario');

    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userStr) setUsuario(JSON.parse(userStr));
    cargarExpedientes();
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  // MAGIA KODIAK: Calculadora de Progreso Visual
  const obtenerProgreso = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'borrador': return { p: 20, bg: 'bg-slate-400', txt: 'text-slate-600', label: 'Fase 1: Borrador' };
      case 'enviado': return { p: 40, bg: 'bg-blue-500', txt: 'text-blue-700', label: 'Fase 2: Enviado a Comité' };
      case 'en_revision': return { p: 60, bg: 'bg-purple-500', txt: 'text-purple-700', label: 'Fase 3: Evaluación Técnica' };
      case 'observado': return { p: 60, bg: 'bg-orange-500', txt: 'text-orange-700', label: 'Detenido: Requiere Corrección' };
      case 'subsanado': return { p: 80, bg: 'bg-teal-500', txt: 'text-teal-700', label: 'Fase 4: Subsanación en revisión' };
      case 'aprobado': return { p: 100, bg: 'bg-emerald-500', txt: 'text-emerald-700', label: 'Fase 5: Aprobación Final' };
      case 'rechazado': return { p: 100, bg: 'bg-red-500', txt: 'text-red-700', label: 'Proyecto Rechazado' };
      default: return { p: 0, bg: 'bg-slate-200', txt: 'text-slate-500', label: 'Desconocido' };
    }
  };

  const obtenerTextoBoton = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'borrador': return 'Continuar edición';
      case 'observado': return 'Subsanar ahora';
      case 'aprobado': return 'Descargar Resolución';
      default: return 'Ver expediente';
    }
  };

  // Calcular KPIs del Investigador
  const kpis = {
    total: solicitudes.length,
    aprobados: solicitudes.filter(s => s.estado_actual === 'aprobado').length,
    observados: solicitudes.filter(s => s.estado_actual === 'observado').length,
    enRevision: solicitudes.filter(s => ['enviado', 'en_revision', 'subsanado'].includes(s.estado_actual)).length
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* NAVEGACIÓN SUPERIOR PREMIUM */}
      <nav className="bg-gradient-to-r from-[#0B132B] to-[#121E3A] text-white shadow-xl z-10 relative border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center font-black text-[#0B132B] shadow-md shadow-[#D4AF37]/15">U</div>
            <span className="font-extrabold tracking-tight text-sm">CIEI <span className="font-normal text-slate-400">| Panel Investigador</span></span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs font-bold text-slate-400 hidden sm:block border-r border-[#1E293B] pr-4">
              Usuario: <span className="font-extrabold text-white">{usuario?.nombres} {usuario?.apellidos}</span>
            </span>
            
            <button 
              onClick={() => navigate('/perfil')} 
              className="bg-white/10 hover:bg-white/20 border border-slate-700/60 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all hover:scale-95 active:scale-90 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <span>Mi Perfil</span>
            </button>

            <button 
              onClick={cerrarSesion} 
              className="bg-transparent hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-bold py-2 px-2.5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/20"
              title="Cerrar Sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-2xl font-black text-[#0B132B] tracking-tight">Bandeja de Expedientes</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Gestione y envíe sus protocolos científicos para revisión bioética.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-slate-900 hover:bg-[#1C2541] text-white font-extrabold py-3 px-5 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 text-xs cursor-pointer border border-slate-800"
          >
            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            Nuevo Expediente
          </button>
        </div>

        {/* TARJETAS KPI REDISEÑADAS (Premium) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/65 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total de Trámites</span>
              <span className="text-2xl font-black text-slate-800">{kpis.total}</span>
            </div>
          </div>
          {/* Aprobados */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600/80 tracking-wider block">Proyectos Certificados</span>
              <span className="text-2xl font-black text-emerald-700">{kpis.aprobados}</span>
            </div>
          </div>
          {/* Observados */}
          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-600/80 tracking-wider block">Requieren Subsanación</span>
              <span className="text-2xl font-black text-amber-700">{kpis.observados}</span>
            </div>
          </div>
          {/* En revisión */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600/80 tracking-wider block">En Evaluación Técnica</span>
              <span className="text-2xl font-black text-indigo-700">{kpis.enRevision}</span>
            </div>
          </div>
        </div>

        {/* EXPEDIENTES REDISEÑADOS COMO TARJETAS MODERNAS */}
        <div className="space-y-4">
          {solicitudes.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/70 shadow-sm">
              <div className="flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <p className="text-sm font-black text-slate-700">Sin Expedientes Registrados</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Comience creando su primer protocolo de investigación.</p>
              </div>
            </div>
          ) : (
            solicitudes.map((sol) => {
              const progreso = obtenerProgreso(sol.estado_actual);
              const esObservado = sol.estado_actual === 'observado';
              const esAprobado = sol.estado_actual === 'aprobado';

              return (
                <div 
                  key={sol.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-250/70 hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1 space-y-3.5 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60 shadow-sm">
                        #{sol.numero_expediente || sol.id}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded">
                        {sol.tipo_investigacion ? sol.tipo_investigacion.replace('_', ' ') : 'No especificado'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-base leading-snug line-clamp-2" title={sol.titulo_proyecto}>
                        {sol.titulo_proyecto || 'Sin título'}
                      </h4>
                    </div>

                    {esObservado && sol.comentarios_comite && (
                      <div className="bg-amber-50/50 border border-amber-200/75 p-4 rounded-xl text-xs text-amber-800 shadow-sm flex items-start gap-2.5">
                        <span className="text-amber-500 text-sm leading-none shrink-0 mt-0.5">⚠️</span>
                        <div>
                          <strong className="block mb-0.5 uppercase tracking-wide text-[9px] font-black text-amber-900">Observaciones del Comité:</strong>
                          <span className="font-medium leading-relaxed">{sol.comentarios_comite}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PROGRESO Y ACCIONES */}
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-6 shrink-0 md:w-80">
                    <div className="flex-1 space-y-1.5 min-w-[150px]">
                      <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider">
                        <span className={progreso.txt}>{progreso.label}</span>
                        <span className="text-slate-400 font-bold">{progreso.p}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                        <div className={`h-full ${progreso.bg} transition-all duration-1000 ease-out`} style={{ width: `${progreso.p}%` }}></div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <button 
                        onClick={() => navigate(`/expediente/${sol.id}`)} 
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl transition-all inline-flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer border ${
                          esObservado 
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/10' 
                            : esAprobado
                            ? 'bg-[#0B132B] hover:bg-[#1C2541] text-white border-[#0B132B] hover:border-[#1C2541] shadow-slate-900/10'
                            : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950'
                        }`}
                      >
                        <span>{obtenerTextoBoton(sol.estado_actual)}</span>
                        {esAprobado ? (
                          <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <NuevoExpedienteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={cargarExpedientes} />
      </main>
    </div>
  );
}