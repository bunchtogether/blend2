// @flow

const { Router } = require('express');
const { ffmpegPath } = require('@bunchtogether/ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const dgram = require('dgram');
const os = require('os');
const ps = require('ps-node');
const path = require('path');
const crypto = require('crypto');
const broadcastAddress = require('broadcast-address');
const makeLogger = require('../lib/logger');
const killProcess = require('../lib/kill-process');
const pkg = require('../../package.json');
const { API_PORT } = require('../constants');
const { deserializeBlendBox } = require('../lib/blend-box');

let active = false;

const startRegex = /start: ([0-9]+\.[0-9]+)/;

const logger = makeLogger('Stream Router API');

const BLEND_BOX_DELIMETER = Buffer.from([0x73, 0x6B, 0x69, 0x70]);

let broadcastSocket = null;
let broadcastAddresses = [];
let broadcastAddressesInterval;

const getBroadcastAddresses = () => {
  broadcastAddresses = [];
  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.keys(networkInterfaces)) {
    if (networkInterfaces[iface] && networkInterfaces[iface].length > 0) {
      if (networkInterfaces[iface][0].internal) {
        continue;
      }
    }
    try {
      const address = broadcastAddress(iface);
      broadcastAddresses.push(address);
      logger.info(`Found broadcast addresses ${address} for interface ${iface}`);
    } catch (error) {
      logger.warn(`Unable to get broadcast address for interface ${iface}`);
    }
  }
};

getBroadcastAddresses();

const broadcastBlendBox = (blendBox:Buffer) => {
  if (!broadcastSocket) {
    return;
  }
  for (const address of broadcastAddresses) {
    broadcastSocket.send(blendBox, 0, 40, API_PORT, address);
  }
};

// Active sockets
//   Key: Socket ID
//   Value: Socket object
const sockets = new Map();

// Socket / FFmpeg PID mapping
//   Key: Socket ID
//   Value: Stream PID
const socketPidMap = new Map();

// Active stream URLs
//   Key: Stream URL
//   Value: Stream PID
const activeStreamUrls = new Map();

let testStreamProcessPid = null;

const baseThumbnailPath = path.join(os.tmpdir(), 'blend-thumbnails');

const getArrayBuffer = (b: Buffer) => new Uint8Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));

function randomInteger() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

const ffmpegPathPromise = (async () => {
  const modulePathExists = await fs.exists(ffmpegPath);
  if (modulePathExists) {
    return ffmpegPath;
  }
  const localPath = path.resolve(process.cwd(), os.platform() !== 'win32' ? 'ffmpeg' : 'ffmpeg.exe');
  const localPathExists = await fs.exists(localPath);
  if (localPathExists) {
    return localPath;
  }
  throw new Error('Unable to locate FFmpeg executable');
})();

const sampleFilePathPromise = (async () => {
  const basePath = path.resolve(__dirname, '../sample.mp4');
  const basePathExists = await fs.exists(basePath);
  if (basePathExists) {
    return basePath;
  }
  const localPath = path.resolve(process.cwd(), 'sample.mp4');
  const localPathExists = await fs.exists(localPath);
  if (localPathExists) {
    return localPath;
  }
  throw new Error('Unable to locate sample file');
})();

const startTestStream = async () => {
  if (testStreamProcessPid) {
    return;
  }
  const ffmpegPathCalculated = await ffmpegPathPromise;
  const sampleFilePath = await sampleFilePathPromise;
  const args = [
    '-v',
    'error',
    '-nostats',
    '-stream_loop', '-1',
    '-re',
    '-i', sampleFilePath,
    '-threads', '2',
    '-acodec', 'copy',
    '-vcodec', 'copy',
    '-f', 'rtp_mpegts',
    'rtp://127.0.0.1:13337',
    '-metadata', 'blend=1',
  ];
  const mainProcess = spawn(ffmpegPathCalculated, args, {
    windowsHide: true,
    shell: false,
    detached: true,
  });
  testStreamProcessPid = mainProcess.pid;
  const processLogger = makeLogger(`Test stream process ${mainProcess.pid}`);
  mainProcess.on('error', (error) => {
    if (error.stack) {
      error.stack.split('\n').forEach((line) => processLogger.error(`\t${line}`));
    } else {
      processLogger.error(error.message);
    }
  });
  mainProcess.once('close', (code) => {
    if (code && code !== 255) {
      logger.error(`Test stream process ${mainProcess.pid} exited with error code ${code}`);
    }
    testStreamProcessPid = null;
  });
  logger.info(`Started Test stream process ${mainProcess.pid} with args ${args.join(' ')}`);
  mainProcess.stderr.on('data', (data) => {
    data.toString('utf8').trim().split('\n').forEach((line) => processLogger.info(line));
  });
};

