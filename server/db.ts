import { generateInitialNaves, initialAlerts, initialIrrigationHistory, initialAuditLogs, initialCommands, generateHistoryTrends } from '../src/data/mockData';
import { Nave, Alert, IrrigationEvent, AuditLogEntry, DeviceCommand, DashboardMetrics } from '../src/types';

class VegalinkDatabase {
  public naves: Nave[] = [];
  public alerts: Alert[] = [];
  public irrigationHistory: IrrigationEvent[] = [];
  public auditLogs: AuditLogEntry[] = [];
  public commands: DeviceCommand[] = [];
  public sensorReadingsHistory: any[] = [];
  public lastTelemetrySync: Date = new Date();

  constructor() {
    this.init();
  }

  private init() {
    this.naves = generateInitialNaves();
    this.alerts = [...initialAlerts];
    this.irrigationHistory = [...initialIrrigationHistory];
    this.auditLogs = [...initialAuditLogs];
    this.commands = [...initialCommands];
    this.sensorReadingsHistory = generateHistoryTrends(24);

    // Periodically update runtime for active irrigations (simulate timer countdown)
    setInterval(() => {
      this.tickIrrigationTimers();
    }, 1000);
  }

  private tickIrrigationTimers() {
    let stateChanged = false;
    for (const nave of this.naves) {
      if (nave.status === 'REGANDO' && nave.activeIrrigation) {
        if (nave.activeIrrigation.remainingSeconds > 0) {
          nave.activeIrrigation.remainingSeconds -= 1;
          // Increment liters based on flow rate (L/min / 60 = L/sec)
          const litersPerSec = nave.flowRate / 60;
          nave.activeIrrigation.accumulatedLiters = Number((nave.activeIrrigation.accumulatedLiters + litersPerSec).toFixed(1));
          
          // Increment soil moisture slightly during irrigation
          if (nave.activeIrrigation.remainingSeconds % 10 === 0 && nave.soilMoisture1 < 65) {
            nave.soilMoisture1 += 1;
            nave.soilMoisture2 += 1;
          }
        } else {
          // Automatic completion by safety cut-off or reached time
          this.stopIrrigation(nave.id, 'SYS_TIMEOUT', 'CORTE_POR_TIEMPO_MAX');
          stateChanged = true;
        }
      }
    }
  }

  public getDashboardMetrics(): DashboardMetrics {
    const totalNaves = this.naves.length;
    const navesOnline = this.naves.filter(n => n.status === 'ONLINE').length;
    const navesOffline = this.naves.filter(n => n.status === 'OFFLINE').length;
    const navesConAlarma = this.naves.filter(n => n.status === 'ALARMA').length;
    const navesRegando = this.naves.filter(n => n.status === 'REGANDO').length;
    
    const currentTotalFlowRate = Number(
      this.naves.reduce((acc, curr) => acc + (curr.flowRate || 0), 0).toFixed(1)
    );
    
    const onlineNaves = this.naves.filter(n => n.status !== 'OFFLINE');
    const avgTemperature = Number(
      (onlineNaves.reduce((acc, curr) => acc + curr.temperature, 0) / (onlineNaves.length || 1)).toFixed(1)
    );
    const avgHumidity = Math.round(
      onlineNaves.reduce((acc, curr) => acc + curr.humidity, 0) / (onlineNaves.length || 1)
    );
    const avgSoilMoisture = Math.round(
      onlineNaves.reduce((acc, curr) => acc + curr.soilMoisture1, 0) / (onlineNaves.length || 1)
    );

    const totalWaterConsumptionTodayLiters = Math.round(
      this.irrigationHistory.reduce((acc, curr) => acc + curr.litersTotal, 0) +
      this.naves.reduce((acc, curr) => acc + (curr.activeIrrigation?.accumulatedLiters || 0), 0)
    );

    return {
      totalNaves,
      navesOnline,
      navesOffline,
      navesConAlarma,
      navesRegando,
      totalWaterConsumptionTodayLiters,
      currentTotalFlowRate,
      avgTemperature,
      avgHumidity,
      avgSoilMoisture,
      lastCommunicationTime: 'Hace 8 segundos'
    };
  }

