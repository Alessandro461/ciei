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
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        correo_institucional: correo,
        password: password,
      });

      const usuarioLogueado = response.data.usuario; // Extraemos los datos del usuario

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(usuarioLogueado));

      // EL SEMÁFORO INTELIGENTE: ¿A dónde lo enviamos según su rol?
      if (usuarioLogueado.rol === 'investigador') {
        navigate('/dashboard'); // Investigadores van a su panel
      } else if (usuarioLogueado.rol === 'revisor') {
        navigate('/revisor'); // Revisores van a su panel
      } else {
        navigate('/comite'); // Administradores, Presidentes y Secretarios van a la Sala de Control
      }

    } catch (err) {
      setError('Las credenciales ingresadas son incorrectas. Por favor, verifique su correo institucional y contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">
      
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
 
          {/* Tarjeta translúcida de información */}
          <div className="bg-[#121E3A]/80 border border-slate-700/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl">
            <p className="text-lg text-slate-350 font-medium leading-relaxed">
              Sistematizamos y agilizamos la evaluación de protocolos de investigación para proteger la vida, los derechos y la dignidad en estudios con humanos y animales.
            </p>
          </div>
        </div>
      </div>
 
      {/* SECCIÓN DERECHA: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 md:p-16 bg-white relative overflow-y-auto">
        
        {/* LOGO CLIKEABLE (Lleva a la página principal) */}
        <div className="w-full max-w-md mx-auto mb-10">
          <Link to="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
            <img 
              src="/logo.png" 
              alt="Comité Institucional de Ética CIEI" 
              className="h-12 md:h-16 object-contain"
            />
          </Link>
        </div>
 
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Ingrese sus credenciales para acceder a la gestión de sus expedientes.</p>
          </div>
 
          {error && (
            <div className="bg-red-50 border-l-4 border-rose-500 text-red-800 p-4 rounded-r-xl mb-8 flex gap-3 items-start text-sm shadow-sm">
              <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span className="font-medium">{error}</span>
            </div>
          )}
 
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Campo: Correo */}
            <div className="relative group">
              <label className="text-[11px] font-black text-slate-500 tracking-wider uppercase mb-1.5 block group-focus-within:text-[#B5944B] transition-colors">
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-[#B5944B] outline-none transition-all duration-200 font-bold placeholder:font-medium placeholder:text-slate-400 text-xs"
                  placeholder="ejemplo@unap.edu.pe"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
            </div>
 
            {/* Campo: Contraseña */}
            <div className="relative group">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-black text-slate-500 tracking-wider uppercase group-focus-within:text-[#B5944B] transition-colors">
                  Contraseña
                </label>
                <a href="#" className="text-[11px] font-bold text-slate-500 hover:text-[#B5944B] transition-colors underline decoration-slate-300 hover:decoration-[#B5944B]">
                  ¿Olvidó su clave?
                </a>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-[#B5944B] outline-none transition-all duration-200 font-bold placeholder:font-medium placeholder:text-slate-400 text-xs"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
 
            {/* BOTONES */}
            <div className="pt-4 space-y-3">
              <button
                type="submit"
                className="w-full bg-[#0B132B] hover:bg-[#121E3A] text-white font-black py-4 px-6 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(11,19,43,0.25)] hover:shadow-[0_6px_20px_rgba(11,19,43,0.35)] flex items-center justify-center gap-2 transform active:scale-[0.98] text-xs uppercase tracking-wider cursor-pointer border border-[#1E293B]"
              >
                <span>Iniciar Sesión</span>
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
 
              <button
                type="button"
                onClick={() => navigate('/registro')} // Redirige a la pantalla de crear cuenta
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 px-6 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 transform active:scale-[0.98] text-xs uppercase tracking-wider cursor-pointer border border-slate-200"
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