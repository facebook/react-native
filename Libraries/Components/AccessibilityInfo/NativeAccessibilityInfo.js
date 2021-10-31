/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';
import type {AccessibilityServiceInfo} from './AccessibilityInfoTypes';

export interface Spec extends TurboModule {
  +isReduceMotionEnabled: (
    onSuccess: (isReduceMotionEnabled: boolean) => void,
  ) => void;
  +isTouchExplorationEnabled: (
    onSuccess: (isScreenReaderEnabled: boolean) => void,
  ) => void;
  +isAccessibilityServiceEnabled?: ?(
    onSuccess: (isAccessibilityServiceEnabled: boolean) => void,
  ) => void;
  +setAccessibilityFocus: (reactTag: number) => void;
  +announceForAccessibility: (announcement: string) => void;
  +getRecommendedTimeoutMillis?: (
    mSec: number,
    onSuccess: (recommendedTimeoutMillis: number) => void,
  ) => void;
  +getEnabledAccessibilityServiceList?: (
    feedbackTypeFlags: number,
    onSuccess: (
      enabledAccessibilityServiceList: Array<AccessibilityServiceInfo>,
    ) => void,
  ) => void;
}

export default (TurboModuleRegistry.get<Spec>('AccessibilityInfo'): ?Spec);
