/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Stub of VibrationIOS for Android.
 *
 * @providesModule VibrationIOS
 */
'use strict';

var warning = require('warning');

var VibrationIOS = {
  vibrate: function() {
    warning('VibrationIOS is not supported on this platform!');
  }
};

module.exports = VibrationIOS;
