/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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
  require.resolve('./Libraries/polyfills/babelHelpers.js'),
];
