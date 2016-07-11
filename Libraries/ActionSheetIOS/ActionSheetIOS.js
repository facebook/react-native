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

type ShareSheetResponse = {
  completed: boolean,
  activityType: ?string,
};

var ActionSheetIOS = {
  /**
   * Display an iOS action sheet. The `options` object must contain one or more
   * of:
   *
   * - `options` (array of strings) - a list of button titles (required)
   * - `cancelButtonIndex` (int) - index of cancel button in `options`
   * - `destructiveButtonIndex` (int) - index of destructive button in `options`
   * - `title` (string) - a title to show above the action sheet
   * - `message` (string) - a message to show below the title
   *
   * Promise is resolved with a index of button in `options` that was selected
   *
   * NOTE: `callback` is now deprecated in favour of a promise
   */
  showActionSheetWithOptions(options: Object, callback?: Function): Promise<number> {
    invariant(
      typeof options === 'object' && options !== null,
      'Options must be a valid object'
    );

    const promise = RCTActionSheetManager.showActionSheetWithOptions({
      ...options,
      tintColor: processColor(options.tintColor)
    });

    if (typeof callback === 'function') {
      console.warn(
        'ActionSheetIOS.showActionSheetWithOptions(options, cb) is deprecated. ' +
        'Use the returned Promise instead.'
      );
      promise.then(callback);
    }

    return promise;
  },

  /**
   * Display the iOS share sheet. The `options` object should contain
   * one or both of `message` and `url` and can additionally have 
   * a `subject` or `excludedActivityTypes`:
   *
   * - `url` (string) - a URL to share
   * - `message` (string) - a message to share
   * - `subject` (string) - a subject for the message
   * - `excludedActivityTypes` (array) - the activites to exclude from the ActionSheet
   *
   * Returns a Promise that is resolved with an object:
   *
   * - `completed` (boolean) - true if share action was completed
   * - `activityType` (?string) - type of share activity user selected
   *
   * NOTE: `failureCallback` and `successCallback` are now deprecated in favour
   * of promise
   *
   * NOTE: if `url` points to a local file, or is a base64-encoded
   * uri, the file it points to will be loaded and shared directly.
   * In this way, you can share images, videos, PDF files, etc.
   */
  showShareActionSheetWithOptions(
    options: Object,
    failureCallback?: Function,
    successCallback?: Function
  ): Promise<ShareSheetResponse> {
    invariant(
      typeof options === 'object' && options !== null,
      'Options must be a valid object'
    );

    const promise = RCTActionSheetManager.showShareActionSheetWithOptions({
      ...options,
      tintColor: processColor(options.tintColor)
    });

    if (typeof failureCallback === 'function' || typeof successCallback === 'function') {
      invariant(
        typeof failureCallback === 'function',
        'Must provide a valid failureCallback'
      );
      invariant(
        typeof successCallback === 'function',
        'Must provide a valid successCallback'
      );
      console.warn(
        'ActionSheetIOS.showShareActionSheetWithOptions(opts, cb, cb) is deprecated. ' +
        'Use the returned Promise instead.'
      );
      promise
        // $FlowFixMe: Ignores invariants and reports possible undefined value
        .then((res: ShareSheetResponse) => successCallback(res.completed, res.activityType))
        .catch(failureCallback);
    }

    return promise;
  }
};

module.exports = ActionSheetIOS;
