import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Nave, Alert, DashboardMetrics, IrrigationEvent, Esp32Config, Esp32Role, HardwareModule } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface Esp32ModalTarget {
  targetMode: 'SINGLE' | 'ALL' | 'SELECTED';
  nave?: Nave;
  ids?: string[];
}

interface FarmContextType {
  naves: Nave[];
  metrics: DashboardMetrics | null;
  alerts: Alert[];
  irrigationHistory: IrrigationEvent[];
  activeIrrigations: Nave[];
  selectedNaveId: string | null;
  selectedNave: Nave | null;
  setSelectedNaveId: (id: string | null) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  
  // Safe Irrigation Actions
  requestManualIrrigation: (nave: Nave) => void;
  confirmManualIrrigation: (naveId: string, durationMinutes: number) => Promise<boolean>;
  stopIrrigation: (naveId: string) => Promise<boolean>;
  startAllIrrigations: (durationMinutes?: number, targetIds?: string[]) => Promise<boolean>;
  stopAllIrrigations: (targetIds?: string[]) => Promise<boolean>;
  irrigationModalTarget: Nave | null;
  setIrrigationModalTarget: (nave: Nave | null) => void;

  // ESP32 Microcontroller Configuration Modal & Actions
  esp32ModalTarget: Esp32ModalTarget | null;
  setEsp32ModalTarget: (target: Esp32ModalTarget | null) => void;
  configureEsp32: (naveId: string, config: Partial<Esp32Config>) => Promise<boolean>;
  configureEsp32Bulk: (params: { role: Esp32Role; target?: 'ALL' | 'SELECTED'; ids?: string[]; config?: Partial<Esp32Config> }) => Promise<boolean>;
  testEsp32Connection: (naveId: string) => Promise<any>;

  // Alerts
  recognizeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;

  // Nave Management & Deletion
  deleteNave: (naveId: string) => Promise<boolean>;
  deleteMultipleNaves: (naveIds: string[]) => Promise<boolean>;
  deleteAllNaves: () => Promise<boolean>;
  resetDefaultNaves: () => Promise<boolean>;

  // Hardware Modules & Devices Provisioning
  addHardwareModule: (naveId: string, moduleData: Partial<HardwareModule>) => Promise<boolean>;
  removeHardwareModule: (naveId: string, moduleId: string) => Promise<boolean>;
  provisionDevice: (data: {
    type: 'SENSOR_ANTENNA' | 'CONTROL_PANEL' | 'HYBRID';
    name: string;
    sector: string;
    naveId?: string;
    devEui?: string;
  }) => Promise<boolean>;

  // Filter & Search
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  sectorFilter: string;
  setSectorFilter: (s: string) => void;

