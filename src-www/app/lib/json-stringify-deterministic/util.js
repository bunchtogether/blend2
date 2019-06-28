

const _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj; };

module.exports = {
  isArray: Array.isArray,
  assign: Object.assign,
  isObject: function isObject(v) {
    return (typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object';
  },
  isFunction: function isFunction(v) {
    return typeof v === 'function';
  },
  isBoolean: function isBoolean(v) {
    return typeof v === 'boolean';
  },
  isRegex: function isRegex(v) {
    return v instanceof RegExp;
  },
  keys: Object.keys,
};
