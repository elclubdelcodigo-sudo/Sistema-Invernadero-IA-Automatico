import { Nave, Alert, IrrigationEvent, AuditLogEntry, DashboardMetrics, DeviceCommand, AIAnalysisResponse } from '../types';

export const api = {
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

  async getNaveDetail(id: string): Promise<{ nave: Nave; alerts: Alert[]; recentIrrigations: IrrigationEvent[] }> {
    const res = await fetch(`/api/naves/${id}`);
    if (!res.ok) throw new Error(`Error al obtener nave ${id}`);
    return res.json();
  },

  async controlIrrigation(greenhouseId: string, action: 'start' | 'stop', durationMinutes?: number, user?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/irrigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ greenhouseId, action, durationMinutes, user })
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
