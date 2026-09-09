import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parsing for incoming LoRaWAN webhooks and API calls
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging for IoT Telemetry and commands
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/telemetry') || req.path.startsWith('/api/irrigation')) {
      console.log(`[IoT API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'VEGALINK IoT Core',
      version: '2.4.0',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VEGALINK] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
