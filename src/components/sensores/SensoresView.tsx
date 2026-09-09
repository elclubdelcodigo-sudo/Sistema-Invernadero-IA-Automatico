import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  Thermometer,
  Droplets,
  Layers,
  Activity,
  Gauge,
  Wifi,
  Zap,
  CheckCircle,
  AlertTriangle,
  Search,
  Sliders
} from 'lucide-react';

export const SensoresView: React.FC = () => {
  const { naves, setSelectedNaveId } = useFarm();
  const [sensorSearch, setSensorSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('TODOS');

  const filteredNaves = naves.filter(n => {
    const q = sensorSearch.toLowerCase();
    const matchQuery = n.id.toLowerCase().includes(q) || n.name.toLowerCase().includes(q);
    if (!matchQuery) return false;

    if (filterType === 'CRITICOS') {
      return n.soilMoisture1 < 30 || n.temperature > 32 || n.pressure < 1.6;
    }
    if (filterType === 'DESCONECTADOS') {
      return n.status === 'OFFLINE';
    }
    return true;
  });

  return (
    <div id="sensores-view" className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
          Red de Sensores Agrícolas
        </h1>
        <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
          Inspección agronómica de telemetría: ambiente, doble estrato de suelo, hidráulica y radiofrecuencia
        </p>
      </div>

      {/* Sensor Type Health Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 light:text-slate-500 mb-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span>SHT31 Ambiente</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-100 light:text-slate-900">125 / 125</div>
          <span className="text-[10px] text-emerald-400">100% Operativos</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 light:text-slate-500 mb-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Suelo 15cm & 30cm</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-100 light:text-slate-900">250 sondas</div>
          <span className="text-[10px] text-emerald-400">Capacitivos 3.3V</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 light:text-slate-500 mb-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>DS18B20 Suelo</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-100 light:text-slate-900">125 sondas</div>
          <span className="text-[10px] text-emerald-400">OneWire digital</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 light:text-slate-500 mb-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Caudalímetros</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-100 light:text-slate-900">125 unidades</div>
          <span className="text-[10px] text-emerald-400">Pulsos Hall</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 light:text-slate-500 mb-1">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transductores</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-100 light:text-slate-900">125 naves</div>
          <span className="text-[10px] text-emerald-400">0 - 10 bar</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 light:text-slate-500 mb-1">
            <Wifi className="w-3.5 h-3.5 text-teal-400" />
            <span>Radio LoRa 915M</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-100 light:text-slate-900">AU915</div>
          <span className="text-[10px] text-emerald-400">RSSI medio: -84dBm</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por nave o sensor..."
            value={sensorSearch}
            onChange={(e) => setSensorSearch(e.target.value)}
            className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType('TODOS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === 'TODOS'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 light:bg-slate-100 text-slate-400'
            }`}
          >
            Todos ({naves.length})
          </button>
          <button
            onClick={() => setFilterType('CRITICOS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === 'CRITICOS'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 light:bg-slate-100 text-slate-400'
            }`}
          >
            Fuera de Rango
          </button>
          <button
            onClick={() => setFilterType('DESCONECTADOS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterType === 'DESCONECTADOS'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 light:bg-slate-100 text-slate-400'
            }`}
          >
            Offline
          </button>
        </div>
      </div>

      {/* Sensor Telemetry Table */}
      <div className="rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 light:bg-slate-100 text-slate-400 light:text-slate-600 uppercase text-[10px] border-b border-slate-800 light:border-slate-200">
              <tr>
                <th className="p-3.5">Nave</th>
                <th className="p-3.5">Temp Amb</th>
                <th className="p-3.5">Hum Amb</th>
                <th className="p-3.5">Suelo 15cm</th>
                <th className="p-3.5">Suelo 30cm</th>
                <th className="p-3.5">Temp Suelo</th>
                <th className="p-3.5">Caudal</th>
                <th className="p-3.5">Presión</th>
                <th className="p-3.5">Voltaje</th>
                <th className="p-3.5">RSSI / SNR</th>
                <th className="p-3.5 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 light:divide-slate-200 text-slate-200 light:text-slate-800 text-[11px]">
              {filteredNaves.map(nave => (
                <tr
                  key={nave.id}
                  onClick={() => setSelectedNaveId(nave.id)}
                  className="hover:bg-slate-800/40 light:hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 font-bold text-emerald-400">{nave.id}</td>
                  <td className={`p-3.5 ${nave.temperature > 32 ? 'text-rose-400 font-bold' : ''}`}>
                    {nave.temperature.toFixed(1)}°C
                  </td>
                  <td className="p-3.5">{nave.humidity}%</td>
                  <td className={`p-3.5 font-bold ${nave.soilMoisture1 < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {nave.soilMoisture1}%
                  </td>
                  <td className="p-3.5 text-teal-400">{nave.soilMoisture2}%</td>
                  <td className="p-3.5">{nave.soilTemperature.toFixed(1)}°C</td>
                  <td className="p-3.5 text-blue-400">{nave.flowRate} L/m</td>
                  <td className={`p-3.5 ${nave.pressure < 1.7 ? 'text-amber-400' : ''}`}>
                    {nave.pressure.toFixed(2)} bar
                  </td>
                  <td className="p-3.5 text-slate-400">{nave.voltage}V</td>
                  <td className="p-3.5 text-slate-400">{nave.rssi} dBm / {nave.snr}</td>
                  <td className="p-3.5 text-right">
                    <button className="text-emerald-400 hover:text-emerald-300 font-bold text-xs">
                      Ver &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
