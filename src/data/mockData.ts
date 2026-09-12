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
  
  // Seed the 125 regular production naves
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
      },
      esp32Config: {
        role: (i % 3 === 0 ? 'CONTROL_PANEL' : i % 3 === 1 ? 'SENSOR_ANTENNA' : 'HYBRID'),
        connected: status !== 'OFFLINE',
        connectionType: 'LORAWAN',
        ipAddress: `192.168.4.${10 + (i % 200)}`,
        samplingIntervalSec: 120,
        hasPhysicalKeypad: i % 2 === 0,
        hasOledDisplay: true,
        relayPin: 25,
        flowSensorPin: 14,
        soilSensorPins: [34, 35],
        firmwareVersion: 'v2.4.2-esp32',
        lastSyncAt: new Date(Date.now() - (i * 30000)).toISOString()
      },
      hardwareModules: [
        {
          id: `ANT_${id}_01`,
          name: `Antena Sensor Suelo & Clima #${String(i).padStart(3, '0')}`,
          type: 'SENSOR_ANTENNA',
          devEui: `70B3D57ED1${String(i).padStart(6, '0')}`,
          status: status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
          connectionType: 'LORAWAN',
          batteryVoltage: 3.6,
          rssi: rssi,
          snr: Number(snr.toFixed(1)),
          gatewayId: i <= 60 ? 'GW_LORA_CENTRO_01' : 'GW_LORA_SUR_02',
          samplingIntervalSec: 120,
          details: 'Sonda capacitiva suelo dual (30cm/60cm) + Sensor ambiental SHT31',
          pinConfig: { soilPins: [34, 35], ds18b20Pin: 4 },
          installedAt: '2026-02-15'
        },
        {
          id: `PANEL_${id}_01`,
          name: `Panel de Mando Cabecera #${String(i).padStart(3, '0')}`,
          type: 'CONTROL_PANEL',
          devEui: `70B3D57ED2${String(i).padStart(6, '0')}`,
          status: status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
          connectionType: 'LORAWAN',
          batteryVoltage: 24.0,
          rssi: rssi + 2,
          snr: Number((snr + 0.4).toFixed(1)),
          gatewayId: i <= 60 ? 'GW_LORA_CENTRO_01' : 'GW_LORA_SUR_02',
          samplingIntervalSec: 60,
          details: 'Actuador relé 24VAC (GPIO 25), Caudalímetro pulsos (GPIO 14), Botonera física y OLED',
          pinConfig: { relayPin: 25, flowSensorPin: 14 },
          hasPhysicalKeypad: true,
          hasOledDisplay: true,
          installedAt: '2026-02-15'
        }
      ]
    });
  }

  // Add the 3 Almácigos / Nursery Greenhouses visible on the East Complex
  const almacigosData = [
    {
      id: 'ALM_01',
      name: 'Almácigo 01 — Germinación & Siembra',
      sector: 'Sector Almácigos',
      status: 'REGANDO' as Nave['status'],
      valveStatus: 'ABIERTA' as Nave['valveStatus'],
      temp: 24.8,
      hum: 84,
      soil1: 72,
      soil2: 70,
      flow: 5.2,
      pressure: 2.8,
      voltage: 24.1,
      devEui: '70B3D57ED0ALM001'
    },
    {
      id: 'ALM_02',
      name: 'Almácigo 02 — Microaspersión & Cámara',
      sector: 'Sector Almácigos',
      status: 'ONLINE' as Nave['status'],
      valveStatus: 'CERRADA' as Nave['valveStatus'],
      temp: 23.9,
      hum: 82,
      soil1: 68,
      soil2: 66,
      flow: 0.0,
      pressure: 2.7,
      voltage: 24.0,
      devEui: '70B3D57ED0ALM002'
    },
    {
      id: 'ALM_03',
      name: 'Almácigo 03 — Enraizamiento & Rustificación',
      sector: 'Sector Almácigos',
      status: 'ONLINE' as Nave['status'],
      valveStatus: 'CERRADA' as Nave['valveStatus'],
      temp: 23.2,
      hum: 76,
      soil1: 64,
      soil2: 62,
      flow: 0.0,
      pressure: 2.6,
      voltage: 23.9,
      devEui: '70B3D57ED0ALM003'
    }
  ];

  almacigosData.forEach((alm, idx) => {
    naves.push({
      id: alm.id,
      name: alm.name,
      sector: alm.sector,
      status: alm.status,
      controlMode: 'AUTO',
      valveStatus: alm.valveStatus,
      temperature: alm.temp,
      humidity: alm.hum,
      soilMoisture1: alm.soil1,
      soilMoisture2: alm.soil2,
      soilTemperature: Number((alm.temp - 2.2).toFixed(1)),
      flowRate: alm.flow,
      pressure: alm.pressure,
      voltage: alm.voltage,
      rssi: -65 - idx * 2,
      snr: 9.8,
      lastCommunication: 'Hace 5 segundos',
      gatewayId: 'GW_LORA_CENTRO_01',
      devEui: alm.devEui,
      appEui: '0000000000000001',
      firmwareVersion: 'v2.4.0-prod',
      x: 92,
      y: 75 + idx * 7,
      latitude: -33.4578 + (idx * 0.0003),
      longitude: -70.6470,
      activeIrrigation: alm.status === 'REGANDO' ? {
        startedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        targetMinutes: 15,
        remainingSeconds: 660,
        accumulatedLiters: 20.8,
        initiatedBy: 'Regla Auto Microaspersión (Hum < 80%)'
      } : undefined,
      automationRule: {
        id: `RULE_${alm.id}`,
        greenhouseId: alm.id,
        minSoilMoisture: 60,
        targetSoilMoisture: 80,
        maxIrrigationMinutes: 15,
        timeWindows: [
          { start: '06:00', end: '11:00' },
          { start: '14:00', end: '19:00' }
        ],
        minPressureBar: 2.2,
        minFlowDetectionSec: 30,
        enabled: true,
        syncedWithEsp32: true,
        lastSyncedAt: new Date(Date.now() - 1800000).toISOString()
      },
      esp32Config: {
        role: 'HYBRID',
        connected: true,
        connectionType: 'LORAWAN',
        ipAddress: `192.168.4.${201 + idx}`,
        samplingIntervalSec: 60,
        hasPhysicalKeypad: true,
        hasOledDisplay: true,
        relayPin: 25,
        flowSensorPin: 14,
        soilSensorPins: [34, 35],
        firmwareVersion: 'v2.4.2-esp32',
        lastSyncAt: new Date().toISOString()
      }
    });
  });

  return naves;
};

