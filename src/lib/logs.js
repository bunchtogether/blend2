// @flow

const os = require('os');
const path = require('path');
const LRU = require('lru-cache');
const { spawn } = require('child_process');
const { checkFileExists } = require('./utils');
const logger = require('./logger')('Logs');

const logMap = new LRU({ max: 10, maxAge: 24 * 60 * 60 * 1000 });

const checkLogs = async function (filename: string): Promise<boolean> {
  try {
    const fileInfo = logMap.get(filename);
    if (!fileInfo) {
      return false;
    }
    if (fileInfo && !fileInfo.filepath) {
      return false;
    }
    const fileExists = await checkFileExists(fileInfo.filepath);
    if (!fileExists) {
      logMap.del(filename);
    }
    return fileExists;
  } catch (error) {
    logger.error(`Unable to check logs ${filename}`);
    logger.errorStack(error);
    throw error;
  }
};

const generateLogsScript = function ():string {
  const logScriptsDir = path.resolve('scripts/dump-logs');
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.resolve(logScriptsDir, 'dump-logs.darwin.sh');
  } else if (platform === 'win32') {
    return path.resolve(logScriptsDir, 'dump-logs.win32.ps1');
  } else if (platform === 'linux') {
    return path.resolve(logScriptsDir, 'dump-logs.linux.sh');
  }
  throw new Error(`Log generator script not found, platform ${platform} not supported`);
};

const generateLogs = async function (): Promise<string> {
  const filename = `logs_${Math.floor(Date.now() / 1000)}.zip`;
  const currLogs = availableLogs();
  const zipInProgress = await currLogs.filter((log) => log.available === false);
  if (Array.isArray(zipInProgress) && zipInProgress.length > 0) {
    return zipInProgress[0].filename;
  }
  logMap.set(`${filename}`, { timestamp: Date.now(), available: false, filepath: null });

  try {
    let dumpLogs;
    const logGeneratorScript = generateLogsScript();
    if (os.platform() === 'win32') {
      dumpLogs = spawn('powershell.exe', ['-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', logGeneratorScript, filename], {
        windowsHide: true,
      });
    } else {
      dumpLogs = spawn('bash', [logGeneratorScript, filename]);
    }
    dumpLogs.stdout.on('data', (data) => {
      const rawData = data.toString().trim();
      if (rawData.includes('FILENAME:')) {
        const filepath = rawData.replace('FILENAME:', '').trim();
        logMap.set(filename, { timestamp: Date.now(), available: true, filepath });
        logger.info(`Generated ${filename} located at ${filepath}`);
      }
    });

    dumpLogs.on('close', (code) => {
      if (code !== 0) {
        logMap.del(filename);
      }
    });

    dumpLogs.stderr.on('data', (data) => {
      logMap.del(filename);
      logger.error(`Error occured while generating logs ${filename}: ${data}`);
    });
    return filename;
  } catch (error) {
    logger.error('Unable to generate logs zip');
    logger.errorStack(error);
    throw error;
  }
};

const availableLogs = function (): Array<Object> {
  const logs = [];
  logMap.forEach((value, key) => {
    let filepath = null;
    let timestamp = null;
    let available = false;
    if (value && typeof (value) === 'object' && value.filepath) {
      filepath = value.filepath;
    }
    if (value && typeof (value) === 'object' && value.available) {
      available = value.available;
    }
    if (value && typeof (value) === 'object' && value.timestamp) {
      timestamp = value.timestamp;
    }
    logs.push({
      filename: key,
      filepath,
      available,
      timestamp,
    });
  });
  return logs;
};

module.exports = {
  checkLogs,
  generateLogs,
  availableLogs,
};
