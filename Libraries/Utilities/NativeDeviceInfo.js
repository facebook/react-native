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

export interface Spec extends TurboModule {
  +getConstants: () => {|
    Dimensions: {|
      // iOS specific
      window?: {|
        width: number,
        height: number,
        scale: number,
        fontScale: number,
      |},
      screen?: {|
        width: number,
        height: number,
        scale: number,
        fontScale: number,
      |},

      // Android specific
      windowPhysicalPixels?: {|
        width: number,
        height: number,
        scale: number,
        fontScale: number,
        densityDpi: number,
      |},
      screenPhysicalPixels?: {|
        width: number,
        height: number,
        scale: number,
        fontScale: number,
        densityDpi: number,
      |},
    |},

    // iOS specific
    isIPhoneX_deprecated?: boolean,
  |};
}

export default TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');
