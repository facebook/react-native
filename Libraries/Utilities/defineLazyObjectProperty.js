/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule defineLazyObjectProperty
 * @flow
 */

'use strict';

/**
 * Defines a lazily evaluated property on the supplied `object`.
 */
function defineLazyObjectProperty<T>(
  object: Object,
  name: string,
  descriptor: {
    get: () => T,
    enumerable?: boolean,
    writable?: boolean,
  },
): void {
  const {get} = descriptor;
  const enumerable = descriptor.enumerable !== false;
  const writable = descriptor.writable !== false;

  let value;
  let valueSet = false;
  function getValue(): T {
    // WORKAROUND: A weird infinite loop occurs where calling `getValue` calls
    // `setValue` which calls `Object.defineProperty` which somehow triggers
    // `getValue` again. Adding `valueSet` breaks this loop.
    if (!valueSet) {
      setValue(get());
    }
    return value;
  }
  function setValue(newValue: T): void {
    value = newValue;
    valueSet = true;
    Object.defineProperty(object, name, {
      value: newValue,
      configurable: true,
      enumerable,
      writable,
    });
  }

  Object.defineProperty(object, name, {
    get: getValue,
    set: setValue,
    configurable: true,
    enumerable,
  });
}

module.exports = defineLazyObjectProperty;
