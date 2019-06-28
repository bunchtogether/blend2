module.exports = {
  space: '',
  cycles: false,
  replacer: function replacer(k, v) {
    return v;
  },
  stringify: JSON.stringify,
};
