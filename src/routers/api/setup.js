// @flow

const { Router } = require('express');
const path = require('path');
const fs = require('fs-extra');
const exec = require('child_process').exec;
const logger = require('../../lib/logger')('Setup API');

const fileName = 'hardware_setup_ip.json';

async function triggerUpdateScript() {
  await new Promise((resolve, reject) => {
    try {
      exec('/bin/sh /home/ubuntu/script.sh', (err, stdout, stderr) => { // eslint-disable-line
        if (err) {
          reject(err);
        }
        if (stdout) {
          resolve(stdout);
        }
        if (stderr) {
          reject(stderr);
        }
      });
    } catch (error) {
      logger.errorStack(error);
      reject(error);
    }
  });
}

module.exports.getSetupRouter = () => {
  logger.info('Attaching setup router');

  const router = Router({ mergeParams: true });

  router.get('/ip', async (req: express$Request, res: express$Response) => {
    try {
      const exists = await fs.pathExists(path.resolve(__dirname, `../../../${fileName}`));
      if (!exists) {
        return res.send({ ip: '', message: 'Hardware setup ip does not exist' });
      }
      const result = await fs.readJSON(path.resolve(__dirname, `../../../${fileName}`));
      return res.send(result);
    } catch (error) {
      logger.warn('Unable to get device IP address');
      logger.warn(error);
      return res.status(400).send({ error: 'Unable to get device IP address' });
    }
  });

  router.put('/ip', async (req: express$Request, res: express$Response) => {
    const ip = req.body.ip;
    if (!ip) {
      return res.status(400).send({ error: 'Missing required parameter: ip' });
    }
    try {
      await fs.outputJSON(path.resolve(__dirname, `../../../${fileName}`), { ip });
      await triggerUpdateScript();
      return res.sendStatus(200);
    } catch (error) {
      logger.warn('Unable to save device IP address');
      logger.warn(error);
      return res.status(400).send({ error: 'Unable to save device IP address' });
    }
  });

  router.post('/update-device', async (req: express$Request, res: express$Response) => {
    try {
      await triggerUpdateScript();
      return res.sendStatus(200);
    } catch (error) {
      logger.warn('Unable to trigger device update');
      logger.warn(error);
      return res.status(400).send({ error: 'Unable to trigger device update' });
    }
  });

  return router;
};
