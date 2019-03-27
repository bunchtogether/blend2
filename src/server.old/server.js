// @flow

const { EventEmitter } = require('events');
const crypto = require('crypto');
const { ffmpegPath } = require('@bunchtogether/ffmpeg-static');
const { hash64 } = require('@bunchtogether/hash-object');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const makeLogger = require('./lib/logger');
const killProcess = require('./lib/kill-process');

const logger = makeLogger('Blend Server');

const streamPathRegex = /\/api\/1.0\/websocket\/stream\/(.*)/;


const getArrayBuffer = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

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

/**
 * Class representing a Blend Server
 */
class Server extends EventEmitter {
  /**
   * Create a Blend Server.
   * @param {Object} uwsServer uWebSockets.js server
   * @param {string} websocketPattern uWebSockets.js websocket pattern
   * @param {Object} websocketBehavior uWebSockets.js websocket behavior and options
   */
  constructor(uwsServer:Object) {
    super();

    // Active sockets
    //   Key: Socket ID
    //   Value: Socket object
    this.sockets = new Map();

    // Socket / FFmpeg PID mapping
    //   Key: Socket ID
    //   Value: Stream ID
    this.socketStreamMap = new Map();

    // Stream ID / Socket ID mapping
    //   Key: Stream ID
    //   Value: Set of Socket ID
    this.streamSocketMap = new Map();

    // Stream ID / FFmpeg PID mapping
    //   Key: Stream ID
    //   Value: FFmpeg PID
    this.streamPidMap = new Map();

    this.isClosing = false;

    const options = Object.assign({}, { compression: 0, maxPayloadLength: 24 * 1024 * 1024, idleTimeout: 10 }, {
      open: (ws, req) => { // eslint-disable-line no-unused-vars
        const socketId = randomInteger();
        ws.id = socketId; // eslint-disable-line no-param-reassign
        this.sockets.set(socketId, ws);
        this.emit('open', socketId);
        logger.info(`Opened socket (${socketId}) at path ${req.getUrl()}`);
        const streamMatch = req.getUrl().match(streamPathRegex);
        if (streamMatch && streamMatch[1]) {
          this.startStream(socketId, decodeURIComponent(streamMatch[1]));
        }
      },
      close: (ws, code, data) => { // eslint-disable-line no-unused-vars
        const socketId = ws.id;
        if (!socketId) {
          logger.error('Received close without socket ID');
          return;
        }
        this.sockets.delete(socketId);
        const streamId = this.socketStreamMap.get(socketId);
        if (!streamId) {
          return;
        }
        this.socketStreamMap.delete(socketId);
        const streamSockets = this.streamSocketMap.get(streamId);
        if (!streamSockets) {
          return;
        }
        streamSockets.delete(socketId);
        if (streamSockets.size === 0) {
          this.streamSocketMap.delete(streamId);
          const pid = this.streamPidMap.get(streamId);
          if (pid) {
            killProcess(pid, 'FFmpeg');
            this.streamPidMap.delete(streamId);
          }
        }
        logger.info(`Closed socket (${socketId}), code ${code}`);
      },
    });
    uwsServer.ws('/api/1.0/websocket/*', options);
  }

  async startTestStream() {
    if (this.testStreamProcessPid) {
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
      delete this.testStreamProcessPid;
    });
    logger.info(`Started Test stream process ${mainProcess.pid} with args ${JSON.stringify(combinedArgs)}`);
    this.testStreamProcessPid = mainProcess.pid;
    mainProcess.stderr.on('data', (data) => {
      data.toString('utf8').trim().split('\n').forEach((line) => processLogger.info(line));
    });
  }

  async startStream(socketId:number, url:string) {
    if (url === 'rtp://127.0.0.1:13337') {
      await this.startTestStream();
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
    this.socketStreamMap.set(socketId, streamId);
    let streamSockets = this.streamSocketMap.get(streamId);
    if (streamSockets) {
      streamSockets.add(socketId);
      return;
    }
    streamSockets = new Set([socketId]);
    this.streamSocketMap.set(streamId, streamSockets);
    const ffmpegPathCalculated = await ffmpegPathPromise;
    const mainProcess = spawn(ffmpegPathCalculated, combinedArgs, {
      windowsHide: true,
      shell: false,
      detached: true,
    });
    const pid = mainProcess.pid;
    this.streamPidMap.set(streamId, pid);
    const processLogger = makeLogger(`FFmpeg Process ${pid}`);
    mainProcess.on('error', (error) => {
      if (error.stack) {
        error.stack.split('\n').forEach((line) => processLogger.error(`\t${line}`));
      } else {
        processLogger.error(error.message);
      }
    });
    mainProcess.once('close', (code) => {
      if (url === 'rtp://127.0.0.1:13337' && this.testStreamProcessPid) {
        killProcess(this.testStreamProcessPid, 'Test stream');
      }
      if (code && code !== 255) {
        logger.error(`FFmpeg process ${pid} exited with error code ${code}`);
      } else {
        logger.warn(`FFmpeg process ${pid} exited`);
      }
      const ss = this.streamSocketMap.get(streamId);
      if (!ss) {
        return;
      }
      for (const sId of ss) {
        const ws = this.sockets.get(sId);
        if (!ws) {
          processLogger.warn(`Cannot close socket ID ${sId} after close, socket does not exist`);
          continue;
        }
        ws.end(1000, 'Shutting down');
      }
    });
    logger.info(`Started FFmpeg process ${mainProcess.pid} with args ${JSON.stringify(combinedArgs)}`);
    mainProcess.stderr.on('data', (data) => {
      data.toString('utf8').trim().split('\n').forEach((line) => processLogger.info(line));
    });
    mainProcess.stdout.on('data', (data) => {
      const ss = this.streamSocketMap.get(streamId);
      if (!ss) {
        return;
      }
      const message = getArrayBuffer(data);
      for (const sId of ss) {
        const ws = this.sockets.get(sId);
        if (!ws) {
          processLogger.warn(`Cannot send data to socket ID ${sId}, socket does not exist`);
          continue;
        }
        ws.send(message, true, false);
      }
    });
  }

  /**
   * Stops the server by gracefully closing all sockets
   * @return {Promise<void>}
   */
  async close() {
    logger.info('Closing');
    for (const socket of this.sockets.values()) {
      socket.end(1000, 'Shutting down');
    }
    const killProcessPromises = [...this.streamPidMap.values()].map((pid) => killProcess(pid, 'FFmpeg'));
    if (this.testStreamProcessPid) {
      killProcessPromises.push(killProcess(this.testStreamProcessPid, 'Test stream'));
    }
    const timeout = Date.now() + 10000;
    while (this.sockets.size > 0 && Date.now() < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await Promise.all(killProcessPromises);
    if (Date.now() > timeout) {
      logger.warn('Closed after timeout');
    } else {
      logger.info('Closed');
    }
    this.isClosing = false;
  }

  testStreamProcessPid: number;
  isClosing: boolean;
  sockets:Map<number, Object>;
  socketStreamMap:Map<number, string>;
  streamSocketMap: Map<string, Set<number>>
  streamPidMap:Map<string, number>;
}


module.exports = Server;
