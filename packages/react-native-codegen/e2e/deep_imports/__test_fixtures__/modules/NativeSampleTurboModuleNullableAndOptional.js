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

type Animal = ?{
  name?: ?string,
};

export interface Spec extends TurboModule {
  // Exported methods.
  +getConstants?: () => {
    const1?: ?boolean,
    const2?: ?number,
    const3?: ?string,
  };
  +voidFunc?: () => void;
  +getBool?: (arg?: ?boolean) => ?boolean;
  +getNumber?: (arg?: ?number) => ?number;
  +getString?: (arg?: ?string) => ?string;
  +getArray?: (arg?: ?Array<any>) => ?Array<any>;
  +getObject?: (arg?: ?Object) => ?Object;
  +getObjectShape?: (arg?: {prop?: ?number}) => {prop?: ?number};
  +getAlias?: (arg?: ?Animal) => ?Animal;
  +getRootTag?: (arg?: ?RootTag) => ?RootTag;
  +getValue?: (x?: ?number, y?: ?string, z?: ?Object) => ?Object;
  +getValueWithCallback?: (callback?: ?(value?: ?string) => void) => void;
  +getValueWithPromise?: (error?: ?boolean) => ?Promise<string>;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleNullableAndOptional',
): Spec);
