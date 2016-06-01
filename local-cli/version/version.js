/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var pkg = require('../../package');
var Promise = require('promise');

/**
 * Prints the version of react-native and exits.
 */
function version(argv, config) {
  console.log(pkg.version);
  return Promise.resolve();
}

module.exports = version;
