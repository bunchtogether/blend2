//      

const ip = require('ip');
const crypto = require('crypto');
const { Router } = require('express');
const pkg = require('../../../package.json');
const makeLogger = require('../../lib/logger');
const Receiver = require('./receiver');

let active = false;

const logger = makeLogger('Multicast Assist Router API');
const receivers = new Set();

// Active sockets
//   Key: Socket ID
//   Value: Socket object
const sockets = new Map();

const getArrayBuffer = (b        ) => new Uint8Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));

function randomInteger() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

module.exports.shutdownMulticastAssistRouter = async () => {
  active = false;
  logger.info('Closing');
  for (const socket of sockets.values()) {
    socket.close(1000, 'Shutting down');
  }
  const timeout = Date.now() + 10000;
  while (sockets.size > 0 && Date.now() < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (Date.now() > timeout) {
    logger.warn('Closed');
  } else {
    logger.info('Closed');
  }
};


module.exports.getMulticastAssistRouter = (loopback          = false) => {
  active = true;

  logger.info('Attaching /api/1.0/multicast-assist');

  const router = Router({ mergeParams: true });

  router.get('/api/1.0/multicast-assist', async (req                 , res                  ) => {
    res.json({ version: pkg.version });
  });

  router.ws('/api/1.0/multicast-assist/:multicastAddress/:port/:controlPort', async (ws       , req                 ) => {
    if (!active) {
      ws.close(1000, 'Shutting down');
      return;
    }

    const multicastAddress = req.params.multicastAddress;
    const port = parseInt(req.params.port, 10);
    const controlPort = parseInt(req.params.controlPort, 10);

    const socketId = randomInteger();
    sockets.set(socketId, ws);
    logger.info(`Opened socket ID ${socketId} for ${multicastAddress}/${port}/${controlPort}`);

    let hearteatTimeout;
    let receiver;

    const handleReceiverData = (data       ) => {
      const message = getArrayBuffer(data);
      ws.send(message, { compress: false, binary: true });
    };
    ws.on('message', () => {
      clearTimeout(hearteatTimeout);
      hearteatTimeout = setTimeout(() => {
        logger.warn(`Terminating socket ID ${socketId} for ${multicastAddress}/${port}/${controlPort} after heartbeat timeout`);
        ws.terminate();
      }, 6000);
    });

    ws.on('close', async () => {
      clearTimeout(hearteatTimeout);
      try {
        logger.info(`Closed socket ${socketId}`);
        sockets.delete(socketId);
      } catch (error) {
        if (error.stack) {
          logger.error(`Error closing websocket for ${multicastAddress}/${port}/${controlPort}:`);
          error.stack.split('\n').forEach((line) => logger.error(`\t${line}`));
        } else {
          logger.error(`Error closing websocket for ${multicastAddress}/${port}/${controlPort}: ${error.message}`);
        }
      }
      if (receiver) {
        try {
          receivers.delete(receiver);
          receiver.removeListener('data', handleReceiverData);
          await receiver.shutdown();
        } catch (error) {
          if (error.stack) {
            logger.error(`Error shutting down receiver for ${multicastAddress}/${port}/${controlPort}:`);
            error.stack.split('\n').forEach((line) => logger.error(`\t${line}`));
          } else {
            logger.error(`Error shutting down receiver ${multicastAddress}/${port}/${controlPort}: ${error.message}`);
          }
        }
      }
    });

    let bindAddress;

    if (ip.isV4Format(multicastAddress)) {
      bindAddress = '0.0.0.0';
    } else if (ip.isV6Format(multicastAddress)) {
      bindAddress = '::0';
    } else {
      const message = `Invalid multicast address format ${multicastAddress}`;
      logger.error(message);
      ws.close(1000, message);
      return;
    }

    try {
      receiver = new Receiver(bindAddress, multicastAddress, port, controlPort, loopback);
      await receiver.readyPromise;
      receiver.on('data', handleReceiverData);
    } catch (error) {
      if (error.stack) {
        logger.error(`Error opening receiver for ${multicastAddress}/${port}/${controlPort}:`);
        error.stack.split('\n').forEach((line) => logger.error(`\t${line}`));
      } else {
        logger.error(`Error opening receiver for ${multicastAddress}/${port}/${controlPort}: ${error.message}`);
      }
      ws.close(1000, 'Error opening receiver');
    }
  });

  return router;
};
