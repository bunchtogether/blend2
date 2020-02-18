//      

const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const findProcess = require('@bunchtogether/find-process');
const logger = require('./logger')('Auto Updater');

const { BAND_UPDATE_CHECK, BAND_UPDATE_CHECK_LOCK } = process.env;
let updateInProgress = false;
let updateCheckPid = 0;

const triggerWindowsUpdate = async () => {
  logger.error('Trigger Windows update not implemented yet');
  return {
    pid: null,
    triggered: false,
    message: null,
    error: 'Update Check for Windows is not enabled',
  };
};

const triggerDarwinUpdate = async () => {
  logger.error('Tigger Mac OSX update not implemented yet');
  return {
    pid: null,
    triggered: false,
    message: null,
    error: 'Update Check for Mac OSX is not enabled',
  };
};

const scheduledUpdateCheck = async ()                   => {
  if (!BAND_UPDATE_CHECK_LOCK) {
    logger.error('Unable to check for active update checks due to missing LOCK file path, BAND_UPDATE_CHECK_LOCK env variable is not defined');
    return false;
  }

  try {
    const lockFilePath = path.resolve(BAND_UPDATE_CHECK_LOCK);
    const fileExists = await fs.exists(lockFilePath);
    if (!fileExists) {
      // Update check is either inactive
      logger.info(`Lock file doesn't exist at ${lockFilePath}`);
      return false;
    }

    // if LOCK file exists at the specified path, check if PID written in it is active
    const parsedLockFile = await fs.readFile(lockFilePath, 'utf8');
    const activePid = parseInt(parsedLockFile.trim(), 10);
    if (!Number.isInteger(activePid)) {
      logger.error(`Invalid PID specified in the LOCK file at ${BAND_UPDATE_CHECK_LOCK}`);
      return false;
    }

    const processList = await findProcess('pid', activePid);
    if (Array.isArray(processList) && processList.length === 1 && processList[0].pid === activePid) {
      logger.warn('Scheduled update check is active, don\'t start new check');
      return true;
    }

    logger.warn('Scheduled update check is not active, but LOCK file wasn\'t removed properly');
    return false;
  } catch (error) {
    logger.error(`Unable to check if scheduled update check via cronjob is active, Error: ${error.message}`);
    logger.errorStack(error);
    return false;
  }
};

const triggerLinuxUpdate = async () => {
  if (!BAND_UPDATE_CHECK) {
    throw new Error('Missing BAND_UPDATE_CHECK environmental variable, Update check script path is not defined');
  }

  if (updateInProgress) {
    logger.info('Active update in progress, skipping update check');
    return {
      pid: updateCheckPid,
      triggered: false,
      message: 'Update check in progress, new check wasn\'t triggered.',
      error: null,
    };
  }

  const scriptPath = path.resolve(BAND_UPDATE_CHECK);
  const scriptExists = await fs.exists(scriptPath);
  if (!scriptExists) {
    logger.error(`Update script does not exist at ${BAND_UPDATE_CHECK}`);
    return {
      pid: null,
      triggered: false,
      message: null,
      error: `Update check script doesn't exist at path ${BAND_UPDATE_CHECK} (BAND_UPDATE_CHECK)`,
    };
  }

  try {
    // Check if scheduled update check is active
    const isScheduledUpdateCheckActive = await scheduledUpdateCheck();
    if (isScheduledUpdateCheckActive) {
      return {
        pid: null,
        triggered: false,
        message: 'Scheduled update check is currently in progress, skipping new check',
        error: null,
      };
    }

    const updateProcess = spawn('/bin/bash', [scriptPath, '-i'], {
      detached: true,
      stdio: 'ignore', // Ignore stdin, stdout, stderr
    });
    updateInProgress = true;
    updateCheckPid = updateProcess.pid;

    updateProcess.on('exit', (code) => {
      logger.info(`Linux update check finished and exited with code ${code}`);
      updateInProgress = false;
    });

    // Detach process from nodejs process
    updateProcess.unref();
    return {
      pid: updateCheckPid,
      triggered: true,
      message: 'Triggered an update check, wait for few mins for the update to finish.',
      error: null,
    };
  } catch (error) {
    logger.error(`Unable to trigger linux update check, Error ${error.message}`);
    logger.errorStack(error);
    return {
      pid: null,
      triggered: false,
      message: null,
      error: `Failed to trigger update check. ${error.message}`,
    };
  }
};

                      
                     
                     
                         
                       
  

const triggerUpdate = async ()                         => {
  logger.info('Triggering update');
  if (os.platform() === 'linux') {
    return triggerLinuxUpdate();
  } else if (os.platform() === 'win32') {
    return triggerWindowsUpdate();
  } else if (os.platform() === 'darwin') {
    return triggerDarwinUpdate();
  }

  logger.warn(`Update check is not supported on ${os.platform()} platform`);
  return {
    pid: null,
    triggered: false,
    message: null,
    error: `Update checks are not supported on ${os.platform()} platform`,
  };
};

module.exports = {
  triggerUpdate,
  triggerLinuxUpdate,
};
