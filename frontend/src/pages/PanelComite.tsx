import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AsignarRevisorModal from '../components/AsignarRevisorModal';

// MAGIA: El sistema detectará automáticamente la URL según dónde esté publicado
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

interface SolicitudComite {
  id: number;
  numero_expediente: string;
  titulo_proyecto: string;
  estado_actual: string;
  nombres: string;
  apellidos: string;
  total_recomendaciones?: number;
  identidad_revelada?: boolean;
  tipo_revision?: string;
  fecha_limite?: string;
  usa_muestras_biologicas?: boolean;
  involucra_grupos_vulnerables?: boolean;
  es_invasivo?: boolean;
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

export default function PanelComite() {
  const navigate = useNavigate();

  // ==========================================
  // 1. ESTADOS DEL SISTEMA
  // ==========================================
  
  const [usuario, setUsuario] = useState<{ nombres: string; rol: string } | null>(null);
  const [pestañaActiva, setPestañaActiva] = useState<'expedientes' | 'usuarios' | 'portal' | 'reportes'>('expedientes');
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  
  // Expedientes y Buscador
  const [solicitudes, setSolicitudes] = useState<SolicitudComite[]>([]);
  const [busquedaExpediente, setBusquedaExpediente] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudActiva, setSolicitudActiva] = useState<number | null>(null);

  // Estados para el Dictamen Oficial del Presidente
  const [modalDictamenAbierto, setModalDictamenAbierto] = useState(false);
  const [solicitudDictamenActiva, setSolicitudDictamenActiva] = useState<number | null>(null);
  const [detallesSolicitud, setDetallesSolicitud] = useState<any>(null);
  const [nuevoEstadoDictamen, setNuevoEstadoDictamen] = useState('');
  const [comentariosDictamen, setComentariosDictamen] = useState('');
  const [procesandoDictamen, setProcesandoDictamen] = useState(false);
  const [categoriaRiesgo, setCategoriaRiesgo] = useState('bajo');

