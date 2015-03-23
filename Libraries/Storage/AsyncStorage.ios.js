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
 * AsyncStorage is a simple, asynchronous, persistent, global, key-value storage
 * system.  It should be used instead of LocalStorage.
 *
 * It is recommended that you use an abstraction on top of AsyncStorage instead
 * of AsyncStorage directly for anything more than light usage since it
 * operates globally.
 *
 * This JS code is a simple facad over the native iOS implementation to provide
 * a clear JS API, real Error objects, and simple non-multi functions.
 */
var AsyncStorage = {
  /**
   * Fetches `key` and passes the result to `callback`, along with an `Error` if
   * there is any.
   */
  getItem: function(
    key: string,
    callback: (error: ?Error, result: ?string) => void
  ): void {
    RCTAsyncStorage.multiGet([key], function(errors, result) {
      // Unpack result to get value from [[key,value]]
      var value = (result && result[0] && result[0][1]) ? result[0][1] : null;
      callback((errors && convertError(errors[0])) || null, value);
    });
  },

  /**
   * Sets `value` for `key` and calls `callback` on completion, along with an
   * `Error` if there is any.
   */
  setItem: function(
    key: string,
    value: string,
    callback: ?(error: ?Error) => void
  ): void {
    RCTAsyncStorage.multiSet([[key,value]], function(errors) {
      callback && callback((errors && convertError(errors[0])) || null);
    });
  },

  removeItem: function(
    key: string,
    callback: ?(error: ?Error) => void
  ): void {
    RCTAsyncStorage.multiRemove([key], function(errors) {
      callback && callback((errors && convertError(errors[0])) || null);
    });
  },

  /**
   * Merges existing value with input value, assuming they are stringified json.
   *
   * Not supported by all native implementations.
   */
  mergeItem: function(
    key: string,
    value: string,
    callback: ?(error: ?Error) => void
  ): void {
    RCTAsyncStorage.multiMerge([[key,value]], function(errors) {
      callback && callback((errors && convertError(errors[0])) || null);
    });
  },

  /**
   * Erases *all* AsyncStorage for all clients, libraries, etc.  You probably
   * don't want to call this - use removeItem or multiRemove to clear only your
   * own keys instead.
   */
  clear: function(callback: ?(error: ?Error) => void) {
    RCTAsyncStorage.clear(function(error) {
      callback && callback(convertError(error));
    });
  },

  /**
   * Gets *all* keys known to the system, for all callers, libraries, etc.
   */
  getAllKeys: function(callback: (error: ?Error) => void) {
    RCTAsyncStorage.getAllKeys(function(error, keys) {
      callback(convertError(error), keys);
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
   * matches the input format of multiSet.
   *
   *   multiGet(['k1', 'k2'], cb) -> cb([['k1', 'val1'], ['k2', 'val2']])
   */
  multiGet: function(
    keys: Array<string>,
    callback: (errors: ?Array<Error>, result: ?Array<Array<string>>) => void
  ): void {
    RCTAsyncStorage.multiGet(keys, function(errors, result) {
      callback(
        (errors && errors.map((error) => convertError(error))) || null,
        result
      );
    });
  },

  /**
   * multiSet and multiMerge take arrays of key-value array pairs that match
   * the output of multiGet, e.g.
   *
   *   multiSet([['k1', 'val1'], ['k2', 'val2']], cb);
   */
  multiSet: function(
    keyValuePairs: Array<Array<string>>,
    callback: ?(errors: ?Array<Error>) => void
  ): void {
    RCTAsyncStorage.multiSet(keyValuePairs, function(errors) {
      callback && callback(
        (errors && errors.map((error) => convertError(error))) || null
      );
    });
  },

  /**
   * Delete all the keys in the `keys` array.
   */
  multiRemove: function(
    keys: Array<string>,
    callback: ?(errors: ?Array<Error>) => void
  ): void {
    RCTAsyncStorage.multiRemove(keys, function(errors) {
      callback && callback(
        (errors && errors.map((error) => convertError(error))) || null
      );
    });
  },

  /**
   * Merges existing values with input values, assuming they are stringified
   * json.
   *
   * Not supported by all native implementations.
   */
  multiMerge: function(
    keyValuePairs: Array<Array<string>>,
    callback: ?(errors: ?Array<Error>) => void
  ): void {
    RCTAsyncStorage.multiMerge(keyValuePairs, function(errors) {
      callback && callback(
        (errors && errors.map((error) => convertError(error))) || null
      );
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
