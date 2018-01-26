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
 * @format
 */
'use strict';

const RCTActionSheetManager = require('NativeModules').ActionSheetManager;

const invariant = require('fbjs/lib/invariant');
const processColor = require('processColor');

/**
 * Display action sheets and share sheets on iOS.
 *
 * See http://facebook.github.io/react-native/docs/actionsheetios.html
 */
const ActionSheetIOS = {
  /**
   * Display an iOS action sheet.
   *
   * The `options` object must contain one or more of:
   *
   * - `options` (array of strings) - a list of button titles (required)
   * - `cancelButtonIndex` (int) - index of cancel button in `options`
   * - `destructiveButtonIndex` (int) - index of destructive button in `options`
   * - `title` (string) - a title to show above the action sheet
   * - `message` (string) - a message to show below the title
   *
   * The 'callback' function takes one parameter, the zero-based index
   * of the selected item.
   *
   * See http://facebook.github.io/react-native/docs/actionsheetios.html#showactionsheetwithoptions
   */
  showActionSheetWithOptions(
    options: {|
      +title?: ?string,
      +message?: ?string,
      +options: Array<string>,
      +destructiveButtonIndex?: ?number,
      +cancelButtonIndex?: ?number,
      +anchor?: ?number,
      +tintColor?: number | string,
    |},
    callback: (buttonIndex: number) => void,
  ) {
    invariant(
      typeof options === 'object' && options !== null,
      'Options must be a valid object',
    );
    invariant(typeof callback === 'function', 'Must provide a valid callback');

    RCTActionSheetManager.showActionSheetWithOptions(
      {...options, tintColor: processColor(options.tintColor)},
      callback,
    );
  },

  /**
   * Display the iOS share sheet. The `options` object should contain
   * one or both of `message` and `url` and can additionally have
   * a `subject` or `excludedActivityTypes`:
   *
   * - `url` (string) - a URL to share
   * - `message` (string) - a message to share
   * - `subject` (string) - a subject for the message
   * - `excludedActivityTypes` (array) - the activities to exclude from
   *   the ActionSheet
   * - `tintColor` (color) - tint color of the buttons
   *
   * The 'failureCallback' function takes one parameter, an error object.
   * The only property defined on this object is an optional `stack` property
   * of type `string`.
   *
   * The 'successCallback' function takes two parameters:
   *
   * - a boolean value signifying success or failure
   * - a string that, in the case of success, indicates the method of sharing
   *
   * See http://facebook.github.io/react-native/docs/actionsheetios.html#showshareactionsheetwithoptions
   */
  showShareActionSheetWithOptions(
    options: Object,
    failureCallback: Function,
    successCallback: Function,
  ) {
    invariant(
      typeof options === 'object' && options !== null,
      'Options must be a valid object',
    );
    invariant(
      typeof failureCallback === 'function',
      'Must provide a valid failureCallback',
    );
    invariant(
      typeof successCallback === 'function',
      'Must provide a valid successCallback',
    );
    RCTActionSheetManager.showShareActionSheetWithOptions(
      {...options, tintColor: processColor(options.tintColor)},
      failureCallback,
      successCallback,
    );
  },
};

module.exports = ActionSheetIOS;
