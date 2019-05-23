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
import {type Buttons} from './Alert';

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
