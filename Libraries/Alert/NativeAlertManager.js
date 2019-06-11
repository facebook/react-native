/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export type Buttons = Array<{
  text?: string,
  onPress?: ?Function,
  style?: AlertButtonStyle,
}>;

export type Options = {
  cancelable?: ?boolean,
  onDismiss?: ?() => void,
};

/* 'default' | plain-text' | 'secure-text' | 'login-password' */
export type AlertType = string;

/* 'default' | 'cancel' | 'destructive' */
export type AlertButtonStyle = string;

export type Args = {|
  title?: string,
  message?: string,
  buttons?: Buttons,
  type?: string,
  defaultValue?: string,
  cancelButtonKey?: string,
  destructiveButtonKey?: string,
  keyboardType?: string,
|};

export interface Spec extends TurboModule {
  +alertWithArgs: (
    args: Args,
    callback: (id: number, value: string) => void,
  ) => void;
}

export default TurboModuleRegistry.get<Spec>('AlertManager');
