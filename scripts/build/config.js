/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

/*::
import type {BabelCoreOptions} from '@babel/core';
*/

const {ModuleResolutionKind} = require('typescript');

/*::
export type BuildOptions = $ReadOnly<{
  // The target runtime to compile for.
  target: 'node',

  // Whether to emit Flow definition files (.js.flow) (default: true).
  emitFlowDefs?: boolean,

  // Whether to emit TypeScript definition files (.d.ts) (default: false).
  emitTypeScriptDefs?: boolean,
}>;

export type BuildConfig = $ReadOnly<{
  // The packages to include for build and their build options.
  packages: $ReadOnly<{[packageName: string]: BuildOptions}>,
}>;
*/

/**
 * - BUILD CONFIG -
 *
 * Add packages here to configure them as part of the monorepo `yarn build`
 * setup. These must use a consistent package structure and (today) target
 * Node.js packages only.
 */
const buildConfig /*: BuildConfig */ = {
  packages: {
    'community-cli-plugin': {
      target: 'node',
    },
    'dev-middleware': {
      target: 'node',
      emitTypeScriptDefs: true,
    },
    'react-native-codegen': {
      target: 'node',
    },
  },
};

const defaultBuildOptions = {
  emitFlowDefs: true,
  emitTypeScriptDefs: false,
};

function getBuildOptions(
  packageName /*: $Keys<BuildConfig['packages']> */,
) /*: Required<BuildOptions> */ {
  return {
    ...defaultBuildOptions,
    ...buildConfig.packages[packageName],
  };
}

function getBabelConfig(
  packageName /*: $Keys<BuildConfig['packages']> */,
) /*: BabelCoreOptions */ {
  const {target} = getBuildOptions(packageName);

  switch (target) {
    case 'node':
      return require('./babel/node.config.js');
  }
}

function getTypeScriptCompilerOptions(
  packageName /*: $Keys<BuildConfig['packages']> */,
) /*: Object */ {
  const {target} = getBuildOptions(packageName);

  switch (target) {
    case 'node':
      return {
        ...require('@tsconfig/node18/tsconfig.json').compilerOptions,
        moduleResolution: ModuleResolutionKind.NodeJs,
      };
  }
}

module.exports = {
  buildConfig,
  getBabelConfig,
  getBuildOptions,
  getTypeScriptCompilerOptions,
};
