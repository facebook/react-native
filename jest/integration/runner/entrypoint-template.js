/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {SnapshotConfig} from '../runtime/setup';

module.exports = function entrypointTemplate({
  testPath,
  setupModulePath,
  snapshotConfig,
}: {
  testPath: string,
  setupModulePath: string,
  snapshotConfig: SnapshotConfig,
}): string {
  return `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated
 * @noformat
 * @noflow
 * @oncall react_native
 */

import {registerTest} from '${setupModulePath}';

registerTest(() => require('${testPath}'), ${JSON.stringify(snapshotConfig)});
`;
};
