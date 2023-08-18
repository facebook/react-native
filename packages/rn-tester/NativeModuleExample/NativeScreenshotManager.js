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
import type {UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

export type ScreenshotManagerOptions = UnsafeObject;

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  takeScreenshot(
    id: string,
    options: ScreenshotManagerOptions,
  ): Promise<string>;
}

const NativeModule = TurboModuleRegistry.get<Spec>('ScreenshotManager');
export function takeScreenshot(
  id: string,
  options: ScreenshotManagerOptions,
): Promise<string> {
  if (NativeModule != null) {
    return NativeModule.takeScreenshot(id, options);
  }
  return Promise.reject();
}
