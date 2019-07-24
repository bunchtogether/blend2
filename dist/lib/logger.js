//      

const path = require('path');
const fs = require('fs');
const moment = require('moment');
const colors = require('colors/safe');
const { createLogger, transports } = require('winston');
const colorize = require('logform/colorize');
const combine = require('logform/combine');
const timestamp = require('logform/timestamp');
const printf = require('logform/printf');
require('winston-daily-rotate-file');

const logsPath = path.join(__dirname, '../logs');
if(!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath);
}

const loggers = {};

// Make Winston use stdout https://github.com/winstonjs/winston/blob/master/lib/winston/transports/console.js#L63-L66
// $FlowFixMe
console._stdout = process.stdout; // eslint-disable-line no-underscore-dangle,no-console
// $FlowFixMe
console._stderr = process.stderr; // eslint-disable-line no-underscore-dangle,no-console

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

const logger = createLogger({
  transports: [
    new transports.DailyRotateFile({
      dirname: logsPath,
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      maxSize: '20m',
      maxFiles: '10',
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        timestamp(),
        printf((info) => `${moment().format('YYYY-MM-DD HH:mm:ss')} - ${(info.name || '').padEnd(30, ' ')} - ${(info.level || '').padEnd(6, ' ')} - ${info.message}`),
      ),
    }),
    new transports.Console({
      debugStdout: false,
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        colorize(),
        timestamp(),
        printf((info) => `${moment().format('YYYY-MM-DD HH:mm:ss')} - ${colors.bold((info.name || '').padEnd(30, ' '))} - ${(info.level || '').padEnd(6, ' ')} - ${info.message}`),
      ),
    }),
  ],
});

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
