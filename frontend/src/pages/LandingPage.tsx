import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import axios from 'axios';

// Variable de entorno dinámica para despliegue
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

// Truco maestro para Vite
(window as any).THREE = THREE;

// @ts-ignore
import 'vanta/dist/vanta.net.min';

const CRONOGRAMA_DATA = [
  {
    mes: 'MARZO',
    fechas: [
      { limite: '21/03/2025', programada: '26/03/2025' }
    ]
  },
  {
    mes: 'ABRIL',
    fechas: [
      { limite: '04/04/2025', programada: '09/04/2025' },
      { limite: '18/04/2025', programada: '23/04/2025' }
    ]
  },
  {
    mes: 'MAYO',
    fechas: [
      { limite: '02/05/2025', programada: '07/05/2025' },
      { limite: '16/05/2025', programada: '21/05/2025' },
      { limite: '29/05/2025', programada: '04/06/2025' }
    ]
  },
  {
    mes: 'JUNIO',
    fechas: [
      { limite: '12/06/2025', programada: '18/06/2025' }
    ]
  },
  {
    mes: 'JULIO',
    fechas: [
      { limite: '03/07/2025', programada: '09/07/2025' },
      { limite: '17/07/2025', programada: '23/07/2025' },
      { limite: '31/07/2025', programada: '06/08/2025' }
    ]
  },
  {
    mes: 'AGOSTO',
    fechas: [
      { limite: '14/08/2025', programada: '20/08/2025' }
    ]
  },
  {
    mes: 'SETIEMBRE',
    fechas: [
      { limite: '28/08/2025', programada: '03/09/2025' },
      { limite: '11/09/2025', programada: '17/09/2025' }
    ]
  },
  {
    mes: 'OCTUBRE',
    fechas: [
      { limite: '02/10/2025', programada: '08/10/2025' },
      { limite: '16/10/2025', programada: '22/10/2025' },
      { limite: '30/10/2025', programada: '05/11/2025' }
    ]
  },
  {
    mes: 'NOVIEMBRE',
    fechas: [
      { limite: '13/11/2025', programada: '19/11/2025' },
      { limite: '27/11/2025', programada: '03/12/2025' }
    ]
  },
  {
    mes: 'DICIEMBRE',
    fechas: [
      { limite: '11/12/2025', programada: '17/12/2025' }
    ]
  }
];

