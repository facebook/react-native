/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * AsyncStorage is a simple, unencrypted, asynchronous, persistent, key-value storage
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
 * @see https://reactnative.dev/docs/asyncstorage#content
 */
export interface AsyncStorageStatic {
  /**
   * Fetches key and passes the result to callback, along with an Error if there is any.
   */
  getItem(
    key: string,
    callback?: (error?: Error, result?: string) => void,
  ): Promise<string | null>;

  /**
   * Sets value for key and calls callback on completion, along with an Error if there is any
   */
  setItem(
    key: string,
    value: string,
    callback?: (error?: Error) => void,
  ): Promise<void>;

  removeItem(key: string, callback?: (error?: Error) => void): Promise<void>;

  /**
   * Merges existing value with input value, assuming they are stringified json. Returns a Promise object.
   * Not supported by all native implementation
   */
  mergeItem(
    key: string,
    value: string,
    callback?: (error?: Error) => void,
  ): Promise<void>;

  /**
   * Erases all AsyncStorage for all clients, libraries, etc. You probably don't want to call this.
   * Use removeItem or multiRemove to clear only your own keys instead.
   */
  clear(callback?: (error?: Error) => void): Promise<void>;

  /**
   * Gets all keys known to the app, for all callers, libraries, etc
   */
  getAllKeys(
    callback?: (error?: Error, keys?: string[]) => void,
  ): Promise<string[]>;

  /**
   * multiGet invokes callback with an array of key-value pair arrays that matches the input format of multiSet
   */
  multiGet(
    keys: string[],
    callback?: (errors?: Error[], result?: [string, string][]) => void,
  ): Promise<[string, string][]>;

  /**
   * multiSet and multiMerge take arrays of key-value array pairs that match the output of multiGet,
   *
   * multiSet([['k1', 'val1'], ['k2', 'val2']], cb);
   */
  multiSet(
    keyValuePairs: string[][],
    callback?: (errors?: Error[]) => void,
  ): Promise<void>;

  /**
   * Delete all the keys in the keys array.
   */
  multiRemove(
    keys: string[],
    callback?: (errors?: Error[]) => void,
  ): Promise<void>;

  /**
   * Merges existing values with input values, assuming they are stringified json.
   * Returns a Promise object.
   *
   * Not supported by all native implementations.
   */
  multiMerge(
    keyValuePairs: string[][],
    callback?: (errors?: Error[]) => void,
  ): Promise<void>;
}

/**
 * AsyncStorage has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/async-storage` instead of 'react-native'.
 * @see https://github.com/react-native-community/async-storage
 * @deprecated
 */
export const AsyncStorage: AsyncStorageStatic;

/**
 * AsyncStorage has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/async-storage` instead of 'react-native'.
 * @see https://github.com/react-native-community/async-storage
 * @deprecated
 */
export type AsyncStorage = AsyncStorageStatic;
