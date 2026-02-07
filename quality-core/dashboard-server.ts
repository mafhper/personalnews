// quality-core/dashboard-server.ts
import http from 'http'
import https from 'https'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { SnapshotStore } from './snapshots.store'
import { readDashboardCache, writeDashboardCache } from './dashboard-cache'

const PORT_DEFAULT = 3334
const DIST_DIR = path.join(process.cwd(), 'quality-core', 'dashboard', 'dist')
const CONFIG_FILE = path.join(__dirname, 'dashboard-config.json')
const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutos

let lastActivity = Date.now()

type LogLevel = 'error' | 'warn' | 'info' | 'debug'
const LOG_LEVEL: LogLevel =
  (process.env.DASHBOARD_LOG_LEVEL as LogLevel) ||
  (process.env.DASHBOARD_DEBUG === 'true' ? 'debug' : 'info')
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}
function log(level: LogLevel, message: string) {
  if (LOG_LEVELS[level] <= LOG_LEVELS[LOG_LEVEL]) {
    console.log(`[dashboard-${level}] ${message}`)
  }
}

const DASHBOARD_ROOT = path.join(process.cwd(), 'quality-core', 'dashboard')

async function checkDashboardBuild({ allowRebuild = true } = {}) {
  const issues: string[] = []
  const indexPath = path.join(DIST_DIR, 'index.html')
  let entryPath: string | null = null

  try {
    const html = await fs.readFile(indexPath, 'utf-8')
    const scriptMatch = html.match(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/i)
    if (!scriptMatch?.[1]) {
      issues.push('Entry script not found in index.html')
    } else {
      const entryRel = scriptMatch[1].replace(/^\/+/, '')
      entryPath = path.join(DIST_DIR, entryRel)
      try {
        const entryStat = await fs.stat(entryPath)
        if (entryStat.size < 1024) {
          issues.push(`Entry script too small (${entryStat.size} bytes): ${entryRel}`)
        }
      } catch {
        issues.push(`Entry script missing: ${entryRel}`)
      }
    }
  } catch {
    issues.push('index.html missing in dashboard dist')
  }

  const assetsDir = path.join(DIST_DIR, 'assets')
  try {
    const assets = await fs.readdir(assetsDir)
    const jsFiles = assets.filter(f => f.endsWith('.js'))
    if (jsFiles.length === 0) {
      issues.push('No JS assets found in dist/assets')
    } else {
      const zeroByte: string[] = []
      let hasNonTrivial = false
      for (const file of jsFiles) {
        const stat = await fs.stat(path.join(assetsDir, file))
        if (stat.size === 0) zeroByte.push(file)
        if (stat.size > 1024) hasNonTrivial = true
      }
      if (zeroByte.length > 0) {
        issues.push(`Zero-byte assets: ${zeroByte.slice(0, 3).join(', ')}${zeroByte.length > 3 ? '…' : ''}`)
      }
      if (!hasNonTrivial) {
        issues.push('All JS assets are empty or too small')
      }
    }
  } catch {
    issues.push('assets folder missing in dashboard dist')
  }

  if (issues.length > 0) {
    log('warn', 'Dashboard build appears invalid or incomplete.')
    issues.forEach(issue => log('warn', `- ${issue}`))
    log('info', 'Sugestão: execute `bun run build:dashboard` para regenerar o dist.')

    if (allowRebuild && process.env.DASHBOARD_AUTO_BUILD === 'true') {
      log('info', 'DASHBOARD_AUTO_BUILD=true -> tentando rebuild do dashboard...')
      await new Promise<void>((resolve) => {
        exec('bun run build', { cwd: DASHBOARD_ROOT }, (error, stdout, stderr) => {
          if (stdout) log('debug', stdout.trim())
          if (stderr) log('warn', stderr.trim())
          if (error) {
            log('warn', `Rebuild falhou: ${error.message}`)
          } else {
            log('info', 'Rebuild concluído.')
          }
          resolve()
        })
      })
      await checkDashboardBuild({ allowRebuild: false })
    }
  } else {
    log('debug', 'Dashboard build validation OK.')
  }

  return issues.length === 0
}