const getThumbnail = async (streamUrl:string, thumbnailPath:string) => {
  let exists = await fs.exists(thumbnailPath);
  if (exists) {
    const stats = await fs.stat(thumbnailPath);
    if (new Date() - new Date(stats.ctime) < 3600000) {
      return;
    }
  }
  const args = [
    '-threads', '1',
    '-i', streamUrl,
    '-vf', 'fps=fps=1',
    '-frames', '1',
    '-threads', '1',
    '-y', '-s', '640x360',
    '-f',
    'mjpeg',
    '-pix_fmt',
    'yuvj444p',
    thumbnailPath,
  ];
  const ffmpegPathCalculated = await ffmpegPathPromise;
  const mainProcess = spawn(ffmpegPathCalculated, args, {
    windowsHide: true,
    shell: false,
    detached: true,
  });
  const pid = mainProcess.pid;
  const processLogger = makeLogger(`FFmpeg Thumbnail Process ${pid}`);
  mainProcess.stderr.on('data', (data) => {
    data.toString('utf8').trim().split('\n').forEach((line) => processLogger.info(line));
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      mainProcess.removeListener('error', handleError);
      mainProcess.removeListener('close', handleClose);
      killProcess(pid, 'FFmpeg Thumbnail Process');
      reject(new Error(`Thumbnail creation for stream ${streamUrl} timed out after 10000ms, killing process`));
    }, 10000);
    const handleError = (error) => {
      if (error.stack) {
        error.stack.split('\n').forEach((line) => processLogger.error(`\t${line}`));
      } else {
        processLogger.error(error.message);
      }
      clearTimeout(timeout);
      mainProcess.removeListener('error', handleError);
      mainProcess.removeListener('close', handleClose);
      reject(error);
    };
    const handleClose = (code) => {
      clearTimeout(timeout);
      mainProcess.removeListener('error', handleError);
      mainProcess.removeListener('close', handleClose);
      if (code && code !== 255) {
        const message = `Failed to create thumbnail for stream ${streamUrl}, process failed with code ${code}`;
        processLogger.error(message);
        reject(new Error(message));
      } else {
        resolve();
      }
    };
    mainProcess.on('error', handleError);
    mainProcess.once('close', handleClose);
  });
  exists = await fs.exists(thumbnailPath);
  if (!exists) {
    const message = `Failed to create thumbnail for stream ${streamUrl}`;
    processLogger.error(message);
    throw new Error(message);
  }
  processLogger.info(`Created thumbnail for stream ${streamUrl}`);
};

