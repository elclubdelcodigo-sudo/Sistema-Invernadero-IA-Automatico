import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import {
  History,
  Download,
  Calendar,
  Filter,
  Thermometer,
  Droplets,
  Layers,
  Activity,
  Gauge
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const HistoricosView: React.FC = () => {
  const { naves } = useFarm();
  const [selectedNave, setSelectedNave] = useState<string>('ALL');
  const [selectedVariable, setSelectedVariable] = useState<'temp_hum' | 'soil' | 'flow_pressure'>('temp_hum');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Generate continuous synthetic time series data based on selection
  const generateSeries = () => {
    const points = [];
    const count = timeRange === '24h' ? 24 : timeRange === '7d' ? 14 : 30;
    const now = new Date();

    for (let i = count; i >= 0; i--) {
      const d = new Date(now.getTime() - i * (timeRange === '24h' ? 3600000 : 86400000));
      const timeLabel = timeRange === '24h'
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : `${d.getDate()}/${d.getMonth() + 1}`;

      const tBase = 24 + Math.sin(i * 0.5) * 4;
      const hBase = 65 - Math.sin(i * 0.5) * 15;
      const s1Base = 42 + Math.cos(i * 0.3) * 5;
      const s2Base = 44 + Math.cos(i * 0.3) * 3;
      const flow = (i % 6 === 0) ? 8.2 : 0;
      const pressure = (i % 6 === 0) ? 2.4 : 2.1;

      points.push({
        time: timeLabel,
        temp: Number(tBase.toFixed(1)),
        hum: Math.round(hBase),
        soil1: Number(s1Base.toFixed(1)),
        soil2: Number(s2Base.toFixed(1)),
        soilTemp: Number((tBase - 3).toFixed(1)),
        flow,
        pressure
      });
    }
    return points;
  };

  const chartData = generateSeries();

  return (
    <div id="historicos-view" className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
            Análisis Histórico de Telemetría
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Registro cronológico de sensores, consumos de agua y comportamiento microclimático
          </p>
        </div>

        {/* CSV Export Button */}
        <a
          href="/api/export/csv"
          download="vegalink_historico.csv"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
        >
          <Download className="w-4 h-4" />
          Exportar Datos a CSV
        </a>
      </div>

      {/* Control Bar: Nave Selector, Variable Selector, Time Range */}
      <div className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Nave Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Nave:</span>
          <select
            value={selectedNave}
            onChange={(e) => setSelectedNave(e.target.value)}
            className="bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-lg px-3 py-1.5 text-slate-200 light:text-slate-800 font-mono font-bold focus:outline-none"
          >
            <option value="ALL">Campo Completo (Promedio)</option>
            {naves.map(n => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id})
              </option>
            ))}
          </select>
        </div>

        {/* Variable Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedVariable('temp_hum')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              selectedVariable === 'temp_hum'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 light:bg-slate-100 text-slate-400'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            Temp & Humedad
          </button>
          <button
            onClick={() => setSelectedVariable('soil')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              selectedVariable === 'soil'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 light:bg-slate-100 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Humedad de Suelo
          </button>
          <button
            onClick={() => setSelectedVariable('flow_pressure')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              selectedVariable === 'flow_pressure'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 light:bg-slate-100 text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Caudal & Presión
          </button>
        </div>

        {/* Time Range */}
        <div className="flex items-center gap-1.5">
          {['24h', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === range
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-400'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs">
          <h2 className="font-bold text-slate-100 light:text-slate-900 text-sm">
            Curva Temporal ({selectedNave === 'ALL' ? 'Campo General' : selectedNave})
          </h2>
          <span className="font-mono text-slate-400">Resolución: 1 muestra / hora</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {selectedVariable === 'temp_hum' && (
                <>
                  <Line type="monotone" dataKey="temp" name="Temperatura (°C)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="hum" name="Humedad (%)" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                </>
              )}

              {selectedVariable === 'soil' && (
                <>
                  <Line type="monotone" dataKey="soil1" name="Humedad Suelo 15cm (%)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="soil2" name="Humedad Suelo 30cm (%)" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="soilTemp" name="Temp Suelo (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </>
              )}

              {selectedVariable === 'flow_pressure' && (
                <>
                  <Line type="stepAfter" dataKey="flow" name="Caudal (L/min)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="pressure" name="Presión (bar)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
