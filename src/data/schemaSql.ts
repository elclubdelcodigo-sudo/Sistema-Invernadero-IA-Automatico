// Database schema definition for VEGALINK (Hostinger MySQL / MariaDB / PostgreSQL)

export const VEGALINK_SQL_SCHEMA = `-- ==============================================================================
-- VEGALINK - Agricultural IoT Platform Relational Database Schema
-- Hostinger MySQL 8.0+ / MariaDB 10.5+ / PostgreSQL Compatible
-- Designed for scaling 1 to 500+ Greenhouses (Naves) with LoRaWAN Telemetry
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS vegalink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vegalink_db;

-- 1. Roles & Permissions Table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
  ('Administrador', 'Control total, configuración, usuarios, OTA y parámetros de campo'),
  ('Operador', 'Monitoreo, activación manual de riego supervisado y reconocimiento de alarmas'),
  ('Visualización', 'Solo lectura de dashboard, gráficos, mapas e históricos');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  role_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- 3. Farms (Campos Agrícolas) Table
CREATE TABLE IF NOT EXISTS farms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location_name VARCHAR(150),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_area_hectares DECIMAL(8, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Greenhouses (Naves / Invernaderos) Table
CREATE TABLE IF NOT EXISTS greenhouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farm_id INT NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'NAVE_001'
  name VARCHAR(100) NOT NULL, -- e.g. 'Nave 001 - Tomate Cherry'
  sector VARCHAR(50) NOT NULL, -- e.g. 'Sector Norte A'
  crop_type VARCHAR(100) DEFAULT 'Hortalizas',
  grid_col INT DEFAULT 1,
  grid_row INT DEFAULT 1,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status ENUM('ONLINE', 'OFFLINE', 'ALARMA', 'REGANDO') DEFAULT 'ONLINE',
  control_mode ENUM('AUTO', 'MANUAL') DEFAULT 'AUTO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  INDEX idx_code (code),
  INDEX idx_status (status)
);

-- 5. Devices (ESP32 Nodes) Table
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  greenhouse_id INT NOT NULL UNIQUE,
  device_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'ESP32_NAVE_001'
  dev_eui VARCHAR(32) NOT NULL UNIQUE,     -- LoRaWAN DevEUI 16 hex chars
  app_eui VARCHAR(32) NOT NULL,            -- JoinEUI
  app_key_hash VARCHAR(64),
  lora_frequency_mhz DECIMAL(5, 2) DEFAULT 915.00,
  firmware_version VARCHAR(30) DEFAULT 'v2.4.0-prod',
  battery_voltage DECIMAL(4, 2) DEFAULT 24.0,
  rssi_dbm INT DEFAULT -78,
  snr_db DECIMAL(4, 1) DEFAULT 8.5,
  last_communication TIMESTAMP NULL,
  ip_address VARCHAR(45) NULL,
  status ENUM('ONLINE', 'OFFLINE', 'ERROR') DEFAULT 'ONLINE',
  installation_date DATE,
  config_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id) ON DELETE CASCADE,
  INDEX idx_dev_eui (dev_eui)
);

-- 6. Sensors Catalog Table
CREATE TABLE IF NOT EXISTS sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  sensor_type VARCHAR(50) NOT NULL, -- 'SHT31_TEMP', 'SHT31_HUM', 'SOIL_HUM_1', 'SOIL_HUM_2', 'DS18B20_SOIL_TEMP', 'FLOW_METER', 'PRESSURE_BAR'
  model VARCHAR(50),
  unit VARCHAR(20) NOT NULL,
  calibration_factor DECIMAL(8, 4) DEFAULT 1.0,
  pin_assignment VARCHAR(30),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 7. High-Performance Sensor Readings (Time-Series partitioned by month in production)
CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  sensor_id INT NULL,
  variable VARCHAR(50) NOT NULL, -- 'temperature', 'humidity', 'soil_moisture_1', 'soil_moisture_2', 'soil_temp', 'flow_rate', 'pressure', 'voltage'
  value DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_dev_var_time (device_id, variable, timestamp),
  INDEX idx_timestamp (timestamp)
);

-- 8. Valves (Electroválvulas 24VDC)
CREATE TABLE IF NOT EXISTS valves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL UNIQUE,
  valve_number INT DEFAULT 1,
  status ENUM('ABIERTA', 'CERRADA') DEFAULT 'CERRADA',
  mosfet_gpio INT DEFAULT 26,
  max_continuous_minutes INT DEFAULT 20, -- Hardware fail-safe cut-off
  last_opened_at TIMESTAMP NULL,
  last_closed_at TIMESTAMP NULL,
  total_runtime_seconds BIGINT DEFAULT 0,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 9. Irrigation Automation Rules (Stored on Server AND synced to ESP32 Flash/NVS for local autonomy)
CREATE TABLE IF NOT EXISTS irrigation_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  greenhouse_id INT NOT NULL UNIQUE,
  min_soil_moisture DECIMAL(5, 2) DEFAULT 35.00,
  target_soil_moisture DECIMAL(5, 2) DEFAULT 55.00,
  max_irrigation_minutes INT DEFAULT 20,
  time_windows JSON, -- e.g. [{"start":"06:00", "end":"10:00"}, {"start":"18:00", "end":"22:00"}]
  min_pressure_bar DECIMAL(4, 2) DEFAULT 1.5,
  min_flow_detection_sec INT DEFAULT 45,
  enabled BOOLEAN DEFAULT TRUE,
  synced_with_esp32 BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id) ON DELETE CASCADE
);

-- 10. Irrigation Events History
CREATE TABLE IF NOT EXISTS irrigation_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  greenhouse_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  duration_minutes DECIMAL(6, 2) DEFAULT 0,
  liters_total DECIMAL(10, 2) DEFAULT 0,
  avg_flow_rate DECIMAL(6, 2) DEFAULT 0,
  mode ENUM('AUTO', 'MANUAL') DEFAULT 'AUTO',
  result ENUM('COMPLETADO_EXITOSO', 'DETENIDO_POR_USUARIO', 'CORTE_POR_TIEMPO_MAX', 'ERROR_SIN_CAUDAL', 'EN_CURSO') DEFAULT 'EN_CURSO',
  initiated_by VARCHAR(100) NOT NULL,
  FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id) ON DELETE CASCADE,
  INDEX idx_greenhouse_start (greenhouse_id, start_time)
);

-- 11. Alerts & Alarms Table
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  greenhouse_id INT NOT NULL,
  type VARCHAR(80) NOT NULL,
  severity ENUM('INFO', 'ADVERTENCIA', 'CRÍTICA') NOT NULL,
  description TEXT NOT NULL,
  state ENUM('ACTIVA', 'RECONOCIDA', 'RESUELTA') DEFAULT 'ACTIVA',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recognized_by VARCHAR(100) NULL,
  recognized_at TIMESTAMP NULL,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id) ON DELETE CASCADE,
  INDEX idx_alert_state (state),
  INDEX idx_alert_severity (severity)
);

-- 12. Remote Commands Queue (Downlinks for LoRaWAN / MQTT)
CREATE TABLE IF NOT EXISTS commands (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  command VARCHAR(50) NOT NULL, -- 'OPEN_VALVE', 'CLOSE_VALVE', 'SET_MODE_AUTO', 'SET_MODE_MANUAL', 'UPDATE_CONFIG', 'REBOOT'
  payload JSON,
  status ENUM('PENDING', 'SENT', 'DELIVERED', 'EXECUTED', 'FAILED') DEFAULT 'PENDING',
  sent_by VARCHAR(100) NOT NULL,
  execution_response VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 13. Audit Logs (Security & Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50),
  user_name VARCHAR(100) NOT NULL,
  greenhouse_code VARCHAR(50),
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  result ENUM('Éxito', 'Advertencia', 'Fallo') DEFAULT 'Éxito',
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Firmware Versions for Over-The-Air (OTA) Updates
CREATE TABLE IF NOT EXISTS firmware_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(30) NOT NULL UNIQUE,
  file_url VARCHAR(255) NOT NULL,
  checksum_sha256 VARCHAR(64) NOT NULL,
  release_notes TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. System Global Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;
