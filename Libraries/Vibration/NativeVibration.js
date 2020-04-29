/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
<<<<<<< HEAD
 * @flow
=======
 * @flow strict-local
>>>>>>> fb/0.62-stable
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {||};
<<<<<<< HEAD
  +vibrate: (pattern?: number) => void;
=======
  +vibrate: (pattern: number) => void;
>>>>>>> fb/0.62-stable

  // Android only
  +vibrateByPattern: (pattern: Array<number>, repeat: number) => void;
  +cancel: () => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>('Vibration'): Spec);
