/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const buildBundle = require('./buildBundle');
const bundleCommandLineArgs = require('./bundleCommandLineArgs');
const outputBundle = require('metro/src/shared/output/bundle');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundleWithOutput(argv, configPromise, args, output) {
  if (!output) {
    output = outputBundle;
  }
  return buildBundle(args, configPromise, output);
}

module.exports = {
  name: 'bundle',
  description: 'builds the javascript bundle for offline use',
  func: bundleWithOutput,
  options: bundleCommandLineArgs,

  // not used by the CLI itself
  withOutput: bundleWithOutput,
};