// Monitor de inatividade (Desativado se DASHBOARD_PERSISTENT=true)
if (process.env.DASHBOARD_PERSISTENT !== 'true') {
  setInterval(() => {
    const inactiveTime = Date.now() - lastActivity
    if (inactiveTime > INACTIVITY_TIMEOUT) {
      console.log(`[server-debug] Encerrando por inatividade (${Math.round(inactiveTime / 1000 / 60)}min)...`)
      process.exit(0)
    }
  }, 60 * 1000)
} else {
  console.log('[server-debug] Modo persistente ativado (Auto-off desativado)')
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function ensureConfig() {
  try {
    await fs.access(CONFIG_FILE)
  } catch {
    await fs.writeFile(CONFIG_FILE, JSON.stringify({
      githubUrl: 'https://mafhper.github.io/personalnews',
      refreshInterval: 60
    }, null, 2))
  }
}

async function startServer(port: number) {
  const server = http.createServer(async (req, res) => {
    lastActivity = Date.now()
    const requestStart = Date.now()
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url || '', `http://localhost:${port}`)

    res.on('finish', () => {
      const duration = Date.now() - requestStart
      log('debug', `${req.method} ${url.pathname} -> ${res.statusCode} (${duration}ms)`)
    })
    
    // API: Listar todos os snapshots
    if (url.pathname === '/api/snapshots' && req.method === 'GET') {
      try {
        const refresh = url.searchParams.get('refresh') === '1'
        const cached = refresh ? null : await readDashboardCache()
        const payload = cached || await writeDashboardCache()
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(payload))
      } catch (err: unknown) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }))
      }
      return
    }

    // API: Configurações
    if (url.pathname === '/api/config' && req.method === 'GET') {
      try {
        let config
        try {
          const content = await fs.readFile(CONFIG_FILE, 'utf-8')
          config = JSON.parse(content)
        } catch {
          // Arquivo não existe ou é inválido, retorna configurações padrão
          config = {
            githubUrl: 'https://mafhper.github.io/personalnews',
            refreshInterval: 60
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ success: true, data: config }))
      } catch (err: unknown) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }))
      }
      return
    }

    if (url.pathname === '/api/config' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', async () => {
        try {
          const config = JSON.parse(body)
          await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, data: config }))
        } catch (err: unknown) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }))
        }
      })
      return
    }

    // API: Conteúdo do Relatório Markdown
    if (url.pathname === '/api/reports/content' && req.method === 'GET') {
      const filename = url.searchParams.get('file')
      if (!filename) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ success: false, error: 'Filename required' }))
        return
      }
      try {
        const content = await SnapshotStore.getReportContent(filename)
        if (content) {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end(content)
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: false, error: 'Report not found' }))
        }
      } catch (err: unknown) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }))
      }
      return
    }

    // API: Medir Latência Real
    if (url.pathname === '/api/latency' && req.method === 'GET') {
      try {
        const config = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf-8'))
        const targetUrl = config.githubUrl || 'https://mafhper.github.io/personalnews'
        
        const start = Date.now()
        const client = targetUrl.startsWith('https') ? https : http
        
        const request = client.get(targetUrl, (response) => {
          const latency = Date.now() - start
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, latency, url: targetUrl }))
          response.resume() 
        })

        request.on('error', (err) => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: false, error: err.message, latency: 0 }))
        })
        
        request.setTimeout(5000, () => {
          request.destroy()
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: false, error: 'Timeout', latency: 0 }))
        })
        return
      } catch (err: unknown) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }))
      }
      return
    }

    // API: Executar Ações
    if (url.pathname === '/api/action' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => {
        try {
          const { action } = JSON.parse(body)
          let command = ''
          
          switch (action) {
            case 'run-tests':
              command = 'bun run test:all'
              break
            case 'generate-report':
              command = 'bun run audit:full'
              break
            default:
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
              res.end(JSON.stringify({ success: false, error: 'Invalid action' }))
              return
          }

          console.log(`[server-debug] Executing action: ${action} -> command: ${command}`);
          const start = Date.now();
          exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
            const duration = ((Date.now() - start) / 1000).toFixed(2);
            console.log(`[server-debug] Command finished in ${duration}s. Exit code: ${error ? error.code : 0}`);
            
            if (error) {
              console.error(`[server-debug] Exec error: ${error.message}`);
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
              res.end(JSON.stringify({ 
                success: false, 
                output: stdout, 
                error: stderr || error.message,
                code: error.code 
              }))
              return
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: true, output: stdout }))
          })

        } catch (err: unknown) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }))
        }
      })
      return
    }

    // Servir arquivos estáticos (Frontend)
    const rawPath = decodeURIComponent(url.pathname || '/')
    const safePath = rawPath.replace(/^\/+/, '')
    const normalizedPath = path.normalize(safePath).replace(/^(\.\.(\/|\\|$))+/, '')
    let filePath = path.join(DIST_DIR, normalizedPath || 'index.html')
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Forbidden')
      return
    }
    
    try {
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html')
      }

      const ext = path.extname(filePath)
      const baseMime = MIME_TYPES[ext] || 'application/octet-stream'
      // Forçar UTF-8 para texto e scripts
      const contentType = (baseMime.startsWith('text/') || baseMime === 'text/javascript' || baseMime === 'application/json') 
        ? `${baseMime}; charset=utf-8` 
        : baseMime

      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      })
      createReadStream(filePath).pipe(res)
    } catch {
      log('debug', `Arquivo nao encontrado: ${filePath}`)
      try {
        const indexPath = path.join(DIST_DIR, 'index.html')
        res.writeHead(200, { 'Content-Type': 'text/html' })
        createReadStream(indexPath).pipe(res)
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not Found')
      }
    }
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Porto ${port} em uso, tentando ${port + 1}...`)
      startServer(port + 1)
    } else {
      console.error(`
