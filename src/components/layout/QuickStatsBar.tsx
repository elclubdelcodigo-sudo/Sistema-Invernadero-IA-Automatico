import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { Activity, AlertTriangle, Droplet, Radio, CheckCircle, WifiOff } from 'lucide-react';

export const QuickStatsBar: React.FC = () => {
  const { metrics, alerts, naves, setStatusFilter } = useFarm();

  if (!metrics) return null;

  const waterIssues = alerts.some(a => a.state === 'ACTIVA' && (a.type === 'Riego sin caudal' || a.type === 'Presión baja' || a.type === 'Caudal excesivo'));
  const disconnectedSensors = alerts.filter(a => a.state === 'ACTIVA' && a.type === 'Sensor desconectado').length;

  return (
    <div id="quick-stats-bar" className="w-full bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border-b border-slate-800 light:border-slate-200 px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Rapid Status Glance in <5 seconds */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-500 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Estado del Campo (125 Naves)
          </span>
          <span className="text-slate-500 dark:text-slate-400 light:text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 light:text-slate-600 hidden sm:inline">Última telemetría: {metrics.lastCommunicationTime}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono">
          {/* Total Online */}
          <button
            onClick={() => setStatusFilter('ONLINE')}
            title="Ver naves en línea"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 light:bg-emerald-50 border border-emerald-800/60 light:border-emerald-200 text-emerald-400 light:text-emerald-700 hover:border-emerald-500 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{metrics.navesOnline}</span> ONLINE
          </button>

          {/* Active Irrigation */}
          <button
            onClick={() => setStatusFilter('REGANDO')}
            title="Ver naves regando activamente"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950/60 light:bg-blue-50 border border-blue-800/60 light:border-blue-200 text-blue-400 light:text-blue-700 hover:border-blue-500 transition-colors"
          >
            <Droplet className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="font-semibold">{metrics.navesRegando}</span> REGANDO ({metrics.currentTotalFlowRate} L/min)
          </button>

          {/* Alarms */}
          <button
            onClick={() => setStatusFilter('ALARMA')}
            title="Ver naves con alarmas activas"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/60 light:bg-rose-50 border border-rose-800/60 light:border-rose-200 text-rose-400 light:text-rose-700 hover:border-rose-500 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold">{metrics.navesConAlarma}</span> CON ALARMA
          </button>

          {/* Offline Nodes */}
          <button
            onClick={() => setStatusFilter('OFFLINE')}
            title="Ver naves offline o sin señal"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/60 light:bg-slate-100 border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 hover:border-slate-500 transition-colors"
          >
            <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{metrics.navesOffline}</span> OFFLINE
          </button>

          {/* Water safety warning flag */}
          {waterIssues && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 light:text-amber-800 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Alerta de Agua Detectada
            </span>
          )}

          {disconnectedSensors > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/50 text-orange-300 light:text-orange-800">
              <Radio className="w-3 h-3 text-orange-400" />
              {disconnectedSensors} Sensor desconectado
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
