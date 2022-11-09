/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';

import {TurboModuleRegistry} from 'react-native';

/** Flow enum support will be added when the sun rises in the west
export enum EnumInt {
  A = 23,
  B = 42,
}
*/

export type UnionFloat = 1.44 | 2.88 | 5.76;
export type UnionString = 'One' | 'Two' | 'Three';
export type UnionObject = {value: number} | {low: string};

export type ObjectStruct = $ReadOnly<{
  a: number,
  b: string,
  c?: ?string,
}>;

export type ValueStruct = $ReadOnly<{
  x: number,
  y: string,
  z: ObjectStruct,
}>;

export interface Spec extends TurboModule {
  +getArray: (arg: Array<ObjectStruct | null>) => Array<ObjectStruct | null>;
  +getBool: (arg: boolean) => boolean;
  +getConstants: () => {|
    const1: boolean,
    const2: number,
    const3: string,
  |};
  +getEnum: (arg: number /*EnumInt*/) => number /*EnumInt*/;
  +getMap: (arg: {[key: string]: ?number}) => {[key: string]: ?number};
  +getNumber: (arg: number) => number;
  +getObject: (arg: ObjectStruct) => ObjectStruct;
  +getSet: (arg: Array<number>) => Array<number>;
  +getString: (arg: string) => string;
  +getUnion: (x: UnionFloat, y: UnionString, z: UnionObject) => string;
  +getValue: (x: number, y: string, z: ObjectStruct) => ObjectStruct;
  +getValueWithCallback: (callback: (value: string) => void) => void;
  +getValueWithPromise: (error: boolean) => Promise<string>;
  +voidFunc: () => void;
}

export default (TurboModuleRegistry.get<Spec>(
  'NativeCxxModuleExampleCxx',
): ?Spec);
