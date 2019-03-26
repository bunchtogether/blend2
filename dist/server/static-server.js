//      

const { parse } = require('url');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const mime = require('mime-types');
const Route = require('route-parser');
const logger = require('./lib/logger')('Static Server');


let openStreams = 0;
let streamIndex = 0;

/* Helper function converting Node.js buffer to ArrayBuffer */
function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/* Helper function to pipe the ReadaleStream over an Http responses */
function pipeStreamOverResponse(res, readStream, totalSize) {
  /* Careful! If Node.js would emit error before the first res.tryEnd, res will hang and never time out */
  /* For this demo, I skipped checking for Node.js errors, you are free to PR fixes to this example */
  readStream.on('data', (chunk) => {
    /* We only take standard V8 units of data */
    const ab = toArrayBuffer(chunk);

    /* Store where we are, globally, in our response */
    let lastOffset = res.getWriteOffset();

    /* Streaming a chunk returns whether that chunk was sent, and if that chunk was last */
    let [ok, done] = res.tryEnd(ab, totalSize);

    /* Did we successfully send last chunk? */
    if (done) {
      readStream.destroy();
    } else if (!ok) {
      /* If we could not send this chunk, pause */
      readStream.pause();

      /* Save unsent chunk for when we can send it */
      res.ab = ab;
      res.abOffset = lastOffset;

      /* Register async handlers for drainage */
      res.onWritable((offset) => {
        /* Here the timeout is off, we can spend as much time before calling tryEnd we want to */

        /* On failure the timeout will start */
        let [ok, done] = res.tryEnd(res.ab.slice(offset - res.abOffset), totalSize);
        if (done) {
          readStream.destroy();
        } else if (ok) {
          /* We sent a chunk and it was not the last one, so let's resume reading.
           * Timeout is still disabled, so we can spend any amount of time waiting
           * for more chunks to send. */
          readStream.resume();
        }

        /* We always have to return true/false in onWritable.
         * If you did not send anything, return true for success. */
        return ok;
      });
    }

  }).on('error', (error) => {
    if (error.stack) {
      error.stack.split('\n').forEach((line) => logger.error(`\t${line}`));
    } else {
      logger.error(error.message);
    }
  });

}

const sendFile = async (filePath, res) => {
  const exists = await fs.exists(filePath);
  if(!exists) {
    return false;
  }
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  res.writeHeader('Content-Type', mimeType);
  const stats = await fs.stat(filePath);
  const readStream = fs.createReadStream(filePath);
  pipeStreamOverResponse(res, readStream, stats.size);
  return true;
}

const playerRoute = new Route('/:streamUrl/:path');
const playerIndexRoute = new Route('/:streamUrl/');
const rootRoute = new Route('/:path');

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
    uwsServer.get('/*', async (res, req) => {
      const url = req.getUrl();
      res.onAborted(() => {
        console.log("ABORTED");
      });
      let route = playerRoute.match(url);
      if(route) {
        const filePath = path.join(__dirname, '../static/player', route.path);
        let sent = await sendFile(filePath, res);
        if(!sent) {
          res.writeStatus("404");
          res.end(); 
        }
        return;
      }
      route = playerIndexRoute.match(url);
      if(route) {
        const filePath = path.join(__dirname, '../static/player/index.html');
        let sent = await sendFile(filePath, res);
        if(!sent) {
          res.writeStatus("404");
          res.end(); 
        }
        return;
      }      
      route = rootRoute.match(url);
      if(route) {
        const filePath = path.join(__dirname, '../static', route.path);
        let sent = await sendFile(filePath, res);
        if(!sent) {
          try {
            parse(route.path);
            res.writeStatus("301");
            res.writeHeader('Location', `${url}/`);
            res.end();
          } catch(error) {
            console.log(error);
            res.writeStatus("404");
            res.end();          
          }
        } 
        return;
      }
      res.writeStatus("404");
      res.end();   
    });
  }
}


module.exports = StaticServer;
