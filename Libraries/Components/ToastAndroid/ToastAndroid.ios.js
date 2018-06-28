/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const warning = require('fbjs/lib/warning');

const ToastAndroid = {
  show: function(message: string, duration: number): void {
    warning(false, 'ToastAndroid is not supported on this platform.');
  },
};

module.exports = ToastAndroid;
