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

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';
import Platform from '../../Utilities/Platform';

export type TimePickerOptions = {|
  hour?: number,
  minute?: number,
  is24Hour?: boolean,
  mode?: 'clock' | 'spinner' | 'default',
|};

export type TimePickerResult = $ReadOnly<{|
  action: string,
  hour: number,
  minute: number,
|}>;

export interface Spec extends TurboModule {
  +open: (options: TimePickerOptions) => Promise<TimePickerResult>;
}

export default (Platform.OS === 'android'
  ? TurboModuleRegistry.getEnforcing<Spec>('TimePickerAndroid')
  : undefined);
