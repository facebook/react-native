/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('babel-register')({
  presets: [
    require('babel-preset-es2015-node'),
    require('babel-preset-stage-3')
  ],
  // Enable transpiling for react-native-git-upgrade AND the generator, just like the upgrade CLI command does
  only: /(react-native-git-upgrade\/(?!(node_modules)))|(local-cli\/generator)/
});

var cliEntry = require('./cliEntry');

module.exports = cliEntry;
