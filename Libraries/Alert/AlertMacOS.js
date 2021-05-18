/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @jsdoc
 */

// TODO(macOS GH#774)

'use strict';

import type {AlertType, AlertButtonStyle} from './Alert';
import RCTAlertManager from './RCTAlertManager';

/**
 * Array or buttons
 * @typedef {Array} ButtonsArray
 * @property {string=} text Button label
 * @property {Function=} onPress Callback function when button pressed
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
   * An Alert button style
   */
  style?: AlertButtonStyle,
  ...
}>;

/**
 * Array of defaults input values
 * @typedef {Array} DefaultsInputArray
 * @property {string=} default input
 * @property {string=} placeholder input
 */
export type DefaultInputsArray = Array<{
  /**
   * Default input
   */
  default?: string,
  /**
   * Placeholder input
   */
  placeholder?: string,

  style?: AlertButtonStyle,
}>;

/**
 * @description
 * `AlertMacOS` provides functionality to create a macOS alert dialog with a
 * message or create a prompt for user input.
 *
 * Creating an macOS alert:
 *
 * ```
 * AlertMacOS.alert(
 *  'Sync Complete',
 *  'All your data are belong to us.'
 * );
 * ```
 *
 * Creating an macOS prompt:
 *
 * ```
 * AlertMacOS.prompt(
 *   'Enter a value',
 *   null,
 *   text => console.log("You entered "+text)
 * );
 * ```
 *
 * We recommend using the [`Alert.alert`](docs/alert.html) method for
 * cross-platform support if you don't need to create macOS-only prompts.
 *
 */
class AlertMacOS {
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
   *    a `text` key, as well as optional `onPress` key.
   *
   * @example <caption>Example with custom buttons</caption>
   *
   * AlertMacOS.alert(
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
  ): void {
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
   *    a `text` key, as well as optional `onPress` key (see
   *    example).
   * @param type This configures the text input. One of 'plain-text',
   *    'secure-text' or 'login-password'.
   * @param defaultInputs This optional argument should be an array of couple
   *    default value - placeholder for the input fields.
   * @param modal The alert can be optionally run as an app-modal dialog, instead
   *    of the default presentation as a sheet.
   * @param critical This optional argument should be used when it's needed to
   *    warn the user about severe consequences of an impending event
   *    (such as deleting a file).
   *
   * @example <caption>Example with custom buttons</caption>
   *
   * AlertMacOS.prompt(
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
   * AlertMacOS.prompt(
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
    defaultInputs?: DefaultInputsArray,
    modal?: ?boolean,
    critical?: ?boolean,
  ): void {
    var callbacks = [];
    var buttons = [];
    if (typeof callbackOrButtons === 'function') {
      callbacks = [callbackOrButtons];
    } else if (callbackOrButtons instanceof Array) {
      callbackOrButtons.forEach((btn, index) => {
        callbacks[index] = btn.onPress;
        if (btn.text || index < (callbackOrButtons || []).length - 1) {
          var btnDef = {};
          btnDef[index] = btn.text || '';
          buttons.push(btnDef);
        }
      });
    }

    RCTAlertManager.alertWithArgs(
      {
        title: title || undefined,
        message: message || undefined,
        buttons,
        type: type || undefined,
        defaultInputs,
        modal: modal || undefined,
        critical: critical || undefined,
      },
      (id, value) => {
        var cb = callbacks[id];
        cb && cb(value);
      },
    );
  }
}

module.exports = AlertMacOS;
