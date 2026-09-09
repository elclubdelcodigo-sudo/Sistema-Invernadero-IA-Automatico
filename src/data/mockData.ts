import { Nave, Alert, IrrigationEvent, AuditLogEntry, DeviceCommand } from '../types';

// Helper to format date relative or ISO
export const generateInitialNaves = (): Nave[] => {
  const naves: Nave[] = [];
  
  const getBatterySector = (i: number) => {
    if (i <= 21) return 'Batería 1 (Oeste)';
    if (i <= 42) return 'Batería 2';
    if (i <= 63) return 'Batería 3';
    if (i <= 84) return 'Batería 4';
    if (i <= 105) return 'Batería 5';
    return 'Batería 6 (Este)';
  };
  
  // Seed the 125 naves
  for (let i = 1; i <= 125; i++) {
    const id = `NAVE_${String(i).padStart(3, '0')}`;
    const sector = getBatterySector(i);
    
    // Status distribution: mostly ONLINE (118), some REGANDO (7), few OFFLINE (4), few ALARMA (3)
    let status: Nave['status'] = 'ONLINE';
    let valveStatus: Nave['valveStatus'] = 'CERRADA';
    let flowRate = 0;
    
    if (i === 1) {
      status = 'ONLINE';
      valveStatus = 'CERRADA';
      flowRate = 0;
    } else if (i === 2) {
      status = 'REGANDO';
      valveStatus = 'ABIERTA';
      flowRate = 8.4;
    } else if (i === 3) {
      status = 'ALARMA';
      valveStatus = 'CERRADA';
      flowRate = 0;
    } else if (i === 4) {
      status = 'REGANDO';
      valveStatus = 'ABIERTA';
      flowRate = 7.9;
    } else if (i === 5) {
      status = 'OFFLINE';
      valveStatus = 'CERRADA';
      flowRate = 0;
    } else if (i === 12 || i === 25 || i === 44 || i === 88 || i === 104) {
      status = 'REGANDO';
      valveStatus = 'ABIERTA';
      flowRate = 8.1;
    } else if (i === 18 || i === 62) {
      status = 'ALARMA';
      valveStatus = 'CERRADA';
    } else if (i === 33 || i === 79 || i === 115) {
      status = 'OFFLINE';
      valveStatus = 'CERRADA';
    }

    // Semi-random yet consistent realistic sensor data
    const baseTemp = 23.5 + Math.sin(i * 0.3) * 3;
    const baseHum = 65 + Math.cos(i * 0.25) * 12;
    const soilHum1 = status === 'REGANDO' ? 52 + (i % 6) : 32 + (i % 16);
    const soilHum2 = soilHum1 - (1 + (i % 3));
    const soilTemp = baseTemp - 2.8;
    const pressure = status === 'REGANDO' ? 2.4 : 2.1;
    const voltage = 23.8 + (Math.sin(i) * 0.3);
    const rssi = -70 - (i % 25);
    const snr = 7.5 + (i % 5);

    // Grid coordinates for Field Map: 5 rows x 25 columns
    const col = (i - 1) % 25;
    const row = Math.floor((i - 1) / 25);
    const x = 4 + col * 3.8;
    const y = 8 + row * 19;

    naves.push({
      id,
      name: `Nave ${String(i).padStart(3, '0')}`,
      sector,
      status,
      controlMode: i % 7 === 0 ? 'MANUAL' : 'AUTO',
      valveStatus,
      temperature: Number(baseTemp.toFixed(1)),
      humidity: Math.round(baseHum),
      soilMoisture1: Math.round(soilHum1),
      soilMoisture2: Math.round(soilHum2),
      soilTemperature: Number(soilTemp.toFixed(1)),
      flowRate: Number(flowRate.toFixed(1)),
      pressure: Number(pressure.toFixed(2)),
      voltage: Number(voltage.toFixed(1)),
      rssi,
      snr: Number(snr.toFixed(1)),
      lastCommunication: status === 'OFFLINE' ? 'Hace 45 minutos' : 'Hace 12 segundos',
      gatewayId: i <= 60 ? 'GW_LORA_CENTRO_01' : 'GW_LORA_SUR_02',
      devEui: `70B3D57ED0${String(i).padStart(6, '0')}`,
      appEui: '0000000000000001',
      firmwareVersion: i % 15 === 0 ? 'v2.3.1' : 'v2.4.0-prod',
      x,
      y,
      latitude: -33.4569 + (row * 0.0012),
      longitude: -70.6482 + (col * 0.0015),
      activeIrrigation: status === 'REGANDO' ? {
        startedAt: new Date(Date.now() - (600 - (i % 300)) * 1000).toISOString(),
        targetMinutes: 20,
        remainingSeconds: 512,
        accumulatedLiters: 98.4 + (i * 2.5),
        initiatedBy: i % 2 === 0 ? 'Regla Auto Humedad < 35%' : 'Manual Cristian R.'
      } : undefined,
      automationRule: {
        id: `RULE_${id}`,
        greenhouseId: id,
        minSoilMoisture: 35,
        targetSoilMoisture: 55,
        maxIrrigationMinutes: 20,
        timeWindows: [
          { start: '06:00', end: '10:00' },
          { start: '18:00', end: '22:00' }
        ],
        minPressureBar: 1.5,
        minFlowDetectionSec: 45,
        enabled: true,
        syncedWithEsp32: true,
        lastSyncedAt: new Date(Date.now() - 3600000).toISOString()
      }
    });
  }

  return naves;
};

