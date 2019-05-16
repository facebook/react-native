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
  +getCurrentBoldTextState: (
    resolve: (isBoldTextEnabled: boolean) => void,
    reject: (error: Object) => void,
  ) => void;
  +getCurrentGrayscaleState: (
    resolve: (isGrayscaleEnabled: boolean) => void,
    reject: (error: Object) => void,
  ) => void;
  +getCurrentInvertColorsState: (
    resolve: (isInvertColorsEnabled: boolean) => void,
    reject: (error: Object) => void,
  ) => void;
  +getCurrentReduceMotionState: (
    resolve: (isReduceMotionEnabled: boolean) => void,
    reject: (error: Object) => void,
  ) => void;
  +getCurrentReduceTransparencyState: (
    resolve: (isReduceTransparencyEnabled: boolean) => void,
    reject: (error: Object) => void,
  ) => void;
  +getCurrentVoiceOverState: (
    resolve: (isScreenReaderEnabled: boolean) => void,
    reject: (error: Object) => void,
  ) => void;
  +setAccessibilityFocus: (reactTag: number) => void;
  +announceForAccessibility: (announcement: string) => void;

  // RCTDeviceEventEmitter
  +addListener: (eventName: string, handler: Function) => Object;
  +removeListeners: (eventName: string, handler: Function) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AccessibilityManager');
