/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

/**
 * Native Module used for playing sounds in native platform.
 */
export interface Spec extends TurboModule {
  +playTouchSound: () => void;
}

export default (TurboModuleRegistry.get<Spec>('SoundManager'): ?Spec);
