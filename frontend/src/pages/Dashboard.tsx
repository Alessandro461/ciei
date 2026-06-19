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

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <nav className="bg-blue-950 text-white shadow-xl z-10 relative border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center font-black text-yellow-400 shadow-inner">U</div>
            <span className="font-black tracking-tight text-lg">CIEI <span className="font-medium text-blue-300">Dashboard</span></span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-sm font-medium text-blue-200 hidden sm:block border-r border-blue-800 pr-4">
              Investigador: <span className="font-bold text-white">{usuario?.nombres}</span>
            </span>
            
            <button onClick={() => navigate('/perfil')} className="bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <span className="hidden sm:inline">Mi Perfil</span>
            </button>

            <button onClick={cerrarSesion} className="bg-transparent hover:bg-red-500 text-blue-200 hover:text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Expedientes</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Gestione el estado de sus investigaciones y subsane observaciones.</p>
          </div>
          
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-700 hover:bg-blue-800 text-white font-black py-3 px-6 rounded-xl shadow-[0_4px_15px_rgba(29,78,216,0.3)] transition-all hover:-translate-y-0.5 flex items-center gap-2 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
            Nuevo Expediente
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Expediente</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Investigación</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Progreso del Trámite</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Acción Requerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <p className="text-lg font-black text-slate-600 mb-1">Bandeja Vacía</p>
                        <p className="text-sm font-medium">Haga clic en "Nuevo Expediente" para iniciar un trámite.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((sol) => {
                    const progreso = obtenerProgreso(sol.estado_actual);
                    const esObservado = sol.estado_actual === 'observado';
                    const esAprobado = sol.estado_actual === 'aprobado';

                    return (
                      <tr key={sol.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            {sol.numero_expediente}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm max-w-sm">
                          <div className="font-bold truncate text-slate-900 text-base mb-1" title={sol.titulo_proyecto}>
                            {sol.titulo_proyecto || 'Sin título'}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                            {sol.tipo_investigacion ? sol.tipo_investigacion.replace('_', ' ') : 'No especificado'}
                          </span>
                          
                          {esObservado && sol.comentarios_comite && (
                            <div className="mt-3 bg-orange-50 border border-orange-200 p-3 rounded-xl text-xs text-orange-800 shadow-sm animate-fade-in flex items-start gap-2">
                              <span className="text-orange-500 text-base leading-none">⚠️</span>
                              <div>
                                <strong className="block mb-0.5 uppercase tracking-wide text-[10px]">Corrección requerida:</strong>
                                <span className="font-medium">{sol.comentarios_comite}</span>
                              </div>
                            </div>
                          )}
                        </td>
                        
                        {/* COLUMNA DE TIMELINE VISUAL */}
                        <td className="px-6 py-5 align-middle min-w-[200px]">
                          <div className="w-full">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                              <span className={progreso.txt}>{progreso.label}</span>
                              <span className="text-slate-400">{progreso.p}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div className={`h-full ${progreso.bg} transition-all duration-1000 ease-out`} style={{ width: `${progreso.p}%` }}></div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <button 
                            onClick={() => navigate(`/expediente/${sol.id}`)} 
                            className={`px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 font-black text-xs shadow-sm active:scale-95 ${
                              esObservado 
                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 shadow-md animate-pulse' 
                                : esAprobado
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <span>{obtenerTextoBoton(sol.estado_actual)}</span>
                            {esAprobado ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <NuevoExpedienteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={cargarExpedientes} />
      </main>
    </div>
  );
}