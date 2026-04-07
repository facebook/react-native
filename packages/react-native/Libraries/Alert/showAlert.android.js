/**
 * @flow
 * @format
 */
import type {DialogOptions} from '../NativeModules/specs/NativeDialogManagerAndroid';
import type {AlertButtons, AlertOptions} from './Alert';

import NativeDialogManagerAndroid from '../NativeModules/specs/NativeDialogManagerAndroid';

const showAlert = (
  title: ?string,
  message?: ?string,
  buttons?: AlertButtons,
  options?: AlertOptions,
) => {
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
  const validButtons: AlertButtons = buttons
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
        // $FlowFixMe[incompatible-use]
        buttonNeutral.onPress && buttonNeutral.onPress();
      } else if (buttonKey === constants.buttonNegative) {
        // $FlowFixMe[incompatible-type]
        // $FlowFixMe[incompatible-use]
        buttonNegative.onPress && buttonNegative.onPress();
      } else if (buttonKey === constants.buttonPositive) {
        // $FlowFixMe[incompatible-type]
        // $FlowFixMe[incompatible-use]
        buttonPositive.onPress && buttonPositive.onPress();
      }
    } else if (action === constants.dismissed) {
      options && options.onDismiss && options.onDismiss();
    }
  };
  const onError = (errorMessage: string) => console.warn(errorMessage);
  NativeDialogManagerAndroid.showAlert(config, onError, onAction);
};

export default showAlert;
