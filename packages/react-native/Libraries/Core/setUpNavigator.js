/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const {polyfillObjectProperty} = require('../Utilities/PolyfillFunctions');

let navigator = global.navigator;
if (navigator === undefined) {
  global.navigator = navigator = {};
}

// see https://github.com/facebook/react-native/issues/10881
polyfillObjectProperty(navigator, 'product', () => 'ReactNative');
