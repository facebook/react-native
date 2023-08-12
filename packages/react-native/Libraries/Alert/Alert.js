/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {DialogOptions} from '../NativeModules/specs/NativeDialogManagerAndroid';

import Platform from '../Utilities/Platform';
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
  isPreferred?: boolean,
  style?: AlertButtonStyle,
  ...
}>;
// [macOS
export type DefaultInputsArray = Array<{
  default?: string,
  placeholder?: string,
  style?: AlertButtonStyle,
}>;
// macOS]

type Options = {
  cancelable?: ?boolean,
  userInterfaceStyle?: 'unspecified' | 'light' | 'dark',
  onDismiss?: ?() => void,
  // [macOS
  modal?: ?boolean,
  critical?: ?boolean,
  // macOS]
  ...
};

/**
 * Launches an alert dialog with the specified title and message.
 *
 * See https://reactnative.dev/docs/alert
 */
class Alert {
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
    options?: Options,
  ): void {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        title,
        message,
        buttons,
        'default',
        undefined,
        undefined,
        options,
      );
      // [macOS
    } else if (Platform.OS === 'macos') {
      Alert.promptMacOS(
        title,
        message,
        buttons,
        'default',
        undefined,
        options?.modal,
        options?.critical,
      );
      // macOS]
    } else if (Platform.OS === 'android') {
      const NativeDialogManagerAndroid =
        require('../NativeModules/specs/NativeDialogManagerAndroid').default;
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

      /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
       * Flow's LTI update could not be added via codemod */
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
      const onError = (errorMessage: string) => console.warn(errorMessage);
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
    options?: Options,
  ): void {
    if (Platform.OS === 'ios') {
      let callbacks: Array<?any> = [];
      const buttons = [];
      let cancelButtonKey;
      let destructiveButtonKey;
      let preferredButtonKey;
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
          if (btn.isPreferred) {
            preferredButtonKey = String(index);
          }
          if (btn.text || index < (callbackOrButtons || []).length - 1) {
            const btnDef: {[number]: string} = {};
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
          preferredButtonKey,
          keyboardType,
          userInterfaceStyle: options?.userInterfaceStyle || undefined,
        },
        (id, value) => {
          const cb = callbacks[id];
          cb && cb(value);
        },
      );
      // [macOS
    } else if (Platform.OS === 'macos') {
      const defaultInputs = [{default: defaultValue}];
      Alert.promptMacOS(title, message, callbackOrButtons, type, defaultInputs);
    }
    // macOS]
  }

  // [macOS
  /**
   * Create and display a prompt to enter some text.
   * @static
   * @method promptMacOS
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
   * AlertMacOS.promptMacOS(
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
  static promptMacOS(
    title: ?string,
    message?: ?string,
    callbackOrButtons?: ?((text: string) => void) | Buttons,
    type?: ?AlertType = 'plain-text',
    defaultInputs?: DefaultInputsArray,
    modal?: ?boolean,
    critical?: ?boolean,
  ): void {
    let callbacks: Array<?any> = [];
    const buttons = [];
    if (typeof callbackOrButtons === 'function') {
      callbacks = [callbackOrButtons];
    } else if (callbackOrButtons instanceof Array) {
      callbackOrButtons.forEach((btn, index) => {
        callbacks[index] = btn.onPress;
        if (btn.text || index < (callbackOrButtons || []).length - 1) {
          const btnDef: {[number]: string} = {};
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
        const cb = callbacks[id];
        cb && cb(value);
      },
    );
  }
  // macOS]
}

module.exports = Alert;
