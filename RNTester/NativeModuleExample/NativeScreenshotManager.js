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

import type {TurboModule} from '../../Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  takeSnapshot(id: string): Promise<string>;
}

const NativeModule = TurboModuleRegistry.get<Spec>('ScreenshotManager');

export function takeSnapshot(id: string): Promise<string> {
  if (NativeModule != null) {
    return NativeModule.takeSnapshot(id);
  }
  return Promise.reject();
}
