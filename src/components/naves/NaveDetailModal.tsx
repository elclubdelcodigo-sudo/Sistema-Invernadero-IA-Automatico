import React, { useState } from 'react';
import { Nave, IrrigationRule } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Thermometer,
  Droplets,
  Layers,
  Gauge,
  Wifi,
  Zap,
  Activity,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  Clock,
  Sliders,
  Cpu,
  RefreshCw,
  X,
  FileCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface NaveDetailModalProps {
  nave: Nave;
  onClose: () => void;
}

export const NaveDetailModal: React.FC<NaveDetailModalProps> = ({ nave, onClose }) => {
  const { requestManualIrrigation, stopIrrigation, refreshData, showNotification } = useFarm();
  const { canPerformIrrigation, canConfigureDevices, currentUser } = useAuth();

  // Local state for automation rule editing
  const [rule, setRule] = useState<IrrigationRule>({ ...nave.automationRule });
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [activeTab, setActiveTab] = useState<'sensores' | 'riego' | 'automatizacion' | 'dispositivo'>('sensores');

  // Format countdown for active irrigation: mm:ss
  const formatTimer = (seconds?: number) => {
    if (seconds === undefined) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSaveAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRule(true);
    try {
      await api.updateNaveAutomation(nave.id, rule, currentUser.name);
      showNotification(`Reglas actualizadas y sincronizadas con ${nave.id} (ESP32 Flash).`, 'success');
      await refreshData();
    } catch (err: any) {
      showNotification('Error al sincronizar reglas con el ESP32', 'error');
    } finally {
      setIsSavingRule(false);
    }
  };

  // Mock historic mini-trend points for this specific nave
  const miniChartData = [
    { time: '04:00', temp: nave.temperature - 3.2, hum: nave.humidity + 12, soilHum: nave.soilMoisture1 - 4 },
    { time: '08:00', temp: nave.temperature - 1.5, hum: nave.humidity + 5, soilHum: nave.soilMoisture1 - 2 },
    { time: '12:00', temp: nave.temperature + 2.1, hum: nave.humidity - 8, soilHum: nave.soilMoisture1 },
    { time: '16:00', temp: nave.temperature + 1.2, hum: nave.humidity - 4, soilHum: nave.soilMoisture1 + 3 },
    { time: 'Ahora', temp: nave.temperature, hum: nave.humidity, soilHum: nave.soilMoisture1 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 light:text-slate-900 overflow-hidden my-auto">
        
        {/* Header with Nave ID, Status & Close Button */}
        <div className="p-4 sm:p-6 border-b border-slate-800 light:border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 light:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-lg">
              {nave.id.replace('NAVE_', '#')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white light:text-slate-900">{nave.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  nave.status === 'REGANDO'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
                    : nave.status === 'ALARMA'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : nave.status === 'OFFLINE'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {nave.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{nave.sector}</span>
                <span>•</span>
                <span>DevEUI: <code className="font-mono text-[11px]">{nave.devEui}</code></span>
                <span>•</span>
                <span>{nave.lastCommunication}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white light:hover:text-black rounded-lg hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
              title="Cerrar detalle"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 light:border-slate-200 bg-slate-900 light:bg-slate-100 px-4 sm:px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('sensores')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'sensores'
                ? 'border-emerald-500 text-emerald-400 light:text-emerald-700 bg-emerald-500/5'
                : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            SECCIÓN SENSORES
          </button>
          <button
            onClick={() => setActiveTab('riego')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'riego'
                ? 'border-blue-500 text-blue-400 light:text-blue-700 bg-blue-500/5'
                : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4" />
            SECCIÓN RIEGO
            {nave.status === 'REGANDO' && (
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping ml-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('automatizacion')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'automatizacion'
                ? 'border-purple-500 text-purple-400 light:text-purple-700 bg-purple-500/5'
                : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            SECCIÓN AUTOMATIZACIÓN
          </button>
          <button
            onClick={() => setActiveTab('dispositivo')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'dispositivo'
                ? 'border-amber-500 text-amber-400 light:text-amber-700 bg-amber-500/5'
                : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            CONTROL LOCAL ESP32
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: SENSORES */}
          {activeTab === 'sensores' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Temp */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <span>Temperatura (SHT31)</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.temperature.toFixed(1)} <span className="text-sm font-normal text-slate-400">°C</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">Rango óptimo (18° - 28°)</div>
                </div>

                {/* Humedad */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Droplets className="w-4 h-4 text-sky-400" />
                    <span>Humedad Ambiental</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.humidity} <span className="text-sm font-normal text-slate-400">%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Sensor SHT31/SHT35</div>
                </div>

                {/* Humedad Suelo 1 */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Humedad Suelo 1</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.soilMoisture1} <span className="text-sm font-normal text-slate-400">%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Profundidad: 15 cm</div>
                </div>

                {/* Humedad Suelo 2 */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Layers className="w-4 h-4 text-teal-400" />
                    <span>Humedad Suelo 2</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.soilMoisture2} <span className="text-sm font-normal text-slate-400">%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Profundidad: 30 cm</div>
                </div>

                {/* Temp Suelo */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Thermometer className="w-4 h-4 text-amber-400" />
                    <span>Temp Suelo (DS18B20)</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.soilTemperature.toFixed(1)} <span className="text-sm font-normal text-slate-400">°C</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Sonda OneWire</div>
                </div>

                {/* Caudal */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>Caudal de Riego</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.flowRate.toFixed(1)} <span className="text-sm font-normal text-slate-400">L/min</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Caudalímetro de pulsos</div>
                </div>

                {/* Presión */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Gauge className="w-4 h-4 text-indigo-400" />
                    <span>Presión de Agua</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.pressure.toFixed(2)} <span className="text-sm font-normal text-slate-400">bar</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Transductor 0-5V</div>
                </div>

                {/* LoRa Telemetry + Voltaje */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span>Radio LoRa / Voltaje</span>
                  </div>
                  <div className="text-lg font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.rssi} <span className="text-xs font-normal text-slate-400">dBm</span> • {nave.voltage}V
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">SNR: {nave.snr} dB • Fuente 24VDC</div>
                </div>
              </div>

              {/* Historic Trend Graph */}
              <div className="p-4 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-200 light:text-slate-800">Evolución de Temperatura y Humedad del Suelo (Hoy)</span>
                  <span className="text-slate-400 light:text-slate-500 font-mono">Intervalo LoRa: 15s</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniChartData}>
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="soilGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="temp" name="Temp °C" stroke="#f43f5e" fillOpacity={1} fill="url(#tempGradient)" />
                      <Area type="monotone" dataKey="soilHum" name="Humedad Suelo %" stroke="#10b981" fillOpacity={1} fill="url(#soilGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIEGO */}
          {activeTab === 'riego' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Irrigation Status & Countdown Panel */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 light:from-blue-50 light:to-white border border-blue-900/50 light:border-blue-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 light:text-slate-500 tracking-wider">
                      Estado de Electroválvula 24VDC
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-2xl font-black font-mono ${
                        nave.valveStatus === 'ABIERTA' ? 'text-blue-400' : 'text-slate-400'
                      }`}>
                        VÁLVULA {nave.valveStatus}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        MODO {nave.controlMode}
                      </span>
                    </div>
                  </div>

                  {/* Active Timer Box if irrigating */}
                  {nave.status === 'REGANDO' && (
                    <div className="px-5 py-3 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center gap-3">
                      <Clock className="w-6 h-6 text-blue-400 animate-spin" />
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                          RIEGO ACTIVO
                        </div>
                        <div className="text-2xl font-black font-mono text-white">
                          {formatTimer(nave.activeIrrigation?.remainingSeconds)} restantes
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Water delivery metrics during irrigation */}
                {nave.status === 'REGANDO' && nave.activeIrrigation && (
                  <div className="mt-4 pt-4 border-t border-slate-800 light:border-slate-200 grid grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 light:text-slate-500 text-[10px]">CAUDAL ACTUAL</span>
                      <div className="text-base font-bold text-slate-100 light:text-slate-900">{nave.flowRate} L/min</div>
                    </div>
                    <div>
                      <span className="text-slate-400 light:text-slate-500 text-[10px]">VOLUMEN ACUMULADO</span>
                      <div className="text-base font-bold text-slate-100 light:text-slate-900">{nave.activeIrrigation.accumulatedLiters} L</div>
                    </div>
                    <div>
                      <span className="text-slate-400 light:text-slate-500 text-[10px]">INICIADO POR</span>
                      <div className="text-xs font-bold text-blue-400 truncate">{nave.activeIrrigation.initiatedBy}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons as explicitly mandated */}
              <div className="p-4 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-200 light:text-slate-800">
                  Control Manual de Válvula
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => requestManualIrrigation(nave)}
                    disabled={nave.status === 'REGANDO' || nave.status === 'OFFLINE' || !canPerformIrrigation}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    [ ABRIR VÁLVULA ]
                  </button>

                  <button
                    onClick={() => stopIrrigation(nave.id)}
                    disabled={nave.status !== 'REGANDO' || !canPerformIrrigation}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    [ CERRAR VÁLVULA ]
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 light:text-slate-500">
                  * Toda orden manual exige confirmación explícita con límite máximo y verificación de caudal en terreno.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMATIZACIÓN */}
          {activeTab === 'automatizacion' && (
            <form onSubmit={handleSaveAutomation} className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Regla de Decisión Autónoma (Lógica Local ESP32):
                </div>
                <div className="font-mono text-slate-300 light:text-slate-700 bg-slate-950/80 light:bg-white p-3 rounded-lg border border-slate-800 light:border-slate-300 text-[11px] space-y-1">
                  <p className="text-emerald-400">SI humedad del suelo &lt; {rule.minSoilMoisture} %</p>
                  <p className="text-slate-400">Y horario permitido (06:00 - 10:00 / 18:00 - 22:00)</p>
                  <p className="text-slate-400">Y presión de agua &gt;= {rule.minPressureBar} bar</p>
                  <p className="text-blue-400">ENTONCES: Abrir válvula e iniciar riego.</p>
                  <p className="text-amber-400">Verificar caudal a los {rule.minFlowDetectionSec}s: si no hay flujo -&gt; ALARMA y corte.</p>
                  <p className="text-emerald-400">Cerrar válvula al alcanzar humedad objetivo ({rule.targetSoilMoisture}%) o tiempo máximo ({rule.maxIrrigationMinutes} min).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Humedad mínima del suelo (Disparo):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={rule.minSoilMoisture}
                      onChange={e => setRule({ ...rule, minSoilMoisture: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg px-3 py-2 text-slate-100 light:text-slate-900 font-mono"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Humedad objetivo (Corte):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="30"
                      max="90"
                      value={rule.targetSoilMoisture}
                      onChange={e => setRule({ ...rule, targetSoilMoisture: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg px-3 py-2 text-slate-100 light:text-slate-900 font-mono"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Tiempo máximo de riego (Fail-Safe):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={rule.maxIrrigationMinutes}
                      onChange={e => setRule({ ...rule, maxIrrigationMinutes: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg px-3 py-2 text-slate-100 light:text-slate-900 font-mono"
                    />
                    <span className="text-slate-400 font-bold">min</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Horario Permitido de Riego:
                  </label>
                  <input
                    type="text"
                    disabled
                    value="06:00 - 10:00 | 18:00 - 22:00"
                    className="w-full bg-slate-950/40 light:bg-slate-100 border border-slate-800 light:border-slate-200 rounded-lg px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 light:border-slate-200">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Sincronizado en memoria NVS / Flash de {nave.id}
                </div>
                <button
                  type="submit"
                  disabled={isSavingRule || !canConfigureDevices}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSavingRule ? 'animate-spin' : ''}`} />
                  {isSavingRule ? 'Guardando en ESP32...' : 'Guardar y Sincronizar Reglas'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: CONTROL LOCAL ESP32 */}
          {activeTab === 'dispositivo' && (
            <div className="space-y-4 text-xs animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
                <div className="font-bold text-slate-200 light:text-slate-800 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Estado de Autonomía Local ESP32:
                </div>
                <p className="text-slate-300 light:text-slate-600 leading-relaxed text-xs">
                  Este nodo cuenta con un microcontrolador ESP32 programado bajo la arquitectura <strong>Local-First</strong>.
                  Si se interrumpe la conexión con Hostinger, la red LoRaWAN o Internet, el ESP32 continúa midiendo la humedad de suelo y activando los pulsos de la electroválvula de 24 VDC respetando los límites de seguridad programados en su memoria no volátil.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-2">
                  <div className="p-2.5 rounded bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
                    <span className="text-slate-500 block">FIRMWARE</span>
                    <span className="text-emerald-400 font-bold">{nave.firmwareVersion}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
                    <span className="text-slate-500 block">FRECUENCIA</span>
                    <span className="text-slate-200 light:text-slate-800 font-bold">915 MHz (AU915)</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
                    <span className="text-slate-500 block">GATEWAY ASOCIADO</span>
                    <span className="text-slate-200 light:text-slate-800 font-bold">{nave.gatewayId}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
                    <span className="text-slate-500 block">BUFFER OFFLINE</span>
                    <span className="text-emerald-400 font-bold">0 pendientes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 light:border-slate-200 bg-slate-950/80 light:bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-400 light:text-slate-500 text-[11px]">
            VEGALINK Core IoT • Dispositivo ID: <strong>ESP32_{nave.id}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-200 light:text-slate-800 font-semibold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
