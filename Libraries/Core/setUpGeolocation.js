/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
'use strict';

const {polyfillObjectProperty} = require('PolyfillFunctions');

/**
 * Set up Geolocation.
 * You can use this module directly, or just require InitializeCore.
 */
let navigator = global.navigator;
if (navigator === undefined) {
  global.navigator = navigator = {};
}

// see https://github.com/facebook/react-native/issues/10881
polyfillObjectProperty(navigator, 'product', () => 'ReactNative');
polyfillObjectProperty(navigator, 'geolocation', () => require('Geolocation'));
