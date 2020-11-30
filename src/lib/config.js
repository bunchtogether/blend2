// @flow

const fs = require('fs-extra');
const path = require('path');

const { CONFIG_FILE } = require('../constants');

const getConfigPath = function (): string {
  return path.resolve(CONFIG_FILE); // returns config.json located in exec dir
};

const readConfig = async (): Promise<Object> => {
  const configFile = getConfigPath();
  try {
    const fileExists = await fs.pathExists(configFile);
    if (!fileExists) {
      console.error(`${CONFIG_FILE} does not exist at ${configFile}, creating new file`);
      await fs.ensureFile(configFile);
      await fs.outputJSON(configFile, { ip: '', multicast: null, sentry: null });
    }
    return fs.readJSON(configFile);
  } catch (error) {
    console.error(`Failed to read ${configFile}, error: ${error.message}`);
    throw error;
  }
};

const updateConfig = async (updatedConfig: Object): Promise<void> => {
  const configFile = getConfigPath();
  try {
    const configContent = await readConfig();
    const updatedConfigContent = Object.assign({}, configContent, updatedConfig);
    await fs.outputJSON(configFile, updatedConfigContent);
  } catch (error) {
    console.error(`Failed to update ${configFile}, Error: ${error.message}`);
    throw error;
  }
};

const readSentry = async function (): Promise<string> {
  try {
    const config = await readConfig();
    if (config && config.sentry) {
      return config.sentry;
    }
  } catch (error) {
    console.error(`Error reading the config file, ${error.message}`);
  }
  return ''; // Disabled by default
};

module.exports = {
  readConfig,
  updateConfig,
  readSentry,
};
