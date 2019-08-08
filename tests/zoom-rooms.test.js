// @flow

const superagent = require('superagent');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getCapabilitiesRouter } = require('../src/routers/api/capabilities');
const getZoomRoomsRouter = require('../src/routers/api/zoom');
const { default: ZoomRoomsClient } = require('../vendor/client/src/zoom-rooms.js');

// const getIdRouter = require('../src/api/id');

let stopHttpServer;

const PORT = 61340;
let zoomRooms;
let zoomRoomsRouter;
let shutdownZoomRoomsRouter;

describe('Zoom Rooms', () => {
  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use('/api/1.0/capabilities', getCapabilitiesRouter());
    [zoomRoomsRouter, shutdownZoomRoomsRouter] = getZoomRoomsRouter();
    app.use('/api/1.0/zoom', zoomRoomsRouter);
    zoomRooms = new ZoomRoomsClient();
    await zoomRooms.ready;
  });

  afterAll(async () => {
    await zoomRooms.close();
    await shutdownZoomRoomsRouter();
    await stopHttpServer();
  });

  test('Make a connection', async () => {
    await superagent.post('http://127.0.0.1:61340/api/1.0/zoom/check').send({ password: '0912' });
  });
});
