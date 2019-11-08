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
  +setExtraData: (extraData: Object, forIdentifier: string) => void;
  +dismiss: () => void;
}

export default (TurboModuleRegistry.get<Spec>('RedBox'): ?Spec);
