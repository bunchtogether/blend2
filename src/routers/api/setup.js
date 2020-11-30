// @flow

const { Router } = require('express');
const logger = require('../../lib/logger')('Setup API');
const { triggerUpdate } = require('../../lib/update');
const { readConfig, updateConfig } = require('../../lib/config');
const { initSentry } = require('../../lib/logger');

module.exports.getSetupRouter = () => {
  logger.info('Attaching setup router');

  const router = Router({ mergeParams: true });

  router.get('/ip', async (req: express$Request, res: express$Response) => {
    try {
      const configContent = await readConfig();
      if (Object.keys(configContent).includes('ip')) {
        return res.send({ ip: configContent.ip });
      }
      return res.status(400).send({ ip: '', message: 'Hardware setup ip does not exist' });
    } catch (error) {
      logger.error(`Unable to get device IP address, Error: ${error.message}`);
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to get device IP address' });
    }
  });

  router.get('/sentry', async (req: express$Request, res: express$Response) => {
    try {
      const configContent = await readConfig();
      if (Object.keys(configContent).includes('sentry')) {
        return res.send({ dsn: configContent.sentry });
      }
      return res.status(400).send({ dsn: '', message: 'Sentry setup does not exist' });
    } catch (error) {
      logger.error(`Unable to get Sentry dsn, Error: ${error.message}`);
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to get Sentry dsn' });
    }
  });

  router.put('/ip', async (req: express$Request, res: express$Response) => {
    const ip = req.body.ip;
    if (!ip) {
      return res.status(400).send({ error: 'Missing required parameter: ip' });
    }
    try {
      await updateConfig({ ip });
      return res.sendStatus(200);
    } catch (error) {
      logger.warn(`Unable to save device IP address, Error: ${error.message}`);
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to save device IP address' });
    }
  });

  router.put('/sentry', async (req: express$Request, res: express$Response) => {
    const sentryDsn = req.body.dsn;
    if (!sentryDsn) {
      return res.status(400).send({ error: 'Missing required parameter: dsn' });
    }
    try {
      await updateConfig({ sentry: sentryDsn });
      await initSentry(); // Re-initialize sentry config
      return res.sendStatus(200);
    } catch (error) {
      logger.warn(`Unable to save Sentry dsn, Error: ${error.message}`);
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to save Sentry dsn' });
    }
  });

  router.post('/update-device', async (req: express$Request, res: express$Response) => {
    try {
      const status = await triggerUpdate();

      // Error
      if (status && status.error !== null) {
        return res.status(400).send({ error: status.error });
      }

      // Active Check
      if (status && status.triggered && typeof (status.pid) === 'number' && status.pid > 0) {
        return res.send({ message: 'Initiated update check' });
      } else if (status && !status.triggered && typeof (status.pid) === 'number' && status.pid > 0) {
        return res.send({ message: 'Update check in progress' });
      } else if (status && !status.triggered && status.pid === null) {
        return res.send({ message: 'Scheduled update check is in progress' });
      }

      logger.error(`Got an invalid update-check state ${JSON.stringify(status)}`);
      return res.status(400).send({ error: 'Failed to trigger update check' });
    } catch (error) {
      logger.error(`Unable to trigger device update, Error: ${error.message}`);
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to trigger device update' });
    }
  });

  return router;
};
