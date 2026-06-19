import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    correo_institucional: '',
    dni: '', 
    rol: ''
  });

  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNueva: '',
    confirmarPassword: ''
  });

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('usuario');
        
        if (!token) {
          navigate('/login');
          return;
        }

        // 1. Carga rápida desde la memoria (Cambié el texto para que notes la diferencia)
        if (userStr) {
          const usuarioLocal = JSON.parse(userStr);
          setFormData({
            nombres: usuarioLocal.nombres || '',
            apellidos: usuarioLocal.apellidos || '',
            correo_institucional: usuarioLocal.correo_institucional || '',
            dni: usuarioLocal.dni || 'Buscando DNI en la base de datos...', 
            rol: usuarioLocal.rol || 'admin'
          });
        }

        // 2. Pedimos los datos al backend
        const res = await axios.get(`${API_URL}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const datosBD = res.data.usuario || res.data.perfil;
        
        // 🚨 ESTA ALERTA NOS DIRÁ LA VERDAD 🚨
        alert("¡CONEXIÓN EXITOSA! El backend envió: " + JSON.stringify(datosBD));

        // 3. Inyectamos los datos reales
        if (datosBD) {
          setFormData({
            nombres: datosBD.nombres || '',
            apellidos: datosBD.apellidos || '',
            correo_institucional: datosBD.correo_institucional || '',
            dni: datosBD.dni || '',
            rol: datosBD.rol || 'admin'
          });
          
          localStorage.setItem('usuario', JSON.stringify(datosBD));
        }

      } catch (error: any) {
        // 🚨 SI ALGO FALLA, AHORA LO VEREMOS 🚨
        alert("❌ ERROR DEL BACKEND. Código: " + (error.response?.status || error.message));
        console.error('Error detallado:', error);
      }
    };

    cargarPerfil();
  }, [navigate]);

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.passwordNueva !== passwordData.confirmarPassword) {
      return alert('Las contraseñas nuevas no coinciden.');
    }
    if (passwordData.passwordNueva && !passwordData.passwordActual) {
      return alert('Debes ingresar tu contraseña actual para poder cambiarla.');
    }

    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      
      // LA SOLUCIÓN 2: Ruta corregida a "/perfil" para guardar los datos
      const response = await axios.put(`${API_URL}/api/usuarios/perfil`, {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        correo_institucional: formData.correo_institucional,
        dni: formData.dni,
        passwordActual: passwordData.passwordActual,
        passwordNueva: passwordData.passwordNueva
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('usuario', JSON.stringify(response.data.usuario || {}));
      
      alert('¡Perfil actualizado con éxito!');
      setPasswordData({ passwordActual: '', passwordNueva: '', confirmarPassword: '' });
      
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar el perfil.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-red-500 selection:text-white">
      
      <nav className="bg-slate-950 text-white shadow-xl z-10 border-b border-slate-800 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(-1)}>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            </div>
            <div className="flex flex-col border-l border-slate-700 pl-4">
              <span className="font-black text-lg tracking-tight leading-none text-white">Mi Perfil</span>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Configuración de Cuenta</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 w-full flex-1">
        <form onSubmit={guardarCambios} className="space-y-8 animate-fade-in">
          
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_5px_20px_rgb(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 relative z-10">
              <span className="w-2 h-6 bg-red-600 rounded-full block"></span> Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombres 🔒</label>
                <input disabled type="text" value={formData.nombres} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed transition-all" title="Dato bloqueado por seguridad" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos 🔒</label>
                <input disabled type="text" value={formData.apellidos} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed transition-all" title="Dato bloqueado por seguridad" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Correo Institucional ✏️</label>
                <input required type="email" value={formData.correo_institucional} onChange={(e) => setFormData({...formData, correo_institucional: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Documento de Identidad (DNI) 🔒</label>
                <input type="text" disabled value={formData.dni} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed" title="Dato bloqueado por seguridad" />
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">Contacte soporte para modificar el DNI</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_5px_20px_rgb(0,0,0,0.03)]">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-2 h-6 bg-slate-900 rounded-full block"></span> Seguridad y Contraseña
            </h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">Si no deseas cambiar tu contraseña, deja estos campos en blanco.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña Actual</label>
                <input type="password" placeholder="••••••••" value={passwordData.passwordActual} onChange={(e) => setPasswordData({...passwordData, passwordActual: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nueva Contraseña</label>
                <input type="password" placeholder="Nueva clave" value={passwordData.passwordNueva} onChange={(e) => setPasswordData({...passwordData, passwordNueva: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirmar Nueva Contraseña</label>
                <input type="password" placeholder="Repite nueva clave" value={passwordData.confirmarPassword} onChange={(e) => setPasswordData({...passwordData, confirmarPassword: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={cargando}
              className={`bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl font-black tracking-wide shadow-lg transition-all ${cargando ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'}`}
            >
              {cargando ? 'Guardando...' : 'Guardar Todos los Cambios'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}