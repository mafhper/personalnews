const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const basePath = '/personalnews';
const distDir = path.resolve(__dirname, '..', 'dist');

const parsePort = (value, fallback) => {
  const port = Number.parseInt(value ?? '', 10);
  return Number.isFinite(port) && port > 0 ? port : fallback;
};

const parseArgs = (argv) => {
  const options = {
    host: process.env.PREVIEW_HOST || 'localhost',
    port: parsePort(process.env.PREVIEW_PORT || process.env.PORT, 4175),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === '--host' && next) {
      options.host = next;
      index += 1;
      continue;
    }

    if (token === '--port' && next) {
      options.port = parsePort(next, options.port);
      index += 1;
    }
  }

  return options;
};

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const resolvePublicPath = (pathname) => {
  if (!pathname.startsWith(basePath)) return null;

  const relativePath = pathname.slice(basePath.length) || '/';
  const normalized = path.posix.normalize(relativePath);
  if (normalized.includes('..')) return null;

  return normalized;
};

const sendResponse = (res, statusCode, headers, body) => {
  res.writeHead(statusCode, headers);
  res.end(body);
};

const sendFile = (req, res, filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  const stats = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Length': stats.size,
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
};

const serveIndex = (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  sendFile(req, res, indexPath);
};

const { host, port } = parseArgs(process.argv.slice(2));

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[promo] dist/index.html not found. Run "bun vite build" first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    sendResponse(res, 405, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Method not allowed');
    return;
  }

  const origin = `http://${req.headers.host || `${host}:${port}`}`;
  const pathname = new URL(req.url || '/', origin).pathname;

  if (pathname === '/' || pathname === '') {
    sendResponse(
      res,
      302,
      { Location: `${basePath}/` },
      ''
    );
    return;
  }

  const relativePath = resolvePublicPath(pathname);
  if (relativePath === null) {
    sendResponse(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
    return;
  }

  if (relativePath === '/' || relativePath === '') {
    serveIndex(req, res);
    return;
  }

  const safeRelativePath = relativePath.replace(/^\/+/, '');
  const filePath = path.join(distDir, safeRelativePath);
  const hasExtension = path.extname(relativePath) !== '';

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(req, res, filePath);
    return;
  }

  if (hasExtension) {
    sendResponse(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Asset not found');
    return;
  }

  serveIndex(req, res);
});

server.listen(port, host, () => {
  console.log(`[promo] Preview available at http://${host}:${port}${basePath}/`);
});

server.on('error', (error) => {
  console.error(`[promo] Failed to start server: ${error.message}`);
  process.exit(1);
});
