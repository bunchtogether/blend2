// @flow

const os = require('os');
const moment = require('moment');
const colors = require('colors/safe');
const colorize = require('logform/colorize');
const combine = require('logform/combine');
const timestamp = require('logform/timestamp');
const printf = require('logform/printf');
const { createLogger, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing'); // eslint-disable-line no-unused-vars

const { readSentry } = require('../lib/config');

let isSentryEnabled = false;
const initSentry = async function (): Promise<boolean> {
  try {
    const sentryDsn = await readSentry();
    if (typeof (sentryDsn) !== 'string' || (typeof (sentryDsn) === 'string' && sentryDsn === '')) {
      console.warn('Sentry is not configured');
      isSentryEnabled = false;
      return false;
    }
    Sentry.init({
      dsn: sentryDsn, // "https://c123bac0b58d4355b7f2e0bfb9c922fd@o343937.ingest.sentry.io/5526027",
      tracesSampleRate: 1.0,
    });
    isSentryEnabled = true;
    return true;
  } catch (error) {
    console.error(`Error initializing sentry config, ${error.message}`);
    isSentryEnabled = false;
    return false;
  }
};

const { BLEND_LOGS_DIR } = require('../constants');

const loggers = {};

// Make Winston use stdout https://github.com/winstonjs/winston/blob/master/lib/winston/transports/console.js#L63-L66
// $FlowFixMe
console._stdout = process.stdout; // eslint-disable-line no-underscore-dangle,no-console
// $FlowFixMe
console._stderr = process.stderr; // eslint-disable-line no-underscore-dangle,no-console


const consoleTransport = new transports.Console({
  debugStdout: false,
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    colorize(),
    timestamp(),
    printf((info) => `${moment().format('YYYY-MM-DD HH:mm:ss')} - ${colors.bold((info.name || '').padEnd(30, ' '))} - ${(info.level || '').padEnd(6, ' ')} - ${info.message}`)),
});

colorize.Colorizer.addColors({
  error: 'red',
  warn: 'yellow',
  help: 'cyan',
  data: 'grey',
  info: 'green',
  debug: 'blue',
  prompt: 'grey',
  verbose: 'cyan',
  input: 'grey',
  silly: 'magenta',
});

let logger;
// File based logger only on windows
if (os.platform() === 'win32') {
  const loggerFileTransport = new DailyRotateFile({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      timestamp(),
      printf((info) => `${moment().format('YYYY-MM-DD HH:mm:ss')} - ${(info.name || '').padEnd(30, ' ')} - ${(info.level || '').padEnd(6, ' ')} - ${info.message}`),
    ),
    dirname: BLEND_LOGS_DIR,
    filename: 'blend-%DATE%.log',
    maxSize: '25m',
    maxFiles: '10',
  });
  logger = createLogger({
    transports: [consoleTransport, loggerFileTransport],
  });
  logger.info(`Blend logs at ${BLEND_LOGS_DIR}`);
} else {
  logger = createLogger({
    transports: [consoleTransport],
  });
}

module.exports = (name: string) => {
  if (loggers[name]) {
    return loggers[name];
  }
  const childLogger = logger.child({ name });

  childLogger.errorStack = (error: Object) => {
    if (error.stack) {
      error.stack.split('\n').forEach((line) => childLogger.error(`\t${line}`));
    } else {
      childLogger.error(error.message);
    }
  };

  childLogger.errorSentry = (error: Error) => {
    console.log('Is Sentry enabled', isSentryEnabled);
    if (isSentryEnabled) {
      Sentry.captureException(error);
    }
  };

  loggers[name] = childLogger;
  return childLogger;
};

module.exports.initSentry = initSentry;
