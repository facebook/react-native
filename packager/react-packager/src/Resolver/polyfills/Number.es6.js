/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @provides Number.es6
 * @polyfill
 */

if (!Number.isNaN) {
  // https://github.com/dherman/tc39-codex-wiki/blob/master/data/es6/number/index.md#polyfill-for-numberisnan
  const globalIsNaN = global.isNaN;
  Object.defineProperty(Number, 'isNaN', {
    configurable: true,
    enumerable: false,
    value: function isNaN(value) {
      return typeof value === 'number' && globalIsNaN(value);
    },
    writable: true,
  });
}
