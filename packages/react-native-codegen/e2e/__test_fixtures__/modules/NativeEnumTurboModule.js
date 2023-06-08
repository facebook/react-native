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
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type StateType = {|
  state: string,
|};

export enum StatusRegularEnum {
  Active,
  Paused,
  Off,
}

export enum StatusStrEnum {
  Active = 'active',
  Paused = 'paused',
  Off = 'off',
}

export enum StatusNumEnum {
  Active = 2,
  Paused = 1,
  Off = 0,
}

export enum StatusFractionEnum {
  Active = 0.2,
  Paused = 0.1,
  Off = 0.0,
}

export type StateTypeWithEnums = {|
  state: string,
  regular: StatusRegularEnum,
  str: StatusStrEnum,
  num: StatusNumEnum,
  fraction: StatusFractionEnum,
|};

export interface Spec extends TurboModule {
  +getStatusRegular: (statusProp: StateType) => StatusRegularEnum;
  +getStatusStr: (statusProp: StateType) => StatusStrEnum;
  +getStatusNum: (statusProp: StateType) => StatusNumEnum;
  +getStatusFraction: (statusProp: StateType) => StatusFractionEnum;
  +getStateType: (
    a: StatusRegularEnum,
    b: StatusStrEnum,
    c: StatusNumEnum,
    d: StatusFractionEnum,
  ) => StateType;
  +getStateTypeWithEnums: (
    paramOfTypeWithEnums: StateTypeWithEnums,
  ) => StateTypeWithEnums;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'NativeEnumTurboModule',
): Spec);
