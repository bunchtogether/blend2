//      

const os = require('os');
const LRU = require('lru-cache');
const { spawn } = require('child_process');
const { checkFileExists } = require('./utils');
const logger = require('./logger')('Logs');

const logMap = new LRU({ max: 10, maxAge: 24 * 60 * 60 * 1000 });

const checkLogs = async function (filename        )                   {
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

const generateLogs = async function ()                  {
  const filename = `logs_${Math.floor(Date.now() / 1000)}.zip`;
  const currLogs = availableLogs();
  const zipInProgress = await currLogs.filter((log) => log.available === false);
  if (Array.isArray(zipInProgress) && zipInProgress.length > 0) {
    return zipInProgress[0].filename;
  }
  logMap.set(`${filename}`, { timestamp: Date.now(), available: false, filepath: `/tmp/${filename}` });

  try {
    let dumpLogs;
    if(os.platform() === 'win32') {
      dumpLogs = spawn('powershell.exe', [`${__dirname}/../cli/dump-logs.ps1`, filename]);
    } else {
      dumpLogs = spawn('bash', [`${__dirname}/../cli/dump-logs`, filename]);
    }
    dumpLogs.stdout.on('data', (data) => {
      const filepath = data.toString().trim();
      logMap.set(filename, { timestamp: Date.now(), available: true, filepath });
      logger.info(`Generated ${filename} located at ${data}`);
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

const availableLogs = function ()                {
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
