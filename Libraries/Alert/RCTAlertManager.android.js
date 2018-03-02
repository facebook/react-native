/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule RCTAlertManager
*/
'use strict';

var NativeModules = require('NativeModules');

function emptyCallback() {}

module.exports = {
  alertWithArgs: function(args, callback) {
    // TODO(5998984): Polyfill it correctly with DialogManagerAndroid
    NativeModules.DialogManagerAndroid.showAlert(
        args,
        emptyCallback,
        callback || emptyCallback);
  },
};
