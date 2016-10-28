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
 * @jsdoc
 */
'use strict';

var RCTAlertManager = require('NativeModules').AlertManager;

/**
 * An Alert button type
 */
export type AlertType = $Enum<{
  /**
   * Default alert with no inputs
   */
  'default': string,
  /**
   * Plain text input alert
   */
  'plain-text': string,
  /**
   * Secure text input alert
   */
  'secure-text': string,
  /**
   * Login and password alert
   */
  'login-password': string,
}>;

/**
 * An Alert button style
 */
export type AlertButtonStyle = $Enum<{
  /**
   * Default button style
   */
  'default': string,
  /**
   * Cancel button style
   */
  'cancel': string,
  /**
   * Destructive button style
   */
  'destructive': string,
}>;

/**
 * Array or buttons
 * @typedef {Array} ButtonsArray
 * @property {string=} text Button label
 * @property {Function=} onPress Callback function when button pressed
 * @property {AlertButtonStyle=} style Button style
 */
type ButtonsArray = Array<{
  /**
   * Button label
   */
  text?: string,
  /**
   * Callback function when button pressed
   */
  onPress?: ?Function,
  /**
   * Button style
   */
  style?: AlertButtonStyle,
}>;

/**
 * @description
 * `AlertIOS` provides functionality to create an iOS alert dialog with a
 * message or create a prompt for user input.
 *
 * Creating an iOS alert:
 *
 * ```
 * AlertIOS.alert(
 *  'Sync Complete',
 *  'All your data are belong to us.'
 * );
 * ```
 *
 * Creating an iOS prompt:
 *
 * ```
 * AlertIOS.prompt(
 *   'Enter a value',
 *   null,
 *   text => console.log("You entered "+text)
 * );
 * ```
 *
 * We recommend using the [`Alert.alert`](/docs/alert.html) method for
 * cross-platform support if you don't need to create iOS-only prompts.
 *
 */
class AlertIOS {
  /**
   * Create and display a popup alert.
   * @static
   * @method alert
   * @param title The dialog's title.
   * @param message An optional message that appears below
   *     the dialog's title.
   * @param callbackOrButtons This optional argument should
   *    be either a single-argument function or an array of buttons. If passed
   *    a function, it will be called when the user taps 'OK'.
   *
   *    If passed an array of button configurations, each button should include
   *    a `text` key, as well as optional `onPress` and `style` keys. `style`
   *    should be one of 'default', 'cancel' or 'destructive'.
   * @param type Deprecated, do not use.
   *
   * @example <caption>Example with custom buttons</caption>
   *
   * AlertIOS.alert(
   *  'Update available',
   *  'Keep your app up to date to enjoy the latest features',
   *  [
   *    {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
   *    {text: 'Install', onPress: () => console.log('Install Pressed')},
   *  ],
   * );
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
   * Create and display a prompt to enter some text.
   * @static
   * @method prompt
   * @param title The dialog's title.
   * @param message An optional message that appears above the text
   *    input.
   * @param callbackOrButtons This optional argument should
   *    be either a single-argument function or an array of buttons. If passed
   *    a function, it will be called with the prompt's value when the user
   *    taps 'OK'.
   *
   *    If passed an array of button configurations, each button should include
   *    a `text` key, as well as optional `onPress` and `style` keys (see
   *    example). `style` should be one of 'default', 'cancel' or 'destructive'.
   * @param type This configures the text input. One of 'plain-text',
   *    'secure-text' or 'login-password'.
   * @param defaultValue The default text in text input.
   *
   * @example <caption>Example with custom buttons</caption>
   *
   * AlertIOS.prompt(
   *   'Enter password',
   *   'Enter your password to claim your $1.5B in lottery winnings',
   *   [
   *     {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
   *     {text: 'OK', onPress: password => console.log('OK Pressed, password: ' + password)},
   *   ],
   *   'secure-text'
   * );
   *
   * @example <caption>Example with the default button and a custom callback</caption>
   *
   * AlertIOS.prompt(
   *   'Update username',
   *   null,
   *   text => console.log("Your username is "+text),
   *   null,
   *   'default'
   * );
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
