// @flow

const { Router } = require('express');
const { exec } = require('child_process');
const path = require('path');
const logger = require('../../lib/logger')('Application API');

const startLaunchScript = async (appID: string) => {
  const filePath = path.join(__dirname, '../../../scripts/application/launcher.ps1');
  const child = exec(`Powershell.exe  -executionpolicy ByPass  -File ${filePath} -appID ${appID}`,
    (err) => {
      if (err) {
        logger.error('Launch powershell script error');
        logger.errorStack(err);
      }
    });

  child.stderr.on('data', (data) => {
    logger.error('Powershell script error');
    logger.errorStack(data);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      logger.error('Powershell exit code');
      logger.errorStack(code);
    }
  });
  child.stdin.end();
};

module.exports.getApplicationRouter = () => {
  logger.info('Attaching Application router');

  const router = Router({ mergeParams: true });

  router.post('/launch', async (req: express$Request, res: express$Response) => {
    const { body: { appID } } = req;
    try {
      await startLaunchScript(appID);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Can not launch application');
      logger.errorStack(error);
      res.status(400).send('Can not launch application');
    }
  });

  return router;
};
