/**
 * Performance Dashboard Server
 * 
 * Servidor HTTP para análise de performance web com integração ao Lighthouse CLI.
 * 
 * Funcionalidades:
 * - Servir arquivos estáticos do dashboard
 * - API para execução de scripts de qualidade e performance
 * - Ingestão e processamento de relatórios Lighthouse (JSON)
 * - Leitura e conversão de logs Markdown para HTML
 * - Suporte a relatórios manuais de extensões de browser
 * - Detecção inteligente de portas disponíveis
 * - Streaming de output em tempo real
 * 
 * @author Sistema de Performance
 * @version 1.0.0
 */

const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { marked } = require('marked');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
  basePort: 3333,
  maxPortAttempts: 10,
  staticDir: path.join(__dirname, 'public'),
  reportsDir: path.join(process.cwd(), 'performance-reports'),
  lighthouseDir: path.join(process.cwd(), 'performance-reports', 'lighthouse'),
  qualityDir: path.join(process.cwd(), 'performance-reports', 'quality'),
  manualDir: path.join(process.cwd(), 'performance-reports', 'manual'),
  logsDir: path.join(process.cwd(), 'docs', 'logs'),
  allowedCommands: {
    'quality': 'npm run quality',
    'lighthouse': 'npm run perf:lighthouse'
  }
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Verifica se uma porta está disponível
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = http.createServer();

    server.once('error', (err) => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Encontra a próxima porta disponível
 */
async function findAvailablePort(startPort) {
  for (let i = 0; i < CONFIG.maxPortAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Nenhuma porta disponível entre ${startPort} e ${startPort + CONFIG.maxPortAttempts - 1}`);
}

/**
 * Garante que um diretório existe
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Lê arquivos JSON de um diretório
 */
async function readJsonFiles(dirPath) {
  try {
    await ensureDirectory(dirPath);
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const data = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
          return {
            filename: file,
            data: JSON.parse(content),
            timestamp: (await fs.stat(path.join(dirPath, file))).mtime
          };
        } catch (err) {
          console.error(`Erro ao ler ${file}:`, err.message);
          return null;
        }
      })
    );

    return data.filter(Boolean).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    console.error(`Erro ao ler diretório ${dirPath}:`, err.message);
    return [];
  }
}

/**
 * Lê e converte arquivos Markdown para HTML
 */
async function readMarkdownFiles(dirPath) {
  try {
    await ensureDirectory(dirPath);
    const files = await fs.readdir(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const data = await Promise.all(
      mdFiles.map(async (file) => {
        try {
          const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
          return {
            filename: file,
            markdown: content,
            html: marked.parse(content),
            timestamp: (await fs.stat(path.join(dirPath, file))).mtime
          };
        } catch (err) {
          console.error(`Erro ao ler ${file}:`, err.message);
          return null;
        }
      })
    );

    return data.filter(Boolean).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    console.error(`Erro ao ler diretório ${dirPath}:`, err.message);
    return [];
  }
}

/**
 * Obtém tipo MIME baseado na extensão do arquivo
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ============================================================================
// HANDLERS DE ROTA
// ============================================================================

/**
 * Serve arquivos estáticos
 */
async function handleStaticFile(req, res) {
  try {
    let filePath = path.join(CONFIG.staticDir, req.url === '/' ? 'index.html' : req.url);

    // Fallback para index.html se não encontrar (SPA behavior) - Opcional, mas util
    // Mas aqui estamos servindo arquivos específicos. Se não achar, 404.

    // Segurança: prevenir path traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(CONFIG.staticDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Acesso negado');
      return;
    }

    const stats = await fs.stat(filePath).catch(() => null);
    if (!stats || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Arquivo não encontrado');
      return;
    }

    const content = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erro interno do servidor');
  }
}

/**
 * API: Lista relatórios Lighthouse
 */
async function handleLighthouseReports(req, res) {
  const reports = await readJsonFiles(CONFIG.lighthouseDir);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data: reports }));
}

/**
 * API: Lista relatórios Quality Core
 */
async function handleQualityReports(req, res) {
  const reports = await readJsonFiles(CONFIG.qualityDir);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data: reports }));
}

/**
 * API: Lista relatórios manuais
 */
async function handleManualReports(req, res) {
  const reports = await readJsonFiles(CONFIG.manualDir);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data: reports }));
}

/**
 * API: Lista e converte logs Markdown
 */
async function handleLogs(req, res) {
  const logs = await readMarkdownFiles(CONFIG.logsDir);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data: logs }));
}

/**
 * API: Executa comando e retorna output em streaming
 */
async function handleRunCommand(req, res, commandKey) {
  // POST method for actions is standard
  if (req.method !== 'GET' && req.method !== 'POST') { // EventSource uses GET
    // Wait, standard EventSource uses GET. So we should allow GET.
  }

  if (!CONFIG.allowedCommands[commandKey]) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Comando não permitido' }));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const command = CONFIG.allowedCommands[commandKey];
  // Detect if windows for npm execution
  const isWin = /^win/.test(process.platform);
  const shell = isWin ? 'powershell.exe' : '/bin/sh'; // Better shell handling
  // Simple split might fail with complex args, but valid for "npm run x"
  const [cmd, ...args] = command.split(' ');

  res.write(`data: ${JSON.stringify({ type: 'start', command })}\n\n`);

  const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', args, {
    cwd: process.cwd(),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' } // Preserve colors
  });

  child.stdout.on('data', (data) => {
    // Clean ANSI codes if needed, or send raw if frontend handles it. 
    // Frontend currently just prints. Let's strip simple ANSI for now or keep it raw.
    // Keeping raw makes it messy in simple HTML without a library.
    // Let's strip basic ANSI for cleanliness
    const output = data.toString().replace(/\x1B\[\d+m/g, '');
    res.write(`data: ${JSON.stringify({ type: 'stdout', output })}\n\n`);
  });

  child.stderr.on('data', (data) => {
    const output = data.toString().replace(/\x1B\[\d+m/g, '');
    res.write(`data: ${JSON.stringify({ type: 'stderr', output })}\n\n`);
  });

  child.on('close', (code) => {
    res.write(`data: ${JSON.stringify({ type: 'close', code })}\n\n`);
    res.end();
  });

  child.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  });

  req.on('close', () => {
    try { child.kill(); } catch { }
  });
}

/**
 * API: Obtém relatório específico
 */
async function handleGetReport(req, res, type, filename) {
  try {
    const dirMap = {
      'lighthouse': CONFIG.lighthouseDir,
      'quality': CONFIG.qualityDir,
      'manual': CONFIG.manualDir
    };

    const dir = dirMap[type];
    if (!dir) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Tipo de relatório inválido' }));
      return;
    }

    const filePath = path.join(dir, filename);
    const normalizedPath = path.normalize(filePath);

    if (!normalizedPath.startsWith(dir)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Acesso negado' }));
      return;
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data }));
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Relatório não encontrado' }));
  }
}

// ============================================================================
// GIT OPERATIONS HANDLERS
// ============================================================================

/**
 * Executa um comando git e retorna o resultado
 */
function execGitCommand(args) {
  return new Promise((resolve, reject) => {
    const { execSync } = require('child_process');
    try {
      const result = execSync(`git ${args}`, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        timeout: 30000
      });
      resolve(result.trim());
    } catch (err) {
      reject(new Error(err.stderr || err.message));
    }
  });
}

/**
 * API: Git status
 */
async function handleGitStatus(req, res) {
  try {
    const status = await execGitCommand('status --porcelain');
    const branch = await execGitCommand('branch --show-current');
    const lastCommit = await execGitCommand('log -1 --pretty=format:"%h %s"');

    const files = status.split('\n').filter(Boolean).map(line => ({
      status: line.substring(0, 2).trim(),
      file: line.substring(3)
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: { branch, lastCommit, files, hasChanges: files.length > 0 }
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}

/**
 * API: Git commit - expects JSON body with { message, files? }
 */
async function handleGitCommit(req, res) {
  try {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { message, files } = JSON.parse(body);
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Message required' }));
          return;
        }

        // Add files (all or specific)
        if (files && files.length > 0) {
          await execGitCommand(`add ${files.join(' ')}`);
        } else {
          await execGitCommand('add .');
        }

        // Commit
        const result = await execGitCommand(`commit -m "${message.replace(/"/g, '\\"')}"`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: result }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}

/**
 * API: Git push
 */
async function handleGitPush(req, res) {
  try {
    const result = await execGitCommand('push');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: result }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}

/**
 * API: PageSpeed proxy - avoids CORS issues in browser
 */
async function handlePageSpeed(req, res, urlObj) {
  try {
    const targetUrl = urlObj.searchParams.get('url');
    const apiKey = urlObj.searchParams.get('key') || '';
    const strategy = urlObj.searchParams.get('strategy') || 'mobile';

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'URL parameter required' }));
      return;
    }

    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo${apiKey ? `&key=${apiKey}` : ''}`;

    const https = require('https');
    https.get(psiUrl, (psiRes) => {
      let data = '';
      psiRes.on('data', chunk => data += chunk);
      psiRes.on('end', () => {
        res.writeHead(psiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}

// ============================================================================
// ROTEADOR PRINCIPAL
// ============================================================================

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // API Routes
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/reports/lighthouse' && req.method === 'GET') return handleLighthouseReports(req, res);
    if (pathname === '/api/reports/quality' && req.method === 'GET') return handleQualityReports(req, res);
    if (pathname === '/api/reports/manual' && req.method === 'GET') return handleManualReports(req, res);
    if (pathname === '/api/logs' && req.method === 'GET') return handleLogs(req, res);

    // Note: EventSource uses GET
    if (pathname === '/api/run/quality') return handleRunCommand(req, res, 'quality');
    if (pathname === '/api/run/lighthouse') return handleRunCommand(req, res, 'lighthouse');

    // Git operations
    if (pathname === '/api/git/status' && req.method === 'GET') return handleGitStatus(req, res);
    if (pathname === '/api/git/commit' && req.method === 'POST') return handleGitCommit(req, res);
    if (pathname === '/api/git/push' && req.method === 'POST') return handleGitPush(req, res);

    // PageSpeed proxy (to avoid CORS in browser)
    if (pathname === '/api/pagespeed' && req.method === 'GET') return handlePageSpeed(req, res, url);

    const reportMatch = pathname.match(/^\/api\/report\/(lighthouse|quality|manual)\/(.+)$/);
    if (reportMatch && req.method === 'GET') return handleGetReport(req, res, reportMatch[1], reportMatch[2]);

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Endpoint não encontrado' }));
    return;
  }

  // Arquivos estáticos
  return handleStaticFile(req, res);
}

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

async function startServer() {
  try {
    await ensureDirectory(CONFIG.staticDir);
    await ensureDirectory(CONFIG.lighthouseDir);
    await ensureDirectory(CONFIG.qualityDir);
    await ensureDirectory(CONFIG.manualDir);
    await ensureDirectory(CONFIG.logsDir);

    const port = await findAvailablePort(CONFIG.basePort);
    const server = http.createServer(router);

    server.listen(port, () => {
      console.log('\n🚀 Performance Dashboard Server');
      console.log('━'.repeat(50));
      console.log(`📊 URL: http://localhost:${port}`);
      console.log('━'.repeat(50));
    });

    server.on('error', (err) => {
      console.error('❌ Erro no servidor:', err.message);
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer, CONFIG };
