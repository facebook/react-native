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

type ButtonsArray = Array<{
  text?: string;
  onPress?: ?Function;
  style?: AlertButtonStyle;
}>;

/**
 * The AlertsIOS utility provides two functions: `alert` and `prompt`. All
 * functionality available through `AlertIOS.alert` is also available in the
 * cross-platform `Alert.alert`, which we recommend you use if you don't need
 * iOS-specific functionality.
 *
 * `AlertIOS.prompt` allows you to prompt the user for input inside of an
 * alert popup.
 *
 */
class AlertIOS {
  /**
   * Creates a popup to alert the user. See
   * [Alert](docs/alert.html).
   *
   *  - title: string -- The dialog's title.
   *  - message: string -- An optional message that appears above the text input.
   *  - callbackOrButtons -- This optional argument should be either a
   *    single-argument function or an array of buttons. If passed a function,
   *    it will be called when the user taps 'OK'.
   *
   *    If passed an array of button configurations, each button should include
   *    a `text` key, as well as optional `onPress` and `style` keys.
   *    `style` should be one of 'default', 'cancel' or 'destructive'.
   *  - type -- *deprecated, do not use*
   *
   * Example:
   *
   * ```
   * AlertIOS.alert(
   *  'Sync Complete',
   *  'All your data are belong to us.'
   * );
   * ```
   */
  static alert(
    title: ?string,
    message?: ?string,
    callbackOrButtons?: ?(() => void) | ButtonsArray,
    type?: AlertType,
  ): void {
    if (typeof type !== 'undefined') {
      console.warn('AlertIOS.alert() with a 4th "type" parameter is deprecated and will be removed. Use AlertIOS.prompt() instead.');
      this.prompt(title, message, callbackOrButtons, type);
      return;
    }
    this.prompt(title, message, callbackOrButtons, 'default');
  }

  /**
   * Prompt the user to enter some text.
   *
   *  - title: string -- The dialog's title.
   *  - message: string -- An optional message that appears above the text input.
   *  - callbackOrButtons -- This optional argument should be either a
   *    single-argument function or an array of buttons. If passed a function,
   *    it will be called with the prompt's value when the user taps 'OK'.
   *
   *    If passed an array of button configurations, each button should include
   *    a `text` key, as well as optional `onPress` and `style` keys (see example).
   *    `style` should be one of 'default', 'cancel' or 'destructive'.
   *  - type: string -- This configures the text input. One of 'plain-text',
   *    'secure-text' or 'login-password'.
   *  - defaultValue: string -- the default value for the text field.
   *
   * Example with custom buttons:
   * ```
   * AlertIOS.prompt(
   *   'Enter password',
   *   'Enter your password to claim your $1.5B in lottery winnings',
   *   [
   *     {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
   *     {text: 'OK', onPress: password => console.log('OK Pressed, password: ' + password)},
   *   ],
   *   'secure-text'
   * );
   * ```
   *
   * Example with the default button and a custom callback:
   * ```
   * AlertIOS.prompt(
   *   'Update username',
   *   null,
   *   text => console.log("Your username is "+text),
   *   null,
   *   'default'
   * )
   * ```
   */
  static prompt(
    title: ?string,
    message?: ?string,
    callbackOrButtons?: ?((text: string) => void) | ButtonsArray,
    type?: ?AlertType = 'plain-text',
    defaultValue?: string,
  ): void {
    if (typeof type === 'function') {
      console.warn(
        'You passed a callback function as the "type" argument to AlertIOS.prompt(). React Native is ' +
        'assuming  you want to use the deprecated AlertIOS.prompt(title, defaultValue, buttons, callback) ' +
        'signature. The current signature is AlertIOS.prompt(title, message, callbackOrButtons, type, defaultValue) ' +
        'and the old syntax will be removed in a future version.');

      var callback = type;
      var defaultValue = message;
      RCTAlertManager.alertWithArgs({
        title: title || undefined,
        type: 'plain-text',
        defaultValue,
      }, (id, value) => {
        callback(value);
      });
      return;
    }

    var callbacks = [];
    var buttons = [];
    var cancelButtonKey;
    var destructiveButtonKey;
    if (typeof callbackOrButtons === 'function') {
      callbacks = [callbackOrButtons];
    }
    else if (callbackOrButtons instanceof Array) {
      callbackOrButtons.forEach((btn, index) => {
        callbacks[index] = btn.onPress;
        if (btn.style === 'cancel') {
          cancelButtonKey = String(index);
        } else if (btn.style === 'destructive') {
          destructiveButtonKey = String(index);
        }
        if (btn.text || index < (callbackOrButtons || []).length - 1) {
          var btnDef = {};
          btnDef[index] = btn.text || '';
          buttons.push(btnDef);
        }
      });
    }

    RCTAlertManager.alertWithArgs({
      title: title || undefined,
      message: message || undefined,
      buttons,
      type: type || undefined,
      defaultValue,
      cancelButtonKey,
      destructiveButtonKey,
    }, (id, value) => {
      var cb = callbacks[id];
      cb && cb(value);
    });
  }
}

module.exports = AlertIOS;
