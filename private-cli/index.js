/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('../packager/babelRegisterOnly')([
  /private-cli\/src/,
  /packager\/[^\/]*/
]);

var cli = require('./src/cli');
var fs = require('fs');
var gracefulFs = require('graceful-fs');

// graceful-fs helps on getting an error when we run out of file
// descriptors. When that happens it will enqueue the operation and retry it.
gracefulFs.gracefulify(fs);

module.exports = cli;
