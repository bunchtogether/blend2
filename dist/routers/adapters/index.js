//      

const VizioAdapter = require('./vizio');

let activeAdapter;
const setActiveAdapter = (adapter        ) => {
  activeAdapter = adapter;
};
const getActiveAdapter = () => activeAdapter;

module.exports = {
  vizio: VizioAdapter,
  setActiveAdapter,
  getActiveAdapter,
};
