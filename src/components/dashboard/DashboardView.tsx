import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { Nave } from '../../types';
import { TakiiLogo } from '../common/TakiiLogo';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
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
  Pause,
  FastForward,
  RefreshCw,
  Zap,
  Square,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Compass,
  BarChart3,
  MapPin,
  Maximize2,
  Eye,
  Sprout,
  Building2,
  Warehouse,
  Sliders,
  Info,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToNaves: () => void;
  onNavigateToMapa?: () => void;
  onNavigateToRiego: () => void;
  onNavigateToAlertas: () => void;
  onNavigateToAi: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToNaves,
  onNavigateToMapa,
  onNavigateToRiego,
  onNavigateToAlertas,
  onNavigateToAi
}) => {
  const { naves, metrics, alerts, activeIrrigations, setSelectedNaveId, stopIrrigation } = useFarm();

  // Map Summary View State
  const [mapViewMode, setMapViewMode] = useState<'status' | 'moisture' | 'irrigation' | 'temperature'>('status');
  const [hoveredNave, setHoveredNave] = useState<Nave | null>(null);
  const [activeNave, setActiveNave] = useState<Nave | null>(null);

  // Summary Chart State
  const [summaryRange, setSummaryRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [summaryMetric, setSummaryMetric] = useState<'all' | 'irrigation' | 'moisture' | 'temperature'>('all');

  // Summary Chart Data Generation
  const summaryChartData = useMemo(() => {
    if (summaryRange === '24h') {
      return Array.from({ length: 24 }, (_, i) => {
        const hourStr = `${String(i).padStart(2, '0')}:00`;
        const isMorningPeak = i >= 6 && i <= 10;
        const isEveningPeak = i >= 17 && i <= 20;
        const volume = isMorningPeak ? 18.5 + (i % 3) * 2.1 : isEveningPeak ? 14.2 + (i % 3) * 1.8 : 3.1 + (i % 2) * 1.2;
        const moisture = 32 + Math.sin(i * 0.25) * 4 + (isMorningPeak || isEveningPeak ? 5 : 0);
        const temp = 18 + Math.sin((i - 6) * 0.25) * 8;
        const activeNaves = isMorningPeak ? 8 + (i % 4) : isEveningPeak ? 6 + (i % 3) : 1;

        return {
          time: hourStr,
          volumen: Number(volume.toFixed(1)),
          humedad: Number(moisture.toFixed(1)),
          temperatura: Number(temp.toFixed(1)),
          navesRegando: activeNaves
        };
      });
    } else if (summaryRange === '7d') {
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      return days.map((day, idx) => ({
        time: day,
        volumen: Number((138 + Math.sin(idx) * 28).toFixed(1)),
        humedad: Number((36 + Math.cos(idx) * 3).toFixed(1)),
        temperatura: Number((23.8 + Math.sin(idx * 0.8) * 3.2).toFixed(1)),
        navesRegando: 12 + (idx % 5)
      }));
    } else {
      return Array.from({ length: 30 }, (_, i) => ({
        time: `Día ${i + 1}`,
        volumen: Number((125 + Math.sin(i * 0.5) * 35 + (i % 5) * 4).toFixed(1)),
        humedad: Number((35 + Math.cos(i * 0.3) * 4).toFixed(1)),
        temperatura: Number((22.5 + Math.sin(i * 0.2) * 5.5).toFixed(1)),
        navesRegando: 10 + (i % 7)
      }));
    }
  }, [summaryRange]);

  const summaryTotals = useMemo(() => {
    const totalVol = summaryChartData.reduce((acc, curr) => acc + curr.volumen, 0);
    const avgHum = summaryChartData.reduce((acc, curr) => acc + curr.humedad, 0) / summaryChartData.length;
    const avgTemp = summaryChartData.reduce((acc, curr) => acc + curr.temperatura, 0) / summaryChartData.length;
    const peakNaves = Math.max(...summaryChartData.map(d => d.navesRegando));
    return {
      totalVol: totalVol.toFixed(1),
      avgHum: avgHum.toFixed(1),
      avgTemp: avgTemp.toFixed(1),
      peakNaves
    };
  }, [summaryChartData]);

  // Sync activeNave with hoveredNave or default
  useEffect(() => {
    if (hoveredNave) {
      setActiveNave(hoveredNave);
    }
  }, [hoveredNave]);

  // Fallback to NAVE_108 or first available nave so the telemetry box is ALWAYS fixed & visible
  const displayNave = activeNave || hoveredNave || naves.find(n => n.id === 'NAVE_108') || naves[0] || null;

  // Separate production naves (125) and Almácigos
  const productionNaves = useMemo(() => {
    return naves.filter(n => !n.id.startsWith('ALM_'));
  }, [naves]);

  const almacigosNaves = useMemo(() => {
    return naves.filter(n => n.id.startsWith('ALM_') || n.sector.includes('Almácigo'));
  }, [naves]);

  // Group into 6 Batteries matching the agricultural layout
  const batteries = useMemo(() => {
    return [
      { id: 'B1', name: 'Batería 1 (Oeste)', shortName: 'Bat 1', range: '001 - 021', naves: productionNaves.slice(0, 21) },
      { id: 'B2', name: 'Batería 2', shortName: 'Bat 2', range: '022 - 042', naves: productionNaves.slice(21, 42) },
      { id: 'B3', name: 'Batería 3', shortName: 'Bat 3', range: '043 - 063', naves: productionNaves.slice(42, 63) },
      { id: 'B4', name: 'Batería 4', shortName: 'Bat 4', range: '064 - 084', naves: productionNaves.slice(63, 84) },
      { id: 'B5', name: 'Batería 5', shortName: 'Bat 5', range: '085 - 105', naves: productionNaves.slice(84, 105) },
      { id: 'B6', name: 'Batería 6 (Este)', shortName: 'Bat 6', range: '106 - 125', naves: productionNaves.slice(105, 125) },
    ];
  }, [productionNaves]);

  const mapStats = useMemo(() => {
    const total = naves.length;
    const regando = naves.filter(n => n.status === 'REGANDO').length;
    const alarma = naves.filter(n => n.status === 'ALARMA').length;
    const offline = naves.filter(n => n.status === 'OFFLINE').length;
    const online = naves.filter(n => n.status === 'ONLINE').length;
    const totalFlow = naves.reduce((acc, n) => acc + (n.flowRate || 0), 0).toFixed(1);
    return { total, regando, alarma, offline, online, totalFlow };
  }, [naves]);

  // Water Tank Tile Renderer (Estanque de Agua Vacío / Lleno)
  const renderNaveWaterTankTile = (nave: Nave) => {
    const isIrrigating = nave.status === 'REGANDO';
    const isSelected = displayNave?.id === nave.id;
    const shortId = nave.id.replace('NAVE_', '').replace('ALM_', 'A');

    // Calculate Water Level Fill % (Estanque Lleno / Vacío)
    let fillPercent = 0;
    let fillGradient = 'from-blue-700 via-cyan-500 to-sky-400';
    let isWaterFill = false;

    if (mapViewMode === 'irrigation') {
      if (isIrrigating) {
        fillPercent = 100; // Estanque Lleno!
        isWaterFill = true;
      } else {
        fillPercent = 0; // Estanque Vacío ("quede sin el color azul")
      }
    } else if (mapViewMode === 'moisture') {
      fillPercent = Math.min(100, Math.max(0, nave.soilMoisture1));
      isWaterFill = true;
      if (fillPercent < 28) fillGradient = 'from-amber-600 via-amber-500 to-yellow-400';
      else if (fillPercent < 32) fillGradient = 'from-yellow-600 via-yellow-500 to-amber-300';
      else if (fillPercent <= 50) fillGradient = 'from-emerald-700 via-emerald-500 to-teal-400';
      else fillGradient = 'from-blue-700 via-cyan-500 to-sky-400';
    } else if (mapViewMode === 'temperature') {
      fillPercent = Math.min(100, Math.max(15, ((nave.temperature - 10) / 25) * 100));
      if (nave.temperature < 20) fillGradient = 'from-cyan-800 to-cyan-500';
      else if (nave.temperature <= 26) fillGradient = 'from-emerald-800 to-emerald-500';
      else if (nave.temperature <= 30) fillGradient = 'from-amber-700 to-amber-400';
      else fillGradient = 'from-rose-800 to-rose-500';
    } else {
      // Default 'status' mode
      if (isIrrigating) {
        fillPercent = 100;
        isWaterFill = true;
      } else if (nave.status === 'ONLINE') {
        fillPercent = 100;
        fillGradient = 'from-emerald-700 via-emerald-600 to-emerald-500';
      } else if (nave.status === 'ALARMA') {
        fillPercent = 100;
        fillGradient = 'from-rose-700 via-rose-600 to-rose-500';
      } else {
        fillPercent = 0; // OFFLINE -> Estanque Vacío
      }
    }

    return (
      <button
        key={nave.id}
        onClick={() => setSelectedNaveId(nave.id)}
        onMouseEnter={() => setHoveredNave(nave)}
        onMouseLeave={() => setHoveredNave(null)}
        className={`relative overflow-hidden p-1 rounded-md text-[10px] font-mono border text-center transition-all duration-200 transform hover:scale-105 hover:z-20 flex items-center justify-between px-1.5 h-7 ${
          isIrrigating
            ? 'border-cyan-400/90 shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400/60 bg-slate-950'
            : isSelected
            ? 'border-emerald-400 ring-2 ring-emerald-400/80 bg-slate-900'
            : nave.status === 'ALARMA'
            ? 'border-rose-500 shadow-rose-900/40 bg-slate-950'
            : nave.status === 'OFFLINE'
            ? 'border-slate-800/80 bg-slate-950/90 opacity-50'
            : 'border-slate-700/70 bg-slate-950/80 hover:border-slate-500'
        }`}
        title={`${nave.id} | Temp: ${nave.temperature}°C | Suelo: ${nave.soilMoisture1}% | Estado: ${nave.status}`}
      >
        {/* Estanque de Agua Background Liquid Fill */}
        {fillPercent > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${fillGradient} transition-all duration-700 ease-out ${
              isWaterFill ? 'animate-liquid-fill animate-water-surface' : ''
            }`}
            style={{ height: `${fillPercent}%` }}
          >
            {/* Water Surface Wave Line for Irrigating Tank */}
            {isWaterFill && (
              <div className="absolute top-0 inset-x-0 h-0.5 bg-sky-200/90 shadow-[0_0_8px_#38bdf8] animate-pulse" />
            )}
          </div>
        )}

        {/* Empty Tank Structure Grid lines when 0% (quede sin el color azul) */}
        {fillPercent === 0 && (
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
        )}

        {/* Foreground Label & Badges */}
        <span className="relative z-10 font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] truncate">
          {shortId}
        </span>

        <span className="relative z-10 text-[9px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] flex items-center gap-0.5">
          {isIrrigating ? (
            <span className="flex items-center text-cyan-100 font-black animate-pulse">
              💧 <span className="hidden sm:inline text-[8px] ml-0.5">{nave.flowRate}L</span>
            </span>
          ) : mapViewMode === 'moisture' ? (
            `${nave.soilMoisture1}%`
          ) : mapViewMode === 'temperature' ? (
            `${nave.temperature}°`
          ) : (
            shortId
          )}
        </span>
      </button>
    );
  };

  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
        Cargando telemetría del campo VEGALINK...
      </div>
    );
  }

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

      {/* MAPA RESUMIDO DE TODAS LAS NAVES ONLINE (125 PRODUCCIÓN + 3 ALMÁCIGOS) */}
      <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-xl space-y-4">
        {/* Map Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 light:border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MapPin className="w-5 h-5 text-emerald-400 animate-bounce" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-100 light:text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Mapa Resumido del Campo (128 Naves en Vivo)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ● TELEMETRÍA LORA EN TIEMPO REAL
                  </span>
                </h2>
                <p className="text-xs text-slate-400 light:text-slate-500">
                  Vista panorámica de las 6 baterías de producción y sector de almácigos
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Layer Selector Buttons */}
            <div className="inline-flex items-center bg-slate-950 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMapViewMode('status')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  mapViewMode === 'status'
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Estado General</span>
              </button>

              <button
                type="button"
                onClick={() => setMapViewMode('moisture')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  mapViewMode === 'moisture'
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Humedad Suelo</span>
              </button>

              <button
                type="button"
                onClick={() => setMapViewMode('irrigation')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  mapViewMode === 'irrigation'
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Riego Activo ({mapStats.regando})</span>
              </button>

              <button
                type="button"
                onClick={() => setMapViewMode('temperature')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  mapViewMode === 'temperature'
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Temperatura</span>
              </button>
            </div>

            {/* Expand Full Map Button */}
            {onNavigateToMapa && (
              <button
                onClick={onNavigateToMapa}
                className="px-3 py-1.5 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-200 light:text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 light:border-slate-300"
                title="Abrir mapa satelital ortofoto con controles interactivos avanzados"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Mapa Satelital Completo</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-950/70 light:bg-slate-50 rounded-xl border border-slate-800/80 light:border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-400 light:text-slate-600">Total Naves:</span>
            <span className="font-mono font-bold text-slate-100 light:text-slate-900">{mapStats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400 light:text-slate-600">Normales:</span>
            <span className="font-mono font-bold text-emerald-400">{mapStats.online}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <span className="text-slate-400 light:text-slate-600">Regando:</span>
            <span className="font-mono font-bold text-blue-400">{mapStats.regando}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-400 light:text-slate-600">Alertas:</span>
            <span className="font-mono font-bold text-rose-400">{mapStats.alarma}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-slate-400 light:text-slate-600">Caudal Total:</span>
            <span className="font-mono font-bold text-cyan-400">{mapStats.totalFlow} L/min</span>
          </div>
        </div>

        {/* Telemetry Info Banner (Permanently Fixed Height & Visible) */}
        {displayNave && (() => {
          const naveAlert = alerts.find(a => a.greenhouseId === displayNave.id && a.state !== 'RESUELTA');
          const isAlarm = displayNave.status === 'ALARMA' || Boolean(naveAlert);

          return (
            <div className={`py-2.5 px-3.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-xl transition-all min-h-[74px] ${
              isAlarm 
                ? 'bg-rose-950/90 border-2 border-rose-500 shadow-rose-900/30' 
                : 'bg-slate-950 border border-emerald-500/40'
            }`}>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg border ${
                  isAlarm 
                    ? 'bg-rose-900 text-rose-200 border-rose-500 animate-pulse' 
                    : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                }`}>
                  {displayNave.id}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{displayNave.name || displayNave.sector}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      displayNave.status === 'REGANDO'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
                        : displayNave.status === 'ALARMA'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : displayNave.status === 'OFFLINE'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {displayNave.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                    <span>Modo: <strong className="text-slate-300">{displayNave.controlMode}</strong></span>
                    <span>•</span>
                    <span>Gateway: <strong className="text-slate-300">{displayNave.gatewayId || 'GW_LORA_SUR_02'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Explicit Alarm Cause Banner in Telemetry Box if in Alarm */}
              {isAlarm && (
                <div className="flex-1 min-w-[200px] max-w-[480px] px-2.5 py-1.5 rounded-lg bg-rose-900/40 border border-rose-500/50 text-rose-200 text-xs overflow-hidden">
                  <span className="font-bold text-rose-300 flex items-center gap-1 text-[10px] uppercase tracking-wider shrink-0">
                    <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce shrink-0" />
                    Causa de Activación de Alarma:
                  </span>
                  <p className="text-[11px] font-medium text-rose-100 mt-0.5 leading-tight line-clamp-2" title={naveAlert?.causeReason || naveAlert?.description}>
                    {naveAlert?.causeReason || naveAlert?.description || 'Electroválvula abierta sin confirmación de flujo hidráulico (< 0.5 L/min).'}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Suelo 1</span>
                  <span className="font-bold text-emerald-400">{displayNave.soilMoisture1}%</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Temp Amb</span>
                  <span className="font-bold text-rose-400">{displayNave.temperature}°C</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Humedad Amb</span>
                  <span className="font-bold text-cyan-400">{displayNave.humidity}%</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Caudal</span>
                  <span className="font-bold text-blue-400">{displayNave.flowRate} L/m</span>
                </div>
                <button
                  onClick={() => setSelectedNaveId(displayNave.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Ver Detalle &rarr;
                </button>
              </div>
            </div>
          );
        })()}

        {/* Field Grid Canvas (6 Battery Columns + Almácigos) */}
        <div className="p-4 rounded-2xl bg-slate-950/90 light:bg-slate-900 border border-slate-800 light:border-slate-800 overflow-x-auto shadow-lg w-full">
          <div className="w-full min-w-[720px] grid grid-cols-7 gap-2.5 sm:gap-3.5">
            {/* Batteries 1 to 6 */}
            {batteries.map((battery) => (
              <div key={battery.id} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between space-y-2">
                <div className="text-center border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-bold text-emerald-400 block">{battery.shortName}</span>
                  <span className="text-[9px] font-mono text-slate-400 block">{battery.range}</span>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {battery.naves.map((nave) => renderNaveWaterTankTile(nave))}
                </div>

                <div className="text-[9px] text-center text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                  {battery.naves.filter(n => n.status === 'REGANDO').length > 0 ? (
                    <span className="text-blue-400 font-bold">● {battery.naves.filter(n => n.status === 'REGANDO').length} Regando</span>
                  ) : (
                    <span>OK ({battery.naves.length})</span>
                  )}
                </div>
              </div>
            ))}

            {/* Almácigos Column */}
            <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-900/40 flex flex-col justify-between space-y-2">
              <div className="text-center border-b border-purple-900/40 pb-1.5">
                <span className="text-xs font-bold text-purple-300 block flex items-center justify-center gap-1">
                  <Sprout className="w-3 h-3 text-purple-400" /> Almácigos
                </span>
                <span className="text-[9px] font-mono text-purple-400/70 block">Germinación</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 my-auto">
                {almacigosNaves.map((nave) => renderNaveWaterTankTile(nave))}
              </div>

              <div className="text-[9px] text-center text-purple-300 font-mono pt-1 border-t border-purple-900/40">
                <span>3 Cámaras Siembra</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-300">Simbología ({mapViewMode === 'status' ? 'Estado' : mapViewMode === 'moisture' ? 'Humedad Suelo' : mapViewMode === 'temperature' ? 'Temperatura' : 'Riego'}):</span>
            
            {mapViewMode === 'status' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600 border border-emerald-400 inline-block" /> Operativa / Normal</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-600 border border-blue-300 inline-block animate-pulse" /> Regando en Vivo</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-600 border border-rose-400 inline-block" /> Alerta Técnica</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700 inline-block" /> Desconectada</span>
              </>
            )}

            {mapViewMode === 'moisture' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Seco (&lt;28%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-yellow-400 inline-block" /> Bajo (28-32%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" /> Óptimo (33-50%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" /> Saturado (&gt;50%)</span>
              </>
            )}

            {mapViewMode === 'temperature' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-700 inline-block" /> Frío (&lt;20°C)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" /> Confort (20-26°C)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Templado (27-30°C)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" /> Calor (&gt;30°C)</span>
              </>
            )}

            {mapViewMode === 'irrigation' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gradient-to-t from-blue-600 to-cyan-400 ring-2 ring-cyan-400 inline-block animate-pulse" /> Estanque Lleno (Regando)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-700 inline-block" /> Estanque Vacío (Sin Azul - Standby)</span>
              </>
            )}
          </div>

          <div className="font-mono text-slate-500 text-[10px]">
            Lotes A, B, C, D, E • Finca San Francisco, Chile
          </div>
        </div>
      </div>

      {/* Full-Width Summary Chart Section (Gráfico Resumen del Fundo) */}
      <div className="w-full p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-xl space-y-4">
        {/* Chart Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 light:border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 light:text-slate-900 flex items-center gap-2">
                <span>Gráfico Resumen General del Fundo</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  En Tiempo Real
                </span>
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                Comportamiento consolidado de telemetría, caudal y microclima (125 Naves)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Switchers */}
            <div className="p-1 rounded-xl bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 flex items-center gap-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSummaryMetric('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  summaryMetric === 'all'
                    ? 'bg-slate-800 light:bg-white text-emerald-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                Multivariable
              </button>
              <button
                type="button"
                onClick={() => setSummaryMetric('irrigation')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  summaryMetric === 'irrigation'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Volumen (m³)</span>
              </button>
              <button
                type="button"
                onClick={() => setSummaryMetric('moisture')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  summaryMetric === 'moisture'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Humedad (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setSummaryMetric('temperature')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  summaryMetric === 'temperature'
                    ? 'bg-rose-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Temperatura (°C)</span>
              </button>
            </div>

            {/* Time Range Selectors */}
            <div className="p-1 rounded-xl bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 flex items-center gap-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSummaryRange('24h')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  summaryRange === '24h'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                24H
              </button>
              <button
                type="button"
                onClick={() => setSummaryRange('7d')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  summaryRange === '7d'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setSummaryRange('30d')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  summaryRange === '30d'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
              >
                30D
              </button>
            </div>
          </div>
        </div>

        {/* KPI Mini Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/80 light:bg-slate-50 border border-blue-500/20 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Volumen Agrupado</span>
            <span className="text-base font-mono font-black text-blue-400 mt-0.5 block">{summaryTotals.totalVol} m³</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Total en ventana {summaryRange}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 light:bg-slate-50 border border-emerald-500/20 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Humedad Suelo Promedio</span>
            <span className="text-base font-mono font-black text-emerald-400 mt-0.5 block">{summaryTotals.avgHum}%</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Estrato 1 (15 cm)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 light:bg-slate-50 border border-rose-500/20 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Temperatura Promedio</span>
            <span className="text-base font-mono font-black text-rose-400 mt-0.5 block">{summaryTotals.avgTemp} °C</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Microclima ambiental</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 light:bg-slate-50 border border-cyan-500/20 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pico Simultáneo de Riego</span>
            <span className="text-base font-mono font-black text-cyan-400 mt-0.5 block">{summaryTotals.peakNaves} Naves</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Máximo en paralelo</span>
          </div>
        </div>

        {/* Chart Rendering Container */}
        <div className="w-full h-[280px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summaryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {(summaryMetric === 'all' || summaryMetric === 'irrigation') && (
                <Area
                  type="monotone"
                  dataKey="volumen"
                  name="Volumen Riego (m³)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVol)"
                />
              )}

              {(summaryMetric === 'all' || summaryMetric === 'moisture') && (
                <Area
                  type="monotone"
                  dataKey="humedad"
                  name="Humedad Suelo (%)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHum)"
                />
              )}

              {(summaryMetric === 'all' || summaryMetric === 'temperature') && (
                <Area
                  type="monotone"
                  dataKey="temperatura"
                  name="Temperatura (°C)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTemp)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
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
