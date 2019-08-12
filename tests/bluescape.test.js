// @flow

const superagent = require('superagent');
const expect = require('expect');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getBluescapeRouter } = require('../src/routers/api/bluescape');
const { getLogRouter } = require('../src/routers/log');
const { isAvailable } = require('../src/bluescape');

let stopHttpServer;
const PORT = 61340;

describe('Bluescape', () => {
  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use(getLogRouter());
    app.use('/api/1.0/bluescape', getBluescapeRouter());
  });

  afterAll(async () => {
    await stopHttpServer();
  });

  test('Checks if Bluescape is available.', async () => {
    expect(typeof (await isAvailable())).toBe('boolean');
  });

  test('Should focus Bluescape.', async () => {
    const response = await superagent.post('http://127.0.0.1:61340/api/1.0/bluescape/focus');
    expect(response.status).toBe(200);
  });
});

