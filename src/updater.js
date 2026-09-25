const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

function parseVersionParts(version) {
  const match = String(version || '').trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isNewerVersion(remote, current) {
  const remoteParts = parseVersionParts(remote);
  const currentParts = parseVersionParts(current);
  if (!remoteParts || !currentParts) return false;
  for (let i = 0; i < 3; i += 1) {
    if (remoteParts[i] > currentParts[i]) return true;
    if (remoteParts[i] < currentParts[i]) return false;
  }
  return false;
}

function parseBooleanFlag(value) {
  const raw = String(value || '').trim().toLowerCase();
  return ['true', '1', 'yes', 'required', 'mandatory'].includes(raw);
}

function parseVersionFile(text) {
  const rawLines = String(text || '').split(/\r?\n/);

  let version = '';
  let downloadUrl = '';
  let necessary = false;
  const features = [];
  const noteLines = [];

  let activeSection = null; // 'features' | 'notes' | null

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip comment lines (unless bullet or note in section)
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    // Section headers: e.g. [features], features:, [notes], notes:, changelog:, whatsnew:
    const sectionMatch = trimmed.match(/^\[?(features?|whats_?new|changelog|changes|notes?|release_notes?)\]?:?$/i);
    if (sectionMatch) {
      const sec = sectionMatch[1].toLowerCase();
      if (sec.startsWith('note') || sec.startsWith('release_note')) {
        activeSection = 'notes';
      } else {
        activeSection = 'features';
      }
      continue;
    }

    const versionMatch = trimmed.match(/^version\s*=\s*(.+)$/i);
    const urlMatch = trimmed.match(/^(?:url|download|link)\s*=\s*(.+)$/i);
    const necessaryMatch = trimmed.match(/^(?:necessary|necessity|required|mandatory)\s*=\s*(.+)$/i);
    const featureSingleMatch = trimmed.match(/^(?:feature|feat)\s*=\s*(.+)$/i);
    const featuresListMatch = trimmed.match(/^(?:features|whats_?new|changelog|changes)\s*=\s*(.+)$/i);
    const notesMatch = trimmed.match(/^(?:notes?|release_notes?|description)\s*=\s*(.+)$/i);

    if (versionMatch) {
      activeSection = null;
      version = versionMatch[1].trim();
      continue;
    }
    if (urlMatch) {
      activeSection = null;
      downloadUrl = urlMatch[1].trim();
      continue;
    }
    if (necessaryMatch) {
      activeSection = null;
      necessary = parseBooleanFlag(necessaryMatch[1]);
      continue;
    }
    if (featureSingleMatch) {
      features.push(featureSingleMatch[1].trim());
      continue;
    }
    if (featuresListMatch) {
      const val = featuresListMatch[1].trim();
      if (/[;,|]/.test(val)) {
        val.split(/[;,|]/).map((s) => s.trim()).filter(Boolean).forEach((f) => features.push(f));
      } else {
        features.push(val);
      }
      continue;
    }
    if (notesMatch) {
      noteLines.push(notesMatch[1].trim());
      continue;
    }

    // Bullet points (e.g. "- Feature", "* Feature", "• Feature", "1. Feature")
    const bulletMatch = trimmed.match(/^[-*•+]\s*(.+)$/) || trimmed.match(/^\d+\.\s*(.+)$/);
    if (bulletMatch) {
      const item = bulletMatch[1].trim();
      if (activeSection === 'notes') {
        noteLines.push(item);
      } else {
        features.push(item);
      }
      continue;
    }

    // Plain lines in active sections
    if (activeSection === 'features') {
      features.push(trimmed);
      continue;
    }
    if (activeSection === 'notes') {
      noteLines.push(trimmed);
      continue;
    }

    // Fallbacks for simple format
    if (!version && /^v?\d+\.\d+\.\d+([.-][\w.-]+)?$/i.test(trimmed)) {
      version = trimmed.replace(/^v/i, '');
      continue;
    }
    if (!downloadUrl && /^https?:\/\//i.test(trimmed)) {
      downloadUrl = trimmed;
    }
  }

  const cleanFeatures = [...new Set(features.map((f) => f.trim()).filter(Boolean))];
  const notes = noteLines.join('\n').trim();

  // If no features were explicitly given but bullet notes were provided, use them as features
  if (cleanFeatures.length === 0 && noteLines.length > 0) {
    cleanFeatures.push(...noteLines);
  }

  return {
    version: version.replace(/^v/i, ''),
    downloadUrl: downloadUrl.trim(),
    necessary,
    features: cleanFeatures,
    notes
  };
}

