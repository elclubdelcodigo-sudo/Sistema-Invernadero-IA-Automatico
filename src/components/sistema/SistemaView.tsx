import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';
import {
  Settings,
  Database,
  Radio,
  Cpu,
  Server,
  Code,
  Terminal,
  Play,
  Zap,
  CheckCircle,
  Copy,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ESP32_FIRMWARE_CPP, CHIRPSTACK_CODEC_JS } from '../../data/esp32Reference';
import { VEGALINK_SQL_SCHEMA } from '../../data/schemaSql';

export const SistemaView: React.FC = () => {
  const { refreshData, showNotification } = useFarm();
  const [activeTab, setActiveTab] = useState<'arquitectura' | 'simulador' | 'sql' | 'esp32' | 'chirpstack'>('arquitectura');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    showNotification(`${label} copiado al portapapeles.`, 'info');
    setTimeout(() => setCopied(null), 2500);
  };

  const handleSimulateTick = async () => {
    await api.triggerSimulationTick();
    showNotification('Fluctuación agroclimática inyectada.', 'info');
    await refreshData();
  };

  const handleSimulateNoFlow = async () => {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'NAVE_003',
        valveStatus: 'ABIERTA',
        flowRate: 0.0,
        pressure: 0.9,
        temperature: 28.5
      })
    });
    showNotification('Inyectada anomalía "Riego sin Caudal" en NAVE_003.', 'error');
    await refreshData();
  };

  return (
    <div id="sistema-view" className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
            Arquitectura del Sistema, LoRaWAN & Base de Datos
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Especificación técnica de firmware ESP32, ingestión ChirpStack, Hostinger MySQL y simulador IoT
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 light:border-slate-200 bg-slate-900 light:bg-slate-100 px-4 gap-2 text-xs font-semibold overflow-x-auto rounded-xl">
        <button
          onClick={() => setActiveTab('arquitectura')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'arquitectura'
              ? 'border-emerald-500 text-emerald-400 light:text-emerald-700'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          Arquitectura 4 Capas
        </button>
        <button
          onClick={() => setActiveTab('simulador')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'simulador'
              ? 'border-blue-500 text-blue-400 light:text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-4 h-4" />
          Simulador de Campo LoRa
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sql'
              ? 'border-amber-500 text-amber-400 light:text-amber-700'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Esquema SQL Hostinger
        </button>
        <button
          onClick={() => setActiveTab('esp32')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'esp32'
              ? 'border-purple-500 text-purple-400 light:text-purple-700'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Firmware C++ ESP32 (Local First)
        </button>
        <button
          onClick={() => setActiveTab('chirpstack')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'chirpstack'
              ? 'border-teal-500 text-teal-400 light:text-teal-700'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          ChirpStack Codec
        </button>
      </div>

      {/* TAB 1: ARQUITECTURA */}
      {activeTab === 'arquitectura' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Layer 1 */}
            <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">
                Nivel Campo: ESP32 + Sensores
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Cada una de las 125 naves dispone de un ESP32 con transceptor SX1276/SX1262 LoRa 915 MHz, sondas capacitivas dobles, sensor SHT31, caudalímetro y driver MOSFET para electroválvula de 24 VDC.
              </p>
              <div className="text-[11px] font-mono text-purple-400 bg-purple-950/40 p-2 rounded-lg">
                Ejecuta reglas localmente aun sin conexión.
              </div>
            </div>

            {/* Layer 2 */}
            <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">
                Red LoRaWAN + Gateway
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Dos Gateways multicanal exteriores (RAK7289 / Dragino) capturan los paquetes en banda AU915 y los entregan al Network Server ChirpStack v4 mediante protocolo MQTT / Semtech UDP.
              </p>
              <div className="text-[11px] font-mono text-teal-400 bg-teal-950/40 p-2 rounded-lg">
                Alcance: &gt;5 km con línea de vista.
              </div>
            </div>

            {/* Layer 3 */}
            <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">
                Backend Node.js & API REST
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Servidor Express que expone endpoints seguros para ingesta de telemetría (webhook), gestión de alarmas, cola de downlinks, auditoría RBAC y el asistente de inteligencia agronómica VEGALINK AI.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 p-2 rounded-lg">
                Port 3000 • Ingesta &lt;50ms
              </div>
            </div>

            {/* Layer 4 */}
            <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">
                Hostinger MySQL & Particionado
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                Esquema relacional optimizado para Hostinger con particionamiento RANGE por mes en la tabla de telemetría para garantizar consultas ultra-rápidas a escala de millones de lecturas anuales.
              </p>
              <div className="text-[11px] font-mono text-amber-400 bg-amber-950/40 p-2 rounded-lg">
                InnoDB + Índices Compuestos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIMULADOR DE CAMPO */}
      {activeTab === 'simulador' && (
        <div className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-base font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Generador de Eventos LoRaWAN & Escenarios de Prueba
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Prueba la reacción en tiempo real del dashboard, las alarmas y el corte de electroválvulas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <button
              onClick={handleSimulateTick}
              className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 hover:border-emerald-500 text-left space-y-1 transition-all"
            >
              <span className="font-bold text-emerald-400 block">Flujo Climático Normal</span>
              <p className="text-[11px] text-slate-400">
                Modifica levemente temperaturas y humedades en las 125 naves para verificar la reactividad.
              </p>
            </button>

            <button
              onClick={handleSimulateNoFlow}
              className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 hover:border-rose-500 text-left space-y-1 transition-all"
            >
              <span className="font-bold text-rose-400 block">Simular Falla: Riego Sin Caudal</span>
              <p className="text-[11px] text-slate-400">
                Abre válvula en NAVE_003 con 0 L/min para probar el protocolo de seguridad y disparo de alarma.
              </p>
            </button>

            <button
              onClick={async () => {
                await fetch('/api/telemetry', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    deviceId: 'NAVE_001',
                    soilMoisture1: 31,
                    temperature: 25.0
                  })
                });
                showNotification('NAVE_001 por debajo del umbral del 35%. Evaluación de ciclo.', 'info');
                await refreshData();
              }}
              className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 hover:border-blue-500 text-left space-y-1 transition-all"
            >
              <span className="font-bold text-blue-400 block">Simular Humedad Baja en NAVE_001</span>
              <p className="text-[11px] text-slate-400">
                Baja la humedad al 31% para verificar la regla de disparo de riego autónomo.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SQL HOSTINGER */}
      {activeTab === 'sql' && (
        <div className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Esquema DDL SQL para Hostinger (MySQL / MariaDB)
            </h2>
            <button
              onClick={() => handleCopy(VEGALINK_SQL_SCHEMA, 'Esquema SQL')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied === 'Esquema SQL' ? 'Copiado' : 'Copiar SQL'}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] max-h-96 overflow-y-auto overflow-x-auto border border-slate-800">
            {VEGALINK_SQL_SCHEMA}
          </pre>
        </div>
      )}

      {/* TAB 4: ESP32 C++ */}
      {activeTab === 'esp32' && (
        <div className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Firmware C++ de Control Local Autónomo para ESP32
            </h2>
            <button
              onClick={() => handleCopy(ESP32_FIRMWARE_CPP, 'Firmware ESP32')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied === 'Firmware ESP32' ? 'Copiado' : 'Copiar C++'}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] max-h-96 overflow-y-auto overflow-x-auto border border-slate-800">
            {ESP32_FIRMWARE_CPP}
          </pre>
        </div>
      )}

      {/* TAB 5: CHIRPSTACK CODEC */}
      {activeTab === 'chirpstack' && (
        <div className="p-6 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-400" />
              Payload Codec JavaScript para ChirpStack v4 (Uplink / Downlink)
            </h2>
            <button
              onClick={() => handleCopy(CHIRPSTACK_CODEC_JS, 'Codec ChirpStack')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied === 'Codec ChirpStack' ? 'Copiado' : 'Copiar Codec'}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] max-h-96 overflow-y-auto overflow-x-auto border border-slate-800">
            {CHIRPSTACK_CODEC_JS}
          </pre>
        </div>
      )}
    </div>
  );
};
