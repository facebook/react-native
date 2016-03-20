/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const buildBundle = require('./buildBundle');
const bundleCommandLineArgs = require('./bundleCommandLineArgs');
const parseCommandLine = require('../util/parseCommandLine');
const outputBundle = require('./output/bundle');
const outputPrepack = require('./output/prepack');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundleWithOutput(argv, config, output, packagerInstance) {
  const args = parseCommandLine(bundleCommandLineArgs, argv);
  if (!output) {
    output = args.prepack ? outputPrepack : outputBundle;
  }
  return buildBundle(args, config, output, packagerInstance);

}

function bundle(argv, config, packagerInstance) {
  return bundleWithOutput(argv, config, undefined, packagerInstance);
}

module.exports = bundle;
module.exports.withOutput = bundleWithOutput;