  public startIrrigation(
    greenhouseId: string,
    durationMinutes: number = 20,
    initiatedBy: string = 'Manual Operador'
  ): { success: boolean; message: string; eventId?: string } {
    const nave = this.naves.find(n => n.id === greenhouseId);
    if (!nave) {
      return { success: false, message: `Nave ${greenhouseId} no encontrada.` };
    }

    if (nave.status === 'OFFLINE') {
      return { success: false, message: `No se puede activar riego: ${greenhouseId} está OFFLINE.` };
    }

    // PROTOCOLO DE RIEGO SEGURO: Max 20-30 min default cut-off
    const safeMinutes = Math.min(Math.max(durationMinutes, 1), 60);

    nave.status = 'REGANDO';
    nave.valveStatus = 'ABIERTA';
    nave.flowRate = 8.2;
    nave.activeIrrigation = {
      startedAt: new Date().toISOString(),
      targetMinutes: safeMinutes,
      remainingSeconds: safeMinutes * 60,
      accumulatedLiters: 0,
      initiatedBy
    };

    // Command generation for ESP32 downlink
    const cmdId = `CMD_${Date.now()}`;
    const cmd: DeviceCommand = {
      id: cmdId,
      timestamp: new Date().toISOString(),
      deviceId: greenhouseId,
      command: 'OPEN_VALVE',
      payload: { durationMinutes: safeMinutes, failSafeCutoffSec: safeMinutes * 60 },
      status: 'SENT',
      sentBy: initiatedBy,
      executionResponse: 'ACK_VALVE_OPEN_OK'
    };
    this.commands.unshift(cmd);

    // Audit log
    this.addAuditLog(
      'USR_SESSION',
      initiatedBy,
      greenhouseId,
      `Activó válvula manualmente (Límite seguridad: ${safeMinutes} min)`,
      '192.168.1.100',
      'Éxito'
    );

    return {
      success: true,
      message: `Riego iniciado de forma segura en ${nave.name}. Temporizador activo: ${safeMinutes} minutos.`,
      eventId: cmdId
    };
  }

