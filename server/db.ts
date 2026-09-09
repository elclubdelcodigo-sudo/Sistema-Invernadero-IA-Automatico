import { generateInitialNaves, initialAlerts, initialIrrigationHistory, initialAuditLogs, initialCommands, generateHistoryTrends } from '../src/data/mockData';
import { Nave, Alert, IrrigationEvent, AuditLogEntry, DeviceCommand, DashboardMetrics, Esp32Config, Esp32Role, HardwareModule } from '../src/types';

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

  public updateEsp32Config(greenhouseId: string, config: Partial<Esp32Config>, updatedBy: string = 'Operador Terreno') {
    const nave = this.naves.find(n => n.id === greenhouseId);
    if (!nave) return null;

    const current = nave.esp32Config || {
      role: 'HYBRID',
      connected: true,
      connectionType: 'LORAWAN',
      ipAddress: '192.168.4.1',
      samplingIntervalSec: 120,
      hasPhysicalKeypad: true,
      hasOledDisplay: true,
      relayPin: 25,
      flowSensorPin: 14,
      soilSensorPins: [34, 35],
      firmwareVersion: 'v2.4.2-esp32',
      lastSyncAt: new Date().toISOString()
    };

    nave.esp32Config = {
      ...current,
      ...config,
      connected: true,
      lastSyncAt: new Date().toISOString()
    };

    const roleName = nave.esp32Config.role === 'SENSOR_ANTENNA' 
      ? 'Antena de Sensor' 
      : nave.esp32Config.role === 'CONTROL_PANEL' 
      ? 'Panel de Mando' 
      : 'Modo Híbrido (Sensor + Mando)';

    // Command downlinked to ESP32 Flash
    this.commands.unshift({
      id: `CMD_${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: greenhouseId,
      command: 'SET_ESP32_ROLE',
      payload: { role: nave.esp32Config.role, config: nave.esp32Config },
      status: 'EXECUTED',
      sentBy: updatedBy,
      executionResponse: `ACK_ESP32_ROLE_SET_${nave.esp32Config.role}`
    });

    this.addAuditLog(
      'USR_SESSION',
      updatedBy,
      greenhouseId,
      `ESP32 configurado exitosamente como: ${roleName}`,
      '192.168.1.100',
      'Éxito'
    );

    return nave.esp32Config;
  }

  public updateEsp32ConfigBulk(params: {
    role: Esp32Role;
    target: 'ALL' | 'SELECTED';
    ids?: string[];
    config?: Partial<Esp32Config>;
    user?: string;
  }) {
    const { role, target, ids = [], config = {}, user = 'Administrador' } = params;
    const targetNaves = target === 'ALL'
      ? this.naves
      : this.naves.filter(n => ids.includes(n.id));

    const roleName = role === 'SENSOR_ANTENNA' 
      ? 'Antena de Sensor' 
      : role === 'CONTROL_PANEL' 
      ? 'Panel de Mando' 
      : 'Modo Híbrido (Sensor + Mando)';

    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const nave of targetNaves) {
      const current = nave.esp32Config || {
        role,
        connected: true,
        connectionType: 'LORAWAN',
        ipAddress: '192.168.4.1',
        samplingIntervalSec: 120,
        hasPhysicalKeypad: true,
        hasOledDisplay: true,
        relayPin: 25,
        flowSensorPin: 14,
        soilSensorPins: [34, 35],
        firmwareVersion: 'v2.4.2-esp32',
        lastSyncAt: now
      };

      nave.esp32Config = {
        ...current,
        ...config,
        role,
        connected: true,
        lastSyncAt: now
      };

      updatedCount++;
    }

    this.addAuditLog(
      'USR_SESSION',
      user,
      target === 'ALL' ? 'GLOBAL' : 'MULTIPLE',
      `Configuración Masiva ESP32: Se asignó rol '${roleName}' a ${updatedCount} naves.`,
      '192.168.1.100',
      'Éxito'
    );

    return {
      success: true,
      updatedCount,
      role,
      target
    };
  }

  public addHardwareModule(
    greenhouseId: string,
    moduleData: Partial<HardwareModule>,
    user: string = 'Administrador'
  ): { success: boolean; module?: HardwareModule; message: string } {
    const nave = this.naves.find(n => n.id === greenhouseId);
    if (!nave) return { success: false, message: `Nave ${greenhouseId} no encontrada.` };

    if (!nave.hardwareModules) {
      nave.hardwareModules = [];
    }

    const type = moduleData.type || 'SENSOR_ANTENNA';
    const count = nave.hardwareModules.filter(m => m.type === type).length + 1;
    const prefix = type === 'SENSOR_ANTENNA' ? 'ANT' : 'PANEL';
    const id = moduleData.id || `${prefix}_${nave.id}_${String(count).padStart(2, '0')}`;
    const devEui = moduleData.devEui || `70B3D57ED${type === 'SENSOR_ANTENNA' ? '1' : '2'}${Math.floor(Math.random() * 900000 + 100000)}`;

    const newModule: HardwareModule = {
      id,
      name: moduleData.name || (type === 'SENSOR_ANTENNA' ? `Antena de Sensor #${count}` : `Panel de Control #${count}`),
      type,
      devEui,
      status: 'ONLINE',
      connectionType: moduleData.connectionType || 'LORAWAN',
      batteryVoltage: moduleData.batteryVoltage ?? (type === 'SENSOR_ANTENNA' ? 3.6 : 24.0),
      rssi: moduleData.rssi ?? (-75 - Math.floor(Math.random() * 12)),
      snr: moduleData.snr ?? Number((8.0 + Math.random() * 3).toFixed(1)),
      gatewayId: nave.gatewayId || 'GW_LORA_01',
      samplingIntervalSec: moduleData.samplingIntervalSec || (type === 'SENSOR_ANTENNA' ? 120 : 60),
      details: moduleData.details || (type === 'SENSOR_ANTENNA'
        ? 'Sonda capacitiva suelo dual (30cm/60cm) + Temp DS18B20 + SHT31'
        : 'Relé 24VAC (GPIO 25), Caudalímetro pulsos (GPIO 14), Botonera física y OLED'),
      pinConfig: moduleData.pinConfig || (type === 'SENSOR_ANTENNA'
        ? { soilPins: [34, 35], ds18b20Pin: 4 }
        : { relayPin: 25, flowSensorPin: 14 }),
      hasPhysicalKeypad: moduleData.hasPhysicalKeypad ?? (type === 'CONTROL_PANEL'),
      hasOledDisplay: moduleData.hasOledDisplay ?? true,
      installedAt: new Date().toISOString().split('T')[0]
    };

    nave.hardwareModules.push(newModule);

    const typeLabel = type === 'SENSOR_ANTENNA' ? 'Antena de Sensor' : 'Panel de Control';
    this.addAuditLog(
      'USR_SESSION',
      user,
      nave.id,
      `Se agregó ${typeLabel}: ${newModule.name} (DevEUI: ${newModule.devEui}) vinculada a ${nave.name}`,
      '192.168.1.100',
      'Éxito'
    );

    return {
      success: true,
      module: newModule,
      message: `${typeLabel} agregada con éxito a ${nave.name}.`
    };
  }

  public removeHardwareModule(
    greenhouseId: string,
    moduleId: string,
    user: string = 'Administrador'
  ): { success: boolean; message: string } {
    const nave = this.naves.find(n => n.id === greenhouseId);
    if (!nave) return { success: false, message: `Nave ${greenhouseId} no encontrada.` };

    if (!nave.hardwareModules) {
      return { success: false, message: 'No hay módulos instalados en esta nave.' };
    }

    const idx = nave.hardwareModules.findIndex(m => m.id === moduleId);
    if (idx === -1) {
      return { success: false, message: `Módulo ${moduleId} no encontrado en ${nave.name}.` };
    }

    const [removed] = nave.hardwareModules.splice(idx, 1);
    this.addAuditLog(
      'USR_SESSION',
      user,
      nave.id,
      `Desvinculación de módulo: ${removed.name} (${removed.type}) de ${nave.name}`,
      '192.168.1.100',
      'Éxito'
    );

    return { success: true, message: `Módulo ${removed.name} desvinculado con éxito.` };
  }

  public provisionNewDevice(data: {
    type: 'SENSOR_ANTENNA' | 'CONTROL_PANEL' | 'HYBRID';
    name: string;
    sector: string;
    naveId?: string;
    devEui?: string;
    connectionType?: any;
    user?: string;
  }): { success: boolean; device: any; message: string } {
    const { type, name, sector, naveId, user = 'Administrador' } = data;

    // If naveId is provided and exists, add as hardware module to that nave
    if (naveId) {
      const nave = this.naves.find(n => n.id === naveId);
      if (nave) {
        const res = this.addHardwareModule(
          naveId,
          {
            type: type === 'CONTROL_PANEL' ? 'CONTROL_PANEL' : 'SENSOR_ANTENNA',
            name: name || (type === 'SENSOR_ANTENNA' ? 'Nueva Antena de Sensor' : 'Nuevo Panel de Control'),
            devEui: data.devEui
          },
          user
        );
        return {
          success: true,
          device: res.module,
          message: res.message
        };
      }
    }

    // Otherwise provision as a new independent farm node
    const nextNum = this.naves.length + 1;
    const nextId = type === 'SENSOR_ANTENNA'
      ? `ANT_NODE_${String(nextNum).padStart(3, '0')}`
      : `PANEL_NODE_${String(nextNum).padStart(3, '0')}`;
    const devEui = data.devEui || `70B3D57ED${type === 'SENSOR_ANTENNA' ? '1' : '2'}${Math.floor(Math.random() * 900000 + 100000)}`;

    const newNave: Nave = {
      id: nextId,
      name: name || (type === 'SENSOR_ANTENNA' ? `Antena Sensor ${sector}` : `Panel de Mando ${sector}`),
      sector: sector || 'Sector Expansión',
      status: 'ONLINE',
      controlMode: 'AUTO',
      valveStatus: 'CERRADA',
      temperature: 23.8,
      humidity: 64,
      soilMoisture1: 42,
      soilMoisture2: 40,
      soilTemperature: 21.4,
      flowRate: 0,
      pressure: 2.1,
      voltage: type === 'SENSOR_ANTENNA' ? 3.6 : 24.0,
      rssi: -78,
      snr: 8.8,
      lastCommunication: 'Hace 1 segundo',
      gatewayId: 'GW_LORA_01',
      devEui,
      appEui: '0000000000000001',
      firmwareVersion: 'v2.4.2-prod',
      x: 50,
      y: 50,
      latitude: -33.456,
      longitude: -70.648,
      esp32Config: {
        role: type === 'CONTROL_PANEL' ? 'CONTROL_PANEL' : 'SENSOR_ANTENNA',
        connected: true,
        connectionType: 'LORAWAN',
        ipAddress: '192.168.4.1',
        samplingIntervalSec: type === 'SENSOR_ANTENNA' ? 120 : 60,
        hasPhysicalKeypad: type === 'CONTROL_PANEL',
        hasOledDisplay: true,
        relayPin: 25,
        flowSensorPin: 14,
        soilSensorPins: [34, 35],
        firmwareVersion: 'v2.4.2-esp32',
        lastSyncAt: new Date().toISOString()
      },
      hardwareModules: [
        {
          id: `${type === 'SENSOR_ANTENNA' ? 'ANT' : 'PANEL'}_${nextId}_01`,
          name: name || (type === 'SENSOR_ANTENNA' ? `Antena Sensor Primaria` : `Panel de Control Primario`),
          type: type === 'CONTROL_PANEL' ? 'CONTROL_PANEL' : 'SENSOR_ANTENNA',
          devEui,
          status: 'ONLINE',
          connectionType: 'LORAWAN',
          batteryVoltage: type === 'SENSOR_ANTENNA' ? 3.6 : 24.0,
          rssi: -78,
          snr: 8.8,
          gatewayId: 'GW_LORA_01',
          samplingIntervalSec: type === 'SENSOR_ANTENNA' ? 120 : 60,
          details: type === 'SENSOR_ANTENNA'
            ? 'Sonda capacitiva suelo dual (30cm/60cm) + Temp DS18B20 + SHT31'
            : 'Relé 24VAC (GPIO 25), Caudalímetro pulsos (GPIO 14), Botonera física y OLED',
          pinConfig: type === 'SENSOR_ANTENNA'
            ? { soilPins: [34, 35], ds18b20Pin: 4 }
            : { relayPin: 25, flowSensorPin: 14 },
          hasPhysicalKeypad: type === 'CONTROL_PANEL',
          hasOledDisplay: true,
          installedAt: new Date().toISOString().split('T')[0]
        }
      ],
      automationRule: {
        id: `RULE_${nextId}`,
        greenhouseId: nextId,
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

    this.naves.push(newNave);

    const typeLabel = type === 'SENSOR_ANTENNA' ? 'Antena de Sensor' : 'Panel de Control';
    this.addAuditLog(
      'USR_SESSION',
      user,
      nextId,
      `Aprovisionamiento de nuevo dispositivo: ${typeLabel} "${newNave.name}" (DevEUI: ${devEui})`,
      '192.168.1.100',
      'Éxito'
    );

    return {
      success: true,
      device: newNave,
      message: `${typeLabel} "${newNave.name}" aprovisionada exitosamente en la red LoRaWAN.`
    };
  }

  public testEsp32Connection(greenhouseId: string) {
    const nave = this.naves.find(n => n.id === greenhouseId);
    if (!nave) return { success: false, error: 'Nave no encontrada' };

    const isOffline = nave.status === 'OFFLINE';
    if (isOffline) {
      return {
        success: false,
        deviceId: `ESP32_${nave.id}`,
        connected: false,
        pingMs: 0,
        signalRssi: -115,
        heapFreeBytes: 0,
        voltage: 0,
        message: 'No responde al ping de sondeo. Verificar alimentación 24VDC o enlace de antena.'
      };
    }

    return {
      success: true,
      deviceId: `ESP32_${nave.id}`,
      connected: true,
      pingMs: Math.floor(Math.random() * 25 + 14), // 14-39 ms
      signalRssi: nave.rssi,
      snr: nave.snr,
      heapFreeBytes: 198420 + Math.floor(Math.random() * 10000),
      voltage: nave.voltage,
      uptimeSeconds: 86400 * 3 + Math.floor(Math.random() * 3600),
      firmwareVersion: nave.firmwareVersion,
      currentRole: nave.esp32Config?.role || 'HYBRID',
      message: 'Enlace bidireccional verificado correctamente. Telemetría y actuadores operativos.'
    };
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

  public deleteNave(greenhouseId: string, user: string = 'Administrador'): boolean {
    const index = this.naves.findIndex(n => n.id === greenhouseId);
    if (index === -1) return false;

    const [deleted] = this.naves.splice(index, 1);
    
    // Clean up active alerts for this nave
    this.alerts = this.alerts.filter(a => a.greenhouseId !== greenhouseId);

    this.addAuditLog(
      'USR_SESSION',
      user,
      greenhouseId,
      `Eliminación de la nave ${deleted.name} (${greenhouseId})`,
      '192.168.1.100',
      'Éxito'
    );

    return true;
  }

  public deleteMultipleNaves(ids: string[], user: string = 'Administrador'): number {
    const countBefore = this.naves.length;
    const idSet = new Set(ids);

    this.naves = this.naves.filter(n => !idSet.has(n.id));
    this.alerts = this.alerts.filter(a => !idSet.has(a.greenhouseId));

    const deletedCount = countBefore - this.naves.length;

    this.addAuditLog(
      'USR_SESSION',
      user,
      'MULTIPLE',
      `Eliminación masiva de ${deletedCount} naves (${ids.slice(0, 5).join(', ')}${ids.length > 5 ? '...' : ''})`,
      '192.168.1.100',
      'Éxito'
    );

    return deletedCount;
  }

  public deleteAllNaves(user: string = 'Administrador'): number {
    const totalDeleted = this.naves.length;
    this.naves = [];
    this.alerts = [];

    this.addAuditLog(
      'USR_SESSION',
      user,
      'GLOBAL',
      `Eliminación total: Se han eliminado TODAS las ${totalDeleted} naves del sistema.`,
      '192.168.1.100',
      'Éxito'
    );

    return totalDeleted;
  }

  public resetDefaultNaves(user: string = 'Administrador'): Nave[] {
    this.naves = generateInitialNaves();
    this.alerts = [...initialAlerts];

    this.addAuditLog(
      'USR_SESSION',
      user,
      'GLOBAL',
      `Restablecimiento: Se han restaurado las 125 naves por defecto del campo experimental.`,
      '192.168.1.100',
      'Éxito'
    );

    return this.naves;
  }
}

export const db = new VegalinkDatabase();
