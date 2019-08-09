//      

const os = require('os');
const moment = require('moment');
const colors = require('colors/safe');
const colorize = require('logform/colorize');
const combine = require('logform/combine');
const timestamp = require('logform/timestamp');
const printf = require('logform/printf');
const { createLogger, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

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

const loggerFileTransport = new DailyRotateFile({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    printf((info) => `${moment().format('YYYY-MM-DD HH:mm:ss')} - ${(info.name || '').padEnd(30, ' ')} - ${(info.level || '').padEnd(6, ' ')} - ${info.message}`),
  ),
  filename: 'blend-%DATE%.log',
  maxSize: '25m',
  maxFiles: '10',
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
  logger = createLogger({
    transports: [consoleTransport, loggerFileTransport],
  });
} else {
  logger = createLogger({
    transports: [consoleTransport],
  });
}

module.exports = (name        ) => {
  if (loggers[name]) {
    return loggers[name];
  }
  const childLogger = logger.child({ name });

  childLogger.errorStack = (error        ) => {
    if (error.stack) {
      error.stack.split('\n').forEach((line) => childLogger.error(`\t${line}`));
    } else {
      childLogger.error(error.message);
    }
  };

  loggers[name] = childLogger;
  return childLogger;
};