export const initialAlerts: Alert[] = [
  {
    id: 'ALT_101',
    greenhouseId: 'NAVE_003',
    greenhouseName: 'Nave 003',
    type: 'Riego sin caudal',
    severity: 'CRÍTICA',
    description: 'Válvula activada hace 45s pero el caudalímetro registra 0.0 L/min. Posible bomba apagada o tubería obstruida. Válvula cerrada por seguridad local.',
    state: 'ACTIVA',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT_102',
    greenhouseId: 'NAVE_018',
    greenhouseName: 'Nave 018',
    type: 'Humedad excesivamente baja',
    severity: 'ADVERTENCIA',
    description: 'Humedad de suelo 1 en 24% (umbral mín: 30%). Pendiente ciclo programado para las 18:00.',
    state: 'ACTIVA',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT_103',
    greenhouseId: 'NAVE_005',
    greenhouseName: 'Nave 005',
    type: 'Nave offline',
    severity: 'CRÍTICA',
    description: 'Sin balizas LoRaWAN desde hace 45 minutos (último RSSI -108 dBm). Verifique alimentación 220V/24V o fusible.',
    state: 'ACTIVA',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT_104',
    greenhouseId: 'NAVE_062',
    greenhouseName: 'Nave 062',
    type: 'Temperatura alta',
    severity: 'ADVERTENCIA',
    description: 'Sensor SHT31 registra 36.2 °C. Apertura de cortinas cenitales recomendada.',
    state: 'RECONOCIDA',
    timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    recognizedBy: 'Cristian R. (Operador)',
    recognizedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT_105',
    greenhouseId: 'NAVE_001',
    greenhouseName: 'Nave 001',
    type: 'Presión baja',
    severity: 'INFO',
    description: 'Presión de línea en 1.8 bar (dentro de rango de aviso).',
    state: 'RESUELTA',
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
];

export const initialIrrigationHistory: IrrigationEvent[] = [
  {
    id: 'IRR_9901',
    greenhouseId: 'NAVE_001',
    greenhouseName: 'Nave 001',
    startTime: '2026-09-07 07:15:00',
    endTime: '2026-09-07 07:35:00',
    durationMinutes: 20,
    litersTotal: 168.5,
    avgFlowRate: 8.4,
    mode: 'AUTO',
    result: 'COMPLETADO_EXITOSO',
    initiatedBy: 'Regla Auto (Suelo < 35%)'
  },
  {
    id: 'IRR_9902',
    greenhouseId: 'NAVE_004',
    greenhouseName: 'Nave 004',
    startTime: '2026-09-07 08:00:00',
    endTime: '2026-09-07 08:18:20',
    durationMinutes: 18.3,
    litersTotal: 144.2,
    avgFlowRate: 7.9,
    mode: 'AUTO',
    result: 'COMPLETADO_EXITOSO',
    initiatedBy: 'Regla Auto (Suelo < 35%)'
  },
  {
    id: 'IRR_9903',
    greenhouseId: 'NAVE_025',
    greenhouseName: 'Nave 025',
    startTime: '2026-09-07 09:10:00',
    endTime: '2026-09-07 09:25:00',
    durationMinutes: 15,
    litersTotal: 122.0,
    avgFlowRate: 8.1,
    mode: 'MANUAL',
    result: 'COMPLETADO_EXITOSO',
    initiatedBy: 'Cristian R. (Operador)'
  },
  {
    id: 'IRR_9904',
    greenhouseId: 'NAVE_003',
    greenhouseName: 'Nave 003',
    startTime: '2026-09-07 09:40:00',
    endTime: '2026-09-07 09:40:45',
    durationMinutes: 0.75,
    litersTotal: 0.0,
    avgFlowRate: 0.0,
    mode: 'AUTO',
    result: 'ERROR_SIN_CAUDAL',
    initiatedBy: 'Regla Auto (Falla caudal)'
  }
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'LOG_801',
    timestamp: '2026-09-07 09:10:14',
    userId: 'USR_02',
    userName: 'Cristian Reyes',
    greenhouseId: 'NAVE_025',
    action: 'Activó válvula manualmente (límite seguridad 20m)',
    ipAddress: '192.168.1.140',
    result: 'Éxito',
    details: 'Confirmado diálogo de seguridad en terreno'
  },
  {
    id: 'LOG_802',
    timestamp: '2026-09-07 08:30:22',
    userId: 'USR_01',
    userName: 'Ing. Laura Valenzuela',
    greenhouseId: 'NAVE_001',
    action: 'Actualizó regla de automatización local',
    ipAddress: '190.45.112.54',
    result: 'Éxito',
    details: 'Humedad mín: 35%, target: 55%, sincronizado con ESP32'
  },
  {
    id: 'LOG_803',
    timestamp: '2026-09-07 07:05:00',
    userId: 'SYS_DAEMON',
    userName: 'Sistema LoRaWAN / ChirpStack',
    greenhouseId: 'CAMPO_GENERAL',
    action: 'Sincronización masiva de balizas periódicas',
    ipAddress: '127.0.0.1',
    result: 'Éxito',
    details: '118/125 naves respondieron con ACK'
  }
];

