import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { HardwareModuleType, HardwareModule } from '../../types';
import { AddHardwareModal } from './AddHardwareModal';
import {
  Cpu,
  Radio,
  Terminal,
  Send,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Zap,
  Plus,
  Sliders,
  Play,
  Square,
  Layers,
  Settings,
  Trash2,
  Activity,
  Check,
  Signal,
  Gauge,
  Info
} from 'lucide-react';

export const DispositivosView: React.FC = () => {
  const {
    naves,
    refreshData,
    showNotification,
    setEsp32ModalTarget,
    removeHardwareModule
  } = useFarm();
  const { canConfigureDevices, currentUser } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<string>(naves[0]?.id || 'NAVE_001');
  const [command, setCommand] = useState<string>('SET_MODE_AUTO');
  const [duration, setDuration] = useState<number>(20);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Hardware Modal State (Antena de Sensor / Panel de Control)
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);
  const [hardwareModalType, setHardwareModalType] = useState<HardwareModuleType>('SENSOR_ANTENNA');
  const [hardwareModalNaveId, setHardwareModalNaveId] = useState<string | undefined>(undefined);

  // Testing feedback states
  const [testingModuleId, setTestingModuleId] = useState<string | null>(null);

  const activeNave = naves.find(n => n.id === selectedDevice) || naves[0];

  const handleOpenAddHardware = (type: HardwareModuleType, naveId?: string) => {
    setHardwareModalType(type);
    setHardwareModalNaveId(naveId || selectedDevice);
    setIsHardwareModalOpen(true);
  };

  const handleRemoveModule = async (moduleId: string, moduleName: string) => {
    if (!canConfigureDevices) return;
    const confirm = window.confirm(`¿Seguro que deseas desvincular el módulo "${moduleName}" de ${activeNave.name}?`);
    if (!confirm) return;

    await removeHardwareModule(activeNave.id, moduleId);
  };

  const handleTestModule = async (mod: HardwareModule) => {
    setTestingModuleId(mod.id);
    try {
      if (mod.type === 'CONTROL_PANEL') {
        // Send a test pulse command to relay
        await api.sendDeviceCommand(activeNave.id, 'PULSE_RELAY_TEST', { pin: mod.pinConfig?.relayPin || 25, durationSec: 3 }, currentUser.name);
        showNotification(`Pulso de prueba enviado al relé (GPIO ${mod.pinConfig?.relayPin || 25}) de "${mod.name}".`, 'success');
      } else {
        // Send test ping to sensor antenna
        const diag = await api.testEsp32Connection(activeNave.id);
        showNotification(`Telemetría LoRa recibida de "${mod.name}": RSSI ${mod.rssi} dBm, SNR ${mod.snr} dB. Enlace OK.`, 'success');
      }
    } catch (err: any) {
      showNotification('Error al enviar diagnóstico al módulo.', 'error');
    } finally {
      setTimeout(() => setTestingModuleId(null), 800);
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfigureDevices) return;
    setIsSending(true);

    try {
      const res = await api.sendDeviceCommand(
        selectedDevice,
        command,
        { durationMinutes: duration },
        currentUser.name
      );
      if (res.success) {
        showNotification(`Comando ${command} enviado con éxito a ${selectedDevice}.`, 'success');
        await refreshData();
      }
    } catch (err: any) {
      showNotification('Error al enviar comando LoRaWAN', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleAddPilotNave = async () => {
    if (!canConfigureDevices) return;
    const nextNum = naves.length + 1;
    const nextId = `NAVE_${String(nextNum).padStart(3, '0')}`;
    
    // Ingest initial telemetry to create the new node automatically
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: nextId,
        devEui: `70B3D57ED0${Math.floor(Math.random() * 900000 + 100000)}`,
        temperature: 23.5,
        humidity: 62,
        soilMoisture1: 44,
        soilMoisture2: 41,
        soilTemperature: 21.2,
        flowRate: 0,
        pressure: 2.1,
        voltage: 24.0,
        rssi: -83,
        snr: 9.1,
        gatewayId: 'GW_LORA_01',
        firmwareVersion: 'v2.4.0-pilot'
      })
    });

    showNotification(`Nave Piloto ${nextId} aprovisionada y vinculada a la red LoRaWAN.`, 'success');
    await refreshData();
    setSelectedDevice(nextId);
  };

  const filteredDevices = naves.filter(n =>
    n.id.toLowerCase().includes(search.toLowerCase()) ||
    n.devEui.toLowerCase().includes(search.toLowerCase()) ||
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const hardwareModules = activeNave?.hardwareModules || [];

  return (
    <div id="dispositivos-view" className="space-y-6 animate-fadeIn">
      {/* Title & Global Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight flex items-center gap-2">
            <span>Inventario de Dispositivos & Consola LoRaWAN</span>
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Gestión de identificadores DevEUI, Antenas de Sensor, Paneles de Control y enlace con ChirpStack
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick global provision buttons */}
          <button
            onClick={() => handleOpenAddHardware('SENSOR_ANTENNA', selectedDevice)}
            disabled={!canConfigureDevices}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Aprovisionar una nueva Antena de Sensor (Humedad Suelo & Clima)"
          >
            <Radio className="w-4 h-4" />
            <span>+ Antena de Sensor</span>
          </button>

          <button
            onClick={() => handleOpenAddHardware('CONTROL_PANEL', selectedDevice)}
            disabled={!canConfigureDevices}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Aprovisionar un nuevo Panel de Mando y Control (Relé 24VAC & Botonera)"
          >
            <Sliders className="w-4 h-4" />
            <span>+ Panel de Control</span>
          </button>

          <button
            onClick={() => setEsp32ModalTarget({ targetMode: 'ALL' })}
            disabled={!canConfigureDevices}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 light:text-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700 light:border-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Configurar el rol ESP32 en todas las naves del campo"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Configurar ESP32 Global</span>
          </button>

          <button
            onClick={handleAddPilotNave}
            disabled={!canConfigureDevices}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 light:text-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700 light:border-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Nave Piloto (#{naves.length + 1})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 col: Devices List */}
        <div className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar DevEUI o Nave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 light:text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="max-h-[550px] overflow-y-auto space-y-1.5 pr-1">
            {filteredDevices.map(n => {
              const antCount = n.hardwareModules?.filter(m => m.type === 'SENSOR_ANTENNA').length || 0;
              const panCount = n.hardwareModules?.filter(m => m.type === 'CONTROL_PANEL').length || 0;

              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedDevice(n.id)}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    selectedDevice === n.id
                      ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/20'
                      : 'bg-slate-950/40 light:bg-slate-50 border-slate-850 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-bold text-slate-100 light:text-slate-900 flex items-center gap-1.5">
                      <span>{n.id}</span>
                      {(antCount > 0 || panCount > 0) && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 light:bg-slate-200 text-slate-400 light:text-slate-600 font-normal">
                          {antCount}📡 {panCount}🎛️
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">{n.devEui}</div>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <span className={n.status === 'OFFLINE' ? 'text-slate-500' : 'text-emerald-400 font-bold'}>
                      {n.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'}
                    </span>
                    <div className="text-slate-500">{n.rssi} dBm</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 cols: Device Detail & Downlink Command Console */}
        <div className="lg:col-span-2 space-y-6">
          {activeNave && (
            <div className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 light:border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Nodo Físico Seleccionado
                  </span>
                  <h2 className="text-lg font-black font-mono text-emerald-400 flex items-center gap-2">
                    <span>ESP32_{activeNave.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-sans font-normal border border-emerald-500/20">
                      {activeNave.name}
                    </span>
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700">
                    FW: {activeNave.firmwareVersion}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700">
                    {activeNave.voltage}V DC
                  </span>
                </div>
              </div>

              {/* Dedicated ESP32 Role Card */}
              <div className="p-4 rounded-xl bg-slate-950/70 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Rol ESP32 Asignado a esta Nave:
                      </div>
                      <div className="text-sm font-bold text-white light:text-slate-900">
                        {activeNave.esp32Config?.role === 'SENSOR_ANTENNA' && '📡 Antena de Sensor (Telemetría de Suelo & Clima)'}
                        {activeNave.esp32Config?.role === 'CONTROL_PANEL' && '🎛️ Panel de Mando (Actuador Relé & Botonera)'}
                        {(!activeNave.esp32Config?.role || activeNave.esp32Config?.role === 'HYBRID') && '⚡ Modo Integral Híbrido (Sensor + Mando)'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEsp32ModalTarget({ targetMode: 'SINGLE', nave: activeNave })}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configurar ESP32</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEsp32ModalTarget({ targetMode: 'ALL', nave: activeNave })}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Aplicar a Todas</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* NEW SECTION: Módulos de Hardware Vinculados (Antenas & Paneles) */}
              <div className="p-5 rounded-2xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Signal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
                        <span>Módulos de Hardware Vinculados</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700">
                          {hardwareModules.length} instalados
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 light:text-slate-500">
                        Antenas de sensor de suelo y paneles de mando físicos asociados a {activeNave.id}
                      </p>
                    </div>
                  </div>

                  {/* Add Buttons directly inside this focused card */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAddHardware('SENSOR_ANTENNA', activeNave.id)}
                      disabled={!canConfigureDevices}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                      title="Agregar una nueva antena de sensor a esta nave"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>+ Antena de Sensor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAddHardware('CONTROL_PANEL', activeNave.id)}
                      disabled={!canConfigureDevices}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                      title="Agregar un nuevo panel de control y mando a esta nave"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>+ Panel de Control</span>
                    </button>
                  </div>
                </div>

                {/* Modules Grid */}
                {hardwareModules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {hardwareModules.map(mod => {
                      const isAntenna = mod.type === 'SENSOR_ANTENNA';
                      const isTestingThis = testingModuleId === mod.id;

                      return (
                        <div
                          key={mod.id}
                          className={`p-4 rounded-xl border transition-all space-y-3 relative ${
                            isAntenna
                              ? 'bg-emerald-950/20 light:bg-emerald-50/50 border-emerald-500/30'
                              : 'bg-blue-950/20 light:bg-blue-50/50 border-blue-500/30'
                          }`}
                        >
                          {/* Top Row: Type badge, status, and unpair button */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${
                                isAntenna
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {isAntenna ? <Radio className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
                              </div>
                              <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isAntenna
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}>
                                  {isAntenna ? '📡 Antena de Sensor' : '🎛️ Panel de Control'}
                                </span>
                                <h4 className="text-xs font-bold text-slate-100 light:text-slate-900 mt-1">
                                  {mod.name}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {mod.status}
                              </span>

                              {canConfigureDevices && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveModule(mod.id, mod.name)}
                                  className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Desvincular módulo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Technical description */}
                          <p className="text-[11px] text-slate-300 light:text-slate-600 leading-relaxed font-mono">
                            {mod.details}
                          </p>

                          {/* Quick specs pill row */}
                          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-400">
                            <div className="p-1.5 rounded-lg bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200">
                              <span className="text-[9px] text-slate-500 block">DevEUI</span>
                              <span className="font-bold text-slate-200 light:text-slate-800 truncate block">
                                {mod.devEui.slice(-6)}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200">
                              <span className="text-[9px] text-slate-500 block">Alimentación</span>
                              <span className="font-bold text-emerald-400 block">
                                {mod.batteryVoltage ? `${mod.batteryVoltage}V` : '24V'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200">
                              <span className="text-[9px] text-slate-500 block">Telemetría</span>
                              <span className="font-bold text-slate-200 light:text-slate-800 block">
                                {mod.samplingIntervalSec || 60}s
                              </span>
                            </div>
                          </div>

                          {/* Bottom Action: Test button */}
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {mod.connectionType} • {mod.gatewayId || 'GW_LORA_01'}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleTestModule(mod)}
                              disabled={isTestingThis || !canConfigureDevices}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                isAntenna
                                  ? 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40'
                                  : 'bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40'
                              } disabled:opacity-50`}
                            >
                              {isTestingThis ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Probando...</span>
                                </>
                              ) : (
                                <>
                                  <Activity className="w-3 h-3" />
                                  <span>{isAntenna ? 'Test Telemetría LoRa' : 'Probar Relé 24VAC'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 light:border-slate-300 text-center space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800 light:bg-slate-200 flex items-center justify-center text-slate-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 light:text-slate-800">
                        Sin módulos secundarios vinculados
                      </h4>
                      <p className="text-[11px] text-slate-400 light:text-slate-500 max-w-sm mx-auto mt-0.5">
                        Puedes añadir antenas de sensor adicionales para sondeo a distintas profundidades o paneles de mando con botonera para esta nave.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAddHardware('SENSOR_ANTENNA', activeNave.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Añadir Antena de Sensor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddHardware('CONTROL_PANEL', activeNave.id)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Añadir Panel de Control</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hardware Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <span className="text-[10px] text-slate-500 block">DevEUI (IEEE 64)</span>
                  <span className="font-bold text-slate-200 light:text-slate-800 break-all">{activeNave.devEui}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <span className="text-[10px] text-slate-500 block">AppEUI / JoinEUI</span>
                  <span className="font-bold text-slate-200 light:text-slate-800">{activeNave.appEui}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Gateway LoRa</span>
                  <span className="font-bold text-emerald-400">{activeNave.gatewayId}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <span className="text-[10px] text-slate-500 block">RSSI / SNR</span>
                  <span className="font-bold text-slate-200 light:text-slate-800">{activeNave.rssi} dBm / {activeNave.snr}</span>
                </div>
              </div>

              {/* Downlink Remote Command Console */}
              <form onSubmit={handleSendCommand} className="p-5 rounded-xl bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 light:text-slate-800">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Consola de Comandos LoRaWAN Downlink (FPort 2)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Comando a Transmitir:</label>
                    <select
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-slate-200 light:text-slate-800 font-mono"
                    >
                      <option value="OPEN_VALVE">OPEN_VALVE (Abrir Electroválvula)</option>
                      <option value="CLOSE_VALVE">CLOSE_VALVE (Cierre Seguro)</option>
                      <option value="SET_MODE_AUTO">SET_MODE_AUTO (Modo Autónomo Local)</option>
                      <option value="SET_MODE_MANUAL">SET_MODE_MANUAL (Modo Manual)</option>
                      <option value="REBOOT">REBOOT (Reinicio ESP32)</option>
                    </select>
                  </div>

                  {command === 'OPEN_VALVE' && (
                    <div>
                      <label className="block text-slate-400 mb-1">Límite de Tiempo Máximo:</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-slate-200 light:text-slate-800 font-mono"
                      >
                        <option value={5}>5 minutos</option>
                        <option value={10}>10 minutos</option>
                        <option value={15}>15 minutos</option>
                        <option value={20}>20 minutos (Recomendado)</option>
                        <option value={30}>30 minutos (Máximo seguro)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Formato: JSON payload codificado en Base64 para ChirpStack
                  </span>

                  <button
                    type="submit"
                    disabled={isSending || !canConfigureDevices}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSending ? 'Transmitiendo...' : 'Enviar Downlink'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal to add Sensor Antennas and Control Panels */}
      <AddHardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        defaultType={hardwareModalType}
        defaultNaveId={hardwareModalNaveId}
      />
    </div>
  );
};

