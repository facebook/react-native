/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const bundleWithOutput = require('./bundle').withOutput;
const bundleCommandLineArgs = require('./bundleCommandLineArgs');
const outputUnbundle = require('metro/src/shared/output/unbundle');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function ramBundle(argv, config, args) {
  return bundleWithOutput(argv, config, args, outputUnbundle);
}

module.exports = {
  name: 'ram-bundle',
  description:
    'builds javascript as a "Random Access Module" bundle for offline use',
  func: ramBundle,
  options: bundleCommandLineArgs.concat({
    command: '--indexed-ram-bundle',
    description:
      'Force the "Indexed RAM" bundle file format, even when building for android',
    default: false,
  }),
};
