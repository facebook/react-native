/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = () => [
  require.resolve('./Libraries/polyfills/Object.es6.js'),
  require.resolve('./Libraries/polyfills/console.js'),
  require.resolve('./Libraries/polyfills/error-guard.js'),
  require.resolve('./Libraries/polyfills/Number.es6.js'),
  require.resolve('./Libraries/polyfills/String.prototype.es6.js'),
  require.resolve('./Libraries/polyfills/Array.prototype.es6.js'),
  require.resolve('./Libraries/polyfills/Array.es6.js'),
  require.resolve('./Libraries/polyfills/Object.es7.js'),
];
