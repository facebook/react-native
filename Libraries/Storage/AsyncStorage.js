/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AsyncStorage
 * @noflow
 * @flow-weak
 * @jsdoc
 */
'use strict';

const NativeModules = require('NativeModules');

// Use RocksDB if available, then SQLite, then file storage.
const RCTAsyncStorage = NativeModules.AsyncRocksDBStorage ||
  NativeModules.AsyncSQLiteDBStorage ||
  NativeModules.AsyncLocalStorage;

/**
 * @class
 * @description
 * `AsyncStorage` is a simple, unencrypted, asynchronous, persistent, key-value storage
 * system that is global to the app.  It should be used instead of LocalStorage.
 *
 * It is recommended that you use an abstraction on top of `AsyncStorage`
 * instead of `AsyncStorage` directly for anything more than light usage since
 * it operates globally.
 *
 * On iOS, `AsyncStorage` is backed by native code that stores small values in a
 * serialized dictionary and larger values in separate files. On Android,
 * `AsyncStorage` will use either [RocksDB](http://rocksdb.org/) or SQLite
 * based on what is available.
 *
 * The `AsyncStorage` JavaScript code is a simple facade that provides a clear
 * JavaScript API, real `Error` objects, and simple non-multi functions. Each
 * method in the API returns a `Promise` object.
 *
 * Persisting data:
 * ```
 * try {
 *   await AsyncStorage.setItem('@MySuperStore:key', 'I like to save it.');
 * } catch (error) {
 *   // Error saving data
 * }
 * ```
 *
 * Fetching data:
 * ```
 * try {
 *   const value = await AsyncStorage.getItem('@MySuperStore:key');
 *   if (value !== null){
 *     // We have data!!
 *     console.log(value);
 *   }
 * } catch (error) {
 *   // Error retrieving data
 * }
 * ```
 */
