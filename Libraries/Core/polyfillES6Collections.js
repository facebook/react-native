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

const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

/**
 * Polyfill ES6 collections (Map and Set).
 * If you don't need these polyfills, don't use InitializeCore; just directly
 * require the modules you need from InitializeCore for setup.
 */
const _shouldPolyfillCollection = require('../vendor/core/_shouldPolyfillES6Collection');
if (_shouldPolyfillCollection('Map')) {
  // $FlowFixMe: even in strict-local mode Flow expects Map to be Flow-typed
  polyfillGlobal('Map', () => require('../vendor/core/Map'));
}
if (_shouldPolyfillCollection('Set')) {
  // $FlowFixMe: even in strict-local mode Flow expects Set to be Flow-typed
  polyfillGlobal('Set', () => require('../vendor/core/Set'));
}
