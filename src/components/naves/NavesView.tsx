import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Grid,
  List,
  Thermometer,
  Droplets,
  Layers,
  Activity,
  AlertTriangle,
  Play,
  Square,
  Clock,
  Gauge,
  Wifi,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const NavesView: React.FC = () => {
  const {
    naves,
    setSelectedNaveId,
    requestManualIrrigation,
    stopIrrigation,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sectorFilter,
    setSectorFilter,
    refreshData,
    isLoading
  } = useFarm();

  const { canPerformIrrigation } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sectors unique list
  const sectors = useMemo(() => {
    const list = Array.from(new Set(naves.map(n => n.sector)));
    return ['TODOS', ...list];
  }, [naves]);

  // Filtered naves
  const filteredNaves = useMemo(() => {
    return naves.filter(n => {
      const matchSearch =
        n.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.sector.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'TODAS' || n.status === statusFilter;
      const matchSector = sectorFilter === 'TODOS' || n.sector === sectorFilter;

      return matchSearch && matchStatus && matchSector;
    });
  }, [naves, searchTerm, statusFilter, sectorFilter]);

  return (
    <div id="naves-view" className="space-y-5 animate-fadeIn">
      {/* Title & Stats Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
            Gestión y Monitoreo de Naves ({naves.length})
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            125 Invernaderos con telemetría LoRaWAN independiente y lógica de riego local
          </p>
        </div>

        {/* View mode toggle & refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-emerald-400 transition-colors"
            title="Actualizar telemetría"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center bg-slate-900 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista en Tarjetas"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ID, nave o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['TODAS', 'ONLINE', 'REGANDO', 'ALARMA', 'OFFLINE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sector dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 text-xs font-semibold focus:outline-none"
          >
            {sectors.map(sec => (
              <option key={sec} value={sec} className="bg-slate-900 text-slate-200">
                {sec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Counter indicator */}
      <div className="text-xs text-slate-400 light:text-slate-500 font-medium">
        Mostrando <strong className="text-slate-200 light:text-slate-800">{filteredNaves.length}</strong> de {naves.length} naves
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredNaves.map(nave => (
            <div
              key={nave.id}
              onClick={() => setSelectedNaveId(nave.id)}
              className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 hover:border-emerald-500/60 light:hover:border-emerald-500 transition-all cursor-pointer shadow-sm group relative flex flex-col justify-between"
            >
              {/* Card Top: Name, ID, Status */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400">{nave.id}</span>
                    <h3 className="font-bold text-sm text-slate-100 light:text-slate-900 leading-snug">
                      {nave.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 light:text-slate-500">{nave.sector}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    nave.status === 'REGANDO'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
                      : nave.status === 'ALARMA'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : nave.status === 'OFFLINE'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {nave.status}
                  </span>
                </div>

                {/* Primary Metrics: Temp, Hum, Soil Moisture */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-850 light:border-slate-200 text-xs font-mono mb-3">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 light:text-slate-500">
                      <Thermometer className="w-3 h-3 text-rose-400" />
                      TEMP
                    </div>
                    <div className="font-bold text-slate-200 light:text-slate-800 mt-0.5">
                      {nave.temperature.toFixed(1)}°
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 light:text-slate-500">
                      <Droplets className="w-3 h-3 text-sky-400" />
                      HUM
                    </div>
                    <div className="font-bold text-slate-200 light:text-slate-800 mt-0.5">
                      {nave.humidity}%
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 light:text-slate-500">
                      <Layers className="w-3 h-3 text-emerald-400" />
                      SUELO
                    </div>
                    <div className={`font-bold mt-0.5 ${nave.soilMoisture1 < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {nave.soilMoisture1}%
                    </div>
                  </div>
                </div>

                {/* Water Flow / Pressure status */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 light:text-slate-500 mb-3 px-1">
                  <span>Caudal: <strong className="text-slate-200 light:text-slate-700">{nave.flowRate} L/m</strong></span>
                  <span>Presión: <strong className="text-slate-200 light:text-slate-700">{nave.pressure} bar</strong></span>
                </div>
              </div>

              {/* Card Bottom: Valve Control & Detail link */}
              <div className="pt-2 border-t border-slate-800 light:border-slate-200 flex items-center justify-between gap-2">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-slate-500" />
                  <span>{nave.rssi} dBm</span>
                </div>

                {nave.status === 'REGANDO' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stopIrrigation(nave.id);
                    }}
                    disabled={!canPerformIrrigation}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Detener
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requestManualIrrigation(nave);
                    }}
                    disabled={nave.status === 'OFFLINE' || !canPerformIrrigation}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-40"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Regar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && (
        <div className="rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 light:bg-slate-100 text-slate-400 light:text-slate-600 uppercase font-mono text-[10px] border-b border-slate-800 light:border-slate-200">
                <tr>
                  <th className="p-3.5">Nave</th>
                  <th className="p-3.5">Sector</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Temp</th>
                  <th className="p-3.5">Hum Amb</th>
                  <th className="p-3.5">Suelo 1/2</th>
                  <th className="p-3.5">Caudal</th>
                  <th className="p-3.5">Presión</th>
                  <th className="p-3.5">Válvula</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 light:divide-slate-200 text-slate-200 light:text-slate-800">
                {filteredNaves.map(nave => (
                  <tr
                    key={nave.id}
                    onClick={() => setSelectedNaveId(nave.id)}
                    className="hover:bg-slate-800/50 light:hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-bold font-mono text-emerald-400">
                      {nave.id}
                    </td>
                    <td className="p-3.5 text-slate-400">{nave.sector}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        nave.status === 'REGANDO'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : nave.status === 'ALARMA'
                          ? 'bg-rose-500/20 text-rose-400'
                          : nave.status === 'OFFLINE'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {nave.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">{nave.temperature.toFixed(1)}°C</td>
                    <td className="p-3.5 font-mono">{nave.humidity}%</td>
                    <td className="p-3.5 font-mono">{nave.soilMoisture1}% / {nave.soilMoisture2}%</td>
                    <td className="p-3.5 font-mono">{nave.flowRate} L/m</td>
                    <td className="p-3.5 font-mono">{nave.pressure} bar</td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {nave.valveStatus} ({nave.controlMode})
                    </td>
                    <td className="p-3.5 text-right">
                      {nave.status === 'REGANDO' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            stopIrrigation(nave.id);
                          }}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                        >
                          Cerrar
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestManualIrrigation(nave);
                          }}
                          disabled={nave.status === 'OFFLINE' || !canPerformIrrigation}
                          className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold disabled:opacity-40"
                        >
                          Regar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
