/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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
      // Calling `get()` here can trigger an infinite loop if it fails to
      // remove the getter on the property, which can happen when executing
      // JS in a V8 context.  `valueSet = true` will break this loop, and
      // sets the value of the property to undefined, until the code in `get()`
      // finishes, at which point the property is set to the correct value.
      valueSet = true;
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
