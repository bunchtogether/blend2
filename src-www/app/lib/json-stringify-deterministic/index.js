

const DEFAULTS = require('./defaults');
const isFunction = require('./util').isFunction;
const isBoolean = require('./util').isBoolean;
const isObject = require('./util').isObject;
const isArray = require('./util').isArray;
const isRegex = require('./util').isRegex;
const assign = require('./util').assign;
const keys = require('./util').keys;

function serialize(obj) {
  if (obj === null || obj === undefined) return obj;
  if (isRegex(obj)) return obj.toString();
  return obj.toJSON ? obj.toJSON() : obj;
}

function stringifyDeterministic(obj, opts) {
  opts = opts || assign({}, DEFAULTS);

  if (isFunction(opts)) opts = { compare: opts };

  const space = opts.space || DEFAULTS.space;
  const cycles = isBoolean(opts.cycles) ? opts.cycles : DEFAULTS.cycles;
  const replacer = opts.replacer || DEFAULTS.replacer;
  const stringify = opts.stringify || DEFAULTS.stringify;

  const compare = opts.compare && (function (f) {
    return function (node) {
      return function (a, b) {
        const aobj = { key: a, value: node[a] };
        const bobj = { key: b, value: node[b] };
        return f(aobj, bobj);
      };
    };
  }(opts.compare));

  // Detect circular structure in obj and raise error efficiently.
  if (!cycles) stringify(obj);

  const seen = [];

  return (function _deterministic(parent, key, node, level) {
    const indent = space ? `\n${new Array(level + 1).join(space)}` : '';
    const colonSeparator = space ? ': ' : ':';

    node = serialize(node);
    node = replacer.call(parent, key, node);

    if (node === undefined) return;

    if (!isObject(node) || node === null) return stringify(node);

    if (isArray(node)) {
      const out = [];
      for (let i = 0; i < node.length; i++) {
        const item = _deterministic(node, i, node[i], level + 1) || stringify(null);
        out.push(indent + space + item);
      }
      return `[${out.join(',')}${indent}]`;
    }
    if (cycles) {
      if (seen.indexOf(node) !== -1) {
        return stringify('[Circular]');
      }
      seen.push(node);
    }

    const nodeKeys = keys(node).sort(compare && compare(node));
    const _out = [];
    for (let _i = 0; _i < nodeKeys.length; _i++) {
      const _key = nodeKeys[_i];
      const value = _deterministic(node, _key, node[_key], level + 1);

      if (!value) continue;

      const keyValue = stringify(_key) + colonSeparator + value;
      _out.push(indent + space + keyValue);
    }
    seen.splice(seen.indexOf(node), 1);
    return `{${_out.join(',')}${indent}}`;
  }({ '': obj }, '', obj, 0));
}

module.exports = stringifyDeterministic;
