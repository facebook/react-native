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
  text?: string,
  onPress?: () => void,
  style?: string,
|};

type Args = {|
  title: string,
  message?: string,
  buttons?: Array<Button>,
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

export default TurboModuleRegistry.getEnforcing<Spec>('AlertManager');
