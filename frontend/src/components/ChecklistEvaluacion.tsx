import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getAnexoByTipo } from '../constants/anexosChecklist';

interface RespuestaItem {
  id: string;
  texto: string;
  valoracion: string;
  justificacion_texto: string;
}

interface ChecklistFormValues {
  respuestas: RespuestaItem[];
}

interface ChecklistEvaluacionProps {
  tipoAnexo: 'G' | '7';
  onChange: (data: { tipo_anexo: 'G' | '7'; respuestas_json: RespuestaItem[] }) => void;
  valorInicial?: any[];
}

export default function ChecklistEvaluacion({ tipoAnexo, onChange, valorInicial }: ChecklistEvaluacionProps) {
  const anexoConfig = getAnexoByTipo(tipoAnexo);

  // Mapeamos las preguntas de la configuración a un formato plano para react-hook-form
  const inicializarRespuestas = (): RespuestaItem[] => {
    // Si ya existe un valor inicial (historial o borrador guardado), lo cargamos
    const inicialesMap = new Map<string, any>();
    if (Array.isArray(valorInicial)) {
      valorInicial.forEach(item => {
        if (item && item.id) {
          inicialesMap.set(item.id, item);
        }
      });
    }

    const respuestas: RespuestaItem[] = [];
    anexoConfig.secciones.forEach(seccion => {
      seccion.subsecciones.forEach(subseccion => {
        subseccion.preguntas.forEach(pregunta => {
          const guardado = inicialesMap.get(pregunta.id);
          respuestas.push({
            id: pregunta.id,
            texto: pregunta.texto,
            valoracion: guardado ? (guardado.valoracion || guardado.calif || 'Adecuado') : 'Adecuado',
            justificacion_texto: guardado ? (guardado.justificacion_texto || guardado.just || '') : ''
          });
        });
      });
    });
    return respuestas;
  };

  const { register, watch, reset } = useForm<ChecklistFormValues>({
    defaultValues: {
      respuestas: inicializarRespuestas()
    }
  });

  // Suscribirse a los cambios del formulario para reportarlos al componente padre
  const respuestasWatch = watch('respuestas');

  useEffect(() => {
    onChange({
      tipo_anexo: tipoAnexo,
      respuestas_json: respuestasWatch || []
    });
  }, [respuestasWatch, tipoAnexo]);

  // Si cambia el tipo de anexo o el valor inicial, reiniciamos el formulario
  useEffect(() => {
    reset({
      respuestas: inicializarRespuestas()
    });
  }, [tipoAnexo, valorInicial]);

  // Buscador rápido del índice de una pregunta en el array plano
  const findPreguntaIndex = (id: string) => {
    const flatPreguntas = inicializarRespuestas();
    return flatPreguntas.findIndex((field: any) => field.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Checklist */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-100/85 shadow-sm">
        <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-1 flex items-center gap-1.5">
          📋 {anexoConfig.titulo}
        </h3>
        <p className="text-[10px] text-slate-500 font-medium">
          Por favor, califique cada uno de los criterios obligatorios definidos en la normativa del comité.
        </p>
      </div>

      <div className="space-y-6">
        {anexoConfig.secciones.map((seccion, sIdx) => (
          <div key={sIdx} className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-[11px] font-black text-indigo-700 uppercase tracking-widest border-b border-indigo-100 pb-2">
              {seccion.titulo}
            </h4>

            {seccion.subsecciones.map((sub, subIdx) => (
              <div key={subIdx} className="space-y-3">
                {sub.titulo && (
                  <h5 className="text-[10px] font-extrabold text-slate-600 pl-1 uppercase tracking-wider flex items-center gap-1 mt-3 first:mt-0">
                    📂 {sub.titulo}
                  </h5>
                )}

                <div className="space-y-3">
                  {sub.preguntas.map((pregunta) => {
                    const fIdx = findPreguntaIndex(pregunta.id);
                    if (fIdx === -1) return null;

                    const currentValoracion = respuestasWatch?.[fIdx]?.valoracion;
                    const requiresJustification = currentValoracion === 'Insuficiente' || currentValoracion === 'Inadecuado';

                    return (
                      <div 
                        key={pregunta.id} 
                        className={`p-4.5 rounded-2xl border transition-all duration-300 space-y-3.5 ${
                          requiresJustification 
                            ? 'bg-rose-50/30 border-rose-200/90 shadow-sm shadow-rose-100/20' 
                            : 'bg-white border-slate-200/80 hover:border-slate-300/95 hover:shadow-md hover:shadow-slate-100/50'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-800 leading-relaxed flex items-start gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-black shrink-0 mt-0.5">
                            {fIdx + 1}
                          </span>
                          <span className="flex-1">{pregunta.texto}</span>
                        </div>

                        {/* Opciones de Valoración */}
                        <div className="flex flex-wrap gap-2 pl-7">
                          {['Adecuado', 'Insuficiente', 'Inadecuado', 'No se describe', 'No aplica'].map((opt) => {
                            const isSelected = currentValoracion === opt;
                            
                            let selectedClass = 'bg-slate-50/50 text-slate-500 border-slate-200/85 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300';
                            if (isSelected) {
                              if (opt === 'Adecuado') {
                                selectedClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black shadow-sm shadow-emerald-100/40';
                              } else if (opt === 'Insuficiente' || opt === 'Inadecuado') {
                                selectedClass = 'bg-rose-50 text-rose-800 border-rose-300 font-black shadow-sm shadow-rose-100/40';
                              } else {
                                selectedClass = 'bg-blue-50 text-blue-800 border-blue-300 font-black shadow-sm shadow-blue-100/40';
                              }
                            }

                            return (
                              <label 
                                key={opt} 
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] uppercase tracking-wide cursor-pointer transition-all duration-200 ${selectedClass}`}
                              >
                                <input
                                  type="radio"
                                  value={opt}
                                  {...register(`respuestas.${fIdx}.valoracion` as const)}
                                  className="hidden"
                                />
                                <span className={`w-2.5 h-2.5 rounded-full border transition-all shrink-0 ${
                                  isSelected 
                                    ? opt === 'Adecuado' ? 'bg-emerald-500 border-emerald-600 scale-110 shadow-sm'
                                      : opt === 'Insuficiente' || opt === 'Inadecuado' ? 'bg-rose-500 border-rose-600 scale-110 shadow-sm'
                                      : 'bg-blue-500 border-blue-600 scale-110 shadow-sm'
                                    : 'bg-white border-slate-300 scale-90'
                                }`} />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>

                        {/* Justificación Condicional */}
                        {requiresJustification && (
                          <div className="pl-7 space-y-1.5 transition-all duration-300">
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider block flex items-center gap-1">
                              ⚠️ Justificación requerida
                            </span>
                            <textarea
                              rows={2.5}
                              placeholder="Escriba aquí la justificación detallada y observaciones para esta valoración (Obligatorio)..."
                              required
                              {...register(`respuestas.${fIdx}.justificacion_texto` as const)}
                              className="w-full px-3 py-2.5 border border-rose-200 rounded-xl text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 bg-white text-slate-800 transition-all font-medium placeholder-slate-400 shadow-inner"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
