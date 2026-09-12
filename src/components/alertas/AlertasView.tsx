import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Eye,
  Check,
  Filter,
  Clock,
  ShieldAlert,
  Wrench,
  Gauge,
  Zap
} from 'lucide-react';
import { Alert } from '../../types';

export const AlertasView: React.FC = () => {
  const { alerts, recognizeAlert, resolveAlert, setSelectedNaveId } = useFarm();
  const { canPerformIrrigation } = useAuth();
  const [stateFilter, setStateFilter] = useState<string>('TODAS');
  const [severityFilter, setSeverityFilter] = useState<string>('TODAS');

  const filteredAlerts = alerts.filter(a => {
    if (stateFilter !== 'TODAS' && a.state !== stateFilter) return false;
    if (severityFilter !== 'TODAS' && a.severity !== severityFilter) return false;
    return true;
  });

  const getSeverityBadge = (severity: Alert['severity']) => {
    switch (severity) {
      case 'CRÍTICA':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
      case 'ADVERTENCIA':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
      case 'INFO':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/40';
    }
  };

  const getStateBadge = (state: Alert['state']) => {
    switch (state) {
      case 'ACTIVA':
        return 'bg-rose-600 text-white animate-pulse';
      case 'RECONOCIDA':
        return 'bg-amber-600 text-white';
      case 'RESUELTA':
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div id="alertas-view" className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
            Centro de Gestión de Alertas & Fallas
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Detección automática de anomalías hidráulicas, estrés térmico, sensores y comunicación
          </p>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold">
            {alerts.filter(a => a.state === 'ACTIVA').length} Activas
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold">
            {alerts.filter(a => a.state === 'RECONOCIDA').length} Reconocidas
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold">
            {alerts.filter(a => a.state === 'RESUELTA').length} Resueltas
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Estado:</span>
          {['TODAS', 'ACTIVA', 'RECONOCIDA', 'RESUELTA'].map(st => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                stateFilter === st
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Severidad:</span>
          {['TODAS', 'CRÍTICA', 'ADVERTENCIA', 'INFO'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                severityFilter === sev
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-400'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 text-xs text-slate-400">
            No se encontraron alertas para los filtros seleccionados.
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-700"
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  alert.severity === 'CRÍTICA' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <button
                      onClick={() => setSelectedNaveId(alert.greenhouseId)}
                      className="font-mono font-bold text-xs text-emerald-400 hover:underline"
                    >
                      {alert.greenhouseName} ({alert.greenhouseId})
                    </button>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStateBadge(alert.state)}`}>
                      {alert.state}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 light:text-slate-900 flex items-center gap-2">
                    <span>{alert.type}</span>
                    {alert.triggerCondition && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 light:bg-slate-100 text-[10px] font-mono text-slate-300 light:text-slate-700 border border-slate-700 light:border-slate-300">
                        Regla: {alert.triggerCondition}
                      </span>
                    )}
                  </h3>

                  <p className="text-xs text-slate-300 light:text-slate-600 mt-1 leading-relaxed">
                    {alert.description}
                  </p>

                  {/* CAUSA RAÍZ & MOTIVO DE ACTIVACIÓN DETALLADO */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 light:bg-slate-100 border border-rose-500/30 light:border-rose-300 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-rose-300 light:text-rose-900">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[10px] text-rose-400 light:text-rose-700 block">
                          ¿Por qué se activó esta alarma? (Causa Raíz)
                        </span>
                        <p className="text-slate-200 light:text-slate-800 font-medium leading-normal mt-0.5">
                          {alert.causeReason || alert.description}
                        </p>
                      </div>
                    </div>

                    {alert.sensorValueAtTrigger && (
                      <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300 light:text-cyan-800 bg-cyan-950/40 light:bg-cyan-50 p-2 rounded-lg border border-cyan-500/20">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span><strong>Telemetría en Disparo:</strong> {alert.sensorValueAtTrigger}</span>
                      </div>
                    )}

                    {alert.recommendedAction && (
                      <div className="flex items-start gap-2 text-[11px] text-emerald-300 light:text-emerald-900 bg-emerald-950/30 light:bg-emerald-50 p-2 rounded-lg border border-emerald-500/20">
                        <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-400 light:text-emerald-800">Acción Técnico-Agronómica Recomendada:</span>
                          <span className="ml-1 text-slate-200 light:text-slate-800">{alert.recommendedAction}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 light:text-slate-500 font-mono mt-2.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp.replace('T', ' ').substring(0, 19)}
                    </span>
                    {alert.recognizedBy && (
                      <span>Reconocida por: <strong>{alert.recognizedBy}</strong></span>
                    )}
                    {alert.resolvedAt && (
                      <span className="text-emerald-400 font-bold">✓ Resuelta ({alert.resolvedAt.replace('T', ' ').substring(0, 19)})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {alert.state === 'ACTIVA' && (
                  <button
                    onClick={() => recognizeAlert(alert.id)}
                    disabled={!canPerformIrrigation}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Reconocer
                  </button>
                )}

                {alert.state !== 'RESUELTA' && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    disabled={!canPerformIrrigation}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Resolver
                  </button>
                )}

                <button
                  onClick={() => setSelectedNaveId(alert.greenhouseId)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 light:bg-slate-100 hover:bg-slate-700 text-slate-200 light:text-slate-800 font-bold text-xs"
                >
                  Ver Nave
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
