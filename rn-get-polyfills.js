/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

// Although symlink for @react-native/js-polyfills is present, Metro couldn't handle it
module.exports = require('./packages/polyfills');
