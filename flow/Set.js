/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @nolint
 * @format
 */

// These annotations are copy/pasted from the built-in Flow definitions for
// Native Set.

declare module 'Set' {
  // Use the name "SetPolyfill" so that we don't get confusing error
  // messages about "Using Set instead of Set".
  declare class SetPolyfill<T> {
    @@iterator(): Iterator<T>;
    constructor(iterable: ?Iterable<T>): void;
    add(value: T): SetPolyfill<T>;
    clear(): void;
    delete(value: T): boolean;
    entries(): Iterator<[T, T]>;
    forEach(
      callbackfn: (value: T, index: T, set: SetPolyfill<T>) => mixed,
      thisArg?: any,
    ): void;
    has(value: T): boolean;
    keys(): Iterator<T>;
    size: number;
    values(): Iterator<T>;
  }

  declare module.exports: typeof SetPolyfill;
}
