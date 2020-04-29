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

<<<<<<< HEAD
type DisplayMetricsAndroid = $ReadOnly<{|
=======
type DisplayMetricsAndroid = {|
>>>>>>> fb/0.62-stable
  width: number,
  height: number,
  scale: number,
  fontScale: number,
  densityDpi: number,
<<<<<<< HEAD
|}>;

export type DisplayMetrics = $ReadOnly<{|
=======
|};

export type DisplayMetrics = {|
>>>>>>> fb/0.62-stable
  width: number,
  height: number,
  scale: number,
  fontScale: number,
<<<<<<< HEAD
|}>;

export type DimensionsPayload = $ReadOnly<{|
=======
|};

export type DimensionsPayload = {|
>>>>>>> fb/0.62-stable
  window?: DisplayMetrics,
  screen?: DisplayMetrics,
  windowPhysicalPixels?: DisplayMetricsAndroid,
  screenPhysicalPixels?: DisplayMetricsAndroid,
<<<<<<< HEAD
|}>;
=======
|};
>>>>>>> fb/0.62-stable

export interface Spec extends TurboModule {
  +getConstants: () => {|
    +Dimensions: DimensionsPayload,
    +isIPhoneX_deprecated?: boolean,
  |};
}

const NativeModule: Spec = TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');

const NativeDeviceInfo = NativeModule;

export default NativeDeviceInfo;
