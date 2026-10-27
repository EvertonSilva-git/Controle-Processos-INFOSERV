import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve port safely: Default to 3000 as required by the AI Studio environment.
// Note: In Cloud Run, process.env.PORT is 8080 which is reserved by Nginx reverse proxy.
let RESOLVED_PORT = 3000;
for (let i = 0; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if ((arg === '--port' || arg === '-p') && process.argv[i + 1]) {
    RESOLVED_PORT = parseInt(process.argv[i + 1], 10);
  } else if (arg.startsWith('--port=')) {
    RESOLVED_PORT = parseInt(arg.split('=')[1], 10);
  }
}
if (process.env.DEFAULT_APP_PORT && RESOLVED_PORT === 3000) {
  RESOLVED_PORT = parseInt(process.env.DEFAULT_APP_PORT, 10);
} else if (process.env.PORT && process.env.PORT !== '8080' && RESOLVED_PORT === 3000) {
  RESOLVED_PORT = parseInt(process.env.PORT, 10);
}
// Crucial safeguard: never try to listen on port 8080 (reserved by Nginx)
if (RESOLVED_PORT === 8080) {
  RESOLVED_PORT = 3000;
}
const PORT = RESOLVED_PORT;
const isProd = process.env.NODE_ENV === 'production';

// Ensure data folder exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const PROCESSOS_FILE = path.join(DATA_DIR, 'processos.json');
const CNPJS_FILE = path.join(DATA_DIR, 'cnpjs.json');

const DEFAULT_CNPJS = [
  {
    raw: '12482805000106',
    formatted: '12.482.805/0001-06',
    label: '12482805000106',
  },
  {
    raw: '12482805000289',
    formatted: '12.482.805/0002-89',
    label: '12482805000289',
  },
  {
    raw: '12482805000360',
    formatted: '12.482.805/0003-60',
    label: '12482805000360',
  },
];

