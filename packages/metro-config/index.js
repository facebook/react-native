/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @noformat
 */

/*:: import type {ConfigT} from 'metro-config'; */

const {getDefaultConfig: getBaseConfig, mergeConfig} = require('metro-config');

const INTERNAL_CALLSITES_REGEX = new RegExp(
  [
    '/Libraries/Renderer/implementations/.+\\.js$',
    '/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/Libraries/YellowBox/.+\\.js$',
    '/Libraries/LogBox/.+\\.js$',
    '/Libraries/Core/Timers/.+\\.js$',
    '/Libraries/WebSocket/.+\\.js$',
    '/Libraries/vendor/.+\\.js$',
    '/node_modules/react-devtools-core/.+\\.js$',
    '/node_modules/react-refresh/.+\\.js$',
    '/node_modules/scheduler/.+\\.js$',
    '/node_modules/event-target-shim/.+\\.js$',
    '/node_modules/invariant/.+\\.js$',
    '/node_modules/react-native/index.js$',
    '/metro-runtime/.+\\.js$',
    '^\\[native code\\]$',
  ].join('|'),
);

/**
 * Get the base Metro configuration for a React Native project.
 */

function getDefaultConfig(
  projectRoot /*: string */
) /*: ConfigT */ {
  const config = {
    resolver: {
      resolverMainFields: ['react-native', 'browser', 'main'],
      platforms: ['android', 'ios'],
      unstable_conditionNames: ['require', 'import', 'react-native'],
    },
    serializer: {
      getPolyfills: () => require('@react-native/js-polyfills')(),
    },
    server: {
      port: Number(process.env.RCT_METRO_PORT) || 8081,
    },
    symbolicator: {
      customizeFrame: (frame /*: $ReadOnly<{file: ?string, ...}>*/) => {
        const collapse = Boolean(
          frame.file && INTERNAL_CALLSITES_REGEX.test(frame.file),
        );
        return {collapse};
      },
    },
    transformer: {
      allowOptionalDependencies: true,
      assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
      asyncRequireModulePath: require.resolve(
        'metro-runtime/src/modules/asyncRequire',
      ),
      babelTransformerPath: require.resolve(
        'metro-react-native-babel-transformer',
      ),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    watchFolders: [],
  };

  return mergeConfig(
    getBaseConfig.getDefaultValues(projectRoot),
    config,
  );
}

module.exports = {getDefaultConfig, mergeConfig};
