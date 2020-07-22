/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +show: () => void;
  +reload: () => void;
  +debugRemotely: (enableDebug: boolean) => void;
  +setProfilingEnabled: (enabled: boolean) => void;
  +setHotLoadingEnabled: (enabled: boolean) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>('DevMenu'): Spec);
