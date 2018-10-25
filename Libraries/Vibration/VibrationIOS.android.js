/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Stub of VibrationIOS for Android.
 *
 * @format
 */

'use strict';

const warning = require('fbjs/lib/warning');

const VibrationIOS = {
  vibrate: function() {
    warning(
      false,
      'VibrationIOS is deprecated, and will be removed. Use Vibration instead.',
    );
  },
};

module.exports = VibrationIOS;
