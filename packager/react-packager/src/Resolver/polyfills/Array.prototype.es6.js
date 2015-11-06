/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @provides Array.prototype.es6
 * @polyfill
 */

/*eslint-disable */
/*jslint bitwise: true */

(function(undefined) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
  function findIndex(predicate, context) {
    if (this == null) {
      throw new TypeError(
        'Array.prototype.findIndex called on null or undefined'
      );
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    for (var i = 0; i < length; i++) {
      if (predicate.call(context, list[i], i, list)) {
        return i;
      }
    }
    return -1;
  }

  if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      enumerable: false,
      writable: true,
      configurable: true,
      value: findIndex
    });
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
      enumerable: false,
      writable: true,
      configurable: true,
      value: function(predicate, context) {
        if (this == null) {
          throw new TypeError(
            'Array.prototype.find called on null or undefined'
          );
        }
        var index = findIndex.call(this, predicate, context);
        return index === -1 ? undefined : this[index];
      }
    });
  }

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
})();
