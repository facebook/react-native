/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import Platform from '../Utilities/Platform';
import NativeDialogManagerAndroid, {
  type DialogOptions,
} from '../NativeModules/specs/NativeDialogManagerAndroid';
import RCTAlertManager from './RCTAlertManager';

export type AlertType =
  | 'default'
  | 'plain-text'
  | 'secure-text'
  | 'login-password';
export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';
export type Buttons = Array<{
  text?: string,
  onPress?: ?Function,
  style?: AlertButtonStyle,
}>;

type Options = {
  cancelable?: ?boolean,
  onDismiss?: ?() => void,
};

/**
 * Launches an alert dialog with the specified title and message.
 *
 * See http://facebook.github.io/react-native/docs/alert.html
 */
class Alert {
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
    options?: Options,
  ): void {
    if (Platform.OS === 'ios') {
      Alert.prompt(title, message, buttons, 'default');
    } else if (Platform.OS === 'android') {
      if (!NativeDialogManagerAndroid) {
        return;
      }
      const constants = NativeDialogManagerAndroid.getConstants();

      const config: DialogOptions = {
        title: title || '',
        message: message || '',
        cancelable: false,
      };

      if (options && options.cancelable) {
        config.cancelable = options.cancelable;
      }
      // At most three buttons (neutral, negative, positive). Ignore rest.
      // The text 'OK' should be probably localized. iOS Alert does that in native.
      const defaultPositiveText = 'OK';
      const validButtons: Buttons = buttons
        ? buttons.slice(0, 3)
        : [{text: defaultPositiveText}];
      const buttonPositive = validButtons.pop();
      const buttonNegative = validButtons.pop();
      const buttonNeutral = validButtons.pop();

      if (buttonNeutral) {
        config.buttonNeutral = buttonNeutral.text || '';
      }
      if (buttonNegative) {
        config.buttonNegative = buttonNegative.text || '';
      }
      if (buttonPositive) {
        config.buttonPositive = buttonPositive.text || defaultPositiveText;
      }

      const onAction = (action, buttonKey) => {
        if (action === constants.buttonClicked) {
          if (buttonKey === constants.buttonNeutral) {
            buttonNeutral.onPress && buttonNeutral.onPress();
          } else if (buttonKey === constants.buttonNegative) {
            buttonNegative.onPress && buttonNegative.onPress();
          } else if (buttonKey === constants.buttonPositive) {
            buttonPositive.onPress && buttonPositive.onPress();
          }
        } else if (action === constants.dismissed) {
          options && options.onDismiss && options.onDismiss();
        }
      };
      const onError = errorMessage => console.warn(errorMessage);
      NativeDialogManagerAndroid.showAlert(config, onError, onAction);
    }
  }

  static prompt(
    title: ?string,
    message?: ?string,
    callbackOrButtons?: ?(((text: string) => void) | Buttons),
    type?: ?AlertType = 'plain-text',
    defaultValue?: string,
    keyboardType?: string,
  ): void {
    if (Platform.OS === 'ios') {
      if (typeof type === 'function') {
        console.warn(
          'You passed a callback function as the "type" argument to Alert.prompt(). React Native is ' +
            'assuming  you want to use the deprecated Alert.prompt(title, defaultValue, buttons, callback) ' +
            'signature. The current signature is Alert.prompt(title, message, callbackOrButtons, type, defaultValue, ' +
            'keyboardType) and the old syntax will be removed in a future version.',
        );

        const callback = type;
        RCTAlertManager.alertWithArgs(
          {
            title: title || '',
            type: 'plain-text',
            defaultValue: message || '',
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
      } else if (Array.isArray(callbackOrButtons)) {
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
}

module.exports = Alert;
