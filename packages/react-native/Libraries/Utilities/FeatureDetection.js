/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * @return whether or not a @param {function} f is provided natively by calling
 * `toString` and check if the result includes `[native code]` in it.
 *
 * Note that a polyfill can technically fake this behavior but few does it.
 * Therefore, this is usually good enough for our purpose.
 */
function isNativeFunction(f: Function): boolean {
  return typeof f === 'function' && f.toString().indexOf('[native code]') > -1;
}

/**
 * @return whether or not the constructor of @param {object} o is an native
 * function named with @param {string} expectedName.
 */
function hasNativeConstructor(o: Object, expectedName: string): boolean {
  const con = Object.getPrototypeOf(o).constructor;
  return con.name === expectedName && isNativeFunction(con);
}

module.exports = {isNativeFunction, hasNativeConstructor};