export const initialAlerts: Alert[] = [
  {
    id: 'ALT_101',
    greenhouseId: 'NAVE_003',
    greenhouseName: 'Nave 003',
    type: 'Riego sin caudal',
    severity: 'CRÍTICA',
    description: 'Válvula solenoide abierta por comando automático pero el caudalímetro registra 0.0 L/min tras 45 segundos.',
    causeReason: 'Apertura de la electroválvula de 24VAC confirmada, pero no hay flujo hidráulico. Posible falta de presión en la cabecera del Sector A, filtro obstruido o bomba de impulsión inactiva.',
    triggerCondition: 'Válvula Solenoide = ABIERTA & Caudal < 0.5 L/min durante > 45s',
    sensorValueAtTrigger: 'Caudalímetro: 0.0 L/min | Presión: 0.2 bar | Relé: ABIERTO',
    recommendedAction: '1) Comprobar si la bomba de riego principal está energizada. 2) Revisar el filtro de disco de cabecera en el Sector A. 3) Inspeccionar presostato.',
    state: 'ACTIVA',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT_102',
    greenhouseId: 'NAVE_018',
    greenhouseName: 'Nave 018',
    type: 'Humedad excesivamente baja',
    severity: 'ADVERTENCIA',
    description: 'Nivel de humedad de suelo en estrato radicular crítico (24%).',
    causeReason: 'La evaporación por radiación solar sobrepasó la retención de agua. El suelo está por debajo del límite agronómico de marcación marchitez temporal.',
    triggerCondition: 'Humedad Suelo 1 (15cm) < 30% (Umbral de riego programado)',
    sensorValueAtTrigger: 'Suelo 1: 24.0% | Suelo 2: 28.0% | Temp Amb: 29.5°C',
    recommendedAction: 'Adelantar o iniciar ciclo manual de pulso corto (15-20 min) para evitar estrés hídrico en cultivo.',
    state: 'ACTIVA',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT_103',
    greenhouseId: 'NAVE_005',
    greenhouseName: 'Nave 005',
    type: 'Nave offline',
    severity: 'CRÍTICA',
    description: 'Pérdida de enlace de telemetría con el nodo ESP32 / Antena LoRaWAN.',
    causeReason: 'El servidor no ha recibido pings ni paquetes Uplink LoRaWAN en los últimos 45 minutos. Posible falla en la fuente 220V/24V, batería de respaldo agotada o interferencia física.',
    triggerCondition: 'Sin tramas LoRaWAN Uplink > 30 minutos (Gateway GW_LORA_CENTRO_01)',
    sensorValueAtTrigger: 'Último RSSI: -108 dBm | SNR: -2.5 dB | Voltaje previo: 21.8V',
    recommendedAction: 'Verificar la térmica de alimentación en el tablero eléctrico de la Nave 005 y comprobar conector SMA de antena LoRa.',
    state: 'ACTIVA',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'ALT_104',
    greenhouseId: 'NAVE_062',
    greenhouseName: 'Nave 062',
    type: 'Temperatura alta',
    severity: 'ADVERTENCIA',
    description: 'Temperatura ambiental interna superó el límite superior de confort.',
    causeReason: 'Pico de radiación solar estival combinado con cortinas cenitales cerradas o ventilación limitada.',
    triggerCondition: 'Temperatura Ambiental (SHT31) > 35.0 °C',
    sensorValueAtTrigger: 'Temp Amb: 36.2 °C | Humedad Amb: 38% | Radiación: 880 W/m²',
    recommendedAction: 'Abrir cortinas laterales y cenitales. Activar microaspersores de refrescado si la humedad cae por debajo del 35%.',
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
    description: 'Caída momentánea en la presión hidráulica de suministro.',
    causeReason: 'Apertura simultánea de válvulas en naves adyacentes redujo levemente la presión de línea.',
    triggerCondition: 'Presión Hidráulica < 1.5 bar durante riego activo',
    sensorValueAtTrigger: 'Presión: 1.8 bar | Caudal: 7.2 L/min',
    recommendedAction: 'Ajustar traslape de tiempos en el secuenciador automático para evitar apertura simultánea de más de 3 naves.',
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
