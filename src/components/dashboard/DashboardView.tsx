import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { TakiiLogo } from '../common/TakiiLogo';
import {
  Thermometer,
  Droplets,
  Layers,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle,
  Play,
  Square,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface DashboardViewProps {
  onNavigateToNaves: () => void;
  onNavigateToRiego: () => void;
  onNavigateToAlertas: () => void;
  onNavigateToAi: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToNaves,
  onNavigateToRiego,
  onNavigateToAlertas,
  onNavigateToAi
}) => {
  const { metrics, alerts, activeIrrigations, setSelectedNaveId, stopIrrigation } = useFarm();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');

  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
        Cargando telemetría del campo VEGALINK...
      </div>
    );
  }

  // Generate dynamic chart data based on timeRange
  const generateTrendData = () => {
    const points = [];
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const labelPrefix = timeRange === '24h' ? 'h' : 'd';
    
    for (let i = hours; i >= 0; i--) {
      const label = timeRange === '24h' 
        ? `${String((24 - i) % 24).padStart(2, '0')}:00` 
        : `Día -${i}`;
      
      const temp = Number((23 + Math.sin(i * 0.4) * 4.5).toFixed(1));
      const hum = Math.round(68 - Math.sin(i * 0.4) * 18);
      const soilHum = Number((43 + Math.cos(i * 0.3) * 6).toFixed(1));
      const waterLiters = (i % 6 === 0 || i % 6 === 1) ? Math.round(380 + Math.random() * 120) : Math.round(60 + Math.random() * 40);
      const irrigationHours = Number((waterLiters / 250).toFixed(1));

      points.push({
        label,
        temp,
        hum,
        soilHum,
        waterLiters,
        irrigationHours
      });
    }
    return points;
  };

  const chartData = generateTrendData();

  return (
    <div id="dashboard-view" className="space-y-6 animate-fadeIn">
      {/* Takii Seed Corporate Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 light:from-white light:via-slate-50 light:to-white border border-slate-800 light:border-slate-200 p-5 shadow-sm">
        {/* Tricolor top border accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 flex">
          <div className="flex-1 bg-[#E52421]" />
          <div className="flex-1 bg-[#0082CA]" />
          <div className="flex-1 bg-[#F5A81C]" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-4">
            <TakiiLogo size="lg" showWordmark={true} showSubtitle={true} subtitle="Since 1835 • Líder en el desarrollo y producción de semillas de hortalizas y flores" />
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 light:bg-white border border-slate-800 light:border-slate-200 font-mono text-xs flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 light:text-slate-700">125 Naves Conectadas</span>
              <span className="text-slate-500">•</span>
              <span className="text-[#0082CA] font-bold">LoRaWAN 915 MHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Status Cards: 125 NAVES, 118 ONLINE, 4 OFFLINE, 3 CON ALARMA, 7 REGANDO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total */}
        <div
          onClick={onNavigateToNaves}
          className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 hover:border-slate-700 light:hover:border-slate-300 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-400 light:text-slate-500 text-xs mb-1">
            <span className="font-bold tracking-wider uppercase text-[11px]">Total Naves</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-slate-400" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-100 light:text-slate-900 tracking-tight">
            {metrics.totalNaves}
          </div>
          <div className="text-[11px] text-slate-400 light:text-slate-500 mt-1 font-medium">
            Capacidad 100% monitoreada
          </div>
        </div>

        {/* Card 2: Online */}
        <div
          onClick={onNavigateToNaves}
          className="p-4 rounded-2xl bg-emerald-950/20 light:bg-emerald-50 border border-emerald-900/40 light:border-emerald-200 hover:border-emerald-600 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-emerald-400 light:text-emerald-700 text-xs mb-1">
            <span className="font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 light:text-emerald-700 tracking-tight">
            {metrics.navesOnline}
          </div>
          <div className="text-[11px] text-emerald-500/80 light:text-emerald-600 mt-1 font-medium">
            Telemetría LoRa continua
          </div>
        </div>

        {/* Card 3: Regando */}
        <div
          onClick={onNavigateToRiego}
          className="p-4 rounded-2xl bg-blue-950/20 light:bg-blue-50 border border-blue-900/40 light:border-blue-200 hover:border-blue-500 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-blue-400 light:text-blue-700 text-xs mb-1">
            <span className="font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
              Regando
            </span>
            <span className="font-mono text-xs font-bold text-blue-300">{metrics.currentTotalFlowRate} L/m</span>
          </div>
          <div className="text-3xl font-black font-mono text-blue-400 light:text-blue-700 tracking-tight">
            {metrics.navesRegando}
          </div>
          <div className="text-[11px] text-blue-400/80 light:text-blue-600 mt-1 font-medium">
            Válvulas 24V activas
          </div>
        </div>

        {/* Card 4: Con Alarma */}
        <div
          onClick={onNavigateToAlertas}
          className="p-4 rounded-2xl bg-rose-950/20 light:bg-rose-50 border border-rose-900/40 light:border-rose-200 hover:border-rose-500 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between text-rose-400 light:text-rose-700 text-xs mb-1">
            <span className="font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Con Alarma
            </span>
            <span className="text-[11px] font-mono text-rose-300 font-bold">Atención</span>
          </div>
          <div className="text-3xl font-black font-mono text-rose-400 light:text-rose-700 tracking-tight">
            {metrics.navesConAlarma}
          </div>
          <div className="text-[11px] text-rose-400/80 light:text-rose-600 mt-1 font-medium">
            Revisar incidencias
          </div>
        </div>

        {/* Card 5: Offline */}
        <div
          onClick={onNavigateToNaves}
          className="p-4 rounded-2xl bg-slate-900/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 hover:border-slate-700 transition-all cursor-pointer shadow-sm group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-400 light:text-slate-500 text-xs mb-1">
            <span className="font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              Offline
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-slate-300 light:text-slate-700 tracking-tight">
            {metrics.navesOffline}
          </div>
          <div className="text-[11px] text-slate-400 light:text-slate-500 mt-1 font-medium">
            Sin paquetes LoRa &gt;30m
          </div>
        </div>
      </div>

      {/* Field Aggregated Sensor KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span>Temperatura Promedio</span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900 mt-1">
            {metrics.avgTemperature} <span className="text-sm font-normal text-slate-400">°C</span>
          </div>
          <span className="text-[10px] text-emerald-400">±1.2°C variación inter-naves</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs">
            <Droplets className="w-4 h-4 text-sky-400" />
            <span>Humedad Ambiental</span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900 mt-1">
            {metrics.avgHumidity} <span className="text-sm font-normal text-slate-400">%</span>
          </div>
          <span className="text-[10px] text-slate-400">SHT31 en copa de cultivo</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Humedad Suelo Promedio</span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900 mt-1">
            {metrics.avgSoilMoisture} <span className="text-sm font-normal text-slate-400">%</span>
          </div>
          <span className="text-[10px] text-emerald-400">Meta agronómica: 45% - 55%</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Consumo Agua Hoy</span>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400 light:text-blue-700 mt-1">
            {(metrics.totalWaterConsumptionTodayLiters / 1000).toFixed(2)} <span className="text-sm font-normal text-slate-400">m³</span>
          </div>
          <span className="text-[10px] text-slate-400">({metrics.totalWaterConsumptionTodayLiters.toLocaleString()} Litros)</span>
        </div>
      </div>

      {/* Date Range Selector for Charts as mandated in user prompt: Últimas 24 horas, 7 días, 30 días, Personalizado */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 light:bg-slate-50 rounded-xl border border-slate-800 light:border-slate-200">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 light:text-slate-800">
            Comportamiento Agroclimático & Riego
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              timeRange === '24h'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 hover:text-white'
            }`}
          >
            Últimas 24 horas
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              timeRange === '7d'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 hover:text-white'
            }`}
          >
            7 días
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              timeRange === '30d'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 hover:text-white'
            }`}
          >
            30 días
          </button>
          <button
            onClick={() => setTimeRange('custom')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              timeRange === 'custom'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 hover:text-white'
            }`}
          >
            Personalizado
          </button>
        </div>
      </div>

      {/* Main Charts: 1. Temp & Humidity, 2. Soil Moisture & Water Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Temperatura promedio & Humedad ambiental */}
        <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-slate-100 light:text-slate-900 text-sm">
                Temperatura & Humedad Ambiental Promedio
              </h3>
              <p className="text-slate-400 light:text-slate-500 text-[11px]">Sensores SHT31/SHT35 calibrados</p>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700">
              Campo General
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="temp" name="Temperatura (°C)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                <Area type="monotone" dataKey="hum" name="Humedad (%)" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorHum)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Humedad de Suelo & Consumo de Agua */}
        <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-slate-100 light:text-slate-900 text-sm">
                Humedad de Suelo & Consumo de Agua
              </h3>
              <p className="text-slate-400 light:text-slate-500 text-[11px]">Respuesta hídrica y pulsos de caudalímetro</p>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700">
              L/h vs % Suelo
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="right" dataKey="waterLiters" name="Consumo Agua (L)" fill="#3b82f6" opacity={0.85} radius={[4, 4, 0, 0]} />
                <Area yAxisId="left" type="monotone" dataKey="soilHum" name="Humedad Suelo (%)" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Irrigations Spotlight & Alarms Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Active Irrigations */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">
                Naves Regando en Tiempo Real ({activeIrrigations.length})
              </h3>
            </div>
            <button
              onClick={onNavigateToRiego}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Ver panel de riego &rarr;
            </button>
          </div>

          {activeIrrigations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl">
              No hay naves regando actualmente. El sistema está en espera del siguiente ciclo o comando manual.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeIrrigations.map(nave => (
                <div
                  key={nave.id}
                  onClick={() => setSelectedNaveId(nave.id)}
                  className="p-3.5 rounded-xl bg-blue-950/30 light:bg-blue-50 border border-blue-900/50 light:border-blue-200 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white light:text-slate-900">{nave.id}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {nave.flowRate} L/min
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 light:text-slate-500 mt-1">
                      {nave.sector} • Suelo: {nave.soilMoisture1}%
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-blue-400">
                      {Math.floor((nave.activeIrrigation?.remainingSeconds || 0) / 60)}:
                      {String((nave.activeIrrigation?.remainingSeconds || 0) % 60).padStart(2, '0')}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        stopIrrigation(nave.id);
                      }}
                      className="mt-1 px-2 py-0.5 rounded bg-rose-600/80 hover:bg-rose-500 text-[10px] text-white font-bold"
                    >
                      Detener
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 col: AI Insights Teaser */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-950 light:from-purple-50 light:to-white border border-purple-900/40 light:border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">
                VEGALINK AI
              </h3>
            </div>
            <button
              onClick={onNavigateToAi}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              Consultar IA &rarr;
            </button>
          </div>

          <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed">
            Diagnóstico agronómico predictivo activo. Detectadas 2 posibles descalibraciones de humedad y estimado ahorro de <strong>42.8 m³</strong> para este ciclo.
          </p>

          <div className="p-3 rounded-xl bg-purple-950/40 light:bg-purple-100/60 border border-purple-900/40 light:border-purple-200 text-xs space-y-1">
            <span className="font-semibold text-purple-300 light:text-purple-900">Recomendación prioritaria:</span>
            <p className="text-[11px] text-slate-300 light:text-slate-700">
              NAVE_003: Válvula activada sin retorno de caudal. Verificar línea de agua antes del ciclo de las 18:00.
            </p>
          </div>

          <button
            onClick={onNavigateToAi}
            className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
          >
            Abrir Asistente Agrícola
          </button>
        </div>
      </div>
    </div>
  );
};
