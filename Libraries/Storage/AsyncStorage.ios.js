/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AsyncStorage
 * @flow-weak
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTAsyncLocalStorage = NativeModules.AsyncLocalStorage;
var RCTAsyncRocksDBStorage = NativeModules.AsyncRocksDBStorage;

// We use RocksDB if available.
var RCTAsyncStorage = RCTAsyncRocksDBStorage || RCTAsyncLocalStorage;

/**
 * AsyncStorage is a simple, asynchronous, persistent, key-value storage
 * system that is global to the app.  It should be used instead of LocalStorage.
 *
 * It is recommended that you use an abstraction on top of AsyncStorage instead
 * of AsyncStorage directly for anything more than light usage since it
 * operates globally.
 *
 * This JS code is a simple facade over the native iOS implementation to provide
 * a clear JS API, real Error objects, and simple non-multi functions. Each
 * method returns a `Promise` object.
 */
var AsyncStorage = {
  /**
   * Fetches `key` and passes the result to `callback`, along with an `Error` if
   * there is any. Returns a `Promise` object.
   */
  getItem: function(
    key: string,
    callback?: ?(error: ?Error, result: ?string) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiGet([key], function(errors, result) {
        // Unpack result to get value from [[key,value]]
        var value = (result && result[0] && result[0][1]) ? result[0][1] : null;
        callback && callback((errors && convertError(errors[0])) || null, value);
        if (errors) {
          reject(convertError(errors[0]));
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
      RCTAsyncStorage.multiSet([[key,value]], function(errors) {
        callback && callback((errors && convertError(errors[0])) || null);
        if (errors) {
          reject(convertError(errors[0]));
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
      RCTAsyncStorage.multiRemove([key], function(errors) {
        callback && callback((errors && convertError(errors[0])) || null);
        if (errors) {
          reject(convertError(errors[0]));
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Merges existing value with input value, assuming they are stringified json. Returns a `Promise` object.
   *
   * Not supported by all native implementations.
   */
  mergeItem: function(
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge([[key,value]], function(errors) {
        callback && callback((errors && convertError(errors[0])) || null);
        if (errors) {
          reject(convertError(errors[0]));
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
   * Gets *all* keys known to the app, for all callers, libraries, etc. Returns a `Promise` object.
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
      RCTAsyncStorage.multiGet(keys, function(errors, result) {
        var error = (errors && errors.map((error) => convertError(error))) || null;
        callback && callback(error, result);
        if (errors) {
          reject(error);
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
      RCTAsyncStorage.multiSet(keyValuePairs, function(errors) {
        var error = (errors && errors.map((error) => convertError(error))) || null;
        callback && callback(error);
        if (errors) {
          reject(error);
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
      RCTAsyncStorage.multiRemove(keys, function(errors) {
        var error = (errors && errors.map((error) => convertError(error))) || null;
        callback && callback(error);
        if (errors) {
          reject(error);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Merges existing values with input values, assuming they are stringified
   * json. Returns a `Promise` object.
   *
   * Not supported by all native implementations.
   */
  multiMerge: function(
    keyValuePairs: Array<Array<string>>,
    callback?: ?(errors: ?Array<Error>) => void
  ): Promise {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge(keyValuePairs, function(errors) {
        var error = (errors && errors.map((error) => convertError(error))) || null;
        callback && callback(error);
        if (errors) {
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

function convertError(error) {
  if (!error) {
    return null;
  }
  var out = new Error(error.message);
  out.key = error.key; // flow doesn't like this :(
  return out;
}

module.exports = AsyncStorage;
