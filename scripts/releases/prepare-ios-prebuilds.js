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

require('../babel-register').registerForScript();

function main() {
  console.log('Starting iOS prebuilds preparation...');
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
