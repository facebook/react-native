/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodegenTypes, TurboModule} from 'react-native';

import {TurboModuleRegistry} from 'react-native';

export enum EnumInt {
  IA = 23,
  IB = 42,
}

export enum EnumNone {
  NA,
  NB,
}

export enum EnumStr {
  SA = 's---a',
  SB = 's---b',
}

export type UnionFloat = 1.44 | 2.88 | 5.76;
export type UnionString = 'One' | 'Two' | 'Three';
export type UnionObject = {value: number} | {low: string};

export type ConstantsStruct = {
  const1: boolean,
  const2: number,
  const3: string,
};

export type ObjectStruct = {
  a: number,
  b: string,
  c?: ?string,
};

export type ValueStruct = {
  x: number,
  y: string,
  z: ObjectStruct,
};

export type CustomHostObject = {};

export type BinaryTreeNode = {
  left?: BinaryTreeNode,
  value: number,
  right?: BinaryTreeNode,
};

export type GraphNode = {
  label: string,
  neighbors?: Array<GraphNode>,
};

export type MenuItem = {
  label: string,
  onPress: (value: string, flag: boolean) => void,
  shortcut?: ?string,
  items?: Array<MenuItem>,
};

export type CustomDeviceEvent = {
  type: string,
  level: number,
  degree?: ?number,
};

export interface Spec extends TurboModule {
  +onPress: CodegenTypes.EventEmitter<void>;
  +onClick: CodegenTypes.EventEmitter<string>;
  +onChange: CodegenTypes.EventEmitter<ObjectStruct>;
  +onSubmit: CodegenTypes.EventEmitter<ObjectStruct[]>;
  +onEvent: CodegenTypes.EventEmitter<EnumNone>;
  +getArray: (arg: Array<ObjectStruct | null>) => Array<ObjectStruct | null>;
  +getBool: (arg: boolean) => boolean;
  +getConstants: () => ConstantsStruct;
  +getCustomEnum: (arg: EnumInt) => EnumInt;
  +getCustomHostObject: () => CustomHostObject;
  +consumeCustomHostObject: (customHostObject: CustomHostObject) => string;
  +getBinaryTreeNode: (arg: BinaryTreeNode) => BinaryTreeNode;
  +getGraphNode: (arg: GraphNode) => GraphNode;
  +getNumEnum: (arg: EnumInt) => EnumInt;
  +getStrEnum: (arg: EnumNone) => EnumStr;
  +getMap: (arg: {[key: string]: ?number}) => {[key: string]: ?number};
  +getNumber: (arg: number) => number;
  +getObject: (arg: ObjectStruct) => ObjectStruct;
  +getSet: (arg: Array<number>) => Array<number>;
  +getString: (arg: string) => string;
  +getUnion: (x: UnionFloat, y: UnionString, z: UnionObject) => string;
  +getValue: (x: number, y: string, z: ObjectStruct) => ValueStruct;
  +getValueWithCallback: (callback: (value: string) => void) => void;
  +setValueCallbackWithSubscription: (
    callback: (value: string) => void,
  ) => () => void;
  +getValueWithPromise: (error: boolean) => Promise<string>;
  +getWithWithOptionalArgs: (optionalArg?: boolean) => ?boolean;
  +voidFunc: () => void;
  +voidPromise: () => Promise<void>;
  +setMenu: (menuItem: MenuItem) => void;
  +emitCustomDeviceEvent: (eventName: string) => void;
  +voidFuncThrows: () => void;
  +getObjectThrows: (arg: ObjectStruct) => ObjectStruct;
  +promiseThrows: () => Promise<void>;
  +voidFuncAssert: () => void;
  +getObjectAssert: (arg: ObjectStruct) => ObjectStruct;
  +promiseAssert: () => Promise<void>;
}

export default (TurboModuleRegistry.get<Spec>(
  'NativeCxxModuleExampleCxx',
): ?Spec);
