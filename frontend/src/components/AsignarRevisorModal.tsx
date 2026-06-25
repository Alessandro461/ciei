import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

interface Revisor {
  id: number;
  nombres: string;
  apellidos: string;
  carga_activa?: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  solicitudId: number | null;
}

export default function AsignarRevisorModal({ isOpen, onClose, onSuccess, solicitudId }: ModalProps) {
  const [revisores, setRevisores] = useState<Revisor[]>([]);
  const [principalId, setPrincipalId] = useState('');
  const [secundariosIds, setSecundariosIds] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);

  // Cargamos la lista de revisores cuando se abre la ventana
  useEffect(() => {
    if (isOpen) {
      const cargarRevisores = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_URL}/api/solicitudes/revisores/lista`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRevisores(res.data.revisores || []);
        } catch (error) {
          console.error("Error cargando revisores", error);
        }
      };
      cargarRevisores();
    }
  }, [isOpen]);

  if (!isOpen || !solicitudId) return null;

  const handleToggleSecundario = (id: number) => {
    setSecundariosIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handlePrincipalChange = (idStr: string) => {
    setPrincipalId(idStr);
    const idNum = parseInt(idStr, 10);
    // Remover del listado de secundarios si coincide
    setSecundariosIds(prev => prev.filter(sId => sId !== idNum));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalId) return;
    
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/solicitudes/${solicitudId}/asignar`,
        { 
          principal_id: parseInt(principalId, 10),
          secundarios_ids: secundariosIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
      onClose();
      setPrincipalId('');
      setSecundariosIds([]);
    } catch (error: any) {
      const mensajeError = error.response?.data?.error || 'Error al asignar el revisor. Intente nuevamente.';
      alert(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Comisión Evaluadora</h3>
            <p className="text-xs text-slate-500 font-medium">Asigne el revisor principal y los secundarios de este expediente</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 hover:bg-slate-100 p-2 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleccionar Principal */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Revisor Principal ⭐️ (Obligatorio)</label>
            <select
              required
              value={principalId}
              onChange={(e) => handlePrincipalChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="" disabled>-- Seleccione el Revisor Principal --</option>
              {revisores.map(rev => (
                <option key={rev.id} value={rev.id}>
                  {rev.nombres} {rev.apellidos} ({rev.carga_activa !== undefined ? `${rev.carga_activa} asignaciones` : '0 asignaciones'})
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar Secundarios */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Revisores Secundarios (Opcional)</label>
            <p className="text-xs text-slate-400 mb-3 font-medium">Seleccione los revisores de apoyo para esta evaluación (el revisor principal ya no se muestra aquí):</p>
            
            <div className="border border-slate-200 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2 bg-slate-50/50">
              {revisores.filter(rev => rev.id !== parseInt(principalId, 10)).length === 0 ? (
                <p className="text-xs text-slate-400 font-bold text-center py-4">No hay otros revisores disponibles</p>
              ) : (
                revisores
                  .filter(rev => rev.id !== parseInt(principalId, 10))
                  .map(rev => (
                    <label 
                      key={rev.id} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all hover:bg-white ${
                        secundariosIds.includes(rev.id) 
                          ? 'border-blue-200 bg-blue-50/20 text-blue-900 font-bold' 
                          : 'border-slate-100 text-slate-650 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={secundariosIds.includes(rev.id)}
                          onChange={() => handleToggleSecundario(rev.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm">{rev.nombres} {rev.apellidos}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        (rev.carga_activa || 0) >= 3 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {rev.carga_activa || 0} act.
                      </span>
                    </label>
                  ))
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={cargando || !principalId} 
              className="px-6 py-3 text-sm font-black text-white bg-blue-700 hover:bg-blue-800 rounded-xl disabled:opacity-50 shadow-lg shadow-blue-700/20 hover:-translate-y-0.5 transition-all"
            >
              {cargando ? 'Asignando...' : 'Confirmar Comisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}