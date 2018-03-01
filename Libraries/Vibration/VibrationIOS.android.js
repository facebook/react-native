/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Stub of VibrationIOS for Android.
 *
 * @providesModule VibrationIOS
 */
'use strict';

var warning = require('fbjs/lib/warning');

var VibrationIOS = {
  vibrate: function() {
    warning('VibrationIOS is not supported on this platform!');
  }
};

module.exports = VibrationIOS;
