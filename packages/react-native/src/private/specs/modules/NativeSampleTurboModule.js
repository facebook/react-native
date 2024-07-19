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
} from '../../../../Libraries/TurboModule/RCTExport';
import type {
  EventEmitter,
  UnsafeObject,
} from '../../../../Libraries/Types/CodegenTypes';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export enum EnumInt {
  A = 23,
  B = 42,
}

export type ObjectStruct = {
  a: number,
  b: string,
  c?: ?string,
};

export interface Spec extends TurboModule {
  +onPress: EventEmitter<void>;
  +onClick: EventEmitter<string>;
  +onChange: EventEmitter<ObjectStruct>;
  +onSubmit: EventEmitter<ObjectStruct[]>;
  // Exported methods.
  +getConstants: () => {|
    const1: boolean,
    const2: number,
    const3: string,
  |};
  +voidFunc: () => void;
  +getBool: (arg: boolean) => boolean;
  +getEnum?: (arg: EnumInt) => EnumInt;
  +getNumber: (arg: number) => number;
  +getString: (arg: string) => string;
  +getArray: (arg: Array<any>) => Array<any>;
  +getObject: (arg: Object) => Object;
  +getUnsafeObject: (arg: UnsafeObject) => UnsafeObject;
  +getRootTag: (arg: RootTag) => RootTag;
  +getValue: (x: number, y: string, z: Object) => Object;
  +getValueWithCallback: (callback: (value: string) => void) => void;
  +getValueWithPromise: (error: boolean) => Promise<string>;
  +voidFuncThrows?: () => void;
  +getObjectThrows?: (arg: Object) => Object;
  +promiseThrows?: () => Promise<void>;
  +voidFuncAssert?: () => void;
  +getObjectAssert?: (arg: Object) => Object;
  +promiseAssert?: () => Promise<void>;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
): Spec);
