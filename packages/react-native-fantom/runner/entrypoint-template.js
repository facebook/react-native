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

import type {SnapshotConfig} from '../runtime/snapshotContext';
import type {FantomTestConfigJsOnlyFeatureFlags} from './getFantomTestConfig';

module.exports = function entrypointTemplate({
  testPath,
  setupModulePath,
  featureFlagsModulePath,
  featureFlags,
  snapshotConfig,
}: {
  testPath: string,
  setupModulePath: string,
  featureFlagsModulePath: string,
  featureFlags: FantomTestConfigJsOnlyFeatureFlags,
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
${
  Object.keys(featureFlags).length > 0
    ? `import * as ReactNativeFeatureFlags from '${featureFlagsModulePath}';

ReactNativeFeatureFlags.override({
${Object.entries(featureFlags)
  .map(([name, value]) => `  ${name}: () => ${JSON.stringify(value)},`)
  .join('\n')}
});`
    : ''
}

registerTest(() => require('${testPath}'), ${JSON.stringify(snapshotConfig)});
`;
};
