import React, { useState, useMemo } from 'react';
import { Nave, IrrigationRule } from '../../types';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Thermometer,
  Droplets,
  Layers,
  Gauge,
  Wifi,
  Zap,
  Activity,
  CheckCircle,
  ShieldAlert,
  AlertTriangle,
  Play,
  Square,
  Clock,
  Sliders,
  Cpu,
  RefreshCw,
  X,
  FileCheck,
  Trash2,
  Radio,
  Settings,
  SlidersHorizontal,
  Terminal,
  Check,
  BarChart3,
  Target,
  TrendingUp,
  Download,
  Upload,
  FileSpreadsheet,
  Calendar,
  CalendarDays,
  RotateCcw,
  FileUp,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface NaveDetailModalProps {
  nave: Nave;
  onClose: () => void;
}

// Custom tooltip for comparing real-time vs optimal bar values
const CustomBarTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    const tiempoRealVal = payload.find((p: any) => p.dataKey === 'tiempoReal')?.value;
    const optimoVal = payload.find((p: any) => p.dataKey === 'optimo')?.value;
    const delta = (tiempoRealVal !== undefined && optimoVal !== undefined)
      ? Number((tiempoRealVal - optimoVal).toFixed(1))
      : 0;

    return (
      <div className="p-3 bg-slate-900/95 light:bg-white/95 border border-slate-700 light:border-slate-300 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
        <div className="font-bold text-slate-200 light:text-slate-800 border-b border-slate-800 light:border-slate-200 pb-1 flex items-center justify-between gap-4">
          <span>Hora: {label}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            Math.abs(delta) <= (unit === '°C' ? 2 : 5)
              ? 'bg-emerald-500/20 text-emerald-400 light:text-emerald-700'
              : 'bg-amber-500/20 text-amber-400 light:text-amber-700'
          }`}>
            {Math.abs(delta) <= (unit === '°C' ? 2 : 5) ? '✓ Rango Óptimo' : 'Desviación'}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4 text-slate-300 light:text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${unit === '°C' ? 'bg-rose-500' : 'bg-sky-500'}`} />
              <span>Tiempo Real:</span>
            </span>
            <span className="font-mono font-bold text-white light:text-slate-900">{tiempoRealVal} {unit}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300 light:text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Meta Óptima:</span>
            </span>
            <span className="font-mono font-bold text-emerald-400 light:text-emerald-700">{optimoVal} {unit}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px] pt-1 border-t border-slate-800/60 light:border-slate-200">
            <span className="text-slate-400 light:text-slate-500">Diferencia:</span>
            <span className={`font-mono font-bold ${delta > 0 ? 'text-amber-400 light:text-amber-700' : delta < 0 ? 'text-sky-400 light:text-sky-700' : 'text-emerald-400 light:text-emerald-700'}`}>
              {delta > 0 ? `+${delta}` : delta} {unit}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const NaveDetailModal: React.FC<NaveDetailModalProps> = ({ nave, onClose }) => {
  const {
    requestManualIrrigation,
    stopIrrigation,
    refreshData,
    showNotification,
    deleteNave,
    setEsp32ModalTarget,
    configureEsp32,
    testEsp32Connection,
    isProductionMode,
    alerts,
    recognizeAlert,
    resolveAlert
  } = useFarm();
  const { canPerformIrrigation, canConfigureDevices, currentUser } = useAuth();

  // Active alerts specifically for this nave
  const activeNaveAlerts = useMemo(() => {
    return alerts.filter(a => a.greenhouseId === nave.id && a.state !== 'RESUELTA');
  }, [alerts, nave.id]);

  // Local state for automation rule editing
  const [rule, setRule] = useState<IrrigationRule>({ ...nave.automationRule });
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [activeTab, setActiveTab] = useState<'sensores' | 'riego' | 'automatizacion' | 'dispositivo'>('sensores');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Diagnostics state for ESP32 in Tab 4
  const [isTestingEsp32, setIsTestingEsp32] = useState(false);
  const [esp32Diag, setEsp32Diag] = useState<any>(null);

  const handleTestEsp32 = async () => {
    setIsTestingEsp32(true);
    setEsp32Diag(null);
    try {
      const diag = await testEsp32Connection(nave.id);
      setEsp32Diag(diag);
    } finally {
      setIsTestingEsp32(false);
    }
  };

  const handleQuickRoleChange = async (role: 'SENSOR_ANTENNA' | 'CONTROL_PANEL' | 'HYBRID') => {
    if (!canConfigureDevices) return;
    await configureEsp32(nave.id, { role });
  };

  const handleDeleteNave = async () => {
    setIsDeleting(true);
    const success = await deleteNave(nave.id);
    setIsDeleting(false);
    if (success) {
      onClose();
    }
  };

  // Format countdown for active irrigation: mm:ss
  const formatTimer = (seconds?: number) => {
    if (seconds === undefined) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSaveAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRule(true);
    try {
      await api.updateNaveAutomation(nave.id, rule, currentUser.name);
      showNotification(`Reglas actualizadas y sincronizadas con ${nave.id} (ESP32 Flash).`, 'success');
      await refreshData();
    } catch (err: any) {
      showNotification('Error al sincronizar reglas con el ESP32', 'error');
    } finally {
      setIsSavingRule(false);
    }
  };

  // Optimal agronomic targets
  const optimalTemp = 23.0; // Meta agronómica óptima (°C)
  const optimalHum = 65;    // Meta agronómica óptima (%)

  // Time resolution selector: 'dias' | 'meses' | 'anos' | 'csv'
  const [timeRange, setTimeRange] = useState<'dias' | 'meses' | 'anos' | 'csv'>('dias');
  
  // Custom CSV import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importedData, setImportedData] = useState<{
    temp: Array<{ time: string; tiempoReal: number; optimo: number }>;
    hum: Array<{ time: string; tiempoReal: number; optimo: number }>;
    fileName: string;
    recordCount: number;
    importedAt: string;
  } | null>(null);

  const [csvPreview, setCsvPreview] = useState<{
    fileName: string;
    parsedTemp: Array<{ time: string; tiempoReal: number; optimo: number }>;
    parsedHum: Array<{ time: string; tiempoReal: number; optimo: number }>;
    rawRows: Array<{ time: string; tempReal: number; tempOpt: number; humReal: number; humOpt: number }>;
    error?: string;
  } | null>(null);

  // Generador de datos pseudoaleatorios para el Modo Producción
  const generateRealisticData = (
    type: 'dias' | 'meses' | 'anos', 
    baseValue: number, 
    optimo: number, 
    isTemp: boolean
  ) => {
    const data = [];
    const variance = isTemp ? 4 : 15; // Variación térmica vs hídrica
    
    if (type === 'dias') {
      const days = ['02 Sep', '03 Sep', '04 Sep', '05 Sep', '06 Sep', '07 Sep', '08 Sep', '09 Sep (Hoy)'];
      days.forEach((day, i) => {
        // Generar una curva sinusoidal para simular frentes climáticos + ruido
        const trend = Math.sin(i * 0.8) * (variance / 2);
        const noise = isProductionMode ? (Math.sin(nave.id.charCodeAt(0) + i) * (variance / 3)) : 0;
        let val = baseValue + trend + noise;
        if (i === days.length - 1) val = baseValue; // El último día debe ser igual al valor actual
        
        data.push({
          time: day,
          tiempoReal: isTemp ? Number(val.toFixed(1)) : Math.round(val),
          optimo: optimo
        });
      });
    } else if (type === 'meses') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep (Actual)'];
      months.forEach((month, i) => {
        // Estacionalidad: Más frío/húmedo en invierno (Jun-Jul)
        const seasonal = isTemp ? Math.cos((i / 11) * Math.PI * 2) * 5 : Math.sin((i / 11) * Math.PI * 2) * -10;
        const noise = isProductionMode ? (Math.cos(nave.id.charCodeAt(0) + i) * (variance / 2)) : 0;
        let val = baseValue + seasonal + noise;
        if (i === months.length - 1) val = baseValue;
        
        data.push({
          time: month,
          tiempoReal: isTemp ? Number(val.toFixed(1)) : Math.round(val),
          optimo: optimo
        });
      });
    } else {
      const years = ['2023', '2024', '2025', '2026 (En Curso)'];
      years.forEach((year, i) => {
        // Tendencia macro
        const trend = (i - 2) * (isTemp ? 0.3 : -1.5);
        const noise = isProductionMode ? (Math.sin(nave.id.charCodeAt(0) * i) * (variance / 4)) : 0;
        let val = baseValue + trend + noise;
        if (i === years.length - 1) val = baseValue;
        
        data.push({
          time: year,
          tiempoReal: isTemp ? Number(val.toFixed(1)) : Math.round(val),
          optimo: optimo
        });
      });
    }
    return data;
  };

  const { diasTempData, diasHumData, mesesTempData, mesesHumData, anosTempData, anosHumData } = useMemo(() => {
    return {
      diasTempData: generateRealisticData('dias', nave.temperature, optimalTemp, true),
      diasHumData: generateRealisticData('dias', nave.humidity, optimalHum, false),
      mesesTempData: generateRealisticData('meses', nave.temperature, optimalTemp, true),
      mesesHumData: generateRealisticData('meses', nave.humidity, optimalHum, false),
      anosTempData: generateRealisticData('anos', nave.temperature, optimalTemp, true),
      anosHumData: generateRealisticData('anos', nave.humidity, optimalHum, false)
    };
  }, [nave.id, nave.temperature, nave.humidity, optimalTemp, optimalHum, isProductionMode]);

  // Resolve active chart datasets based on selected time resolution
  const activeTemperaturaChartData =
    timeRange === 'csv' && importedData
      ? importedData.temp
      : timeRange === 'meses'
      ? mesesTempData
      : timeRange === 'anos'
      ? anosTempData
      : diasTempData;

  const activeHumedadChartData =
    timeRange === 'csv' && importedData
      ? importedData.hum
      : timeRange === 'meses'
      ? mesesHumData
      : timeRange === 'anos'
      ? anosHumData
      : diasHumData;

  const tempDiff = Number((nave.temperature - optimalTemp).toFixed(1));
  const humDiff = Math.round(nave.humidity - optimalHum);

  // EXPORT TO CSV HANDLER
  const handleExportCSV = () => {
    try {
      const activeDataLen = activeTemperaturaChartData.length;
      const csvRows = [
        // UTF-8 Header
        ['Periodo', 'Nave_ID', 'Nave_Nombre', 'Sector', 'Temperatura_Real_C', 'Temperatura_Optima_C', 'Diferencia_Temp_C', 'Humedad_Real_Pct', 'Humedad_Optima_Pct', 'Diferencia_Hum_Pct', 'Estado_Rango']
      ];

      for (let i = 0; i < activeDataLen; i++) {
        const tPoint = activeTemperaturaChartData[i];
        const hPoint = activeHumedadChartData[i] || { tiempoReal: 0, optimo: 65 };
        const tDelta = Number((tPoint.tiempoReal - tPoint.optimo).toFixed(1));
        const hDelta = Number((hPoint.tiempoReal - hPoint.optimo).toFixed(1));
        const estado = Math.abs(tDelta) <= 2 && Math.abs(hDelta) <= 5 ? 'OPTIMO' : 'DESVIADO';

        csvRows.push([
          `"${tPoint.time}"`,
          `"${nave.id}"`,
          `"${nave.name}"`,
          `"${nave.sector}"`,
          String(tPoint.tiempoReal),
          String(tPoint.optimo),
          String(tDelta),
          String(hPoint.tiempoReal),
          String(hPoint.optimo),
          String(hDelta),
          `"${estado}"`
        ]);
      }

      const csvContent = '\uFEFF' + csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timeTag = timeRange === 'csv' ? 'importado' : timeRange;
      const dateStr = new Date().toISOString().slice(0, 10);
      
      link.href = url;
      link.setAttribute('download', `telemetria_${nave.id.toLowerCase()}_${timeTag}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`Historial (${timeRange.toUpperCase()}) exportado exitosamente en CSV`, 'success');
    } catch (err: any) {
      showNotification('Error al exportar archivo CSV', 'error');
    }
  };

  // PARSE CSV FILE
  const parseCSVContent = (content: string, fileName: string) => {
    try {
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        setCsvPreview({
          fileName,
          parsedTemp: [],
          parsedHum: [],
          rawRows: [],
          error: 'El archivo CSV está vacío o solo contiene una fila.'
        });
        return;
      }

      // Determine separator: comma or semicolon
      const firstLine = lines[0];
      const sep = firstLine.includes(';') ? ';' : ',';

      const headers = firstLine.split(sep).map(h => h.replace(/["']/g, '').trim().toLowerCase());
      
      // Look for key columns
      let timeIdx = headers.findIndex(h => h.includes('period') || h.includes('time') || h.includes('fecha') || h.includes('hora') || h.includes('dia') || h.includes('mes'));
      let tempRealIdx = headers.findIndex(h => (h.includes('temp') && h.includes('real')) || h.includes('temperatura_real') || h === 'temp' || h === 'temperatura');
      let tempOptIdx = headers.findIndex(h => (h.includes('temp') && (h.includes('opt') || h.includes('meta'))) || h.includes('temperatura_optima'));
      let humRealIdx = headers.findIndex(h => (h.includes('hum') && h.includes('real')) || h.includes('humedad_real') || h === 'hum' || h === 'humedad');
      let humOptIdx = headers.findIndex(h => (h.includes('hum') && (h.includes('opt') || h.includes('meta'))) || h.includes('humedad_optima'));

      // Fallback to position-based indexing if headers not detected
      if (timeIdx === -1) timeIdx = 0;
      if (tempRealIdx === -1) tempRealIdx = 1 < headers.length ? 1 : 0;
      if (tempOptIdx === -1) tempOptIdx = 2 < headers.length ? 2 : tempRealIdx;
      if (humRealIdx === -1) humRealIdx = 3 < headers.length ? 3 : tempRealIdx;
      if (humOptIdx === -1) humOptIdx = 4 < headers.length ? 4 : humRealIdx;

      const parsedTemp: Array<{ time: string; tiempoReal: number; optimo: number }> = [];
      const parsedHum: Array<{ time: string; tiempoReal: number; optimo: number }> = [];
      const rawRows: Array<{ time: string; tempReal: number; tempOpt: number; humReal: number; humOpt: number }> = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.replace(/["']/g, '').trim());
        if (cols.length <= 1) continue;

        const timeLabel = cols[timeIdx] || `R-${i}`;
        const tReal = parseFloat((cols[tempRealIdx] || '22').replace(',', '.'));
        const tOpt = parseFloat((cols[tempOptIdx] || '23').replace(',', '.'));
        const hReal = parseFloat((cols[humRealIdx] || '65').replace(',', '.'));
        const hOpt = parseFloat((cols[humOptIdx] || '65').replace(',', '.'));

        if (!isNaN(tReal) || !isNaN(hReal)) {
          const finalTReal = isNaN(tReal) ? 22 : Number(tReal.toFixed(1));
          const finalTOpt = isNaN(tOpt) ? 23 : Number(tOpt.toFixed(1));
          const finalHReal = isNaN(hReal) ? 65 : Math.round(hReal);
          const finalHOpt = isNaN(hOpt) ? 65 : Math.round(hOpt);

          parsedTemp.push({ time: timeLabel, tiempoReal: finalTReal, optimo: finalTOpt });
          parsedHum.push({ time: timeLabel, tiempoReal: finalHReal, optimo: finalHOpt });
          rawRows.push({
            time: timeLabel,
            tempReal: finalTReal,
            tempOpt: finalTOpt,
            humReal: finalHReal,
            humOpt: finalHOpt
          });
        }
      }

      if (parsedTemp.length === 0) {
        setCsvPreview({
          fileName,
          parsedTemp: [],
          parsedHum: [],
          rawRows: [],
          error: 'No se pudieron extraer datos numéricos válidos de temperatura/humedad.'
        });
        return;
      }

      setCsvPreview({
        fileName,
        parsedTemp,
        parsedHum,
        rawRows,
        error: undefined
      });
    } catch (err: any) {
      setCsvPreview({
        fileName,
        parsedTemp: [],
        parsedHum: [],
        rawRows: [],
        error: `Error al procesar CSV: ${err?.message || 'Formato no soportado'}`
      });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        showNotification('Por favor seleccione un archivo con formato .csv', 'error');
        return;
      }
      readFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCSVContent(text, file.name);
      }
    };
    reader.onerror = () => {
      showNotification('Error al leer el archivo seleccionado', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const confirmImportCSV = () => {
    if (!csvPreview || !csvPreview.parsedTemp.length) return;
    setImportedData({
      temp: csvPreview.parsedTemp,
      hum: csvPreview.parsedHum,
      fileName: csvPreview.fileName,
      recordCount: csvPreview.parsedTemp.length,
      importedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setTimeRange('csv');
    setIsImportModalOpen(false);
    setCsvPreview(null);
    showNotification(`Historial CSV importado exitosamente (${csvPreview.parsedTemp.length} registros).`, 'success');
  };

  const downloadCSVTemplate = () => {
    const templateContent =
      '\uFEFFPeriodo,Temperatura_Real,Temperatura_Optima,Humedad_Real,Humedad_Optima\n' +
      '01 Sep,21.5,23.0,68,65\n' +
      '02 Sep,22.0,23.0,66,65\n' +
      '03 Sep,23.4,23.0,63,65\n' +
      '04 Sep,24.1,23.0,60,65\n' +
      '05 Sep,23.8,23.0,62,65\n' +
      '06 Sep,22.9,23.0,65,65\n' +
      '07 Sep,23.0,23.0,65,65\n';

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_telemetria_invernadero.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Plantilla CSV descargada.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 light:text-slate-900 overflow-hidden my-auto">
        
        {/* Header with Nave ID, Status & Close Button */}
        <div className="p-4 sm:p-6 border-b border-slate-800 light:border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 light:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-lg">
              {nave.id.replace('NAVE_', '#')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white light:text-slate-900">{nave.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  nave.status === 'REGANDO'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
                    : nave.status === 'ALARMA'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : nave.status === 'OFFLINE'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {nave.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{nave.sector}</span>
                <span>•</span>
                <span>DevEUI: <code className="font-mono text-[11px]">{nave.devEui}</code></span>
                <span>•</span>
                <span>{nave.lastCommunication}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Eliminar esta nave"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white light:hover:text-black rounded-xl hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
              title="Cerrar detalle"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner inside modal */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-950/40 light:bg-rose-50 border-b border-rose-500/30 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-rose-300 light:text-rose-800">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>¿Estás seguro de que deseas eliminar permanentemente <strong>{nave.name} ({nave.id})</strong>?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-lg bg-slate-800 light:bg-slate-200 text-xs text-slate-300 light:text-slate-800 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteNave}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Eliminar Nave</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Alarm Cause Diagnostic Banner (Displayed when nave has alarm status or active alert) */}
        {(nave.status === 'ALARMA' || activeNaveAlerts.length > 0) && (
          <div className="p-4 bg-rose-950/80 light:bg-rose-50 border-b border-rose-500/50 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-rose-300 light:text-rose-900 text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-400 animate-bounce" />
                <span>Alerta Técnica / Anomalía Activa en {nave.id}</span>
              </div>
              {activeNaveAlerts.length > 0 && (
                <div className="flex items-center gap-2">
                  {activeNaveAlerts[0].state === 'ACTIVA' && (
                    <button
                      type="button"
                      onClick={() => recognizeAlert(activeNaveAlerts[0].id)}
                      disabled={!canPerformIrrigation}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      Reconocer Alarma
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => resolveAlert(activeNaveAlerts[0].id)}
                    disabled={!canPerformIrrigation}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Resolver Alarma
                  </button>
                </div>
              )}
            </div>

            {/* Render clear diagnostic reason for each alert */}
            {activeNaveAlerts.length > 0 ? (
              activeNaveAlerts.map(alt => (
                <div key={alt.id} className="p-3.5 rounded-xl bg-slate-950 light:bg-white border border-rose-500/40 text-xs space-y-2 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 light:border-slate-200 pb-2">
                    <span className="font-bold text-rose-400 light:text-rose-700 text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      {alt.type}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Gatillada: {alt.timestamp.replace('T', ' ').substring(0, 19)}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-rose-300 light:text-rose-900 block text-[11px] uppercase tracking-wider mb-1">
                      ¿Por qué se activó esta alarma? (Diagnóstico Causa Raíz):
                    </span>
                    <p className="text-slate-100 light:text-slate-900 font-medium leading-relaxed bg-rose-950/40 light:bg-rose-100/60 p-2.5 rounded-lg border border-rose-500/20 text-xs">
                      {alt.causeReason || alt.description}
                    </p>
                  </div>

                  {alt.triggerCondition && (
                    <div className="text-[11px] font-mono text-slate-300 light:text-slate-700 bg-slate-900 light:bg-slate-100 p-2 rounded-lg border border-slate-800 light:border-slate-300">
                      <strong>Regla / Umbral Vulnerado:</strong> {alt.triggerCondition}
                    </div>
                  )}

                  {alt.sensorValueAtTrigger && (
                    <div className="text-[11px] font-mono text-cyan-300 light:text-cyan-800 bg-cyan-950/40 light:bg-cyan-50 p-2 rounded-lg border border-cyan-500/20 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>Telemetría durante el Disparo:</strong> {alt.sensorValueAtTrigger}</span>
                    </div>
                  )}

                  {alt.recommendedAction && (
                    <div className="text-[11px] text-emerald-300 light:text-emerald-900 bg-emerald-950/30 light:bg-emerald-50 p-2 rounded-lg border border-emerald-500/20 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-400 light:text-emerald-800">Acción Técnico-Agronómica Sugerida:</span>
                        <span className="ml-1 text-slate-200 light:text-slate-800">{alt.recommendedAction}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950 light:bg-white border border-rose-500/40 text-xs space-y-2 shadow-lg">
                <div className="font-bold text-rose-400 light:text-rose-700 text-sm flex items-center gap-2 border-b border-slate-800 light:border-slate-200 pb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  ¿Por qué se activó esta alarma? (Causa Raíz)
                </div>
                <p className="text-slate-100 light:text-slate-900 font-medium leading-relaxed bg-rose-950/40 light:bg-rose-100/60 p-2.5 rounded-lg border border-rose-500/20 text-xs">
                  {nave.flowRate === 0 && nave.valveStatus === 'ABIERTA'
                    ? 'Anomalía de flujo hidráulico: Electroválvula abierta por controlador pero el caudalímetro registra 0.0 L/min. Posible bomba de riego apagada o tubería obstruida.'
                    : nave.temperature > 32
                    ? `Estrés térmico: La temperatura interna registra ${nave.temperature}°C, superando el máximo de confort.`
                    : nave.soilMoisture1 < 28
                    ? `Déficit hídrico: La humedad de suelo en estrato 1 registra ${nave.soilMoisture1}%, por debajo del umbral de riego.`
                    : 'Anomalía reportada por la antena de sensores / controlador local ESP32.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 light:border-slate-200 bg-slate-900 light:bg-slate-100 px-4 sm:px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('sensores')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'sensores'
                ? 'border-emerald-500 text-emerald-400 light:text-emerald-700 bg-emerald-500/5'
                : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            SECCIÓN SENSORES
          </button>
          <button
            onClick={() => setActiveTab('riego')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'riego'
                ? 'border-blue-500 text-blue-400 light:text-blue-700 bg-blue-500/5'
                : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4" />
            SECCIÓN RIEGO
            {nave.status === 'REGANDO' && (
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping ml-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('automatizacion')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'automatizacion'
                ? 'border-purple-500 text-purple-400 light:text-purple-700 bg-purple-500/5'
                : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            SECCIÓN AUTOMATIZACIÓN
          </button>
          <button
            onClick={() => setActiveTab('dispositivo')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'dispositivo'
                ? 'border-amber-500 text-amber-400 light:text-amber-700 bg-amber-500/5'
                : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            CONTROL LOCAL ESP32
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: SENSORES */}
          {activeTab === 'sensores' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Temp */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <span>Temperatura (SHT31)</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.temperature.toFixed(1)} <span className="text-sm font-normal text-slate-400">°C</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">Rango óptimo (18° - 28°)</div>
                </div>

                {/* Humedad */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Droplets className="w-4 h-4 text-sky-400" />
                    <span>Humedad Ambiental</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.humidity} <span className="text-sm font-normal text-slate-400">%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Sensor SHT31/SHT35</div>
                </div>

                {/* Humedad Suelo 1 */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Humedad Suelo 1</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.soilMoisture1} <span className="text-sm font-normal text-slate-400">%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Profundidad: 15 cm</div>
                </div>

                {/* Humedad Suelo 2 */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Layers className="w-4 h-4 text-teal-400" />
                    <span>Humedad Suelo 2</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.soilMoisture2} <span className="text-sm font-normal text-slate-400">%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Profundidad: 30 cm</div>
                </div>

                {/* Temp Suelo */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Thermometer className="w-4 h-4 text-amber-400" />
                    <span>Temp Suelo (DS18B20)</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.soilTemperature.toFixed(1)} <span className="text-sm font-normal text-slate-400">°C</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Sonda OneWire</div>
                </div>

                {/* Caudal */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>Caudal de Riego</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.flowRate.toFixed(1)} <span className="text-sm font-normal text-slate-400">L/min</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Caudalímetro de pulsos</div>
                </div>

                {/* Presión */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Gauge className="w-4 h-4 text-indigo-400" />
                    <span>Presión de Agua</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.pressure.toFixed(2)} <span className="text-sm font-normal text-slate-400">bar</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Transductor 0-5V</div>
                </div>

                {/* LoRa Telemetry + Voltaje */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 light:text-slate-500 text-xs mb-1">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span>Radio LoRa / Voltaje</span>
                  </div>
                  <div className="text-lg font-black font-mono text-slate-100 light:text-slate-900">
                    {nave.rssi} <span className="text-xs font-normal text-slate-400">dBm</span> • {nave.voltage}V
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">SNR: {nave.snr} dB • Fuente 24VDC</div>
                </div>
              </div>

              {/* 2 Gráficos de Barras Separados con Filtros por Días, Meses, Años e Importar/Exportar CSV */}
              <div className="space-y-4">
                {/* Header de la sección de gráficos con Selector Temporal y Acciones CSV */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 light:text-slate-900 block">
                            Historial de Telemetría: Gráficos Comparativos (Tiempo Real vs Óptimo)
                          </span>
                          {timeRange === 'csv' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Datos de Archivo CSV
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 light:text-slate-500">
                          Analítica temporal por Días, Meses y Años con soporte de exportación e importación .CSV
                        </span>
                      </div>
                    </div>

                    {/* Acciones de Exportación e Importación CSV */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportCSV}
                        title="Descargar datos actuales en formato CSV para Excel o análisis externo"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Exportar .CSV</span>
                      </button>

                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        title="Subir archivo .CSV para visualizar en las gráficas"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>Importar .CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Barra de Filtros Temporales (Días, Meses, Años) y Leyenda */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 light:border-slate-200">
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/90 light:bg-slate-200 border border-slate-800/80 light:border-slate-300 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 light:text-slate-600 px-2 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Periodo:
                      </span>
                      <button
                        onClick={() => setTimeRange('dias')}
                        className={`px-3 py-1 rounded-md font-medium text-xs transition-all ${
                          timeRange === 'dias'
                            ? 'bg-emerald-600 text-white font-bold shadow'
                            : 'text-slate-400 light:text-slate-700 hover:text-slate-100 hover:bg-slate-800/50 light:hover:bg-slate-300/60'
                        }`}
                      >
                        Días (Últimos 8)
                      </button>
                      <button
                        onClick={() => setTimeRange('meses')}
                        className={`px-3 py-1 rounded-md font-medium text-xs transition-all ${
                          timeRange === 'meses'
                            ? 'bg-emerald-600 text-white font-bold shadow'
                            : 'text-slate-400 light:text-slate-700 hover:text-slate-100 hover:bg-slate-800/50 light:hover:bg-slate-300/60'
                        }`}
                      >
                        Meses (2026)
                      </button>
                      <button
                        onClick={() => setTimeRange('anos')}
                        className={`px-3 py-1 rounded-md font-medium text-xs transition-all ${
                          timeRange === 'anos'
                            ? 'bg-emerald-600 text-white font-bold shadow'
                            : 'text-slate-400 light:text-slate-700 hover:text-slate-100 hover:bg-slate-800/50 light:hover:bg-slate-300/60'
                        }`}
                      >
                        Años (2023-2026)
                      </button>

                      {importedData && (
                        <div className="flex items-center gap-1 pl-1 ml-1 border-l border-slate-700/80">
                          <button
                            onClick={() => setTimeRange('csv')}
                            className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 ${
                              timeRange === 'csv'
                                ? 'bg-amber-600 text-white font-bold shadow'
                                : 'text-amber-400 hover:bg-amber-500/10'
                            }`}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>CSV ({importedData.recordCount})</span>
                          </button>
                          <button
                            onClick={() => {
                              setImportedData(null);
                              setTimeRange('dias');
                              showNotification('Datos CSV removidos. Mostrando telemetría estándar.', 'info');
                            }}
                            title="Quitar datos importados"
                            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Leyenda de las barras */}
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="flex items-center gap-1.5 text-slate-300 light:text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                        <span>Meta Óptima</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300 light:text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                        <span>Temp. Real</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300 light:text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
                        <span>Hum. Real</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid con los 2 gráficos por separado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  {/* GRÁFICO 1: TEMPERATURA EN BARRAS */}
                  <div className="p-4 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 light:border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                          <Thermometer className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 light:text-slate-900 flex items-center gap-1.5">
                            Gráfico 1: Temperatura (°C)
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 uppercase font-mono">
                              {timeRange}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-400 light:text-slate-500">
                            Barras comparativas: Real vs Agronómico Óptimo
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          Real: {nave.temperature.toFixed(1)}°C
                        </span>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          Meta: {optimalTemp}°C ({tempDiff >= 0 ? `+${tempDiff}` : tempDiff}°C)
                        </div>
                      </div>
                    </div>

                    {/* BarChart de Temperatura */}
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeTemperaturaChartData} margin={{ top: 12, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                          <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[10, 36]} unit="°" />
                          <Tooltip content={<CustomBarTooltip unit="°C" />} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                          <ReferenceLine
                            y={optimalTemp}
                            stroke="#10b981"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: `Meta ${optimalTemp}°C`, fill: '#10b981', fontSize: 10, position: 'insideTopRight' }}
                          />
                          <Bar dataKey="tiempoReal" name="Temperatura Real (°C)" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          <Bar dataKey="optimo" name="Meta Óptima (°C)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 light:bg-white border border-slate-800/80 light:border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 light:text-slate-600">Rango Agronómico de Confort Térmico:</span>
                      <span className="font-mono font-bold text-emerald-400 light:text-emerald-700">18.0°C – 26.0°C</span>
                    </div>
                  </div>

                  {/* GRÁFICO 2: HUMEDAD EN BARRAS */}
                  <div className="p-4 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 light:border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 light:text-slate-900 flex items-center gap-1.5">
                            Gráfico 2: Humedad (%)
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 uppercase font-mono">
                              {timeRange}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-400 light:text-slate-500">
                            Barras comparativas: Real vs Agronómico Óptimo
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          Real: {nave.humidity}%
                        </span>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          Meta: {optimalHum}% ({humDiff >= 0 ? `+${humDiff}` : humDiff}%)
                        </div>
                      </div>
                    </div>

                    {/* BarChart de Humedad */}
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeHumedadChartData} margin={{ top: 12, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                          <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[20, 100]} unit="%" />
                          <Tooltip content={<CustomBarTooltip unit="%" />} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                          <ReferenceLine
                            y={optimalHum}
                            stroke="#10b981"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: `Meta ${optimalHum}%`, fill: '#10b981', fontSize: 10, position: 'insideTopRight' }}
                          />
                          <Bar dataKey="tiempoReal" name="Humedad Real (%)" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          <Bar dataKey="optimo" name="Meta Óptima (%)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 light:bg-white border border-slate-800/80 light:border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 light:text-slate-600">Rango Humedad Relativa Óptima:</span>
                      <span className="font-mono font-bold text-emerald-400 light:text-emerald-700">60% – 75% HR</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIEGO */}
          {activeTab === 'riego' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Irrigation Status & Countdown Panel */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 light:from-blue-50 light:to-white border border-blue-900/50 light:border-blue-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 light:text-slate-500 tracking-wider">
                      Estado de Electroválvula 24VDC
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-2xl font-black font-mono ${
                        nave.valveStatus === 'ABIERTA' ? 'text-blue-400' : 'text-slate-400'
                      }`}>
                        VÁLVULA {nave.valveStatus}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        MODO {nave.controlMode}
                      </span>
                    </div>
                  </div>

                  {/* Active Timer Box if irrigating */}
                  {nave.status === 'REGANDO' && (
                    <div className="px-5 py-3 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center gap-3">
                      <Clock className="w-6 h-6 text-blue-400 animate-spin" />
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                          RIEGO ACTIVO
                        </div>
                        <div className="text-2xl font-black font-mono text-white">
                          {formatTimer(nave.activeIrrigation?.remainingSeconds)} restantes
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Water delivery metrics during irrigation */}
                {nave.status === 'REGANDO' && nave.activeIrrigation && (
                  <div className="mt-4 pt-4 border-t border-slate-800 light:border-slate-200 grid grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 light:text-slate-500 text-[10px]">CAUDAL ACTUAL</span>
                      <div className="text-base font-bold text-slate-100 light:text-slate-900">{nave.flowRate} L/min</div>
                    </div>
                    <div>
                      <span className="text-slate-400 light:text-slate-500 text-[10px]">VOLUMEN ACUMULADO</span>
                      <div className="text-base font-bold text-slate-100 light:text-slate-900">{nave.activeIrrigation.accumulatedLiters} L</div>
                    </div>
                    <div>
                      <span className="text-slate-400 light:text-slate-500 text-[10px]">INICIADO POR</span>
                      <div className="text-xs font-bold text-blue-400 truncate">{nave.activeIrrigation.initiatedBy}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons as explicitly mandated */}
              <div className="p-4 rounded-xl bg-slate-950/40 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-200 light:text-slate-800">
                  Control Manual de Válvula
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => requestManualIrrigation(nave)}
                    disabled={nave.status === 'REGANDO' || nave.status === 'OFFLINE' || !canPerformIrrigation}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    [ ABRIR VÁLVULA ]
                  </button>

                  <button
                    onClick={() => stopIrrigation(nave.id)}
                    disabled={nave.status !== 'REGANDO' || !canPerformIrrigation}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    [ CERRAR VÁLVULA ]
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 light:text-slate-500">
                  * Toda orden manual exige confirmación explícita con límite máximo y verificación de caudal en terreno.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMATIZACIÓN */}
          {activeTab === 'automatizacion' && (
            <form onSubmit={handleSaveAutomation} className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Regla de Decisión Autónoma (Lógica Local ESP32):
                </div>
                <div className="font-mono text-slate-300 light:text-slate-700 bg-slate-950/80 light:bg-white p-3 rounded-lg border border-slate-800 light:border-slate-300 text-[11px] space-y-1">
                  <p className="text-emerald-400">SI humedad del suelo &lt; {rule.minSoilMoisture} %</p>
                  <p className="text-slate-400">Y horario permitido (06:00 - 10:00 / 18:00 - 22:00)</p>
                  <p className="text-slate-400">Y presión de agua &gt;= {rule.minPressureBar} bar</p>
                  <p className="text-blue-400">ENTONCES: Abrir válvula e iniciar riego.</p>
                  <p className="text-amber-400">Verificar caudal a los {rule.minFlowDetectionSec}s: si no hay flujo -&gt; ALARMA y corte.</p>
                  <p className="text-emerald-400">Cerrar válvula al alcanzar humedad objetivo ({rule.targetSoilMoisture}%) o tiempo máximo ({rule.maxIrrigationMinutes} min).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Humedad mínima del suelo (Disparo):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={rule.minSoilMoisture}
                      onChange={e => setRule({ ...rule, minSoilMoisture: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg px-3 py-2 text-slate-100 light:text-slate-900 font-mono"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Humedad objetivo (Corte):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="30"
                      max="90"
                      value={rule.targetSoilMoisture}
                      onChange={e => setRule({ ...rule, targetSoilMoisture: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg px-3 py-2 text-slate-100 light:text-slate-900 font-mono"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Tiempo máximo de riego (Fail-Safe):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={rule.maxIrrigationMinutes}
                      onChange={e => setRule({ ...rule, maxIrrigationMinutes: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg px-3 py-2 text-slate-100 light:text-slate-900 font-mono"
                    />
                    <span className="text-slate-400 font-bold">min</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Horario Permitido de Riego:
                  </label>
                  <input
                    type="text"
                    disabled
                    value="06:00 - 10:00 | 18:00 - 22:00"
                    className="w-full bg-slate-950/40 light:bg-slate-100 border border-slate-800 light:border-slate-200 rounded-lg px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 light:border-slate-200">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Sincronizado en memoria NVS / Flash de {nave.id}
                </div>
                <button
                  type="submit"
                  disabled={isSavingRule || !canConfigureDevices}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSavingRule ? 'animate-spin' : ''}`} />
                  {isSavingRule ? 'Guardando en ESP32...' : 'Guardar y Sincronizar Reglas'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: CONTROL LOCAL ESP32 */}
          {activeTab === 'dispositivo' && (
            <div className="space-y-5 text-xs animate-fadeIn">
              {/* Active Role Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 light:from-slate-100 light:to-white border border-slate-800 light:border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl border ${
                      nave.esp32Config?.role === 'SENSOR_ANTENNA'
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        : nave.esp32Config?.role === 'CONTROL_PANEL'
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                        : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Rol Actual del Microcontrolador
                      </div>
                      <div className="text-base font-black text-white light:text-slate-900 flex items-center gap-2">
                        {nave.esp32Config?.role === 'SENSOR_ANTENNA' && '📡 Antena de Sensor (Nodo Telemetría)'}
                        {nave.esp32Config?.role === 'CONTROL_PANEL' && '🎛️ Panel de Mando (Actuador Local)'}
                        {(!nave.esp32Config?.role || nave.esp32Config?.role === 'HYBRID') && '⚡ Modo Integral (Sensor + Panel de Mando)'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        ID: <strong className="font-mono text-emerald-400">ESP32_{nave.id}</strong> • Enlace: <strong className="font-mono">{nave.esp32Config?.connectionType || 'LORAWAN'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions to open modal */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEsp32ModalTarget({ targetMode: 'SINGLE', nave })}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-all"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configurar Rol ESP32</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEsp32ModalTarget({ targetMode: 'ALL', nave })}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
                      title="Aplicar configuración a todas las naves del campo"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Aplicar a Todas las Naves</span>
                    </button>
                  </div>
                </div>

                {/* Quick Role Switcher Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 light:border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    Cambiar Rol Rápido en esta Nave:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickRoleChange('SENSOR_ANTENNA')}
                      disabled={!canConfigureDevices}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        nave.esp32Config?.role === 'SENSOR_ANTENNA'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-amber-400" />
                        <span>Antena de Sensor</span>
                      </div>
                      {nave.esp32Config?.role === 'SENSOR_ANTENNA' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickRoleChange('CONTROL_PANEL')}
                      disabled={!canConfigureDevices}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        nave.esp32Config?.role === 'CONTROL_PANEL'
                          ? 'bg-blue-600/15 border-blue-500 text-blue-300 font-bold'
                          : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-blue-400" />
                        <span>Panel de Mando</span>
                      </div>
                      {nave.esp32Config?.role === 'CONTROL_PANEL' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickRoleChange('HYBRID')}
                      disabled={!canConfigureDevices}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        nave.esp32Config?.role === 'HYBRID' || !nave.esp32Config?.role
                          ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span>Modo Híbrido</span>
                      </div>
                      {(nave.esp32Config?.role === 'HYBRID' || !nave.esp32Config?.role) && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Hardware Diagnostic & Live Ping */}
              <div className="p-4 rounded-xl bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 light:text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Diagnóstico de Enlace Hardware ESP32:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestEsp32}
                    disabled={isTestingEsp32}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 text-emerald-400 ${isTestingEsp32 ? 'animate-spin' : ''}`} />
                    <span>{isTestingEsp32 ? 'Verificando...' : 'Test de Enlace'}</span>
                  </button>
                </div>

                {esp32Diag && (
                  <div className={`p-3 rounded-lg border font-mono text-[11px] animate-fadeIn ${
                    esp32Diag.connected ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-rose-950/30 border-rose-800 text-rose-300'
                  }`}>
                    <div className="font-bold">{esp32Diag.message}</div>
                    <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                      <div>Ping: {esp32Diag.pingMs}ms</div>
                      <div>RSSI: {esp32Diag.signalRssi} dBm</div>
                      <div>Heap: {Math.round((esp32Diag.heapFreeBytes || 200000) / 1024)} KB</div>
                      <div>Voltaje: {esp32Diag.voltage}V</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
                    <span className="text-slate-500 block">FIRMWARE</span>
                    <span className="text-emerald-400 font-bold">{nave.firmwareVersion}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
                    <span className="text-slate-500 block">RELÉ ELECTROLVÁLVULA</span>
                    <span className="text-slate-200 light:text-slate-800 font-bold">GPIO {nave.esp32Config?.relayPin || 25} (24VDC)</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
                    <span className="text-slate-500 block">PULSADORES NAVE</span>
                    <span className="text-emerald-400 font-bold">
                      {nave.esp32Config?.hasPhysicalKeypad ? 'HABILITADOS' : 'INACTIVOS'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200">
                    <span className="text-slate-500 block">CAUDALÍMETRO</span>
                    <span className="text-slate-200 light:text-slate-800 font-bold">GPIO {nave.esp32Config?.flowSensorPin || 14}</span>
                  </div>
                </div>
              </div>

              {/* Local-First Architecture Info */}
              <div className="p-4 rounded-xl bg-slate-950/40 light:bg-slate-100 border border-slate-800 light:border-slate-200 space-y-2">
                <div className="font-bold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  Arquitectura Local-First de Terreno:
                </div>
                <p className="text-slate-400 light:text-slate-600 leading-relaxed text-[11px]">
                  El microcontrolador ESP32 de cada nave almacena en su memoria flash no volátil (NVS) las reglas de automatización y su rol asignado.
                  Si se pierde la señal LoRa o conexión de servidor, el nodo sigue garantizando la protección de los cultivos y el cumplimiento de límites de riego seguro.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 light:border-slate-200 bg-slate-950/80 light:bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-400 light:text-slate-500 text-[11px]">
            VEGALINK Core IoT • Dispositivo ID: <strong>ESP32_{nave.id}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-200 light:text-slate-800 font-semibold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* MODAL PARA IMPORTAR CSV DE HISTORIAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100 light:text-slate-900">
            {/* Header del Modal de Importación */}
            <div className="p-4 border-b border-slate-800 light:border-slate-200 flex items-center justify-between bg-slate-950/60 light:bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">
                    Importar Historial de Telemetría (.CSV)
                  </h3>
                  <p className="text-[11px] text-slate-400 light:text-slate-500">
                    Cargue registros de temperatura y humedad para comparativa agronómica
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvPreview(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 light:hover:bg-slate-200 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Zona Drag & Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 light:border-slate-300 hover:border-slate-500 bg-slate-950/40 light:bg-slate-50'
                }`}
                onClick={() => {
                  const input = document.getElementById('csv-file-input') as HTMLInputElement;
                  if (input) input.click();
                }}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
                  <FileUp className="w-6 h-6" />
                </div>
                <div className="font-medium text-xs text-slate-200 light:text-slate-800 mb-1">
                  Arrastra tu archivo <span className="font-mono text-blue-400 font-bold">.CSV</span> aquí o haz clic para explorar
                </div>
                <div className="text-[11px] text-slate-400 light:text-slate-500">
                  Compatible con delimitadores por coma (,) o punto y coma (;)
                </div>
              </div>

              {/* Botón de Plantilla CSV */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 light:text-slate-700">
                    ¿No tienes un archivo preparado?
                  </span>
                </div>
                <button
                  onClick={downloadCSVTemplate}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 light:bg-white hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla CSV</span>
                </button>
              </div>

              {/* Vista previa del CSV si se procesó */}
              {csvPreview && (
                <div className="space-y-3 pt-2">
                  {csvPreview.error ? (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Error al procesar el archivo:</span>
                        <span>{csvPreview.error}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 light:text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Vista Previa ({csvPreview.rawRows.length} registros válidos detectados)
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]">
                          {csvPreview.fileName}
                        </span>
                      </div>

                      {/* Mini tabla con los primeros registros */}
                      <div className="overflow-x-auto rounded-lg border border-slate-800 light:border-slate-300 text-[11px] font-mono">
                        <table className="w-full text-left">
                          <thead className="bg-slate-950/80 light:bg-slate-200 text-slate-400 light:text-slate-700">
                            <tr>
                              <th className="p-2">Periodo</th>
                              <th className="p-2 text-rose-400">Temp. Real</th>
                              <th className="p-2 text-emerald-400">Temp. Óptima</th>
                              <th className="p-2 text-sky-400">Hum. Real</th>
                              <th className="p-2 text-emerald-400">Hum. Óptima</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 light:divide-slate-200 bg-slate-900/60 light:bg-white">
                            {csvPreview.rawRows.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40">
                                <td className="p-2 font-medium text-slate-200 light:text-slate-800">{row.time}</td>
                                <td className="p-2 text-rose-300">{row.tempReal}°C</td>
                                <td className="p-2 text-emerald-400">{row.tempOpt}°C</td>
                                <td className="p-2 text-sky-300">{row.humReal}%</td>
                                <td className="p-2 text-emerald-400">{row.humOpt}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvPreview.rawRows.length > 5 && (
                        <p className="text-[10px] text-slate-400 text-center italic">
                          Mostrando 5 de {csvPreview.rawRows.length} filas importadas. Todas serán cargadas al gráfico.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-3.5 border-t border-slate-800 light:border-slate-200 bg-slate-950/80 light:bg-slate-50 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvPreview(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-300 light:text-slate-700 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImportCSV}
                disabled={!csvPreview || !csvPreview.parsedTemp.length || Boolean(csvPreview.error)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Cargar al Historial y Gráficos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
