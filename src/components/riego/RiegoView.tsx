import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import {
  Droplets,
  Clock,
  Square,
  Play,
  CheckCircle2,
  AlertTriangle,
  History,
  Activity,
  Layers,
  Filter,
  Download,
  ShieldAlert
} from 'lucide-react';
import { BulkIrrigationModal } from './BulkIrrigationModal';
import { StopAllIrrigationModal } from './StopAllIrrigationModal';

export const RiegoView: React.FC = () => {
  const {
    naves,
    activeIrrigations,
    irrigationHistory,
    stopIrrigation,
    requestManualIrrigation,
    startAllIrrigations,
    stopAllIrrigations,
    setSelectedNaveId
  } = useFarm();
  const { canPerformIrrigation } = useAuth();
  const [filterResult, setFilterResult] = useState<string>('TODOS');
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [showStopAllModal, setShowStopAllModal] = useState<boolean>(false);

  // Format countdown mm:ss
  const formatTimer = (seconds?: number) => {
    if (seconds === undefined) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredEvents = irrigationHistory.filter(e => {
    if (filterResult === 'TODOS') return true;
    return e.result === filterResult;
  });

  // Calculate totals
  const totalLitersToday = irrigationHistory.reduce((acc, curr) => acc + curr.litersTotal, 0) +
    activeIrrigations.reduce((acc, curr) => acc + (curr.activeIrrigation?.accumulatedLiters || 0), 0);

  return (
    <div id="riego-view" className="space-y-6 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
            Gestión Hídrica & Control de Riego
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Protocolo de Riego Seguro: electroválvulas 24 VDC con verificación de caudal y límite temporal local
          </p>
        </div>

        {/* Action Controls & Global Consumption Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Botón: Regar Todas las Naves */}
          <button
            id="btn-riego-irrigate-all"
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all"
            title="Activar riego simultáneo en todas las naves"
          >
            <Droplets className="w-4 h-4" />
            <span>Regar Todas ({naves.length})</span>
          </button>

          {/* Botón: Detener Todas las Naves */}
          <button
            id="btn-riego-stop-all"
            onClick={() => setShowStopAllModal(true)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
              activeIrrigations.length > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-600/30 animate-pulse'
                : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-900/50'
            }`}
            title="Detener de inmediato todas las electroválvulas"
          >
            <Square className="w-4 h-4 fill-current text-rose-400" />
            <span>
              {activeIrrigations.length > 0
                ? `Detener Todas (${activeIrrigations.length} activas)`
                : 'Detener Todas'}
            </span>
          </button>

          {/* Global Consumption Badge */}
          <div className="flex items-center gap-3 bg-blue-950/40 light:bg-blue-50 border border-blue-900/50 light:border-blue-200 px-4 py-2 rounded-2xl">
            <Droplets className="w-5 h-5 text-blue-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-blue-300 light:text-blue-700 font-bold uppercase tracking-wider">
                Consumo Total Acumulado
              </div>
              <div className="text-lg font-black font-mono text-blue-400 light:text-blue-800">
                {(totalLitersToday / 1000).toFixed(2)} m³ <span className="text-xs font-normal">({Math.round(totalLitersToday).toLocaleString()} L)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Protocol Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 light:text-slate-600 space-y-1">
          <div className="font-bold text-slate-100 light:text-slate-900">
            Mecanismo de Seguridad Anti-Inundación en ESP32
          </div>
          <p className="text-[11px] leading-relaxed">
            Al abrir cualquier válvula, el firmware local verifica el pulso del caudalímetro en los primeros 45 segundos. Si no se detecta caudal, se ejecuta corte de emergencia para proteger la bomba. Si se supera el límite de 20 minutos sin orden de corte del servidor, el ESP32 cierra la válvula por temporizador hardware.
          </p>
        </div>
      </div>

      {/* Section 1: Active Irrigations in Real Time */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 light:text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            Naves Regando en Vivo ({activeIrrigations.length})
          </h2>
          <span className="text-xs font-mono text-blue-400">
            Caudal Total Activo: {activeIrrigations.reduce((a, b) => a + b.flowRate, 0).toFixed(1)} L/min
          </span>
        </div>

        {activeIrrigations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl text-xs text-slate-400">
            No hay ciclos de riego en ejecución en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeIrrigations.map(nave => (
              <div
                key={nave.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 light:from-blue-50 light:to-white border border-blue-800/60 light:border-blue-200 shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-400">{nave.id}</span>
                    <h3 className="font-bold text-base text-white light:text-slate-900">{nave.name}</h3>
                    <span className="text-xs text-slate-400">{nave.sector}</span>
                  </div>

                  {/* Countdown Badge */}
                  <div className="px-3 py-1.5 rounded-xl bg-blue-600/30 border border-blue-500/50 text-right">
                    <span className="text-[10px] font-bold text-blue-300 block uppercase tracking-wider">
                      Temporizador
                    </span>
                    <span className="text-lg font-black font-mono text-white">
                      {formatTimer(nave.activeIrrigation?.remainingSeconds)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/60 light:bg-slate-100 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">CAUDAL</span>
                    <span className="font-bold text-white light:text-slate-900">{nave.flowRate} L/m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ACUMULADO</span>
                    <span className="font-bold text-blue-400">{nave.activeIrrigation?.accumulatedLiters || 0} L</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">HUM. SUELO</span>
                    <span className="font-bold text-emerald-400">{nave.soilMoisture1}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 light:border-slate-200">
                  <span className="text-[11px] text-slate-400">
                    Iniciado por: <strong className="text-slate-300 light:text-slate-700">{nave.activeIrrigation?.initiatedBy}</strong>
                  </span>
                  <button
                    onClick={() => stopIrrigation(nave.id)}
                    disabled={!canPerformIrrigation}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Detener Válvula
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Historical Irrigation Events Log */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 light:text-slate-800">
              Historial de Riegos Realizados ({irrigationHistory.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1 text-slate-300 light:text-slate-700 font-semibold focus:outline-none"
            >
              <option value="TODOS">Todos los resultados</option>
              <option value="COMPLETADO_EXITO">Completado con éxito</option>
              <option value="CORTE_POR_TIEMPO_MAX">Corte por tiempo máx</option>
              <option value="DETENIDO_POR_USUARIO">Detenido por usuario</option>
              <option value="FALLA_SIN_CAUDAL">Falla sin caudal</option>
            </select>

            <a
              href="/api/export/csv"
              download
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 light:bg-slate-100 hover:bg-slate-700 text-slate-300 light:text-slate-700 font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 light:bg-slate-100 text-slate-400 light:text-slate-600 uppercase font-mono text-[10px] border-b border-slate-800 light:border-slate-200">
                <tr>
                  <th className="p-3.5">ID Evento</th>
                  <th className="p-3.5">Nave</th>
                  <th className="p-3.5">Fecha / Hora Inicio</th>
                  <th className="p-3.5">Duración</th>
                  <th className="p-3.5">Litros Totales</th>
                  <th className="p-3.5">Caudal Promedio</th>
                  <th className="p-3.5">Modo</th>
                  <th className="p-3.5">Resultado</th>
                  <th className="p-3.5">Operador / Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 light:divide-slate-200 text-slate-200 light:text-slate-800 font-mono text-[11px]">
                {filteredEvents.map(event => (
                  <tr key={event.id} className="hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-400">{event.id}</td>
                    <td className="p-3.5 font-bold text-emerald-400">{event.greenhouseName}</td>
                    <td className="p-3.5 text-slate-300">{event.startTime.replace('T', ' ').substring(0, 19)}</td>
                    <td className="p-3.5">{event.durationMinutes} min</td>
                    <td className="p-3.5 font-bold text-blue-400">{event.litersTotal.toLocaleString()} L</td>
                    <td className="p-3.5">{event.avgFlowRate} L/min</td>
                    <td className="p-3.5">{event.mode}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        event.result === 'COMPLETADO_EXITO'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : event.result === 'CORTE_POR_TIEMPO_MAX'
                          ? 'bg-amber-500/20 text-amber-400'
                          : event.result === 'FALLA_SIN_CAUDAL'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {event.result}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{event.initiatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bulk Irrigation Modal */}
      <BulkIrrigationModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        count={naves.length}
        mode="ALL"
        onConfirm={async (mins) => {
          await startAllIrrigations(mins);
        }}
      />

      {/* Stop All Modal */}
      <StopAllIrrigationModal
        isOpen={showStopAllModal}
        onClose={() => setShowStopAllModal(false)}
        activeCount={activeIrrigations.length}
        totalNaves={naves.length}
        onConfirm={async () => {
          await stopAllIrrigations();
        }}
      />
    </div>
  );
};
