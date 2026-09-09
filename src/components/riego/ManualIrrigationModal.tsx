import React, { useState } from 'react';
import { Nave } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Clock, Droplets, ShieldCheck, X } from 'lucide-react';

interface ManualIrrigationModalProps {
  nave: Nave;
  onClose: () => void;
}

export const ManualIrrigationModal: React.FC<ManualIrrigationModalProps> = ({ nave, onClose }) => {
  const { confirmManualIrrigation } = useFarm();
  const { canPerformIrrigation, currentUser } = useAuth();
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformIrrigation) return;
    setIsSubmitting(true);
    const ok = await confirmManualIrrigation(nave.id, durationMinutes);
    setIsSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 light:text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 light:hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 light:text-slate-900">
              Confirmación de Riego Manual
            </h3>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Protocolo de Seguridad ESP32 • {nave.name} ({nave.id})
            </p>
          </div>
        </div>

        {/* Prompt question specified in user prompt */}
        <div className="p-4 rounded-xl bg-blue-950/40 light:bg-blue-50 border border-blue-900/60 light:border-blue-200 mb-5">
          <p className="text-sm font-semibold text-blue-200 light:text-blue-900">
            "¿Está seguro de que desea activar el riego de {nave.id}?"
          </p>
          <p className="text-xs text-blue-300/80 light:text-blue-700 mt-1">
            Se enviará el comando LoRaWAN <code className="font-mono bg-blue-900/50 px-1 py-0.5 rounded text-[11px]">OPEN_VALVE</code> con corte de seguridad local.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Tiempo máximo de riego permitido:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    durationMinutes === mins
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-slate-800 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 hover:border-blue-400'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-500 mt-1.5">
              * El ESP32 cerrará la electroválvula automáticamente al finalizar los {durationMinutes} minutos, aun si se pierde conexión.
            </p>
          </div>

          {/* Safety rules summary */}
          <div className="p-3 bg-slate-950/60 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200 text-xs space-y-1.5 text-slate-300 light:text-slate-600">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              Verificaciones de Seguridad Automáticas:
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-400 light:text-slate-500">
              <li>Detección de caudal: si a los 45s el flujo es 0 L/min, se aborta el riego.</li>
              <li>Presión de línea debe ser &gt; 1.5 bar.</li>
              <li>Acción atribuida a: <strong>{currentUser.name}</strong> ({currentUser.role}).</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canPerformIrrigation}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Droplets className="w-4 h-4" />
              {isSubmitting ? 'Enviando comando...' : 'Confirmar y Abrir Válvula'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