export const initialCommands: DeviceCommand[] = [
  {
    id: 'CMD_5001',
    timestamp: '2026-09-07 09:10:15',
    deviceId: 'NAVE_025',
    command: 'OPEN_VALVE',
    payload: { durationMinutes: 15, cutPressureBar: 1.5 },
    status: 'EXECUTED',
    sentBy: 'Cristian Reyes',
    executionResponse: 'ACK_VALVE_OPEN_OK: timer set 900s'
  },
  {
    id: 'CMD_5002',
    timestamp: '2026-09-07 08:30:23',
    deviceId: 'NAVE_001',
    command: 'UPDATE_CONFIG',
    payload: { minHum: 35, targetHum: 55, maxMin: 20 },
    status: 'EXECUTED',
    sentBy: 'Ing. Laura Valenzuela',
    executionResponse: 'FLASH_CONFIG_SAVED'
  }
];

// Generate 24-hour historical trend points
export const generateHistoryTrends = (hours = 24) => {
  const points = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    const hour = t.getHours();
    
    // Day night cycle curve
    const solarEffect = Math.sin(((hour - 6) / 18) * Math.PI);
    const temp = Math.max(14, Number((20 + (solarEffect > 0 ? solarEffect * 9 : -4) + (Math.random() * 0.8 - 0.4)).toFixed(1)));
    const hum = Math.min(95, Math.max(40, Number((78 - (solarEffect > 0 ? solarEffect * 28 : -8) + (Math.random() * 1.5 - 0.7)).toFixed(1))));
    const soilHum = Number((44 - (i % 6 === 0 ? -6 : 0.3) + Math.random() * 0.5).toFixed(1));
    const soilTemp = Number((temp * 0.8 + 4).toFixed(1));
    const waterLiters = (hour >= 6 && hour <= 10) || (hour >= 18 && hour <= 21) ? Math.round(180 + Math.random() * 60) : Math.round(Math.random() * 20);
    const irrigationHours = waterLiters > 100 ? 1.2 : 0.1;

    points.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      timestamp: t.toISOString(),
      temperature: temp,
      humidity: hum,
      soilMoisture: soilHum,
      soilTemperature: soilTemp,
      waterLiters,
      irrigationHours
    });
  }
  return points;
};
