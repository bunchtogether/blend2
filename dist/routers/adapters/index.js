//      

const VizioAdapter = require('./vizio');

let activeAdapter = null;
const setActiveAdapter = (adapter        ) => {
  activeAdapter = adapter;
};
const getActiveAdapter = () => activeAdapter;

module.exports = {
  vizio: VizioAdapter,
  setActiveAdapter,
  getActiveAdapter,
};
