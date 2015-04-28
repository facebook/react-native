/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @provides Array.prototype.es6
 * @polyfill
 * @requires __DEV__
 */

/*eslint-disable */
/*jslint bitwise: true */

(function (undefined) {
  if (__DEV__) {
    // Define DEV-only setter that blows up when someone incorrectly
    // iterates over arrays.
    try {
      Object.defineProperty && Object.defineProperty(
        Array.prototype,
        '__ARRAY_ENUMERATION_GUARD__',
        {
          configurable: true,
          enumerable: true,
          get: function() {
            console.error(
              'Your code is broken! Do not iterate over arrays with ' +
              'for...in.'
            );
          }
        }
      );
    } catch (e) {
      // Nothing
    }
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
  function findIndex(predicate, context) {
    /**
     * Why am I seeing this "findIndex" method as a value in my array!?
     *
     * We polyfill the "findIndex" method -- called like
     * `[1, 2, 3].findIndex(1)` -- for older browsers. A side effect of the way
     * we do that is that the method is enumerable. If you were incorrectly
     * iterating over your array using the object property iterator syntax
     * `for (key in obj)` you will see the method name "findIndex" as a key.
     *
     * To fix your code please do one of the following:
     *
     *  - Use a regular for loop with index.
     *  - Use one of the array methods: a.forEach, a.map, etc.
     *  - Guard your body of your loop with a `arr.hasOwnProperty(key)` check.
     */
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
    Array.prototype.findIndex = findIndex;
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
  if (!Array.prototype.find) {
    Array.prototype.find = function(predicate, context) {
      /**
       * Why am I seeing this "find" method as a value in my array!?
       *
       * We polyfill the "find" method -- called like
       * `[1, 2, 3].find(1)` -- for older browsers. A side effect of the way
       * we do that is that the method is enumerable. If you were incorrectly
       * iterating over your array using the object property iterator syntax
       * `for (key in obj)` you will see the method name "find" as a key.
       *
       * To fix your code please do one of the following:
       *
       *  - Use a regular for loop with index.
       *  - Use one of the array methods: a.forEach, a.map, etc.
       *  - Guard your body of your loop with a `arr.hasOwnProperty(key)` check.
       */
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      var index = findIndex.call(this, predicate, context);
      return index === -1 ? undefined : this[index];
    };
  }
})();