const startStream = async (socketId:number, url:string) => {
  if (url === 'rtp://127.0.0.1:13337') {
    await startTestStream();
  }
  logger.info(`Sending ${url} to ${socketId}`);
  const args = [
    '-nostats',
    '-fflags', '+discardcorrupt',
    '-err_detect', '+ignore_err',
    '-copyts',
    '-i', url,
    '-c:a', 'aac',
    '-af', 'aresample=async=176000',
    '-c:v', 'copy',
    '-f', 'mp4',
    '-write_prft', 'wallclock',
    '-muxdelay', '0',
    '-muxpreload', '0',
    '-movflags', '+frag_keyframe+empty_moov+default_base_moof',
    'pipe:1',
    '-metadata', 'blend=1',
  ];
  const ffmpegPathCalculated = await ffmpegPathPromise;
  if (!active) {
    return;
  }
  const mainProcess = spawn(ffmpegPathCalculated, args, {
    windowsHide: true,
    shell: false,
    detached: true,
  });
  const pid = mainProcess.pid;
  activeStreamUrls.set(url, pid);
  socketPidMap.set(socketId, pid);
  const processLogger = makeLogger(`FFmpeg Process ${pid}`);
  mainProcess.on('error', (error) => {
    activeStreamUrls.delete(url);
    if (error.stack) {
      error.stack.split('\n').forEach((line) => processLogger.error(`\t${line}`));
    } else {
      processLogger.error(error.message);
    }
  });
  const handleStart = (start:number) => {
    const freeBox = Buffer.alloc(20);
    freeBox.set([0x00, 0x00, 0x00, 0x14, 0x66, 0x72, 0x65, 0x65], 0);
    freeBox.set([0x3E, 0x3E], 8);
    freeBox.writeDoubleBE(start, 10);
    const ws = sockets.get(socketId);
    if (!ws) {
      mainProcess.stdout.removeListener('data', stdOutDataHandler);
      processLogger.error(`Cannot send start message to socket ID ${socketId}, socket does not exist`);
      return;
    }
    if (ws.readyState !== 1) {
      mainProcess.stdout.removeListener('data', stdOutDataHandler);
      processLogger.error(`Cannot send start message to socket ID ${socketId}, ready state is ${ws.readyState}`);
      return;
    }
    ws.send(freeBox, { compress: false, binary: true });
  };
  const syncPeers = {};
  const syncPeerReportingInterval = setInterval(() => {
    const cutoff = Date.now() - 20000;
    for (const peerAddress of Object.keys(syncPeers)) {
      if (syncPeers[peerAddress] < cutoff) {
        delete syncPeers[peerAddress];
      }
    }
    const peerAddresses = Object.keys(syncPeers);
    if (peerAddresses.length > 0) {
      logger.info(`Syncing with ${peerAddresses.join(', ')}`);
    }
  }, 10000);
  const handleBroadcastMessage = (message, rinfo) => {
    const blendBoxIndex = message.indexOf(BLEND_BOX_DELIMETER);
    if (blendBoxIndex !== 4) {
      return;
    }
    syncPeers[`${rinfo.address}:${rinfo.port}`] = Date.now();
    const ws = sockets.get(socketId);
    if (!ws) {
      mainProcess.stdout.removeListener('data', stdOutDataHandler);
      processLogger.error(`Cannot send sync message to socket ID ${socketId}, socket does not exist`);
      return;
    }
    if (ws.readyState !== 1) {
      mainProcess.stdout.removeListener('data', stdOutDataHandler);
      processLogger.error(`Cannot send sync message to socket ID ${socketId}, ready state is ${ws.readyState}`);
      return;
    }
    const blendBox = message.slice(0, 40);
    try {
      deserializeBlendBox(blendBox);
      ws.send(blendBox, { compress: false, binary: true });
    } catch (error) {
      logger.error(`Unable to validate sync message from ${rinfo.address}:${rinfo.port}`);
      logger.errorStack(error);
    }
  };
  if (broadcastSocket) {
    broadcastSocket.on('message', handleBroadcastMessage);
  }
  mainProcess.once('close', (code) => {
    if (broadcastSocket) {
      broadcastSocket.removeListener('message', handleBroadcastMessage);
    }
    clearInterval(syncPeerReportingInterval);
    activeStreamUrls.delete(url);
    socketPidMap.delete(socketId);
    if (code && code !== 255) {
      logger.error(`FFmpeg process ${pid} exited with error code ${code}`);
    } else {
      logger.warn(`FFmpeg process ${pid} exited`);
    }
    const ws = sockets.get(socketId);
    if (ws) {
      ws.close(1000, 'FFmpeg process closed');
    } else {
      processLogger.warn(`Cannot close socket ID ${socketId} after close, socket does not exist`);
    }
    if (url === 'rtp://127.0.0.1:13337' && testStreamProcessPid) {
      killProcess(testStreamProcessPid, 'Test stream');
    }
  });
  logger.info(`Started FFmpeg process ${pid} for socket ID ${socketId} with args ${args.join(' ')}`);
  let foundStart = false;
  mainProcess.stderr.on('data', (data) => {
    const message = data.toString('utf8');
    if (!foundStart) {
      const match = startRegex.exec(message);
      if (match && match[1]) {
        foundStart = true;
        handleStart(parseFloat(match[1]));
      }
    }
    message.trim().split('\n').forEach((line) => processLogger.info(line));
  });
  const stdOutDataHandler = (data) => {
    const ws = sockets.get(socketId);
    if (!ws) {
      mainProcess.stdout.removeListener('data', stdOutDataHandler);
      processLogger.error(`Cannot send stream to socket ID ${socketId}, socket does not exist`);
      return;
    }
    if (ws.readyState !== 1) {
      mainProcess.stdout.removeListener('data', stdOutDataHandler);
      processLogger.error(`Cannot send stream to socket ID ${socketId}, ready state is ${ws.readyState}`);
      return;
    }
    const message = getArrayBuffer(data);
    ws.send(message, { compress: false, binary: true });
  };
  mainProcess.stdout.on('data', stdOutDataHandler);
};

const getFFmpegProcesses = async () => new Promise((resolve, reject) => {
  ps.lookup({ command: 'ffmpeg' }, (error, resultList) => {
    if (error) {
      reject(error);
    } else {
      const processes = new Set();
      resultList.forEach((result) => {
        if (result.arguments && result.arguments.indexOf('blend=1') !== -1) {
          processes.add(parseInt(result.pid, 10));
        }
      });
      resolve(processes);
    }
  });
});

getFFmpegProcesses().then((processes) => {
  for (const pid of processes) {
    logger.info(`Killing orphaned FFmpeg process ${pid}`);
    killProcess(pid, 'FFmpeg (Orphan)');
  }
});


