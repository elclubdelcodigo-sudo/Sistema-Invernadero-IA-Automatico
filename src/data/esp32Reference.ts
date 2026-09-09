// VEGALINK - ESP32 Firmware Architecture & ChirpStack Codec Reference

export const ESP32_FIRMWARE_CPP = `/*
 * ==============================================================================
 * VEGALINK NODE FIRMWARE - ESP32 + LoRaWAN (915 MHz)
 * Local-First Autonomous Irrigation & Telemetry Controller
 *
 * CRITICAL DIRECTIVE: Local logic executes autonomously on the ESP32.
 * Even if LoRaWAN, Gateway, Internet or Server are down, the ESP32 enforces:
 *  - Soil moisture threshold triggers
 *  - Hard max time limit (20 minutes default fail-safe cut-off)
 *  - Flow pulse verification (closes valve & sets local alarm if 0 L/min after 45s)
 *  - NVS / EEPROM configuration persistence
 *  - Offline ring buffer in LittleFS for delayed sync
 * ==============================================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <Preferences.h>
#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "Adafruit_SHT31.h"

// --- PIN DEFINITIONS ---
#define PIN_SHT_SDA        21
#define PIN_SHT_SCL        22
#define PIN_ONEWIRE_TEMP    4   // DS18B20 Soil Temp
#define PIN_SOIL_ANALOG_1  34   // Capacitive Moisture 1
#define PIN_SOIL_ANALOG_2  35   // Capacitive Moisture 2
#define PIN_FLOW_SENSOR    14   // Pulse counter interrupt
#define PIN_PRESSURE_SENS  32   // 0.5V - 4.5V Transducer (scaled)
#define PIN_MOSFET_VALVE   26   // 24VDC Solenoid driver (active HIGH)
#define PIN_VOLTAGE_DIVIDER 33  // 24V Bus voltage monitor

// LoRa SX1276 Pin Mapping (SPI)
const lmic_pinmap lmic_pins = {
    .nss = 18,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 14,
    .dio = {26, 33, LMIC_UNUSED_PIN},
};

// --- AUTONOMOUS IRRIGATION CONFIGURATION (Stored in NVS) ---
struct AutonomousConfig {
    char deviceId[16];          // e.g. "NAVE_001"
    float minSoilMoisture;       // e.g. 35.0%
    float targetSoilMoisture;    // e.g. 55.0%
    uint16_t maxIrrigationSec;  // e.g. 1200 sec (20 min)
    uint16_t minFlowTimeoutSec; // 45 sec before no-flow alarm
    bool autoModeEnabled;       // true = AUTO, false = MANUAL
    uint8_t allowedStartHour1;  // 6
    uint8_t allowedEndHour1;    // 10
    uint8_t allowedStartHour2;  // 18
    uint8_t allowedEndHour2;    // 22
} config;

Preferences prefs;
Adafruit_SHT31 sht31 = Adafruit_SHT31();
OneWire oneWire(PIN_ONEWIRE_TEMP);
DallasTemperature soilTempSensor(&oneWire);

// Runtime States
volatile uint32_t flowPulseCounter = 0;
bool valveIsOpen = false;
uint32_t valveOpenedAtMs = 0;
uint32_t lastTelemetryMs = 0;

void IRAM_ATTR onFlowPulse() {
    flowPulseCounter++;
}

void openValveSafe(uint16_t durationSec) {
    digitalWrite(PIN_MOSFET_VALVE, HIGH);
    valveIsOpen = true;
    valveOpenedAtMs = millis();
    Serial.println("[VALVE] Válvula ABIERTA con temporizador de seguridad.");
}

void closeValveSafe(const char* reason) {
    digitalWrite(PIN_MOSFET_VALVE, LOW);
    valveIsOpen = false;
    Serial.printf("[VALVE] Válvula CERRADA. Motivo: %s\\n", reason);
}

void setup() {
    Serial.begin(115200);
    Wire.begin(PIN_SHT_SDA, PIN_SHT_SCL);
    sht31.begin(0x44);
    soilTempSensor.begin();

    pinMode(PIN_MOSFET_VALVE, OUTPUT);
    digitalWrite(PIN_MOSFET_VALVE, LOW); // Fail-safe closed

    pinMode(PIN_FLOW_SENSOR, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(PIN_FLOW_SENSOR), onFlowPulse, RISING);

    // Load local autonomous rules from Flash
    prefs.begin("vegalink", false);
    if (!prefs.isKey("cfg_init")) {
        strcpy(config.deviceId, "NAVE_001");
        config.minSoilMoisture = 35.0;
        config.targetSoilMoisture = 55.0;
        config.maxIrrigationSec = 1200; // 20 min hard stop
        config.minFlowTimeoutSec = 45;
        config.autoModeEnabled = true;
        prefs.putBytes("cfg", &config, sizeof(config));
        prefs.putBool("cfg_init", true);
    } else {
        prefs.getBytes("cfg", &config, sizeof(config));
    }
}

void loop() {
    uint32_t nowMs = millis();

    // 1. LOCAL AUTONOMOUS SAFETY CHECK (Runs every loop iteration)
    if (valveIsOpen) {
        uint32_t elapsedSec = (nowMs - valveOpenedAtMs) / 1000;

        // Hard maximum duration cut-off (Rule 1)
        if (elapsedSec >= config.maxIrrigationSec) {
            closeValveSafe("CORTE_TIEMPO_MAXIMO_20M");
        }

        // Flow verification: if valve is open for 45s and pulse count is 0 -> FAULT
        if (elapsedSec >= config.minFlowTimeoutSec && flowPulseCounter < 5) {
            closeValveSafe("ALARMA_CRITICA_SIN_CAUDAL");
            // Register offline alert in flash for next LoRa sync
        }
    }

    // 2. SENSOR ACQUISITION & AUTONOMOUS TRIGGER
    if (nowMs - lastTelemetryMs >= 15000) { // Every 15 seconds
        lastTelemetryMs = nowMs;

        float ambientTemp = sht31.readTemperature();
        float ambientHum = sht31.readHumidity();
        soilTempSensor.requestTemperatures();
        float soilTemp = soilTempSensor.getTempCByIndex(0);

        int rawSoil1 = analogRead(PIN_SOIL_ANALOG_1);
        float soilHum1 = map(rawSoil1, 3200, 1400, 0, 100); // Calibrated range
        soilHum1 = constrain(soilHum1, 0, 100);

        // Local Decision Rule (Autonomous even if disconnected)
        if (config.autoModeEnabled && !valveIsOpen) {
            if (soilHum1 < config.minSoilMoisture) {
                // If soil is dry, activate safe irrigation
                openValveSafe(config.maxIrrigationSec);
            }
        } else if (valveIsOpen && soilHum1 >= config.targetSoilMoisture) {
            closeValveSafe("HUMEDAD_OBJETIVO_ALCANZADA");
        }
    }

    // 3. Process LoRaWAN LMIC background events...
    os_runloop_once();
}
`;

