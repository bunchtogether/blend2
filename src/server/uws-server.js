// @flow

const uWS = require('uWebSockets.js');
const logger = require('./lib/logger')('uWebSockets.js Server');

module.exports = async function (host:string, port:number) {
  logger.debug(`Starting listening on ws://${host}:${port}`);
  const server = uWS.App({});
  const listenSocket = await new Promise((resolve, reject) => {
    server.listen(port, (token) => {
      if (token) {
        resolve(token);
      } else {
        reject(new Error(`Unable to listen on port ${port}`));
      }
    });
  });
  const stopWsServer = async function () {
    if (!listenSocket) {
      logger.warn('Listen socket does not exist');
      return;
    }
    uWS.us_listen_socket_close(listenSocket);
    logger.info(`Stopped listening on ws://${host}:${port}`);
  };
  logger.info(`Started listening on ws://${host}:${port}`);
  return [server, stopWsServer];
};
