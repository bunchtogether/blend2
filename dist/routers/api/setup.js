//      

const { Router } = require('express');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../../lib/logger')('Setup API');
const { triggerUpdate } = require('../../lib/update');
const { CONFIG_FILE } = require('../../constants');

const getConfigPath = function ()        {
  return path.resolve(CONFIG_FILE); // returns config.json located in exec dir
};

const readConfig = async ()                 => {
  const configFile = getConfigPath();
  try {
    const fileExists = await fs.pathExists(configFile);
    if (!fileExists) {
      logger.error(`${CONFIG_FILE} does not exist at ${configFile}, creating new file`);
      await fs.ensureFile(configFile);
      await fs.outputJSON(configFile, JSON.stringify({ ip: '' }));
    }
    return fs.readJSON(configFile);
  } catch (error) {
    logger.error(`Failed to read ${configFile}, error: ${error.message}`);
    logger.errorStack(error);
    throw error;
  }
};

const updateConfig = async (updatedConfig        )               => {
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
      triggerUpdate();
      return res.sendStatus(200);
    } catch (error) {
      logger.warn(`Unable to save device IP address, Error: ${error.message}`);
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to save device IP address' });
    }
  });

  router.post('/update-device', async (req                 , res                  ) => {
    try {
      triggerUpdate();
      return res.sendStatus(200);
    } catch (error) {
      logger.error(`Unable to trigger device update, Error: ${error.message}`);
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to trigger device update' });
    }
  });

  return router;
};