export default function LandingPage() {
  const vantaRef = useRef<HTMLDivElement>(null);

  // --- ESTADOS DINÁMICOS DEL PORTAL ---
  const [videoUrl, setVideoUrl] = useState("https://vriunap.pe/vriadds/etica/img/videoetica.mp4");
  const [avisos, setAvisos] = useState<any[]>([]);
  const [formatos, setFormatos] = useState<any[]>([]);
  const [categoriaFormatoActiva, setCategoriaFormatoActiva] = useState<'humanos' | 'animales'>('humanos');
  
  // Estado para la ventana de "Ver todos los avisos"
  const [modalAvisosAbierto, setModalAvisosAbierto] = useState(false);
  
  // Estado para el menú de navegación en celulares/móviles
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  // Inicializar Vanta.js
  useEffect(() => {
    let vantaInstance: any = null;
    if (vantaRef.current && (window as any).VANTA) {
      vantaInstance = (window as any).VANTA.NET({
        el: vantaRef.current,
        THREE: THREE,
        color: 0xeab308, 
        backgroundColor: 0x0f172a, 
        points: 13.00,
        maxDistance: 20.00,
        spacing: 20.00,
        showDots: true
      });
      // Vanta initialized
    }
    return () => {
      if (vantaInstance) vantaInstance.destroy();
    };
  }, []);

  // --- CONEXIÓN CON EL BACKEND ---
  useEffect(() => {
    const cargarContenidoPortal = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/portal/contenido`);
        if (response.data.videoUrl) setVideoUrl(response.data.videoUrl);
        if (response.data.avisos) setAvisos(response.data.avisos);
      } catch (error) {
        console.log("No se pudo cargar el portal dinámico.");
      }
    };

    const cargarFormatos = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/portal/formatos/metadatos`);
        setFormatos(res.data);
      } catch (error) {
        console.error("Error cargando formatos");
      }
    };

    cargarContenidoPortal();
    cargarFormatos();
  }, []);

  // Solo mostramos los 4 más recientes en la vista principal
  const avisosRecientes = avisos.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col scroll-smooth selection:bg-red-500 selection:text-white overflow-x-hidden">
      
      {/* NAVEGACIÓN */}
      <nav className="fixed w-full top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex justify-between h-16 sm:h-20 items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <img src="/logo.png" alt="Logo CIEI" className="h-10 sm:h-12 hover:scale-105 transition-transform" />
            <div className="hidden sm:flex flex-col border-l-2 border-slate-300 pl-3">
              <span className="font-extrabold tracking-tight text-slate-900 text-xl leading-tight">CIEI</span>
              <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest">UNA Puno</span>
            </div>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-bold text-slate-600">
            <a href="#procedimientos" className="hover:text-red-600 transition-colors">Procedimientos</a>
            <a href="#proyecto" className="hover:text-red-600 transition-colors">Proyecto</a>
            <a href="#formatos" className="hover:text-red-600 transition-colors">Formatos Oficiales</a>
            <a href="#avisos" className="hover:text-red-600 transition-colors">Avisos</a>
          </div>
          
          <div className="hidden md:block">
            <Link to="/login" className="bg-slate-900 hover:bg-slate-800 text-yellow-400 px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-lg hover:-translate-y-1 border border-slate-700 block">
              Portal del Sistema
            </Link>
          </div>

          {/* Botón menú móvil (Hamburguesa) */}
          <div className="flex md:hidden items-center gap-3">
            <Link to="/login" className="bg-slate-900 text-yellow-400 px-4 py-2 rounded-xl font-extrabold text-xs border border-slate-700">
              Portal
            </Link>
            <button 
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} 
              className="text-slate-700 hover:text-red-650 p-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              {menuMovilAbierto ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {menuMovilAbierto && (
        <div className="md:hidden fixed top-16 sm:top-20 inset-x-0 bg-white border-b border-slate-200 z-30 shadow-lg animate-fade-in p-5 flex flex-col gap-4">
          <a href="#procedimientos" onClick={() => setMenuMovilAbierto(false)} className="text-slate-700 font-bold hover:text-red-650 transition-colors py-2 border-b border-slate-100">Procedimientos</a>
          <a href="#proyecto" onClick={() => setMenuMovilAbierto(false)} className="text-slate-700 font-bold hover:text-red-650 transition-colors py-2 border-b border-slate-100">Proyecto</a>
          <a href="#formatos" onClick={() => setMenuMovilAbierto(false)} className="text-slate-700 font-bold hover:text-red-650 transition-colors py-2 border-b border-slate-100">Formatos Oficiales</a>
          <a href="#avisos" onClick={() => setMenuMovilAbierto(false)} className="text-slate-700 font-bold hover:text-red-650 transition-colors py-2">Avisos</a>
        </div>
      )}

      <main className="flex-1">
        {/* SECCIÓN HERO */}
        <section ref={vantaRef} className="relative pt-24 pb-12 sm:pt-32 sm:pb-20 lg:pt-44 lg:pb-32 min-h-screen flex items-center border-b-8 border-red-600 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 border border-white/20 text-yellow-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 sm:mb-8 backdrop-blur-md shadow-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
                </span>
                Plataforma Activa
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-6 sm:mb-8 tracking-tight leading-[1.1] drop-shadow-2xl">
                Comité de Ética en <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-white">
                  Investigación Científica
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-10 font-medium leading-relaxed max-w-2xl backdrop-blur-sm bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl">
                Sistematizamos y agilizamos la evaluación de protocolos de investigación para proteger la vida, los derechos y la dignidad en estudios con humanos y animales.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to="/login" className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_25px_rgba(220,38,38,0.6)] px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold transition-all hover:-translate-y-1 flex items-center justify-center gap-2 text-base sm:text-lg">
                  Iniciar Sesión
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </Link>
                <Link to="/registro" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold transition-all backdrop-blur-md flex items-center justify-center text-base sm:text-lg">
                  Registrarse
                </Link>
              </div>
            </div>

            {/* VIDEO KODIAK INTELIGENTE */}
            <div className="lg:col-span-5 relative group perspective w-full">
              <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-yellow-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black aspect-video transform transition-transform duration-500 hover:scale-[1.02]">
                
                {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${
                      videoUrl.includes('v=') ? videoUrl.split('v=')[1].split('&')[0] : videoUrl.split('youtu.be/')[1]?.split('?')[0]
                    }?autoplay=1&mute=1&loop=1&playlist=${
                      videoUrl.includes('v=') ? videoUrl.split('v=')[1].split('&')[0] : videoUrl.split('youtu.be/')[1]?.split('?')[0]
                    }`}
                    title="Video Institucional"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video controls autoPlay loop muted className="w-full h-full object-contain bg-black" src={videoUrl} />
                )}

              </div>
              <div className="absolute -bottom-4 right-4 z-20">
                <span className="bg-slate-900 border border-slate-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Video Institucional
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* SECCIÓN PROCEDIMIENTOS Y CRONOGRAMA */}
        <section id="procedimientos" className="py-12 sm:py-16 lg:py-24 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-red-600 font-black tracking-widest uppercase text-xs sm:text-sm mb-2 block">Planificación Académica</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4">Procedimientos y Cronograma de Evaluación 2025</h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg">Consulte los plazos máximos para el envío de proyectos y las reuniones de evaluación programadas por el Comité.</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Proceso Informativo */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-2.5 h-7 bg-red-600 rounded-full block"></span> Presentación
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-extrabold text-sm border border-red-200 shadow-sm">1</div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base mb-1">Descargar Formatos</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Elija los formatos oficiales de la sección de descargas según sea investigación en humanos o animales.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 font-extrabold text-sm border border-yellow-200 shadow-sm">2</div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base mb-1">Completar Datos</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Redacte el protocolo y complete los formatos requeridos con la información detallada del equipo y la metodología.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 font-extrabold text-sm border border-slate-800 shadow-md">3</div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base mb-1">Registrar y Subir</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">Inicie sesión en el portal, suba los documentos en formato PDF y envíe el expediente digitalizado para revisión.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0 font-extrabold text-sm border border-green-200 shadow-sm">4</div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base mb-1">Sesión del Comité</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">El Comité se reúne ordinariamente en las fechas programadas y emite el dictamen final del expediente.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de Fechas */}
              <div className="lg:col-span-8">
                <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-md bg-white">
                  <div className="overflow-x-auto table-responsive">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider border-b border-slate-800">
                          <th className="px-3 sm:px-6 py-3 sm:py-5 font-black text-center w-1/4 border-r border-slate-800 text-[10px] sm:text-[11px]">Mes</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-5 font-black text-center w-3/8 border-r border-slate-800 text-[10px] sm:text-[11px]">Fecha Límite para Envío</th>
                          <th className="px-3 sm:px-6 py-3 sm:py-5 font-black text-center w-3/8 text-[10px] sm:text-[11px]">Fecha Programada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CRONOGRAMA_DATA.flatMap((mesData, mesIdx) => 
                          mesData.fechas.map((fecha, fechaIdx) => {
                            // Alternar fondo para legibilidad
                            const isEvenMes = mesIdx % 2 === 0;
                            return (
                              <tr 
                                key={`${mesIdx}-${fechaIdx}`} 
                                className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                  isEvenMes ? 'bg-slate-50/30' : 'bg-white'
                                }`}
                              >
                                {fechaIdx === 0 && (
                                  <td 
                                    rowSpan={mesData.fechas.length} 
                                    className="px-3 sm:px-6 py-3 sm:py-5 font-black text-slate-800 border-r border-slate-200 align-middle text-center uppercase tracking-wide bg-slate-50/60 text-xs sm:text-sm"
                                  >
                                    {mesData.mes}
                                  </td>
                                )}
                                <td className="px-3 sm:px-6 py-3 sm:py-5 text-slate-600 font-semibold border-r border-slate-100 text-center">
                                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-red-50 text-red-600 text-[10px] sm:text-xs font-extrabold border border-red-100 shadow-sm">
                                    <svg className="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    {fecha.limite}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-5 text-slate-600 font-semibold text-center">
                                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-yellow-50 text-yellow-600 text-[10px] sm:text-xs font-extrabold border border-yellow-200 shadow-sm">
                                    <svg className="w-3.5 h-3.5 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    {fecha.programada}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN PROYECTO - PROCEDIMIENTOS DE PRESENTACIÓN */}
        <section id="proyecto" className="py-12 sm:py-16 lg:py-24 bg-slate-50 border-b border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-red-600 font-black tracking-widest uppercase text-xs sm:text-sm mb-2 block">Flujo de Trámite</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4">Procedimientos de Presentación</h2>
              <p className="text-slate-500 max-w-3xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed">
                Los proyectos deberán ser presentados como máximo <span className="font-extrabold text-red-600">cuatro días antes</span> de la reunión ordinaria programada. Estos, junto con los formatos, deberán ser presentados a través del correo <a href="mailto:ciei@unap.edu.pe" className="text-red-600 hover:underline font-extrabold">ciei@unap.pe</a>.
              </p>
            </div>

            {/* VISTA DE DIAGRAMA DE FLUJO PREMIUM (Desktop) */}
            <div className="hidden lg:block relative max-w-5xl mx-auto py-8">
              
              {/* Línea conectora central vertical detrás de los pasos */}
              <div className="absolute left-1/2 top-4 bottom-20 w-0.5 bg-slate-300 -translate-x-1/2 pointer-events-none"></div>

              <div className="flex flex-col items-center gap-12 relative">
                
                {/* INICIO */}
                <div className="relative z-10 bg-slate-950 border border-slate-800 text-yellow-400 font-extrabold px-10 py-3.5 rounded-full shadow-lg tracking-widest uppercase text-sm hover:scale-105 transition-transform duration-300">
                  Inicio
                </div>

                {/* PASO 1 */}
                <div className="relative z-10 bg-white border border-slate-200 p-6 rounded-2xl shadow-md text-center max-w-md w-full hover:border-yellow-400 hover:shadow-lg transition-all duration-300">
                  <div className="absolute -top-3 left-6 bg-red-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">Paso 1</div>
                  <p className="font-extrabold text-slate-800 text-sm leading-relaxed">
                    Descargar y completar los formatos de acuerdo al tipo de investigación.
                  </p>
                </div>

                {/* PASO 2 */}
                <div className="relative z-10 bg-white border border-slate-200 p-6 rounded-2xl shadow-md text-center max-w-md w-full hover:border-yellow-400 hover:shadow-lg transition-all duration-300">
                  <div className="absolute -top-3 left-6 bg-red-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">Paso 2</div>
                  <p className="font-extrabold text-slate-800 text-sm leading-relaxed mb-3">
                    Presentar solicitud simple del investigador para evaluación del CIEI, adjuntando los formatos al correo:
                  </p>
                  <a href="mailto:ciei@unap.edu.pe" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-yellow-400 text-xs font-bold font-mono border border-slate-800 shadow-inner hover:scale-[1.03] transition-transform">
                    ciei@unap.edu.pe
                  </a>
                </div>

                {/* EVALUACIÓN - DIAMANTE CENTRAL */}
                <div className="relative my-4 flex items-center justify-center w-full z-10">
                  
                  {/* El Diamante */}
                  <div className="w-56 h-56 bg-slate-950 border-2 border-red-600 text-white flex items-center justify-center p-6 text-center shadow-xl rotate-45 rounded-3xl group hover:scale-[1.02] transition-transform duration-300">
                    <div className="-rotate-45">
                      <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest block mb-2">Evaluación</span>
                      <p className="font-black text-sm leading-tight text-white px-2">¿El proyecto se encuentra apto?</p>
                    </div>
                  </div>

                  {/* CAMINO NO (Izquierda) */}
                  <div className="absolute right-[calc(50%+9rem)] top-1/2 -translate-y-1/2 flex flex-col items-center">
                    
                    {/* Línea horizontal hacia la izquierda */}
                    <div className="absolute left-[100%] top-12 w-20 h-0.5 bg-red-600 flex items-center justify-center">
                      <span className="bg-red-550 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200 -translate-y-3 block bg-red-50">NO</span>
                    </div>

                    {/* Líneas de retorno visual */}
                    <div className="absolute right-[22rem] top-12 bottom-[-16rem] w-0.5 bg-red-400 border-dashed pointer-events-none"></div>
                    <div className="absolute right-[22rem] top-12 w-12 h-0.5 bg-red-400 border-dashed pointer-events-none"></div>
                    <div className="absolute right-[12rem] top-[-8rem] w-[10rem] h-0.5 bg-red-400 border-dashed pointer-events-none"></div>

                    <div className="space-y-10 relative">
                      {/* Caja Observed */}
                      <div className="relative bg-white border border-red-200 p-5 rounded-2xl shadow-md text-center w-60 hover:border-red-400 transition-colors">
                        <span className="absolute -top-3 left-4 bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-200">Revisión</span>
                        <p className="font-extrabold text-slate-800 text-xs leading-relaxed">
                          CIEI emite carta con observaciones.
                        </p>
                      </div>

                      {/* Flecha Abajo */}
                      <div className="flex justify-center">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>

                      {/* Caja Absolver */}
                      <div className="relative bg-white border border-red-200 p-5 rounded-2xl shadow-md text-center w-60 hover:border-red-400 transition-colors">
                        <span className="absolute -top-3 left-4 bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-200">Acción</span>
                        <p className="font-extrabold text-slate-800 text-xs leading-relaxed">
                          El Investigador absuelve las observaciones.
                        </p>
                        <div className="absolute left-0 top-1/2 -translate-x-6 w-6 h-0.5 bg-red-400 border-dashed"></div>
                      </div>
                    </div>
                  </div>

                  {/* CAMINO SÍ (Derecha) */}
                  <div className="absolute left-[calc(50%+9rem)] top-1/2 -translate-y-1/2 flex flex-col items-center">
                    
                    {/* Línea horizontal hacia la derecha */}
                    <div className="absolute right-[100%] top-12 w-20 h-0.5 bg-green-600 flex items-center justify-center">
                      <span className="bg-green-550 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-200 -translate-y-3 block bg-green-550">SÍ</span>
                    </div>

                    <div className="space-y-10">
                      {/* Caja Aprobado */}
                      <div className="relative bg-white border border-green-200 p-5 rounded-2xl shadow-md text-center w-60 hover:border-green-400 transition-colors">
                        <span className="absolute -top-3 left-4 bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200">Aprobación</span>
                        <p className="font-extrabold text-slate-800 text-xs leading-relaxed">
                          Se aprueba el proyecto.
                        </p>
                      </div>

                      {/* Flecha Abajo */}
                      <div className="flex justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>

                      {/* Caja Constancia Documento */}
                      <div className="relative bg-white border border-green-200 p-5 rounded-t-2xl rounded-b-[24px] shadow-md text-center w-60 hover:border-green-400 transition-all border-b-4 border-b-green-500">
                        <span className="absolute -top-3 left-4 bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200">Constancia</span>
                        <p className="font-extrabold text-slate-800 text-xs leading-relaxed">
                          Emisión de constancia de aprobación.
                        </p>
                        <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 via-emerald-400 to-green-600 rounded-b-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flecha de Cierre desde la Aprobación al Fin */}
                <div className="absolute right-[calc(50%-18.5rem)] bottom-[4.5rem] w-0.5 h-16 bg-green-500"></div>
                <div className="absolute right-[calc(50%-18.5rem)] bottom-[4.5rem] w-[18.5rem] h-0.5 bg-green-500"></div>

                {/* FIN */}
                <div className="relative z-10 bg-slate-950 border border-slate-800 text-yellow-400 font-extrabold px-10 py-3.5 rounded-full shadow-lg tracking-widest uppercase text-sm hover:scale-105 transition-transform duration-300">
                  Fin
                </div>
              </div>
            </div>

            {/* VISTA DE LISTA DE FLUJO RESPONSIVE (Mobile) */}
            <div className="lg:hidden space-y-8 max-w-md mx-auto">
              
              <div className="relative pl-8 border-l-2 border-slate-200 space-y-8">
                
                {/* Paso 1 */}
                <div className="relative">
                  <div className="absolute -left-11 top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-yellow-400 flex items-center justify-center text-[10px] text-yellow-400 font-black">1</div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-extrabold text-slate-900 text-sm mb-1">Descargar Formatos</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Descargar y completar los formatos de acuerdo al tipo de investigación.</p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="relative">
                  <div className="absolute -left-11 top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-yellow-400 flex items-center justify-center text-[10px] text-yellow-400 font-black">2</div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-extrabold text-slate-900 text-sm mb-2">Presentar Solicitud</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      Presentar solicitud simple del investigador para evaluación del CIEI, adjuntando los formatos a:
                    </p>
                    <a href="mailto:ciei@unap.edu.pe" className="inline-block bg-slate-900 text-yellow-400 text-[10px] font-bold font-mono px-3 py-1 rounded-lg border border-slate-800">
                      ciei@unap.edu.pe
                    </a>
                  </div>
                </div>

                {/* Paso 3 (Decision) */}
                <div className="relative">
                  <div className="absolute -left-11 top-0 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-black">?</div>
                  <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
                    <h4 className="font-black text-yellow-400 text-sm mb-1 uppercase tracking-wider">Evaluación del Proyecto</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">¿El proyecto se encuentra apto para aprobación?</p>
                  </div>
                </div>

                {/* Path No */}
                <div className="relative border-l-2 border-red-200 pl-6 ml-1 space-y-4">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase">Si es Observado (No)</span>
                  
                  <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm space-y-2">
                    <p className="text-xs font-extrabold text-slate-800">1. CIEI emite carta con observaciones.</p>
                    <p className="text-xs font-extrabold text-slate-800">2. El Investigador absuelve las observaciones (retorna a evaluación).</p>
                  </div>
                </div>

                {/* Path Sí */}
                <div className="relative border-l-2 border-green-200 pl-6 ml-1 space-y-4">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">Si es Favorable (Sí)</span>
                  
                  <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm space-y-2">
                    <p className="text-xs font-extrabold text-slate-800">1. Se aprueba el proyecto.</p>
                    <p className="text-xs font-extrabold text-slate-800">2. Emisión de constancia de aprobación.</p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* SECCIÓN AVISOS DINÁMICA */}
        <section id="avisos" className="py-12 sm:py-16 lg:py-24 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-red-600 font-black tracking-widest uppercase text-xs sm:text-sm mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Últimas Noticias
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900">Avisos del Comité</h2>
              </div>
              {avisos.length > 4 && (
                <button 
                  onClick={() => setModalAvisosAbierto(true)}
                  className="text-slate-500 hover:text-red-600 font-bold flex items-center gap-1 transition-colors bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
                >
                  Ver todos los avisos ({avisos.length}) <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              )}
            </div>

            {avisos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                <p className="text-slate-500 font-bold">No hay avisos publicados en este momento.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                {avisosRecientes.map((aviso) => (
                  <div key={aviso.id} className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_10px_30px_rgb(0,0,0,0.04)] border border-slate-200 hover:border-yellow-400 hover:shadow-xl transition-all group flex flex-col">
                    
                    {aviso.imagen_url && (
                      <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                        <img src={aviso.imagen_url} alt="Imagen adjunta" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <span className={`bg-${aviso.color}-100 text-${aviso.color}-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>
                        {aviso.tipo}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">Publicado: {aviso.fecha}</span>
                    </div>
                    
                    <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 mb-4 group-hover:text-red-600 transition-colors">
                      {aviso.titulo}
                    </h3>
                    <p className="text-slate-600 mb-6 whitespace-pre-wrap flex-1">{aviso.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECCIÓN FORMATOS OFICIALES DINÁMICOS */}
        <section id="formatos" className="bg-slate-900 py-12 sm:py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-10">
              <span className="text-yellow-400 font-black tracking-widest uppercase text-xs sm:text-sm mb-2 block">Descargas Necesarias</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">Formatos Oficiales</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg">Descargue las plantillas, complételas y adjúntelas dentro de la plataforma al enviar su expediente.</p>
            </div>

            {/* Selector de Categorías (Humanos vs Animales) */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
              <button 
                onClick={() => setCategoriaFormatoActiva('humanos')} 
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  categoriaFormatoActiva === 'humanos' 
                    ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/20' 
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-750'
                }`}
              >
                🔬 <span className="hidden sm:inline">Investigación en </span>Humanos
              </button>
              <button 
                onClick={() => setCategoriaFormatoActiva('animales')} 
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  categoriaFormatoActiva === 'animales' 
                    ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/20' 
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-750'
                }`}
              >
                🐾 <span className="hidden sm:inline">Investigación en </span>Animales
              </button>
            </div>
            
            {formatos.filter(f => (f.categoria || 'humanos') === categoriaFormatoActiva).length === 0 ? (
              <div className="text-center py-10 bg-slate-800/50 rounded-3xl border border-slate-700 border-dashed">
                <p className="text-slate-400 font-bold">No hay formatos subidos para esta categoría en este momento.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                {formatos
                  .filter(f => (f.categoria || 'humanos') === categoriaFormatoActiva)
                  .map((formato) => {
                    const esPDF = formato.titulo.toLowerCase().includes('pdf');
                    return (
                      <div key={formato.id} className="bg-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-700 hover:border-yellow-400 hover:-translate-y-2 transition-all duration-300 group flex flex-col">
                        <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center text-yellow-400 mb-6 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-all">
                          {esPDF ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                          ) : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          )}
                        </div>
                        <h3 className="font-black text-white text-xl mb-3 flex-1 leading-tight">{formato.titulo}</h3>
                        
                        {formato.nombre_archivo_original ? (
                          <button onClick={() => window.open(`${API_URL}/api/portal/formatos/descargar/${formato.id}`)} className="w-full bg-slate-700 text-white font-extrabold py-3.5 mt-4 rounded-xl flex items-center justify-center gap-2 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors shadow-lg cursor-pointer">
                            Descargar Archivo <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          </button>
                        ) : (
                          <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-3.5 mt-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700 cursor-not-allowed">
                            Archivo no disponible
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* PIE DE PÁGINA (Con Tooltip KODIAK) */}
      <footer className="bg-slate-950 text-slate-400 pt-12 sm:pt-20 pb-8 border-t-8 border-red-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-12 mb-10 sm:mb-16">
            <div className="sm:col-span-2 md:col-span-5">
              <img src="/logovri.png" alt="VRI UNA Puno" className="h-12 sm:h-16 mb-4 sm:mb-6 drop-shadow-xl" />
              <p className="text-slate-400 font-medium leading-relaxed mb-6 max-w-sm text-sm sm:text-base">Plataforma de Investigación y Desarrollo, garantizando los más altos estándares éticos y metodológicos en la ciencia de nuestra región.</p>
            </div>
            <div className="md:col-span-3">
              <h4 className="text-white font-black text-xl mb-6 tracking-wide">Enlaces</h4>
              <ul className="space-y-4 font-medium">
                <li><a href="#" className="hover:text-red-500 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Mesa Virtual</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Repositorio</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Reglamentos</a></li>
              </ul>
            </div>
            <div className="md:col-span-4">
              <h4 className="text-white font-black text-xl mb-6 tracking-wide">Contacto Oficial</h4>
              <ul className="space-y-5 font-medium">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-red-500 shadow-inner"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                  <span className="mt-1.5">Av. Floral Nº 1153, Ciudad Universitaria<br/>Puno - Perú</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-red-500 shadow-inner"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
                  <span>ciei.vri@unap.edu.pe</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 sm:pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
            <p className="text-slate-500 text-center md:text-left">© 2026 Universidad Nacional del Altiplano. Todos los derechos reservados.</p>
            
            {/* TOOLTIP KODIAK */}
            <div className="relative group cursor-help flex items-center gap-3 bg-slate-900 px-5 py-2.5 rounded-full border border-slate-800 shadow-inner transition-all hover:border-red-500/30">
              <span className="text-slate-500">Desarrollado por</span>
              <span className="font-black tracking-widest text-white group-hover:text-red-500 transition-colors">@KODIAK</span>
              <img src="/kodiak.png" alt="Kodiak" className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              
              {/* Burbuja flotante con el correo */}
              <div className="absolute bottom-[110%] right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                <div className="bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl whitespace-nowrap flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  eduardobox2@gmail.com
                </div>
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
              </div>
            </div>

          </div>
        </div>
      </footer>

      {/* MODAL GIGANTE DE AVISOS HISTÓRICOS */}
      {modalAvisosAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-slate-50 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden animate-fade-in border border-slate-200">
            <div className="bg-white px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-3 h-8 bg-red-600 rounded-full block"></span> Historial de Comunicados
              </h3>
              <button onClick={() => setModalAvisosAbierto(false)} className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-full flex items-center justify-center font-bold transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {avisos.map((aviso) => (
                <div key={aviso.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                  {aviso.imagen_url && (
                    <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                      <img src={aviso.imagen_url} alt="Aviso" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`bg-${aviso.color}-100 text-${aviso.color}-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider`}>
                        {aviso.tipo}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">{aviso.fecha}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">{aviso.titulo}</h4>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{aviso.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}