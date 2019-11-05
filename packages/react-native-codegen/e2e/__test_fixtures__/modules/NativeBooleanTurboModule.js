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

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export type Boolean = boolean;
type AnotherBoolean = Boolean;

export interface Spec extends TurboModule {
  +getBoolean: (arg: boolean) => boolean;
  +getBooleanWithAlias: (arg: Boolean) => AnotherBoolean;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
): Spec);
