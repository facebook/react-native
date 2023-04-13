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
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type BoxedString = {
  aString: string,
};

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  +doubleTheValue: (
    value: number | string | {aNumber: number} | BoxedString,
  ) => Promise<number | string | {aNumber: number} | BoxedString>;
}

const NativeModule = TurboModuleRegistry.get<Spec>('Doubler');

export function doubleTheValue(
  value: number | string | {aNumber: number} | BoxedString,
): Promise<number | string | {aNumber: number} | BoxedString> {
  if (NativeModule != null) {
    return NativeModule.doubleTheValue(value);
  }
  return Promise.reject('No NativeModule initialized');
}
