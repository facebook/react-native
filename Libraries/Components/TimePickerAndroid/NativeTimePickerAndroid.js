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

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

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
  +open: (options: TimePickerOptions) => Promise<TimePickerResult>;
}

export default TurboModuleRegistry.get<Spec>('TimePickerAndroid');
