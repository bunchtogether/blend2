//      

const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const https = require('https');
const logger = require('./lib/logger')('HTTP Server');
const gracefulExit = require('express-graceful-exit');
const addExpressWs = require('express-ws');

const keyPath = path.resolve(process.cwd(), 'key.pem');
const certPath = path.resolve(process.cwd(), 'cert.pem');

module.exports = async function (app                     , port       ) {
  const keyExists = await fs.exists(keyPath);
  const certExists = await fs.exists(certPath);
  let credentials;
  if (keyExists && certExists) {
    const key = await fs.readFile(keyPath);
    const cert = await fs.readFile(certPath);
    credentials = { key, cert };
  }
  let httpServer;
  let httpsServer;
  if (credentials) {
    await new Promise((resolve, reject) => {
      httpsServer = credentials ? https.createServer(credentials, app).listen({ host: '127.0.0.1', port: port + 1 }, (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      }) : null;
    });
    addExpressWs(app, httpsServer);
    logger.info(`Started listening on https://127.0.0.1:${port + 1}`);
  } else {
    await new Promise((resolve, reject) => {
      httpServer = http.createServer(app).listen({ host: '127.0.0.1', port }, (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
    addExpressWs(app, httpServer);
    logger.info(`Started listening on http://127.0.0.1:${port}`);
  }
  const stopHttpServer = async function () {
    logger.debug(`Stopping listening on http://127.0.0.1:${port}`);
    await Promise.all([
      httpServer ? new Promise((resolve) => {
        gracefulExit.gracefulExitHandler(app, httpServer, {
          logger: logger.info,
          callback: () => {
            resolve();
          },
          exitProcess: false,
          force: true,
        });
      }) : null,
      httpsServer ? new Promise((resolve) => {
        gracefulExit.gracefulExitHandler(app, httpsServer, {
          logger: logger.info,
          callback: () => {
            resolve();
          },
          exitProcess: false,
          force: true,
        });
      }) : null,
    ]);
    logger.info(`Stopped listening on http://127.0.0.1:${port}`);
    if (httpsServer) {
      logger.info(`Stopped listening on https://127.0.0.1:${port + 1}`);
    }
  };
  return stopHttpServer;
};
