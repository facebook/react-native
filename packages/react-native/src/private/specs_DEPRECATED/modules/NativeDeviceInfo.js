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
  +isEdgeToEdge?: boolean,
  +isIPhoneX_deprecated?: boolean,
};

export interface Spec extends TurboModule {
  +getConstants: () => DeviceInfoConstants;
}

const NativeModule: Spec = TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');

const NativeDeviceInfo = {
  /**
   * Please note that on iOS, if the application is using SceneDelegate, the dimensions
   * may not be constant, in which case calling this method returns the dimensions valid
   * at the time of invocation.
   * @deprecated Use `NativeDeviceInfo.getInfo()` instead; this method will be removed in a future version of React Native.
   * @returns {DeviceInfoConstants} the dimensions at the moment of invocation
   */
  getConstants(): DeviceInfoConstants {
    return NativeModule.getConstants();
  },
  getInfo(): DeviceInfoConstants {
    return NativeModule.getConstants();
  },
};

export default NativeDeviceInfo;
