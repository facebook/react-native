/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r &&
      (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })),
      t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2
      ? ownKeys(Object(t), !0).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
      : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, 'string');
  return 'symbol' == typeof i ? i : String(i);
}
function _toPrimitive(t, r) {
  if ('object' != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || 'default');
    if ('object' != typeof i) return i;
    throw new TypeError('@@toPrimitive must return a primitive value.');
  }
  return ('string' === r ? String : Number)(t);
}
const _require = require('../../parsers/flow/parser'),
  FlowParser = _require.FlowParser;
const _require2 = require('../../parsers/typescript/parser'),
  TypeScriptParser = _require2.TypeScriptParser;
const fs = require('fs');
const path = require('path');
const flowParser = new FlowParser();
const typescriptParser = new TypeScriptParser();
function combineSchemas(files) {
  return files.reduce(
    (merged, filename) => {
      const contents = fs.readFileSync(filename, 'utf8');
      if (
        contents &&
        (/export\s+default\s+\(?codegenNativeComponent</.test(contents) ||
          /extends TurboModule/.test(contents))
      ) {
        const isTypeScript =
          path.extname(filename) === '.ts' || path.extname(filename) === '.tsx';
        const parser = isTypeScript ? typescriptParser : flowParser;
        const schema = parser.parseFile(filename);
        if (schema && schema.modules) {
          merged.modules = _objectSpread(
            _objectSpread({}, merged.modules),
            schema.modules,
          );
        }
      }
      return merged;
    },
    {
      modules: {},
    },
  );
}
module.exports = combineSchemas;