var AsyncStorage = {
  _getRequests: ([]: Array<any>),
  _getKeys: ([]: Array<string>),
  _immediate: (null: ?number),

  /**
   * Fetches an item for a `key` and invokes a callback upon completion.
   * Returns a `Promise` object.
   * @param key Key of the item to fetch.
   * @param callback Function that will be called with a result if found or
   *    any error.
   * @returns A `Promise` object.
   */
  getItem: function(
    key: string,
    callback?: ?(error: ?Error, result: ?string) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiGet([key], function(errors, result) {
        // Unpack result to get value from [[key,value]]
        var value = (result && result[0] && result[0][1]) ? result[0][1] : null;
        var errs = convertErrors(errors);
        callback && callback(errs && errs[0], value);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve(value);
        }
      });
    });
  },

  /**
   * Sets the value for a `key` and invokes a callback upon completion.
   * Returns a `Promise` object.
   * @param key Key of the item to set.
   * @param value Value to set for the `key`.
   * @param callback Function that will be called with any error.
   * @returns A `Promise` object.
   */
  setItem: function(
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiSet([[key,value]], function(errors) {
        var errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Removes an item for a `key` and invokes a callback upon completion.
   * Returns a `Promise` object.
   * @param key Key of the item to remove.
   * @param callback Function that will be called with any error.
   * @returns A `Promise` object.
   */
  removeItem: function(
    key: string,
    callback?: ?(error: ?Error) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiRemove([key], function(errors) {
        var errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Merges an existing `key` value with an input value, assuming both values
   * are stringified JSON. Returns a `Promise` object.
   *
   * **NOTE:** This is not supported by all native implementations.
   *
   * @param key Key of the item to modify.
   * @param value New value to merge for the `key`.
   * @param callback Function that will be called with any error.
   * @returns A `Promise` object.
   *
   * @example <caption>Example</caption>
   * let UID123_object = {
   *  name: 'Chris',
   *  age: 30,
   *  traits: {hair: 'brown', eyes: 'brown'},
   * };
   * // You only need to define what will be added or updated
   * let UID123_delta = {
   *  age: 31,
   *  traits: {eyes: 'blue', shoe_size: 10}
   * };
   *
   * AsyncStorage.setItem('UID123', JSON.stringify(UID123_object), () => {
   *   AsyncStorage.mergeItem('UID123', JSON.stringify(UID123_delta), () => {
   *     AsyncStorage.getItem('UID123', (err, result) => {
   *       console.log(result);
   *     });
   *   });
   * });
   *
   * // Console log result:
   * // => {'name':'Chris','age':31,'traits':
   * //    {'shoe_size':10,'hair':'brown','eyes':'blue'}}
   */
  mergeItem: function(
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge([[key,value]], function(errors) {
        var errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Erases *all* `AsyncStorage` for all clients, libraries, etc.  You probably
   * don't want to call this; use `removeItem` or `multiRemove` to clear only
   * your app's keys. Returns a `Promise` object.
   * @param callback Function that will be called with any error.
   * @returns A `Promise` object.
   */
  clear: function(callback?: ?(error: ?Error) => void): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.clear(function(error) {
        callback && callback(convertError(error));
        if (error && convertError(error)){
          reject(convertError(error));
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Gets *all* keys known to your app; for all callers, libraries, etc.
   * Returns a `Promise` object.
   * @param callback Function that will be called the keys found and any error.
   * @returns A `Promise` object.
   *
   * Example: see the `multiGet` example.
   */
  getAllKeys: function(callback?: ?(error: ?Error, keys: ?Array<string>) => void): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.getAllKeys(function(error, keys) {
        callback && callback(convertError(error), keys);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(keys);
        }
      });
    });
  },

  /**
   * The following batched functions are useful for executing a lot of
   * operations at once, allowing for native optimizations and provide the
   * convenience of a single callback after all operations are complete.
   *
   * These functions return arrays of errors, potentially one for every key.
   * For key-specific errors, the Error object will have a key property to
   * indicate which key caused the error.
   */

  /** Flushes any pending requests using a single batch call to get the data. */
  flushGetRequests: function(): void {
    const getRequests = this._getRequests;
    const getKeys = this._getKeys;

    this._getRequests = [];
    this._getKeys = [];

    RCTAsyncStorage.multiGet(getKeys, function(errors, result) {
      // Even though the runtime complexity of this is theoretically worse vs if we used a map,
      // it's much, much faster in practice for the data sets we deal with (we avoid
      // allocating result pair arrays). This was heavily benchmarked.
      //
      // Is there a way to avoid using the map but fix the bug in this breaking test?
      // https://github.com/facebook/react-native/commit/8dd8ad76579d7feef34c014d387bf02065692264
      const map = {};
      result && result.forEach(([key, value]) => { map[key] = value; return value; });
      const reqLength = getRequests.length;
      for (let i = 0; i < reqLength; i++) {
        const request = getRequests[i];
        const requestKeys = request.keys;
        const requestResult = requestKeys.map(key => [key, map[key]]);
        request.callback && request.callback(null, requestResult);
        request.resolve && request.resolve(requestResult);
      }
    });
  },

  /**
   * This allows you to batch the fetching of items given an array of `key`
   * inputs. Your callback will be invoked with an array of corresponding
   * key-value pairs found:
   *
   * ```
   * multiGet(['k1', 'k2'], cb) -> cb([['k1', 'val1'], ['k2', 'val2']])
   * ```
   *
   * The method returns a `Promise` object.
   *
   * @param keys Array of key for the items to get.
   * @param callback Function that will be called with a key-value array of
   *     the results, plus an array of any key-specific errors found.
   * @returns A `Promise` object.
   *
   * @example <caption>Example</caption>
   *
   * AsyncStorage.getAllKeys((err, keys) => {
   *   AsyncStorage.multiGet(keys, (err, stores) => {
   *    stores.map((result, i, store) => {
   *      // get at each store's key/value so you can work with it
   *      let key = store[i][0];
   *      let value = store[i][1];
   *     });
   *   });
   * });
   */
  multiGet: function(
    keys: Array<string>,
    callback?: ?(errors: ?Array<Error>, result: ?Array<Array<string>>) => void
  ): Promise {
    if (!this._immediate) {
      this._immediate = setImmediate(() => {
        this._immediate = null;
        this.flushGetRequests();
      });
    }

    var getRequest = {
      keys: keys,
      callback: callback,
      // do we need this?
      keyIndex: this._getKeys.length,
      resolve: null,
      reject: null,
    };

    var promiseResult = new Promise((resolve, reject) => {
      getRequest.resolve = resolve;
      getRequest.reject = reject;
    });

    this._getRequests.push(getRequest);
    // avoid fetching duplicates
    keys.forEach(key => {
      if (this._getKeys.indexOf(key) === -1) {
        this._getKeys.push(key);
      }
    });

    return promiseResult;
  },

  /**
   * Use this as a batch operation for storing multiple key-value pairs. When
   * the operation completes you'll get a single callback with any errors:
   *
   * ```
   * multiSet([['k1', 'val1'], ['k2', 'val2']], cb);
   * ```
   *
   * The method returns a `Promise` object.
   *
   * @param keyValuePairs Array of key-value array for the items to set.
   * @param callback Function that will be called with an array of any
   *    key-specific errors found.
   * @returns A `Promise` object.
   * Example: see the `multiMerge` example.
   */
  multiSet: function(
    keyValuePairs: Array<Array<string>>,
    callback?: ?(errors: ?Array<Error>) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiSet(keyValuePairs, function(errors) {
        var error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Call this to batch the deletion of all keys in the `keys` array. Returns
   * a `Promise` object.
   *
   * @param keys Array of key for the items to delete.
   * @param callback Function that will be called an array of any key-specific
   *    errors found.
   * @returns A `Promise` object.
   *
   * @example <caption>Example</caption>
   * let keys = ['k1', 'k2'];
   * AsyncStorage.multiRemove(keys, (err) => {
   *   // keys k1 & k2 removed, if they existed
   *   // do most stuff after removal (if you want)
   * });
   */
  multiRemove: function(
    keys: Array<string>,
    callback?: ?(errors: ?Array<Error>) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiRemove(keys, function(errors) {
        var error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Batch operation to merge in existing and new values for a given set of
   * keys. This assumes that the values are stringified JSON. Returns a
   * `Promise` object.
   *
   * **NOTE**: This is not supported by all native implementations.
   *
   * @param keyValuePairs Array of key-value array for the items to merge.
   * @param callback Function that will be called with an array of any
   *    key-specific errors found.
   * @returns A `Promise` object.
   *
   * @example <caption>Example</caption>
   * // first user, initial values
   * let UID234_object = {
   *  name: 'Chris',
   *  age: 30,
   *  traits: {hair: 'brown', eyes: 'brown'},
   * };
   *
   * // first user, delta values
   * let UID234_delta = {
   *  age: 31,
   *  traits: {eyes: 'blue', shoe_size: 10},
   * };
   *
   * // second user, initial values
   * let UID345_object = {
   *  name: 'Marge',
   *  age: 25,
   *  traits: {hair: 'blonde', eyes: 'blue'},
   * };
   *
   * // second user, delta values
   * let UID345_delta = {
   *  age: 26,
   *  traits: {eyes: 'green', shoe_size: 6},
   * };
   *
   * let multi_set_pairs   = [['UID234', JSON.stringify(UID234_object)], ['UID345', JSON.stringify(UID345_object)]]
   * let multi_merge_pairs = [['UID234', JSON.stringify(UID234_delta)], ['UID345', JSON.stringify(UID345_delta)]]
   *
   * AsyncStorage.multiSet(multi_set_pairs, (err) => {
   *   AsyncStorage.multiMerge(multi_merge_pairs, (err) => {
   *     AsyncStorage.multiGet(['UID234','UID345'], (err, stores) => {
   *       stores.map( (result, i, store) => {
   *         let key = store[i][0];
   *         let val = store[i][1];
   *         console.log(key, val);
   *       });
   *     });
   *   });
   * });
   *
   * // Console log results:
   * // => UID234 {"name":"Chris","age":31,"traits":{"shoe_size":10,"hair":"brown","eyes":"blue"}}
   * // => UID345 {"name":"Marge","age":26,"traits":{"shoe_size":6,"hair":"blonde","eyes":"green"}}
   */
  multiMerge: function(
    keyValuePairs: Array<Array<string>>,
    callback?: ?(errors: ?Array<Error>) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge(keyValuePairs, function(errors) {
        var error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve(null);
        }
      });
    });
  },
};

// Not all native implementations support merge.
if (!RCTAsyncStorage.multiMerge) {
  delete AsyncStorage.mergeItem;
  delete AsyncStorage.multiMerge;
}

function convertErrors(errs) {
  if (!errs) {
    return null;
  }
  return (Array.isArray(errs) ? errs : [errs]).map((e) => convertError(e));
}

function convertError(error) {
  if (!error) {
    return null;
  }
  var out = new Error(error.message);
  out.key = error.key; // flow doesn't like this :(
  return out;
}

module.exports = AsyncStorage;
