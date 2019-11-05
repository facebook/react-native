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

import {TurboModuleRegistry, type TurboModule} from 'react-native';

type DisplayMetricsAndroid = {|
  width: number,
  height: number,
  scale: number,
  fontScale: number,
  densityDpi: number,
|};

export type DisplayMetrics = {|
  width: number,
  height: number,
  scale: number,
  fontScale: number,
|};

export type DimensionsPayload = {|
  window?: DisplayMetrics,
  screen?: DisplayMetrics,
  windowPhysicalPixels?: DisplayMetricsAndroid,
  screenPhysicalPixels?: DisplayMetricsAndroid,
|};

export interface Spec extends TurboModule {
  +getConstants: () => {|
    +Dimensions: DimensionsPayload,
    +isIPhoneX_deprecated?: boolean,
  |};
}

const NativeModule: Spec = TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');

const NativeDeviceInfo = NativeModule;

export default NativeDeviceInfo;
