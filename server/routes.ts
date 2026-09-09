import express, { Request, Response } from 'express';
import { db } from './db';
import { generateAgriAnalysis } from './gemini';

const router = express.Router();

// 1. Dashboard summary
router.get('/dashboard', (req: Request, res: Response) => {
  const metrics = db.getDashboardMetrics();
  const recentAlerts = db.alerts.filter(a => a.state === 'ACTIVA').slice(0, 5);
  const activeIrrigations = db.naves.filter(n => n.status === 'REGANDO');
  
  res.json({
    metrics,
    recentAlerts,
    activeIrrigations,
    trends24h: db.sensorReadingsHistory
  });
});

// 2. Naves list & detail
router.get('/naves', (req: Request, res: Response) => {
  const { sector, status, search } = req.query;
  let results = [...db.naves];

  if (sector && typeof sector === 'string') {
    results = results.filter(n => n.sector.toLowerCase().includes(sector.toLowerCase()));
  }
  if (status && typeof status === 'string') {
    results = results.filter(n => n.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(n => n.id.toLowerCase().includes(q) || n.name.toLowerCase().includes(q));
  }

  res.json({
    total: results.length,
    naves: results
  });
});

router.get('/naves/:id', (req: Request, res: Response) => {
  const nave = db.naves.find(n => n.id === req.params.id);
  if (!nave) {
    return res.status(404).json({ error: `Nave ${req.params.id} no encontrada` });
  }
  const alerts = db.alerts.filter(a => a.greenhouseId === nave.id);
  const recentIrrigations = db.irrigationHistory.filter(e => e.greenhouseId === nave.id).slice(0, 10);
  
  res.json({
    nave,
    alerts,
    recentIrrigations
  });
});

// Delete a single nave
router.delete('/naves/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.body.user || (req.query.user as string) || 'Administrador';
  const deleted = db.deleteNave(id, user);
  if (!deleted) {
    return res.status(404).json({ success: false, error: `Nave ${id} no encontrada` });
  }
  res.json({ success: true, message: `Nave ${id} eliminada correctamente` });
});

// Delete multiple or all naves
router.delete('/naves', (req: Request, res: Response) => {
  const { ids, all, user = 'Administrador' } = req.body;
  if (all === true) {
    const total = db.deleteAllNaves(user);
    return res.json({ success: true, message: `Se han eliminado todas las ${total} naves del sistema`, deletedCount: total });
  }

  if (Array.isArray(ids) && ids.length > 0) {
    const deletedCount = db.deleteMultipleNaves(ids, user);
    return res.json({ success: true, message: `Se han eliminado ${deletedCount} naves seleccionadas`, deletedCount });
  }

  return res.status(400).json({ success: false, error: 'Debe especificar "ids" o "all: true"' });
});

// Reset / restore default 125 naves
router.post('/naves/reset', (req: Request, res: Response) => {
  const user = req.body.user || 'Administrador';
  const naves = db.resetDefaultNaves(user);
  res.json({ success: true, message: 'Se han restaurado las 125 naves por defecto', total: naves.length, naves });
});

// Update automation rule for a nave
router.post('/naves/:id/automation', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.body.user || 'Cristian Reyes (Operador)';
  const updated = db.updateNaveRule(id, req.body, user);
  if (!updated) {
    return res.status(404).json({ error: 'Nave no encontrada' });
  }
  res.json({ success: true, automationRule: updated });
});

// Update ESP32 hardware role & connection config for a single nave
router.post('/naves/:id/esp32', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.body.user || 'Cristian Reyes (Operador)';
  const updated = db.updateEsp32Config(id, req.body, user);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Nave no encontrada' });
  }
  res.json({ success: true, esp32Config: updated, message: `ESP32 de ${id} reconfigurado con éxito.` });
});

// Bulk update ESP32 role & config for all or multiple naves ("modificalo para todas las naves")
router.post('/naves/esp32/bulk', (req: Request, res: Response) => {
  const { role, target = 'ALL', ids = [], config = {}, user = 'Administrador' } = req.body;
  if (!role) {
    return res.status(400).json({ success: false, error: 'El rol de ESP32 es obligatorio (SENSOR_ANTENNA, CONTROL_PANEL o HYBRID).' });
  }
  const result = db.updateEsp32ConfigBulk({ role, target, ids, config, user });
  res.json({
    success: true,
    message: target === 'ALL' 
      ? `Configuración aplicada con éxito a TODAS las ${result.updatedCount} naves del sistema.`
      : `Configuración aplicada a ${result.updatedCount} naves seleccionadas.`,
    ...result
  });
});

// Test hardware connection / ping to ESP32
router.post('/naves/:id/esp32/test', (req: Request, res: Response) => {
  const { id } = req.params;
  const diagnostic = db.testEsp32Connection(id);
  res.json(diagnostic);
});

