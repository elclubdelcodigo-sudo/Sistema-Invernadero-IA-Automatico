import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { Esp32Role, Esp32ConnectionType, Nave } from '../../types';
import {
  Cpu,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Zap,
  Wifi,
  Usb,
  Bluetooth,
  Gauge,
  Layers,
  Check,
  ShieldCheck,
  Activity,
  Maximize2
} from 'lucide-react';

export const Esp32ConfigModal: React.FC = () => {
  const {
    naves,
    esp32ModalTarget,
    setEsp32ModalTarget,
    configureEsp32,
    configureEsp32Bulk,
    testEsp32Connection
  } = useFarm();
  const { canConfigureDevices } = useAuth();

  const targetNave = esp32ModalTarget?.nave || naves[0];
  const [scope, setScope] = useState<'SINGLE' | 'ALL' | 'SELECTED'>('SINGLE');
  const [selectedRole, setSelectedRole] = useState<Esp32Role>('HYBRID');
  const [connectionType, setConnectionType] = useState<Esp32ConnectionType>('LORAWAN');
  const [samplingInterval, setSamplingInterval] = useState<number>(120);
  const [hasPhysicalKeypad, setHasPhysicalKeypad] = useState<boolean>(true);
  const [hasOledDisplay, setHasOledDisplay] = useState<boolean>(true);
  const [relayPin, setRelayPin] = useState<number>(25);
  const [flowSensorPin, setFlowSensorPin] = useState<number>(14);

  // Diagnostics / Testing State
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Saving / Sync State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);

  // Synchronize state when esp32ModalTarget changes
  useEffect(() => {
    if (esp32ModalTarget) {
      setScope(esp32ModalTarget.targetMode || 'SINGLE');
      const nave = esp32ModalTarget.nave || naves[0];
      if (nave) {
        setSelectedRole(nave.esp32Config?.role || 'HYBRID');
        setConnectionType(nave.esp32Config?.connectionType || 'LORAWAN');
        setSamplingInterval(nave.esp32Config?.samplingIntervalSec || 120);
        setHasPhysicalKeypad(nave.esp32Config?.hasPhysicalKeypad ?? true);
        setHasOledDisplay(nave.esp32Config?.hasOledDisplay ?? true);
        setRelayPin(nave.esp32Config?.relayPin || 25);
        setFlowSensorPin(nave.esp32Config?.flowSensorPin || 14);
      }
      setTestResult(null);
      setIsTesting(false);
      setIsSaving(false);
      setSyncProgress(0);
    }
  }, [esp32ModalTarget, naves]);

  // If no target, don't render modal (placed AFTER all hook declarations)
  if (!esp32ModalTarget || !targetNave) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const diag = await testEsp32Connection(targetNave.id);
      setTestResult(diag);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'No fue posible contactar al microcontrolador ESP32.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfigureDevices) return;
    setIsSaving(true);
    setSyncProgress(10);

    const configPayload = {
      role: selectedRole,
      connectionType,
      samplingIntervalSec: samplingInterval,
      hasPhysicalKeypad,
      hasOledDisplay,
      relayPin,
      flowSensorPin,
      firmwareVersion: 'v2.4.2-esp32'
    };

    if (scope === 'ALL' || scope === 'SELECTED') {
      // Animate progress simulation
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 25;
        });
      }, 250);

      await configureEsp32Bulk({
        role: selectedRole,
        target: scope,
        ids: esp32ModalTarget.ids,
        config: configPayload
      });

      clearInterval(interval);
      setSyncProgress(100);
      setTimeout(() => {
        setIsSaving(false);
        setEsp32ModalTarget(null);
      }, 500);
    } else {
      await configureEsp32(targetNave.id, configPayload);
      setIsSaving(false);
      setEsp32ModalTarget(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-2xl text-slate-100 light:text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 bg-slate-900/95 light:bg-white/95 backdrop-blur-md border-b border-slate-800 light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white light:text-slate-900">
                  Configuración de Enlace & Rol ESP32
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  VEGALINK MicroCore
                </span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                Configura el microcontrolador como <strong className="text-amber-300">Antena de Sensor</strong> o <strong className="text-blue-400">Panel de Mando</strong> local.
              </p>
            </div>
          </div>

          <button
            onClick={() => setEsp32ModalTarget(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Scope Selector: Individual vs Todas las Naves */}
          <div className="p-4 rounded-2xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 light:text-slate-500 block">
              Alcance de la Configuración:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('SINGLE')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  scope === 'SINGLE'
                    ? 'bg-amber-500/10 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/40'
                    : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${scope === 'SINGLE' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white light:text-slate-900">
                    Solo para esta Nave ({targetNave.id})
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ajuste particular para el nodo microcontrolador de {targetNave.name}.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  scope === 'ALL'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-200 ring-1 ring-blue-500/40'
                    : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${scope === 'ALL' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white light:text-slate-900 flex items-center gap-1.5">
                    <span>Para TODAS las Naves ({naves.length})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">Lote Global</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Modifica y sincroniza la flota completa (125 naves + 3 almácigos).
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Connection Test & Link Protocol */}
          <div className="p-4 rounded-2xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 light:text-slate-800">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Protocolo de Conexión con el ESP32:</span>
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 light:text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Probando Enlace...' : 'Probar Conexión'}</span>
              </button>
            </div>

            {/* Protocol Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConnectionType('LORAWAN')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  connectionType === 'LORAWAN'
                    ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-400'
                }`}
              >
                <Radio className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span>LoRaWAN 915 MHz</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionType('WIFI')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  connectionType === 'WIFI'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-400'
                }`}
              >
                <Wifi className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                <span>WiFi Direct / AP</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionType('USB_SERIAL')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  connectionType === 'USB_SERIAL'
                    ? 'bg-purple-600/15 border-purple-500 text-purple-300 font-bold'
                    : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-400'
                }`}
              >
                <Usb className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <span>USB Serie / CH340</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionType('BLUETOOTH')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  connectionType === 'BLUETOOTH'
                    ? 'bg-sky-600/15 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-400'
                }`}
              >
                <Bluetooth className="w-4 h-4 mx-auto mb-1 text-sky-400" />
                <span>Bluetooth BLE</span>
              </button>
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-mono animate-fadeIn ${
                testResult.connected
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1.5">
                  {testResult.connected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{testResult.connected ? 'ESP32 Conectado y En Línea' : 'Fallo de Enlace ESP32'}</span>
                </div>
                <div className="text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                  <div>Ping: <strong className="text-white">{testResult.pingMs} ms</strong></div>
                  <div>RSSI: <strong className="text-white">{testResult.signalRssi} dBm</strong></div>
                  <div>Heap Libre: <strong className="text-white">{Math.round(testResult.heapFreeBytes / 1024)} KB</strong></div>
                  <div>Alimentación: <strong className="text-white">{testResult.voltage} VDC</strong></div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  * {testResult.message}
                </div>
              </div>
            )}
          </div>

          {/* Primary Selection: ESP32 Role (Antena de Sensor vs Panel de Mando vs Híbrido) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700">
                Selección de Rol Operativo del ESP32:
              </label>
              <span className="text-[11px] text-amber-400 font-semibold">
                * Determina el firmware y periféricos activos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Antena de Sensor */}
              <div
                onClick={() => setSelectedRole('SENSOR_ANTENNA')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedRole === 'SENSOR_ANTENNA'
                    ? 'bg-amber-500/10 border-amber-500 text-white ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/40 light:bg-slate-50 border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Radio className="w-5 h-5" />
                    </div>
                    {selectedRole === 'SENSOR_ANTENNA' && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-300">
                      Antena de Sensor
                    </h3>
                    <p className="text-[11px] text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                      Nodo concentrador de telemetría de suelo y ambiente. Transmite lecturas por antena LoRa 915 MHz periódicamente.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 light:border-slate-200 text-[10px] space-y-1 font-mono text-slate-400">
                  <div>✓ Humedad Suelo 15cm & 30cm</div>
                  <div>✓ Temperatura & Humedad SHT31</div>
                  <div>✓ Presión & Caudalímetro</div>
                  <div>✓ Bajo consumo energético</div>
                </div>
              </div>

              {/* Option 2: Panel de Mando */}
              <div
                onClick={() => setSelectedRole('CONTROL_PANEL')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedRole === 'CONTROL_PANEL'
                    ? 'bg-blue-600/15 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg shadow-blue-600/10'
                    : 'bg-slate-950/40 light:bg-slate-50 border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <Sliders className="w-5 h-5" />
                    </div>
                    {selectedRole === 'CONTROL_PANEL' && (
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-blue-300">
                      Panel de Mando
                    </h3>
                    <p className="text-[11px] text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                      Controlador de actuadores en cabezal de nave. Habilita relé de electroválvula 24VDC y botonera manual local.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 light:border-slate-200 text-[10px] space-y-1 font-mono text-slate-400">
                  <div>✓ Relé Electroválvula 24VDC (GPIO 25)</div>
                  <div>✓ Pulsadores físicos en nave (Abrir/Parar)</div>
                  <div>✓ Display local OLED SSD1306</div>
                  <div>✓ Lógica autónoma anti-fuga</div>
                </div>
              </div>

              {/* Option 3: Modo Híbrido */}
              <div
                onClick={() => setSelectedRole('HYBRID')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedRole === 'HYBRID'
                    ? 'bg-emerald-600/15 border-emerald-500 text-white ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-600/10'
                    : 'bg-slate-950/40 light:bg-slate-50 border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    {selectedRole === 'HYBRID' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-300">
                      Modo Integral (Híbrido)
                    </h3>
                    <p className="text-[11px] text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                      Control integral de la nave: lectura de sensores y control de electroválvula ejecutados por el mismo ESP32.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 light:border-slate-200 text-[10px] space-y-1 font-mono text-slate-400">
                  <div>✓ Antena de sensores activa</div>
                  <div>✓ Panel de mando y relé activos</div>
                  <div>✓ Sincronización continua LoRa/Hostinger</div>
                  <div>✓ Autonomía completa Local-First</div>
                </div>
              </div>
            </div>
          </div>

          {/* Granular Pinout and Timing Settings */}
          <div className="p-4 rounded-2xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-4 text-xs">
            <div className="font-bold text-slate-200 light:text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Ajustes de Periféricos & Temporización:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Intervalo de Muestreo de Sensores:
                </label>
                <select
                  value={samplingInterval}
                  onChange={(e) => setSamplingInterval(Number(e.target.value))}
                  className="w-full bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 font-mono"
                >
                  <option value={30}>Cada 30 segundos (Pruebas)</option>
                  <option value={60}>Cada 1 minuto (Almácigos / Riego activo)</option>
                  <option value={120}>Cada 2 minutos (Recomendado estándar)</option>
                  <option value={300}>Cada 5 minutos (Ahorro batería solar)</option>
                  <option value={600}>Cada 10 minutos (Baja demanda)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Pin GPIO Relé Electroválvula 24V:
                </label>
                <select
                  value={relayPin}
                  onChange={(e) => setRelayPin(Number(e.target.value))}
                  disabled={selectedRole === 'SENSOR_ANTENNA'}
                  className="w-full bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 font-mono disabled:opacity-40"
                >
                  <option value={25}>GPIO 25 (Salida Optoacoplador)</option>
                  <option value={26}>GPIO 26 (Salida Relé Secundario)</option>
                  <option value={27}>GPIO 27 (Salida PWM)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Pin GPIO Caudalímetro Pulsos:
                </label>
                <select
                  value={flowSensorPin}
                  onChange={(e) => setFlowSensorPin(Number(e.target.value))}
                  className="w-full bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-slate-200 light:text-slate-800 font-mono"
                >
                  <option value={14}>GPIO 14 (Interrupción INT0)</option>
                  <option value={12}>GPIO 12 (Entrada Pull-up)</option>
                  <option value={13}>GPIO 13 (Sensor Hall)</option>
                </select>
              </div>
            </div>

            {/* Hardware checkboxes */}
            <div className="pt-2 border-t border-slate-800 light:border-slate-200 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPhysicalKeypad}
                  onChange={(e) => setHasPhysicalKeypad(e.target.checked)}
                  disabled={selectedRole === 'SENSOR_ANTENNA'}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300 light:text-slate-700 font-semibold">
                  Botonera física en cabezal de la nave (Pulsadores Abrir / Parar)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOledDisplay}
                  onChange={(e) => setHasOledDisplay(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300 light:text-slate-700 font-semibold">
                  Display OLED 0.96" I2C para estado local en terreno
                </span>
              </label>
            </div>
          </div>

          {/* Sync Progress if bulk updating */}
          {isSaving && (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400">
                  {scope === 'ALL' 
                    ? `Flasheando y sincronizando 128 microcontroladores ESP32 en memoria NVS...`
                    : `Sincronizando firmware de ESP32_${targetNave.id}...`}
                </span>
                <span className="font-bold text-white">{syncProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 light:border-slate-200">
            <div className="text-[11px] text-slate-500 font-mono">
              Formato de comando: <code>FPort 3 Downlink [SET_ESP32_ROLE: {selectedRole}]</code>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEsp32ModalTarget(null)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 light:text-slate-800 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving || !canConfigureDevices}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 ${
                  scope === 'ALL'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>
                  {isSaving
                    ? 'Guardando y Transmitiendo...'
                    : scope === 'ALL'
                    ? `Aplicar y Sincronizar en TODAS las Naves (${naves.length})`
                    : `Guardar y Configurar ESP32 (${targetNave.id})`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
