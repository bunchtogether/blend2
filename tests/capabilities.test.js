// @flow

const superagent = require('superagent');
const expect = require('expect');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getCapabilitiesRouter } = require('../src/routers/api/capabilities');
const { getLogRouter } = require('../src/routers/log');

jest.setTimeout(30000);

let stopHttpServer;
const PORT = 61340;

describe('Capabilities', () => {
  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use(getLogRouter());
    app.use('/api/1.0/capabilities', getCapabilitiesRouter());
  });

  afterAll(async () => {
    await stopHttpServer();
  });

  test('Checks capabilties.', async () => {
    const response = await superagent.get('http://127.0.0.1:61340/api/1.0/capabilities');
    expect(response.body).toHaveProperty('isServerAvailable');
    expect(response.body).toHaveProperty('isDeviceAvailable');
    expect(response.body).toHaveProperty('isBluescapeAvailable');
    expect(response.body).toHaveProperty('isZoomRoomAvailable');
  });
});
