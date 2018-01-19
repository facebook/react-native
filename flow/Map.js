/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

// These annotations are copy/pasted from the built-in Flow definitions for
// Native Map.

declare module "Map" {
  // Use the name "MapPolyfill" so that we don't get confusing error
  // messages about "Using Map instead of Map".
  declare class MapPolyfill<K, V> {
    @@iterator(): Iterator<[K, V]>;
    constructor<Key, Value>(_: void): MapPolyfill<Key, Value>;
    constructor<Key, Value>(_: null): MapPolyfill<Key, Value>;
    constructor<Key, Value>(iterable: Iterable<[Key, Value]>): MapPolyfill<Key, Value>;
    clear(): void;
    delete(key: K): boolean;
    entries(): Iterator<[K, V]>;
    forEach(callbackfn: (value: V, index: K, map: MapPolyfill<K, V>) => mixed, thisArg?: any): void;
    get(key: K): V | void;
    has(key: K): boolean;
    keys(): Iterator<K>;
    set(key: K, value: V): MapPolyfill<K, V>;
    size: number;
    values(): Iterator<V>;
  }

  declare module.exports: typeof MapPolyfill;
}
