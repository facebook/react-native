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
import type {AlertOptions, AlertType, Buttons} from './Alert.flow';

import Platform from '../Utilities/Platform';
import RCTAlertManager from './RCTAlertManager';

export type * from './Alert.flow';

class Alert {
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
    options?: AlertOptions,
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
            // $FlowFixMe[incompatible-type]
            buttonNeutral.onPress && buttonNeutral.onPress();
          } else if (buttonKey === constants.buttonNegative) {
            // $FlowFixMe[incompatible-type]
            buttonNegative.onPress && buttonNegative.onPress();
          } else if (buttonKey === constants.buttonPositive) {
            // $FlowFixMe[incompatible-type]
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
    options?: AlertOptions,
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
    }
  }
}

export default Alert;
