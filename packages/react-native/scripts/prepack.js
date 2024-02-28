/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const {
  generateRNCoreComponentsIOS,
} = require('./codegen/generate-artifacts-executor');
const fs = require('fs');

console.info('[Prepack] Copying README.md');
fs.copyFileSync('../../README.md', './README.md');
generateRNCoreComponentsIOS('.');
