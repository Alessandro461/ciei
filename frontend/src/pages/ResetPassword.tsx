import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    if (!token) {
      setMensaje({
        tipo: 'error',
        texto: 'Falta el token de seguridad. Solicite un nuevo enlace de recuperación.'
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmarPassword) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    // Validación de complejidad de contraseña (mínimo 8 caracteres, al menos 1 letra y 1 número)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'La contraseña debe tener al menos 8 caracteres y contener letras y números.' 
      });
      return;
    }

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const response = await axios.post(`${API_URL}/api/auth/restablecer-password`, {
        token,
        password
      });

      setMensaje({ tipo: 'exito', texto: response.data.mensaje || 'Contraseña restablecida con éxito.' });
      setPassword('');
      setConfirmarPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.error || 'Error al restablecer la contraseña.'
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

      <div className="bg-[#121E3A]/90 border border-slate-700/50 backdrop-blur-md p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl relative z-10">
        
        {/* Cabecera del Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="CIEI UNA Puno" 
            className="h-16 mx-auto mb-4 object-contain filter brightness-110 drop-shadow-xl" 
          />
          <h2 className="text-2xl font-black text-white tracking-tight">Restablecer Contraseña</h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">Ingrese sus nuevas credenciales de acceso</p>
        </div>

        {/* Alertas */}
        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-xl border font-bold text-xs flex items-start gap-2.5 animate-fade-in ${
            mensaje.tipo === 'exito' 
              ? 'bg-emerald-950/55 text-emerald-300 border-emerald-500/20' 
              : 'bg-rose-950/55 text-rose-350 border-rose-500/20'
          }`}>
            <span className="text-sm shrink-0 mt-0.5">
              {mensaje.tipo === 'exito' ? '✅' : '⚠️'}
            </span>
            <div className="leading-relaxed">{mensaje.texto}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo: Nueva Contraseña */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Nueva Contraseña
            </label>
            <input 
              type="password"
              required
              disabled={!token || cargando}
              placeholder="Mínimo 8 caracteres (letras y números)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700/60 rounded-xl text-white bg-slate-900/50 focus:bg-slate-900 focus:ring-2 focus:ring-[#D4AF37]/10 focus:border-[#B5944B] outline-none transition-all duration-200 font-bold placeholder:font-medium placeholder:text-slate-500 text-xs shadow-inner"
            />
          </div>

          {/* Campo: Confirmar Contraseña */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Confirmar Nueva Contraseña
            </label>
            <input 
              type="password"
              required
              disabled={!token || cargando}
              placeholder="Repita la nueva contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700/60 rounded-xl text-white bg-slate-900/50 focus:bg-slate-900 focus:ring-2 focus:ring-[#D4AF37]/10 focus:border-[#B5944B] outline-none transition-all duration-200 font-bold placeholder:font-medium placeholder:text-slate-500 text-xs shadow-inner"
            />
          </div>

          <button 
            type="submit"
            disabled={!token || cargando}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              !token || cargando
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40 shadow-none'
                : 'bg-red-600 hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0 shadow-red-600/30'
            }`}
          >
            {cargando ? 'Restableciendo...' : 'Guardar Nueva Contraseña'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <Link 
            to="/login" 
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <span>← Regresar al Inicio de Sesión</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
