//      

const { Router } = require('express');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../../lib/logger')('Setup API');
const { triggerUpdate } = require('../../lib/update');
const { CONFIG_FILE } = require('../../constants');

const getConfigPath = function ()         {
  return path.resolve(CONFIG_FILE); // returns config.json located in exec dir
};

const readConfig = async ()                  => {
  const configFile = getConfigPath();
  try {
    const fileExists = await fs.pathExists(configFile);
    if (!fileExists) {
      logger.error(`${CONFIG_FILE} does not exist at ${configFile}, creating new file`);
      await fs.ensureFile(configFile);
      await fs.outputJSON(configFile, { ip: '', multicast: null });
    }
    return fs.readJSON(configFile);
  } catch (error) {
    logger.error(`Failed to read ${configFile}, error: ${error.message}`);
    logger.errorStack(error);
    throw error;
  }
};

const updateConfig = async (updatedConfig        )                => {
  const configFile = getConfigPath();
  try {
    const configContent = await readConfig();
    const updatedConfigContent = Object.assign({}, configContent, updatedConfig);
    await fs.outputJSON(configFile, updatedConfigContent);
  } catch (error) {
    logger.error(`Failed to update ${configFile}, Error: ${error.message}`);
    logger.errorStack(error);
    throw error;
  }
};

module.exports.getSetupRouter = () => {
  logger.info('Attaching setup router');

  const router = Router({ mergeParams: true });

  router.get('/ip', async (req                 , res                  ) => {
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

  router.put('/ip', async (req                 , res                  ) => {
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

  router.post('/update-device', async (req                 , res                  ) => {
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
