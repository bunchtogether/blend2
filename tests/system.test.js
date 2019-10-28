// @flow

const superagent = require('superagent');
const expect = require('expect');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getSystemRouter } = require('../src/routers/api/system');


jest.setTimeout(10000);

let stopHttpServer;
const PORT = Math.round(10000 + Math.random() * 10000);

describe('Capabilities', () => {
  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use('/api/1.0/system', getSystemRouter());
  });

  afterAll(async () => {
    await stopHttpServer();
  });

  test('Gets and sets volume', async () => {
    const { volume: startVolume } = (await superagent.get(`http://127.0.0.1:${PORT}/api/1.0/system/volume`)).body;
    await superagent.post(`http://127.0.0.1:${PORT}/api/1.0/system/volume`).send({ volume: 0 });
    const response1 = await superagent.get(`http://127.0.0.1:${PORT}/api/1.0/system/volume`);
    expect(response1.body.volume).toEqual(0);
    await superagent.post(`http://127.0.0.1:${PORT}/api/1.0/system/volume`).send({ volume: 100 });
    const response2 = await superagent.get(`http://127.0.0.1:${PORT}/api/1.0/system/volume`);
    expect(response2.body.volume).toEqual(100);
    await superagent.post(`http://127.0.0.1:${PORT}/api/1.0/system/volume`).send({ volume: startVolume });
  });

  test('Gets and sets muted', async () => {
    const { muted: startMuted } = (await superagent.get(`http://127.0.0.1:${PORT}/api/1.0/system/muted`)).body;
    await superagent.post(`http://127.0.0.1:${PORT}/api/1.0/system/muted`).send({ muted: false });
    const response1 = await superagent.get(`http://127.0.0.1:${PORT}/api/1.0/system/muted`);
    expect(response1.body.muted).toEqual(false);
    await superagent.post(`http://127.0.0.1:${PORT}/api/1.0/system/muted`).send({ muted: true });
    const response2 = await superagent.get(`http://127.0.0.1:${PORT}/api/1.0/system/muted`);
    expect(response2.body.muted).toEqual(true);
    await superagent.post(`http://127.0.0.1:${PORT}/api/1.0/system/muted`).send({ muted: startMuted });
  });
});
