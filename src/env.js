const fs = require('fs');

function loadEnvFile(filePath, options = {}) {
  const overwrite = Boolean(options.overwrite);
  try {
    if (!filePath || !fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && (overwrite || process.env[key] === undefined)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore unreadable env files.
  }
}

function loadEnv(paths = [], options = {}) {
  for (const filePath of paths) {
    loadEnvFile(filePath, options);
  }
}

module.exports = { loadEnv, loadEnvFile };
