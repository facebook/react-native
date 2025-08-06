/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import path from 'path';

export const OUTPUT_PATH: string = path.resolve(__dirname, '..', '.out');
export const JS_BUILD_OUTPUT_PATH: string = path.join(OUTPUT_PATH, 'js-builds');
export const NATIVE_BUILD_OUTPUT_PATH: string = path.join(
  OUTPUT_PATH,
  'native-builds',
);
export const JS_TRACES_OUTPUT_PATH: string = path.join(
  OUTPUT_PATH,
  'js-traces',
);

export function getTestBuildOutputPath(): string {
  const fantomRunID = process.env.__FANTOM_RUN_ID__;
  if (fantomRunID == null) {
    throw new Error(
      'Expected Fantom run ID to be set by global setup, but it was not (process.env.__FANTOM_RUN_ID__ is null)',
    );
  }

  return path.join(JS_BUILD_OUTPUT_PATH, fantomRunID);
}
