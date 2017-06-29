/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule toIterator
 */
'use strict';

/**
 * Given an object `toIterator` will return the itrator for that object. If the
 * object has a `Symbol.iterator` method we just call that. Otherwise we
 * implement the ES6 `Array` and `String` Iterator.
 */

/**
 * Constants
 */

var KIND_KEY = 'key';
var KIND_VALUE = 'value';
var KIND_KEY_VAL = 'key+value';
/*global Symbol: true*/
var ITERATOR_SYMBOL = (typeof Symbol === 'function')
    ? Symbol.iterator
    : '@@iterator';

var toIterator = (function() {
  if (!(Array.prototype[ITERATOR_SYMBOL] &&
        String.prototype[ITERATOR_SYMBOL])) {
    // IIFE to avoid creating classes for no reason because of hoisting.
    return (function() {
      class ArrayIterator {
        // 22.1.5.1 CreateArrayIterator Abstract Operation
        constructor(array, kind) {
          if (!Array.isArray(array)) {
            throw new TypeError('Object is not an Array');
          }
          this._iteratedObject = array;
          this._kind = kind;
          this._nextIndex = 0;
        }

        // 22.1.5.2.1 %ArrayIteratorPrototype%.next()
        next() {
          if (!this instanceof ArrayIterator) {
            throw new TypeError('Object is not an ArrayIterator');
          }

          if (this._iteratedObject == null) {
            return createIterResultObject(undefined, true);
          }

          var array = this._iteratedObject;
          var len = this._iteratedObject.length;
          var index = this._nextIndex;
          var kind = this._kind;

          if (index >= len) {
            this._iteratedObject = undefined;
            return createIterResultObject(undefined, true);
          }

          this._nextIndex = index + 1;

          if (kind === KIND_KEY) {
            return createIterResultObject(index, false);
          } else if (kind === KIND_VALUE) {
            return createIterResultObject(array[index], false);
          } else if (kind === KIND_KEY_VAL) {
            return createIterResultObject([index, array[index]], false);
          }
        }

        // 22.1.5.2.2 %ArrayIteratorPrototype%[@@iterator]()
        '@@iterator'() {
          return this;
        }
      }

      class StringIterator {
        // 21.1.5.1 CreateStringIterator Abstract Operation
        constructor(string) {
          if (typeof string !== 'string') {
            throw new TypeError('Object is not a string');
          }
          this._iteratedString = string;
          this._nextIndex = 0;
        }

        // 21.1.5.2.1 %StringIteratorPrototype%.next()
        next() {
          if (!this instanceof StringIterator) {
            throw new TypeError('Object is not a StringIterator');
          }

          if (this._iteratedString == null) {
            return createIterResultObject(undefined, true);
          }

          var index = this._nextIndex;
          var s = this._iteratedString;
          var len = s.length;

          if (index >= len) {
            this._iteratedString = undefined;
            return createIterResultObject(undefined, true);
          }

          var ret;
          var first = s.charCodeAt(index);

          if (first < 0xD800 || first > 0xDBFF || index + 1 === len) {
            ret = s[index];
          } else {
            var second = s.charCodeAt(index + 1);
            if (second < 0xDC00 || second > 0xDFFF) {
              ret = s[index];
            } else {
              ret = s[index] + s[index + 1];
            }
          }

          this._nextIndex = index + ret.length;

          return createIterResultObject(ret, false);
        }

        // 21.1.5.2.2 %StringIteratorPrototype%[@@ITERATOR_SYMBOL]()
        '@@iterator'() {
          return this;
        }
      }

      // 7.4.7 createIterResultObject(value, done)
      function createIterResultObject(value, done) {
        return {value: value, done: done};
      }

      return function(object, kind) {
        if (typeof object === 'string') {
          return new StringIterator(object);
        } else if (Array.isArray(object)) {
          return new ArrayIterator(object, kind || KIND_VALUE);
        } else {
          return object[ITERATOR_SYMBOL]();
        }
      };
    })();
  } else {
    return function(object) {
      return object[ITERATOR_SYMBOL]();
    };
  }
})();

/**
 * Export constants
 */

Object.assign(toIterator, {
  KIND_KEY,
  KIND_VALUE,
  KIND_KEY_VAL,
  ITERATOR_SYMBOL
});

module.exports = toIterator;
