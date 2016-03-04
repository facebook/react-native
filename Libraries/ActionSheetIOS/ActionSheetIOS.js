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

var invariant = require('fbjs/lib/invariant');
var processColor = require('processColor');

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
      {...options, tintColor: processColor(options.tintColor)},
      callback
    );
  },
  
  /**
   * Display the iOS share sheet. The `options` object should contain
   * one or both of:
   * 
   * - `message` (string) - a message to share
   * - `url` (string) - a URL to share
   *
   * NOTE: if `url` points to a local file, or is a base64-encoded
   * uri, the file it points to will be loaded and shared directly.
   * In this way, you can share images, videos, PDF files, etc.
   */
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
      {...options, tintColor: processColor(options.tintColor)},
      failureCallback,
      successCallback
    );
  }
};

module.exports = ActionSheetIOS;
