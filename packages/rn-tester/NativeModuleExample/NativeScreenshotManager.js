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

import type {TurboModule} from '../../../Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  takeScreenshot(
    id: string,
    options: {format: string, quality?: number},
  ): Promise<string>;
}

export const NativeModule = (TurboModuleRegistry.get<Spec>(
  'ScreenshotManager',
): ?Spec);
