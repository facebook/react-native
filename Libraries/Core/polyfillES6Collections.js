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

const {polyfillGlobal} = require('PolyfillFunctions');

/**
 * Polyfill ES6 collections (Map and Set).
 * If you don't need these polyfills, don't use InitializeCore; just directly
 * require the modules you need from InitializeCore for setup.
 */
const _shouldPolyfillCollection = require('_shouldPolyfillES6Collection');
if (_shouldPolyfillCollection('Map')) {
  polyfillGlobal('Map', () => require('Map'));
}
if (_shouldPolyfillCollection('Set')) {
  polyfillGlobal('Set', () => require('Set'));
}
