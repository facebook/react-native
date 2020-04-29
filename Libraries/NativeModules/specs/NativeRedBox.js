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
<<<<<<< HEAD
  +setExtraData: (extraData: Object, identifier: string) => void;
=======
  +setExtraData: (extraData: Object, forIdentifier: string) => void;
>>>>>>> fb/0.62-stable
  +dismiss: () => void;
}

export default (TurboModuleRegistry.get<Spec>('RedBox'): ?Spec);
