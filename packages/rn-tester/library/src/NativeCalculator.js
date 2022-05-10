/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  // your module methods go here, for example:
  add(a: number, b: number): Promise<number>;
}

const nativeCalculator = TurboModuleRegistry.get<Spec>('Calculator');

export function add(a: number, b: number): Promise<number> {
  if (nativeCalculator != null) {
    return nativeCalculator.add(a, b);
  }
  return Promise.reject();
}
