// @flow

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const superagent = require('superagent');
const expect = require('expect');
const uuid = require('uuid');
const getLevelDb = require('../src/database');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getPairRouter } = require('../src/routers/api/pair');
const { getLogRouter } = require('../src/routers/log');
const constants = require('../src/constants');

jest.setTimeout(30000);

let stopHttpServer;
let closeDatabase;
const PORT = 61340;

const testDevice = {
  path: uuid.v4(),
};

describe('Pair', () => {
  beforeAll(async () => {
    const dataPath = path.join(os.homedir(), '.blend');
    const levelDbPath = path.join(dataPath, 'leveldb-test');
    await fs.ensureDir(dataPath);
    await fs.ensureDir(levelDbPath);
    const [levelDb, closeLevelDb] = await getLevelDb(levelDbPath);
    closeDatabase = closeLevelDb;
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use(getLogRouter());
    app.use('/api/1.0/pair', getPairRouter(levelDb));
  });

  afterAll(async () => {
    await stopHttpServer();
    await closeDatabase();
  });

  test('Should discover devices available for pairing.', async () => {
    const response = await superagent.post('http://127.0.0.1:61340/api/1.0/pair/discover').send({ type: constants.TYPE_SAMSUNG });
    expect(Array.isArray(response.body.devices)).toBe(true);
  });

  test('Should start pairing.', async () => {
    const response = await superagent.post('http://127.0.0.1:61340/api/1.0/pair/start').send({
      type: constants.TYPE_SAMSUNG,
      data: testDevice,
    });
    expect(response.status).toBe(200);
  });

  test('Should pair device.', async () => {
    const response = await superagent.post('http://127.0.0.1:61340/api/1.0/pair').send({ data: testDevice });
    expect(response.status).toBe(200);
  });

  test('Should get paired device.', async () => {
    const response = await superagent.get('http://127.0.0.1:61340/api/1.0/pair');
    expect(response.body.device.type).toBe(constants.TYPE_SAMSUNG);
    expect(response.body.device).toHaveProperty('sources');
    expect(response.body.device).toHaveProperty('manufacturer');
    expect(response.body.device.path).toBe(testDevice.path);
  });

  test('Should remove paired device.', async () => {
    let response = await superagent.post('http://127.0.0.1:61340/api/1.0/pair/remove');
    expect(response.status).toBe(200);

    response = await superagent.get('http://127.0.0.1:61340/api/1.0/pair');
    expect(response.body.device).toBe(null);
  });
});
