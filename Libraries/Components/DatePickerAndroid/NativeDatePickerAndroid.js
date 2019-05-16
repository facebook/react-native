/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';
import type {Options, DatePickerOpenAction} from './DatePickerAndroidTypes';
import Platform from 'Platform';

export interface Spec extends TurboModule {
  +open: (options: ?Options) => Promise<DatePickerOpenAction>;
}

export default (Platform.OS === 'android'
  ? TurboModuleRegistry.getEnforcing<Spec>('DatePickerAndroid')
  : TurboModuleRegistry.getEnforcing<Spec>('DatePickerIOS'));
