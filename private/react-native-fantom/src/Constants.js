/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

type FantomConstants = $ReadOnly<{
  isRunningFromCI: boolean,
  fantomConfigSummary: string,
}>;

let constants: FantomConstants = {
  isRunningFromCI: false,
  fantomConfigSummary: '',
};

export function getConstants(): FantomConstants {
  return constants;
}

export function setConstants(newConstants: FantomConstants): void {
  constants = newConstants;
}
