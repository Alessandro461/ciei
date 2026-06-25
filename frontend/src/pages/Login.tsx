import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const MailIcon = () => (
  <svg className="w-5 h-5 text-slate-400 group-focus-within:text-[#B5944B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-slate-400 group-focus-within:text-[#B5944B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        correo_institucional: correo,
        password: password,
      });

      const usuarioLogueado = response.data.usuario;

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(usuarioLogueado));

      if (usuarioLogueado.rol === 'investigador') {
        navigate('/dashboard');
      } else if (usuarioLogueado.rol === 'revisor') {
        navigate('/revisor');
      } else {
        navigate('/comite');
      }

    } catch (err) {
      setError('Las credenciales ingresadas son incorrectas. Por favor, verifique su correo institucional y contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/20 flex font-sans overflow-x-hidden">
      
      {/* SECCIÓN IZQUIERDA: Estética Institucional KODIAK */}
      <div className="hidden lg:flex w-1/2 bg-[#0B132B] p-12 flex-col justify-center relative overflow-hidden">
        
        {/* Fondo simulando la red de nodos */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>
        
        {/* Líneas decorativas estilo red (decoración CSS) */}
        <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="20%" x2="100%" y2="80%" stroke="white" strokeWidth="1"/>
                <line x1="100%" y1="20%" x2="0" y2="80%" stroke="white" strokeWidth="1"/>
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="1"/>
            </svg>
        </div>
 
        <div className="z-10 max-w-xl mx-auto w-full">
          {/* Badge: Plataforma Activa */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 bg-slate-800/60 backdrop-blur-sm mb-8 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_#D4AF37]"></div>
            <span className="text-[11px] font-black tracking-widest text-[#D4AF37] uppercase">Plataforma Activa</span>
          </div>
 
          {/* Título Principal */}
          <h1 className="text-[3.5rem] font-black text-white leading-[1.1] tracking-tight mb-8">
            Comité de Ética en <br/>
            <span className="text-[#D4AF37]">Investigación</span> <br/>
            Científica
          </h1>
 
          <div className="bg-[#121E3A]/80 border border-slate-700/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl">
            <p className="text-lg !text-slate-200 font-medium leading-relaxed">
              Sistematizamos y agilizamos la evaluación de protocolos de investigación para proteger la vida, los derechos y la dignidad en estudios con humanos y animales.
            </p>
          </div>
        </div>
      </div>
 
      {/* SECCIÓN DERECHA: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex flex-col p-5 sm:p-8 md:p-12 lg:p-16 bg-white relative overflow-y-auto shadow-2xl">
        
        {/* LOGO CLIKEABLE (Lleva a la página principal) */}
        <div className="w-full max-w-md mx-auto mb-6 sm:mb-8">
          <Link to="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
            <img 
              src="/logo.png" 
              alt="Comité Institucional de Ética CIEI" 
              className="h-14 md:h-16 object-contain"
            />
          </Link>
        </div>
 
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B132B] tracking-tight">Iniciar Sesión</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1.5 sm:mt-2">Ingrese sus credenciales para acceder a la gestión de sus expedientes.</p>
          </div>
 
          {error && (
            <div className="bg-rose-500/10 border-l-4 border-rose-500 text-rose-800 p-4 rounded-xl mb-6 flex gap-3 items-start text-xs font-bold shadow-sm backdrop-blur-sm">
              <svg className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}
 
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Campo: Correo */}
            <div className="relative group">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-2 block group-focus-within:text-[#B5944B] transition-colors duration-200">
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 text-slate-400 group-focus-within:text-[#B5944B] transition-colors duration-200">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/10 focus:border-[#B5944B] outline-none transition-all duration-200 font-bold placeholder:font-medium placeholder:text-slate-400 text-xs shadow-sm"
                  placeholder="ejemplo@unap.edu.pe"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
            </div>
 
            {/* Campo: Contraseña */}
            <div className="relative group">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest group-focus-within:text-[#B5944B] transition-colors duration-200">
                  Contraseña
                </label>
                <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-[#B5944B] transition-colors underline decoration-slate-200 hover:decoration-[#B5944B]">
                  ¿Olvidó su clave?
                </a>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 text-slate-400 group-focus-within:text-[#B5944B] transition-colors duration-200">
                  <LockIcon />
                </div>
                <input
                  type={verPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/10 focus:border-[#B5944B] outline-none transition-all duration-200 font-bold placeholder:font-medium placeholder:text-slate-400 text-xs shadow-sm"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-4 text-slate-400 hover:text-[#B5944B] transition-colors p-1 cursor-pointer flex items-center justify-center"
                  title={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {verPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              </div>
            </div>
 
            {/* BOTONES */}
            <div className="pt-4 space-y-3">
              <button
                type="submit"
                className="w-full bg-[#0B132B] hover:bg-[#121E3A] text-white font-extrabold py-4 px-6 rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(11,19,43,0.15)] hover:shadow-[0_6px_20px_rgba(11,19,43,0.25)] hover:-translate-y-0.5 flex items-center justify-center gap-2 transform active:scale-[0.98] text-xs uppercase tracking-widest cursor-pointer border border-[#1E293B] group"
              >
                <span>Iniciar Sesión</span>
                <svg className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
 
              <button
                type="button"
                onClick={() => navigate('/registro')}
                className="w-full bg-slate-50 hover:bg-slate-100 text-[#0B132B] font-extrabold py-4 px-6 rounded-xl transition-all duration-300 shadow-sm border border-slate-200/85 hover:border-slate-300 flex items-center justify-center gap-2 transform active:scale-[0.98] text-xs uppercase tracking-widest cursor-pointer"
              >
                Registrarse
              </button>
            </div>
          </form>
 
        </div>
      </div>
    </div>
  );
}