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
  +doubleTheValueNumber: (value: number) => Promise<number>;
  +doubleTheValueString: (value: string) => Promise<string>;
  +doubleTheValueObject: (value: {aNumber: number}) => Promise<{
    aNumber: number,
  }>;
  +doubleTheValueBoxedString: (value: BoxedString) => Promise<BoxedString>;
}

const NativeModule = TurboModuleRegistry.get<Spec>('Doubler');

export function doubleTheValue(
  value: number | string | {aNumber: number} | BoxedString,
): Promise<number | string | {aNumber: number} | BoxedString> {
  if (NativeModule == null) {
    return Promise.reject('No NativeModule initialized');
  }

  if (typeof value === 'number') {
    return NativeModule.doubleTheValueNumber(value);
  } else if (typeof value === 'string') {
    return NativeModule.doubleTheValueString(value);
  } else if (typeof value === 'object') {
    if (value.aNumber !== undefined) {
      const obj = {aNumber: value.aNumber};
      return NativeModule.doubleTheValueObject(obj);
    } else if (value.aString !== undefined) {
      return NativeModule.doubleTheValueBoxedString(value);
    } else {
      return Promise.reject('No NativeModule initialized');
    }
  }

  return Promise.reject('No NativeModule initialized');
}
