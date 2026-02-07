const fs = require('fs');
const path = require('path');

const requiredDirs = [
    'src',
    'public',
    '__tests__',
    'config',
    'quality-core/scripts'
];

const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    '.gitignore'
];

console.log('Verificando pastas obrigatórias:');
for (const dir of requiredDirs) {
    const fullPath = path.join(process.cwd(), dir);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${dir}: ${exists ? 'existe' : 'FALTANDO'}`);
}

console.log('\nVerificando arquivos obrigatórios:');
for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'existe' : 'FALTANDO'}`);
}