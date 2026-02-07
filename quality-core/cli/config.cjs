const path = require('path')

const root = path.join(__dirname, '..', '..') // Volta dois níveis para o diretório raiz do projeto

module.exports = {
  paths: {
    root: root,
    logs: path.join(root, 'performance-reports', 'logs'),
    lighthouse: path.join(root, 'performance-reports', 'lighthouse'),
    reports: path.join(root, 'performance-reports', 'quality'),
    scripts: path.join(root, 'quality-core', 'scripts'),
  },
  requiredDirs: [
    'src',
    'public',
    '__tests__',
    'config',
    'quality-core/scripts'
  ],
  requiredFiles: [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    '.gitignore'
  ],
}
