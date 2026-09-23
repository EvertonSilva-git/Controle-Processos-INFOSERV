import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Ensure data folder exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const PROCESSOS_FILE = path.join(DATA_DIR, 'processos.json');

// Default initial settings
const DEFAULT_SETTINGS = {
  customLogoLight: null,
  customLogoDark: null,
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao ler settings.json:', err);
  }
  return DEFAULT_SETTINGS;
}

function writeSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao escrever settings.json:', err);
    return false;
  }
}

function readProcessos() {
  try {
    if (fs.existsSync(PROCESSOS_FILE)) {
      const data = fs.readFileSync(PROCESSOS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler processos.json:', err);
  }
  return null;
}

function writeProcessos(processos: any[]) {
  try {
    fs.writeFileSync(PROCESSOS_FILE, JSON.stringify(processos, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao escrever processos.json:', err);
    return false;
  }
}

async function startServer() {
  const app = express();

  // Support JSON payload up to 25MB for image uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global Logos API (persisted on server for ALL users)
  app.get('/api/settings/logos', (_req, res) => {
    const settings = readSettings();
    res.json({
      customLogoLight: settings.customLogoLight || null,
      customLogoDark: settings.customLogoDark || null,
    });
  });

  app.post('/api/settings/logos', (req, res) => {
    const { customLogoLight, customLogoDark } = req.body;
    const current = readSettings();
    const updated = {
      ...current,
      customLogoLight: customLogoLight !== undefined ? customLogoLight : current.customLogoLight,
      customLogoDark: customLogoDark !== undefined ? customLogoDark : current.customLogoDark,
    };

    const success = writeSettings(updated);
    if (success) {
      res.json({
        success: true,
        customLogoLight: updated.customLogoLight,
        customLogoDark: updated.customLogoDark,
      });
    } else {
      res.status(500).json({ success: false, error: 'Falha ao salvar configurações' });
    }
  });

  // Global Processos API (shared across all users)
  app.get('/api/processos', (_req, res) => {
    const processos = readProcessos();
    res.json({ processos });
  });

  app.post('/api/processos', (req, res) => {
    const { processos } = req.body;
    if (Array.isArray(processos)) {
      const success = writeProcessos(processos);
      if (success) {
        return res.json({ success: true, count: processos.length });
      }
    }
    res.status(400).json({ success: false, error: 'Dados inválidos' });
  });

  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT} (${isProd ? 'Production' : 'Development'})`);
  });
}

startServer().catch((err) => {
  console.error('Erro fatal ao iniciar servidor:', err);
  process.exit(1);
});
