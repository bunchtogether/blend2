// @flow

const expect = require('expect');
const dgram = require('dgram');
const bufferSlice = require('buffer-slice');
const crypto = require('crypto');
const WebSocket = require('isomorphic-ws');
const randomip = require('random-ip');
const BufferList = require('bl');
const getExpressApp = require('../src/express-app');
const startHttpServer = require('../src/http-server');
const RtpControlPacket = require('../src/multicast-assist-router/control-packet');
const RtpPacket = require('../src/multicast-assist-router/packet');
const AnnouncePacket = require('../src/multicast-assist-router/announce-packet');
const { getMulticastAssistRouter, shutdownMulticastAssistRouter } = require('../src/multicast-assist-router');

jest.setTimeout(30000);

function randomInteger() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

const BUFFER_SIZE = 1024 * 128;

const sendBuffer = async (bindAddress: string, multicastAddress:string, port: number, controlPort: number, ssrc:number, buffer: Buffer) => {
  const socket = dgram.createSocket({ type: multicastAddress.indexOf(':') === -1 ? 'udp4' : 'udp6', reuseAddr: true, sendBufferSize: BUFFER_SIZE, recvBufferSize: BUFFER_SIZE });
  await new Promise((resolve, reject) => {
    socket.once('listening', () => {
      try {
        socket.setMulticastLoopback(true);
        socket.setBroadcast(true);
        socket.setMulticastTTL(128);
        socket.addMembership(multicastAddress);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    socket.once('error', reject);
    socket.bind(port, bindAddress);
  });
  const controlSocket = dgram.createSocket({ type: multicastAddress.indexOf(':') === -1 ? 'udp4' : 'udp6', reuseAddr: true, sendBufferSize: BUFFER_SIZE, recvBufferSize: BUFFER_SIZE });
  await new Promise((resolve, reject) => {
    controlSocket.once('listening', () => {
      try {
        socket.setMulticastLoopback(true);
        controlSocket.setBroadcast(true);
        controlSocket.setMulticastTTL(128);
        controlSocket.addMembership(multicastAddress);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    controlSocket.once('error', reject);
    controlSocket.bind(controlPort, bindAddress);
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const bufferSlices = bufferSlice(buffer, 1316);
  const controlPacket = new RtpControlPacket(bufferSlices.length, buffer.length, ssrc, Date.now() / 1000 | 0);
  const controlBuffer = controlPacket.serialize();
  await new Promise((resolve) => {
    controlSocket.send(controlBuffer, 0, controlBuffer.length, controlPort, multicastAddress, resolve);
  });
  for (let j = 0; j < bufferSlices.length; j += 1) {
    const packet = new RtpPacket(bufferSlices[j], j, ssrc);
    const packetSerialized = packet.serialize();
    await new Promise((resolve) => {
      socket.send(packetSerialized, 0, packetSerialized.length, port, multicastAddress, resolve);
    });
  }
  const socketClose = new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.once('close', resolve);
    socket.close();
  });
  const controlSocketClose = new Promise((resolve, reject) => {
    controlSocket.once('error', reject);
    controlSocket.once('close', resolve);
    controlSocket.close();
  });
  await Promise.all([socketClose, controlSocketClose]);
};

describe('Multicast Assist', () => {
  let stopHttpServer;
  const appPort = 18000 + Math.round(Math.random() * 1000);

  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, appPort);
    app.use(getMulticastAssistRouter(true));
  });

  afterAll(async () => {
    await shutdownMulticastAssistRouter();
    await stopHttpServer();
  });

  test('Should serialize and deserialize announce packets.', async () => {
    const ssrc = randomInteger();
    const buffer = crypto.randomBytes(Math.round(Math.random() * 256));
    const packet = new RtpPacket(buffer, 0, ssrc);
    const deserializedPacket = RtpPacket.deserialize(packet.serialize());
    expect(packet.ssrc).toEqual(deserializedPacket.ssrc);
    expect(packet.payload).toEqual(deserializedPacket.payload);
    expect(packet.payload).toEqual(buffer);
    expect(deserializedPacket.payload).toEqual(buffer);
    expect(packet.payloadType).toEqual(deserializedPacket.payloadType);
    expect(packet.sequenceNumber).toEqual(deserializedPacket.sequenceNumber);
  });

  test('Should serialize and deserialize packets.', async () => {
    const ssrc = randomInteger();
    const packet = new AnnouncePacket(ssrc);
    const deserializedPacket = AnnouncePacket.deserialize(packet.serialize());
    expect(packet.ssrc).toEqual(deserializedPacket.ssrc);
  });

  test('Should connect and disconnect websocket.', async () => {
    const multicastAddress = randomip('224.0.2.0', 12);
    const port = 19000 + Math.round(Math.random() * 1000);
    const controlPort = port + 1;
    let heartbeatInterval;
    const address = `ws://127.0.0.1:${appPort}/api/1.0/multicast-assist/${encodeURIComponent(multicastAddress)}/${port}/${controlPort}`;
    const ws = new WebSocket(address);
    ws.binaryType = 'arraybuffer';
    const bl = new BufferList();
    ws.onmessage = (event) => {
      bl.append(event.data);
    };
    const closePromise = new Promise((resolve) => {
      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        resolve();
      };
    });
    await new Promise((resolve) => {
      ws.onopen = () => {
        heartbeatInterval = setInterval(() => {
          if (ws.readyState === 1) {
            ws.send(new Uint8Array([]));
          }
        }, 5000);
        resolve();
      };
    });
    ws.terminate();
    await closePromise;
  });

  test('Should receive multicast buffers', async () => {
    const multicastAddress = randomip('224.0.2.0', 12);
    const port = 19000 + Math.round(Math.random() * 1000);
    const controlPort = port + 1;
    let heartbeatInterval;
    const address = `ws://127.0.0.1:${appPort}/api/1.0/multicast-assist/${encodeURIComponent(multicastAddress)}/${port}/${controlPort}`;
    const ws = new WebSocket(address);
    ws.binaryType = 'arraybuffer';
    const bl = new BufferList();
    ws.onmessage = (event) => {
      bl.append(event.data);
    };
    const closePromise = new Promise((resolve) => {
      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        resolve();
      };
    });
    await new Promise((resolve) => {
      ws.onopen = () => {
        heartbeatInterval = setInterval(() => {
          if (ws.readyState === 1) {
            ws.send(new Uint8Array([]));
          }
        }, 5000);
        resolve();
      };
    });
    const ssrc = randomInteger();
    const buffer = crypto.randomBytes(Math.round(Math.random() * 1024 * 256));
    await sendBuffer('0.0.0.0', multicastAddress, port, controlPort, ssrc, buffer);
    await new Promise((resolve) => setTimeout(resolve, 100));
    ws.close();
    await closePromise;
    expect(buffer).toEqual(bl.slice(0));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
});

