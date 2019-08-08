// @flow

// const superagent = require('superagent');
const expect = require('expect');
const getExpressApp = require('../src/server/express-app');
const startHttpServer = require('../src/server/http-server');
const { getCapabilitiesRouter } = require('../src/routers/api/capabilities');
const { getLogRouter } = require('../src/routers/log');
const getZoomRoomRouter = require('../src/routers/api/zoom-room');
const { default: ZoomRoomClient } = require('../vendor/client/src/zoom-room.js');

jest.setTimeout(30000);

let stopHttpServer;
const PORT = 61340;
let zoomRoom;
let zoomRoomRouter;
let shutdownZoomRoomRouter;

const PASSCODE = process.env.PASSCODE || '0912';

describe('Zoom Rooms', () => {
  beforeAll(async () => {
    const app = getExpressApp();
    stopHttpServer = await startHttpServer(app, PORT);
    app.use(getLogRouter());
    app.use('/api/1.0/capabilities', getCapabilitiesRouter());
    [zoomRoomRouter, shutdownZoomRoomRouter] = getZoomRoomRouter();
    app.use('/api/1.0/zoom-room', zoomRoomRouter);
    zoomRoom = new ZoomRoomClient(PASSCODE);
    await zoomRoom.ready;
  });

  afterAll(async () => {
    await zoomRoom.close();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await shutdownZoomRoomRouter();
    await stopHttpServer();
  });

  test.skip('To throw on an unsupported command', async () => {
    await expect(zoomRoom.zcommand.dial.phoneCallOut({ number:"+123" })).rejects.toThrow("Bad Request");
    //await zoomRoom.zcommand.dial.phoneCallOut({ number:"+123" });
  });

  test('To dial a number', async () => {
    await zoomRoom.zcommand.dial.phoneCallOut({ number:"8503217070" });
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
});
