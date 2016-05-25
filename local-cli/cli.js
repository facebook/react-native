/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// This file must be able to run in node 0.12 without babel so we can show that
// it is not supported. This is why the rest of the cli code is in `cliEntry.js`.
require('./server/checkNodeVersion')();

require('../packager/babelRegisterOnly')([
  /private-cli\/src/,
  /local-cli/,
  /react-packager\/src/
]);

var cliEntry = require('./cliEntry');

if (require.main === module) {
  cliEntry.run();
}

module.exports = cliEntry;
