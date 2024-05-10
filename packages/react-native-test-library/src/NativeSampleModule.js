/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';

import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  +getRandomNumber: () => number;
}

export default (TurboModuleRegistry.get<Spec>('NativeSampleModule'): ?Spec);
