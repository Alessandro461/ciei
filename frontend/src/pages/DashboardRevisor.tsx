import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ExpedienteAsignado {
  id: number;
  numero_expediente: string;
  titulo_proyecto: string;
  nombres: string; // Investigador
  apellidos: string;
  facultad: string;
  tipo_investigacion: string;
  estado_actual: string;
  created_at: string;
  fecha_limite?: string;
}

function SemaforoBadge({ fechaLimite }: { fechaLimite: string | undefined | null }) {
  if (!fechaLimite) {
    return <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">-</span>;
  }

  const limite = new Date(fechaLimite);
  const hoy = new Date();
  const diffTime = limite.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = `A tiempo (${diffDays} d)`;

  if (diffDays < 0) {
    color = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold';
    label = `Vencido (${Math.abs(diffDays)} d)`;
  } else if (diffDays < 5) {
    color = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
    label = `Próx. vencer (${diffDays} d)`;
  }

  return (
    <span className={`px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border ${color}`}>
      ⏳ {label}
    </span>
  );
}

export default function DashboardRevisor() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<{ nombres: string; apellidos: string; rol: string } | null>(null);
  const [expedientes, setExpedientes] = useState<ExpedienteAsignado[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Control del Menú Lateral
  const [vistaActiva, setVistaActiva] = useState<'inicio' | 'pendientes' | 'subsanaciones' | 'historial'>('inicio');

  // Estados de Seguridad y Firmas (Anexo L y N)
  const [mostrarOverlayAnexoL, setMostrarOverlayAnexoL] = useState(false);
  const [mostrarOverlayAnexoN, setMostrarOverlayAnexoN] = useState(false);
  const [firmaCoI, setFirmaCoI] = useState('');
  const [firmando, setFirmando] = useState(false);

  const cargarEstadoSeguridad = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Cargar Perfil Actualizado
      const resPerfil = await axios.get(`${API_URL}/api/usuarios/perfil`, { headers });
      const user = resPerfil.data.usuario;
      setUsuario(user);

      // 2. Cargar Estado de Declaración CoI (Anexo N)
      const resCoI = await axios.get(`${API_URL}/api/usuarios/declarar-coi/estado`, { headers });

      // Decidir qué overlay mostrar
      if (user.es_invitado && !user.acepto_confidencialidad_anexol) {
        setMostrarOverlayAnexoL(true);
      } else if (!resCoI.data.firmado) {
        setMostrarOverlayAnexoN(true);
      } else {
        setMostrarOverlayAnexoL(false);
        setMostrarOverlayAnexoN(false);
      }
    } catch (error) {
      console.error('Error al cargar estado de seguridad del revisor:', error);
    }
  };

  const cargarBandejaRevisor = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await cargarEstadoSeguridad();

      const respuesta = await axios.get(`${API_URL}/api/solicitudes/comite/todas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filtramos estados válidos para el revisor (Ocultamos borradores, peajes o enviados sin asignar)
      const validos = respuesta.data.solicitudes.filter(
        (s: ExpedienteAsignado) => s.estado_actual !== 'borrador' && s.estado_actual !== 'pendiente_pago' && s.estado_actual !== 'enviado'
      );
      setExpedientes(validos);
    } catch (error) {
      console.error('Error al cargar expedientes del revisor:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarBandejaRevisor();
  }, [navigate]);

  const aceptarAnexoL = async () => {
    setFirmando(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/usuarios/aceptar-confidencialidad`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('¡Acuerdo de Confidencialidad (Anexo L) aceptado exitosamente!');
      await cargarBandejaRevisor();
    } catch (error) {
      alert('Error al aceptar el Acuerdo de Confidencialidad.');
    } finally {
      setFirmando(false);
    }
  };

  const firmarAnexoN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmaCoI.trim()) {
      alert('Por favor, escriba su nombre completo como firma digital.');
      return;
    }
    setFirmando(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/usuarios/declarar-coi`, {
        firma_digital: firmaCoI
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('¡Declaración de Conflicto de Interés (Anexo N) firmada exitosamente!');
      await cargarBandejaRevisor();
    } catch (error) {
      alert('Error al firmar la Declaración.');
    } finally {
      setFirmando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  // ==========================================
  // CALCULADORA DE KPIs (Estadísticas)
  // ==========================================
  const kpis = {
    pendientes: expedientes.filter(e => e.estado_actual === 'en_revision').length,
    subsanaciones: expedientes.filter(e => e.estado_actual === 'subsanado').length,
    observados: expedientes.filter(e => e.estado_actual === 'observado').length,
    revisados: expedientes.filter(e => e.estado_actual === 'aprobado' || e.estado_actual === 'rechazado').length,
  };

  // Filtrado dinámico según la opción del menú seleccionada
  const expedientesMostrados = expedientes.filter(e => {
    if (vistaActiva === 'pendientes') return e.estado_actual === 'en_revision';
    if (vistaActiva === 'subsanaciones') return e.estado_actual === 'subsanado';
    if (vistaActiva === 'historial') return ['aprobado', 'observado', 'rechazado'].includes(e.estado_actual);
    return true; // 'inicio' muestra todos
  });

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const obtenerEstiloEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'en_revision': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'observado': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'subsanado': return 'bg-teal-100 text-teal-800 border-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.4)] animate-pulse';
      case 'aprobado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rechazado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (cargando) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-blue-900">Cargando panel de evaluación...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* ========================================== */}
      {/* MENÚ DEL REVISOR (SIDEBAR KODIAK) */}
      {/* ========================================== */}
      <aside className="w-72 bg-[#0B132B] text-slate-300 flex flex-col shadow-2xl relative z-20 shrink-0">
        
        <div className="h-20 flex items-center gap-3 px-6 bg-[#080d1e] border-b border-slate-800/50">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">C</div>
          <div>
            <h2 className="text-white font-black text-lg leading-tight tracking-tight">CIEI Panel</h2>
            <p className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">Módulo del Revisor</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Panel Principal</p>
          
          <button onClick={() => setVistaActiva('inicio')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${vistaActiva === 'inicio' ? 'bg-blue-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            Dashboard
          </button>
          
          <button onClick={() => setVistaActiva('pendientes')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${vistaActiva === 'pendientes' ? 'bg-blue-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Expedientes Asignados
            {kpis.pendientes > 0 && <span className="ml-auto bg-blue-500/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-md">{kpis.pendientes}</span>}
          </button>

          <button onClick={() => setVistaActiva('subsanaciones')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${vistaActiva === 'subsanaciones' ? 'bg-teal-600 text-white shadow-[0_4px_15px_rgba(13,148,136,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Subsanaciones
            {kpis.subsanaciones > 0 && <span className="ml-auto bg-teal-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">{kpis.subsanaciones}</span>}
          </button>

          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-6 mb-2">Histórico</p>
          
          <button onClick={() => setVistaActiva('historial')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${vistaActiva === 'historial' ? 'bg-blue-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            Dictámenes Emitidos
          </button>
        </nav>

        {/* Perfil Inferior */}
        <div className="p-5 bg-[#080d1e] border-t border-slate-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-black text-white">{usuario?.nombres.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{usuario?.nombres} {usuario?.apellidos}</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider truncate">Rol: {usuario?.rol}</p>
            </div>
          </div>
          <button onClick={cerrarSesion} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-xs font-bold transition-colors border border-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* CONTENIDO PRINCIPAL (DASHBOARD) */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {vistaActiva === 'inicio' ? 'Resumen de Auditoría' : 
               vistaActiva === 'pendientes' ? 'Expedientes Pendientes de Revisión' : 
               vistaActiva === 'subsanaciones' ? 'Control de Subsanaciones' : 'Historial de Dictámenes Emitidos'}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Plataforma de Evaluación Científica</p>
          </div>
          
          <button className="relative p-2 bg-slate-50 border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            {kpis.subsanaciones > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
          
          {/* INDICADORES (Solo visibles en Inicio) */}
          {vistaActiva === 'inicio' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              
              <div onClick={() => setVistaActiva('pendientes')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group cursor-pointer hover:border-blue-300 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><svg className="w-20 h-20 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Pendientes</span>
                <span className="text-4xl font-black text-slate-800 relative z-10">{kpis.pendientes}</span>
              </div>

              <div onClick={() => setVistaActiva('subsanaciones')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group cursor-pointer hover:border-teal-300 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><svg className="w-20 h-20 text-teal-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg></div>
                <span className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-1 relative z-10 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span> Subsanaciones
                </span>
                <span className="text-4xl font-black text-slate-800 relative z-10">{kpis.subsanaciones}</span>
              </div>

              <div onClick={() => setVistaActiva('historial')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group cursor-pointer hover:border-orange-300 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><svg className="w-20 h-20 text-orange-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Observados</span>
                <span className="text-4xl font-black text-slate-800 relative z-10">{kpis.observados}</span>
              </div>

              <div onClick={() => setVistaActiva('historial')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group cursor-pointer hover:border-emerald-300 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><svg className="w-20 h-20 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Revisados</span>
                <span className="text-4xl font-black text-slate-800 relative z-10">{kpis.revisados}</span>
              </div>

            </div>
          )}

          {/* TABLA PRINCIPAL DE EXPEDIENTES */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden animate-fade-in">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-widest">
                Lista de Proyectos {vistaActiva === 'inicio' ? 'Asignados' : ''}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Expediente</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Investigador</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Facultad / Tipo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Ingreso</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA / Límite</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {expedientesMostrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                          <p className="text-base font-bold text-slate-600 mb-1">Bandeja Vacía</p>
                          <p className="text-xs">No hay expedientes en esta categoría en este momento.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    expedientesMostrados.map((sol) => (
                      <tr key={sol.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-black text-slate-800">{sol.numero_expediente}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900 line-clamp-1 mb-0.5" title={sol.titulo_proyecto}>{sol.titulo_proyecto || 'Sin Título'}</div>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                            {sol.nombres} {sol.apellidos}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-700">{sol.facultad || '---'}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{sol.tipo_investigacion?.replace('_', ' ')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                          {formatearFecha(sol.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-lg border ${obtenerEstiloEstado(sol.estado_actual)}`}>
                            {sol.estado_actual.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <SemaforoBadge fechaLimite={sol.fecha_limite} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button 
                            onClick={() => navigate(`/comite/evaluar/${sol.id}`)} 
                            className={`px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 font-black text-xs shadow-sm active:scale-95 ${
                              sol.estado_actual === 'subsanado' 
                                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/30 animate-pulse' 
                                : sol.estado_actual === 'aprobado' || sol.estado_actual === 'rechazado'
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-none'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                            }`}
                          >
                            <span>
                              {sol.estado_actual === 'subsanado' ? 'Revisar Corrección' : 
                               ['aprobado', 'rechazado', 'observado'].includes(sol.estado_actual) ? 'Ver Dictamen' : 
                               'Iniciar Evaluación'}
                            </span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* OVERLAY ANEXO L: ACUERDO DE CONFIDENCIALIDAD PARA REVISORES INVITADOS */}
      {mostrarOverlayAnexoL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-fade-in">
            <div className="text-center mb-6">
              <span className="text-4xl">🔏</span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Acuerdo de Confidencialidad y Compromiso Ético</h2>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mt-1">Anexo L - Revisor Invitado</p>
            </div>
            
            <div className="flex-1 overflow-y-auto text-sm text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 leading-relaxed mb-6 space-y-4">
              <p className="font-bold text-slate-800">CÓDIGO DE ÉTICA Y CONFIDENCIALIDAD DEL CIEI UNA-PUNO</p>
              <p>
                Como revisor externo/invitado del Comité Institucional de Ética en Investigación de la Universidad Nacional del Altiplano, me comprometo formalmente a mantener estricta confidencialidad respecto a toda la información contenida en los expedientes y protocolos de investigación que me sean asignados para evaluación.
              </p>
              <p>
                Entiendo que los documentos presentados por los investigadores constituyen propiedad intelectual bajo revisión y que revelar cualquier aspecto de los mismos a terceros, o utilizarlos para beneficio personal o académico propio, constituye una infracción ética gravísima.
              </p>
              <p>
                Asimismo, declaro que actuaré con objetividad científica, rigor académico e imparcialidad, ciñéndome estrictamente a los criterios bioéticos normados en el manual oficial del comité.
              </p>
            </div>

            <button 
              onClick={aceptarAnexoL}
              disabled={firmando}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/20 active:scale-95"
            >
              {firmando ? 'Firmando Acuerdo...' : 'Acepto y Firmo el Acuerdo de Confidencialidad (Anexo L)'}
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY ANEXO N: DECLARACIÓN JURADA DE CONFLICTO DE INTERÉS */}
      {mostrarOverlayAnexoN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-fade-in">
            <div className="text-center mb-6">
              <span className="text-4xl">⚖️</span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Declaración Jurada de Conflicto de Interés</h2>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-1">Anexo N - Declaración Anual Obligatoria</p>
            </div>

            <div className="flex-1 overflow-y-auto text-sm text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 leading-relaxed mb-6 space-y-4">
              <p className="font-bold text-slate-800">DECLARACIÓN JURADA DE AUSENCIA DE CONFLICTOS DE INTERÉS ({new Date().getFullYear()})</p>
              <p>
                Por la presente, declaro bajo juramento no tener ningún interés financiero, personal, profesional, societario o de filiación que pueda sesgar o comprometer la objetividad de mis evaluaciones técnicas para el Comité Institucional de Ética en Investigación (CIEI) de la Universidad Nacional del Altiplano.
              </p>
              <p>
                Me comprometo a notificar de forma inmediata a la Presidencia del Comité si durante la revisión de algún expediente detectase un posible conflicto de interés (tales como relaciones familiares, asesorías previas, coautoría de publicaciones o competencia académica directa con los investigadores postulantes) para que se proceda con mi inhibición y reasignación del expediente.
              </p>
            </div>

            <form onSubmit={firmarAnexoN} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Firma Digital (Escriba su Nombre y Apellidos Completos)</label>
                <input 
                  required
                  type="text" 
                  value={firmaCoI}
                  onChange={(e) => setFirmaCoI(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-slate-50/50"
                  placeholder="Ej: Dr. Juan Pérez Gómez"
                />
              </div>

              <button 
                type="submit"
                disabled={firmando}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-amber-600/20 active:scale-95"
              >
                {firmando ? 'Enviando Firma...' : 'Firmar y Enviar Declaración Jurada (Anexo N)'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}