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

/**
 * @deprecated Use DeviceInfoResults instead; this will be removed in a future version of React Native.
 */
export type DeviceInfoConstants = DeviceInfoResults;

export type DeviceInfoResults = {
  +Dimensions: DimensionsPayload,
  +isEdgeToEdge?: boolean,
  +isIPhoneX_deprecated?: boolean,
};

export interface Spec extends TurboModule {
  +getConstants: () => DeviceInfoConstants;
  +getInfo: () => DeviceInfoConstants;
}

const NativeModule: Spec = TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');

const NativeDeviceInfo = {
  /**
   * Please note that on iOS, if the application is using SceneDelegate, the dimensions
   * are not constant and may change, in which case calling this method will provide updated data.
   * @deprecated Use getInfo() instead; this method will be removed in a future version of React Native.
   */
  getConstants(): DeviceInfoConstants {
    return NativeModule.getConstants();
  },
  getInfo(): DeviceInfoResults {
    return NativeModule.getInfo();
  },
};

export default NativeDeviceInfo;
