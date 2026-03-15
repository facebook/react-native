/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export enum EnumInt {
  IA = 23,
  IB = 42,
}

export enum EnumNone {
  NA,
  NB,
}

export type ConstantsStruct = {
  const1: boolean,
  const2: number,
  const3: string,
};
