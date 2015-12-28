/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AlertIOS
 * @flow
 */
'use strict';

var RCTAlertManager = require('NativeModules').AlertManager;
var invariant = require('invariant');

export type AlertType = $Enum<{
  'default': string;
  'plain-text': string;
  'secure-text': string;
  'login-password': string;
}>;

export type AlertButtonStyle = $Enum<{
  'default': string;
  'cancel': string;
  'destructive': string;
}>;

/**
 * Launches an alert dialog with the specified title and message.
 *
 * Optionally provide a list of buttons. Tapping any button will fire the
 * respective onPress callback and dismiss the alert. By default, the only
 * button will be an 'OK' button.
 *
 * Use this API for iOS-specific features, such as prompting the user to enter
 * some information. In other cases, especially to show static alerts, use
 * the cross-platform `Alert` API.
 *
 * ```
 * AlertIOS.alert(
 *   'Enter password',
 *   null,
 *   [
 *     {text: 'Submit', onPress: (text) => console.log('Password: ' + text)},
 *   ],
 *   'secure-text'
 * )
 * ```
 */
class AlertIOS {
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Array<{
      text?: string;
      onPress?: ?Function;
      style?: AlertButtonStyle;
    }>,
    type?: ?AlertType
  ): void {
    var callbacks = [];
    var buttonsSpec = [];
    var cancelButtonKey;
    var destructiveButtonKey;
    buttons && buttons.forEach((btn, index) => {
      callbacks[index] = btn.onPress;
      if (btn.style == 'cancel') {
        cancelButtonKey = String(index);
      } else if (btn.style == 'destructive') {
        destructiveButtonKey = String(index);
      }
      if (btn.text || index < (buttons || []).length - 1) {
        var btnDef = {};
        btnDef[index] = btn.text || '';
        buttonsSpec.push(btnDef);
      }
    });
    RCTAlertManager.alertWithArgs({
      title: title || undefined,
      message: message || undefined,
      buttons: buttonsSpec,
      type: type || undefined,
      cancelButtonKey,
      destructiveButtonKey,
    }, (id, value) => {
      var cb = callbacks[id];
      cb && cb(value);
    });
  }

  /**
   * Prompt the user to enter some text.
   */
  static prompt(
    title: string,
    value?: string,
    buttons?: Array<{
      text?: string;
      onPress?: ?Function;
      style?: AlertButtonStyle;
    }>,
    callback?: ?Function
  ): void {
    if (arguments.length === 2) {
      if (typeof value === 'object') {
        buttons = value;
        value = undefined;
      } else if (typeof value === 'function') {
        callback = value;
        value = undefined;
      }
    } else if (arguments.length === 3 && typeof buttons === 'function') {
      callback = buttons;
      buttons = undefined;
    }

    invariant(
      !(callback && buttons) && (callback || buttons),
      'Must provide either a button list or a callback, but not both'
    );

    if (!buttons) {
      buttons = [{ onPress: callback }];
    }
    this.alert(title, value, buttons, 'plain-text');
  }
}

module.exports = AlertIOS;
