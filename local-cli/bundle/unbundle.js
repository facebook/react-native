/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const bundleWithOutput = require('./bundle').withOutput;
const bundleCommandLineArgs = require('./bundleCommandLineArgs');
const outputUnbundle = require('metro/src/shared/output/unbundle');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function unbundle(argv, config, args) {
  return bundleWithOutput(argv, config, args, outputUnbundle);
}

module.exports = {
  name: 'unbundle',
  description: 'builds javascript as "unbundle" for offline use',
  func: unbundle,
  options: bundleCommandLineArgs.concat({
    command: '--indexed-unbundle',
    description: 'Force indexed unbundle file format, even when building for android',
    default: false,
  }),
};
