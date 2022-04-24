/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  RootTag,
  TurboModule,
} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

type Animal = {|
  name: string,
|};

export interface Spec extends TurboModule {
  // Exported methods.
  +getConstants: () => {|
    const1: Array<boolean>,
    const2: Array<number>,
    const3: Array<string>,
    id?: Array<?{|prop: number|}>,
  |};
  +voidFunc: () => void;
  +getBool: (id: Array<boolean>) => Array<boolean>;
  +getNumber: (arg: Array<number>) => Array<number>;
  +getString: (arg: Array<string>) => Array<string>;
  +getArray: (arg: Array<Array<any>>) => Array<Array<any>>;
  +getObject: (arg: Array<Object>) => Array<Object>;
  +getObjectShape: (arg: Array<{|prop: number|}>) => Array<{|prop: number|}>;
  +getAlias: (arg: Array<Animal>) => Array<Animal>;
  +getRootTag: (arg: Array<RootTag>) => Array<RootTag>;
  +getValue: (
    x: Array<number>,
    y: Array<string>,
    z: Array<Object>,
  ) => Array<Object>;
  +getValueWithCallback: (callback: (value: Array<string>) => void) => void;
  +getValueWithPromise: (error: Array<boolean>) => Promise<Array<string>>;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleArrays',
): Spec);
