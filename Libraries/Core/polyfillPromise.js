/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

/**
 * Set up Promise. The native Promise implementation throws the following error:
 * ERROR: Event loop not supported.
 *
 * If you don't need these polyfills, don't use InitializeCore; just directly
 * require the modules you need from InitializeCore for setup.
 */
polyfillGlobal('Promise', () => require('../Promise'));
