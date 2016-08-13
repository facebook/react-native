/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const bundleWithOutput = require('./bundle').withOutput;
const bundleCommandLineArgs = require('./bundleCommandLineArgs');
const outputUnbundle = require('./output/unbundle');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function unbundle(argv, config, args, packagerInstance) {
  return bundleWithOutput(argv, config, args, outputUnbundle, packagerInstance);
}

module.exports = {
  name: 'unbundle',
  description: 'builds javascript as "unbundle" for offline use',
  func: unbundle,
  options: bundleCommandLineArgs,
};