  public stopIrrigation(
    greenhouseId: string,
    stoppedBy: string = 'Manual Operador',
    reason: IrrigationEvent['result'] = 'DETENIDO_POR_USUARIO'
  ): { success: boolean; message: string } {
    const nave = this.naves.find(n => n.id === greenhouseId);
    if (!nave) return { success: false, message: `Nave ${greenhouseId} no encontrada.` };

    const active = nave.activeIrrigation;
    const elapsedMinutes = active ? Number(((active.targetMinutes * 60 - active.remainingSeconds) / 60).toFixed(1)) : 0;
    const liters = active ? active.accumulatedLiters : 0;

    // Record in history
    if (active) {
      const event: IrrigationEvent = {
        id: `IRR_${Date.now()}`,
        greenhouseId: nave.id,
        greenhouseName: nave.name,
        startTime: active.startedAt,
        endTime: new Date().toISOString(),
        durationMinutes: Math.max(0.1, elapsedMinutes),
        litersTotal: Number(liters.toFixed(1)),
        avgFlowRate: nave.flowRate > 0 ? nave.flowRate : 8.1,
        mode: nave.controlMode,
        result: reason,
        initiatedBy: active.initiatedBy
      };
      this.irrigationHistory.unshift(event);
    }

    nave.status = 'ONLINE';
    nave.valveStatus = 'CERRADA';
    nave.flowRate = 0;
    nave.activeIrrigation = undefined;

    // Downlink command
    this.commands.unshift({
      id: `CMD_${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: greenhouseId,
      command: 'CLOSE_VALVE',
      payload: { reason },
      status: 'EXECUTED',
      sentBy: stoppedBy,
      executionResponse: 'ACK_VALVE_CLOSED'
    });

    this.addAuditLog(
      'USR_SESSION',
      stoppedBy,
      greenhouseId,
      `Cierre seguro de válvula. Resultado: ${reason}`,
      '192.168.1.100',
      'Éxito'
    );

    return { success: true, message: `Válvula cerrada de forma segura en ${nave.name}.` };
  }

  public updateNaveRule(greenhouseId: string, ruleData: any, updatedBy: string) {
    const nave = this.naves.find(n => n.id === greenhouseId);
    if (!nave) return null;

    nave.automationRule = {
      ...nave.automationRule,
      ...ruleData,
      syncedWithEsp32: true,
      lastSyncedAt: new Date().toISOString()
    };

    this.addAuditLog(
      'USR_SESSION',
      updatedBy,
      greenhouseId,
      `Actualizó reglas de automatización local (Humedad Mín: ${nave.automationRule.minSoilMoisture}%, Target: ${nave.automationRule.targetSoilMoisture}%)`,
      '192.168.1.100',
      'Éxito'
    );

    return nave.automationRule;
  }

  public acknowledgeAlert(alertId: string, userName: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.state = 'RECONOCIDA';
      alert.recognizedBy = userName;
      alert.recognizedAt = new Date().toISOString();
      return alert;
    }
    return null;
  }

  public resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.state = 'RESUELTA';
      alert.resolvedAt = new Date().toISOString();
      
      // If the nave was in ALARMA, restore to ONLINE if no more active alarms
      const remainingAlarms = this.alerts.filter(a => a.greenhouseId === alert.greenhouseId && a.state === 'ACTIVA');
      if (remainingAlarms.length === 0) {
        const nave = this.naves.find(n => n.id === alert.greenhouseId);
        if (nave && nave.status === 'ALARMA') {
          nave.status = 'ONLINE';
        }
      }
      return alert;
    }
    return null;
  }

  public addAuditLog(userId: string, userName: string, greenhouseId: string, action: string, ipAddress: string, result: 'Éxito' | 'Advertencia' | 'Fallo', details?: string) {
    const entry: AuditLogEntry = {
      id: `LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId,
      userName,
      greenhouseId,
      action,
      ipAddress,
      result,
      details
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
    return entry;
  }

  // Telemetry ingestion endpoint handler for LoRaWAN ChirpStack / MQTT or simulator
  public ingestTelemetry(payload: any) {
    const deviceId = payload.deviceId || payload.devEui || payload.id;
    let nave = this.naves.find(n => n.id === deviceId || n.devEui === deviceId);
    
    if (!nave) {
      // If new pilot device connected, add it dynamically
      nave = {
        id: deviceId,
        name: `Nave ${deviceId}`,
        sector: 'Sector Piloto',
        status: 'ONLINE',
        controlMode: 'AUTO',
        valveStatus: 'CERRADA',
        temperature: payload.temperature ?? 24.0,
        humidity: payload.humidity ?? 65,
        soilMoisture1: payload.soilMoisture1 ?? 40,
        soilMoisture2: payload.soilMoisture2 ?? 38,
        soilTemperature: payload.soilTemperature ?? 21.0,
        flowRate: payload.flowRate ?? 0,
        pressure: payload.pressure ?? 2.0,
        voltage: payload.voltage ?? 24.0,
        rssi: payload.rssi ?? -82,
        snr: payload.snr ?? 8.0,
        lastCommunication: 'Hace 1 segundo',
        gatewayId: payload.gatewayId || 'GW_LORA_01',
        devEui: payload.devEui || `70B3D57ED0${Math.floor(Math.random() * 999999)}`,
        appEui: '0000000000000001',
        firmwareVersion: payload.firmwareVersion || 'v2.4.0-prod',
        x: 50,
        y: 50,
        latitude: -33.456,
        longitude: -70.648,
        automationRule: {
          id: `RULE_${deviceId}`,
          greenhouseId: deviceId,
          minSoilMoisture: 35,
          targetSoilMoisture: 55,
          maxIrrigationMinutes: 20,
          timeWindows: [{ start: '06:00', end: '10:00' }, { start: '18:00', end: '22:00' }],
          minPressureBar: 1.5,
          minFlowDetectionSec: 45,
          enabled: true,
          syncedWithEsp32: true
        }
      };
      this.naves.push(nave);
    } else {
      if (payload.temperature !== undefined) nave.temperature = payload.temperature;
      if (payload.humidity !== undefined) nave.humidity = payload.humidity;
      if (payload.soilMoisture1 !== undefined) nave.soilMoisture1 = payload.soilMoisture1;
      if (payload.soilMoisture2 !== undefined) nave.soilMoisture2 = payload.soilMoisture2;
      if (payload.soilTemperature !== undefined) nave.soilTemperature = payload.soilTemperature;
      if (payload.flowRate !== undefined) nave.flowRate = payload.flowRate;
      if (payload.pressure !== undefined) nave.pressure = payload.pressure;
      if (payload.voltage !== undefined) nave.voltage = payload.voltage;
      if (payload.rssi !== undefined) nave.rssi = payload.rssi;
      if (payload.snr !== undefined) nave.snr = payload.snr;
      if (payload.valveStatus !== undefined) nave.valveStatus = payload.valveStatus;
      nave.lastCommunication = 'Hace 1 segundo';
      if (nave.status === 'OFFLINE') nave.status = 'ONLINE';
    }

    return nave;
  }
}

export const db = new VegalinkDatabase();