🛑 Erro no servidor: ${err.message}
`)
      process.exit(1)
    }
  })

  server.listen(port, async () => {
    await checkDashboardBuild()
    await ensureConfig()
    const snapshots = await SnapshotStore.list()
    const latest = snapshots.length > 0 ? snapshots[0] : null
    
    const snapshotsDir = path.join(process.cwd(), 'performance-reports', 'quality-snapshots')
    const jsonCount = await fs.readdir(snapshotsDir).then(f => f.filter(x => x.endsWith('.json')).length).catch(() => 0)
    const mdCount = snapshots.length - jsonCount
    const lhDir = path.join(process.cwd(), 'performance-reports', 'lighthouse')
    const lhCount = await fs.readdir(lhDir).then(f => f.filter(x => x.endsWith('.json')).length).catch(() => 0)

    console.log('\n🚀 [server-debug] Quality Core Dashboard v2.5')
    console.log('━'.repeat(50))
    console.log(`📊 URL:         http://localhost:${port}`)
    console.log(`⏳ Auto-off:    ${process.env.DASHBOARD_PERSISTENT === 'true' ? 'Desativado' : '15 minutos de inatividade'}`)
    console.log(`🛒 snapshots:   ${snapshots.length} total`)
    console.log(`   └─ [cache-debug] ${jsonCount} JSON snapshots`)
    console.log(`   └─ [parser-debug] ${mdCount} MD reports`)
    console.log(`   └─ [lh-debug] ${lhCount} Lighthouse reports`)
    
    if (latest) {
      console.log(`📌 Latest:      ${latest.commitHash} (${new Date(latest.timestamp).toLocaleString()})`)
      console.log(`📈 Score:       ${latest.healthScore}/100`)
    }
    console.log('━'.repeat(50))
  })
}

startServer(PORT_DEFAULT)
