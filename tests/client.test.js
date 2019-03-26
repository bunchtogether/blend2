// @flow

const startWebsocketServer = require('../src/server/uws-server');
const Server = require('../src/server/server');
const Client = require('../src/client');

jest.setTimeout(30000);

describe('Should launch a Chrome Browser with the extension loaded', () => {
  const port = Math.round(10000 + Math.random() * 10000);
  let stopWebsocketServer;
  let server;

  beforeAll(async () => {
    const ws = await startWebsocketServer('0.0.0.0', port);
    server = new Server(ws[0]);
    stopWebsocketServer = ws[1];
  });

  afterAll(async () => {
    await stopWebsocketServer();
  });

  test('Should connect and disconnect to the websocket server', async () => {
    const url = 'rtp://127.0.0.1:13337';
    const client = new Client();
    await client.open(`ws://127.0.0.1:${port}/api/1.0/websocket/stream/${encodeURIComponent(url)}`);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await client.close();
    await server.close();
  });
});
