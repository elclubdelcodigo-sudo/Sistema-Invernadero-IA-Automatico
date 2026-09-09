import { Nave, Alert, IrrigationEvent, AuditLogEntry, DashboardMetrics, DeviceCommand, AIAnalysisResponse, Esp32Config, Esp32Role, HardwareModule } from '../types';

export const api = {
  async addHardwareModule(naveId: string, moduleData: Partial<HardwareModule>, user?: string): Promise<{ success: boolean; module: HardwareModule; message: string }> {
    const res = await fetch(`/api/naves/${naveId}/hardware-modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...moduleData, user })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al agregar módulo de hardware');
    }
    return res.json();
  },

  async removeHardwareModule(naveId: string, moduleId: string, user?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/naves/${naveId}/hardware-modules/${moduleId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al desvincular módulo de hardware');
    }
    return res.json();
  },

  async provisionDevice(deviceData: {
    type: 'SENSOR_ANTENNA' | 'CONTROL_PANEL' | 'HYBRID';
    name: string;
    sector: string;
    naveId?: string;
    devEui?: string;
    user?: string;
  }): Promise<{ success: boolean; device: any; message: string }> {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al aprovisionar dispositivo');
    }
    return res.json();
  },
  async getDashboard(): Promise<{
    metrics: DashboardMetrics;
    recentAlerts: Alert[];
    activeIrrigations: Nave[];
    trends24h: any[];
  }> {
    const res = await fetch('/api/dashboard');
    if (!res.ok) throw new Error('Error al cargar dashboard');
    return res.json();
  },

  async getNaves(params?: { sector?: string; status?: string; search?: string }): Promise<{ total: number; naves: Nave[] }> {
    const query = new URLSearchParams();
    if (params?.sector) query.set('sector', params.sector);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    
    const res = await fetch(`/api/naves?${query.toString()}`);
    if (!res.ok) throw new Error('Error al cargar naves');
    return res.json();
  },

  async configureEsp32(id: string, config: Partial<Esp32Config>, user?: string): Promise<{ success: boolean; esp32Config: Esp32Config; message: string }> {
    const res = await fetch(`/api/naves/${id}/esp32`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, user })
    });
    if (!res.ok) throw new Error(`Error al configurar ESP32 de ${id}`);
    return res.json();
  },

  async configureEsp32Bulk(params: {
    role: Esp32Role;
    target?: 'ALL' | 'SELECTED';
    ids?: string[];
    config?: Partial<Esp32Config>;
    user?: string;
  }): Promise<{ success: boolean; message: string; updatedCount: number; role: Esp32Role }> {
    const res = await fetch('/api/naves/esp32/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Error al configurar ESP32 masivamente');
    return res.json();
  },

  async testEsp32Connection(id: string): Promise<{
    success: boolean;
    deviceId: string;
    connected: boolean;
    pingMs: number;
    signalRssi: number;
    snr?: number;
    heapFreeBytes: number;
    voltage: number;
    uptimeSeconds?: number;
    firmwareVersion?: string;
    currentRole?: Esp32Role;
    message: string;
  }> {
    const res = await fetch(`/api/naves/${id}/esp32/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async getNaveDetail(id: string): Promise<{ nave: Nave; alerts: Alert[]; recentIrrigations: IrrigationEvent[] }> {
    const res = await fetch(`/api/naves/${id}`);
    if (!res.ok) throw new Error(`Error al obtener nave ${id}`);
    return res.json();
  },

  async deleteNave(id: string, user?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/naves/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    if (!res.ok) throw new Error(`Error al eliminar nave ${id}`);
    return res.json();
  },

  async deleteMultipleNaves(ids: string[], user?: string): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const res = await fetch('/api/naves', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, user })
    });
    if (!res.ok) throw new Error('Error al eliminar naves seleccionadas');
    return res.json();
  },

  async deleteAllNaves(user?: string): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const res = await fetch('/api/naves', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true, user })
    });
    if (!res.ok) throw new Error('Error al eliminar todas las naves');
    return res.json();
  },

  async resetDefaultNaves(user?: string): Promise<{ success: boolean; message: string; total: number; naves: Nave[] }> {
    const res = await fetch('/api/naves/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    if (!res.ok) throw new Error('Error al restablecer naves por defecto');
    return res.json();
  },

  async controlIrrigation(greenhouseId: string, action: 'start' | 'stop', durationMinutes?: number, user?: string, ids?: string[]): Promise<{ success: boolean; message: string; count?: number }> {
    const res = await fetch('/api/irrigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ greenhouseId, ids, action, durationMinutes, user })
    });
    return res.json();
  },

  async updateNaveAutomation(id: string, ruleData: any, user?: string): Promise<{ success: boolean; automationRule: any }> {
    const res = await fetch(`/api/naves/${id}/automation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ruleData, user })
    });
    return res.json();
  },

  async sendDeviceCommand(deviceId: string, command: string, payload: any, user?: string): Promise<{ success: boolean; command: DeviceCommand }> {
    const res = await fetch(`/api/devices/${deviceId}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, payload, user })
    });
    return res.json();
  },

  async getAlerts(params?: { state?: string; severity?: string }): Promise<{ alerts: Alert[] }> {
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    if (params?.severity) query.set('severity', params.severity);
    const res = await fetch(`/api/alerts?${query.toString()}`);
    return res.json();
  },

  async updateAlert(alertId: string, action: 'recognize' | 'resolve', user?: string): Promise<{ success: boolean; alert: Alert }> {
    const res = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, user })
    });
    return res.json();
  },

  async getIrrigationHistory(): Promise<{ total: number; events: IrrigationEvent[] }> {
    const res = await fetch('/api/irrigation/history');
    return res.json();
  },

  async getAuditLogs(): Promise<{ total: number; logs: AuditLogEntry[] }> {
    const res = await fetch('/api/audit-logs');
    return res.json();
  },

  async getHistoricos(naveId?: string, range: string = '24h'): Promise<{ naveId: string; points: any[] }> {
    const res = await fetch(`/api/historicos?naveId=${naveId || ''}&range=${range}`);
    return res.json();
  },

  async analyzeWithAI(prompt: string, targetNaveId?: string): Promise<AIAnalysisResponse> {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, targetNaveId })
    });
    return res.json();
  },

  async triggerSimulationTick(): Promise<{ success: boolean }> {
    const res = await fetch('/api/simulate/tick', { method: 'POST' });
    return res.json();
  }
};
