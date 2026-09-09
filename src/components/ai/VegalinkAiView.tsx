import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';
import { AIAnalysisResponse, AIRecommendationItem } from '../../types';
import {
  Sparkles,
  Send,
  Cpu,
  Droplets,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const VegalinkAiView: React.FC = () => {
  const { metrics, alerts, naves } = useFarm();
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);

  const handleRunDiagnosis = async (customPrompt?: string) => {
    const q = customPrompt || prompt || 'Realiza un diagnóstico global del campo y recomendaciones de riego';
    setLoading(true);
    try {
      const res = await api.analyzeWithAI(q);
      setAnalysis(res);
    } catch (err) {
      console.error('Error in AI analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Evaluar riesgo de estrés hídrico en las 125 naves',
    'Detectar naves con posible falla de caudal o fugas',
    'Optimizar ventanas horarias para reducir evaporación',
    'Auditar discrepancias entre sonda de 15cm y 30cm'
  ];

  const recommendations = analysis?.recommendations ?? [];
  const criticalNaves = analysis?.criticalNaves ?? [];
  const optimalWindows = analysis?.optimalWindows ?? [];
  const anomalies = analysis?.anomaliesDetected ?? [];

  return (
    <div id="vegalink-ai-view" className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
              VEGALINK AI — Asesor Agronómico Inteligente
            </h1>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Análisis predictivo multivariable asistido por IA con resiliencia en terreno y modo autónomo
          </p>
        </div>

        <button
          onClick={() => handleRunDiagnosis()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analizando campo...' : 'Generar Diagnóstico Global'}
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold">Consultas Rápidas:</span>
        {quickPrompts.map(p => (
          <button
            key={p}
            onClick={() => {
              setPrompt(p);
              handleRunDiagnosis(p);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 light:bg-slate-100 hover:bg-slate-800 text-slate-300 light:text-slate-700 text-xs border border-slate-800 light:border-slate-300 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Prompt Box */}
      <div className="p-4 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunDiagnosis();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pregunte a la IA sobre riego, consumo de agua, sensores o salud de naves..."
            className="flex-1 bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-200 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Consultar</span>
          </button>
        </form>
      </div>

      {/* Analysis Output Dashboard */}
      {analysis && (
        <div className="space-y-6 animate-fadeIn">
          {/* Diagnostic Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-950 light:from-purple-50 light:to-white border border-purple-900/40 light:border-purple-200 shadow-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">
                  Diagnóstico Global Agronómico
                </span>
                {analysis.source && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50">
                    {analysis.source}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>
                  Ahorro hídrico:{' '}
                  <strong className="text-emerald-400">
                    {analysis.waterSavingEstimatePercent ?? 22}% ({analysis.waterSavingsForecastM3 ?? 42.8} m³)
                  </strong>
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-200 light:text-slate-800 leading-relaxed font-medium">
              {analysis.summary}
            </p>
          </div>

          {/* Cards Grid: Recommendations, Critical Naves, Optimal Windows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Recommendations */}
            <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100 light:text-slate-900">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Recomendaciones Operativas ({recommendations.length})</span>
              </div>
              {recommendations.length === 0 ? (
                <p className="text-xs text-slate-400">Sin recomendaciones pendientes.</p>
              ) : (
                <ul className="space-y-2 text-xs text-slate-300 light:text-slate-600">
                  {recommendations.map((rec: any, i: number) => {
                    const isObj = typeof rec === 'object' && rec !== null;
                    const action = isObj ? rec.action : String(rec);
                    const reason = isObj ? rec.reason : null;
                    const naveId = isObj ? rec.naveId : null;
                    const urgency = isObj ? rec.urgency : null;

                    return (
                      <li key={i} className="p-2.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800/80 light:border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          {naveId && <span className="font-mono font-bold text-purple-400 text-[11px]">{naveId}</span>}
                          {urgency && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              urgency === 'ALTA' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              urgency === 'MEDIA' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {urgency}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-slate-200 light:text-slate-800 text-xs">
                          {action}
                        </p>
                        {reason && (
                          <p className="text-[11px] text-slate-400 light:text-slate-500">
                            {reason}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Critical Naves Identified */}
            <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100 light:text-slate-900">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Naves que Requieren Intervención ({criticalNaves.length})</span>
              </div>
              {criticalNaves.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Todas las 125 naves dentro de rangos operativos normales.</span>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {criticalNaves.map((n, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-1"
                    >
                      <div className="flex justify-between font-mono font-bold">
                        <span className="text-rose-400">{n.naveId}</span>
                        <span className="text-slate-400 text-[10px]">{n.issue}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 light:text-slate-600">
                        {n.actionRequired}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Irrigation Schedule Optimization */}
            <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100 light:text-slate-900">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>Ventanas Óptimas Calculadas ({optimalWindows.length})</span>
              </div>
              {optimalWindows.length === 0 ? (
                <p className="text-xs text-slate-400">Ventanas habituales recomendadas según programación ESP32.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {optimalWindows.map((win, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-blue-950/30 light:bg-blue-50 border border-blue-900/40 light:border-blue-200 space-y-1"
                    >
                      <div className="flex justify-between font-mono font-bold text-blue-300 light:text-blue-900">
                        <span>{win.sector}</span>
                        <span>{win.timeWindow}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 light:text-slate-600">
                        {win.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Anomalies Detected Section if present */}
          {anomalies.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100 light:text-slate-900">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Anomalías Técnicas y de Sensores Detectadas ({anomalies.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {anomalies.map((an, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/50 light:bg-slate-50 border border-slate-800/80 light:border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono font-bold text-amber-400 text-xs block">{an.naveId}</span>
                      <p className="text-slate-300 light:text-slate-700 text-xs mt-0.5">{an.description}</p>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                      {Math.round(an.confidence * 100)}% conf.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
