// @flow

const adapters = require('../../adapters');

module.exports = async (req: express$Request, res: express$Response, next: express$NextFunction) => {
  req.adapter = await adapters.getActiveAdapter();
  if (!req.adapter) {
    res.status(400).send('Device not paired');
    return;
  }
  next();
};
