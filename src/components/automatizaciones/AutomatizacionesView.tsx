import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import {
  Sliders,
  CheckCircle,
  Cpu,
  Clock,
  Droplets,
  Layers,
  Gauge,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const AutomatizacionesView: React.FC = () => {
  const { naves, refreshData, showNotification } = useFarm();
  const { canConfigureDevices } = useAuth();

  const [minMoisture, setMinMoisture] = useState<number>(35);
  const [targetMoisture, setTargetMoisture] = useState<number>(55);
  const [maxMinutes, setMaxMinutes] = useState<number>(20);
  const [minPressure, setMinPressure] = useState<number>(1.5);
  const [flowTimeoutSec, setFlowTimeoutSec] = useState<number>(45);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleApplyToAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfigureDevices) return;
    setIsSyncing(true);
    // Simulate mass downlink dispatch to all ESP32 nodes
    setTimeout(async () => {
      setIsSyncing(false);
      showNotification(`Reglas de riego enviadas a las 125 naves y grabadas en memoria NVS / Flash.`, 'success');
      await refreshData();
    }, 1500);
  };

  return (
    <div id="automatizaciones-view" className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
            Motor de Automatizaciones & Riego Autónomo
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Configuración de umbrales y sincronización con memoria no volátil (NVS) de los nodos ESP32
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 light:bg-emerald-50 border border-emerald-800/40 light:border-emerald-200 text-emerald-400 light:text-emerald-700 text-xs font-mono">
          <CheckCircle className="w-4 h-4" />
          <span>125/125 Nodos Sincronizados</span>
        </div>
      </div>

      {/* Local-First Architecture Explanation Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 light:from-emerald-50 light:to-white border border-emerald-900/40 light:border-emerald-200 text-xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <Cpu className="w-5 h-5" />
          <span>Principio de Resiliencia: "Local-First" en el ESP32</span>
        </div>
        <p className="text-slate-300 light:text-slate-600 leading-relaxed">
          Las reglas definidas en esta pantalla se transmiten vía paquetes LoRaWAN <code>SET_CONFIG</code> y se almacenan en la memoria Flash permanente del ESP32. <strong>Si el campo pierde conexión a Internet, servidor o Gateway, cada nave seguirá regando y cortando con total autonomía física</strong> sin depender de la nube.
        </p>
      </div>

      {/* Global Config Form */}
      <form onSubmit={handleApplyToAll} className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Parámetros Globales de Activación y Seguridad
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
          {/* Min soil moisture */}
          <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2">
            <label className="block font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Humedad Mínima de Disparo:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="15"
                max="50"
                value={minMoisture}
                onChange={(e) => setMinMoisture(Number(e.target.value))}
                className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-white light:text-slate-900 font-mono font-bold"
              />
              <span className="font-bold text-slate-400">%</span>
            </div>
            <p className="text-[11px] text-slate-400">Si la humedad cae por debajo, el ESP32 evalúa activar riego.</p>
          </div>

          {/* Target soil moisture */}
          <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2">
            <label className="block font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-400" />
              Humedad Objetivo (Corte):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="40"
                max="80"
                value={targetMoisture}
                onChange={(e) => setTargetMoisture(Number(e.target.value))}
                className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-white light:text-slate-900 font-mono font-bold"
              />
              <span className="font-bold text-slate-400">%</span>
            </div>
            <p className="text-[11px] text-slate-400">Al alcanzar esta humedad en estrato 15cm, se cierra la válvula.</p>
          </div>

          {/* Max irrigation duration */}
          <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2">
            <label className="block font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Tiempo Máximo (Fail-Safe):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="60"
                value={maxMinutes}
                onChange={(e) => setMaxMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-white light:text-slate-900 font-mono font-bold"
              />
              <span className="font-bold text-slate-400">min</span>
            </div>
            <p className="text-[11px] text-slate-400">Corte forzado por temporizador de seguridad de hardware.</p>
          </div>

          {/* Min pressure required */}
          <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2">
            <label className="block font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-400" />
              Presión Mínima en Matriz:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={minPressure}
                onChange={(e) => setMinPressure(Number(e.target.value))}
                className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-white light:text-slate-900 font-mono font-bold"
              />
              <span className="font-bold text-slate-400">bar</span>
            </div>
            <p className="text-[11px] text-slate-400">Si la presión es inferior, no se abre la válvula para no cavitar la bomba.</p>
          </div>

          {/* Flow verification timeout */}
          <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2">
            <label className="block font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tiempo Verificación Caudal:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="90"
                value={flowTimeoutSec}
                onChange={(e) => setFlowTimeoutSec(Number(e.target.value))}
                className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-white light:text-slate-900 font-mono font-bold"
              />
              <span className="font-bold text-slate-400">seg</span>
            </div>
            <p className="text-[11px] text-slate-400">Si a los {flowTimeoutSec}s no hay pulso de caudal, se cierra y dispara alarma.</p>
          </div>

          {/* Authorized Hours */}
          <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2">
            <label className="block font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              Ventanas Horarias Permitidas:
            </label>
            <input
              type="text"
              disabled
              value="06:00 - 10:00  |  18:00 - 22:00"
              className="w-full bg-slate-900/60 light:bg-slate-100 border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-slate-300 light:text-slate-700 font-mono cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400">Evita riego en horas de máxima radiación solar.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 light:border-slate-200">
          <button
            type="submit"
            disabled={isSyncing || !canConfigureDevices}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Transmitiendo a las 125 naves...' : 'Aplicar y Sincronizar con NVS de las 125 Naves'}
          </button>
        </div>
      </form>
    </div>
  );
};
