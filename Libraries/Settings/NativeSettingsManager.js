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

export interface Spec extends TurboModule {
  +getConstants: () => {|
    settings: Object,
  |};
  +setValues: (values: Object) => void;
  +deleteValues: (values: Array<string>) => void;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SettingsManager',
): Spec);
