import React, { useState, useMemo } from 'react';
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
  Gauge,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '60d' | '90d'>('60d');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Dedicated Daily Chart (minimum 2 months) state
  const [dailyRangeDays, setDailyRangeDays] = useState<60 | 75 | 90>(60);
  const [dailyMetric, setDailyMetric] = useState<'irrigation' | 'soil' | 'temperature'>('irrigation');
  const [dailyChartStyle, setDailyChartStyle] = useState<'bar' | 'line'>('bar');

  // Generate continuous synthetic time series data based on selection
  const generateSeries = () => {
    const points = [];
    const count = timeRange === '24h' ? 24 : timeRange === '7d' ? 14 : timeRange === '30d' ? 30 : timeRange === '60d' ? 60 : 90;
    const now = new Date();

    for (let i = count; i >= 0; i--) {
      const d = new Date(now.getTime() - i * (timeRange === '24h' ? 3600000 : 86400000));
      const timeLabel = timeRange === '24h'
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : `${d.getDate()}/${d.getMonth() + 1}`;

      const tBase = 24 + Math.sin(i * 0.35) * 4.5;
      const hBase = 65 - Math.sin(i * 0.35) * 14;
      const s1Base = 42 + Math.cos(i * 0.25) * 6;
      const s2Base = 44 + Math.cos(i * 0.25) * 4;
      const flow = (i % (timeRange === '24h' ? 6 : 3) === 0) ? 8.2 : 0;
      const pressure = flow > 0 ? 2.4 : 2.05;

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

  // Generate continuous daily data for minimum 2 months (60 - 90 days)
  const dailyData = useMemo(() => {
    const data = [];
    const now = new Date();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = dailyRangeDays; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;

      // Weekly irrigation schedule logic (every 2-3 days has irrigation)
      const isIrrigationDay = (i % 3 === 0) || (i % 7 === 1);
      const irrigationLiters = isIrrigationDay ? Math.round(520 + Math.sin(i * 0.8) * 160 + (i % 5) * 45) : 0;
      const irrigationMinutes = isIrrigationDay ? Math.round(20 + Math.sin(i * 0.5) * 10) : 0;

      // Seasonal temperature fluctuation
      const baseTemp = 23.5 + Math.sin(i * 0.12) * 5.2;
      const tMax = Number((baseTemp + 5.5 + Math.cos(i * 0.4) * 1.5).toFixed(1));
      const tMin = Number((baseTemp - 5.5 - Math.sin(i * 0.3) * 1.2).toFixed(1));
      const tAvg = Number(baseTemp.toFixed(1));

      // Soil moisture response to irrigation
      const soilMoisture = Number((43 + (isIrrigationDay ? 8.5 : -2) + Math.cos(i * 0.18) * 4).toFixed(1));
      const soilMoistureDeep = Number((45 + (isIrrigationDay ? 5 : -1) + Math.cos(i * 0.18) * 3).toFixed(1));

      data.push({
        date: dayLabel,
        fullDate: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
        liters: irrigationLiters,
        minutes: irrigationMinutes,
        soil15: Math.max(30, Math.min(65, soilMoisture)),
        soil30: Math.max(35, Math.min(62, soilMoistureDeep)),
        tempMax: tMax,
        tempMin: tMin,
        tempAvg: tAvg
      });
    }
    return data;
  }, [dailyRangeDays]);

  // Aggregate stats for the selected daily period
  const totalLiters = useMemo(() => {
    return dailyData.reduce((acc, curr) => acc + curr.liters, 0);
  }, [dailyData]);

  const irrigationDaysCount = useMemo(() => {
    return dailyData.filter(d => d.liters > 0).length;
  }, [dailyData]);

  const avgTemp = useMemo(() => {
    return (dailyData.reduce((acc, curr) => acc + curr.tempAvg, 0) / dailyData.length).toFixed(1);
  }, [dailyData]);

  const avgSoil = useMemo(() => {
    return (dailyData.reduce((acc, curr) => acc + curr.soil15, 0) / dailyData.length).toFixed(1);
  }, [dailyData]);

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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1 hidden sm:inline">Rango:</span>
          {[
            { id: '24h', label: '24h' },
            { id: '7d', label: '7 Días' },
            { id: '30d', label: '30 Días (1M)' },
            { id: '60d', label: '60 Días (2 Meses)' },
            { id: '90d', label: '90 Días (3 Meses)' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setTimeRange(r.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeRange === r.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <h2 className="font-bold text-slate-100 light:text-slate-900 text-sm flex items-center gap-2">
              <span>{chartType === 'bar' ? 'Gráfico de Barras Histórico' : 'Curva Temporal'} ({selectedNave === 'ALL' ? 'Campo General' : selectedNave})</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 light:bg-slate-200 text-emerald-400 light:text-emerald-700">
                {timeRange === '24h' ? '24 Horas' : timeRange === '7d' ? '7 Días' : timeRange === '30d' ? '30 Días' : timeRange === '60d' ? '60 Días (2 Meses)' : '90 Días (3 Meses)'}
              </span>
            </h2>
            <span className="font-mono text-slate-400 text-[11px]">
              {timeRange === '24h' ? 'Resolución: 1 muestra / hora' : 'Resolución: Muestras diarias por día'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold text-xs hidden sm:inline">Estilo:</span>
            <div className="inline-flex items-center bg-slate-950/80 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'bar'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="Mostrar gráfico en barras"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Barras</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'line'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="Mostrar gráfico en líneas"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Líneas</span>
              </button>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {selectedVariable === 'temp_hum' && (
                  <>
                    <Bar dataKey="temp" name="Temperatura (°C)" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="hum" name="Humedad (%)" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </>
                )}

                {selectedVariable === 'soil' && (
                  <>
                    <Bar dataKey="soil1" name="Humedad Suelo 15cm (%)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="soil2" name="Humedad Suelo 30cm (%)" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="soilTemp" name="Temp Suelo (°C)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </>
                )}

                {selectedVariable === 'flow_pressure' && (
                  <>
                    <Bar dataKey="flow" name="Caudal (L/min)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="pressure" name="Presión (bar)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </>
                )}
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                />
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
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* DEDICATED DAILY CHART (MINIMUM 2 MONTHS / 60+ DAYS) */}
      <div id="grafico-dias-2meses" className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-5">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-100 light:text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Gráfico Diario Acumulado por Días</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Mínimo {dailyRangeDays} Días ({dailyRangeDays >= 60 ? `${(dailyRangeDays / 30).toFixed(0)} Meses` : ''})
                  </span>
                </h2>
                <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                  Visualización continua día a día para evaluar tendencias estacionales, ciclos de riego y descanso hídrico
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Metric, Range, Style */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Range Selector: 60 días (2 meses), 75 días, 90 días (3 meses) */}
            <div className="flex items-center gap-1 bg-slate-950/80 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300">
              <button
                type="button"
                onClick={() => setDailyRangeDays(60)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dailyRangeDays === 60
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                60 Días (2 Meses)
              </button>
              <button
                type="button"
                onClick={() => setDailyRangeDays(75)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dailyRangeDays === 75
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                75 Días (2.5M)
              </button>
              <button
                type="button"
                onClick={() => setDailyRangeDays(90)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  dailyRangeDays === 90
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                90 Días (3 Meses)
              </button>
            </div>

            {/* Metric Selector */}
            <div className="flex items-center gap-1 bg-slate-950/80 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300">
              <button
                type="button"
                onClick={() => setDailyMetric('irrigation')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  dailyMetric === 'irrigation'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Riego Diario (L)</span>
              </button>
              <button
                type="button"
                onClick={() => setDailyMetric('soil')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  dailyMetric === 'soil'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Humedad Suelo (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setDailyMetric('temperature')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  dailyMetric === 'temperature'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>Temp Máx / Mín (°C)</span>
              </button>
            </div>

            {/* Style: Bar / Line */}
            <div className="inline-flex items-center bg-slate-950/80 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300">
              <button
                type="button"
                onClick={() => setDailyChartStyle('bar')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  dailyChartStyle === 'bar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="Gráfico en barras"
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDailyChartStyle('line')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  dailyChartStyle === 'line'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="Gráfico en líneas"
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Month Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
            <span className="text-slate-400 light:text-slate-500 font-semibold block text-[11px]">
              Días Analizados
            </span>
            <div className="text-xl font-black text-slate-100 light:text-slate-900 mt-0.5">
              {dailyRangeDays} Días
            </div>
            <div className="text-[11px] text-blue-400 mt-1 font-mono">
              Mínimo {(dailyRangeDays / 30).toFixed(0)} meses completos
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
            <span className="text-slate-400 light:text-slate-500 font-semibold block text-[11px]">
              Volumen Total Regado
            </span>
            <div className="text-xl font-black text-blue-400 light:text-blue-600 mt-0.5">
              {(totalLiters / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">m³</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {totalLiters.toLocaleString()} Litros en el período
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
            <span className="text-slate-400 light:text-slate-500 font-semibold block text-[11px]">
              Frecuencia de Riego
            </span>
            <div className="text-xl font-black text-emerald-400 light:text-emerald-600 mt-0.5">
              {irrigationDaysCount} <span className="text-xs font-normal text-slate-400">días con riego</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {((irrigationDaysCount / dailyRangeDays) * 100).toFixed(0)}% de los días activo
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
            <span className="text-slate-400 light:text-slate-500 font-semibold block text-[11px]">
              Promedio Suelo & Temp
            </span>
            <div className="text-xl font-black text-amber-400 light:text-amber-600 mt-0.5">
              {avgSoil}% <span className="text-xs font-normal text-slate-400">• {avgTemp}°C</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-mono">
              Humedad de estrato estable
            </div>
          </div>
        </div>

        {/* Daily Chart Component */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {dailyChartStyle === 'bar' ? (
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={Math.floor(dailyRangeDays / 12)}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 font-sans text-slate-200">
                          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                            <span>{item.fullDate}</span>
                            <span className="text-[10px] text-blue-400 font-mono">Día del ciclo</span>
                          </div>
                          {dailyMetric === 'irrigation' && (
                            <>
                              <div className="flex items-center justify-between gap-3 text-blue-400 font-mono">
                                <span>Riego aplicado:</span>
                                <span className="font-bold">{item.liters} L</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-slate-400 font-mono text-[11px]">
                                <span>Tiempo de riego:</span>
                                <span>{item.minutes} min</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-emerald-400 font-mono text-[11px]">
                                <span>Humedad suelo:</span>
                                <span>{item.soil15}%</span>
                              </div>
                            </>
                          )}
                          {dailyMetric === 'soil' && (
                            <>
                              <div className="flex items-center justify-between gap-3 text-emerald-400 font-mono">
                                <span>Suelo 15cm:</span>
                                <span className="font-bold">{item.soil15}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-teal-400 font-mono">
                                <span>Suelo 30cm:</span>
                                <span className="font-bold">{item.soil30}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-blue-400 font-mono text-[11px]">
                                <span>Riego ese día:</span>
                                <span>{item.liters > 0 ? `${item.liters} L` : 'Sin riego'}</span>
                              </div>
                            </>
                          )}
                          {dailyMetric === 'temperature' && (
                            <>
                              <div className="flex items-center justify-between gap-3 text-rose-400 font-mono">
                                <span>Temp Máxima:</span>
                                <span className="font-bold">{item.tempMax}°C</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-amber-400 font-mono">
                                <span>Temp Media:</span>
                                <span className="font-bold">{item.tempAvg}°C</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-sky-400 font-mono">
                                <span>Temp Mínima:</span>
                                <span className="font-bold">{item.tempMin}°C</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />

                {dailyMetric === 'irrigation' && (
                  <Bar
                    dataKey="liters"
                    name="Volumen Regado por Día (Litros)"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                )}

                {dailyMetric === 'soil' && (
                  <>
                    <Bar
                      dataKey="soil15"
                      name="Humedad Suelo 15cm (%)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={12}
                    />
                    <Bar
                      dataKey="soil30"
                      name="Humedad Suelo 30cm (%)"
                      fill="#14b8a6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={12}
                    />
                  </>
                )}

                {dailyMetric === 'temperature' && (
                  <>
                    <Bar
                      dataKey="tempMax"
                      name="Temperatura Máx (°C)"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={12}
                    />
                    <Bar
                      dataKey="tempAvg"
                      name="Temperatura Media (°C)"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={12}
                    />
                    <Bar
                      dataKey="tempMin"
                      name="Temperatura Mín (°C)"
                      fill="#38bdf8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={12}
                    />
                  </>
                )}
              </BarChart>
            ) : (
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={Math.floor(dailyRangeDays / 12)}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />

                {dailyMetric === 'irrigation' && (
                  <Line
                    type="monotone"
                    dataKey="liters"
                    name="Volumen Regado (Litros/día)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />
                )}

                {dailyMetric === 'soil' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="soil15"
                      name="Humedad Suelo 15cm (%)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="soil30"
                      name="Humedad Suelo 30cm (%)"
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </>
                )}

                {dailyMetric === 'temperature' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="tempMax"
                      name="Temp Máxima (°C)"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="tempAvg"
                      name="Temp Media (°C)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="tempMin"
                      name="Temp Mínima (°C)"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </>
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
