// VEGALINK - Agricultural IoT Platform Types

export type NaveStatus = 'ONLINE' | 'OFFLINE' | 'ALARMA' | 'REGANDO';
export type ValveStatus = 'ABIERTA' | 'CERRADA';
export type ControlMode = 'AUTO' | 'MANUAL';
export type AlertSeverity = 'INFO' | 'ADVERTENCIA' | 'CRÍTICA';
export type AlertState = 'ACTIVA' | 'RECONOCIDA' | 'RESUELTA';
export type CommandStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'EXECUTED' | 'FAILED';
export type UserRole = 'Administrador' | 'Operador' | 'Visualización';

// Configuración y roles del microcontrolador ESP32 por Nave
export type Esp32Role = 'SENSOR_ANTENNA' | 'CONTROL_PANEL' | 'HYBRID';
export type Esp32ConnectionType = 'LORAWAN' | 'WIFI' | 'USB_SERIAL' | 'BLUETOOTH';

// Módulos específicos de hardware (Antenas de Sensor y Paneles de Control)
export type HardwareModuleType = 'SENSOR_ANTENNA' | 'CONTROL_PANEL';

export interface HardwareModule {
  id: string; // e.g. 'ANT_001_A' o 'PANEL_001_B'
  name: string; // e.g. 'Antena Sonda Suelo Principal' o 'Panel de Mando Cabecera'
  type: HardwareModuleType;
  devEui: string;
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  connectionType: Esp32ConnectionType;
  batteryVoltage?: number; // e.g. 3.6V (Li-SOCl2) o 24V DC
  rssi?: number; // dBm
  snr?: number; // dB
  gatewayId?: string;
  samplingIntervalSec?: number;
  details: string; // Descripción técnica de pines/sensores
  pinConfig?: {
    relayPin?: number;
    flowSensorPin?: number;
    soilPins?: number[];
    ds18b20Pin?: number;
  };
  hasPhysicalKeypad?: boolean;
  hasOledDisplay?: boolean;
  installedAt: string;
}

export interface Esp32Config {
  role: Esp32Role; // 'SENSOR_ANTENNA': Antena de sensor / 'CONTROL_PANEL': Panel de mando / 'HYBRID': Ambos
  connected: boolean;
  connectionType: Esp32ConnectionType;
  ipAddress?: string; // e.g. 192.168.4.1 (modo AP o IP de campo)
  samplingIntervalSec: number; // e.g. 60, 120, 300 segundos
  hasPhysicalKeypad: boolean; // Pulsadores físicos de mando en entrada de nave
  hasOledDisplay: boolean; // Display OLED de estado local
  relayPin: number; // Pin GPIO para electroválvula (ej. GPIO 25)
  flowSensorPin: number; // Pin GPIO para sensor de caudal por pulsos (ej. GPIO 14)
  soilSensorPins: number[]; // e.g. [34, 35] ADC1
  firmwareVersion: string;
  lastSyncAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLogin: string;
}

export interface Nave {
  id: string; // e.g. 'NAVE_001'
  name: string; // e.g. 'Nave 001 - Tomate Cherry'
  sector: string; // e.g. 'Sector Norte A'
  status: NaveStatus;
  controlMode: ControlMode;
  valveStatus: ValveStatus;
  
  // Real-time sensor metrics
  temperature: number; // Ambient °C (SHT31)
  humidity: number; // Ambient % (SHT31)
  soilMoisture1: number; // Soil 1 %
  soilMoisture2: number; // Soil 2 %
  soilTemperature: number; // Soil °C (DS18B20)
  flowRate: number; // Caudal L/min
  pressure: number; // Presión bar
  voltage: number; // Voltaje alimentación VDC (24V nominal)
  
  // LoRaWAN telemetry
  rssi: number; // dBm e.g. -78
  snr: number; // dB e.g. 9.5
  lastCommunication: string; // ISO string or relative
  gatewayId: string;
  devEui: string;
  appEui: string;
  firmwareVersion: string;

  // Configuración hardware ESP32
  esp32Config?: Esp32Config;
  
  // Módulos específicos de hardware (Antenas de sensor y Paneles de control vinculados)
  hardwareModules?: HardwareModule[];
  
  // Coordinates for Field Map
  x: number; // Grid or normalized X (0-100)
  y: number; // Grid or normalized Y (0-100)
  latitude: number;
  longitude: number;

  // Active irrigation info if regando
  activeIrrigation?: {
    startedAt: string;
    targetMinutes: number;
    remainingSeconds: number;
    accumulatedLiters: number;
    initiatedBy: string; // 'AUTO_RULE' | 'MANUAL_CRISTIAN' | etc.
  };

  // Local automation rule
  automationRule: IrrigationRule;
}