module.exports.shutdownStreamRouter = async () => {
  active = false;
  logger.info('Closing');
  clearInterval(broadcastAddressesInterval);
  if (broadcastSocket) {
    const bs = broadcastSocket;
    await new Promise((resolve, reject) => {
      const handleError = (error) => {
        bs.removeListener('error', handleError);
        bs.removeListener('close', handleClose);
        reject(error);
      };
      const handleClose = () => {
        bs.removeListener('error', handleError);
        bs.removeListener('close', handleClose);
        resolve();
      };
      bs.on('error', handleError);
      bs.on('close', handleClose);
      bs.close();
    });
  }
  const killProcessPromises = [...socketPidMap.values()].map((pid) => killProcess(pid, 'FFmpeg'));
  if (testStreamProcessPid) {
    killProcessPromises.push(killProcess(testStreamProcessPid, 'Test stream'));
  }
  for (const socket of sockets.values()) {
    socket.close(1000, 'Shutting down');
  }
  const timeout = Date.now() + 10000;
  while (sockets.size > 0 && Date.now() < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await Promise.all(killProcessPromises);
  const ffmpegProcesses = await getFFmpegProcesses();
  for (const pid of ffmpegProcesses) {
    logger.info(`Killing orphaned FFmpeg process ${pid}`);
    await killProcess(pid, 'FFmpeg (Orphan)');
  }
  await fs.remove(baseThumbnailPath);
  if (Date.now() > timeout) {
    logger.warn('Closed');
  } else {
    logger.info('Closed');
  }
};


module.exports.getStreamRouter = () => {
  broadcastSocket = dgram.createSocket('udp4');


  broadcastSocket.bind(API_PORT, undefined, () => {
    if (broadcastSocket) {
      broadcastSocket.setBroadcast(true);
    }
  });

  broadcastAddressesInterval = setInterval(getBroadcastAddresses, 1000 * 60 * 60);

  active = true;

  logger.info('Attaching /api/1.0/stream');

  const router = Router({ mergeParams: true });

  router.get('/api/1.0/stream', async (req: express$Request, res: express$Response) => {
    res.json({ version: pkg.version });
  });

  router.get('/api/1.0/stream/:url/thumbnail.jpg', async (req: express$Request, res: express$Response) => {
    if (!active) {
      res.status(404).send('Server shutting down');
      return;
    }

    const streamUrl = req.params.url;

    await fs.ensureDir(baseThumbnailPath);
    const thumbnailPath = path.join(baseThumbnailPath, `thumbnail_${crypto.createHash('sha256').update(streamUrl).digest().toString('hex')}.jpg`);
    try {
      await getThumbnail(streamUrl, thumbnailPath);
    } catch (error) {
      if (error.stack) {
        logger.error('Error generating thumbnail:');
        error.stack.split('\n').forEach((line) => logger.error(`\t${line}`));
      } else {
        logger.error(`Error generating thumbnail: ${error.message}`);
      }
      res.status(500).send(`Error generating thumbnail for ${streamUrl}`);
      return;
    }
    res.sendFile(thumbnailPath);
  });

  router.ws('/api/1.0/stream/:url/', async (ws:Object, req: express$Request) => {
    if (!active) {
      ws.close(1000, 'Shutting down');
      return;
    }

    const url = req.params.url;

    const socketId = randomInteger();
    sockets.set(socketId, ws);
    logger.info(`Opened socket ID ${socketId} for stream ${req.url}`);

    let hearteatTimeout;
    ws.on('message', (event) => {
      const blendBoxIndex = event.indexOf(BLEND_BOX_DELIMETER);
      if (blendBoxIndex === 4) {
        broadcastBlendBox(event.slice(0, 40));
      }
      clearTimeout(hearteatTimeout);
      hearteatTimeout = setTimeout(() => {
        logger.warn(`Terminating socket ID ${socketId} for stream ${req.url} after heartbeat timeout`);
        ws.terminate();
      }, 6000);
    });

    ws.on('close', () => {
      clearTimeout(hearteatTimeout);
      try {
        logger.info(`Closed socket ${socketId}`);
        sockets.delete(socketId);
        const closedSocketPid = socketPidMap.get(socketId);
        if (closedSocketPid) {
          killProcess(closedSocketPid, 'FFmpeg');
          socketPidMap.delete(closedSocketPid);
        }
      } catch (error) {
        if (error.stack) {
          logger.error('Error closing websocket:');
          error.stack.split('\n').forEach((line) => logger.error(`\t${line}`));
        } else {
          logger.error(`Error closing websocket: ${error.message}`);
        }
      }
    });

    for (let i = 0; i < 100; i += 1) {
      if (!activeStreamUrls.has(url) || !sockets.has(socketId)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!sockets.has(socketId)) {
      logger.error(`Not starting  stream for ${url}, socket closed`);
      return;
    }

    const activeStreamPid = activeStreamUrls.get(url);
    if (activeStreamPid) {
      logger.error(`Unable to start stream for ${url}, stream ${activeStreamPid} is active`);
      ws.close(1000, `Unable to start stream for ${url}, stream ${activeStreamPid} is active`);
      return;
    }
    startStream(socketId, url);
  });

  return router;
};
