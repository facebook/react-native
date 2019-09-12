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

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +isReduceMotionEnabled: (
    onSuccess: (isReduceMotionEnabled: boolean) => void,
  ) => void;
  +isTouchExplorationEnabled: (
    onSuccess: (isScreenReaderEnabled: boolean) => void,
  ) => void;
  +setAccessibilityFocus: (reactTag: number) => void;
  +announceForAccessibility: (announcement: string) => void;
}

export default (TurboModuleRegistry.get<Spec>('AccessibilityInfo'): ?Spec);
