/**
 * JSON Reporter
 * Helpers to save JSON output.
 */
const fs = require('fs');
const path = require('path');

function save(result, dir, filename) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filepath = path.join(dir, filename);
    const content = JSON.stringify(result, null, 2);

    fs.writeFileSync(filepath, content);
    return filepath;
}

module.exports = { save };