  // Usuarios y Buscador
  const [listaUsuarios, setListaUsuarios] = useState<any[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  // Portal y Avisos (CMS)
  const [nuevoVideoUrl, setNuevoVideoUrl] = useState('');
  const [listaAvisos, setListaAvisos] = useState<any[]>([]);
  const [modalAvisoAbierto, setModalAvisoAbierto] = useState(false);
  const [avisoEnEdicion, setAvisoEnEdicion] = useState<number | null>(null);
  const [nuevoAviso, setNuevoAviso] = useState({
    tipo: 'Informativo', color: 'blue', titulo: '', texto: '', imagen_url: '' 
  });

  // ==========================================
  // 2. FUNCIONES DE EXPEDIENTES
  // ==========================================
  
  const cargarBandeja = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await axios.get(`${API_URL}/api/solicitudes/comite/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudes(respuesta.data.solicitudes);
    } catch (error) {
      console.error('Error al cargar bandeja:', error);
    }
  };

  // NUEVA FUNCIÓN: Exigir Pago al Investigador
  const exigirPago = async (id: number) => {
    if (window.confirm('¿Solicitar pago de derechos? El investigador no podrá avanzar hasta que suba su voucher.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/solicitudes/${id}/exigir-pago`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('¡Proyecto retenido! Se ha habilitado la subida de voucher para el investigador.');
        cargarBandeja();
      } catch (error) {
        alert('Error al exigir el pago. Verifique las rutas del backend.');
      }
    }
  };



  const descargarConstanciaPDF = async (id: number, numero_expediente: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/${id}/resolucion`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `Resolucion_${numero_expediente}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) {
      alert('Error al descargar el PDF.');
    }
  };

  const descargarChecklistRevisor = async (dictamenId: number, nombreRevisor: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/dictamen/${dictamenId}/checklist-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Checklist_Evaluacion_${nombreRevisor.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error al descargar el checklist PDF');
    }
  };

  const descargarCartaRevision = async (solicitudId: number, exp: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/${solicitudId}/carta-revision-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Carta_Revision_Consolidada_${exp}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error al descargar la carta de revisión consolidada');
    }
  };

  const descargarCartaObsPDF = async (id: number, numero_expediente: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/${id}/carta-observacion`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `Carta_Observaciones_${numero_expediente}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) {
      alert('Error al descargar la Carta de Observaciones en PDF.');
    }
  };

  const descargarArchivoSeguimiento = async (seguimientoId: number, titulo: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/documentos/seguimiento/${seguimientoId}/descargar`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Seguimiento_${titulo.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error al descargar el archivo de seguimiento adjunto.');
    }
  };

  const abrirModalDictamen = async (id: number) => {
    setSolicitudDictamenActiva(id);
    setNuevoEstadoDictamen('');
    setComentariosDictamen('');
    setCategoriaRiesgo('bajo');
    setDetallesSolicitud(null);
    setModalDictamenAbierto(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/solicitudes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetallesSolicitud(res.data);
      if (res.data.solicitud) {
        setCategoriaRiesgo(res.data.solicitud.categoria_riesgo || 'bajo');
      }
      // Pre-llenar comentarios si el revisor ya dio su recomendación
      if (res.data.recomendaciones && res.data.recomendaciones.length > 0) {
        setComentariosDictamen(res.data.recomendaciones[0].comentarios_investigador || '');
        setNuevoEstadoDictamen(res.data.recomendaciones[0].resultado || '');
      }
    } catch (error) {
      console.error('Error al cargar recomendaciones de revisión:', error);
    }
  };

  const ejecutarDictamenPresidente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudDictamenActiva || !nuevoEstadoDictamen) {
      alert('Por favor complete todos los datos.');
      return;
    }

    if (nuevoEstadoDictamen === 'aprobado' && categoriaRiesgo === 'alto') {
      alert('Según el Art. 6.2.c del Manual de Procedimientos de Investigación en Humanos de la UNA-Puno, los proyectos de Riesgo Alto NO pueden ser aprobados por el CIEI UNA-Puno y deben ser derivados al Instituto Nacional de Salud (INS).');
      return;
    }

    setProcesandoDictamen(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/solicitudes/${solicitudDictamenActiva}/dictamen`, {
        nuevo_estado: nuevoEstadoDictamen,
        comentarios: comentariosDictamen,
        categoria_riesgo: categoriaRiesgo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('¡Dictamen oficial registrado con éxito!');
      setModalDictamenAbierto(false);
      cargarBandeja();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar el dictamen oficial.');
    } finally {
      setProcesandoDictamen(false);
    }
  };

  const desvelarIdentidad = async (id: number) => {
    if (window.confirm('¿Está seguro de desvelar la identidad de los investigadores para los revisores de este expediente?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/solicitudes/${id}/revelar-identidad`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('¡Identidad desvelada con éxito! Los revisores ahora podrán ver los datos del investigador.');
        cargarBandeja();
      } catch (error) {
        alert('Error al desvelar la identidad.');
      }
    }
  };

  const cambiarTipoRevision = async (id: number, tipoRevision: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/solicitudes/${id}/tipo-revision`, { tipo_revision: tipoRevision }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Expediente clasificado como: ${tipoRevision.toUpperCase()}`);
      cargarBandeja();
    } catch (error) {
      alert('Error al clasificar la revisión.');
    }
  };

  const reactivarEvaluacionComite = async (solicitudId: number) => {
    if (window.confirm("¿Está seguro de re-activar la evaluación para este expediente? Se asignará automáticamente al mismo Revisor Principal anterior.")) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/solicitudes/${solicitudId}/reactivar-evaluacion`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Evaluación re-activada con éxito.");
        cargarBandeja();
      } catch (error: any) {
        alert(error.response?.data?.error || "Error al reactivar la evaluación.");
      }
    }
  };

  const abrirModalAsignacion = (id: number) => {
    setSolicitudActiva(id);
    setModalAbierto(true);
  };

  const expedientesFiltrados = solicitudes.filter(sol => 
    sol.numero_expediente.toLowerCase().includes(busquedaExpediente.toLowerCase()) ||
    sol.nombres.toLowerCase().includes(busquedaExpediente.toLowerCase()) ||
    sol.apellidos.toLowerCase().includes(busquedaExpediente.toLowerCase()) ||
    sol.estado_actual.toLowerCase().includes(busquedaExpediente.toLowerCase())
  );

  // ==========================================
  // 3. FUNCIONES DE USUARIOS
  // ==========================================
  
  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListaUsuarios(response.data.usuarios);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const actualizarRolUsuario = async (id: number, nuevoRol: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/usuarios/${id}/rol`, { rol: nuevoRol }, { headers: { Authorization: `Bearer ${token}` } });
      setListaUsuarios(listaUsuarios.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));
      alert('¡Rol de usuario actualizado!');
    } catch (error) {
      alert('Error al cambiar el rol.');
    }
  };

  const usuariosFiltrados = listaUsuarios.filter(user => 
    user.nombres.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    user.apellidos.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    user.dni.includes(busquedaUsuario)
  );

  // ==========================================
  // 4. FUNCIONES DEL PORTAL (CMS)
  // ==========================================
  
  const cargarDatosPortal = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/portal/contenido`);
      if (response.data.videoUrl) setNuevoVideoUrl(response.data.videoUrl);
      if (response.data.avisos) setListaAvisos(response.data.avisos);
    } catch (error) {
      console.log('Error al cargar datos del portal');
    }
  };

  const [formatosMetadatos, setFormatosMetadatos] = useState<any[]>([]);

  const cargarMetadatosFormatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/portal/formatos/metadatos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormatosMetadatos(res.data);
    } catch (e) {
      console.log('Error al cargar metadatos de formatos');
    }
  };

  const crearNuevoFormato = async () => {
    const titulo = window.prompt('Ingrese el título del nuevo formato (Ej: Formato A: Formato Básico):');
    if (!titulo) return;
    
    // Preguntar por la categoría usando un confirm interactivo
    const esHumanos = window.confirm('¿Este formato es para investigación en HUMANOS?\n\n(Aceptar = Humanos, Cancelar = Animales)');
    const categoria = esHumanos ? 'humanos' : 'animales';
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/portal/formatos`, { titulo, categoria }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarMetadatosFormatos();
    } catch (error) {
      alert('Error al crear el formato.');
    }
  };

  const editarTituloFormato = async (id: number, tituloActual: string) => {
    const nuevoTitulo = window.prompt('Edite el título del formato:', tituloActual);
    if (!nuevoTitulo || nuevoTitulo === tituloActual) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/portal/formatos/${id}/titulo`, { titulo: nuevoTitulo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarMetadatosFormatos();
    } catch (error) {
      alert('Error al editar el título.');
    }
  };

  const eliminarFormato = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este formato? Desaparecerá inmediatamente de la Landing Page.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/portal/formatos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        cargarMetadatosFormatos();
      } catch (error) {
        alert('Error al eliminar el formato.');
      }
    }
  };

  const manejarSubidaFormatoOficial = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('formato', file);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/portal/formatos/subir/${id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('¡Archivo adjuntado y actualizado con éxito!');
      cargarMetadatosFormatos();
    } catch (error) {
      alert('Error al subir el archivo del formato.');
    }
  };

  const actualizarVideoPortada = async () => {
    if (!nuevoVideoUrl) return alert('Por favor ingrese un enlace válido');
    try {
      const token = localStorage.getItem('token'); 
      await axios.put(`${API_URL}/api/portal/video`, { videoUrl: nuevoVideoUrl }, { headers: { Authorization: `Bearer ${token}` } });
      alert('¡Video de la portada actualizado con éxito!');
    } catch (error) { alert('Error al actualizar el video.'); }
  };

  const manejarSubidaImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onloadend = () => setNuevoAviso({ ...nuevoAviso, imagen_url: lector.result as string });
      lector.readAsDataURL(archivo);
    }
  };

  const abrirModalCrearAviso = () => {
    setAvisoEnEdicion(null);
    setNuevoAviso({ tipo: 'Informativo', color: 'blue', titulo: '', texto: '', imagen_url: '' });
    setModalAvisoAbierto(true);
  };

  const abrirModalEditarAviso = (aviso: any) => {
    setAvisoEnEdicion(aviso.id);
    setNuevoAviso({
      tipo: aviso.tipo, color: aviso.color, titulo: aviso.titulo, texto: aviso.texto, imagen_url: aviso.imagen_url || ''
    });
    setModalAvisoAbierto(true);
  };

  const guardarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const fechaHoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
      
      if (avisoEnEdicion) {
        await axios.put(`${API_URL}/api/portal/avisos/${avisoEnEdicion}`, 
          { ...nuevoAviso, fecha: fechaHoy }, { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('¡Aviso actualizado exitosamente!');
      } else {
        await axios.post(`${API_URL}/api/portal/avisos`, 
          { ...nuevoAviso, fecha: fechaHoy }, { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('¡Aviso publicado exitosamente!');
      }
      setModalAvisoAbierto(false); 
      cargarDatosPortal();
    } catch (error) {
      alert('Error al guardar el aviso.');
    }
  };

  const eliminarAviso = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este aviso?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/portal/avisos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        cargarDatosPortal();
      } catch (error) { alert('Error al eliminar el aviso.'); }
    }
  };

  // ==========================================
  // 5. EFECTOS Y NAVEGACIÓN
  // ==========================================
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('usuario');
    if (!token) { navigate('/login'); return; }
    if (userStr) setUsuario(JSON.parse(userStr));
    
    cargarBandeja();
    cargarDatosPortal();
  }, [navigate]);

  useEffect(() => {
    if (pestañaActiva === 'usuarios') cargarUsuarios();
    if (pestañaActiva === 'portal') cargarMetadatosFormatos();
  }, [pestañaActiva]);

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-red-500 selection:text-white">
      
      {/* NAVEGACIÓN SUPERIOR */}
      <nav className="bg-slate-950 text-white shadow-xl z-10 border-b border-slate-800 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
          
          {/* Logo con Link a Landing Page */}
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="CIEI Logo" className="h-10" />
            <div className="flex flex-col border-l border-slate-700 pl-4">
              <span className="font-black text-lg tracking-tight leading-none text-white">Sala de Control</span>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Volver al Inicio</span>
            </div>
            <span className="ml-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
              {usuario?.rol}
            </span>
          </div>
          
          {/* Menú de Perfil de Usuario */}
          <div className="relative">
            <div 
              className="flex items-center gap-4 cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition-colors"
              onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{usuario?.nombres}</p>
                <p className="text-xs text-slate-400 font-medium">Opciones ▼</p>
              </div>
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-black shadow-md border-2 border-slate-800">
                {usuario?.nombres.charAt(0)}
              </div>
            </div>

            {/* Menú Desplegable */}
            {menuPerfilAbierto && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in overflow-hidden">
                <button onClick={() => navigate('/perfil')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  Editar Perfil
                </button>
                <button className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center gap-2 border-b border-slate-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Configuración
                </button>
                <button onClick={cerrarSesion} className="w-full text-left px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            <button onClick={() => setPestañaActiva('expedientes')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-extrabold text-sm transition-colors ${pestañaActiva === 'expedientes' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              Bandeja de Expedientes
            </button>
            {(usuario?.rol === 'admin' || usuario?.rol === 'presidente') && (
              <>
                <button onClick={() => setPestañaActiva('usuarios')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-extrabold text-sm transition-colors ${pestañaActiva === 'usuarios' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Gestión de Usuarios
                </button>
                <button onClick={() => setPestañaActiva('portal')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-extrabold text-sm transition-colors ${pestañaActiva === 'portal' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Configuración del Portal
                </button>
                <button onClick={() => setPestañaActiva('reportes')} className={`whitespace-nowrap py-4 px-1 border-b-4 font-extrabold text-sm transition-colors ${pestañaActiva === 'reportes' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Reportes y Estadísticas
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* =========================================
            VISTA 1: EXPEDIENTES (Con Buscador)
            ========================================= */}
        {pestañaActiva === 'expedientes' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Evaluación de Proyectos</h2>
                <p className="text-slate-500 text-sm mt-1">Gestione y revise las solicitudes enviadas.</p>
              </div>
              
              {/* Buscador de Expedientes */}
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Buscar expediente o autor..." 
                  value={busquedaExpediente}
                  onChange={(e) => setBusquedaExpediente(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_5px_20px_rgb(0,0,0,0.03)] border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase">Expediente</th>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase">Investigador / Ciega</th>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase">Clasificación</th>
                    <th className="px-6 py-5 text-center text-[11px] font-extrabold text-slate-500 uppercase">Estado</th>
                    <th className="px-6 py-5 text-center text-[11px] font-extrabold text-slate-500 uppercase">SLA / Límite</th>
                    <th className="px-6 py-5 text-right text-[11px] font-extrabold text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {expedientesFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">No se encontraron expedientes.</td></tr>
                  ) : (
                    expedientesFiltrados.map((sol) => (
                      <tr key={sol.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5 text-sm font-black text-slate-900">{sol.numero_expediente}</td>
                        <td className="px-6 py-5 text-sm font-medium text-slate-600">
                          <div className="font-bold text-slate-800">{sol.nombres} {sol.apellidos}</div>
                          <div className="mt-1 flex gap-1 flex-wrap mb-1.5">
                            {sol.usa_muestras_biologicas && (
                              <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">🧪 Muestras</span>
                            )}
                            {sol.involucra_grupos_vulnerables && (
                              <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">👥 Vulnerables</span>
                            )}
                            {sol.es_invasivo && (
                              <span className="text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">🚨 Invasivo</span>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {sol.identidad_revelada ? (
                              <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                                Revelada (Revisores ven ID)
                              </span>
                            ) : (
                              <>
                                <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                                  Ciega (Revisores NO ven ID)
                                </span>
                                {(usuario?.rol === 'presidente' || usuario?.rol === 'secretario' || usuario?.rol === 'admin') && (
                                  <button
                                    onClick={() => desvelarIdentidad(sol.id)}
                                    className="text-[9px] font-black text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 transition-colors"
                                  >
                                    Revelar ID
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium">
                          {(usuario?.rol === 'presidente' || usuario?.rol === 'secretario' || usuario?.rol === 'admin') ? (
                            <select
                              value={sol.tipo_revision || 'completa'}
                              onChange={(e) => cambiarTipoRevision(sol.id, e.target.value)}
                              className="text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl px-2 py-1.5 outline-none focus:border-red-500 cursor-pointer"
                            >
                              <option value="completa">Completa (Sesión Plena)</option>
                              <option value="expedita">Expedita (Rápida)</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-extrabold rounded uppercase border ${
                              sol.tipo_revision === 'expedita' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {(sol.tipo_revision || 'completa')}
                            </span>
                          )}
                        </td>
                        
                        {/* ESTADOS DEL PROYECTO (Con Amarillo) */}
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <span className={`px-3 py-1.5 inline-flex text-[11px] font-black uppercase tracking-wider rounded-lg border ${
                              sol.estado_actual === 'aprobado' ? 'bg-green-50 text-green-700 border-green-200' :
                              sol.estado_actual === 'observado' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              sol.estado_actual === 'pendiente_pago' ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                              sol.estado_actual === 'enviado' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              sol.estado_actual === 'revision_enmienda' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {sol.estado_actual.replace('_', ' ')}
                            </span>
                            {sol.estado_actual === 'en_revision' && sol.total_recomendaciones && sol.total_recomendaciones > 0 ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm border border-emerald-200 animate-pulse">
                                💡 Recomendación Lista
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* SLA / LÍMITE */}
                        <td className="px-6 py-5 text-center">
                          <SemaforoBadge fechaLimite={sol.fecha_limite} />
                        </td>
                        
                        {/* BOTONES (Con Peaje) */}
                        <td className="px-6 py-5 text-right text-sm space-x-2">
                          
                          {/* Botones Peaje y Asignación (Solo Presidente/Admin) */}
                          {(usuario?.rol === 'presidente' || usuario?.rol === 'admin') && sol.estado_actual === 'enviado' && (
                            <>
                              <button onClick={() => exigirPago(sol.id)} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-3 py-2 rounded-xl font-bold text-xs shadow-sm" title="Detener y cobrar derechos">
                                Exigir Pago
                              </button>
                              <button onClick={() => abrirModalAsignacion(sol.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-sm">
                                Asignar Revisor
                              </button>
                            </>
                          )}

                          {/* Aviso de Espera de Pago */}
                          {(usuario?.rol === 'presidente' || usuario?.rol === 'admin') && sol.estado_actual === 'pendiente_pago' && (
                            <span className="text-xs font-bold text-yellow-600 italic bg-yellow-50 px-3 py-2 rounded-xl">
                              ⏳ Esperando Voucher del Investigador...
                            </span>
                          )}

                          {/* Demás botones del sistema */}
                          {(usuario?.rol === 'presidente' || usuario?.rol === 'admin') && sol.estado_actual === 'subsanado' && (
                            <button 
                              onClick={() => reactivarEvaluacionComite(sol.id)} 
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
                            >
                              Re-activar Evaluación
                            </button>
                          )}
                          {(usuario?.rol === 'presidente' || usuario?.rol === 'admin') && (sol.estado_actual === 'en_revision' || sol.estado_actual === 'subsanado' || sol.estado_actual === 'revision_enmienda') && (
                            <button onClick={() => abrirModalDictamen(sol.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors">Dictaminar</button>
                          )}
                          {(usuario?.rol === 'revisor' || usuario?.rol === 'admin') && sol.estado_actual !== 'aprobado' && sol.estado_actual !== 'pendiente_pago' && (
                            <button onClick={() => navigate(`/comite/evaluar/${sol.id}`)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors">Evaluar</button>
                          )}
                          {sol.estado_actual === 'aprobado' && (
                            <button onClick={() => descargarConstanciaPDF(sol.id, sol.numero_expediente)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors">Resolución</button>
                          )}
                          {sol.estado_actual === 'observado' && (
                            <button onClick={() => descargarCartaObsPDF(sol.id, sol.numero_expediente)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors">Carta Obs</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================
            VISTA 2: USUARIOS (Con Buscador)
            ========================================= */}
        {pestañaActiva === 'usuarios' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Gestión de Usuarios y Roles</h2>
                <p className="text-slate-500 text-sm mt-1">Administre los accesos y asigne los permisos.</p>
              </div>
              
              {/* Buscador de Usuarios */}
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Buscar por DNI o Nombre..." 
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_5px_20px_rgb(0,0,0,0.03)] border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">DNI</th>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Usuario</th>
                    <th className="px-6 py-5 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Correo Institucional</th>
                    <th className="px-6 py-5 text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Rol Actual</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {usuariosFiltrados.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">No se encontraron usuarios.</td></tr>
                  ) : (
                    usuariosFiltrados.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{user.dni}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{user.nombres} {user.apellidos}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{user.correo_institucional}</td>
                        <td className="px-6 py-4 text-center">
                          <select 
                            value={user.rol}
                            onChange={(e) => actualizarRolUsuario(user.id, e.target.value)}
                            className={`text-xs font-bold uppercase px-3 py-2 rounded-xl border-2 outline-none cursor-pointer transition-colors ${
                              user.rol === 'admin' || user.rol === 'presidente' ? 'bg-red-50 text-red-700 border-red-200 focus:border-red-500' :
                              user.rol === 'revisor' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:border-amber-500' :
                              'bg-slate-100 text-slate-700 border-slate-200 focus:border-slate-500'
                            }`}
                          >
                            <option value="investigador">Investigador</option>
                            <option value="revisor">Revisor</option>
                            <option value="secretario">Secretario</option>
                            <option value="presidente">Presidente</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================
            VISTA 3: PORTAL (CMS con Edición)
            ========================================= */}
        {pestañaActiva === 'portal' && (
          
          <div className="animate-fade-in space-y-8">
            {/* NUEVA SECCIÓN: GESTIÓN DE FORMATOS OFICIALES DINÁMICOS */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_5px_20px_rgb(0,0,0,0.03)]">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Plantillas y Formatos Oficiales</h3>
                  <p className="text-slate-400 text-xs font-medium mt-1">Gestione los documentos que los tesistas descargarán en la Landing Page.</p>
                </div>
                <button onClick={crearNuevoFormato} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  Nuevo Formato
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formatosMetadatos.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-slate-500 text-sm font-medium">No hay formatos creados. Haga clic en "Nuevo Formato" para empezar.</div>
                ) : (
                  formatosMetadatos.map((formato) => (
                    <div key={formato.id} className="border border-slate-200 p-5 rounded-2xl bg-slate-50/50 flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight pr-4">{formato.titulo}</h4>
                            <span className={`inline-flex items-center text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1.5 border ${
                              formato.categoria === 'animales' 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {formato.categoria === 'animales' ? '🐾 Animales' : '🔬 Humanos'}
                            </span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => editarTituloFormato(formato.id, formato.titulo)} className="text-blue-500 hover:text-blue-700 bg-blue-100 p-1.5 rounded-md" title="Editar título">✎</button>
                            <button onClick={() => eliminarFormato(formato.id)} className="text-red-500 hover:text-red-700 bg-red-100 p-1.5 rounded-md" title="Eliminar formato">✕</button>
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 truncate mt-1">
                          <span className="font-bold text-slate-700">Archivo: </span> 
                          {formato.nombre_archivo_original ? formato.nombre_archivo_original : <span className="text-red-500 font-bold">Sin archivo subido</span>}
                        </p>
                      </div>
                      
                      <div className="mt-4">
                        <label className="w-full bg-slate-900 hover:bg-slate-800 text-yellow-400 text-xs font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          {formato.nombre_archivo_original ? 'Reemplazar Archivo' : 'Subir Archivo'}
                          <input 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => manejarSubidaFormatoOficial(formato.id, e)} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_5px_20px_rgb(0,0,0,0.03)]">
              <h3 className="text-xl font-black text-slate-800 mb-6">Video de la Portada</h3>
              <div className="flex gap-4">
                <input type="text" value={nuevoVideoUrl} onChange={(e) => setNuevoVideoUrl(e.target.value)} placeholder="Link de YouTube o .mp4" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none" />
                <button onClick={actualizarVideoPortada} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all">Actualizar Video</button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_5px_20px_rgb(0,0,0,0.03)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Historial de Avisos y Cronogramas</h3>
                <button onClick={abrirModalCrearAviso} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  Crear Nuevo Aviso
                </button>
              </div>
              
              <div className="overflow-hidden border border-slate-200 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-500 uppercase">Fecha</th>
                      <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-500 uppercase">Título</th>
                      <th className="px-6 py-4 text-left text-[11px] font-extrabold text-slate-500 uppercase">Tipo</th>
                      <th className="px-6 py-4 text-right text-[11px] font-extrabold text-slate-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {listaAvisos.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">No hay avisos publicados.</td></tr>
                    ) : (
                      listaAvisos.map(aviso => (
                        <tr key={aviso.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">{aviso.fecha}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-bold">{aviso.titulo}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`bg-${aviso.color}-100 text-${aviso.color}-800 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider`}>
                              {aviso.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {/* NUEVO BOTÓN EDITAR */}
                            <button onClick={() => abrirModalEditarAviso(aviso)} className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg">
                              Editar
                            </button>
                            <button onClick={() => eliminarAviso(aviso.id)} className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg">
                              Eliminar
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
        )}

        {/* =========================================
            VISTA 4: REPORTES Y ESTADÍSTICAS
            ========================================= */}
        {pestañaActiva === 'reportes' && (
          <div className="animate-fade-in space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Dashboard de Estadísticas</h2>
              <p className="text-slate-500 text-sm mt-1">Visión general del rendimiento del Comité de Ética.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Expedientes</p>
                  <p className="text-3xl font-black text-slate-900">{solicitudes.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Proyectos Aprobados</p>
                  <p className="text-3xl font-black text-slate-900">{solicitudes.filter(s => s.estado_actual === 'aprobado').length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Usuarios Registrados</p>
                  <p className="text-3xl font-black text-slate-900">{listaUsuarios.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-3xl p-12 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <h3 className="text-2xl font-black text-white mb-2 relative z-10">Módulo de Gráficos</h3>
               <p className="text-slate-400 relative z-10">Próximamente conectaremos las gráficas avanzadas en PDF usando los datos históricos.</p>
            </div>
          </div>
        )}

      </main>

      {/* =========================================
          MODALES (VENTANAS EMERGENTES)
          ========================================= */}
          
      {/* MODAL 1: CREAR/EDITAR AVISO CMS */}
      {modalAvisoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <h3 className="text-xl font-black text-white">{avisoEnEdicion ? 'Editar Aviso Existente' : 'Publicar Nuevo Aviso'}</h3>
              <button onClick={() => setModalAvisoAbierto(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={guardarAviso} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                  <select value={nuevoAviso.tipo} onChange={(e) => setNuevoAviso({...nuevoAviso, tipo: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium rounded-xl outline-none focus:ring-2 focus:ring-red-500">
                    <option value="Informativo">Informativo</option>
                    <option value="Cronograma">Cronograma</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Color de Etiqueta</label>
                  <select value={nuevoAviso.color} onChange={(e) => setNuevoAviso({...nuevoAviso, color: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium rounded-xl outline-none focus:ring-2 focus:ring-red-500">
                    <option value="blue">Azul</option>
                    <option value="yellow">Amarillo</option>
                    <option value="red">Rojo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Título de la Noticia</label>
                <input required type="text" value={nuevoAviso.titulo} onChange={(e) => setNuevoAviso({...nuevoAviso, titulo: e.target.value})} className="w-full px-4 py-3 border border-slate-200 font-medium rounded-xl outline-none focus:ring-2 focus:ring-red-500" placeholder="Escriba el título principal..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Adjuntar Imagen (Opcional)</label>
                <input 
                  type="file" accept="image/png, image/jpeg, image/jpg" onChange={manejarSubidaImagen} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer" 
                />
                {nuevoAviso.imagen_url && <p className="text-xs text-green-600 font-bold mt-2">✓ Imagen cargada (Base64)</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cuerpo del Aviso</label>
                <textarea required value={nuevoAviso.texto} onChange={(e) => setNuevoAviso({...nuevoAviso, texto: e.target.value})} rows={3} className="w-full px-4 py-3 border border-slate-200 font-medium rounded-xl outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea>
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-md transition-all">
                {avisoEnEdicion ? 'Guardar Cambios' : 'Publicar Aviso Inmediatamente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASIGNAR REVISOR */}
      <AsignarRevisorModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSuccess={cargarBandeja} solicitudId={solicitudActiva} />

      {/* MODAL 3: DICTAMEN OFICIAL DEL PRESIDENTE */}
      {modalDictamenAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl scale-100 transition-transform flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-slate-900 border-b flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="text-lg font-black">Dictamen Oficial del Comité</h3>
                {detallesSolicitud && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-0.5">Expediente: {detallesSolicitud.solicitud.numero_expediente}</p>
                )}
              </div>
              <button onClick={() => setModalDictamenAbierto(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={ejecutarDictamenPresidente} className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Alerta de vulnerabilidades o características especiales del proyecto según el Manual */}
              {detallesSolicitud && (detallesSolicitud.solicitud.usa_muestras_biologicas || detallesSolicitud.solicitud.involucra_grupos_vulnerables || detallesSolicitud.solicitud.es_invasivo) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800 space-y-2 shadow-sm">
                  <h5 className="font-black flex items-center gap-1.5 text-sm">
                    ⚠️ REQUISITO NORMATIVO (CIEI UNA-Puno)
                  </h5>
                  <p className="font-semibold">
                    Este protocolo de investigación requiere una evaluación exhaustiva completa en sesión ordinaria plenaria y no procede mediante evaluación expedita:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 font-bold">
                    {detallesSolicitud.solicitud.usa_muestras_biologicas && (
                      <li>Involucra el uso de muestras biológicas ({detallesSolicitud.solicitud.tipo_muestras_biologicas}).</li>
                    )}
                    {detallesSolicitud.solicitud.involucra_grupos_vulnerables && (
                      <li>Involucra participantes de grupos vulnerables: {detallesSolicitud.solicitud.descripcion_vulnerabilidad}.</li>
                    )}
                    {detallesSolicitud.solicitud.es_invasivo && (
                      <li>Es calificado como estudio invasivo en seres humanos.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Sección 1: Recomendaciones Técnicas de los Revisores */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">📋 Recomendaciones Técnicas Recibidas</h4>
                
                {!detallesSolicitud ? (
                  <p className="text-xs text-slate-400 font-bold animate-pulse py-2 text-center">Cargando recomendaciones del revisor...</p>
                ) : detallesSolicitud.recomendaciones && detallesSolicitud.recomendaciones.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-medium py-2 text-center">Aún no hay recomendaciones emitidas por revisores.</p>
                ) : (
                  <div className="space-y-3">
                    {detallesSolicitud.recomendaciones.map((rec: any) => (
                      <div key={rec.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] font-bold text-slate-700">Revisor: <span className="font-extrabold">{rec.revisor_nombres} {rec.revisor_apellidos}</span></span>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                            rec.resultado === 'aprobado' ? 'bg-emerald-100 text-emerald-800' :
                            rec.resultado === 'observado' ? 'bg-amber-100 text-amber-800 font-bold' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {rec.resultado}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/50 whitespace-pre-wrap font-medium">
                          {rec.comentarios_investigador || 'Sin comentarios detallados.'}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {rec.id && (
                            <button
                              type="button"
                              onClick={() => descargarChecklistRevisor(rec.id, `${rec.revisor_nombres} ${rec.revisor_apellidos}`)}
                              className="text-[9px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-100/50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            >
                              ⬇️ Descargar Anexo {detallesSolicitud.solicitud.tipo_investigacion === 'animales' ? '7' : 'G'} (Checklist PDF)
                            </button>
                          )}
                          {rec.revisor_rol_asignacion === 'principal' && (
                            <button
                              type="button"
                              onClick={() => descargarCartaRevision(detallesSolicitud.solicitud.id, detallesSolicitud.solicitud.numero_expediente)}
                              className="text-[9px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-100/50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            >
                              ⬇️ Descargar Carta de Revisión Consolidada (PDF)
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección: Informes de Seguimiento Post-Aprobación / Enmiendas */}
              {detallesSolicitud && detallesSolicitud.seguimiento && detallesSolicitud.seguimiento.length > 0 && (
                <div className="space-y-3 bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest">📈 Informes de Seguimiento Recibidos</h4>
                  <div className="space-y-3">
                    {detallesSolicitud.seguimiento.map((seg: any) => (
                      <div key={seg.id} className="p-3 bg-white border border-indigo-100 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-indigo-900 uppercase">{seg.titulo.replace('_', ' ')}</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {seg.estado_seguimiento}
                          </span>
                        </div>
                        {seg.descripcion && <p className="text-xs text-slate-600 mb-2 font-medium">{seg.descripcion}</p>}
                        {seg.ruta_archivo && (
                          <button
                            type="button"
                            onClick={() => descargarArchivoSeguimiento(seg.id, seg.titulo)}
                            className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                          >
                            ⬇️ Descargar Adjunto ({seg.tipo_reporte})
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Categoría de Riesgo (Cap. VI)</label>
                  <select 
                    required
                    value={categoriaRiesgo}
                    onChange={(e) => setCategoriaRiesgo(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:border-red-500 bg-slate-50 cursor-pointer transition-colors"
                  >
                    <option value="bajo">Bajo o Ningún Riesgo</option>
                    <option value="moderado">Riesgo Moderado (Requiere informes trimestrales)</option>
                    <option value="alto">Riesgo Alto (Debe derivarse al INS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Decisión Oficial Definitiva</label>
                  <select 
                    required
                    value={nuevoEstadoDictamen}
                    onChange={(e) => setNuevoEstadoDictamen(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:border-red-500 bg-slate-50 cursor-pointer transition-colors"
                  >
                    <option value="" disabled>-- Seleccione una Decisión Oficial --</option>
                    <option value="aprobado">🟢 Dictamen Favorable: APROBAR (Genera Constancia de Aprobación)</option>
                    <option value="observado">🟠 Dictamen con Observaciones: OBSERVAR (Genera Carta de Observaciones y habilita subsanación)</option>
                    <option value="rechazado">🔴 Dictamen Desfavorable: RECHAZAR</option>
                  </select>
                </div>
              </div>

              {/* Comentarios Finales */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Comentarios Oficiales (Irán en el Documento PDF/Resolución)</label>
                <textarea
                  required
                  rows={4}
                  value={comentariosDictamen}
                  onChange={(e) => setComentariosDictamen(e.target.value)}
                  placeholder="Redacte detalladamente las observaciones o consideraciones finales del comité de ética..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm font-medium"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setModalDictamenAbierto(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={procesandoDictamen || !nuevoEstadoDictamen} className={`flex-1 px-4 py-3 rounded-xl font-black text-sm text-white transition-all shadow-md ${
                  procesandoDictamen || !nuevoEstadoDictamen ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' : 'bg-red-600 hover:bg-red-700'
                }`}>
                  {procesandoDictamen ? 'Registrando Dictamen...' : 'Registrar Decisión Oficial'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}