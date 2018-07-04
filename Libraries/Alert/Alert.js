/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const AlertIOS = require('AlertIOS');
const NativeModules = require('NativeModules');
const Platform = require('Platform');

import type {AlertType, AlertButtonStyle} from 'AlertIOS';

export type Buttons = Array<{
  text?: string,
  onPress?: ?Function,
  style?: AlertButtonStyle,
}>;

type Options = {
  cancelable?: ?boolean,
  onDismiss?: ?Function,
};

/**
 * Launches an alert dialog with the specified title and message.
 *
 * See http://facebook.github.io/react-native/docs/alert.html
 */
class Alert {
  /**
   * Launches an alert dialog with the specified title and message.
   *
   * See http://facebook.github.io/react-native/docs/alert.html#alert
   */
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
    options?: Options,
    type?: AlertType,
  ): void {
    if (Platform.OS === 'ios') {
      if (typeof type !== 'undefined') {
        console.warn(
          'Alert.alert() with a 5th "type" parameter is deprecated and will be removed. Use AlertIOS.prompt() instead.',
        );
        AlertIOS.alert(title, message, buttons, type);
        return;
      }
      AlertIOS.alert(title, message, buttons);
    } else if (Platform.OS === 'android') {
      AlertAndroid.alert(title, message, buttons, options);
    }
  }
}

/**
 * Wrapper around the Android native module.
 */
class AlertAndroid {
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
    options?: Options,
  ): void {
    let config = {
      title: title || '',
      message: message || '',
    };

    if (options) {
      config = {...config, cancelable: options.cancelable};
    }
    // At most three buttons (neutral, negative, positive). Ignore rest.
    // The text 'OK' should be probably localized. iOS Alert does that in native.
    const validButtons: Buttons = buttons
      ? buttons.slice(0, 3)
      : [{text: 'OK'}];
    const buttonPositive = validButtons.pop();
    const buttonNegative = validButtons.pop();
    const buttonNeutral = validButtons.pop();
    if (buttonNeutral) {
      config = {...config, buttonNeutral: buttonNeutral.text || ''};
    }
    if (buttonNegative) {
      config = {...config, buttonNegative: buttonNegative.text || ''};
    }
    if (buttonPositive) {
      config = {...config, buttonPositive: buttonPositive.text || ''};
    }
    NativeModules.DialogManagerAndroid.showAlert(
      config,
      errorMessage => console.warn(errorMessage),
      (action, buttonKey) => {
        if (action === NativeModules.DialogManagerAndroid.buttonClicked) {
          if (buttonKey === NativeModules.DialogManagerAndroid.buttonNeutral) {
            buttonNeutral.onPress && buttonNeutral.onPress();
          } else if (
            buttonKey === NativeModules.DialogManagerAndroid.buttonNegative
          ) {
            buttonNegative.onPress && buttonNegative.onPress();
          } else if (
            buttonKey === NativeModules.DialogManagerAndroid.buttonPositive
          ) {
            buttonPositive.onPress && buttonPositive.onPress();
          }
        } else if (action === NativeModules.DialogManagerAndroid.dismissed) {
          options && options.onDismiss && options.onDismiss();
        }
      },
    );
  }
}

module.exports = Alert;
