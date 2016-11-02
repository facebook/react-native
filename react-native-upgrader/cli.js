/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('babel-polyfill');
require('babel-register')({
  presets: ['es2015-node'],
  plugins: [
    'syntax-async-functions',
    'transform-regenerator',
  ],
  only: /react-native-upgrader/,
  retainLines: true,
  sourceMaps: 'inline',
  babelrc: false,
});

var cliEntry = require('./cliEntry');

module.exports = cliEntry;
