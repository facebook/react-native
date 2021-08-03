/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

module.exports = {isNativeFunction};
