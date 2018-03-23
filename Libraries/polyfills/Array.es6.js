/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Array.es6
 * @polyfill
 * @nolint
 */

/* eslint-disable consistent-this */

/**
 * Creates an array from array like objects.
 *
 * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-array.from
 */
if (!Array.from) {
  Array.from = function(arrayLike /*, mapFn, thisArg */) {
    if (arrayLike == null) {
      throw new TypeError('Object is null or undefined');
    }

    // Optional args.
    var mapFn = arguments[1];
    var thisArg = arguments[2];

    var C = this;
    var items = Object(arrayLike);
    var symbolIterator = typeof Symbol === 'function'
      ? Symbol.iterator
      : '@@iterator';
    var mapping = typeof mapFn === 'function';
    var usingIterator = typeof items[symbolIterator] === 'function';
    var key = 0;
    var ret;
    var value;

    if (usingIterator) {
      ret = typeof C === 'function'
        ? new C()
        : [];
      var it = items[symbolIterator]();
      var next;

      while (!(next = it.next()).done) {
        value = next.value;

        if (mapping) {
          value = mapFn.call(thisArg, value, key);
        }

        ret[key] = value;
        key += 1;
      }

      ret.length = key;
      return ret;
    }

    var len = items.length;
    if (isNaN(len) || len < 0) {
      len = 0;
    }

    ret = typeof C === 'function'
      ? new C(len)
      : new Array(len);

    while (key < len) {
      value = items[key];

      if (mapping) {
        value = mapFn.call(thisArg, value, key);
      }

      ret[key] = value;

      key += 1;
    }

    ret.length = key;
    return ret;
  };
}
