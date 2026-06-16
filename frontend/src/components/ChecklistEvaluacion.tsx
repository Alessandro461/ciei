import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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

  const { register, control, watch, reset } = useForm<ChecklistFormValues>({
    defaultValues: {
      respuestas: inicializarRespuestas()
    }
  });

  const { fields } = useFieldArray({
    control,
    name: 'respuestas'
  });

  // Suscribirse a los cambios del formulario para reportarlos al componente padre
  const respuestasWatch = watch('respuestas');

  useEffect(() => {
    onChange({
      tipo_anexo: tipoAnexo,
      respuestas_json: respuestasWatch
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
    return fields.findIndex((field: any) => field.id === id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-800/80 shadow-lg">
        <h3 className="text-sm font-black text-white tracking-wider uppercase mb-1">
          📋 {anexoConfig.titulo}
        </h3>
        <p className="text-[11px] text-slate-400">
          Por favor, califique cada uno de los criterios obligatorios definidos en la normativa.
        </p>
      </div>

      <div className="space-y-6">
        {anexoConfig.secciones.map((seccion, sIdx) => (
          <div key={sIdx} className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800/80 pb-2">
              {seccion.titulo}
            </h4>

            {seccion.subsecciones.map((sub, subIdx) => (
              <div key={subIdx} className="space-y-3">
                {sub.titulo && (
                  <h5 className="text-[11px] font-bold text-slate-300 pl-1">
                    📂 {sub.titulo}
                  </h5>
                )}

                <div className="space-y-3">
                  {sub.preguntas.map((pregunta) => {
                    const fIdx = findPreguntaIndex(pregunta.id);
                    if (fIdx === -1) return null;

                    const currentValoracion = respuestasWatch[fIdx]?.valoracion;
                    const requiresJustification = currentValoracion === 'Insuficiente' || currentValoracion === 'Inadecuado';

                    return (
                      <div 
                        key={pregunta.id} 
                        className={`p-4 rounded-xl border transition-all duration-300 space-y-3 ${
                          requiresJustification 
                            ? 'bg-red-500/5 border-red-500/25 shadow-red-500/5 shadow-md' 
                            : 'bg-slate-900/20 border-slate-800/60 hover:border-slate-800 hover:bg-slate-900/30'
                        }`}
                      >
                        <div className="text-xs font-medium text-slate-200">
                          {pregunta.texto}
                        </div>

                        {/* Opciones de Valoración */}
                        <div className="flex flex-wrap gap-2.5">
                          {['Adecuado', 'Insuficiente', 'Inadecuado', 'No se describe', 'No aplica'].map((opt) => (
                            <label 
                              key={opt} 
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer transition-all duration-200 ${
                                currentValoracion === opt
                                  ? opt === 'Adecuado'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/45'
                                    : opt === 'Insuficiente' || opt === 'Inadecuado'
                                      ? 'bg-red-500/20 text-red-400 border-red-500/45'
                                      : 'bg-blue-500/20 text-blue-400 border-blue-500/45'
                                  : 'bg-slate-950/40 text-slate-400 border-slate-900 hover:border-slate-800 hover:text-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                value={opt}
                                {...register(`respuestas.${fIdx}.valoracion` as const)}
                                className="hidden"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>

                        {/* Justificación Condicional */}
                        {requiresJustification && (
                          <div className="space-y-1 transition-all duration-300">
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-wider block">
                              ⚠️ Justificación requerida
                            </span>
                            <textarea
                              rows={2.5}
                              placeholder="Escriba aquí la justificación detallada y observaciones para esta valoración (Obligatorio)..."
                              required
                              {...register(`respuestas.${fIdx}.justificacion_texto` as const)}
                              className="w-full px-3 py-2 border border-red-500/20 rounded-lg text-xs outline-none focus:border-red-500/50 bg-red-950/10 focus:bg-red-950/20 text-red-100 transition-all font-medium placeholder-red-500/40"
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
