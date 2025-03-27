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

export interface Spec extends TurboModule {
  getImageUrl: () => Promise<string | null>;
}

const NativeModule = TurboModuleRegistry.get<Spec>('ImagePickerAndroid');
export function getImageUrl(): Promise<string | null> {
  if (NativeModule != null) {
    return NativeModule.getImageUrl();
  } else {
    return Promise.reject('NativeModule is null');
  }
}
