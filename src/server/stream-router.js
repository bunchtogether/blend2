// @flow

const { Router } = require('express');
const { ffmpegPath } = require('@bunchtogether/ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const ps = require('ps-node');
const path = require('path');
const crypto = require('crypto');
const makeLogger = require('./lib/logger');
const killProcess = require('./lib/kill-process');
const pkg = require('../../package.json');

const logger = makeLogger('Stream Router API');

// Active sockets
//   Key: Socket ID
//   Value: Socket object
const sockets = new Map();

// Socket / FFmpeg PID mapping
//   Key: Socket ID
//   Value: Stream PID
const socketPidMap = new Map();

// Active stream URLs
//   Value: Stream URL
const activeStreamUrls = new Set();

let testStreamProcessPid = null;

const getAudioArrayBuffer = (b: Buffer) => {
  const base = new Uint8Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  const uint8 = new Uint8Array(base.length + 1);
  uint8.set(base, 1);
  uint8[0] = 0;
  return uint8;
};

const getVideoArrayBuffer = (b: Buffer) => {
  const base = new Uint8Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  const uint8 = new Uint8Array(base.length + 1);
  uint8.set(base, 1);
  uint8[0] = 1;
  return uint8;
};

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

const startStream = async (socketId:number, url:string) => {
  activeStreamUrls.add(url);
  if (url === 'rtp://127.0.0.1:13337') {
    await startTestStream();
  }
  logger.info(`Sending ${url} to ${socketId}`);
  const args = [
    '-v', 'error',
    '-nostats',
    '-fflags', '+discardcorrupt+genpts+sortdts',
    '-err_detect', '+ignore_err',
    '-i', url,
    '-vn',
    '-c:a', 'copy',
    '-f', 'adts',
    `udp://127.0.0.1:${audioSocketPort}`,
    '-an',
    '-c:v', 'copy',
    '-f', 'mp4',
    '-movflags', '+frag_keyframe+empty_moov+omit_tfhd_offset',
    'pipe:1',
    '-metadata', 'blend=1',
  ];
  const ffmpegPathCalculated = await ffmpegPathPromise;
  const mainProcess = spawn(ffmpegPathCalculated, args, {
    windowsHide: true,
    shell: false,
    detached: true,
  });
  const pid = mainProcess.pid;
  socketPidMap.set(socketId, pid);
  const processLogger = makeLogger(`FFmpeg Process ${pid}`);
  mainProcess.on('error', (error) => {
    if (error.stack) {
      error.stack.split('\n').forEach((line) => processLogger.error(`\t${line}`));
    } else {
      processLogger.error(error.message);
    }
  });
  mainProcess.once('close', async (code) => {
    audioSocket.close();
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
      await killProcess(testStreamProcessPid, 'Test stream');
    }
    activeStreamUrls.delete(url);
  });
  logger.info(`Started FFmpeg process ${pid} with args ${args.join(' ')}`);
  mainProcess.stderr.on('data', (data) => {
    data.toString('utf8').trim().split('\n').forEach((line) => processLogger.info(line));
  });
  const videoStdOutDataHandler = (data) => {
    const ws = sockets.get(socketId);
    if (!ws) {
      mainProcess.stdout.removeListener('data', videoStdOutDataHandler);
      processLogger.error(`Cannot send video to socket ID ${socketId}, socket does not exist`);
      return;
    }
    if (ws.readyState !== 1) {
      mainProcess.stdout.removeListener('data', videoStdOutDataHandler);
      processLogger.error(`Cannot send video to socket ID ${socketId}, ready state is ${ws.readyState}`);
      return;
    }
    const message = getVideoArrayBuffer(data);
    ws.send(message, { compress: false, binary: true });
  };
  mainProcess.stdout.on('data', videoStdOutDataHandler);
};

module.exports.shutdownStreamRouter = async () => {
  logger.info('Closing');
  for (const socket of sockets.values()) {
    socket.close(1000, 'Shutting down');
  }
  const killProcessPromises = [...socketPidMap.values()].map((pid) => killProcess(pid, 'FFmpeg'));
  if (testStreamProcessPid) {
    killProcessPromises.push(killProcess(testStreamProcessPid, 'Test stream'));
  }
  const timeout = Date.now() + 10000;
  while (sockets.size > 0 && Date.now() < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await Promise.all(killProcessPromises);
  if (Date.now() > timeout) {
    logger.warn('Closed after timeout');
  } else {
    logger.info('Closed');
  }
};

const getFFmpegProcesses = async () => {
  return new Promise((resolve, reject) => {
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
}

getFFmpegProcesses.then((processes) => {
  for(const pid of processes) {
    logger.info(`Killing orphaned FFmpeg process ${pid}`);
    killProcess(pid);
  }
});

module.exports.getStreamRouter = () => {

  logger.info('Attaching /api/1.0/stream');

  const router = Router({ mergeParams: true });

  router.get('/api/1.0/stream', async (req: express$Request, res: express$Response) => {
    res.json({ version: pkg.version });
  });

  router.ws('/api/1.0/stream/:url/', async (ws:Object, req: express$Request) => {
    const url = req.params.url;

    for (let i = 0; i < 100; i += 1) {
      if (!activeStreamUrls.has(url)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (activeStreamUrls.has(url)) {
      ws.close(1000, 'FFmpeg unavailable');
      return;
    }

    const socketId = randomInteger();
    sockets.set(socketId, ws);
    startStream(socketId, url);
    logger.info(`Opened socket (${socketId}) at path ${req.url}`);

    ws.on('close', () => {
      try {
        logger.info(`Closed socket ${socketId}`);
        sockets.delete(socketId);
        const pid = socketPidMap.get(socketId);
        if (pid) {
          killProcess(pid, 'FFmpeg');
          socketPidMap.delete(pid);
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
  });

  return router;
};
