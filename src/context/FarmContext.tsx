import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Nave, Alert, DashboardMetrics, IrrigationEvent } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

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
  irrigationModalTarget: Nave | null;
  setIrrigationModalTarget: (nave: Nave | null) => void;

  // Alerts
  recognizeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;

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
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      irrigationModalTarget,
      setIrrigationModalTarget,
      recognizeAlert,
      resolveAlert,
      searchTerm,
      setSearchTerm,
      statusFilter,
      setStatusFilter,
      sectorFilter,
      setSectorFilter,
      notification,
      showNotification
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