function versionFileUrlFromRepo(repoUrl, branch = 'main') {
  const raw = String(repoUrl || '').trim();
  if (!raw) return '';

  if (/version\.txt(?:$|[?#])/i.test(raw)) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.hostname === 'raw.githubusercontent.com') {
      const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      if (parts.length >= 2) {
        return raw;
      }
    }
    if (parsed.hostname === 'github.com') {
      const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      if (parts.length >= 2) {
        const [owner, repo] = parts;
        const cleanBranch = String(branch || 'main').trim() || 'main';
        return `https://raw.githubusercontent.com/${owner}/${repo}/${cleanBranch}/version.txt`;
      }
    }
  } catch {
    return '';
  }

  return '';
}

function fetchText(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let requestUrl;
    try {
      requestUrl = new URL(url);
    } catch (error) {
      reject(error);
      return;
    }

    const transport = requestUrl.protocol === 'http:' ? http : https;
    const request = transport.get(requestUrl, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchText(response.headers.location, timeoutMs).then(resolve).catch(reject);
        response.resume();
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Update check failed (${response.statusCode || 'unknown'})`));
        response.resume();
        return;
      }

      const chunks = [];
      response.setEncoding('utf8');
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(chunks.join('')));
    });

    request.on('error', reject);
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error('Update check timed out'));
    });
  });
}

function resolveVersionFileUrl() {
  const directUrl = String(process.env.FAIBILO_VERSION_URL || '').trim();
  if (directUrl) return directUrl;

  const repoUrl = String(process.env.FAIBILO_UPDATE_REPO || '').trim();
  if (!repoUrl) return '';

  const branch = String(process.env.FAIBILO_UPDATE_BRANCH || 'main').trim() || 'main';
  return versionFileUrlFromRepo(repoUrl, branch);
}

function installerFileName(downloadUrl, version) {
  try {
    const parsed = new URL(downloadUrl);
    const base = path.basename(parsed.pathname);
    if (base && base.includes('.')) return base;
  } catch {
    // Fall through to generated name.
  }
  return `Faibilo-Setup-${version || 'latest'}.exe`;
}

function downloadUpdateFile(downloadUrl, destinationPath, onProgress, timeoutMs = 300000) {
  return new Promise((resolve, reject) => {
    let requestUrl;
    try {
      requestUrl = new URL(downloadUrl);
    } catch (error) {
      reject(error);
      return;
    }

    const transport = requestUrl.protocol === 'http:' ? http : https;
    const request = transport.get(requestUrl, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadUpdateFile(response.headers.location, destinationPath, onProgress, timeoutMs)
          .then(resolve)
          .catch(reject);
        response.resume();
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed (${response.statusCode || 'unknown'})`));
        response.resume();
        return;
      }

      const totalBytes = Number.parseInt(response.headers['content-length'] || '0', 10) || 0;
      let downloadedBytes = 0;
      const fileStream = fs.createWriteStream(destinationPath);

      // Throttle progress callbacks — fire at most once per 300 ms so the
      // progress handler doesn't compete with the download stream itself.
      let lastProgressAt = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (typeof onProgress === 'function') {
          const now = Date.now();
          if (now - lastProgressAt >= 300) {
            lastProgressAt = now;
            const percent = totalBytes
              ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
              : Math.min(99, Math.round(downloadedBytes / (1024 * 1024)));
            onProgress({ percent, downloadedBytes, totalBytes });
          }
        }
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        // Always fire a final 100% progress event
        if (typeof onProgress === 'function') {
          onProgress({ percent: 100, downloadedBytes, totalBytes: totalBytes || downloadedBytes });
        }
        fileStream.close(() => resolve(destinationPath));
      });

      fileStream.on('error', (error) => {
        fs.unlink(destinationPath, () => reject(error));
      });
    });

    request.on('error', reject);
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error('Download timed out'));
    });
  });
}

