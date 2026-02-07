const path = require('path')
const { spawn } = require('child_process')

const bunCmd = process.platform === 'win32' ? 'bun.exe' : 'bun'

function refreshDashboardCache({ silent = false } = {}) {
  return new Promise(resolve => {
    const scriptPath = path.resolve(__dirname, '../scripts/refresh-dashboard-cache.ts')
    const args = [scriptPath]
    if (silent) args.push('--quiet')
    const child = spawn(bunCmd, args, {
      stdio: silent ? 'ignore' : 'inherit',
      shell: false,
    })
    child.on('error', () => resolve(false))
    child.on('close', code => resolve(code === 0))
  })
}

module.exports = { refreshDashboardCache }