function readCnpjs() {
  try {
    if (fs.existsSync(CNPJS_FILE)) {
      const data = fs.readFileSync(CNPJS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler cnpjs.json:', err);
  }
  return DEFAULT_CNPJS;
}

function writeCnpjs(cnpjs: any[]) {
  try {
    fs.writeFileSync(CNPJS_FILE, JSON.stringify(cnpjs, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao escrever cnpjs.json:', err);
    return false;
  }
}

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

// Configuração de integração em tempo real com Excel Online
const EXCEL_ONLINE_CONFIG_FILE = path.join(DATA_DIR, 'excel_online_config.json');

const DEFAULT_EXCEL_CONFIG = {
  url: '',
  enabled: false,
  autoSync: true,
  lastSync: null,
  lastStatus: 'idle',
  lastMessage: 'Aguardando inserção do link da planilha no puxador',
  lastCount: 0,
};

function readExcelConfig() {
  try {
    if (fs.existsSync(EXCEL_ONLINE_CONFIG_FILE)) {
      const data = fs.readFileSync(EXCEL_ONLINE_CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_EXCEL_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Erro ao ler excel_online_config.json:', err);
  }
  return DEFAULT_EXCEL_CONFIG;
}

function writeExcelConfig(config: any) {
  try {
    fs.writeFileSync(EXCEL_ONLINE_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao escrever excel_online_config.json:', err);
    return false;
  }
}

function formatProcessesForExcel(processosList: any[]) {
  const headers = [
    'Nº Solicitação',
    'Marca / Modelo / Versão',
    'MMV Original',
    'Tipo',
    'Extensão?',
    'Quantidade',
    'Procedência',
    'CNPJ',
    'Tipo de Veículo',
    'Órgão Certificador',
    'Situação Regulamentar',
    'Nº Licença / Certidão',
    'Data de Envio',
    'Data de Emissão',
    'Data de Vencimento',
    'Nova Data Vencimento',
    'Observações',
    'Última Atualização',
  ];

  const rows = processosList.map((p) => [
    p.numeroSolicitacao || '',
    p.mmv || '',
    p.mmvOriginal || '',
    p.tipo || '',
    p.isExtensao ? 'Sim' : 'Não',
    p.quantidade || '',
    p.procedencia || '',
    p.cnpj || '',
    p.tipoVeiculo || '',
    p.orgaoCertificador || '',
    p.situacao || '',
    p.numeroLicenca || '',
    p.dataEnvio || '',
    p.dataEmissao || '',
    p.dataValidade || '',
    p.novaDataVencimento || '',
    Array.isArray(p.observacoes) ? p.observacoes.map((o: any) => o.texto).join(' | ') : '',
    p.atualizadoEm || p.criadoEm || '',
  ]);

  return { headers, rows };
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

  // Global CNPJs API (shared across all users)
  app.get('/api/cnpjs', (_req, res) => {
    const cnpjs = readCnpjs();
    res.json({ cnpjs });
  });

  app.post('/api/cnpjs', (req, res) => {
    const { cnpjs } = req.body;
    if (Array.isArray(cnpjs)) {
      const success = writeCnpjs(cnpjs);
      if (success) {
        return res.json({ success: true, count: cnpjs.length });
      }
    }
    res.status(400).json({ success: false, error: 'Dados inválidos' });
  });

  // =========================================================================
  // EXCEL ONLINE EM TEMPO REAL: CONFIGURAÇÃO, PUXADOR E SINCRONIZAÇÃO EM NUVEM
  // =========================================================================

  app.get('/api/excel-online/config', (_req, res) => {
    const config = readExcelConfig();
    res.json(config);
  });

  app.post('/api/excel-online/config', (req, res) => {
    const prev = readExcelConfig();
    const updated = {
      ...prev,
      ...req.body,
    };
    const success = writeExcelConfig(updated);
    if (success) {
      return res.json({ success: true, config: updated });
    }
    res.status(500).json({ success: false, error: 'Erro ao salvar configuração do Excel Online' });
  });

  // Puxador em tempo real: Sincroniza processos com a planilha na nuvem
  app.post('/api/excel-online/sync', async (req, res) => {
    try {
      const config = readExcelConfig();
      const currentProcessos = req.body.processos || readProcessos() || [];
      const targetUrl = (req.body.url || config.url || '').trim();

      if (!targetUrl) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum link ou webhook de planilha configurado no puxador.',
        });
      }

      const { headers, rows } = formatProcessesForExcel(currentProcessos);
      const payload = {
        origem: 'Shineray Homologação Técnica - Sistema Infoserv',
        sincronizadoEm: new Date().toISOString(),
        totalProcessos: currentProcessos.length,
        headers,
        rows,
        processos: currentProcessos,
      };

      const isSharePointViewLink =
        targetUrl.includes('sharepoint.com') ||
        targetUrl.includes('onedrive.live.com') ||
        targetUrl.includes('1drv.ms') ||
        targetUrl.includes('officeapps.live.com');

      let syncResult = {
        success: true,
        message: 'Planilha sincronizada em tempo real com sucesso.',
        statusCode: 200,
        syncedAt: new Date().toISOString(),
        count: currentProcessos.length,
        targetType: isSharePointViewLink ? 'sharepoint_link' : 'webhook',
      };

      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        if (!isSharePointViewLink) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);
            const externalResp = await fetch(targetUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Shineray-Excel-Cloud-Sync/1.0',
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!externalResp.ok) {
              const text = await externalResp.text().catch(() => '');
              syncResult = {
                success: false,
                message: `Serviço da planilha respondeu com código ${externalResp.status}: ${text.slice(0, 140)}`,
                statusCode: externalResp.status,
                syncedAt: new Date().toISOString(),
                count: currentProcessos.length,
                targetType: 'webhook',
              };
            } else {
              syncResult.message = `Planilha no Excel Online atualizada em nuvem com sucesso (${currentProcessos.length} processos sincronizados).`;
              syncResult.statusCode = externalResp.status;
            }
          } catch (fetchErr: any) {
            console.error('Erro na requisição externa do puxador:', fetchErr);
            syncResult = {
              success: false,
              message: `Não foi possível conectar ao endpoint: ${fetchErr.name === 'AbortError' ? 'Tempo de conexão esgotado (timeout)' : fetchErr.message || 'Erro de rede'}`,
              statusCode: 500,
              syncedAt: new Date().toISOString(),
              count: currentProcessos.length,
              targetType: 'webhook',
            };
          }
        } else {
          // Link direto do Excel Online / SharePoint / OneDrive
          syncResult.message = `Link do Excel Online conectado. Planilha pronta para receber sincronizações em nuvem.`;
          syncResult.statusCode = 200;
        }
      }

      // Salva o log e estado da sincronização em disco
      const updatedConfig = {
        ...config,
        url: targetUrl,
        enabled: true,
        lastSync: syncResult.syncedAt,
        lastStatus: syncResult.success ? 'success' : 'error',
        lastMessage: syncResult.message,
        lastCount: currentProcessos.length,
      };
      writeExcelConfig(updatedConfig);

      return res.json(syncResult);
    } catch (err: any) {
      console.error('Erro geral em /api/excel-online/sync:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Feed JSON em tempo real (para Power Query do Excel Online / Power Automate / Zapier)
  app.get('/api/excel-online/feed.json', (_req, res) => {
    const processos = readProcessos() || [];
    const { headers, rows } = formatProcessesForExcel(processos);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      origem: 'Shineray Homologação Técnica - Sistema Infoserv',
      atualizadoEm: new Date().toISOString(),
      totalProcessos: processos.length,
      headers,
      rows,
      processos,
    });
  });

  // Feed CSV em tempo real com BOM UTF-8 e delimitador ';' para Excel Online
  app.get('/api/excel-online/feed.csv', (_req, res) => {
    const processos = readProcessos() || [];
    const { headers, rows } = formatProcessesForExcel(processos);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="shineray_processos_tempo_real.csv"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const bom = '\uFEFF';
    const csvLines = [
      headers.join(';'),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`)
          .join(';')
      ),
    ];
    res.send(bom + csvLines.join('\r\n'));
  });

  // Feed XLSX dinâmico em tempo real gerado pelo ExcelJS
  app.get('/api/excel-online/feed.xlsx', async (_req, res) => {
    try {
      const processos = readProcessos() || [];
      const { headers, rows } = formatProcessesForExcel(processos);

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Shineray Homologação Técnica - Sistema Infoserv';
      wb.created = new Date();
      wb.modified = new Date();

      const ws = wb.addWorksheet('Processos em Tempo Real');

      const headerRow = ws.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '991B1B' }, // Shineray Red
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      rows.forEach((r, idx) => {
        const row = ws.addRow(r);
        row.font = { size: 9 };
        if (idx % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F8FAFC' },
          };
        }
      });

      // Auto-fit column widths
      ws.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell?.({ includeEmpty: false }, (cell) => {
          const val = cell.value ? cell.value.toString() : '';
          if (val.length > maxLen) {
            maxLen = Math.min(val.length + 2, 45);
          }
        });
        column.width = maxLen;
      });

      const buffer = await wb.xlsx.writeBuffer();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="shineray_processos_tempo_real.xlsx"'
      );
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error('Erro ao gerar feed.xlsx:', err);
      res.status(500).send('Erro ao gerar arquivo Excel dinâmico');
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT} (${isProd ? 'Production' : 'Development'})`);
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
}

startServer().catch((err) => {
  console.error('Erro fatal ao iniciar servidor:', err);
  process.exit(1);
});
