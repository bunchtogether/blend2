//      

const { parse } = require('url');
const { Router } = require('express');
const { ffmpegPath } = require('@bunchtogether/ffmpeg-static');
const { hash64 } = require('@bunchtogether/hash-object');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const makeLogger = require('./lib/logger');
const killProcess = require('./lib/kill-process');

const logger = makeLogger('Stream Router API');

// Active sockets
//   Key: Socket ID
//   Value: Socket object
const sockets = new Map();

// Socket / FFmpeg PID mapping
//   Key: Socket ID
//   Value: Stream ID
const socketStreamMap = new Map();

// Stream ID / Socket ID mapping
//   Key: Stream ID
//   Value: Set of Socket ID
const streamSocketMap = new Map();

// Stream ID / TimeoutID mapping
//   Key: Stream ID
//   Value: TimeoutID for stopping the stream
const streamStopTimeoutMap = new Map();

// Stream ID / FFmpeg PID mapping
//   Key: Stream ID
//   Value: FFmpeg PID
const streamPidMap = new Map();

let testStreamProcessPid = null;

const getArrayBuffer = (b        ) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

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
    '-stream_loop', '-1',
    '-re',
    '-i', sampleFilePath,
    '-threads', '2',
    '-acodec', 'copy',
    '-vcodec', 'copy',
    '-f', 'rtp_mpegts',
    'rtp://127.0.0.1:13337',
  ];
  const combinedArgs = ['-v', 'error', '-nostats'].concat(args, ['-metadata', 'blend=1']);
  const mainProcess = spawn(ffmpegPathCalculated, combinedArgs, {
    windowsHide: true,
    shell: false,
    detached: true,
  });
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
  logger.info(`Started Test stream process ${mainProcess.pid} with args ${JSON.stringify(combinedArgs)}`);
  testStreamProcessPid = mainProcess.pid;
  mainProcess.stderr.on('data', (data) => {
    data.toString('utf8').trim().split('\n').forEach((line) => processLogger.info(line));
  });
};

const startStream = async (socketId       , url       ) => {
  if (url === 'rtp://127.0.0.1:13337') {
    await startTestStream();
  }
  logger.info(`Sending ${url} to ${socketId}`);
  const args = [
    '-noaccurate_seek',
    '-err_detect', '+ignore_err',
    '-i', url,
    '-loglevel', 'debug',
    '-c:a', 'copy',
    '-c:v', 'copy',
    '-f', 'mpegts',
  ];
  const combinedArgs = ['-v', 'error', '-nostats'].concat(args, ['-metadata', 'blend=1', '-']);
  const streamId = hash64(combinedArgs);
  let streamTimeout = streamStopTimeoutMap.get(streamId);
  if(streamTimeout) {
    clearTimeout(streamTimeout);
  }
  socketStreamMap.set(socketId, streamId);
  let streamSockets = streamSocketMap.get(streamId);
  if (streamSockets) {
    streamSockets.add(socketId);
    return;
  }
  streamSockets = new Set([socketId]);
  streamSocketMap.set(streamId, streamSockets);
  const ffmpegPathCalculated = await ffmpegPathPromise;
  const mainProcess = spawn(ffmpegPathCalculated, combinedArgs, {
    windowsHide: true,
    shell: false,
    detached: true,
  });
  const pid = mainProcess.pid;
  streamPidMap.set(streamId, pid);
  const processLogger = makeLogger(`FFmpeg Process ${pid}`);
  mainProcess.on('error', (error) => {
    if (error.stack) {
      error.stack.split('\n').forEach((line) => processLogger.error(`\t${line}`));
    } else {
      processLogger.error(error.message);
    }
  });
  mainProcess.once('close', (code) => {
    if (url === 'rtp://127.0.0.1:13337' && testStreamProcessPid) {
      killProcess(testStreamProcessPid, 'Test stream');
    }
    if (code && code !== 255) {
      logger.error(`FFmpeg process ${pid} exited with error code ${code}`);
    } else {
      logger.warn(`FFmpeg process ${pid} exited`);
    }
    const ss = streamSocketMap.get(streamId);
    if (!ss) {
      return;
    }
    for (const sId of ss) {
      const ws = sockets.get(sId);
      if (!ws) {
        processLogger.warn(`Cannot close socket ID ${sId} after close, socket does not exist`);
        continue;
      }
      ws.close(1000, 'Shutting down');
    }
  });
  logger.info(`Started FFmpeg process ${mainProcess.pid} with args ${JSON.stringify(combinedArgs)}`);
  mainProcess.stderr.on('data', (data) => {
    data.toString('utf8').trim().split('\n').forEach((line) => processLogger.info(line));
  });
  mainProcess.stdout.on('data', (data) => {
    const ss = streamSocketMap.get(streamId);
    if (!ss) {
      return;
    }
    const message = getArrayBuffer(data);
    for (const sId of ss) {
      const ws = sockets.get(sId);
      if (!ws) {
        processLogger.warn(`Cannot send data to socket ID ${sId}, socket does not exist`);
        continue;
      }
      if(ws.readyState !== 1) {
        processLogger.warn(`Cannot send data to socket ID ${sId}, ready state is ${ws.readyState}`);
        continue;        
      }
      ws.send(message, {compress: false, binary: true});
    }
  });
};

module.exports.shutdownStreamRouter = async () => {
  logger.info('Closing');
  for (const socket of sockets.values()) {
    socket.close(1000, 'Shutting down');
  }
  const killProcessPromises = [...streamPidMap.values()].map((pid) => killProcess(pid, 'FFmpeg'));
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

module.exports.getStreamRouter = () => {
  logger.info('Attaching /api/1.0/stream');

  const router = Router({ mergeParams: true });

  router.ws('/api/1.0/stream/:url/stream', async (ws       , req                 ) => {
    let url;
    // let protocol;

    try {
      url = req.params.url;
      // protocol = parse(url).protocol;
    } catch (error) {
      logger.error(`Expected a URI-encoded URI string, but got: "${req.params.url}"`);
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
        const streamId = socketStreamMap.get(socketId);
        if (!streamId) {
          return;
        }
        socketStreamMap.delete(socketId);
        const streamSockets = streamSocketMap.get(streamId);
        if (!streamSockets) {
          return;
        }
        streamSockets.delete(socketId);
        let streamTimeout = streamStopTimeoutMap.get(streamId);
        if(streamTimeout) {
          clearTimeout(streamTimeout);
        }
        streamTimeout = setTimeout(() => {
          streamStopTimeoutMap.delete(streamId);
          if (streamSockets.size === 0) {
            streamSocketMap.delete(streamId);
            const pid = streamPidMap.get(streamId);
            if (pid) {
              killProcess(pid, 'FFmpeg');
              streamPidMap.delete(streamId);
            }
          }
        }, 10000);
        streamStopTimeoutMap.get(streamId, streamTimeout);
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
