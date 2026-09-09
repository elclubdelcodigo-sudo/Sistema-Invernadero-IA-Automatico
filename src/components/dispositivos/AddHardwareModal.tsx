import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { HardwareModuleType, Esp32ConnectionType } from '../../types';
import {
  Radio,
  Sliders,
  Cpu,
  X,
  Plus,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Activity,
  Gauge,
  Wifi,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface AddHardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: HardwareModuleType;
  defaultNaveId?: string;
}

export const AddHardwareModal: React.FC<AddHardwareModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'SENSOR_ANTENNA',
  defaultNaveId
}) => {
  const { naves, addHardwareModule, provisionDevice, showNotification } = useFarm();
  const { canConfigureDevices } = useAuth();

  const [type, setType] = useState<HardwareModuleType>(defaultType);
  const [targetScope, setTargetScope] = useState<'ATTACH_TO_NAVE' | 'NEW_STANDALONE_NODE'>(
    defaultNaveId ? 'ATTACH_TO_NAVE' : 'ATTACH_TO_NAVE'
  );
  const [selectedNaveId, setSelectedNaveId] = useState<string>(defaultNaveId || naves[0]?.id || 'NAVE_001');
  const [sector, setSector] = useState<string>('Sector Norte A');
  const [name, setName] = useState<string>('');
  const [devEui, setDevEui] = useState<string>('');
  const [connectionType, setConnectionType] = useState<Esp32ConnectionType>('LORAWAN');
  const [samplingIntervalSec, setSamplingIntervalSec] = useState<number>(120);

  // Sensor Antenna options
  const [soilDepthConfig, setSoilDepthConfig] = useState<'DUAL_30_60' | 'SINGLE_30' | 'TRIPLE_30_60_90'>('DUAL_30_60');
  const [hasSoilTempDS18, setHasSoilTempDS18] = useState<boolean>(true);
  const [hasAmbientSHT31, setHasAmbientSHT31] = useState<boolean>(true);

  // Control Panel options
  const [relayPin, setRelayPin] = useState<number>(25);
  const [hasSecondaryRelay, setHasSecondaryRelay] = useState<boolean>(false);
  const [flowSensorPin, setFlowSensorPin] = useState<number>(14);
  const [hasPhysicalKeypad, setHasPhysicalKeypad] = useState<boolean>(true);
  const [hasOledDisplay, setHasOledDisplay] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper to generate unique realistic DevEUI
  const generateDevEui = (moduleType?: HardwareModuleType | string) => {
    const prefix = moduleType === 'CONTROL_PANEL' ? '70B3D57ED2' : '70B3D57ED1';
    const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
    return `${prefix}${randomHex}`;
  };

  // Synchronize when opening
  useEffect(() => {
    if (isOpen) {
      const activeType = defaultType || 'SENSOR_ANTENNA';
      setType(activeType);
      if (defaultNaveId) {
        setSelectedNaveId(defaultNaveId);
        setTargetScope('ATTACH_TO_NAVE');
      }
      const randomEui = generateDevEui(activeType);
      setDevEui(randomEui);

      if (activeType === 'SENSOR_ANTENNA') {
        const targetN = naves.find(n => n.id === (defaultNaveId || selectedNaveId));
        const count = (targetN?.hardwareModules?.filter(m => m.type === 'SENSOR_ANTENNA').length || 0) + 1;
        setName(`Antena Sensor Suelo #${count} - ${targetN?.name ? targetN.name.split('—')[0].trim() : 'Nave'}`);
        setSamplingIntervalSec(120);
      } else {
        const targetN = naves.find(n => n.id === (defaultNaveId || selectedNaveId));
        const count = (targetN?.hardwareModules?.filter(m => m.type === 'CONTROL_PANEL').length || 0) + 1;
        setName(`Panel de Mando Cabecera #${count} - ${targetN?.name ? targetN.name.split('—')[0].trim() : 'Nave'}`);
        setSamplingIntervalSec(60);
      }
    }
  }, [isOpen, defaultType, defaultNaveId]);

  // Update default name when changing type or nave
  const handleTypeChange = (newType: HardwareModuleType) => {
    setType(newType);
    setDevEui(generateDevEui(newType));
    const targetN = naves.find(n => n.id === selectedNaveId);
    if (newType === 'SENSOR_ANTENNA') {
      const count = (targetN?.hardwareModules?.filter(m => m.type === 'SENSOR_ANTENNA').length || 0) + 1;
      setName(`Antena Sensor Suelo #${count} - ${targetN?.name ? targetN.name.split('—')[0].trim() : 'Nave'}`);
      setSamplingIntervalSec(120);
    } else {
      const count = (targetN?.hardwareModules?.filter(m => m.type === 'CONTROL_PANEL').length || 0) + 1;
      setName(`Panel de Mando Cabecera #${count} - ${targetN?.name ? targetN.name.split('—')[0].trim() : 'Nave'}`);
      setSamplingIntervalSec(60);
    }
  };

  const handleNaveChange = (naveId: string) => {
    setSelectedNaveId(naveId);
    const targetN = naves.find(n => n.id === naveId);
    if (type === 'SENSOR_ANTENNA') {
      const count = (targetN?.hardwareModules?.filter(m => m.type === 'SENSOR_ANTENNA').length || 0) + 1;
      setName(`Antena Sensor Suelo #${count} - ${targetN?.name ? targetN.name.split('—')[0].trim() : 'Nave'}`);
    } else {
      const count = (targetN?.hardwareModules?.filter(m => m.type === 'CONTROL_PANEL').length || 0) + 1;
      setName(`Panel de Mando Cabecera #${count} - ${targetN?.name ? targetN.name.split('—')[0].trim() : 'Nave'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfigureDevices) {
      showNotification('No tienes permisos para aprovisionar hardware.', 'error');
      return;
    }

    if (!name.trim()) {
      showNotification('Por favor ingresa un nombre para el módulo.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const details = type === 'SENSOR_ANTENNA'
        ? `Sonda ${soilDepthConfig === 'DUAL_30_60' ? 'dual (30/60cm)' : soilDepthConfig === 'TRIPLE_30_60_90' ? 'triple (30/60/90cm)' : 'simple (30cm)'}${hasSoilTempDS18 ? ' + Temp DS18B20' : ''}${hasAmbientSHT31 ? ' + SHT31' : ''}`
        : `Relé 24VAC (GPIO ${relayPin})${hasSecondaryRelay ? ' + Aux (GPIO 26)' : ''}, Caudalímetro (GPIO ${flowSensorPin})${hasPhysicalKeypad ? ' + Botonera física' : ''}${hasOledDisplay ? ' + OLED 0x3C' : ''}`;

      if (targetScope === 'ATTACH_TO_NAVE') {
        // Add as hardware module to existing nave
        const success = await addHardwareModule(selectedNaveId, {
          name: name.trim(),
          type,
          devEui: devEui.trim(),
          connectionType,
          batteryVoltage: type === 'SENSOR_ANTENNA' ? 3.6 : 24.0,
          samplingIntervalSec,
          details,
          pinConfig: type === 'SENSOR_ANTENNA'
            ? { soilPins: [34, 35], ds18b20Pin: hasSoilTempDS18 ? 4 : undefined }
            : { relayPin, flowSensorPin },
          hasPhysicalKeypad: type === 'CONTROL_PANEL' ? hasPhysicalKeypad : false,
          hasOledDisplay: type === 'CONTROL_PANEL' ? hasOledDisplay : true
        });

        if (success) {
          onClose();
        }
      } else {
        // Provision as independent standalone node
        const success = await provisionDevice({
          type,
          name: name.trim(),
          sector,
          devEui: devEui.trim()
        });

        if (success) {
          onClose();
        }
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al aprovisionar dispositivo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 light:border-slate-200 bg-slate-950/60 light:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              type === 'SENSOR_ANTENNA'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {type === 'SENSOR_ANTENNA' ? <Radio className="w-6 h-6" /> : <Sliders className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 light:text-slate-900 tracking-tight">
                {type === 'SENSOR_ANTENNA' ? 'Aprovisionar Antena de Sensor LoRaWAN' : 'Aprovisionar Panel de Control & Mando'}
              </h2>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Registra y vincula un nuevo módulo de telemetría o actuación al sistema
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Hardware Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Selecciona el Tipo de Dispositivo de Hardware
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('SENSOR_ANTENNA')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  type === 'SENSOR_ANTENNA'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/40 light:bg-slate-50 border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                }`}
              >
                {type === 'SENSOR_ANTENNA' && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                )}
                <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-slate-100 light:text-slate-900">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Antena de Sensor</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sondas capacitivas de humedad en suelo (30/60cm), temperatura de sustrato y sensor ambiental SHT31.
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20">Batería Li-SOCl2 3.6V</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20">Bajo Consumo</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('CONTROL_PANEL')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  type === 'CONTROL_PANEL'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-300 ring-2 ring-blue-500/20'
                    : 'bg-slate-950/40 light:bg-slate-50 border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                }`}
              >
                {type === 'CONTROL_PANEL' && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-blue-400/20" />
                )}
                <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-slate-100 light:text-slate-900">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Panel de Control</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mando de electroválvula 24VAC, caudalímetro por pulsos, botonera física local y pantalla OLED.
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-blue-400">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20">Alimentación 24V DC</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20">Actuador Relé</span>
                </div>
              </button>
            </div>
          </div>

          {/* Scope / Destination */}
          <div className="p-4 rounded-2xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Asignación & Ubicación en el Campo
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  targetScope === 'ATTACH_TO_NAVE'
                    ? 'bg-slate-900 light:bg-white border-emerald-500/50 text-slate-100 light:text-slate-900 font-bold'
                    : 'border-slate-800 light:border-slate-200 text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'ATTACH_TO_NAVE'}
                  onChange={() => setTargetScope('ATTACH_TO_NAVE')}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <span>Vincular a Nave Existente</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  targetScope === 'NEW_STANDALONE_NODE'
                    ? 'bg-slate-900 light:bg-white border-emerald-500/50 text-slate-100 light:text-slate-900 font-bold'
                    : 'border-slate-800 light:border-slate-200 text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'NEW_STANDALONE_NODE'}
                  onChange={() => setTargetScope('NEW_STANDALONE_NODE')}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <span>Crear como Nodo Independiente</span>
              </label>
            </div>

            {targetScope === 'ATTACH_TO_NAVE' ? (
              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-1">Nave de Destino:</label>
                <select
                  value={selectedNaveId}
                  onChange={(e) => handleNaveChange(e.target.value)}
                  className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-200 light:text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                >
                  {naves.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.id} — {n.name} ({n.sector})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-1">Sector de Instalación:</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-200 light:text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Sector Norte A">Sector Norte A</option>
                  <option value="Sector Sur B">Sector Sur B</option>
                  <option value="Sector Almácigos">Sector Almácigos</option>
                  <option value="Batería Cabecera Central">Batería Cabecera Central</option>
                  <option value="Perímetro Exterior">Perímetro Exterior</option>
                </select>
              </div>
            )}
          </div>

          {/* Module Identification & LoRa Specs */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Identificación y Parámetros LoRaWAN
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre Descriptivo del Módulo:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Antena Sensor Sonda Profunda #2"
                  className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 light:text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">DevEUI (IEEE 64-bit Hex):</label>
                  <button
                    type="button"
                    onClick={() => setDevEui(generateDevEui(type))}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Auto-generar
                  </button>
                </div>
                <input
                  type="text"
                  value={devEui}
                  onChange={(e) => setDevEui(e.target.value)}
                  placeholder="70B3D57ED1..."
                  maxLength={16}
                  className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 light:text-slate-800 font-mono uppercase focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Enlace de Comunicación:</label>
                <select
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value as Esp32ConnectionType)}
                  className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-200 light:text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="LORAWAN">LoRaWAN (868/915 MHz — Largo Alcance)</option>
                  <option value="WIFI">Wi-Fi de Campo (WPA2-Enterprise)</option>
                  <option value="USB_SERIAL">Bus Cableado RS485 / Modbus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Frecuencia de Transmisión (Telemetría):</label>
                <select
                  value={samplingIntervalSec}
                  onChange={(e) => setSamplingIntervalSec(Number(e.target.value))}
                  className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-200 light:text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value={30}>Cada 30 segundos (Alta resolución)</option>
                  <option value={60}>Cada 60 segundos (Recomendado Riego)</option>
                  <option value={120}>Cada 2 minutos (Óptimo Batería)</option>
                  <option value={300}>Cada 5 minutos (Máximo Ahorro)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Specific Hardware Configuration */}
          <div className="p-4 rounded-2xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Configuración Específica de Sensores y Periféricos
            </label>

            {type === 'SENSOR_ANTENNA' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Profundidad de Sondas de Humedad de Suelo:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'SINGLE_30', label: 'Simple (30 cm)', desc: 'Bulbo superficial' },
                      { id: 'DUAL_30_60', label: 'Dual (30 y 60 cm)', desc: 'Bulbo + Capa freática' },
                      { id: 'TRIPLE_30_60_90', label: 'Triple (30, 60, 90 cm)', desc: 'Perfil completo' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSoilDepthConfig(opt.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          soilDepthConfig === opt.id
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                            : 'border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSoilTempDS18}
                      onChange={(e) => setHasSoilTempDS18(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-slate-200 light:text-slate-800">Sonda Térmica DS18B20</div>
                      <div className="text-[10px] text-slate-500">Temperatura de sustrato (GPIO 4 1-Wire)</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAmbientSHT31}
                      onChange={(e) => setHasAmbientSHT31(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-slate-200 light:text-slate-800">Sensor Ambiental SHT31</div>
                      <div className="text-[10px] text-slate-500">Temp & Humedad ambiente (I2C)</div>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Pin GPIO Relé Electroválvula Principal:</label>
                    <select
                      value={relayPin}
                      onChange={(e) => setRelayPin(Number(e.target.value))}
                      className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 font-mono"
                    >
                      <option value={25}>GPIO 25 (Salida Relé 24VAC #1)</option>
                      <option value={26}>GPIO 26 (Salida Relé 24VAC #2)</option>
                      <option value={27}>GPIO 27 (Salida Relé 24VAC #3)</option>
                      <option value={32}>GPIO 32 (Salida Relé de Potencia)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Pin GPIO Caudalímetro por Pulsos:</label>
                    <select
                      value={flowSensorPin}
                      onChange={(e) => setFlowSensorPin(Number(e.target.value))}
                      className="w-full bg-slate-900 light:bg-white border border-slate-700 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 font-mono"
                    >
                      <option value={14}>GPIO 14 (Entrada Interrupción Pulso)</option>
                      <option value={13}>GPIO 13 (Entrada Contador Secundario)</option>
                      <option value={12}>GPIO 12 (Entrada Contador 1 pulso/Litro)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPhysicalKeypad}
                      onChange={(e) => setHasPhysicalKeypad(e.target.checked)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-200 light:text-slate-800">Botonera Física en Puerta</div>
                      <div className="text-[10px] text-slate-500">Pulsadores Marcha / Paro manual en entrada</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/60 light:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasOledDisplay}
                      onChange={(e) => setHasOledDisplay(e.target.checked)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-200 light:text-slate-800">Display OLED 128x64</div>
                      <div className="text-[10px] text-slate-500">Indicador local estado válvula e IP (I2C 0x3C)</div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 light:border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !canConfigureDevices}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-white shadow-lg transition-all disabled:opacity-50 ${
                type === 'SENSOR_ANTENNA'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Aprovisionando en LoRaWAN...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Aprovisionar y Vincular Dispositivo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
