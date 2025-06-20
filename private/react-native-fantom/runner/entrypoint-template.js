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
import type {FantomTestConfig} from './getFantomTestConfigs';

import formatFantomConfig from './formatFantomConfig';

module.exports = function entrypointTemplate({
  testPath,
  setupModulePath,
  featureFlagsModulePath,
  testConfig,
  snapshotConfig,
  isRunningFromCI,
}: {
  testPath: string,
  setupModulePath: string,
  featureFlagsModulePath: string,
  testConfig: FantomTestConfig,
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
import {setConstants} from '@react-native/fantom/src/Constants';

${
  Object.keys(testConfig.flags.jsOnly).length > 0
    ? `import * as ReactNativeFeatureFlags from '${featureFlagsModulePath}';

ReactNativeFeatureFlags.override({
${Object.entries(testConfig.flags.jsOnly)
  .map(([name, value]) => `  ${name}: () => ${JSON.stringify(value)},`)
  .join('\n')}
});`
    : ''
}
${
  Object.keys(testConfig.flags.reactInternal).length > 0
    ? `import ReactNativeInternalFeatureFlags from 'ReactNativeInternalFeatureFlags';
  ${Object.entries(testConfig.flags.reactInternal)
    .map(
      ([name, value]) =>
        `ReactNativeInternalFeatureFlags.${name} = ${JSON.stringify(value)};`,
    )
    .join('\n')}`
    : ''
}

setConstants({
  isRunningFromCI: ${String(isRunningFromCI)},
  fantomConfigSummary: '${formatFantomConfig(testConfig)}',
});

registerTest(() => require('${testPath}'), ${JSON.stringify(snapshotConfig)});
`;
};
