/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @preventMunge
 * @typechecks
 */

/* eslint-disable no-extend-native */

'use strict';

const Map = require('./Map');

const _shouldPolyfillES6Collection = require('./_shouldPolyfillES6Collection');
const toIterator = require('./toIterator');

module.exports = (function(global) {
  // Since our implementation is spec-compliant for the most part we can safely
  // delegate to a built-in version if exists and is implemented correctly.
  // Firefox had gotten a few implementation details wrong across different
  // versions so we guard against that.
  // These checks are adapted from es6-shim https://fburl.com/34437854
  if (!_shouldPolyfillES6Collection('Set')) {
    return global.Set;
  }

  /**
   * == ES6 Set Collection ==
   *
   * This module is meant to implement a Set collection as described in chapter
   * 23.2 of the ES6 specification.
   *
   * Set objects are collections of unique values. Where values can be any
   * JavaScript value.
   * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-map-objects
   *
   * There only two -- rather small -- diviations from the spec:
   *
   * 1. The use of frozen objects as keys. @see Map module for more on this.
   *
   * 2. The `size` property on a map object is a regular property and not a
   *    computed property on the prototype as described by the spec.
   *    The reason being is that we simply want to support ES3 environments
   *    which doesn't implement computed properties.
   *
   * == Usage ==
   *
   * var set = new set(iterable);
   *
   * set.set(value);
   * set.has(value); // true
   * set.delete(value); // true
   *
   * var iterator = set.keys();
   * iterator.next(); // {value: value, done: false}
   *
   * var iterator = set.values();
   * iterator.next(); // {value: value, done: false}
   *
   * var iterator = set.entries();
   * iterator.next(); // {value: [value, value], done: false}
   *
   * set.forEach(function(value, value){ this === thisArg }, thisArg);
   *
   * set.clear(); // resets set.
   */

  class Set {
    /**
     * 23.2.1.1
     *
     * Takes an optional `iterable` (which is basically any object that
     * implements a Symbol.iterator (@@iterator) method). That is a collection
     * of values used to instantiate the set.
     *
     * @param {*} iterable
     */
    constructor(iterable) {
      if (
        this == null ||
        (typeof this !== 'object' && typeof this !== 'function')
      ) {
        throw new TypeError('Wrong set object type.');
      }

      initSet(this);

      if (iterable != null) {
        const it = toIterator(iterable);
        let next;
        while (!(next = it.next()).done) {
          this.add(next.value);
        }
      }
    }

    /**
     * 23.2.3.1
     *
     * If it doesn't already exist in the collection a `value` is added.
     *
     * @param {*} value
     * @return {set}
     */
    add(value) {
      this._map.set(value, value);
      this.size = this._map.size;
      return this;
    }

    /**
     * 23.2.3.2
     *
     * Clears the set.
     */
    clear() {
      initSet(this);
    }

    /**
     * 23.2.3.4
     *
     * Deletes a `value` from the collection if it exists.
     * Returns true if the value was found and deleted and false otherwise.
     *
     * @param {*} value
     * @return {boolean}
     */
    delete(value) {
      const ret = this._map.delete(value);
      this.size = this._map.size;
      return ret;
    }

    /**
     * 23.2.3.5
     *
     * Returns an iterator over a collection of [value, value] tuples.
     */
    entries() {
      return this._map.entries();
    }

    /**
     * 23.2.3.6
     *
     * Iterate over the collection calling `callback` with (value, value, set).
     *
     * @param {function} callback
     */
    forEach(callback) {
      const thisArg = arguments[1];
      const it = this._map.keys();
      let next;
      while (!(next = it.next()).done) {
        callback.call(thisArg, next.value, next.value, this);
      }
    }

    /**
     * 23.2.3.7
     *
     * Iterate over the collection calling `callback` with (value, value, set).
     *
     * @param {*} value
     * @return {boolean}
     */
    has(value) {
      return this._map.has(value);
    }

    /**
     * 23.2.3.7
     *
     * Returns an iterator over the colleciton of values.
     */
    values() {
      return this._map.values();
    }
  }

  // 23.2.3.11
  Set.prototype[toIterator.ITERATOR_SYMBOL] = Set.prototype.values;

  // 23.2.3.7
  Set.prototype.keys = Set.prototype.values;

  function initSet(set) {
    set._map = new Map();
    set.size = set._map.size;
  }

  return Set;
})(Function('return this')()); // eslint-disable-line no-new-func