// Hardware Modules (Antenas de Sensor & Paneles de Control) per Nave
router.post('/naves/:id/hardware-modules', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.body.user || 'Administrador';
  const result = db.addHardwareModule(id, req.body, user);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

router.delete('/naves/:id/hardware-modules/:moduleId', (req: Request, res: Response) => {
  const { id, moduleId } = req.params;
  const user = req.body.user || (req.query.user as string) || 'Administrador';
  const result = db.removeHardwareModule(id, moduleId, user);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Provision new hardware device (Antena de Sensor / Panel de Control)
router.post('/devices', (req: Request, res: Response) => {
  const user = req.body.user || 'Administrador';
  const result = db.provisionNewDevice({ ...req.body, user });
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// 3. Devices inventory
router.get('/devices', (req: Request, res: Response) => {
  const devices = db.naves.map(n => ({
    deviceId: `ESP32_${n.id}`,
    naveId: n.id,
    naveName: n.name,
    sector: n.sector,
    devEui: n.devEui,
    appEui: n.appEui,
    firmwareVersion: n.firmwareVersion,
    status: n.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
    voltage: n.voltage,
    rssi: n.rssi,
    snr: n.snr,
    lastCommunication: n.lastCommunication,
    gatewayId: n.gatewayId,
    config: n.automationRule
  }));
  res.json({ devices });
});

router.get('/devices/:id', (req: Request, res: Response) => {
  const nave = db.naves.find(n => n.id === req.params.id || `ESP32_${n.id}` === req.params.id);
  if (!nave) return res.status(404).json({ error: 'Dispositivo no encontrado' });
  res.json({
    deviceId: `ESP32_${nave.id}`,
    nave,
    config: nave.automationRule
  });
});

// Device command endpoint
router.post('/devices/:id/command', (req: Request, res: Response) => {
  const { command, payload, user } = req.body;
  const deviceId = req.params.id;
  const nave = db.naves.find(n => n.id === deviceId || `ESP32_${n.id}` === deviceId);

  if (!nave) return res.status(404).json({ error: 'Dispositivo no encontrado' });

  let result = 'ACK_OK';
  if (command === 'OPEN_VALVE') {
    const duration = payload?.durationMinutes || 20;
    db.startIrrigation(nave.id, duration, user || 'Operador Terreno');
  } else if (command === 'CLOSE_VALVE') {
    db.stopIrrigation(nave.id, user || 'Operador Terreno', 'DETENIDO_POR_USUARIO');
  } else if (command === 'SET_MODE_AUTO') {
    nave.controlMode = 'AUTO';
  } else if (command === 'SET_MODE_MANUAL') {
    nave.controlMode = 'MANUAL';
  } else if (command === 'REBOOT') {
    result = 'ACK_REBOOT_SCHEDULED';
  }

  const cmdEntry = {
    id: `CMD_${Date.now()}`,
    timestamp: new Date().toISOString(),
    deviceId: nave.id,
    command,
    payload: payload || {},
    status: 'EXECUTED' as const,
    sentBy: user || 'Operador',
    executionResponse: result
  };
  db.commands.unshift(cmdEntry);

  res.json({ success: true, command: cmdEntry });
});

// 4. Telemetry Ingestion (ChirpStack Webhook / MQTT / Simulator)
router.post('/telemetry', (req: Request, res: Response) => {
  const payload = req.body;
  
  // Support both ChirpStack v4 webhook format and direct payload
  let telemetryData = payload;
  if (payload.deviceInfo && payload.object) {
    telemetryData = {
      devEui: payload.deviceInfo.devEui,
      deviceId: payload.deviceInfo.deviceName,
      rssi: payload.rxInfo?.[0]?.rssi || -80,
      snr: payload.rxInfo?.[0]?.snr || 8.0,
      gatewayId: payload.rxInfo?.[0]?.gatewayId || 'GW_01',
      ...payload.object
    };
  }

  const updatedNave = db.ingestTelemetry(telemetryData);
  res.json({
    status: 'success',
    message: 'Telemetría procesada y almacenada.',
    deviceId: updatedNave.id,
    timestamp: new Date().toISOString()
  });
});

// 5. Irrigation Control
router.post('/irrigation', (req: Request, res: Response) => {
  const { greenhouseId, ids, action, durationMinutes, user } = req.body;

  // Support mass irrigation on all or multiple naves
  if (greenhouseId === 'ALL' || Array.isArray(ids)) {
    const targetNaves = Array.isArray(ids) && ids.length > 0
      ? db.naves.filter(n => ids.includes(n.id))
      : db.naves;

    if (action === 'start') {
      let started = 0;
      for (const n of targetNaves) {
        if (n.status !== 'ALARMA') {
          db.startIrrigation(n.id, durationMinutes || 20, user || 'Operador Terreno');
          started++;
        }
      }
      return res.status(200).json({
        success: true,
        message: `Riego iniciado de forma segura en ${started} naves (${durationMinutes || 20} min).`,
        count: started
      });
    } else if (action === 'stop') {
      let stopped = 0;
      for (const n of targetNaves) {
        if (n.status === 'REGANDO' || n.valveStatus === 'ABIERTA' || n.activeIrrigation) {
          db.stopIrrigation(n.id, user || 'Operador Terreno', 'DETENIDO_POR_USUARIO');
          stopped++;
        }
      }
      return res.status(200).json({
        success: true,
        message: stopped > 0
          ? `Riego detenido exitosamente en ${stopped} naves.`
          : `Todas las electroválvulas están cerradas de forma segura.`,
        count: stopped
      });
    }
  }

  if (action === 'start') {
    const result = db.startIrrigation(greenhouseId, durationMinutes || 20, user || 'Operador Terreno');
    return res.status(result.success ? 200 : 400).json(result);
  } else if (action === 'stop') {
    const result = db.stopIrrigation(greenhouseId, user || 'Operador Terreno');
    return res.status(result.success ? 200 : 400).json(result);
  } else {
    return res.status(400).json({ error: 'Acción de riego no válida. Usar "start" o "stop".' });
  }
});

router.get('/irrigation/history', (req: Request, res: Response) => {
  res.json({
    total: db.irrigationHistory.length,
    events: db.irrigationHistory
  });
});

// 6. Alerts
router.get('/alerts', (req: Request, res: Response) => {
  const { state, severity } = req.query;
  let results = [...db.alerts];
  if (state && typeof state === 'string') {
    results = results.filter(a => a.state === state);
  }
  if (severity && typeof severity === 'string') {
    results = results.filter(a => a.severity === severity);
  }
  res.json({ alerts: results });
});

router.patch('/alerts/:id', (req: Request, res: Response) => {
  const { action, user } = req.body;
  const { id } = req.params;
  if (action === 'recognize') {
    const updated = db.acknowledgeAlert(id, user || 'Operador');
    if (!updated) return res.status(404).json({ error: 'Alerta no encontrada' });
    return res.json({ success: true, alert: updated });
  } else if (action === 'resolve') {
    const updated = db.resolveAlert(id);
    if (!updated) return res.status(404).json({ error: 'Alerta no encontrada' });
    return res.json({ success: true, alert: updated });
  }
  res.status(400).json({ error: 'Acción no válida. Usar "recognize" o "resolve".' });
});

// 7. Historical data & CSV export
router.get('/historicos', (req: Request, res: Response) => {
  const { naveId, range } = req.query;
  const hours = range === '7d' ? 168 : range === '30d' ? 720 : 24;
  const points = db.sensorReadingsHistory;
  res.json({
    naveId: naveId || 'CAMPO_GENERAL',
    points
  });
});

router.get('/export/csv', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="vegalink_historicos.csv"');
  
  let csv = 'Timestamp,Nave,Temperatura_C,Humedad_Pct,Humedad_Suelo_Pct,Caudal_Lmin,Presion_bar,Estado_Valvula\n';
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000).toISOString();
    csv += `${t},NAVE_001,24.5,68,43,0.0,2.1,CERRADA\n`;
  }
  res.send(csv);
});

// 8. Audit logs
router.get('/audit-logs', (req: Request, res: Response) => {
  res.json({
    total: db.auditLogs.length,
    logs: db.auditLogs
  });
});

// 9. VEGALINK AI Advisor
router.post('/ai/analyze', async (req: Request, res: Response) => {
  const { prompt, focusArea, targetNaveId } = req.body;
  const sampleContext = {
    metrics: db.getDashboardMetrics(),
    activeAlarms: db.alerts.filter(a => a.state === 'ACTIVA'),
    navesUnderStress: db.naves.filter(n => n.soilMoisture1 < 30 || n.temperature > 34).map(n => ({
      id: n.id,
      name: n.name,
      soilMoisture: n.soilMoisture1,
      temp: n.temperature,
      status: n.status
    }))
  };

  const analysis = await generateAgriAnalysis(prompt || 'Realiza un diagnóstico global del campo y recomendaciones de riego', sampleContext);
  res.json(analysis);
});

// 10. Simulation tick endpoint (allows user to test live updates)
router.post('/simulate/tick', (req: Request, res: Response) => {
  // Random small fluctuation to keep dashboard vibrant
  db.naves.forEach(n => {
    if (n.status !== 'OFFLINE') {
      n.temperature = Number((n.temperature + (Math.random() * 0.4 - 0.2)).toFixed(1));
      n.humidity = Math.max(30, Math.min(95, Math.round(n.humidity + (Math.random() * 2 - 1))));
      if (n.status !== 'REGANDO' && n.soilMoisture1 > 28) {
        n.soilMoisture1 = Math.max(25, Number((n.soilMoisture1 - 0.05).toFixed(1)));
      }
    }
  });
  res.json({ success: true, message: 'Tick de simulación ejecutado.' });
});

export default router;
