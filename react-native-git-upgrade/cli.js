/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

require('babel-register')({
  babelrc: false,
  presets: [
    require('babel-preset-es2015-node'),
    require('babel-preset-stage-3'),
  ],
  // Enable transpiling for react-native-git-upgrade AND the generator, just like the upgrade CLI command does
  only: /(react-native-git-upgrade\/(?!(node_modules)))|(local-cli\/generator)/,
});

var cliEntry = require('./cliEntry');

module.exports = cliEntry;
