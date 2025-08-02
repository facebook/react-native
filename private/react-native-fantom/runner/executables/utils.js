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

const BUILD_OUTPUT_ROOT = path.resolve(
  __dirname,
  '..',
  '..',
  'build',
  'native',
);

export function getNativeBuildOutputPath(): string {
  return BUILD_OUTPUT_ROOT;
}
