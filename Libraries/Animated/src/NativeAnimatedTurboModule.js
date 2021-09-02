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

import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';
import {Spec} from './NativeAnimatedModule';

export default (TurboModuleRegistry.get<Spec>(
  'NativeAnimatedTurboModule',
): ?Spec);
