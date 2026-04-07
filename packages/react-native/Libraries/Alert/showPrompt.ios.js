/**
 * @flow
 * @format
 */
import type {AlertButtons, AlertOptions, AlertType} from './Alert';

import {alertWithArgs} from './RCTAlertManager';

const showPrompt = (
  title: ?string,
  message?: ?string,
  callbackOrButtons?: ?(((text: string) => void) | AlertButtons),
  type?: ?AlertType = 'plain-text',
  defaultValue?: string,
  keyboardType?: string,
  options?: AlertOptions,
) => {
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

  alertWithArgs(
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
};

export default showPrompt;
