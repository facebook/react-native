/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

type Button = {|
  text: string,
  onPress: () => void,
  style: 'default' | 'cancel' | 'destructive',
|};

type AlertType = $Enum<{
  default: string,
  'plain-text': string,
  'secure-text': string,
  'login-password': string,
}>;

type Args = {|
  title: string,
  message?: string,
  buttons: Array<Button>,
  type?: AlertType,
  defaultValue?: string,
  cancelButtonKey?: string,
  destructiveButtonKey?: string,
  keyboardType?: string,
|};

export interface Spec extends TurboModule {
  +alertWithArgs: (args: Args, callback: () => void) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AlertManager');
