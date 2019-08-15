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

/* eslint-disable no-extend-native, no-shadow-restricted-names */

'use strict';

const _shouldPolyfillES6Collection = require('./_shouldPolyfillES6Collection');
const guid = require('./guid');
const toIterator = require('./toIterator');

module.exports = (function(global, undefined) {
  // Since our implementation is spec-compliant for the most part we can safely
  // delegate to a built-in version if exists and is implemented correctly.
  // Firefox had gotten a few implementation details wrong across different
  // versions so we guard against that.
  if (!_shouldPolyfillES6Collection('Map')) {
    return global.Map;
  }

  const hasOwn = Object.prototype.hasOwnProperty;

  /**
   * == ES6 Map Collection ==
   *
   * This module is meant to implement a Map collection as described in chapter
   * 23.1 of the ES6 specification.
   *
   * Map objects are collections of key/value pairs where both the keys and
   * values may be arbitrary ECMAScript language values. A distinct key value
   * may only occur in one key/value pair within the Map's collection.
   *
   * https://people.mozilla.org/~jorendorff/es6-draft.html#sec-map-objects
   *
   * There only two -- rather small -- deviations from the spec:
   *
   * 1. The use of untagged frozen objects as keys.
   *    We decided not to allow and simply throw an error, because this
   *    implementation of Map works by tagging objects used as Map keys
   *    with a secret hash property for fast access to the object's place
   *    in the internal _mapData array. However, to limit the impact of
   *    this spec deviation, Libraries/Core/InitializeCore.js also wraps
   *    Object.freeze, Object.seal, and Object.preventExtensions so that
   *    they tag objects before making them non-extensible, by inserting
   *    each object into a Map and then immediately removing it.
   *
   * 2. The `size` property on a map object is a regular property and not a
   *    computed property on the prototype as described by the spec.
   *    The reason being is that we simply want to support ES3 environments
   *    which doesn't implement computed properties.
   *
   * == Usage ==
   *
   * var map = new Map(iterable);
   *
   * map.set(key, value);
   * map.get(key); // value
   * map.has(key); // true
   * map.delete(key); // true
   *
   * var iterator = map.keys();
   * iterator.next(); // {value: key, done: false}
   *
   * var iterator = map.values();
   * iterator.next(); // {value: value, done: false}
   *
   * var iterator = map.entries();
   * iterator.next(); // {value: [key, value], done: false}
   *
   * map.forEach(function(value, key){ this === thisArg }, thisArg);
   *
   * map.clear(); // resets map.
   */

  /**
   * Constants
   */

  // Kinds of map iterations 23.1.5.3
  const KIND_KEY = 'key';
  const KIND_VALUE = 'value';
  const KIND_KEY_VALUE = 'key+value';

  // In older browsers we can't create a null-prototype object so we have to
  // defend against key collisions with built-in methods.
  const KEY_PREFIX = '$map_';

  // This property will be used as the internal size variable to disallow
  // writing and to issue warnings for writings in development.
  let SECRET_SIZE_PROP;
  if (__DEV__) {
    SECRET_SIZE_PROP = '$size' + guid();
  }

  class Map {
    /**
     * 23.1.1.1
     * Takes an `iterable` which is basically any object that implements a
     * Symbol.iterator (@@iterator) method. The iterable is expected to be a
     * collection of pairs. Each pair is a key/value pair that will be used
     * to instantiate the map.
     *
     * @param {*} iterable
     */
    constructor(iterable) {
      if (!isObject(this)) {
        throw new TypeError('Wrong map object type.');
      }

      initMap(this);

      if (iterable != null) {
        const it = toIterator(iterable);
        let next;
        while (!(next = it.next()).done) {
          if (!isObject(next.value)) {
            throw new TypeError('Expected iterable items to be pair objects.');
          }
          this.set(next.value[0], next.value[1]);
        }
      }
    }

    /**
     * 23.1.3.1
     * Clears the map from all keys and values.
     */
    clear() {
      initMap(this);
    }

    /**
     * 23.1.3.7
     * Check if a key exists in the collection.
     *
     * @param {*} key
     * @return {boolean}
     */
    has(key) {
      const index = getIndex(this, key);
      return !!(index != null && this._mapData[index]);
    }

    /**
     * 23.1.3.9
     * Adds a key/value pair to the collection.
     *
     * @param {*} key
     * @param {*} value
     * @return {map}
     */
    set(key, value) {
      let index = getIndex(this, key);

      if (index != null && this._mapData[index]) {
        this._mapData[index][1] = value;
      } else {
        index = this._mapData.push([key, value]) - 1;
        setIndex(this, key, index);
        if (__DEV__) {
          this[SECRET_SIZE_PROP] += 1;
        } else {
          this.size += 1;
        }
      }

      return this;
    }

    /**
     * 23.1.3.6
     * Gets a value associated with a key in the collection.
     *
     * @param {*} key
     * @return {*}
     */
    get(key) {
      const index = getIndex(this, key);
      if (index == null) {
        return undefined;
      } else {
        return this._mapData[index][1];
      }
    }

    /**
     * 23.1.3.3
     * Delete a key/value from the collection.
     *
     * @param {*} key
     * @return {boolean} Whether the key was found and deleted.
     */
    delete(key) {
      const index = getIndex(this, key);
      if (index != null && this._mapData[index]) {
        setIndex(this, key, undefined);
        this._mapData[index] = undefined;
        if (__DEV__) {
          this[SECRET_SIZE_PROP] -= 1;
        } else {
          this.size -= 1;
        }
        return true;
      } else {
        return false;
      }
    }

    /**
     * 23.1.3.4
     * Returns an iterator over the key/value pairs (in the form of an Array) in
     * the collection.
     *
     * @return {MapIterator}
     */
    entries() {
      return new MapIterator(this, KIND_KEY_VALUE);
    }

    /**
     * 23.1.3.8
     * Returns an iterator over the keys in the collection.
     *
     * @return {MapIterator}
     */
    keys() {
      return new MapIterator(this, KIND_KEY);
    }

    /**
     * 23.1.3.11
     * Returns an iterator over the values pairs in the collection.
     *
     * @return {MapIterator}
     */
    values() {
      return new MapIterator(this, KIND_VALUE);
    }

    /**
     * 23.1.3.5
     * Iterates over the key/value pairs in the collection calling `callback`
     * with [value, key, map]. An optional `thisArg` can be passed to set the
     * context when `callback` is called.
     *
     * @param {function} callback
     * @param {?object} thisArg
     */
    forEach(callback, thisArg) {
      if (typeof callback !== 'function') {
        throw new TypeError('Callback must be callable.');
      }

      const boundCallback = callback.bind(thisArg || undefined);
      const mapData = this._mapData;

      // Note that `mapData.length` should be computed on each iteration to
      // support iterating over new items in the map that were added after the
      // start of the iteration.
      for (let i = 0; i < mapData.length; i++) {
        const entry = mapData[i];
        if (entry != null) {
          boundCallback(entry[1], entry[0], this);
        }
      }
    }
  }

  // 23.1.3.12
  Map.prototype[toIterator.ITERATOR_SYMBOL] = Map.prototype.entries;

  class MapIterator {
    /**
     * 23.1.5.1
     * Create a `MapIterator` for a given `map`. While this class is private it
     * will create objects that will be passed around publicily.
     *
     * @param {map} map
     * @param {string} kind
     */
    constructor(map, kind) {
      if (!(isObject(map) && map._mapData)) {
        throw new TypeError('Object is not a map.');
      }

      if ([KIND_KEY, KIND_KEY_VALUE, KIND_VALUE].indexOf(kind) === -1) {
        throw new Error('Invalid iteration kind.');
      }

      this._map = map;
      this._nextIndex = 0;
      this._kind = kind;
    }

    /**
     * 23.1.5.2.1
     * Get the next iteration.
     *
     * @return {object}
     */
    next() {
      if (!this instanceof Map) {
        throw new TypeError('Expected to be called on a MapIterator.');
      }

      const map = this._map;
      let index = this._nextIndex;
      const kind = this._kind;

      if (map == null) {
        return createIterResultObject(undefined, true);
      }

      const entries = map._mapData;

      while (index < entries.length) {
        const record = entries[index];

        index += 1;
        this._nextIndex = index;

        if (record) {
          if (kind === KIND_KEY) {
            return createIterResultObject(record[0], false);
          } else if (kind === KIND_VALUE) {
            return createIterResultObject(record[1], false);
          } else if (kind) {
            return createIterResultObject(record, false);
          }
        }
      }

      this._map = undefined;

      return createIterResultObject(undefined, true);
    }
  }

  // We can put this in the class definition once we have computed props
  // transform.
  // 23.1.5.2.2
  MapIterator.prototype[toIterator.ITERATOR_SYMBOL] = function() {
    return this;
  };

  /**
   * Helper Functions.
   */

  /**
   * Return an index to map.[[MapData]] array for a given Key.
   *
   * @param {map} map
   * @param {*} key
   * @return {?number}
   */
  function getIndex(map, key) {
    if (isObject(key)) {
      const hash = getHash(key);
      return map._objectIndex[hash];
    } else {
      const prefixedKey = KEY_PREFIX + key;
      if (typeof key === 'string') {
        return map._stringIndex[prefixedKey];
      } else {
        return map._otherIndex[prefixedKey];
      }
    }
  }

  /**
   * Setup an index that refer to the key's location in map.[[MapData]].
   *
   * @param {map} map
   * @param {*} key
   */
  function setIndex(map, key, index) {
    const shouldDelete = index == null;

    if (isObject(key)) {
      const hash = getHash(key);
      if (shouldDelete) {
        delete map._objectIndex[hash];
      } else {
        map._objectIndex[hash] = index;
      }
    } else {
      const prefixedKey = KEY_PREFIX + key;
      if (typeof key === 'string') {
        if (shouldDelete) {
          delete map._stringIndex[prefixedKey];
        } else {
          map._stringIndex[prefixedKey] = index;
        }
      } else {
        if (shouldDelete) {
          delete map._otherIndex[prefixedKey];
        } else {
          map._otherIndex[prefixedKey] = index;
        }
      }
    }
  }

  /**
   * Instantiate a map with internal slots.
   *
   * @param {map} map
   */
  function initMap(map) {
    // Data structure design inspired by Traceur's Map implementation.
    // We maintain an internal array for all the entries. The array is needed
    // to remember order. However, to have a reasonable HashMap performance
    // i.e. O(1) for insertion, deletion, and retrieval. We maintain indices
    // in objects for fast look ups. Indices are split up according to data
    // types to avoid collisions.
    map._mapData = [];

    // Object index maps from an object "hash" to index. The hash being a unique
    // property of our choosing that we associate with the object. Association
    // is done by ways of keeping a non-enumerable property on the object.
    // Ideally these would be `Object.create(null)` objects but since we're
    // trying to support ES3 we'll have to guard against collisions using
    // prefixes on the keys rather than rely on null prototype objects.
    map._objectIndex = {};

    // String index maps from strings to index.
    map._stringIndex = {};

    // Numbers, booleans, undefined, and null.
    map._otherIndex = {};

    // Unfortunately we have to support ES3 and cannot have `Map.prototype.size`
    // be a getter method but just a regular method. The biggest problem with
    // this is safety. Clients can change the size property easily and possibly
    // without noticing (e.g. `if (map.size = 1) {..}` kind of typo). What we
    // can do to mitigate use getters and setters in development to disallow
    // and issue a warning for changing the `size` property.
    if (__DEV__) {
      if (isES5) {
        // If the `SECRET_SIZE_PROP` property is already defined then we're not
        // in the first call to `initMap` (e.g. coming from `map.clear()`) so
        // all we need to do is reset the size without defining the properties.
        if (hasOwn.call(map, SECRET_SIZE_PROP)) {
          map[SECRET_SIZE_PROP] = 0;
        } else {
          Object.defineProperty(map, SECRET_SIZE_PROP, {
            value: 0,
            writable: true,
          });
          Object.defineProperty(map, 'size', {
            set: v => {
              console.error(
                'PLEASE FIX ME: You are changing the map size property which ' +
                  'should not be writable and will break in production.',
              );
              throw new Error('The map size property is not writable.');
            },
            get: () => map[SECRET_SIZE_PROP],
          });
        }

        // NOTE: Early return to implement immutable `.size` in DEV.
        return;
      }
    }

    // This is a diviation from the spec. `size` should be a getter on
    // `Map.prototype`. However, we have to support IE8.
    map.size = 0;
  }

  /**
   * Check if something is an object.
   *
   * @param {*} o
   * @return {boolean}
   */
  function isObject(o) {
    return o != null && (typeof o === 'object' || typeof o === 'function');
  }

  /**
   * Create an iteration object.
   *
   * @param {*} value
   * @param {boolean} done
   * @return {object}
   */
  function createIterResultObject(value, done) {
    return {value, done};
  }

  // Are we in a legit ES5 environment. Spoiler alert: that doesn't include IE8.
  const isES5 = (function() {
    try {
      Object.defineProperty({}, 'x', {});
      return true;
    } catch (e) {
      return false;
    }
  })();

  /**
   * Check if an object can be extended.
   *
   * @param {object|array|function|regexp} o
   * @return {boolean}
   */
  function isExtensible(o) {
    if (!isES5) {
      return true;
    } else {
      return Object.isExtensible(o);
    }
  }

  const getHash = (function() {
    const propIsEnumerable = Object.prototype.propertyIsEnumerable;
    const hashProperty = '__MAP_POLYFILL_INTERNAL_HASH__';
    let hashCounter = 0;

    const nonExtensibleObjects = [];
    const nonExtensibleHashes = [];

    /**
     * Get the "hash" associated with an object.
     *
     * @param {object|array|function|regexp} o
     * @return {number}
     */
    return function getHash(o) {
      if (hasOwn.call(o, hashProperty)) {
        return o[hashProperty];
      }

      if (!isES5) {
        if (
          hasOwn.call(o, 'propertyIsEnumerable') &&
          hasOwn.call(o.propertyIsEnumerable, hashProperty)
        ) {
          return o.propertyIsEnumerable[hashProperty];
        }
      }

      if (isExtensible(o)) {
        if (isES5) {
          Object.defineProperty(o, hashProperty, {
            enumerable: false,
            writable: false,
            configurable: false,
            value: ++hashCounter,
          });
          return hashCounter;
        }

        if (o.propertyIsEnumerable) {
          // Since we can't define a non-enumerable property on the object
          // we'll hijack one of the less-used non-enumerable properties to
          // save our hash on it. Additionally, since this is a function it
          // will not show up in `JSON.stringify` which is what we want.
          o.propertyIsEnumerable = function() {
            return propIsEnumerable.apply(this, arguments);
          };
          return (o.propertyIsEnumerable[hashProperty] = ++hashCounter);
        }
      }

      // If the object is not extensible, fall back to storing it in an
      // array and using Array.prototype.indexOf to find it.
      let index = nonExtensibleObjects.indexOf(o);
      if (index < 0) {
        index = nonExtensibleObjects.length;
        nonExtensibleObjects[index] = o;
        nonExtensibleHashes[index] = ++hashCounter;
      }
      return nonExtensibleHashes[index];
    };
  })();

  return Map;
})(Function('return this')()); // eslint-disable-line no-new-func
