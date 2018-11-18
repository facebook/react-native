/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

var cliEntry = require('react-native-local-cli');

if (require.main === module) {
  cliEntry.run();
}

module.exports = cliEntry;