  // Feedback Notification
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Production Mode
  isProductionMode: boolean;
  setIsProductionMode: (isProd: boolean) => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [naves, setNaves] = useState<Nave[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [irrigationHistory, setIrrigationHistory] = useState<IrrigationEvent[]>([]);
  const [selectedNaveId, setSelectedNaveId] = useState<string | null>(null);
  const [irrigationModalTarget, setIrrigationModalTarget] = useState<Nave | null>(null);
  const [esp32ModalTarget, setEsp32ModalTarget] = useState<Esp32ModalTarget | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProductionMode, setIsProductionMode] = useState<boolean>(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('TODAS');
  const [sectorFilter, setSectorFilter] = useState<string>('TODOS');

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const refreshData = useCallback(async () => {
    try {
      const [dashData, navesData, alertsData, irrData] = await Promise.all([
        api.getDashboard(),
        api.getNaves(),
        api.getAlerts(),
        api.getIrrigationHistory()
      ]);

      setMetrics(dashData?.metrics || null);
      setNaves(Array.isArray(navesData?.naves) ? navesData.naves : []);
      setAlerts(Array.isArray(alertsData?.alerts) ? alertsData.alerts : []);
      setIrrigationHistory(Array.isArray(irrData?.events) ? irrData.events : []);
    } catch (err) {
      console.error('Error fetching farm telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Poll telemetry every 4 seconds to reflect live IoT changes and irrigation timer
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const selectedNave = (naves || []).find(n => n.id === selectedNaveId) || null;
  const activeIrrigations = (naves || []).filter(n => n.status === 'REGANDO');

  const requestManualIrrigation = (nave: Nave) => {
    setIrrigationModalTarget(nave);
  };

  const confirmManualIrrigation = async (naveId: string, durationMinutes: number): Promise<boolean> => {
    try {
      const res = await api.controlIrrigation(naveId, 'start', durationMinutes, currentUser.name);
      if (res.success) {
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      } else {
        showNotification(res.message, 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al conectar con la válvula', 'error');
      return false;
    }
  };

  const stopIrrigation = async (naveId: string): Promise<boolean> => {
    try {
      const res = await api.controlIrrigation(naveId, 'stop', 0, currentUser.name);
      if (res.success) {
        showNotification(res.message, 'info');
        await refreshData();
        return true;
      } else {
        showNotification(res.message, 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al detener válvula', 'error');
      return false;
    }
  };

  const startAllIrrigations = async (durationMinutes: number = 20, targetIds?: string[]): Promise<boolean> => {
    try {
      const isSelective = Array.isArray(targetIds) && targetIds.length > 0;
      const res = await api.controlIrrigation(
        isSelective ? 'BULK' : 'ALL',
        'start',
        durationMinutes,
        currentUser.name,
        targetIds
      );
      if (res.success) {
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al iniciar riego masivo', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al conectar con las válvulas', 'error');
      return false;
    }
  };

  const stopAllIrrigations = async (targetIds?: string[]): Promise<boolean> => {
    try {
      const isSelective = Array.isArray(targetIds) && targetIds.length > 0;
      const res = await api.controlIrrigation(
        isSelective ? 'BULK' : 'ALL',
        'stop',
        0,
        currentUser.name,
        targetIds
      );
      if (res.success) {
        showNotification(res.message, 'info');
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al detener riego masivo', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al detener válvulas', 'error');
      return false;
    }
  };

  const recognizeAlert = async (alertId: string) => {
    try {
      await api.updateAlert(alertId, 'recognize', currentUser.name);
      showNotification('Alerta reconocida.', 'info');
      await refreshData();
    } catch (err) {
      showNotification('Error al actualizar alerta', 'error');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await api.updateAlert(alertId, 'resolve', currentUser.name);
      showNotification('Alerta resuelta con éxito.', 'success');
      await refreshData();
    } catch (err) {
      showNotification('Error al resolver alerta', 'error');
    }
  };

  const deleteNave = async (naveId: string): Promise<boolean> => {
    try {
      const res = await api.deleteNave(naveId, currentUser.name);
      if (res.success) {
        showNotification(res.message, 'success');
        if (selectedNaveId === naveId) setSelectedNaveId(null);
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al eliminar nave', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar nave', 'error');
      return false;
    }
  };

  const deleteMultipleNaves = async (naveIds: string[]): Promise<boolean> => {
    try {
      const res = await api.deleteMultipleNaves(naveIds, currentUser.name);
      if (res.success) {
        showNotification(res.message, 'success');
        if (selectedNaveId && naveIds.includes(selectedNaveId)) setSelectedNaveId(null);
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al eliminar naves', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar naves', 'error');
      return false;
    }
  };

  const deleteAllNaves = async (): Promise<boolean> => {
    try {
      const res = await api.deleteAllNaves(currentUser.name);
      if (res.success) {
        showNotification(res.message, 'success');
        setSelectedNaveId(null);
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al eliminar todas las naves', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar todas las naves', 'error');
      return false;
    }
  };

  const resetDefaultNaves = async (): Promise<boolean> => {
    try {
      const res = await api.resetDefaultNaves(currentUser.name);
      if (res.success) {
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al restablecer naves', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al restablecer naves', 'error');
      return false;
    }
  };

  const configureEsp32 = async (naveId: string, config: Partial<Esp32Config>): Promise<boolean> => {
    try {
      const res = await api.configureEsp32(naveId, config, currentUser.name);
      if (res.success) {
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      } else {
        showNotification('Error al configurar ESP32', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al configurar ESP32', 'error');
      return false;
    }
  };

  const configureEsp32Bulk = async (params: {
    role: Esp32Role;
    target?: 'ALL' | 'SELECTED';
    ids?: string[];
    config?: Partial<Esp32Config>;
  }): Promise<boolean> => {
    try {
      const res = await api.configureEsp32Bulk({
        ...params,
        user: currentUser.name
      });
      if (res.success) {
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      } else {
        showNotification('Error al aplicar configuración masiva', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al aplicar configuración masiva', 'error');
      return false;
    }
  };

  const testEsp32Connection = async (naveId: string) => {
    try {
      const diag = await api.testEsp32Connection(naveId);
      return diag;
    } catch (err: any) {
      return {
        success: false,
        deviceId: `ESP32_${naveId}`,
        connected: false,
        pingMs: 0,
        signalRssi: -120,
        heapFreeBytes: 0,
        voltage: 0,
        message: 'Fallo al comunicarse con el microcontrolador.'
      };
    }
  };

  const addHardwareModule = async (naveId: string, moduleData: Partial<HardwareModule>): Promise<boolean> => {
    try {
      const res = await api.addHardwareModule(naveId, moduleData, currentUser.name);
      if (res.success) {
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al agregar módulo', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al agregar módulo de hardware', 'error');
      return false;
    }
  };

  const removeHardwareModule = async (naveId: string, moduleId: string): Promise<boolean> => {
    try {
      const res = await api.removeHardwareModule(naveId, moduleId, currentUser.name);
      if (res.success) {
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al desvincular módulo', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al desvincular módulo de hardware', 'error');
      return false;
    }
  };

  const provisionDevice = async (data: {
    type: 'SENSOR_ANTENNA' | 'CONTROL_PANEL' | 'HYBRID';
    name: string;
    sector: string;
    naveId?: string;
    devEui?: string;
  }): Promise<boolean> => {
    try {
      const res = await api.provisionDevice({ ...data, user: currentUser.name });
      if (res.success) {
        showNotification(res.message, 'success');
        await refreshData();
        return true;
      } else {
        showNotification(res.message || 'Error al aprovisionar dispositivo', 'error');
        return false;
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al aprovisionar dispositivo', 'error');
      return false;
    }
  };

  return (
    <FarmContext.Provider value={{
      naves,
      metrics,
      alerts,
      irrigationHistory,
      activeIrrigations,
      selectedNaveId,
      selectedNave,
      setSelectedNaveId,
      isLoading,
      refreshData,
      requestManualIrrigation,
      confirmManualIrrigation,
      stopIrrigation,
      startAllIrrigations,
      stopAllIrrigations,
      irrigationModalTarget,
      setIrrigationModalTarget,
      esp32ModalTarget,
      setEsp32ModalTarget,
      configureEsp32,
      configureEsp32Bulk,
      testEsp32Connection,
      addHardwareModule,
      removeHardwareModule,
      provisionDevice,
      recognizeAlert,
      resolveAlert,
      deleteNave,
      deleteMultipleNaves,
      deleteAllNaves,
      resetDefaultNaves,
      searchTerm,
      setSearchTerm,
      statusFilter,
      setStatusFilter,
      sectorFilter,
      setSectorFilter,
      notification,
      showNotification,
      isProductionMode,
      setIsProductionMode
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) throw new Error('useFarm must be used within FarmProvider');
  return context;
};
