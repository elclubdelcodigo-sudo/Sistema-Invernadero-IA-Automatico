import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
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
  Square
} from 'lucide-react';

export const DispositivosView: React.FC = () => {
  const { naves, refreshData, showNotification } = useFarm();
  const { canConfigureDevices, currentUser } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<string>(naves[0]?.id || 'NAVE_001');
  const [command, setCommand] = useState<string>('SET_MODE_AUTO');
  const [duration, setDuration] = useState<number>(20);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const activeNave = naves.find(n => n.id === selectedDevice) || naves[0];

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
    n.devEui.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="dispositivos-view" className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
            Inventario de Dispositivos & Consola LoRaWAN
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Gestión de identificadores únicos DevEUI, firmware OTA y enlace con ChirpStack
          </p>
        </div>

        <button
          onClick={handleAddPilotNave}
          disabled={!canConfigureDevices}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Aprovisionar Nave Piloto (#{naves.length + 1})
        </button>
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

          <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
            {filteredDevices.map(n => (
              <button
                key={n.id}
                onClick={() => setSelectedDevice(n.id)}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                  selectedDevice === n.id
                    ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/40 light:bg-slate-50 border-slate-850 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-mono font-bold text-slate-100 light:text-slate-900">{n.id}</div>
                  <div className="font-mono text-[10px] text-slate-500">{n.devEui}</div>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <span className={n.status === 'OFFLINE' ? 'text-slate-500' : 'text-emerald-400'}>
                    {n.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'}
                  </span>
                  <div className="text-slate-500">{n.rssi} dBm</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right 2 cols: Device Detail & Downlink Command Console */}
        <div className="lg:col-span-2 space-y-6">
          {activeNave && (
            <div className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 light:border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Nodo Físico Seleccionado
                  </span>
                  <h2 className="text-lg font-black font-mono text-emerald-400">
                    ESP32_{activeNave.id}
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
    </div>
  );
};
