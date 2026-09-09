import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Square, AlertOctagon, X, ShieldAlert } from 'lucide-react';

interface StopAllIrrigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCount: number;
  totalNaves: number;
  onConfirm: () => Promise<void>;
}

export const StopAllIrrigationModal: React.FC<StopAllIrrigationModalProps> = ({
  isOpen,
  onClose,
  activeCount,
  totalNaves,
  onConfirm
}) => {
  const { canPerformIrrigation, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!canPerformIrrigation || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 light:text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-200 light:hover:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Square className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100 light:text-slate-900 tracking-tight">
              Detener Todas las Naves
            </h3>
            <p className="text-xs text-slate-400 light:text-slate-500 font-medium">
              Cierre de Seguridad Inmediato de Electroválvulas
            </p>
          </div>
        </div>

        {/* Alert box */}
        <div className="p-4 rounded-2xl bg-rose-950/40 light:bg-rose-50 border border-rose-900/60 light:border-rose-200 mb-5 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 light:text-rose-700 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Parada Masiva de Riego</span>
          </div>
          <p className="text-sm font-semibold text-slate-200 light:text-slate-800 leading-relaxed">
            {activeCount > 0 ? (
              <>
                ¿Desea detener de inmediato el riego en las{' '}
                <span className="font-mono font-bold text-rose-400 light:text-rose-700">
                  {activeCount} {activeCount === 1 ? 'nave que está regando' : 'naves que están regando'}
                </span>?
              </>
            ) : (
              <>
                Se verificará el cierre preventivo de electroválvulas en la totalidad de las{' '}
                <span className="font-mono font-bold text-rose-400 light:text-rose-700">
                  {totalNaves} naves
                </span> del campo.
              </>
            )}
          </p>
          <p className="text-xs text-slate-400 light:text-slate-600">
            Se enviará la orden de cierre inmediato <code className="font-mono bg-rose-900/40 text-rose-300 px-1 py-0.5 rounded text-[11px]">CLOSE_VALVE</code> vía LoRaWAN a todos los dispositivos ESP32.
          </p>
        </div>

        {/* Security Audit */}
        <div className="p-3 bg-slate-950/40 light:bg-slate-50 rounded-xl border border-slate-800/80 light:border-slate-200 text-xs space-y-1 mb-5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
            <ShieldAlert className="w-4 h-4" />
            <span>Registro de Auditoría Operativa</span>
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-500">
            Esta acción se registrará con firma de: <strong>{currentUser.name}</strong> ({currentUser.role}).
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !canPerformIrrigation}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>{isSubmitting ? 'Deteniendo Electroválvulas...' : 'Confirmar y Detener Todas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
