import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Perfil() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const [firmaImagenRuta, setFirmaImagenRuta] = useState<string | null>(null);
  const [subiendoFirma, setSubiendoFirma] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    correo_institucional: '',
    telefono: '',
    facultad: '',
    escuela_profesional: '',
    tipo_investigador: 'estudiante_pregrado',
    passwordActual: '',
    passwordNueva: ''
  });

  // Cargar los datos del usuario al entrar a la pantalla
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('usuario');

        if (!token) {
          navigate('/login');
          return;
        }

        // 1. CARGA RÁPIDA (Desde la memoria del navegador) para que no se vea vacío
        if (userStr) {
          const usuarioLocal = JSON.parse(userStr);
          setFormData(prev => ({
            ...prev,
            nombres: usuarioLocal.nombres || '',
            apellidos: usuarioLocal.apellidos || '',
            dni: usuarioLocal.dni || 'Cargando...',
            correo_institucional: usuarioLocal.correo_institucional || '',
            telefono: usuarioLocal.telefono || '',
            facultad: usuarioLocal.facultad || '',
            escuela_profesional: usuarioLocal.escuela_profesional || '',
            tipo_investigador: usuarioLocal.tipo_investigador || 'estudiante_pregrado'
          }));
          setFirmaImagenRuta(usuarioLocal.firma_imagen_ruta || null);
        }

        // 2. CONEXIÓN REAL: Pedimos los datos a la ruta corregida "/perfil"
        const res = await axios.get(`${API_URL}/api/usuarios/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const perfil = res.data.usuario || res.data.perfil;
        
        // 3. INYECCIÓN: Llenamos el formulario con los datos 100% reales de la BD
        if (perfil) {
          setFormData(prev => ({
            ...prev,
            nombres: perfil.nombres || '',
            apellidos: perfil.apellidos || '',
            dni: perfil.dni || 'No registrado',
            correo_institucional: perfil.correo_institucional || '',
            telefono: perfil.telefono || '',
            facultad: perfil.facultad || '',
            escuela_profesional: perfil.escuela_profesional || '',
            tipo_investigador: perfil.tipo_investigador || 'estudiante_pregrado'
          }));
          setFirmaImagenRuta(perfil.firma_imagen_ruta || null);

          // Mantenemos la memoria sincronizada con la base de datos
          localStorage.setItem('usuario', JSON.stringify(perfil));
        }

      } catch (error: any) {
        console.error('Error al conectar con el backend:', error);
        setMensaje({ 
          tipo: 'error', 
          texto: `No se pudo conectar con el servidor (Error ${error.response?.status || 'desconocido'}).` 
        });
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [navigate]);

  const manejarSubidaFirma = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFirma(true);
    setMensaje({ tipo: '', texto: '' });

    const formDataFirma = new FormData();
    formDataFirma.append('firma', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/usuarios/perfil/firma`, formDataFirma, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFirmaImagenRuta(res.data.firma_imagen_ruta);
      
      // Actualizar firma en el localStorage
      const userStr = localStorage.getItem('usuario');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.firma_imagen_ruta = res.data.firma_imagen_ruta;
        localStorage.setItem('usuario', JSON.stringify(user));
      }

      setMensaje({ tipo: 'exito', texto: '¡Imagen de firma cargada exitosamente!' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.error || 'Error al subir el archivo de firma.'
      });
    } finally {
      setSubiendoFirma(false);
    }
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const token = localStorage.getItem('token');
      
      // RUTA CORREGIDA PARA GUARDAR: "/perfil"
      const res = await axios.put(`${API_URL}/api/usuarios/perfil`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Actualizamos el localStorage con la info nueva
      const usuarioActualizado = res.data.usuario || res.data.perfil;
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

      setMensaje({ tipo: 'exito', texto: '¡Perfil actualizado correctamente!' });
      
      // Limpiamos las contraseñas
      setFormData(prev => ({ ...prev, passwordActual: '', passwordNueva: '' }));
      
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);

    } catch (error: any) {
      setMensaje({ 
        tipo: 'error', 
        texto: error.response?.data?.error || 'Error al actualizar el perfil.' 
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-blue-700 font-bold animate-pulse text-lg">Cargando perfil institucional...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col pb-12">
      
      {/* Navegación Superior */}
      <nav className="bg-blue-950 text-white py-4 px-6 shadow-md border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Volver al Panel Principal
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-yellow-400 text-slate-900 px-3 py-1 rounded-full font-black tracking-widest uppercase">
              Configuración de Cuenta
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-10 w-full flex-1">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mi Perfil Institucional</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Mantenga sus datos actualizados. Esta información será utilizada para la emisión oficial de resoluciones del CIEI.</p>
        </div>

        {/* Alertas de Éxito o Error */}
        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-xl border font-bold text-sm flex items-center gap-3 animate-fade-in ${
            mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {mensaje.tipo === 'exito' ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            )}
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-6">
          
          {/* SECCIÓN 1: Datos Personales */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              Datos Personales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombres Completos 🔒</label>
                <input disabled type="text" value={formData.nombres} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-500 rounded-xl bg-slate-100 cursor-not-allowed transition-shadow" title="Dato bloqueado por seguridad" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apellidos 🔒</label>
                <input disabled type="text" value={formData.apellidos} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-500 rounded-xl bg-slate-100 cursor-not-allowed transition-shadow" title="Dato bloqueado por seguridad" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documento de Identidad (DNI) 🔒</label>
                <input disabled type="text" value={formData.dni} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-500 rounded-xl bg-slate-100 cursor-not-allowed transition-shadow" placeholder="Número de DNI" title="Dato bloqueado por seguridad" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono / Celular ✏️</label>
                <input required type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-shadow" placeholder="Ej: 999 888 777" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Institucional ✏️</label>
              <input required type="email" value={formData.correo_institucional} onChange={(e) => setFormData({...formData, correo_institucional: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-shadow" />
            </div>
          </div>

          {/* SECCIÓN 2: Información Académica */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              Información Académica
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol en la Universidad ✏️</label>
              <select value={formData.tipo_investigador} onChange={(e) => setFormData({...formData, tipo_investigador: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-black text-blue-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/50 cursor-pointer">
                <option value="estudiante_pregrado">Estudiante de Pregrado</option>
                <option value="estudiante_posgrado">Estudiante de Posgrado</option>
                <option value="docente_investigador">Docente Investigador</option>
                <option value="investigador_externo">Investigador Externo</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Facultad Principal ✏️</label>
                <input required type="text" value={formData.facultad} onChange={(e) => setFormData({...formData, facultad: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-shadow" placeholder="Ej: Ingeniería Estadística" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Escuela Profesional / Programa ✏️</label>
                <input required type="text" value={formData.escuela_profesional} onChange={(e) => setFormData({...formData, escuela_profesional: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-bold text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-shadow" placeholder="Ej: Estadística e Informática" />
              </div>
            </div>
          </div>

          {/* SECCIÓN NUEVA: Firma Digital Manuscrita */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              Firma Digital Manuscrita
            </h3>
            
            <p className="text-sm text-slate-500">
              Suba una imagen de su firma manuscrita sobre fondo blanco (preferiblemente PNG transparente o JPG claro). Esta firma será incrustada automáticamente en los dictámenes y checklists que emita. Si no sube una firma, se generará una estampa digital de texto.
            </p>

            <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white min-h-[150px]">
                {firmaImagenRuta ? (
                  <div className="relative group flex flex-col items-center">
                    <img 
                      src={`${API_URL}${firmaImagenRuta}`} 
                      alt="Firma Digital" 
                      className="max-h-[100px] object-contain border border-slate-200 rounded p-2"
                    />
                    <span className="text-[10px] text-emerald-600 font-bold mt-2">Firma Registrada</span>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    <span className="text-xs font-bold block">Sin firma registrada</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar Archivo de Firma (Máx 5MB, JPG/PNG)</label>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={manejarSubidaFirma} 
                    disabled={subiendoFirma}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
                  />
                </div>
                {subiendoFirma && (
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    Subiendo archivo de firma...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Seguridad */}
          <div className="bg-slate-900 p-8 rounded-3xl shadow-sm space-y-6 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
            
            <h3 className="text-lg font-black text-white border-b border-slate-700 pb-3 flex items-center gap-2 relative z-10">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              Seguridad y Contraseña
            </h3>
            
            <p className="text-xs font-medium text-slate-400 relative z-10">Solo llene estos campos si desea cambiar su contraseña actual. De lo contrario, déjelos en blanco.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña Actual</label>
                <input type="password" value={formData.passwordActual} onChange={(e) => setFormData({...formData, passwordActual: e.target.value})} className="w-full px-4 py-3 border border-slate-700 font-bold text-white rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 bg-slate-800 transition-shadow" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nueva Contraseña</label>
                <input type="password" value={formData.passwordNueva} onChange={(e) => setFormData({...formData, passwordNueva: e.target.value})} className="w-full px-4 py-3 border border-slate-700 font-bold text-white rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 bg-slate-800 transition-shadow" placeholder="••••••••" />
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={guardando}
              className={`px-10 py-4 rounded-2xl font-black text-white shadow-lg transition-all flex items-center gap-3 text-lg ${
                guardando ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 hover:-translate-y-1 shadow-blue-700/30'
              }`}
            >
              {guardando ? 'Guardando cambios...' : 'Guardar Perfil'}
              {!guardando && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}