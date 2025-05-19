/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {SnapshotConfig} from '../runtime/snapshotContext';
import type {
  FantomTestConfigJsOnlyFeatureFlags,
  FantomTestConfigReactInternalFeatureFlags,
} from './getFantomTestConfig';

module.exports = function entrypointTemplate({
  testPath,
  setupModulePath,
  featureFlagsModulePath,
  featureFlags,
  reactInternalFeatureFlags,
  snapshotConfig,
  isRunningFromCI,
}: {
  testPath: string,
  setupModulePath: string,
  featureFlagsModulePath: string,
  featureFlags: FantomTestConfigJsOnlyFeatureFlags,
  reactInternalFeatureFlags: FantomTestConfigReactInternalFeatureFlags,
  snapshotConfig: SnapshotConfig,
  isRunningFromCI: boolean,
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
 */

import {registerTest} from '${setupModulePath}';
import {setConstants} from '@react-native/fantom';
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
${
  Object.keys(reactInternalFeatureFlags).length > 0
    ? `import ReactNativeInternalFeatureFlags from 'ReactNativeInternalFeatureFlags';
  ${Object.entries(reactInternalFeatureFlags)
    .map(
      ([name, value]) =>
        `ReactNativeInternalFeatureFlags.${name} = ${JSON.stringify(value)};`,
    )
    .join('\n')}`
    : ''
}

setConstants({
  isRunningFromCI: ${String(isRunningFromCI)},
});

registerTest(() => require('${testPath}'), ${JSON.stringify(snapshotConfig)});
`;
};
