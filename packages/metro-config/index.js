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
    '/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/Libraries/Core/.+\\.js$',
    '/Libraries/LogBox/.+\\.js$',
    '/Libraries/Network/.+\\.js$',
    '/Libraries/Pressability/.+\\.js$',
    '/Libraries/Renderer/implementations/.+\\.js$',
    '/Libraries/Utilities/.+\\.js$',
    '/Libraries/vendor/.+\\.js$',
    '/Libraries/WebSocket/.+\\.js$',
    '/Libraries/YellowBox/.+\\.js$',
    '/metro-runtime/.+\\.js$',
    '/node_modules/@babel/runtime/.+\\.js$',
    '/node_modules/event-target-shim/.+\\.js$',
    '/node_modules/invariant/.+\\.js$',
    '/node_modules/react-devtools-core/.+\\.js$',
    '/node_modules/react-native/index.js$',
    '/node_modules/react-refresh/.+\\.js$',
    '/node_modules/scheduler/.+\\.js$',
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
      // Note: This option is overridden in cli-plugin-metro (getOverrideConfig)
      getModulesRunBeforeMainModule: () => [
        require.resolve('react-native/Libraries/Core/InitializeCore'),
      ],
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
        '@react-native/metro-babel-transformer',
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

  // Set global hook so that the CLI can detect when this config has been loaded
  global.__REACT_NATIVE_METRO_CONFIG_LOADED = true;

  return mergeConfig(
    getBaseConfig.getDefaultValues(projectRoot),
    config,
  );
}

module.exports = {getDefaultConfig, mergeConfig};