function runUpdateInstaller(installerPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(installerPath)) {
      reject(new Error('Installer file was not found'));
      return;
    }

    if (process.platform === 'win32') {
      // Spawn via cmd /c start so the installer is fully detached from the
      // Electron process tree and can request UAC elevation on its own.
      const child = spawn('cmd.exe', ['/c', 'start', '', installerPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      });
      child.on('error', reject);
      child.unref();
      setTimeout(() => resolve(installerPath), 600);
      return;
    }

    const opener = spawn(installerPath, [], {
      detached: true,
      stdio: 'ignore'
    });
    opener.on('error', reject);
    opener.unref();
    resolve(installerPath);
  });
}

/**
 * Save the path of a downloaded installer so the app can prompt the user to
 * run it on the next launch (or immediately via the UI).
 */
function savePendingInstaller(installerPath, stateDir, version = '', features = [], notes = '') {
  try {
    const stateFile = path.join(stateDir, 'pending-update.json');
    fs.writeFileSync(stateFile, JSON.stringify({
      installerPath,
      version: String(version || ''),
      features: Array.isArray(features) ? features : [],
      notes: String(notes || ''),
      savedAt: Date.now()
    }), 'utf8');
    return stateFile;
  } catch {
    return null;
  }
}

/**
 * Read pending installer info WITHOUT removing the state file.
 * Returns null if there is no valid pending installer.
 */
function peekPendingInstaller(stateDir) {
  const stateFile = path.join(stateDir, 'pending-update.json');
  try {
    const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (data?.installerPath && fs.existsSync(data.installerPath)) {
      return data;
    }
  } catch {
    // No pending installer.
  }
  return null;
}

/**
 * Read and return any previously saved pending installer info, then remove the
 * state file so it is only acted on once.
 */
function consumePendingInstaller(stateDir) {
  const stateFile = path.join(stateDir, 'pending-update.json');
  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    fs.unlinkSync(stateFile);
    const data = JSON.parse(raw);
    if (data?.installerPath && fs.existsSync(data.installerPath)) {
      return data;
    }
  } catch {
    // No pending installer or file already consumed.
  }
  return null;
}

async function downloadAndInstallUpdate(updateInfo, destinationDir, onProgress) {
  const downloadUrl = String(updateInfo?.downloadUrl || '').trim();
  if (!downloadUrl) {
    throw new Error('Missing download URL');
  }

  const version = updateInfo?.version || 'latest';
  const fileName = installerFileName(downloadUrl, version);
  const destinationPath = path.join(destinationDir, fileName);

  if (typeof onProgress === 'function') {
    onProgress({ phase: 'download', percent: 0, status: 'Downloading update...' });
  }

  await downloadUpdateFile(downloadUrl, destinationPath, (progress) => {
    if (typeof onProgress === 'function') {
      onProgress({
        phase: 'download',
        percent: progress.percent,
        status: `Downloading update... ${progress.percent}%`
      });
    }
  });

  if (typeof onProgress === 'function') {
    onProgress({ phase: 'ready', percent: 100, status: 'Download complete. Ready to install.' });
  }

  return { installerPath: destinationPath, version };
}

async function checkForAppUpdate(currentVersion) {
  const versionFileUrl = resolveVersionFileUrl();
  if (!versionFileUrl) {
    return {
      available: false,
      skipped: true,
      reason: 'no-config',
      currentVersion
    };
  }

  try {
    const body = await fetchText(versionFileUrl);
    const parsed = parseVersionFile(body);
    if (!parsed.version || !parsed.downloadUrl) {
      return {
        available: false,
        skipped: true,
        reason: 'invalid-version-file',
        currentVersion
      };
    }

    const available = isNewerVersion(parsed.version, currentVersion);
    return {
      available,
      version: parsed.version,
      downloadUrl: parsed.downloadUrl,
      necessary: parsed.necessary,
      features: parsed.features || [],
      notes: parsed.notes || '',
      currentVersion,
      versionFileUrl
    };
  } catch (error) {
    return {
      available: false,
      skipped: true,
      reason: 'fetch-failed',
      error: error.message,
      currentVersion
    };
  }
}

module.exports = {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  downloadUpdateFile,
  fetchText,
  isNewerVersion,
  parseVersionFile,
  parseVersionParts,
  resolveVersionFileUrl,
  runUpdateInstaller,
  savePendingInstaller,
  peekPendingInstaller,
  consumePendingInstaller,
  versionFileUrlFromRepo
};
