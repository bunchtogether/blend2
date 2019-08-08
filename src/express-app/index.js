// @flow

const express = require('express');
const bodyParser = require('body-parser');
const gracefulExit = require('express-graceful-exit');

module.exports = () => {
  const app = express();
  app.use(gracefulExit.middleware(app));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use((req: express$Request, res: express$Response, next: express$NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,DNT,X-Access-Token,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
    res.setHeader('Access-Control-Expose-Headers', 'Authorization,DNT,X-Access-Token,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
  });
  const router = express.Router({ mergeParams: true });
  router.all('/api/*', async (req: express$Request, res: express$Response, next: express$NextFunction) => {
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });
  app.use(router);
  return app;
};
