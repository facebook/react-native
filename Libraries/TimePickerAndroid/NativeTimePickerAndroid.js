/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export type TimePickerOptions = {|
  hour?: number,
  minute?: number,
  is24Hour?: boolean,
  mode?: string,
|};

export type TimePickerResult = {|
  action: string,
  hour: number,
  minute: number,
|};

export interface Spec extends TurboModule {
  // eslint-disable-next-line lint/react-native-modules
  +open: (options: TimePickerOptions) => Promise<TimePickerResult>;
}

export default (TurboModuleRegistry.get<Spec>('TimePickerAndroid'): ?Spec);
