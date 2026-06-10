/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export enum SharedStatusEnum {
  Active = 'active',
  Paused = 'paused',
  Off = 'off',
}

export enum SharedNumEnum {
  One = 1,
  Two = 2,
  Three = 3,
}

export type SharedStateType = {
  status: SharedStatusEnum,
  count: number,
};
