/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AsyncStorage
 * @flow
 */
'use strict';

var RCTAsyncStorage = require('NativeModules').AsyncSQLiteDBStorage;

/**
 * AsyncStorage is a simple, asynchronous, persistent, global, key-value storage system.
 *
 * It is recommended that you use an abstraction on top of AsyncStorage instead of AsyncStorage
 * directly for anything more than light usage since it operates globally.
 *
 * This JS code is a simple facade over the native android implementation to provide a clear
 * JS API, real Error objects, and simple non-multi functions.
 */
var AsyncStorage = {
  /**
   * Fetches `key` and passes the result to `callback`, along with an `Error` if
   * there is any. Returns a `Promise` object.
   */
  getItem: function(
    key: string,
    callback?: ?(error: ?Error, result: ?string) => void
  ) {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiGet([key], function(error, result) {
        var value = (result && result[0] && result[0][1]) ? result[0][1] : null;
        callback && callback((error && convertError(error)) || null, value);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(value);
        }
      });
    });
  },
  /**
   * Sets `value` for `key` and calls `callback` on completion, along with an
   * `Error` if there is any. Returns a `Promise` object.
   */
  setItem: function(
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiSet([[key,value]], function(error) {
        callback && callback((error && convertError(error)) || null);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(null);
        }
      });
    });
  },
  /**
   * Returns a `Promise` object.
   */
  removeItem: function(
    key: string,
    callback?: ?(error: ?Error) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiRemove([key], function(error) {
        callback && callback((error && convertError(error)) || null);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(null);
        }
      });
    });
  },
  /**
   * Merges existing value with input value, assuming they are stringified json.
   * Returns a `Promise` object.
   */
  mergeItem: function(
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge([[key,value]], function(error) {
        callback && callback((error && convertError(error)) || null);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(null);
        }
      });
    });
  },
  /**
   * Erases *all* AsyncStorage for all clients, libraries, etc.  You probably
   * don't want to call this - use removeItem or multiRemove to clear only your
   * own keys instead. Returns a `Promise` object.
   */
  clear: function(callback?: ?(error: ?Error) => void): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.clear(function(error) {
        callback && callback(convertError(error) || null);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(null);
        }
      });
    });
  },
  /**
   * Gets *all* keys known to the app, for all callers, libraries, etc. Returns a `Promise` object.
   */
  getAllKeys: function(callback?: ?(error: ?Error, keys: ?Array<string>) => void): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.getAllKeys(function(error, keys) {
        callback && callback((error && convertError(error)) || null, keys);
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
   * In case of errors, these functions return the first encountered error and abort.
   */

  /**
   * multiGet invokes callback with an array of key-value pair arrays that
   * matches the input format of multiSet. Returns a `Promise` object.
   *
   *   multiGet(['k1', 'k2'], cb) -> cb([['k1', 'val1'], ['k2', 'val2']])
   */
  multiGet: function(
    keys: Array<string>,
    callback?: ?(errors: ?Array<Error>, result: ?Array<Array<string>>) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiGet(keys, function(error, result) {
        callback && callback((error && convertError(error)) || null, result);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(result);
        }
      });
    });
  },
  /**
   * multiSet and multiMerge take arrays of key-value array pairs that match
   * the output of multiGet, e.g. Returns a `Promise` object.
   *
   *   multiSet([['k1', 'val1'], ['k2', 'val2']], cb);
   */
  multiSet: function(
    keyValuePairs: Array<Array<string>>,
    callback?: ?(errors: ?Array<Error>) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiSet(keyValuePairs, function(error) {
        callback && callback((error && convertError(error)) || null);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(null);
        }
      });
    });
  },
  /**
   * Delete all the keys in the `keys` array. Returns a `Promise` object.
   */
  multiRemove: function(
    keys: Array<string>,
    callback?: ?(errors: ?Array<Error>) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiRemove(keys, function(error) {
        callback && callback((error && convertError(error)) || null);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(null);
        }
      });
    });
  },
  /**
   * Merges existing values with input values, assuming they are stringified
   * json. Returns a `Promise` object.
   */
  multiMerge: function(
    keyValuePairs: Array<Array<string>>,
    callback?: ?(errors: ?Array<Error>) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge(keyValuePairs, function(error) {
        callback && callback((error && convertError(error)) || null);
        if (error) {
          reject(convertError(error));
        } else {
          resolve(null);
        }
      });
    });
  },
};

function convertError(error) {
  if (!error) {
    return null;
  }
  var out = new Error(error.message);
  return [out];
}

module.exports = AsyncStorage;
