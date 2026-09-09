import React, { useState, useMemo, useRef } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { Nave } from '../../types';
import { TakiiLogo } from '../common/TakiiLogo';
import {
  Radio,
  Droplets,
  AlertTriangle,
  Layers,
  Search,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Info,
  Play,
  Square,
  Thermometer,
  Activity,
  Compass,
  CheckCircle2,
  Wind,
  ShieldCheck,
  Eye,
  Sliders,
  X,
  Clock,
  Wifi,
  Sprout,
  Building2,
  Warehouse,
  Truck,
  Sparkles,
  Cpu,
  Settings
} from 'lucide-react';

type ViewMode = 'aerial' | 'moisture' | 'irrigation' | 'temperature';

export const FieldMapView: React.FC = () => {
  const { naves, setSelectedNaveId, confirmManualIrrigation, stopIrrigation, setEsp32ModalTarget } = useFarm();
  const { canPerformIrrigation } = useAuth();

  const [selectedBattery, setSelectedBattery] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<ViewMode>('aerial');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredNave, setHoveredNave] = useState<Nave | null>(null);
  const [activeNaveModal, setActiveNaveModal] = useState<Nave | null>(null);
  const [irrigationMinutes, setIrrigationMinutes] = useState<number>(20);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Separate production naves (125) and Almácigos naves (3)
  const productionNaves = useMemo(() => {
    return naves.filter(n => !n.id.startsWith('ALM_'));
  }, [naves]);

  const almacigosNaves = useMemo(() => {
    const list = naves.filter(n => n.id.startsWith('ALM_') || n.sector.includes('Almácigo'));
    if (list.length > 0) return list;
    // Fallback if not yet in database
    return [
      {
        id: 'ALM_01',
        name: 'Almácigo 01 — Germinación & Siembra',
        sector: 'Sector Almácigos',
        status: 'REGANDO' as const,
        controlMode: 'AUTO' as const,
        valveStatus: 'ABIERTA' as const,
        temperature: 24.8,
        humidity: 84,
        soilMoisture1: 72,
        soilMoisture2: 70,
        soilTemperature: 22.6,
        flowRate: 5.2,
        pressure: 2.8,
        voltage: 24.1,
        rssi: -67,
        snr: 9.8,
        lastCommunication: 'Hace 5 segundos',
        gatewayId: 'GW_LORA_CENTRO_01',
        devEui: '70B3D57ED0ALM001',
        appEui: '0000000000000001',
        firmwareVersion: 'v2.4.0-prod',
        x: 92,
        y: 75,
        latitude: -33.4578,
        longitude: -70.6470,
        automationRule: {
          id: 'RULE_ALM_01',
          greenhouseId: 'ALM_01',
          minSoilMoisture: 60,
          targetSoilMoisture: 80,
          maxIrrigationMinutes: 15,
          timeWindows: [{ start: '06:00', end: '11:00' }],
          minPressureBar: 2.2,
          minFlowDetectionSec: 30,
          enabled: true,
          syncedWithEsp32: true
        }
      },
      {
        id: 'ALM_02',
        name: 'Almácigo 02 — Microaspersión & Cámara',
        sector: 'Sector Almácigos',
        status: 'ONLINE' as const,
        controlMode: 'AUTO' as const,
        valveStatus: 'CERRADA' as const,
        temperature: 23.9,
        humidity: 82,
        soilMoisture1: 68,
        soilMoisture2: 66,
        soilTemperature: 21.7,
        flowRate: 0.0,
        pressure: 2.7,
        voltage: 24.0,
        rssi: -69,
        snr: 9.8,
        lastCommunication: 'Hace 5 segundos',
        gatewayId: 'GW_LORA_CENTRO_01',
        devEui: '70B3D57ED0ALM002',
        appEui: '0000000000000001',
        firmwareVersion: 'v2.4.0-prod',
        x: 92,
        y: 82,
        latitude: -33.4581,
        longitude: -70.6470,
        automationRule: {
          id: 'RULE_ALM_02',
          greenhouseId: 'ALM_02',
          minSoilMoisture: 60,
          targetSoilMoisture: 80,
          maxIrrigationMinutes: 15,
          timeWindows: [{ start: '06:00', end: '11:00' }],
          minPressureBar: 2.2,
          minFlowDetectionSec: 30,
          enabled: true,
          syncedWithEsp32: true
        }
      },
      {
        id: 'ALM_03',
        name: 'Almácigo 03 — Enraizamiento & Rustificación',
        sector: 'Sector Almácigos',
        status: 'ONLINE' as const,
        controlMode: 'AUTO' as const,
        valveStatus: 'CERRADA' as const,
        temperature: 23.2,
        humidity: 76,
        soilMoisture1: 64,
        soilMoisture2: 62,
        soilTemperature: 21.0,
        flowRate: 0.0,
        pressure: 2.6,
        voltage: 23.9,
        rssi: -71,
        snr: 9.8,
        lastCommunication: 'Hace 5 segundos',
        gatewayId: 'GW_LORA_CENTRO_01',
        devEui: '70B3D57ED0ALM003',
        appEui: '0000000000000001',
        firmwareVersion: 'v2.4.0-prod',
        x: 92,
        y: 89,
        latitude: -33.4584,
        longitude: -70.6470,
        automationRule: {
          id: 'RULE_ALM_03',
          greenhouseId: 'ALM_03',
          minSoilMoisture: 60,
          targetSoilMoisture: 80,
          maxIrrigationMinutes: 15,
          timeWindows: [{ start: '06:00', end: '11:00' }],
          minPressureBar: 2.2,
          minFlowDetectionSec: 30,
          enabled: true,
          syncedWithEsp32: true
        }
      }
    ];
  }, [naves]);

  // Group naves into the 6 vertical batteries matching the aerial orthophoto:
  // Battery 1: 21 naves (1 to 21) - West edge
  // Battery 2: 21 naves (22 to 42)
  // Battery 3: 21 naves (43 to 63) - Has top shelter & south utility shelter
  // Battery 4: 21 naves (64 to 84) - Has central fertigation shed at south base
  // Battery 5: 21 naves (85 to 105)
  // Battery 6: 20 naves (106 to 125) - East edge adjacent to facilities: 14 upper, 6 lower
  const batteries = useMemo(() => {
    return [
      { id: 'B1', name: 'Batería 1 (Oeste)', naves: productionNaves.slice(0, 21), range: '001 - 021' },
      { id: 'B2', name: 'Batería 2', naves: productionNaves.slice(21, 42), range: '022 - 042' },
      { id: 'B3', name: 'Batería 3', naves: productionNaves.slice(42, 63), range: '043 - 063', hasTopShed: true },
      { id: 'B4', name: 'Batería 4', naves: productionNaves.slice(63, 84), range: '064 - 084', hasShed: true },
      { id: 'B5', name: 'Batería 5', naves: productionNaves.slice(84, 105), range: '085 - 105' },
      {
        id: 'B6',
        name: 'Batería 6 (Este)',
        naves: productionNaves.slice(105, 125),
        upperNaves: productionNaves.slice(105, 119), // 14 upper
        lowerNaves: productionNaves.slice(119, 125), // 6 lower
        range: '106 - 125',
        hasFacilities: true
      },
    ];
  }, [productionNaves]);

  // Overall counts
  const totalNaves = naves.length;
  const navesRegando = naves.filter(n => n.status === 'REGANDO').length;
  const navesAlarma = naves.filter(n => n.status === 'ALARMA').length;
  const navesOffline = naves.filter(n => n.status === 'OFFLINE').length;
  const navesOnline = naves.filter(n => n.status === 'ONLINE').length;
  const totalFlow = naves.reduce((acc, curr) => acc + (curr.flowRate || 0), 0).toFixed(1);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(1.5, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.65, Number((prev - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoomLevel(1);

  // Helper for nave appearance according to selected viewMode
  const getNaveStyle = (nave: Nave) => {
    if (viewMode === 'moisture') {
      const m = nave.soilMoisture1;
      if (m < 28) return 'bg-amber-600/90 text-white border-amber-400 shadow-amber-900/50';
      if (m < 32) return 'bg-yellow-500/90 text-slate-900 border-yellow-300 shadow-yellow-900/40';
      if (m <= 50) return 'bg-emerald-600/90 text-white border-emerald-400 shadow-emerald-900/40';
      return 'bg-blue-600/90 text-white border-blue-400 shadow-blue-900/40';
    }

    if (viewMode === 'irrigation') {
      if (nave.status === 'REGANDO') {
        return 'bg-blue-600 text-white border-blue-300 ring-2 ring-blue-400/80 shadow-lg shadow-blue-500/50 animate-pulse';
      }
      return 'bg-slate-800/80 text-slate-400 border-slate-700/60 opacity-60';
    }

    if (viewMode === 'temperature') {
      const t = nave.temperature;
      if (t < 20) return 'bg-cyan-700 text-white border-cyan-400';
      if (t <= 26) return 'bg-emerald-600 text-white border-emerald-400';
      if (t <= 30) return 'bg-amber-500 text-slate-900 border-amber-300';
      return 'bg-rose-600 text-white border-rose-400 shadow-rose-900/50';
    }

    // Default 'aerial' mode: Realistic arched greenhouse translucent plastic appearance
    switch (nave.status) {
      case 'REGANDO':
        return 'bg-gradient-to-r from-blue-500 via-sky-300 to-blue-500 text-blue-950 font-black border-blue-200 ring-2 ring-blue-400 shadow-md shadow-blue-500/60 animate-pulse';
      case 'ALARMA':
        return 'bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600 text-white font-black border-rose-300 ring-2 ring-rose-500 shadow-md shadow-rose-600/60 animate-pulse';
      case 'OFFLINE':
        return 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-slate-300 border-slate-600 opacity-65';
      default:
        // Translucent arched plastic look matching the drone photo
        return 'bg-gradient-to-r from-slate-200 via-white to-slate-200 light:from-slate-100 light:via-white light:to-slate-200 text-slate-800 border-slate-300/80 shadow-sm hover:border-emerald-400';
    }
  };

  const handleStartIrrigation = async (naveId: string) => {
    setActionInProgress(true);
    try {
      await confirmManualIrrigation(naveId, irrigationMinutes);
      setActiveNaveModal(prev => (prev?.id === naveId ? { ...prev, status: 'REGANDO', flowRate: 8.2 } : prev));
    } finally {
      setActionInProgress(false);
    }
  };

  const handleStopIrrigation = async (naveId: string) => {
    setActionInProgress(true);
    try {
      await stopIrrigation(naveId);
      setActiveNaveModal(prev => (prev?.id === naveId ? { ...prev, status: 'ONLINE', flowRate: 0 } : prev));
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div id="field-map-view" className="space-y-4 animate-fadeIn">
      {/* Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <TakiiLogo size="md" showWordmark={true} showSubtitle={true} subtitle="Estación Experimental" />
          <div className="h-8 w-px bg-slate-800 light:bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-100 light:text-slate-900 tracking-tight">
                Vista Aérea del Campo — 125 Naves + 3 Almácigos
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E52421]/20 text-[#E52421] border border-[#E52421]/30">
                Ortofoto Takii Seed
              </span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
              6 Baterías de macrotúneles, Cabezal Fertirriego, Bodega Principal y Sector de Almácigos
            </p>
          </div>
        </div>

        {/* Action Controls: View Modes & Zoom */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-xs">
            <button
              onClick={() => setViewMode('aerial')}
              title="Vista Satelital / Ortofoto Aérea"
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'aerial'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ortofoto Aérea</span>
            </button>
            <button
              onClick={() => setViewMode('moisture')}
              title="Mapa de Humedad de Suelo (%)"
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'moisture'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Humedad Suelo</span>
            </button>
            <button
              onClick={() => setViewMode('irrigation')}
              title="Estado de Riego y Caudal"
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'irrigation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Riego Activo ({navesRegando})</span>
            </button>
            <button
              onClick={() => setViewMode('temperature')}
              title="Temperatura Térmica (°C)"
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'temperature'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Térmico</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
              title="Reducir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300 light:text-slate-700 min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
              title="Restablecer 100%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ESP32 Role Configuration for all naves */}
          <button
            onClick={() => setEsp32ModalTarget({ targetMode: 'ALL' })}
            className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="Configurar microcontrolador ESP32 como Antena de Sensor o Panel de Mando para todas las naves"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Configurar ESP32</span>
          </button>
        </div>
      </div>

      {/* Battery Quick Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Filtrar Sector:</span>
          <button
            onClick={() => setSelectedBattery('TODAS')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedBattery === 'TODAS'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-900 light:bg-white text-slate-400 light:text-slate-600 border border-slate-800 light:border-slate-200 hover:text-slate-200'
            }`}
          >
            Todas ({naves.length})
          </button>
          {batteries.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBattery(b.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedBattery === b.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 light:bg-white text-slate-400 light:text-slate-600 border border-slate-800 light:border-slate-200 hover:text-slate-200'
              }`}
            >
              {b.name} ({b.naves.length})
            </button>
          ))}
          <button
            onClick={() => setSelectedBattery('ALMACIGOS')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              selectedBattery === 'ALMACIGOS'
                ? 'bg-[#E52421] text-white shadow'
                : 'bg-slate-900 light:bg-white text-rose-400 light:text-rose-600 border border-rose-500/30 hover:bg-rose-500/10'
            }`}
          >
            <Sprout className="w-3 h-3" />
            <span>Almácigos (3)</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Online: <strong className="text-emerald-400">{navesOnline}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping inline-block" />
            Regando: <strong className="text-blue-400">{navesRegando}</strong> ({totalFlow} L/m)
          </span>
          {navesAlarma > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Alarma: <strong className="text-rose-400">{navesAlarma}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Map Canvas: Aerial Agricultural Layout exactly matching the Drone Photo */}
      <div
        ref={containerRef}
        className="relative rounded-2xl bg-[#524434] light:bg-[#a38f78] border border-amber-950/60 light:border-amber-900/30 overflow-x-auto overflow-y-hidden shadow-2xl p-6 select-none transition-all"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(133, 108, 81, 0.4) 0%, rgba(71, 56, 42, 0.95) 100%),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 8px)
          `,
          minHeight: '740px'
        }}
      >
        {/* Top North Perimeter Road & Windbreak Tree Line */}
        <div className="w-full h-9 mb-4 bg-[#7a654f] light:bg-[#b09d87] border-y border-amber-900/40 rounded-lg flex items-center justify-between px-6 text-[10px] font-mono text-amber-200/80 tracking-widest uppercase shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Camino Perimetral Norte • Cortina de Árboles Cortaviento</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Acceso Norte • Portón de Servicio</span>
            <span>•</span>
            <span className="text-emerald-300 font-bold">Red LoRa Norte 915 MHz</span>
          </div>
        </div>

        {/* Scalable Container for the 6 Batteries + East Agroindustrial Complex (including 3 Almácigos) */}
        <div
          className="mx-auto flex items-stretch gap-3 transition-transform origin-top-left"
          style={{
            transform: `scale(${zoomLevel})`,
            minWidth: '1380px',
            maxWidth: '1600px'
          }}
        >
          {/* Left Soil Margin / Outdoor Trial Strip (West Edge) */}
          <div className="w-11 shrink-0 bg-[#695541] light:bg-[#998672] rounded-xl flex flex-col items-center justify-between py-4 border border-amber-900/40 text-center shadow">
            <span className="text-[9px] font-mono font-bold text-amber-200/60 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
              Lindero Oeste
            </span>
            <div className="w-1.5 h-32 bg-amber-900/40 rounded-full my-2" title="Franja de Ensayo Exterior" />
            <span className="text-[9px] font-mono font-bold text-amber-200/60 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
              Canal Drenaje
            </span>
          </div>

          {/* THE 6 BATTERIES OF HORIZONTAL GREENHOUSE TUNNELS (Columns 1 to 6) */}
          {batteries.map((bat, batIdx) => {
            const isDimmed = selectedBattery !== 'TODAS' && selectedBattery !== bat.id && selectedBattery !== 'ALMACIGOS';

            return (
              <React.Fragment key={bat.id}>
                {/* Column Container */}
                <div
                  className={`flex-1 flex flex-col justify-between p-2 rounded-xl bg-[#614e3b]/85 light:bg-[#94816d]/85 border border-amber-900/50 transition-opacity duration-300 shadow-sm ${
                    isDimmed ? 'opacity-25 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  {/* Battery Header Tag */}
                  <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-amber-800/40 text-[10px] font-mono font-bold">
                    <span className="text-amber-200 light:text-amber-950 font-black">{bat.id}</span>
                    <span className="text-amber-300/80 light:text-amber-900 text-[9px]">{bat.range}</span>
                  </div>

                  {/* Special Real-World Landmark: Top dark roof on Battery 3 */}
                  {bat.hasTopShed && (
                    <div className="mb-1.5 p-1 rounded bg-[#2b241c] border border-amber-950 text-[8px] font-mono text-amber-300/80 text-center shadow">
                      <span>Refugio Sombra Norte</span>
                    </div>
                  )}

                  {/* Vertically stacked horizontal greenhouse tunnels */}
                  <div className="flex flex-col gap-1.5 flex-1 justify-between">
                    {bat.naves.map((nave) => {
                      const isHovered = hoveredNave?.id === nave.id;
                      const isRegando = nave.status === 'REGANDO';
                      const isAlarma = nave.status === 'ALARMA';

                      return (
                        <div
                          key={nave.id}
                          id={`map-nave-${nave.id}`}
                          onClick={() => {
                            setSelectedNaveId(nave.id);
                            setActiveNaveModal(nave);
                          }}
                          onMouseEnter={() => setHoveredNave(nave)}
                          onMouseLeave={() => setHoveredNave(null)}
                          className={`group relative h-6 rounded-md border transition-all cursor-pointer flex items-center justify-between px-2 text-[10px] font-mono shadow-sm ${getNaveStyle(
                            nave
                          )} ${isHovered ? 'scale-[1.04] z-20 shadow-lg ring-2 ring-emerald-400' : ''}`}
                          style={{
                            backgroundImage:
                              viewMode === 'aerial' && !isRegando && !isAlarma
                                ? 'repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(148,163,184,0.3) 19px, rgba(148,163,184,0.3) 20px)'
                                : undefined
                          }}
                        >
                          {/* Left: Nave Code */}
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold tracking-tight">
                              {nave.id.replace('NAVE_', '')}
                            </span>
                            {isRegando && (
                              <Droplets className="w-3 h-3 text-blue-900 animate-bounce" />
                            )}
                            {isAlarma && (
                              <AlertTriangle className="w-3 h-3 text-white animate-pulse" />
                            )}
                          </div>

                          {/* Right: Metric */}
                          <div className="text-[9px] font-bold">
                            {viewMode === 'moisture' && (
                              <span>{nave.soilMoisture1}%</span>
                            )}
                            {viewMode === 'temperature' && (
                              <span>{nave.temperature}°C</span>
                            )}
                            {viewMode === 'irrigation' && (
                              <span>{isRegando ? `${nave.flowRate}L/m` : '0L'}</span>
                            )}
                            {viewMode === 'aerial' && (
                              <span className="opacity-90">
                                {isRegando ? `${nave.flowRate}L` : `${nave.soilMoisture1}%`}
                              </span>
                            )}
                          </div>

                          {/* Arched roof curvature gloss highlight */}
                          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/60 rounded-t-md pointer-events-none" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Real-World Landmark: South Fertigation & Pumping Station at base of Battery 4 */}
                  {bat.hasShed && (
                    <div className="mt-2 p-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-900 text-[9px] font-mono flex items-center gap-1.5 shadow-md">
                      <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-black block">Cabezal Fertirriego</span>
                        <span className="text-[8px] text-slate-500">Bombas 1 & 2 • 2.4 bar</span>
                      </div>
                    </div>
                  )}

                  {/* South covered canopy at base of Battery 3 */}
                  {bat.id === 'B3' && (
                    <div className="mt-2 p-1 rounded-lg bg-[#3d3226] border border-amber-900/60 text-[8px] font-mono text-amber-200/80 text-center">
                      <span>Cobertizo Aperos Sur</span>
                    </div>
                  )}
                </div>

                {/* Central Corridor / Street between batteries (Calle 1 to 5) */}
                {batIdx < batteries.length - 1 && (
                  <div className="w-6 shrink-0 bg-[#735e49] light:bg-[#a6937e] rounded flex flex-col items-center justify-between py-2 border-x border-amber-900/30">
                    <span className="text-[8px] font-mono font-bold text-amber-200/50 uppercase [writing-mode:vertical-lr] rotate-180">
                      Calle {batIdx + 1}
                    </span>
                    <div className="w-1 h-24 bg-blue-500/40 rounded-full my-2" title="Tubería Matriz PVC 90mm" />
                    <span className="text-[8px] font-mono font-bold text-amber-200/50 uppercase [writing-mode:vertical-lr] rotate-180">
                      Tubería Riego
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Corridor between Battery 6 and the East Facilities Complex */}
          <div className="w-5 shrink-0 bg-[#735e49] light:bg-[#a6937e] rounded flex flex-col items-center justify-between py-2 border-x border-amber-900/30">
            <span className="text-[8px] font-mono font-bold text-amber-200/50 uppercase [writing-mode:vertical-lr] rotate-180">
              Vía Acceso Este
            </span>
          </div>

          {/* EAST SECTOR COMPLEX: EXACTLY AS IN THE PHOTOGRAPH
              Contains:
              1. Top: Circular Water Reservoir (Estanque Australiano), Solar Shade Mesh House, Parking & Quality Lab Offices
              2. Mid: Main Conditioning & Seed Selection Warehouse (Gabled green ridge) + White Storage Logistics Building
              3. Bottom: THE 3 NAVES DE ALMÁCIGOS (Almácigo 1, 2, 3) + Covered Substrate Patio
          */}
          <div
            className={`w-[280px] shrink-0 flex flex-col justify-between p-3 rounded-2xl bg-[#5c4a38]/90 light:bg-[#917d69]/90 border-2 border-amber-800/60 shadow-xl transition-opacity duration-300 ${
              selectedBattery !== 'TODAS' && selectedBattery !== 'B6' && selectedBattery !== 'ALMACIGOS'
                ? 'opacity-30 pointer-events-none'
                : 'opacity-100'
            }`}
          >
            {/* East Sector Header */}
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-amber-800/50 text-[10px] font-mono font-bold">
              <span className="text-amber-100 light:text-amber-950 font-black flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0082CA]" />
                Complejo Agroindustrial Este
              </span>
              <span className="text-emerald-400 text-[9px] font-bold">TAKII SEED</span>
            </div>

            {/* TOP ZONE: Circular Reservoir Pond & Administrative Offices */}
            <div className="space-y-2 mb-3">
              {/* Circular Water Reservoir + Solar Mesh Drying Structure */}
              <div className="grid grid-cols-2 gap-2">
                {/* Circular Estanque Australiano */}
                <div
                  className="p-2 rounded-xl bg-slate-950/70 border border-slate-700 flex flex-col items-center justify-center text-center shadow-md relative group cursor-pointer"
                  title="Estanque Australiano de Riego: Capacidad 500 m³ • Nivel 88%"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-slate-400 bg-gradient-to-tr from-slate-900 via-blue-900 to-sky-700 flex items-center justify-center relative shadow-inner overflow-hidden">
                    {/* Animated water ripple */}
                    <div className="absolute inset-1 rounded-full bg-blue-500/20 animate-ping opacity-75" />
                    <Droplets className="w-4 h-4 text-sky-300 z-10" />
                  </div>
                  <span className="text-[9px] font-bold font-mono text-slate-200 mt-1">Estanque 500m³</span>
                  <span className="text-[8px] text-sky-400 font-mono font-bold">88% Nivel</span>
                </div>

                {/* Invernadero de Sombra / Secado de Semillas */}
                <div className="p-2 rounded-xl bg-[#1e1b18] border border-amber-900/60 flex flex-col items-center justify-center text-center shadow-md">
                  <div className="w-12 h-8 rounded bg-[#15120f] border border-slate-700 flex items-center justify-center text-slate-400 font-mono text-[8px]">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="text-[9px] font-bold font-mono text-slate-200 mt-1">Sombráculo</span>
                  <span className="text-[8px] text-amber-300/70 font-mono">Malla 50%</span>
                </div>
              </div>

              {/* Parking yard & Offices */}
              <div className="p-2 rounded-xl bg-[#6e5a46]/70 border border-amber-800/40 flex items-center justify-between text-[9px] font-mono text-amber-200">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Patio Maniobras</span>
                </div>
                <span className="text-[8px] text-amber-300/60">Báscula Camiones</span>
              </div>
            </div>

            {/* MID ZONE: Main Seed Warehouse & Packaging Facility */}
            <div className="space-y-2 mb-3">
              {/* Bodega Principal de Acondicionamiento de Semillas (Gabled green ridge) */}
              <div
                className="p-2.5 rounded-xl bg-[#b8c7c9] light:bg-[#cfd9da] border-2 border-emerald-900/60 text-slate-900 shadow-lg relative overflow-hidden"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(16,185,129,0.15) 0px, rgba(16,185,129,0.15) 2px, transparent 2px, transparent 10px)'
                }}
              >
                {/* Gabled roof ridge */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-emerald-800 shadow" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-950 block">Bodega Principal</span>
                    <span className="text-[8px] font-semibold text-emerald-950">Acondicionamiento & Selección</span>
                  </div>
                  <Warehouse className="w-4 h-4 text-emerald-900" />
                </div>
              </div>

              {/* Nave Blanca de Almacenamiento Climatizado y Logística */}
              <div className="p-2.5 rounded-xl bg-white light:bg-slate-100 border-2 border-slate-300 text-slate-900 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-900 block">Nave Blanca de Almacén</span>
                  <span className="text-[8px] font-semibold text-slate-500">Cámaras de Semillas Climatizadas</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[8px] font-bold font-mono">
                  15°C / 40% HR
                </span>
              </div>
            </div>

            {/* BOTTOM ZONE: LAS 3 NAVES DE ALMÁCIGOS (EXPLICITLY REQUESTED BY USER) */}
            <div
              id="sector-almacigos-map"
              className="p-3 rounded-2xl bg-[#3f3123] border-2 border-[#E52421]/60 shadow-xl space-y-2 relative"
            >
              {/* Almácigos Header */}
              <div className="flex items-center justify-between pb-1 border-b border-amber-800/60">
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-black text-white tracking-tight">
                    Sector 3 Naves de Almácigos
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-[#E52421] text-white">
                  3 NAVES
                </span>
              </div>

              {/* The 3 Almácigos Greenhouse Tunnels */}
              <div className="flex flex-col gap-2">
                {almacigosNaves.map((alm) => {
                  const isHovered = hoveredNave?.id === alm.id;
                  const isRegando = alm.status === 'REGANDO';
                  const isAlarma = alm.status === 'ALARMA';

                  return (
                    <div
                      key={alm.id}
                      id={`map-almacigo-${alm.id}`}
                      onClick={() => {
                        setSelectedNaveId(alm.id);
                        setActiveNaveModal(alm);
                      }}
                      onMouseEnter={() => setHoveredNave(alm)}
                      onMouseLeave={() => setHoveredNave(null)}
                      className={`group relative h-9 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between px-3 text-[10px] font-mono shadow-md ${getNaveStyle(
                        alm
                      )} ${
                        isHovered
                          ? 'scale-[1.03] z-20 shadow-xl ring-2 ring-[#E52421]'
                          : 'border-slate-300 hover:border-[#E52421]'
                      }`}
                      style={{
                        backgroundImage:
                          viewMode === 'aerial' && !isRegando && !isAlarma
                            ? 'repeating-linear-gradient(90deg, transparent, transparent 16px, rgba(148,163,184,0.3) 17px, rgba(148,163,184,0.3) 18px)'
                            : undefined
                      }}
                    >
                      {/* Left: Almácigo Identity */}
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-[#E52421]/20 text-[#E52421] border border-[#E52421]/40 flex items-center justify-center font-black text-[10px]">
                          {alm.id.replace('ALM_', 'A')}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block leading-tight text-[11px]">
                            {alm.id === 'ALM_01'
                              ? 'Almácigo 1 (Germinación)'
                              : alm.id === 'ALM_02'
                              ? 'Almácigo 2 (Microaspersión)'
                              : 'Almácigo 3 (Enraizamiento)'}
                          </span>
                          <span className="text-[8px] text-slate-500 font-semibold">
                            {alm.temperature}°C • {alm.humidity}% HR
                          </span>
                        </div>
                      </div>

                      {/* Right: Live Irrigation / Micro-sprinkler state */}
                      <div className="flex items-center gap-1.5">
                        {isRegando ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold animate-pulse">
                            <Droplets className="w-3 h-3 animate-bounce" />
                            <span>{alm.flowRate} L/m</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[9px] font-bold">
                            {alm.soilMoisture1}% Suelo
                          </div>
                        )}
                      </div>

                      {/* Plastic arch top reflection highlight */}
                      <div className="absolute inset-x-0 top-0 h-[3px] bg-white/80 rounded-t-xl pointer-events-none" />
                    </div>
                  );
                })}
              </div>

              {/* Covered Canopy Patio beneath the 3 Almácigos */}
              <div className="p-2 rounded-xl bg-[#c2aa8a] light:bg-[#d8c4a9] border border-amber-950 text-slate-950 text-[9px] font-mono flex items-center justify-between shadow">
                <span className="font-black">Patio Techado Sustratos & Bandejas</span>
                <span className="text-[8px] text-slate-700">Preparación</span>
              </div>
            </div>
          </div>

          {/* Right Soil Margin / Access Way */}
          <div className="w-10 shrink-0 bg-[#695541] light:bg-[#998672] rounded-xl flex flex-col items-center justify-center border border-amber-900/40 text-center">
            <span className="text-[9px] font-mono font-bold text-amber-200/50 uppercase tracking-widest [writing-mode:vertical-lr]">
              Lindero Este
            </span>
          </div>
        </div>

        {/* Bottom South Perimeter Road & External Field Furrows */}
        <div className="w-full mt-4 pt-3 border-t border-amber-900/60 flex flex-wrap items-center justify-between text-[10px] font-mono text-amber-200/80">
          <div className="flex items-center gap-3">
            <span className="font-bold text-amber-100">Camino Principal Sur (Acceso a Báscula)</span>
            <span>•</span>
            <span className="text-amber-300/70">Parcelas Agrícolas Exteriores en Surcos</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Red LoRaWAN Activa</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">100% Cobertura de Campo Takii Seed</span>
          </div>
        </div>

        {/* Floating Quick Inspection Tooltip */}
        {hoveredNave && (
          <div className="absolute bottom-6 left-6 z-30 p-4 rounded-2xl bg-slate-900/95 border border-slate-700 text-slate-100 shadow-2xl text-xs w-72 pointer-events-none animate-fadeIn backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div>
                <span className="font-bold text-emerald-400 font-mono text-sm">{hoveredNave.id}</span>
                <span className="text-[10px] text-slate-400 block">{hoveredNave.name}</span>
              </div>
              <span
                className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  hoveredNave.status === 'REGANDO'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                    : hoveredNave.status === 'ALARMA'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {hoveredNave.status}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Temp / Humedad:</span>
                <span className="font-bold text-white">
                  {hoveredNave.temperature}°C / {hoveredNave.humidity}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Humedad Suelo / Bandeja:</span>
                <span className="font-bold text-emerald-400">
                  {hoveredNave.soilMoisture1}% / {hoveredNave.soilMoisture2}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Caudal / Presión:</span>
                <span className="font-bold text-blue-400">
                  {hoveredNave.flowRate} L/m • {hoveredNave.pressure} bar
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Válvula 24V:</span>
                <span className="font-bold text-white">{hoveredNave.valveStatus}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Señal LoRa (RSSI):</span>
                <span>{hoveredNave.rssi} dBm (Excelente)</span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-emerald-400 text-center font-bold">
              Haga clic para abrir panel de control y riego
            </div>
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-300 light:text-slate-700 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white border border-slate-400" />
            <span>Túnel Normal (Plástico Blanco)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-500 border border-blue-300 animate-pulse" />
            <span>Regando (Válvula Abierta + Caudal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-300" />
            <span>Alarma (Revisión requerida)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#E52421] text-white flex items-center justify-center text-[9px] font-bold">
              A
            </span>
            <span>Naves de Almácigos (3 Unidades)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Cada nave opera con controlador autónomo ESP32 y sensor de caudal en cabezal
        </span>
      </div>

      {/* Nave Fast Control & Telemetry Modal */}
      {activeNaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 p-6 shadow-2xl space-y-5 text-slate-100 light:text-slate-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 light:border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-black text-emerald-400">
                    {activeNaveModal.id}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      activeNaveModal.status === 'REGANDO'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : activeNaveModal.status === 'ALARMA'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {activeNaveModal.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                  {activeNaveModal.name} • {activeNaveModal.sector}
                </p>
              </div>

              <button
                onClick={() => setActiveNaveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Live Telemetry Grid */}
            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                <span className="text-[10px] text-slate-400 block">TEMP AMBIENTE</span>
                <span className="text-base font-black text-rose-400">{activeNaveModal.temperature}°C</span>
                <span className="text-[10px] text-slate-500 block">Hum: {activeNaveModal.humidity}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                <span className="text-[10px] text-slate-400 block">HUMEDAD SUELO</span>
                <span className="text-base font-black text-emerald-400">{activeNaveModal.soilMoisture1}%</span>
                <span className="text-[10px] text-slate-500 block">30cm: {activeNaveModal.soilMoisture2}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                <span className="text-[10px] text-slate-400 block">CAUDAL & PRESIÓN</span>
                <span className="text-base font-black text-blue-400">{activeNaveModal.flowRate} L/m</span>
                <span className="text-[10px] text-slate-500 block">{activeNaveModal.pressure} bar</span>
              </div>
            </div>

            {/* Irrigation Command Panel */}
            <div className="p-4 rounded-xl bg-slate-950/50 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5 text-blue-400">
                  <Droplets className="w-4 h-4" />
                  Control de Electroválvula 24 VDC
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  Estado: <strong>{activeNaveModal.valveStatus}</strong>
                </span>
              </div>

              {activeNaveModal.status === 'REGANDO' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-blue-300 font-bold block">Ciclo de Riego en Curso</span>
                      <span className="text-slate-400 text-[11px]">
                        Seguridad hardware: Corte por temporizador local en ESP32
                      </span>
                    </div>
                    <span className="font-mono text-lg font-black text-white animate-pulse">
                      {activeNaveModal.flowRate} L/m
                    </span>
                  </div>

                  <button
                    onClick={() => handleStopIrrigation(activeNaveModal.id)}
                    disabled={!canPerformIrrigation || actionInProgress}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Detener Riego Inmediatamente</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 light:text-slate-700 block mb-1.5">
                      Duración del Riego (minutos):
                    </label>
                    <div className="flex items-center gap-2">
                      {[10, 15, 20, 30, 45].map(mins => (
                        <button
                          key={mins}
                          onClick={() => setIrrigationMinutes(mins)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                            irrigationMinutes === mins
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartIrrigation(activeNaveModal.id)}
                    disabled={!canPerformIrrigation || actionInProgress}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Abrir Válvula & Iniciar Riego ({irrigationMinutes} min)</span>
                  </button>
                </div>
              )}
            </div>

            {/* IoT & Controller Diagnostics & ESP32 config */}
            <div className="pt-2 border-t border-slate-800 light:border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  DevEUI: {activeNaveModal.devEui}
                </span>
                <span>Firmware: {activeNaveModal.firmwareVersion}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const target = activeNaveModal;
                    setActiveNaveModal(null);
                    setEsp32ModalTarget({ targetMode: 'SINGLE', nave: target });
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>Configurar ESP32 ({activeNaveModal.id})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = activeNaveModal;
                    setActiveNaveModal(null);
                    setSelectedNaveId(target.id);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Detalle Completo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
