// @flow

const { Router } = require('express');
const makeLogger = require('./lib/logger');

const logger = makeLogger('Log Router API');
const loggers = {};

module.exports.getLogRouter = () => {
  logger.info('Attaching /api/1.0/log');

  const router = Router({ mergeParams: true });

  router.post('/api/1.0/log', async (req: express$Request, res: express$Response) => {
    const body = req.body;
    if (!(body instanceof Object)) {
      res.status(400).send('Missing request body');
      return;
    }
    const { name, level, description, value } = body;
    if (!name) {
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
    let browserLogger = loggers[name];
    if (!browserLogger) {
      browserLogger = makeLogger(name);
      loggers[name] = browserLogger;
    }
    let logFunc;
    switch (level) {
      case 'debug':
        logFunc = browserLogger.debug;
        break;
      case 'info':
        logFunc = browserLogger.info;
        break;
      case 'warn':
        logFunc = browserLogger.warn;
        break;
      case 'error':
        logFunc = browserLogger.error;
        break;
      default:
        throw new Error(`Unknown log level ${level}`);
    }
    if (typeof value === 'string') {
      value.split('\n').forEach((line) => logFunc(line));
    } else {
      JSON.stringify(value, null, 2).split('\n').forEach((line) => logFunc(line));
    }
    if (description) {
      if (typeof value === 'string') {
        description.split('\n').forEach((line) => browserLogger.debug(`\t${line}`));
      } else {
        JSON.stringify(description, null, 2).split('\n').forEach((line) => browserLogger.debug(`\t${line}`));
      }
    }
    res.status(200).json({ success: true });
  });

  return router;
};
