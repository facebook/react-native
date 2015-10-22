/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const buildBundle = require('./buildBundle');
const bundleCommandLineArgs = require('./bundleCommandLineArgs');
const parseCommandLine = require('../../../packager/parseCommandLine');

/**
 * Builds the bundle starting to look for dependencies at the given entry path.
 */
function bundle(argv, config) {
  return buildBundle(parseCommandLine(bundleCommandLineArgs, argv), config);
}

module.exports = bundle;
