/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @provides Object.es7
 * @polyfill
 */

(function() {

  const hasOwnProperty = Object.prototype.hasOwnProperty;

  /**
   * Returns an array of the given object's own enumerable entries.
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
   *
   */
  if (typeof Object.entries !== 'function') {
    Object.entries = function(object) {
      // `null` and `undefined` values are not allowed.
      if (object == null) {
        throw new TypeError('Object.entries called on non-object');
      }

      let entries = [];
      for (let key in object) {
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
   *
   */
  if (typeof Object.values !== 'function') {
    Object.values = function(object) {
      // `null` and `undefined` values are not allowed.
      if (object == null) {
        throw new TypeError('Object.values called on non-object');
      }

      let values = [];
      for (let key in object) {
        if (hasOwnProperty.call(object, key)) {
          values.push(object[key]);
        }
      }
      return values;
    };
  }

})();