// @flow

const ps = require('ps-node');
const logger = require('./logger')('Process Killer');
const { spawn } = require('child_process');

const checkIfProcessExists = (pid:number): Promise<boolean> => new Promise((resolve, reject) => {
  ps.lookup({ pid }, (error, resultList) => {
    if (error) {
      reject(error);
    } else if (resultList.length > 0) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
});

module.exports = async (pid:number, name:string) => {
  let processExists = await checkIfProcessExists(pid);
  const exitPromise = new Promise(async (resolve, reject) => {
    for (let i = 0; i < 30; i += 1) {
      if (!processExists) {
        resolve();
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
      processExists = await checkIfProcessExists(pid);
    }
    logger.error(`Timeout when stopping ${name} process ${pid}`);
    reject(new Error(`FFmpegProcessManager timed out when stopping ${name} process ${pid}`));
  });
  if (process.platform === 'win32') {
    logger.info(`Sending Node.js kill() to ${name} process ${pid}`);
    try {
      if (processExists) {
        process.kill(pid);
      }
    } catch (error) {
      logger.error(`Error with Node.js kill() on ${name} process ${pid}: ${error.message}`);
    }
    const killTimeout = setTimeout(() => {
      logger.info(`Running taskkill /F command for ${name} process ${pid}`);
      const taskkillProcess = spawn('taskkill', ['/PID', pid.toString(), '/F'], {
        windowsHide: true,
        shell: false,
        detached: true,
      });
      taskkillProcess.once('error', (error) => {
        logger.error(error.message);
      });
      taskkillProcess.stdout.on('data', (data) => {
        data.toString('utf8').trim().split('\n').forEach((line) => logger.info(line.trim()));
      });
      taskkillProcess.stderr.on('data', (data) => {
        data.toString('utf8').trim().split('\n').forEach((line) => logger.error(line.trim()));
      });
    }, 5000);
    await exitPromise;
    clearTimeout(killTimeout);
  } else {
    logger.info(`Sending SIGTERM to ${name} process ${pid}`);
    try {
      if (processExists) {
        process.kill(pid, 'SIGTERM');
      }
    } catch (error) {
      logger.error(`Error with SIGTERM signal on ${name} process ${pid}: ${error.message}`);
    }
    const sigkillTimeout = setTimeout(() => {
      logger.info(`Sending SIGKILL to ${name} process ${pid}`);
      try {
        if (processExists) {
          process.kill(pid, 'SIGKILL');
        }
      } catch (error) {
        logger.error(`Error with SIGKILL signal on ${name} process ${pid}: ${error.message}`);
      }
    }, 5000);
    const sigquitTimeout = setTimeout(() => {
      logger.info(`Sending SIGQUIT to ${name} process ${pid}`);
      try {
        if (processExists) {
          process.kill(pid, 'SIGQUIT');
        }
      } catch (error) {
        logger.error(`Error with SIGQUIT signal on ${name} process ${pid}: ${error.message}`);
      }
    }, 10000);
    await exitPromise;
    clearTimeout(sigkillTimeout);
    clearTimeout(sigquitTimeout);
  }
  logger.info(`Stopped ${name} process ${pid}`);
};
