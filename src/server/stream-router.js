// @flow

const { Router } = require('express');
const { ffmpegPath } = require('@bunchtogether/ffmpeg-static');
const { hash32 } = require('@bunchtogether/hash-object');
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
  // await fs.remove(thumbnailPath);
  let exists = await fs.exists(thumbnailPath);
  if (exists) {
    const stats = await fs.stat(thumbnailPath);
    if (new Date() - new Date(stats.ctime) < 60000) {
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
    const handleError = (error) => {
      if (error.stack) {
        error.stack.split('\n').forEach((line) => processLogger.error(`\t${line}`));
      } else {
        processLogger.error(error.message);
      }
      mainProcess.removeListener('error', handleError);
      mainProcess.removeListener('close', handleClose);
      reject(error);
    };
    const handleClose = (code) => {
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
    '-v', 'error',
    '-nostats',
    '-noaccurate_seek',
    '-fflags', '+discardcorrupt',
    '-err_detect', '+ignore_err',
    '-i', url,
    '-dts_delta_threshold', '1',
    '-c:a', 'aac',
    '-af', 'aresample=async=176000',
    '-c:v', 'copy',
    '-f', 'mp4',
    '-frag_duration', '100000',
    '-movflags', '+empty_moov+omit_tfhd_offset+default_base_moof',
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
  mainProcess.once('close', (code) => {
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
  logger.info(`Started FFmpeg process ${pid} with args ${args.join(' ')}`);
  mainProcess.stderr.on('data', (data) => {
    data.toString('utf8').trim().split('\n').forEach((line) => processLogger.info(line));
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

module.exports.getStreamRouter = () => {
  logger.info('Attaching /api/1.0/stream');

  const router = Router({ mergeParams: true });

  router.get('/api/1.0/stream', async (req: express$Request, res: express$Response) => {
    res.json({ version: pkg.version });
  });

  router.get('/api/1.0/stream/:url/thumbnail.jpg', async (req: express$Request, res: express$Response) => {
    const streamUrl = req.params.url;

    await fs.ensureDir(baseThumbnailPath);
    const thumbnailPath = path.join(baseThumbnailPath, `thumbnail_${hash32(streamUrl)}.jpg`);
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
    const url = req.params.url;

    const pid = activeStreamUrls.get(url);
    if (pid) {
      killProcess(pid, 'FFmpeg');
      for (let i = 0; i < 200; i += 1) {
        if (!activeStreamUrls.has(url)) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (activeStreamUrls.has(url)) {
        logger.error(`Unable to start stream for ${url}, cannot kill process ${pid}`);
        ws.close(1000, 'FFmpeg unavailable');
        return;
      }
    }

    const socketId = randomInteger();
    sockets.set(socketId, ws);
    startStream(socketId, url);
    logger.info(`Opened socket (${socketId}) at path ${req.url}`);

    ws.on('close', () => {
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
  });

  return router;
};
