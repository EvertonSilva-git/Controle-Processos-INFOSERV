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

function findPublicLogos() {
  const publicDir = path.resolve(__dirname, 'public');
  const imagesDir = path.resolve(publicDir, 'images');
  const imageDir = path.resolve(publicDir, 'image');

  // Conforme solicitação do usuário:
  // logo_modoclaro.png -> Tema Modo Claro
  // logo_claro.png -> Tema Noturno / Escuro
  let lightLogo = '/images/logo_modoclaro.png';
  let darkLogo = '/images/logo_claro.png';

  const checkDirs = [
    { dir: imagesDir, prefix: '/images/' },
    { dir: publicDir, prefix: '/' },
    { dir: imageDir, prefix: '/image/' },
  ];

  for (const { dir, prefix } of checkDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const lower = f.toLowerCase();
        const isImg =
          lower.endsWith('.png') ||
          lower.endsWith('.jpg') ||
          lower.endsWith('.jpeg') ||
          lower.endsWith('.svg') ||
          lower.endsWith('.webp');

        if (!isImg) continue;

        // Regra do Usuário: logo_modoclaro -> Modo Claro
        if (
          lower === 'logo_modoclaro.png' ||
          lower === 'logo-modoclaro.png' ||
          lower.includes('modoclaro')
        ) {
          lightLogo = prefix + f;
        }

        // Regra do Usuário: logo_claro -> Tema Noturno
        if (
          lower === 'logo_claro.png' ||
          lower === 'logo-claro.png'
        ) {
          darkLogo = prefix + f;
        }
      }
    } catch (e) {
      console.error('Erro ao varrer diretório:', dir, e);
    }
  }

  return { lightLogo, darkLogo };
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

  // Global Logos API: Automatically detects any images placed in /public or /public/images
  app.get('/api/settings/logos', (_req, res) => {
    const { lightLogo, darkLogo } = findPublicLogos();
    res.json({
      customLogoLight: lightLogo,
      customLogoDark: darkLogo,
      autoDetected: true,
    });
  });

  app.post('/api/settings/logos', (_req, res) => {
    const { lightLogo, darkLogo } = findPublicLogos();
    res.json({
      success: true,
      message: 'Logotipos gerenciados automaticamente através da pasta /public.',
      customLogoLight: lightLogo,
      customLogoDark: darkLogo,
    });
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
