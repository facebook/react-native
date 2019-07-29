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

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type GenericObject = Object;
type AnotherGenericObject = GenericObject;

export interface Spec extends TurboModule {
  +getGenericObject: (arg: Object) => Object;
  +getGenericObjectWithAlias: (arg: GenericObject) => AnotherGenericObject;
  +getConstants: () => {|
    const1: boolean,
    const2: number,
    const3: string,
  |};
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
