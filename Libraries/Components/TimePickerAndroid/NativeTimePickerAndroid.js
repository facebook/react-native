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

import type {
  TimePickerOptions,
  TimePickerResult,
} from './TimePickerAndroidTypes';

export interface Spec extends TurboModule {
  +open: (options: TimePickerOptions) => Promise<TimePickerResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('TimePickerAndroid');
