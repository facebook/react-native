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
 * Set up regenerator.
 * You can use this module directly, or just require InitializeCore.
 */
polyfillGlobal('regeneratorRuntime', () => {
  // The require just sets up the global, so make sure when we first
  // invoke it the global does not exist
  delete global.regeneratorRuntime;

  // regenerator-runtime/runtime exports the regeneratorRuntime object, so we
  // can return it safely.
  return require('regenerator-runtime/runtime'); // flowlint-line untyped-import:off
});
