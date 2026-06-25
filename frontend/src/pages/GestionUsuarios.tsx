import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface UsuarioData {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo_institucional: string;
  rol: string;
  estado: string;
}

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  // Estados del formulario
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formData, setFormData] = useState({
    dni: '', nombres: '', apellidos: '', correo_institucional: '', password: '', rol: 'investigador'
  });

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(res.data.usuarios);
    } catch (error: any) {
      console.error('Error cargando usuarios', error);
      alert("Error del Servidor: " + (error.response?.data?.error || error.message));
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/usuarios`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Usuario creado con éxito');
      setMostrarForm(false);
      setFormData({ dni: '', nombres: '', apellidos: '', correo_institucional: '', password: '', rol: 'investigador' });
      cargarUsuarios(); // Recargar la tabla
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear usuario');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col overflow-x-hidden relative">
      <nav className="bg-slate-900 text-white shadow-md p-4 border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <button onClick={() => navigate('/comite')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shrink-0 self-start sm:self-auto">
            ← Volver al Panel
          </button>
          <span className="font-bold text-base sm:text-lg">Directorio de Usuarios y Roles</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1 flex flex-col md:flex-row gap-6">
        
        {/* TABLA DE USUARIOS */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">Personal Registrado</h2>
            <button 
              onClick={() => setMostrarForm(!mostrarForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm shadow-md transition-colors self-start sm:self-auto"
            >
              {mostrarForm ? 'Cerrar Formulario' : '+ Nuevo Usuario'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">DNI</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nombre Completo</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Correo</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{u.dni}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{u.nombres} {u.apellidos}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.correo_institucional}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 uppercase border border-blue-200">
                        {u.rol}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FORMULARIO LATERAL (Se muestra si mostrarForm es true) */}
        {mostrarForm && (
          <div className="w-full md:w-96 bg-white rounded-2xl shadow-lg border-2 border-emerald-500 p-6 h-fit">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">Crear Credenciales</h3>
            <form onSubmit={crearUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">DNI</label>
                <input required name="dni" value={formData.dni} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombres</label>
                  <input required name="nombres" value={formData.nombres} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos</label>
                  <input required name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Institucional</label>
                <input required type="email" name="correo_institucional" value={formData.correo_institucional} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Temporal</label>
                <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asignar Rol</label>
                <select required name="rol" value={formData.rol} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-bold text-slate-700">
                  <option value="investigador">Investigador</option>
                  <option value="revisor">Miembro CIEI (Revisor)</option>
                  <option value="secretario">Secretario CIEI</option>
                  <option value="presidente">Presidente CIEI</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button disabled={cargando} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg mt-4 transition-colors shadow-md">
                {cargando ? 'Registrando...' : 'Registrar Cuenta'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}