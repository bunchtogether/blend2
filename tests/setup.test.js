// @flow

const superagent = require('superagent');
const expect = require('expect');
const path = require('path');
const fs = require('fs-extra');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getSetupRouter } = require('../src/routers/api/setup');

const fileName = 'hardware_setup_ip.json';
let stopHttpServer;
const PORT = 61340;

describe('Bluescape', () => {
  const ip = '192.168.1.1';
  const ip2 = '192.168.1.2';
  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use('/api/1.0/setup', getSetupRouter());
  });

  afterAll(async () => {
    await fs.remove(path.resolve(__dirname, `../${fileName}`));
    await stopHttpServer();
  });

  test('Should get non-existing hardware IP address.', async () => {
    const response = await superagent.get('http://127.0.0.1:61340/api/1.0/setup/ip');
    expect(response.body.ip).toEqual('');
  });

  test('Should set hardware IP address.', async () => {
    const response = await superagent.put('http://127.0.0.1:61340/api/1.0/setup/ip').send({ ip });
    expect(response.status).toBe(200);
  });

  test('Should update hardware IP address.', async () => {
    const response = await superagent.put('http://127.0.0.1:61340/api/1.0/setup/ip').send({ ip: ip2 });
    expect(response.status).toBe(200);
  });

  test('Should get hardware IP address.', async () => {
    const response = await superagent.get('http://127.0.0.1:61340/api/1.0/setup/ip');
    expect(response.body.ip).toEqual(ip2);
  });

  test('Should trigger hardware update.', async () => {
    const response = await superagent.post('http://127.0.0.1:61340/api/1.0/setup/update-device');
    expect(response.status).toBe(200);
  });
});

