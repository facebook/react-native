/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @jsdoc
 */

'use strict';

const RCTAlertManager = require('NativeModules').AlertManager;

/**
 * An Alert button type
 */
export type AlertType = $Enum<{
  /**
   * Default alert with no inputs
   */
  default: string,
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
  default: string,
  /**
   * Cancel button style
   */
  cancel: string,
  /**
   * Destructive button style
   */
  destructive: string,
}>;

/**
 * Array or buttons
 * @typedef {Array} ButtonsArray
 * @property {string=} text Button label
 * @property {Function=} onPress Callback function when button pressed
 * @property {AlertButtonStyle=} style Button style
 */
export type ButtonsArray = Array<{
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
 * Use `AlertIOS` to display an alert dialog with a message or to create a prompt for user input on iOS. If you don't need to prompt for user input, we recommend using `Alert.alert() for cross-platform support.
 *
 * See http://facebook.github.io/react-native/docs/alertios.html
 */
class AlertIOS {
  /**
   * Create and display a popup alert.
   *
   * See http://facebook.github.io/react-native/docs/alertios.html#alert
   */
  static alert(
    title: ?string,
    message?: ?string,
    callbackOrButtons?: ?((() => void) | ButtonsArray),
    type?: AlertType,
  ): void {
    if (typeof type !== 'undefined') {
      console.warn(
        'AlertIOS.alert() with a 4th "type" parameter is deprecated and will be removed. Use AlertIOS.prompt() instead.',
      );
      this.prompt(title, message, callbackOrButtons, type);
      return;
    }
    this.prompt(title, message, callbackOrButtons, 'default');
  }

  /**
   * Create and display a prompt to enter some text.
   *
   * See http://facebook.github.io/react-native/docs/alertios.html#prompt
   */
  static prompt(
    title: ?string,
    message?: ?string,
    callbackOrButtons?: ?(((text: string) => void) | ButtonsArray),
    type?: ?AlertType = 'plain-text',
    defaultValue?: string,
    keyboardType?: string,
  ): void {
    if (typeof type === 'function') {
      console.warn(
        'You passed a callback function as the "type" argument to AlertIOS.prompt(). React Native is ' +
          'assuming  you want to use the deprecated AlertIOS.prompt(title, defaultValue, buttons, callback) ' +
          'signature. The current signature is AlertIOS.prompt(title, message, callbackOrButtons, type, defaultValue, ' +
          'keyboardType) and the old syntax will be removed in a future version.',
      );

      const callback = type;
      RCTAlertManager.alertWithArgs(
        {
          title: title || '',
          type: 'plain-text',
          defaultValue: message,
        },
        (id, value) => {
          callback(value);
        },
      );
      return;
    }

    let callbacks = [];
    const buttons = [];
    let cancelButtonKey;
    let destructiveButtonKey;
    if (typeof callbackOrButtons === 'function') {
      callbacks = [callbackOrButtons];
    } else if (callbackOrButtons instanceof Array) {
      callbackOrButtons.forEach((btn, index) => {
        callbacks[index] = btn.onPress;
        if (btn.style === 'cancel') {
          cancelButtonKey = String(index);
        } else if (btn.style === 'destructive') {
          destructiveButtonKey = String(index);
        }
        if (btn.text || index < (callbackOrButtons || []).length - 1) {
          const btnDef = {};
          btnDef[index] = btn.text || '';
          buttons.push(btnDef);
        }
      });
    }

    RCTAlertManager.alertWithArgs(
      {
        title: title || '',
        message: message || undefined,
        buttons,
        type: type || undefined,
        defaultValue,
        cancelButtonKey,
        destructiveButtonKey,
        keyboardType,
      },
      (id, value) => {
        const cb = callbacks[id];
        cb && cb(value);
      },
    );
  }
}

module.exports = AlertIOS;
