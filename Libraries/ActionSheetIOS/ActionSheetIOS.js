/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ActionSheetIOS
 */
'use strict';

var RCTActionSheetManager = require('NativeModules').ActionSheetManager;

var invariant = require('invariant');

var ActionSheetIOS = {
  showActionSheetWithOptions(options, callback) {
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
      () => {}, // RKActionSheet compatibility hack
      callback
    );
  },

  showShareActionSheetWithOptions(options, failureCallback, successCallback) {
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