export interface IrrigationRule {
  id: string;
  greenhouseId: string;
  minSoilMoisture: number; // e.g. 35%
  targetSoilMoisture: number; // e.g. 55%
  maxIrrigationMinutes: number; // e.g. 20 min
  timeWindows: { start: string; end: string }[]; // e.g. ['06:00-10:00', '18:00-22:00']
  minPressureBar: number; // e.g. 1.5 bar
  minFlowDetectionSec: number; // e.g. 45 sec before no-flow alarm
  enabled: boolean;
  syncedWithEsp32: boolean; // Local hardware sync flag
  lastSyncedAt?: string;
}

export interface Alert {
  id: string;
  greenhouseId: string;
  greenhouseName: string;
  type: 
    | 'Nave offline'
    | 'Sensor desconectado'
    | 'Humedad excesivamente baja'
    | 'Humedad excesivamente alta'
    | 'Temperatura alta'
    | 'Temperatura baja'
    | 'Válvula sin respuesta'
    | 'Riego sin caudal'
    | 'Caudal excesivo'
    | 'Presión baja'
    | 'Presión alta'
    | 'Pérdida de comunicación LoRa'
    | 'Voltaje bajo'
    | 'Error del controlador';
  severity: AlertSeverity;
  description: string;
  causeReason?: string; // Causa raíz por la cual se gatilló la alarma
  triggerCondition?: string; // Umbral o regla vulnerada
  sensorValueAtTrigger?: string; // Valor de telemetría medido durante el evento
  recommendedAction?: string; // Acción correctiva recomendada
  state: AlertState;
  timestamp: string;
  recognizedBy?: string;
  recognizedAt?: string;
  resolvedAt?: string;
}

export interface IrrigationEvent {
  id: string;
  greenhouseId: string;
  greenhouseName: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  litersTotal: number;
  avgFlowRate: number;
  mode: ControlMode;
  result: 'COMPLETADO_EXITOSO' | 'DETENIDO_POR_USUARIO' | 'CORTE_POR_TIEMPO_MAX' | 'ERROR_SIN_CAUDAL' | 'EN_CURSO';
  initiatedBy: string;
}

export interface SensorReading {
  id: string;
  timestamp: string;
  deviceId: string;
  sensorId: string;
  variable: 'temperatura' | 'humedad' | 'humedad_suelo_1' | 'humedad_suelo_2' | 'temperatura_suelo' | 'caudal' | 'presion' | 'voltaje';
  value: number;
  unit: string;
}

export interface DeviceCommand {
  id: string;
  timestamp: string;
  deviceId: string;
  command: 
    | 'OPEN_VALVE'
    | 'CLOSE_VALVE'
    | 'SET_MODE_AUTO'
    | 'SET_MODE_MANUAL'
    | 'SET_IRRIGATION_LIMIT'
    | 'REQUEST_STATUS'
    | 'REBOOT'
    | 'UPDATE_CONFIG'
    | 'SET_ESP32_ROLE';
  payload: Record<string, any>;
  status: CommandStatus;
  sentBy: string;
  executionResponse?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  greenhouseId: string;
  action: string;
  ipAddress: string;
  result: 'Éxito' | 'Advertencia' | 'Fallo';
  details?: string;
}

export interface DashboardMetrics {
  totalNaves: number;
  navesOnline: number;
  navesOffline: number;
  navesConAlarma: number;
  navesRegando: number;
  totalWaterConsumptionTodayLiters: number;
  currentTotalFlowRate: number;
  avgTemperature: number;
  avgHumidity: number;
  avgSoilMoisture: number;
  lastCommunicationTime: string;
}

export interface AIAnalysisRequest {
  query?: string;
  targetNaveId?: string;
  focusArea?: 'anomalies' | 'irrigation_prediction' | 'water_optimization' | 'sensor_diagnostics' | 'general';
}

export interface AIRecommendationItem {
  naveId: string;
  action: string;
  urgency: 'ALTA' | 'MEDIA' | 'BAJA';
  reason: string;
}

export interface AIAnomalyItem {
  naveId: string;
  description: string;
  confidence: number;
}

export interface AICriticalNaveItem {
  naveId: string;
  issue: string;
  actionRequired: string;
}

export interface AIOptimalWindowItem {
  sector: string;
  timeWindow: string;
  reason: string;
}

export interface AIAnalysisResponse {
  summary: string;
  waterSavingEstimatePercent?: number;
  waterSavingsForecastM3: number;
  recommendations: AIRecommendationItem[];
  anomaliesDetected: AIAnomalyItem[];
  criticalNaves?: AICriticalNaveItem[];
  optimalWindows?: AIOptimalWindowItem[];
  source?: string;
  generatedAt: string;
}
