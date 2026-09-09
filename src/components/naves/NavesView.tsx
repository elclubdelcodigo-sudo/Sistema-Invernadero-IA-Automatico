import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { Nave } from '../../types';
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
  RefreshCw,
  Trash2,
  CheckSquare,
  Square as SquareIcon,
  RotateCcw,
  AlertCircle,
  ShieldAlert,
  X,
  Plus
} from 'lucide-react';
import { BulkIrrigationModal } from '../riego/BulkIrrigationModal';
import { StopAllIrrigationModal } from '../riego/StopAllIrrigationModal';

export const NavesView: React.FC = () => {
  const {
    naves,
    setSelectedNaveId,
    requestManualIrrigation,
    stopIrrigation,
    deleteNave,
    deleteMultipleNaves,
    deleteAllNaves,
    resetDefaultNaves,
    startAllIrrigations,
    stopAllIrrigations,
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

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Irrigation Modals & Actions
  const [showBulkIrrigateModal, setShowBulkIrrigateModal] = useState<boolean>(false);
  const [bulkIrrigateTarget, setBulkIrrigateTarget] = useState<'ALL' | 'SELECTED'>('ALL');
  const [showStopAllModal, setShowStopAllModal] = useState<boolean>(false);

  // Confirmation Modals
  const [naveToDelete, setNaveToDelete] = useState<Nave | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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

  // Selection handlers
  const toggleSelectNave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredNaves.map(n => n.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Mass selection of all naves (regardless of filters)
  const isAllNavesSelected = naves.length > 0 && selectedIds.length === naves.length;
  const isAllFilteredSelected = filteredNaves.length > 0 && filteredNaves.every(n => selectedIds.includes(n.id));

  const handleSelectAllNaves = () => {
    if (isAllNavesSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(naves.map(n => n.id));
    }
  };

  // Count active irrigating naves
  const activeIrrigatingCount = useMemo(() => {
    return naves.filter(n => n.status === 'REGANDO' || n.valveStatus === 'ABIERTA' || Boolean(n.activeIrrigation)).length;
  }, [naves]);

  // Bulk Irrigation Handlers
  const handleConfirmBulkIrrigate = async (durationMinutes: number) => {
    const targetIds = bulkIrrigateTarget === 'SELECTED' ? selectedIds : undefined;
    await startAllIrrigations(durationMinutes, targetIds);
  };

  const handleConfirmStopAll = async () => {
    await stopAllIrrigations();
  };

  const handleStopSelected = async () => {
    if (selectedIds.length === 0) return;
    await stopAllIrrigations(selectedIds);
  };

  // Execution of Deletions
  const handleConfirmSingleDelete = async () => {
    if (!naveToDelete) return;
    setIsDeleting(true);
    await deleteNave(naveToDelete.id);
    setSelectedIds(prev => prev.filter(id => id !== naveToDelete.id));
    setIsDeleting(false);
    setNaveToDelete(null);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    await deleteMultipleNaves(selectedIds);
    setSelectedIds([]);
    setIsDeleting(false);
    setShowBulkDeleteModal(false);
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    await deleteAllNaves();
    setSelectedIds([]);
    setIsDeleting(false);
    setShowDeleteAllModal(false);
  };

  const handleConfirmReset = async () => {
    setIsDeleting(true);
    await resetDefaultNaves();
    setSelectedIds([]);
    setIsDeleting(false);
    setShowResetModal(false);
  };

  return (
    <div id="naves-view" className="space-y-5 animate-fadeIn">
      {/* Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
              Gestión de Naves e Invernaderos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E52421]/20 text-[#E52421] border border-[#E52421]/30">
              {naves.length} {naves.length === 1 ? 'Nave' : 'Naves'}
            </span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Monitoreo en tiempo real, control de electroválvulas y gestión de inventario del campo
          </p>
        </div>

        {/* Global Action Buttons: Delete All, Restore, Refresh & View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón: Regar Todas las Naves */}
          <button
            id="btn-header-irrigate-all"
            onClick={() => {
              setBulkIrrigateTarget('ALL');
              setShowBulkIrrigateModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600 hover:to-cyan-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group"
            title="Activar riego simultáneo en todas las naves"
          >
            <Droplets className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
            <span>Regar Todas ({naves.length})</span>
          </button>

          {/* Botón: Detener Todas las Naves */}
          <button
            id="btn-header-stop-all"
            onClick={() => setShowStopAllModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm border ${
              activeIrrigatingCount > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-rose-600/30 animate-pulse'
                : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-900/50'
            }`}
            title="Cerrar electroválvulas en todas las naves"
          >
            <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span>
              {activeIrrigatingCount > 0 ? `Detener Todas (${activeIrrigatingCount})` : 'Detener Todas'}
            </span>
          </button>

          {/* Botón: Eliminar Todas las Naves */}
          {naves.length > 0 && (
            <button
              id="btn-delete-all-naves"
              onClick={() => setShowDeleteAllModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group"
              title="Eliminar todas las naves del sistema"
            >
              <Trash2 className="w-3.5 h-3.5 group-hover:animate-bounce" />
              <span>Eliminar Todas</span>
            </button>
          )}

          {/* Botón: Restablecer 125 Naves por Defecto */}
          <button
            id="btn-reset-default-naves"
            onClick={() => setShowResetModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 border border-slate-700 light:border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Restablecer el lote completo de 125 naves por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#0082CA]" />
            <span>Restablecer 125 Naves</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-[#0082CA] transition-colors"
            title="Actualizar telemetría"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#E52421] to-[#C91816] text-white shadow-sm'
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
                  ? 'bg-gradient-to-r from-[#E52421] to-[#C91816] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 light:from-slate-100 light:via-white light:to-slate-100 border border-blue-500/40 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-slideDown">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <div className="text-xs text-slate-200 light:text-slate-800 font-semibold">
              <strong className="font-mono text-blue-400 font-bold text-sm">{selectedIds.length}</strong> {selectedIds.length === 1 ? 'nave seleccionada' : 'naves seleccionadas'}
            </div>
            <button
              onClick={handleSelectAllFiltered}
              className="text-xs text-[#0082CA] hover:underline font-bold"
            >
              {isAllFilteredSelected ? 'Deseleccionar filtradas' : 'Seleccionar todas las filtradas'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Regar Seleccionadas */}
            <button
              id="btn-irrigate-selected"
              onClick={() => {
                setBulkIrrigateTarget('SELECTED');
                setShowBulkIrrigateModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
              title="Iniciar riego en las naves seleccionadas"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Regar Selección ({selectedIds.length})</span>
            </button>

            {/* Detener Seleccionadas */}
            <button
              id="btn-stop-selected"
              onClick={handleStopSelected}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              title="Detener riego en las naves seleccionadas"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Detener Selección</span>
            </button>

            {/* Eliminar Seleccionadas */}
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-700 text-rose-300 hover:text-white border border-rose-600/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar ({selectedIds.length})</span>
            </button>

            <button
              onClick={clearSelection}
              className="p-1.5 rounded-xl bg-slate-800 light:bg-slate-200 text-slate-400 hover:text-white light:hover:text-black transition-colors"
              title="Cancelar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar with Dedicated Bulk Control Buttons */}
      <div className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ID, nave o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#E52421]"
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
                  ? 'bg-slate-100 text-slate-900 light:bg-slate-900 light:text-white shadow-md'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sector dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
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

        {/* Bulk Actions Button Group: Seleccionar Todas, Regar Todas, Detener Todas */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Botón: Seleccionar Todas las Naves */}
          <button
            id="btn-select-all-naves"
            type="button"
            onClick={handleSelectAllNaves}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs border ${
              isAllNavesSelected
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/60 shadow-sm'
                : 'bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border-slate-700 light:border-slate-300'
            }`}
            title="Seleccionar o deseleccionar todas las naves del campo"
          >
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>
              {isAllNavesSelected ? `Deseleccionar (${selectedIds.length})` : `Seleccionar Todas (${naves.length})`}
            </span>
          </button>

          {/* Botón: Regar Todas las Naves */}
          <button
            id="btn-irrigate-all-naves"
            type="button"
            onClick={() => {
              setBulkIrrigateTarget(selectedIds.length > 0 ? 'SELECTED' : 'ALL');
              setShowBulkIrrigateModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all text-xs"
            title="Activar protocolo de riego simultáneo"
          >
            <Droplets className="w-4 h-4" />
            <span>
              {selectedIds.length > 0 ? `Regar Selección (${selectedIds.length})` : `Regar Todas (${naves.length})`}
            </span>
          </button>

          {/* Botón: Detener Todas las Naves */}
          <button
            id="btn-stop-all-naves"
            type="button"
            onClick={() => setShowStopAllModal(true)}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all border ${
              activeIrrigatingCount > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-600/30 animate-pulse'
                : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-900/50'
            }`}
            title="Cerrar electroválvulas y detener el riego de inmediato"
          >
            <Square className="w-4 h-4 fill-current text-rose-400" />
            <span>
              {activeIrrigatingCount > 0 ? `Detener Todas (${activeIrrigatingCount} regando)` : 'Detener Todas'}
            </span>
          </button>
        </div>
      </div>

      {/* Counter indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-500 font-medium px-1">
        <div>
          Mostrando <strong className="text-slate-200 light:text-slate-800">{filteredNaves.length}</strong> de {naves.length} naves
        </div>
        {naves.length === 0 && (
          <span className="text-rose-400 font-bold">No hay naves en el inventario</span>
        )}
      </div>

      {/* Empty State when naves.length === 0 */}
      {naves.length === 0 && (
        <div className="p-12 rounded-3xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Trash2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-lg font-bold text-slate-100 light:text-slate-900">
              No hay naves registradas en el campo
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed">
              Has eliminado todas las naves del sistema. Puedes restablecer en cualquier momento las 125 naves por defecto del campo experimental de TAKII SEED con telemetría LoRaWAN y control ESP32.
            </p>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E52421] to-[#C91816] hover:from-[#C91816] hover:to-[#B31412] text-white font-bold text-xs shadow-lg shadow-[#E52421]/30 flex items-center gap-2 mx-auto transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer las 125 Naves por Defecto</span>
          </button>
        </div>
      )}

      {/* Grid Mode */}
      {viewMode === 'grid' && naves.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredNaves.map(nave => {
            const isSelected = selectedIds.includes(nave.id);
            return (
              <div
                key={nave.id}
                onClick={() => setSelectedNaveId(nave.id)}
                className={`p-4 rounded-2xl bg-slate-900 light:bg-white border transition-all cursor-pointer shadow-sm group relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/10 light:bg-rose-50/40'
                    : 'border-slate-800 light:border-slate-200 hover:border-slate-600 light:hover:border-slate-300'
                }`}
              >
                {/* Card Top: Selection Checkbox + Name, ID, Status, Single Delete Button */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectNave(nave.id, e)}
                        className="mt-0.5 text-slate-400 hover:text-white transition-colors"
                        title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-500" />
                        ) : (
                          <SquareIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                        )}
                      </button>

                      <div>
                        <span className="font-mono text-xs font-bold text-[#0082CA]">{nave.id}</span>
                        <h3 className="font-bold text-sm text-slate-100 light:text-slate-900 leading-snug">
                          {nave.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 light:text-slate-500">{nave.sector}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
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

                      {/* Botón: Eliminar Nave Individual */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNaveToDelete(nave);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title={`Eliminar ${nave.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

                {/* Card Bottom: Valve Control & Signal */}
                <div className="pt-2 border-t border-slate-800 light:border-slate-200 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Wifi className="w-3 h-3 text-slate-500" />
                    <span>{nave.rssi} dBm</span>
                  </div>

                  <div className="flex items-center gap-1.5">
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
                        className="px-2.5 py-1 rounded-lg bg-[#0082CA] hover:bg-[#0072B8] text-white font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-40"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Regar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && naves.length > 0 && (
        <div className="rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 light:bg-slate-100 text-slate-400 light:text-slate-600 uppercase font-mono text-[10px] border-b border-slate-800 light:border-slate-200">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      onClick={handleSelectAllFiltered}
                      title="Seleccionar todo"
                      className="text-slate-400 hover:text-white"
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-500" />
                      ) : (
                        <SquareIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
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
                {filteredNaves.map(nave => {
                  const isSelected = selectedIds.includes(nave.id);
                  return (
                    <tr
                      key={nave.id}
                      onClick={() => setSelectedNaveId(nave.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-rose-950/20 light:bg-rose-50/60'
                          : 'hover:bg-slate-800/50 light:hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelectNave(nave.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-500" />
                          ) : (
                            <SquareIcon className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-[#0082CA]">
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
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {nave.status === 'REGANDO' ? (
                            <button
                              onClick={() => stopIrrigation(nave.id)}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                            >
                              Cerrar
                            </button>
                          ) : (
                            <button
                              onClick={() => requestManualIrrigation(nave)}
                              disabled={nave.status === 'OFFLINE' || !canPerformIrrigation}
                              className="px-2 py-1 rounded bg-[#0082CA] text-white text-[10px] font-bold disabled:opacity-40"
                            >
                              Regar
                            </button>
                          )}

                          {/* Delete Nave button */}
                          <button
                            onClick={() => setNaveToDelete(nave)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title={`Eliminar ${nave.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Confirm Single Nave Deletion */}
      {naveToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-100 light:text-slate-900">
                  ¿Eliminar Nave {naveToDelete.id}?
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed">
                  Estás a punto de eliminar <strong className="text-slate-200 light:text-slate-800">{naveToDelete.name}</strong> ({naveToDelete.sector}). Se eliminarán sus telemetrías y alertas asociadas.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 font-mono text-xs text-slate-400 space-y-1">
              <div>DevEUI: <span className="text-slate-200 light:text-slate-700">{naveToDelete.devEui}</span></div>
              <div>Firmware: <span className="text-slate-200 light:text-slate-700">{naveToDelete.firmwareVersion}</span></div>
              <div>Gateway: <span className="text-slate-200 light:text-slate-700">{naveToDelete.gatewayId}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setNaveToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 light:bg-slate-100 hover:bg-slate-700 text-slate-300 light:text-slate-700 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirmar y Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Bulk Deletion of Selected Naves */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 light:bg-white border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-100 light:text-slate-900">
                  ¿Eliminar {selectedIds.length} Naves Seleccionadas?
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed">
                  Se eliminarán permanentemente las {selectedIds.length} naves seleccionadas del inventario del campo.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 font-mono text-xs text-slate-300 light:text-slate-700 max-h-28 overflow-y-auto">
              <div className="text-[11px] text-slate-500 mb-1">Naves a eliminar:</div>
              <div className="flex flex-wrap gap-1">
                {selectedIds.map(id => (
                  <span key={id} className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                    {id}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 light:bg-slate-100 hover:bg-slate-700 text-slate-300 light:text-slate-700 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Eliminar {selectedIds.length} Naves</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Delete ALL Naves */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 light:bg-white border-2 border-rose-500 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/40">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Acción Crítica
                </span>
                <h3 className="text-lg font-black text-slate-100 light:text-slate-900 leading-tight">
                  ¿Deseas eliminar TODAS las ({naves.length}) naves?
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                  Esta acción eliminará la totalidad de las <strong>{naves.length} naves</strong> configuradas en el campo agrícola, sus registros de sensores en vivo, telemetría y alarmas activas.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/20 light:bg-rose-50 border border-rose-500/30 text-xs text-rose-300 light:text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>
                Podrás restablecer las 125 naves por defecto del campo experimental en cualquier momento con el botón <strong>"Restablecer 125 Naves"</strong>.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 light:bg-slate-100 hover:bg-slate-700 text-slate-300 light:text-slate-700 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-rose-600/40 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Sí, Eliminar TODAS las Naves</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirm Reset Default 125 Naves */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0082CA]/20 text-[#0082CA] border border-[#0082CA]/30 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-100 light:text-slate-900">
                  Restablecer 125 Naves por Defecto
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed">
                  Se restablecerán las 125 naves estándar del campo experimental organizadas en 6 baterías paralelas con sus nodos LoRaWAN, sensores ambientales y reglas de fertirriego.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 light:bg-slate-100 hover:bg-slate-700 text-slate-300 light:text-slate-700 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#0082CA] hover:bg-[#0072B8] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#0082CA]/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Restablecer Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Bulk Irrigation Confirmation Modal */}
      <BulkIrrigationModal
        isOpen={showBulkIrrigateModal}
        onClose={() => setShowBulkIrrigateModal(false)}
        count={bulkIrrigateTarget === 'SELECTED' ? selectedIds.length : naves.length}
        mode={bulkIrrigateTarget}
        onConfirm={handleConfirmBulkIrrigate}
      />

      {/* MODAL 6: Stop All Irrigation Confirmation Modal */}
      <StopAllIrrigationModal
        isOpen={showStopAllModal}
        onClose={() => setShowStopAllModal(false)}
        activeCount={activeIrrigatingCount}
        totalNaves={naves.length}
        onConfirm={handleConfirmStopAll}
      />
    </div>
  );
};
