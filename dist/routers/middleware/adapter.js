//      

const adapters = require('../../adapters');

module.exports = async (req                 , res                  , next                      ) => {
  req.adapter = await adapters.getActiveAdapter();
  if (!req.adapter) {
    res.status(400).send('Device not paired');
    return;
  }
  next();
};