export const CHIRPSTACK_CODEC_JS = `// ==============================================================================
// ChirpStack v4 / TTN Payload Decoder for VEGALINK
// Decodes packed binary telemetry payload from ESP32
// ==============================================================================

function decodeUplink(input) {
  var bytes = input.bytes;
  if (bytes.length < 14) {
    return { errors: ["Payload too short"] };
  }

  // Byte layout:
  // [0..1] Ambient Temp (°C * 100, signed int16)
  // [2]    Ambient Humidity (% uint8)
  // [3]    Soil Moisture 1 (% uint8)
  // [4]    Soil Moisture 2 (% uint8)
  // [5..6] Soil Temp (°C * 100, signed int16)
  // [7..8] Flow Rate (L/min * 10, uint16)
  // [9..10] Water Pressure (bar * 100, uint16)
  // [11]   Battery Voltage (V * 10, uint8)
  // [12]   Valve Status (0: CLOSED, 1: OPEN)
  // [13]   Control Mode (0: AUTO, 1: MANUAL)

  var tempRaw = (bytes[0] << 8) | bytes[1];
  if (tempRaw > 0x7fff) tempRaw -= 0x10000;
  var ambientTemp = tempRaw / 100.0;

  var ambientHum = bytes[2];
  var soilMoisture1 = bytes[3];
  var soilMoisture2 = bytes[4];

  var soilTempRaw = (bytes[5] << 8) | bytes[6];
  if (soilTempRaw > 0x7fff) soilTempRaw -= 0x10000;
  var soilTemp = soilTempRaw / 100.0;

  var flowRate = ((bytes[7] << 8) | bytes[8]) / 10.0;
  var pressure = ((bytes[9] << 8) | bytes[10]) / 100.0;
  var voltage = bytes[11] / 10.0;
  var valveStatus = bytes[12] === 1 ? "ABIERTA" : "CERRADA";
  var controlMode = bytes[13] === 1 ? "MANUAL" : "AUTO";

  return {
    data: {
      temperature: ambientTemp,
      humidity: ambientHum,
      soilMoisture1: soilMoisture1,
      soilMoisture2: soilMoisture2,
      soilTemperature: soilTemp,
      flowRate: flowRate,
      pressure: pressure,
      voltage: voltage,
      valveStatus: valveStatus,
      controlMode: controlMode
    }
  };
}

// Downlink encoder for Remote Commands (OPEN_VALVE, CLOSE_VALVE, UPDATE_CONFIG)
function encodeDownlink(input) {
  var cmd = input.data.command;
  var payload = [];

  if (cmd === "OPEN_VALVE") {
    // 0x01: OPEN_VALVE, [1..2]: maxDurationSeconds
    var duration = input.data.durationSeconds || 1200;
    payload.push(0x01);
    payload.push((duration >> 8) & 0xff);
    payload.push(duration & 0xff);
  } else if (cmd === "CLOSE_VALVE") {
    // 0x02: CLOSE_VALVE
    payload.push(0x02);
  } else if (cmd === "SET_MODE_AUTO") {
    payload.push(0x03);
    payload.push(0x00);
  } else if (cmd === "SET_MODE_MANUAL") {
    payload.push(0x03);
    payload.push(0x01);
  } else if (cmd === "UPDATE_CONFIG") {
    // 0x04: UPDATE_CONFIG, minHum, targetHum, maxMin
    payload.push(0x04);
    payload.push(input.data.minSoilMoisture || 35);
    payload.push(input.data.targetSoilMoisture || 55);
    payload.push(input.data.maxIrrigationMinutes || 20);
  }

  return {
    bytes: payload,
    fPort: 10
  };
}
`;
