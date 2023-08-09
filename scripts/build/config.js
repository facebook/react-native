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

export type BuildOptions = $ReadOnly<{
  target: 'node',
}>;

export type BuildConfig = $ReadOnly<{
  packages: $ReadOnly<{[packageName: string]: BuildOptions}>,
}>;
*/

const TARGET_NODE_VERSION = '18';

const buildConfig /*: BuildConfig */ = {
  // The packages to include for build and their build options
  packages: {
    'dev-middleware': {target: 'node'},
  },
};

function getBabelConfig(
  packageName /*: $Keys<BuildConfig['packages']> */,
) /*: BabelCoreOptions */ {
  const {target} = buildConfig.packages[packageName];

  switch (target) {
    case 'node':
      return {
        presets: [
          '@babel/preset-flow',
          [
            '@babel/preset-env',
            {
              targets: {
                node: TARGET_NODE_VERSION,
              },
            },
          ],
        ],
        plugins: [
          [
            'transform-define',
            {
              'process.env.BUILD_EXCLUDE_BABEL_REGISTER': true,
            },
          ],
          [
            'minify-dead-code-elimination',
            {keepFnName: true, keepFnArgs: true, keepClassName: true},
          ],
        ],
      };
  }
}

module.exports = {
  buildConfig,
  getBabelConfig,
};
