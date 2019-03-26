/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @polyfill
 * @nolint
 */

if (Number.EPSILON === undefined) {
  Object.defineProperty(Number, 'EPSILON', {
    value: Math.pow(2, -52),
  });
}
if (Number.MAX_SAFE_INTEGER === undefined) {
  Object.defineProperty(Number, 'MAX_SAFE_INTEGER', {
    value: Math.pow(2, 53) - 1,
  });
}
if (Number.MIN_SAFE_INTEGER === undefined) {
  Object.defineProperty(Number, 'MIN_SAFE_INTEGER', {
    value: -(Math.pow(2, 53) - 1),
  });
}
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
