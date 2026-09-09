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
  const { greenhouseId, action, durationMinutes, user } = req.body;
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
