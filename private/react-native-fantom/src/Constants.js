/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export type FantomRuntimeConstants = $ReadOnly<{
  isRunningFromCI: boolean,
  forceTestModeForBenchmarks: boolean,
  fantomConfigSummary: string,
  jsTraceOutputPath: ?string,
}>;

let constants: FantomRuntimeConstants = {
  isRunningFromCI: false,
  forceTestModeForBenchmarks: false,
  fantomConfigSummary: '',
  jsTraceOutputPath: null,
};

export function getConstants(): FantomRuntimeConstants {
  return constants;
}

export function setConstants(newConstants: FantomRuntimeConstants): void {
  constants = newConstants;
}
