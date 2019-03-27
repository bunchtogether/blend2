//      

const { parse } = require('url');
const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const Route = require('route-parser');
const logger = require('./lib/logger')('Static Server');


/* Helper function converting Node.js buffer to ArrayBuffer */
function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

const sendFile = async (filePath, res) => {
  const exists = await fs.exists(filePath);
  if (!exists) {
    return false;
  }
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  res.writeHeader('Content-Type', mimeType);
  const data = await fs.readFile(filePath);
  res.end(toArrayBuffer(data));
  return true;
};

const playerRoute = new Route('/stream/:streamUrl/:path');
const playerIndexRoute = new Route('/stream/:streamUrl/');
const rootRoute = new Route('/stream/:path');

/**
 * Class representing a Blend Static File Server
 */
class StaticServer {
  /**
   * Create a Blend Static File Server
   * @param {Object} uwsServer uWebSockets.js server
   * @param {string} websocketPattern uWebSockets.js websocket pattern
   * @param {Object} websocketBehavior uWebSockets.js websocket behavior and options
   */
  constructor(uwsServer       ) {
    uwsServer.get('/stream/*', async (res, req) => {
      const url = req.getUrl();
      res.onAborted(() => {
        console.log('ABORTED');
      });
      let route = playerRoute.match(url);
      if (route) {
        const filePath = path.join(__dirname, '../static/player', route.path);
        const sent = await sendFile(filePath, res);
        if (!sent) {
          res.writeStatus('404');
          res.end();
        }
        return;
      }
      route = playerIndexRoute.match(url);
      if (route) {
        const filePath = path.join(__dirname, '../static/player/index.html');
        const sent = await sendFile(filePath, res);
        if (!sent) {
          res.writeStatus('404');
          res.end();
        }
        return;
      }
      route = rootRoute.match(url);
      if (route) {
        const filePath = path.join(__dirname, '../static', route.path);
        const sent = await sendFile(filePath, res);
        if (!sent) {
          try {
            parse(route.path);
            res.writeStatus('301');
            res.writeHeader('Location', `${url}/`);
            res.end();
          } catch (error) {
            console.log(error);
            res.writeStatus('404');
            res.end();
          }
        }
        return;
      }
      res.writeStatus('404');
      res.end();
    });
  }
}


module.exports = StaticServer;
