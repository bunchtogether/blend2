// @flow

const BufferList = require('bl');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const WebSocket = require('isomorphic-ws');


describe('Mouse Control', () => {
  let stopHttpServer;
  const appPort = 18000 + Math.round(Math.random() * 1000);

  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, appPort);
  });

  afterAll(async () => {
    await stopHttpServer();
  });

  test('Should connect and disconnect websocket.', async () => {
    let heartbeatInterval;
    const address = `ws://127.0.0.1:${appPort}/api/1.0/application/mouse`;
    const ws = new WebSocket(address);
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
});
