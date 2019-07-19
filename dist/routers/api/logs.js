//      

const { Router } = require('express');
const fs = require('fs');
const { checkLogs, generateLogs, availableLogs } = require('../../lib/logs');
const logger = require('../../lib/logger')('Logs API');

module.exports.getLogsRouter = () => {
  logger.info('Attaching logs router');

  const router = Router({ mergeParams: true });

  router.get('/download', async (req                 , res                  ) => { //eslint-disable-line
    try {
      const filename = req.query.filename;
      if (!filename || typeof (filename) !== 'string') {
        return res.status(400).send({ error: 'Missing required query filename' });
      }
      const logs = availableLogs();
      const logFile = logs.filter((log) => log.filename === filename);
      if (!Array.isArray(logFile) || (Array.isArray(logFile) && logFile.length === 0)) {
        return res.status(404).send({ error: `${filename} does not exist` });
      }
      if (Array.isArray(logFile) && logFile.length > 0) {
        const fileExists = await checkLogs(logFile[0].filename);
        if (logFile[0].available === false || (logFile[0].available && !fileExists)) {
          return res.status(404).send({ error: `${filename} is not available yet` });
        }
      }

      res.header('Cache-Control', 'max-age=0');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');
      res.header('Content-disposition', `attachment; filename=${filename}`);
      res.header('Content-Type', 'application/zip');
      fs.createReadStream(logFile[0].filepath).pipe(res);
    } catch (error) {
      logger.error('Unable to download zipped logs');
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to download logs' });
    }
  });

  router.post('/generate', async (req                 , res                  ) => {
    try {
      const filename = await generateLogs();
      return res.send({ filename });
    } catch (error) {
      logger.error('Unable to genrate zip file');
      logger.errorStack(error);
      return res.status(400).send({ error: 'Unable to generate logs.zip' });
    }
  });

  router.get('/check', async (req                 , res                  ) => {
    try {
      const filename = req.query.filename;
      if (!filename || typeof (filename) !== 'string') {
        return res.status(400).send({ error: 'Missing required query filename' });
      }
      const status = await checkLogs(filename);
      return res.send(status);
    } catch (error) {
      logger.error('Unable to get list of zipped logs');
      logger.errorStack(error);
      return res.status(400).send({ error: 'Failed get the list of zipped logs' });
    }
  });

  router.get('/', async (req                 , res                  ) => {
    try {
      const logs = availableLogs();
      return res.send(logs);
    } catch (error) {
      logger.error('Unable to get list of zipped logs');
      logger.errorStack(error);
      return res.status(400).send({ error: 'Failed get the list of zipped logs' });
    }
  });

  return router;
};
