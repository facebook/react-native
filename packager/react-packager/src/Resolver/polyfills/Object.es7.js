/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @provides Object.es7
 * @polyfill
 */

(function() {
  'use strict';

  const hasOwnProperty = Object.prototype.hasOwnProperty;

  /**
   * Returns an array of the given object's own enumerable entries.
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
   */
  if (typeof Object.entries !== 'function') {
    Object.entries = function(object) {
      // `null` and `undefined` values are not allowed.
      if (object == null) {
        throw new TypeError('Object.entries called on non-object');
      }

      const entries = [];
      for (const key in object) {
        if (hasOwnProperty.call(object, key)) {
          entries.push([key, object[key]]);
        }
      }
      return entries;
    };
  }

  /**
   * Returns an array of the given object's own enumerable entries.
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values
   */
  if (typeof Object.values !== 'function') {
    Object.values = function(object) {
      // `null` and `undefined` values are not allowed.
      if (object == null) {
        throw new TypeError('Object.values called on non-object');
      }

      const values = [];
      for (const key in object) {
        if (hasOwnProperty.call(object, key)) {
          values.push(object[key]);
        }
      }
      return values;
    };
  }

})();
