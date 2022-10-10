/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';

import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

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
