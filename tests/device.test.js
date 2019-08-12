// @flow

const superagent = require('superagent');
const expect = require('expect');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getDeviceRouter } = require('../src/routers/api/device');
const adapterMiddleware = require('../src/routers/middleware/adapter');
const { getLogRouter } = require('../src/routers/log');

jest.setTimeout(30000);

let stopHttpServer;
const PORT = 61340;

describe('Device', () => {
  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use(getLogRouter());
    app.use('/api/1.0/device', adapterMiddleware, getDeviceRouter());
  });

  afterAll(async () => {
    await stopHttpServer();
  });

  test('Should control device power', async () => {
    const power = Math.random() < 0.5;
    let response;
    try {
      response = await superagent.post('http://127.0.0.1:61340/api/1.0/device/power').send({ power });
      expect(response.body.power).toBe(power);
    } catch (error) {
      expect(error.response.text).toBe('Device not paired');
    }
  });

  test('Should control device volume', async () => {
    const volume = Math.random() < 0.5;
    let response;
    try {
      response = await superagent.post('http://127.0.0.1:61340/api/1.0/device/volume').send({ volume });
      expect(response.body.volume).toBe(volume);
    } catch (error) {
      expect(error.response.text).toBe('Device not paired');
    }
  });

  test('Should control device source', async () => {
    const source = Math.random() < 0.5;
    let response;
    try {
      response = await superagent.post('http://127.0.0.1:61340/api/1.0/device/source').send({ source });
      expect(response.body.source).toBe(source);
    } catch (error) {
      expect(error.response.text).toBe('Device not paired');
    }
  });

  test('Should control device mute state', async () => {
    let response;
    try {
      response = await superagent.post('http://127.0.0.1:61340/api/1.0/device/mute');
      expect(response.status).toBe(200);
    } catch (error) {
      expect(error.response.text).toBe('Device not paired');
    }
  });
});
