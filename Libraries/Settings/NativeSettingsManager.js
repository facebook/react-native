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

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    settings: {[key: string]: string | boolean | number},
  |};
  +setValues: (values: {+[key: string]: string | boolean | number}) => void;
  +deleteValues: (values: Array<string>) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SettingsManager');
