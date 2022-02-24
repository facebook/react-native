/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 * @jsdoc
 */

import NativeAsyncLocalStorage from './NativeAsyncLocalStorage';
import NativeAsyncSQLiteDBStorage from './NativeAsyncSQLiteDBStorage';
import invariant from 'invariant';

// Use SQLite if available, otherwise file storage.
const RCTAsyncStorage = NativeAsyncSQLiteDBStorage || NativeAsyncLocalStorage;

type GetRequest = {
  keys: Array<string>,
  callback: ?(errors: ?Array<Error>, result: ?Array<Array<string>>) => void,
  keyIndex: number,
  resolve: (
    result?:
      | void
      | null
      | Promise<?Array<Array<string>>>
      | Array<Array<string>>,
  ) => void,
  reject: (error?: mixed) => void,
};

/**
 * `AsyncStorage` is a simple, unencrypted, asynchronous, persistent, key-value
 * storage system that is global to the app.  It should be used instead of
 * LocalStorage.
 *
 * See https://reactnative.dev/docs/asyncstorage
 */
const AsyncStorage = {
  _getRequests: ([]: Array<GetRequest>),
  _getKeys: ([]: Array<string>),
  _immediate: (null: ?number),

  /**
   * Fetches an item for a `key` and invokes a callback upon completion.
   *
   * See https://reactnative.dev/docs/asyncstorage#getitem
   */
  getItem: function (
    key: string,
    callback?: ?(error: ?Error, result: ?string) => void,
  ): Promise<?string> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiGet([key], function (errors, result) {
        // Unpack result to get value from [[key,value]]
        const value = result && result[0] && result[0][1] ? result[0][1] : null;
        const errs = convertErrors(errors);
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
   *
   * See https://reactnative.dev/docs/asyncstorage#setitem
   */
  setItem: function (
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void,
  ): Promise<void> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiSet([[key, value]], function (errors) {
        const errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Removes an item for a `key` and invokes a callback upon completion.
   *
   * See https://reactnative.dev/docs/asyncstorage#removeitem
   */
  removeItem: function (
    key: string,
    callback?: ?(error: ?Error) => void,
  ): Promise<void> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiRemove([key], function (errors) {
        const errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Merges an existing `key` value with an input value, assuming both values
   * are stringified JSON.
   *
   * **NOTE:** This is not supported by all native implementations.
   *
   * See https://reactnative.dev/docs/asyncstorage#mergeitem
   */
  mergeItem: function (
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void,
  ): Promise<void> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge([[key, value]], function (errors) {
        const errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Erases *all* `AsyncStorage` for all clients, libraries, etc. You probably
   * don't want to call this; use `removeItem` or `multiRemove` to clear only
   * your app's keys.
   *
   * See https://reactnative.dev/docs/asyncstorage#clear
   */
  clear: function (callback?: ?(error: ?Error) => void): Promise<void> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.clear(function (error) {
        callback && callback(convertError(error));
        if (error && convertError(error)) {
          reject(convertError(error));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Gets *all* keys known to your app; for all callers, libraries, etc.
   *
   * See https://reactnative.dev/docs/asyncstorage#getallkeys
   */
  getAllKeys: function (
    callback?: ?(error: ?Error, keys: ?Array<string>) => void,
  ): Promise<?Array<string>> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.getAllKeys(function (error, keys) {
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
   * Flushes any pending requests using a single batch call to get the data.
   *
   * See https://reactnative.dev/docs/asyncstorage#flushgetrequests
   * */
  flushGetRequests: function (): void {
    const getRequests = this._getRequests;
    const getKeys = this._getKeys;

    this._getRequests = [];
    this._getKeys = [];

    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    RCTAsyncStorage.multiGet(getKeys, function (errors, result) {
      // Even though the runtime complexity of this is theoretically worse vs if we used a map,
      // it's much, much faster in practice for the data sets we deal with (we avoid
      // allocating result pair arrays). This was heavily benchmarked.
      //
      // Is there a way to avoid using the map but fix the bug in this breaking test?
      // https://github.com/facebook/react-native/commit/8dd8ad76579d7feef34c014d387bf02065692264
      const map = {};
      result &&
        result.forEach(([key, value]) => {
          map[key] = value;
          return value;
        });
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
   * key-value pairs found.
   *
   * See https://reactnative.dev/docs/asyncstorage#multiget
   */
  multiGet: function (
    keys: Array<string>,
    callback?: ?(errors: ?Array<Error>, result: ?Array<Array<string>>) => void,
  ): Promise<?Array<Array<string>>> {
    if (!this._immediate) {
      this._immediate = setImmediate(() => {
        this._immediate = null;
        this.flushGetRequests();
      });
    }

    return new Promise<?Array<Array<string>>>((resolve, reject) => {
      this._getRequests.push({
        keys,
        callback,
        // do we need this?
        keyIndex: this._getKeys.length,
        resolve,
        reject,
      });
      // avoid fetching duplicates
      keys.forEach(key => {
        if (this._getKeys.indexOf(key) === -1) {
          this._getKeys.push(key);
        }
      });
    });
  },

  /**
   * Use this as a batch operation for storing multiple key-value pairs. When
   * the operation completes you'll get a single callback with any errors.
   *
   * See https://reactnative.dev/docs/asyncstorage#multiset
   */
  multiSet: function (
    keyValuePairs: Array<Array<string>>,
    callback?: ?(errors: ?Array<Error>) => void,
  ): Promise<void> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiSet(keyValuePairs, function (errors) {
        const error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Call this to batch the deletion of all keys in the `keys` array.
   *
   * See https://reactnative.dev/docs/asyncstorage#multiremove
   */
  multiRemove: function (
    keys: Array<string>,
    callback?: ?(errors: ?Array<Error>) => void,
  ): Promise<void> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiRemove(keys, function (errors) {
        const error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Batch operation to merge in existing and new values for a given set of
   * keys. This assumes that the values are stringified JSON.
   *
   * **NOTE**: This is not supported by all native implementations.
   *
   * See https://reactnative.dev/docs/asyncstorage#multimerge
   */
  multiMerge: function (
    keyValuePairs: Array<Array<string>>,
    callback?: ?(errors: ?Array<Error>) => void,
  ): Promise<void> {
    invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge(keyValuePairs, function (errors) {
        const error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
};

// Not all native implementations support merge.
// TODO: Check whether above comment is correct. multiMerge is guaranteed to
// exist in the module spec so we should be able to just remove this check.
if (RCTAsyncStorage && !RCTAsyncStorage.multiMerge) {
  // $FlowFixMe[unclear-type]
  delete (AsyncStorage: any).mergeItem;
  // $FlowFixMe[unclear-type]
  delete (AsyncStorage: any).multiMerge;
}

function convertErrors(
  // NOTE: The native module spec only has the Array case, but the Android
  // implementation passes a single object.
  errs: ?(
    | {message: string, key?: string}
    | Array<{message: string, key?: string}>
  ),
) {
  if (!errs) {
    return null;
  }
  return (Array.isArray(errs) ? errs : [errs]).map(e => convertError(e));
}

declare function convertError(void | null): null;
declare function convertError({message: string, key?: string}): Error;
function convertError(error) {
  if (!error) {
    return null;
  }
  const out = new Error(error.message);
  // $FlowFixMe[unclear-type]
  (out: any).key = error.key;
  return out;
}

module.exports = AsyncStorage;
