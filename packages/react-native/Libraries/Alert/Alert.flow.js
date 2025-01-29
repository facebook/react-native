/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

export type AlertType =
  | 'default'
  | 'plain-text'
  | 'secure-text'
  | 'login-password';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type AlertButton = {
  text?: string,
  onPress?: ?((value?: string) => any) | ?Function,
  isPreferred?: boolean,
  style?: AlertButtonStyle,
  ...
};

export type Buttons = Array<AlertButton>;

export type AlertOptions = {
  /** @platform android */
  cancelable?: ?boolean,
  userInterfaceStyle?: 'unspecified' | 'light' | 'dark',
  /** @platform android */
  onDismiss?: ?() => void,
  ...
};

/**
 * Launches an alert dialog with the specified title and message.
 *
 * See https://reactnative.dev/docs/alert
 */
declare class Alert {
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
    options?: AlertOptions,
  ): void;

  static prompt(
    title: ?string,
    message?: ?string,
    callbackOrButtons?: ?(((text: string) => void) | Buttons),
    type?: ?AlertType,
    defaultValue?: string,
    keyboardType?: string,
    options?: AlertOptions,
  ): void;
}

export default Alert;
