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

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

type DisplayMetricsAndroid = {|
  width: number,
  height: number,
  scale: number,
  fontScale: number,
  densityDpi: number,
|};

type DisplayMetricsIOS = {|
  width: number,
  height: number,
  scale: number,
  fontScale: number,
|};

export interface Spec extends TurboModule {
  +getConstants: () => {|
    +Dimensions: {
      window?: DisplayMetricsIOS,
      screen?: DisplayMetricsIOS,
      windowPhysicalPixels?: DisplayMetricsAndroid,
      screenPhysicalPixels?: DisplayMetricsAndroid,
    },
    +isIPhoneX_deprecated?: boolean,
  |};
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');

const NativeDeviceInfo = NativeModule;

export default NativeDeviceInfo;
