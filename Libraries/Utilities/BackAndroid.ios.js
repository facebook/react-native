/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * iOS stub for BackAndroid.android.js
 *
 * @providesModule BackAndroid
 */

'use strict';

var warning = require('warning');

function platformWarn() {
  warning(false, 'BackAndroid is not supported on this platform.');
}

var BackAndroid = {
  exitApp: platformWarn,
  addEventListener: platformWarn,
  removeEventListener: platformWarn,
};

module.exports = BackAndroid;
