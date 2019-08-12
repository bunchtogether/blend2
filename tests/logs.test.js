// @flow

const superagent = require('superagent');
const expect = require('expect');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getLogsRouter } = require('../src/routers/api/logs');
const { getLogRouter } = require('../src/routers/log');

jest.setTimeout(30000);

let stopHttpServer;
const PORT = 61340;

describe('Logs', () => {
  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use(getLogRouter());
    app.use('/api/1.0/logs', getLogsRouter());
  });

  afterAll(async () => {
    await stopHttpServer();
  });

  let filename;
  test('Should generate logs.', async () => {
    const response = await superagent.post('http://127.0.0.1:61340/api/1.0/logs/generate');
    expect(response.body).toHaveProperty('filename');
    expect(typeof response.body.filename).toBe('string');
    filename = response.body.filename;
    // wait for log file to be available
    await new Promise((resolve: Function) => setTimeout(resolve, 2000));
  });

  test('Should get list of logs.', async () => {
    const response = await superagent.get('http://127.0.0.1:61340/api/1.0/logs');
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].filename).toBe(filename);
    expect(response.body[0]).toHaveProperty('filepath');
    expect(response.body[0]).toHaveProperty('available');
    expect(response.body[0]).toHaveProperty('timestamp');
  });

  test('Should check if log files are available.', async () => {
    const response = await superagent.get('http://127.0.0.1:61340/api/1.0/logs/check').query({ filename });
    expect(response.body).toBe(true);
  });

  test('Should start downloading log files.', async () => {
    const response = await superagent.get('http://127.0.0.1:61340/api/1.0/logs/download').query({ filename });
    expect(response.body).toBeInstanceOf(Buffer);
  });
});
