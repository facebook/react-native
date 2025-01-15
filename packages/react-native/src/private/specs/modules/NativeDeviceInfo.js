/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export type DisplayMetricsAndroid = {
  width: number,
  height: number,
  scale: number,
  fontScale: number,
  densityDpi: number,
};

export type DisplayMetrics = {
  width: number,
  height: number,
  scale: number,
  fontScale: number,
};

export type DimensionsPayload = {
  window?: DisplayMetrics,
  screen?: DisplayMetrics,
  windowPhysicalPixels?: DisplayMetricsAndroid,
  screenPhysicalPixels?: DisplayMetricsAndroid,
};

export type DeviceInfoConstants = {
  +Dimensions: DimensionsPayload,
  +isIPhoneX_deprecated?: boolean,
};

export interface Spec extends TurboModule {
  +getConstants: () => DeviceInfoConstants;
}

const NativeModule: Spec = TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');
let constants: ?DeviceInfoConstants = null;

const NativeDeviceInfo = {
  getConstants(): DeviceInfoConstants {
    if (constants == null) {
      constants = NativeModule.getConstants();
    }
    return constants;
  },
};

export default NativeDeviceInfo;
