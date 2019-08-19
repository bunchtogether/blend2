//      

const { Router } = require('express');
const makeLogger = require('../lib/logger');

const logger = makeLogger('Log Router API');

module.exports.getLogRouter = () => {
  logger.info('Attaching /api/1.0/log');

  const router = Router({ mergeParams: true });

  router.post('/api/1.0/log', async (req                 , res                  ) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).send('Missing request body');
      return;
    }
    const { name, level, description, value } = body;
    if (typeof name !== 'string') {
      res.status(400).send('Missing required body parameter "name"');
      return;
    }
    if (level !== 'debug' && level !== 'info' && level !== 'warn' && level !== 'error') {
      res.status(400).send('Required body parameter "level" must be one of: debug, info, warn, error');
      return;
    }
    if (!value) {
      res.status(400).send('Missing required body parameter "value"');
      return;
    }
    const browserLogger = makeLogger(name);
    let logFunc;
    switch (level) {
      case 'debug':
        logFunc = browserLogger.debug.bind(browserLogger);
        break;
      case 'info':
        logFunc = browserLogger.info.bind(browserLogger);
        break;
      case 'warn':
        logFunc = browserLogger.warn.bind(browserLogger);
        break;
      case 'error':
        logFunc = browserLogger.error.bind(browserLogger);
        break;
      default:
        throw new Error(`Unknown log level ${level}`);
    }
    let valueString = value;
    let descriptionString = description;
    if (typeof valueString !== 'string') {
      valueString = JSON.stringify(valueString, null, 2);
    }
    if (valueString) {
      valueString.split('\n').forEach((line) => logFunc(line));
    }
    if (descriptionString) {
      if (typeof descriptionString !== 'string') {
        descriptionString = JSON.stringify(descriptionString, null, 2);
      }
      if (descriptionString) {
        descriptionString.split('\n').forEach((line) => browserLogger.debug(`\t${line}`));
      }
    }
    res.status(200).json({ success: true });
  });

  return router;
};
