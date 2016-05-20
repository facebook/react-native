/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const bundle = require('./bundle');
const library = require('./library');
const runAndroid = require('./runAndroid');
const runIos = require('./runIos');
const start = require('./server');

module.exports = {
  'start': start,
  'bundle': bundle,
  'unbundle': bundle,
  'new-library': library,
  'run-android': runAndroid,
  'run-ios': runIos
};
