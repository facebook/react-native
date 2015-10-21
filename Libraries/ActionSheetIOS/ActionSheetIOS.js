/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ActionSheetIOS
 * @flow
 */
'use strict';

var RCTActionSheetManager = require('NativeModules').ActionSheetManager;

var invariant = require('invariant');

var ActionSheetIOS = {
  showActionSheetWithOptions(options: Object, callback: Function) {
    invariant(
      typeof options === 'object' && options !== null,
      'Options must a valid object'
    );
    invariant(
      typeof callback === 'function',
      'Must provide a valid callback'
    );
    RCTActionSheetManager.showActionSheetWithOptions(
      options,
      callback
    );
  },

  showShareActionSheetWithOptions(
    options: Object,
    failureCallback: Function,
    successCallback: Function
  ) {
    invariant(
      typeof options === 'object' && options !== null,
      'Options must a valid object'
    );
    invariant(
      typeof failureCallback === 'function',
      'Must provide a valid failureCallback'
    );
    invariant(
      typeof successCallback === 'function',
      'Must provide a valid successCallback'
    );
    RCTActionSheetManager.showShareActionSheetWithOptions(
      options,
      failureCallback,
      successCallback
    );
  }
};

module.exports = ActionSheetIOS;
