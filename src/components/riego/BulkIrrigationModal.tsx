import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Droplets, Clock, ShieldCheck, X, AlertTriangle, Play } from 'lucide-react';

interface BulkIrrigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  mode: 'ALL' | 'SELECTED';
  onConfirm: (durationMinutes: number) => Promise<void>;
}

export const BulkIrrigationModal: React.FC<BulkIrrigationModalProps> = ({
  isOpen,
  onClose,
  count,
  mode,
  onConfirm
}) => {
  const { canPerformIrrigation, currentUser } = useAuth();
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformIrrigation || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(durationMinutes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedFlowRate = (count * 8.2).toFixed(1); // approx 8.2 L/min per nave
  const estimatedTotalLiters = Math.round(count * 8.2 * durationMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 light:text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-200 light:hover:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Droplets className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100 light:text-slate-900 tracking-tight">
              {mode === 'ALL' ? 'Riego Masivo de Todas las Naves' : `Riego Masivo (${count} Naves Seleccionadas)`}
            </h3>
            <p className="text-xs text-slate-400 light:text-slate-500 font-medium">
              Protocolo Industrial LoRaWAN • Dispersión simultánea controlada
            </p>
          </div>
        </div>

        {/* Confirmation Question Banner */}
        <div className="p-4 rounded-2xl bg-blue-950/40 light:bg-blue-50 border border-blue-900/60 light:border-blue-200 mb-5 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 light:text-blue-700 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Confirmación de Operación Masiva</span>
          </div>
          <p className="text-sm font-semibold text-slate-200 light:text-slate-800 leading-relaxed">
            ¿Desea activar el riego simultáneo en <span className="font-mono font-bold text-cyan-400 light:text-cyan-700">{count} {count === 1 ? 'nave' : 'naves'}</span>?
          </p>
          <p className="text-xs text-slate-400 light:text-slate-600">
            Se enviará el comando de apertura de electroválvulas a cada microcontrolador ESP32 con corte por temporizador automático individual.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 light:text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Duración programada del riego por nave:</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20, 30].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-0.5 ${
                    durationMinutes === mins
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-500 text-white shadow-md shadow-blue-500/25'
                      : 'bg-slate-800/80 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 hover:border-blue-400'
                  }`}
                >
                  <span>{mins} min</span>
                  <span className="text-[10px] opacity-75 font-normal">temporizador</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-500 mt-2">
              * El ESP32 de cada nave cerrará la válvula de forma autónoma a los {durationMinutes} minutos.
            </p>
          </div>

          {/* Quick Metrics Forecast */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/60 light:bg-slate-50 rounded-2xl border border-slate-800 light:border-slate-200 text-xs">
            <div>
              <div className="text-[10px] uppercase text-slate-400 light:text-slate-500 font-bold">Caudal Global Estimado</div>
              <div className="text-base font-black font-mono text-cyan-400 light:text-cyan-700 mt-0.5">
                ~{estimatedFlowRate} <span className="text-xs font-normal">L/min</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 light:text-slate-500 font-bold">Consumo Total Estimado</div>
              <div className="text-base font-black font-mono text-blue-400 light:text-blue-700 mt-0.5">
                ~{(estimatedTotalLiters / 1000).toFixed(2)} <span className="text-xs font-normal">m³ ({estimatedTotalLiters.toLocaleString()} L)</span>
              </div>
            </div>
          </div>

          {/* Safety Checklist */}
          <div className="p-3.5 bg-slate-950/40 light:bg-slate-50 rounded-xl border border-slate-800/80 light:border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Garantías de Seguridad Operacional</span>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-1 text-slate-400 light:text-slate-500">
              <li>Las naves en estado <strong>ALARMA</strong> serán omitidas por precaución preventiva.</li>
              <li>El operador <strong>{currentUser.name}</strong> ({currentUser.role}) quedará registrado en la bitácora de auditoría.</li>
              <li>Puede detener todas las naves en cualquier momento mediante el botón de parada masiva.</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canPerformIrrigation || count === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Droplets className="w-4 h-4" />
              <span>{isSubmitting ? 'Iniciando Riego...' : `Confirmar y Regar ${count} ${count === 1 ? 'Nave' : 'Naves'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
