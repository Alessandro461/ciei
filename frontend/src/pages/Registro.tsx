import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

export default function Registro() {
  const navigate = useNavigate();
  
  // 1. Estados del formulario (Facultad eliminada, Confirmar Password agregado)
  const [tipoDoc, setTipoDoc] = useState('DNI');
  const [documento, setDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  
  // 2. Estados de control UI
  const [buscandoDni, setBuscandoDni] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState('');
  const [camposBloqueados, setCamposBloqueados] = useState(true);
  const [mensajeApi, setMensajeApi] = useState('');

  // Efecto para desbloquear campos si no es DNI
  useEffect(() => {
    if (tipoDoc !== 'DNI') {
      setCamposBloqueados(false);
      setMensajeApi('');
    } else {
      setCamposBloqueados(true);
      if (documento.length !== 8) {
        setNombres('');
        setApellidos('');
      }
    }
  }, [tipoDoc, documento]);

const buscarDNI = async (numeroDni: string) => {
    setBuscandoDni(true);
    setMensajeApi('Buscando en base de datos...');
    
    try {
      // AQUÍ ESTÁ LA CLAVE: Ruta completa obligando a apuntar al backend real
      const response = await axios.get(`${API_URL}/api/auth/dni/${numeroDni}`);
      const data = response.data;
      
      if (data.nombres) {
        setNombres(data.nombres);
        setApellidos(`${data.apellidoPaterno} ${data.apellidoMaterno}`);
        setCamposBloqueados(true);
        setMensajeApi('¡DNI verificado con éxito!');
      } else {
        throw new Error('DNI no encontrado');
      }
    } catch (error) {
      setCamposBloqueados(false);
      setMensajeApi('DNI no encontrado. Ingrese sus datos manualmente.');
    } finally {
      setBuscandoDni(false);
    }
  };

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = tipoDoc === 'DNI' ? e.target.value.replace(/\D/g, '') : e.target.value; 
    const maxLen = tipoDoc === 'DNI' ? 8 : (tipoDoc === 'CE' ? 9 : 12);
    
    if (valor.length <= maxLen) {
      setDocumento(valor);
      
      if (tipoDoc === 'DNI') {
        if (valor.length === 8) {
          buscarDNI(valor);
        } else {
          setNombres('');
          setApellidos('');
          setCamposBloqueados(true);
          setMensajeApi('');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRegistro('');

    if (password !== confirmarPassword) {
      setErrorRegistro('Las contraseñas no coinciden.');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/auth/registro`, {
        dni: documento, 
        nombres,
        apellidos,
        correo_institucional: correo,
        password,
        facultad: 'No especificada', // Rellenamos el dato interno para que PostgreSQL no arroje error
        rol: 'investigador'
      });
      
      navigate('/login');
    } catch (error: any) {
      setErrorRegistro(error.response?.data?.error || 'Error al registrar el usuario');
    }
  };

  // El botón solo se enciende si todo está lleno y las contraseñas son idénticas
  const isFormValid = documento.length > 0 && nombres.trim() !== '' && apellidos.trim() !== '' && correo && password && confirmarPassword && (password === confirmarPassword);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo CIEI" className="h-16 hover:scale-105 transition-transform" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          Registro de Investigador
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-red-600 hover:text-red-500 transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white py-8 px-4 shadow-[0_10px_40px_rgb(0,0,0,0.08)] sm:rounded-3xl sm:px-10 border border-slate-100">
          
          {errorRegistro && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700 font-bold">{errorRegistro}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              
              {/* SELECTOR DE TIPO DE DOCUMENTO */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Documento</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipoDoc" value="DNI" checked={tipoDoc === 'DNI'} onChange={(e) => setTipoDoc(e.target.value)} className="text-red-600 focus:ring-red-500"/>
                    <span className="text-sm font-medium text-slate-700">DNI</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipoDoc" value="CE" checked={tipoDoc === 'CE'} onChange={(e) => setTipoDoc(e.target.value)} className="text-red-600 focus:ring-red-500"/>
                    <span className="text-sm font-medium text-slate-700">Carnet Extranjería</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipoDoc" value="PASAPORTE" checked={tipoDoc === 'PASAPORTE'} onChange={(e) => setTipoDoc(e.target.value)} className="text-red-600 focus:ring-red-500"/>
                    <span className="text-sm font-medium text-slate-700">Pasaporte</span>
                  </label>
                </div>
              </div>

              {/* CAMPO NÚMERO DE DOCUMENTO */}
              <div className="sm:col-span-2 relative">
                <label className="block text-sm font-bold text-slate-700 mb-1">Número de Documento</label>
                <input
                  type="text"
                  required
                  value={documento}
                  onChange={handleDocumentoChange}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-red-500 focus:border-red-500 font-medium transition-all"
                  placeholder={tipoDoc === 'DNI' ? "8 dígitos" : "Ingrese su documento"}
                />
                {buscandoDni && (
                  <span className="absolute right-4 top-10 text-xs font-bold text-yellow-600 animate-pulse">
                    Verificando...
                  </span>
                )}
                {mensajeApi && (
                  <span className={`block mt-1 text-xs font-bold ${camposBloqueados ? 'text-green-600' : 'text-amber-600'}`}>
                    {mensajeApi}
                  </span>
                )}
              </div>

              {/* CAMPO NOMBRES */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombres</label>
                <input
                  type="text"
                  required
                  readOnly={camposBloqueados}
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm font-medium transition-all 
                    ${camposBloqueados 
                      ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-white border-slate-300 focus:ring-red-500 focus:border-red-500 text-slate-900'}`}
                  placeholder={camposBloqueados ? "Autocompletado" : "Escriba sus nombres"}
                />
              </div>

              {/* CAMPO APELLIDOS */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Apellidos</label>
                <input
                  type="text"
                  required
                  readOnly={camposBloqueados}
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm font-medium transition-all 
                    ${camposBloqueados 
                      ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-white border-slate-300 focus:ring-red-500 focus:border-red-500 text-slate-900'}`}
                  placeholder={camposBloqueados ? "Autocompletado" : "Escriba sus apellidos"}
                />
              </div>

              {/* CAMPO CORREO */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-red-500 focus:border-red-500 font-medium transition-all"
                  placeholder="ejemplo@unap.edu.pe o personal"
                />
              </div>

              {/* CAMPO CONTRASEÑA */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-red-500 focus:border-red-500 font-medium transition-all"
                  placeholder="Contraseña segura"
                />
              </div>

              {/* CAMPO REPETIR CONTRASEÑA */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Repetir Contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-red-500 font-medium transition-all
                    ${confirmarPassword && password !== confirmarPassword ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-red-500'}`}
                  placeholder="Confirme contraseña"
                />
                {confirmarPassword && password !== confirmarPassword && (
                  <p className="mt-1 text-xs text-red-600 font-bold">Las contraseñas no coinciden</p>
                )}
              </div>

            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid} 
                className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white transition-all 
                  ${!isFormValid 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 hover:-translate-y-1 hover:shadow-lg'
                  }`}
              >
                Completar Registro
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}