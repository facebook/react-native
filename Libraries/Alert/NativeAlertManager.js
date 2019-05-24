/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';
import Platform from '../Utilities/Platform';

export type Buttons = Array<{
  text?: string,
  onPress?: ?() => void,
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

type Args = {|
  title: string,
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

export default (Platform.OS === 'ios'
  ? TurboModuleRegistry.getEnforcing<Spec>('AlertManager')
  : undefined);
