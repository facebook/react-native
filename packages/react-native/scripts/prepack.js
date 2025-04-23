/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const {
  generateFBReactNativeSpecIOS,
} = require('./codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS');
const {
  generateRNCoreComponentsIOS,
} = require('./codegen/generate-artifacts-executor/generateRNCoreComponentsIOS');
const fs = require('fs');

function main() {
  console.info('[Prepack] Copying README.md');
  fs.copyFileSync('../../README.md', './README.md');
  generateRNCoreComponentsIOS('.');
  generateFBReactNativeSpecIOS('.');
}

if (require.main === module) {
  main();
}
