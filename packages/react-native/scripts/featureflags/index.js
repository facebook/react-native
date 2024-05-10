/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

if (require.main === module) {
  require('../../../../scripts/build/babel-register').registerForMonorepo();
  const update = require('./update').default;
  update(process.argv.includes('--verify-unchanged'));
}
