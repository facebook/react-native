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

const fastGlob = require('fast-glob');
const {getDefaultConfig: getBaseConfig, mergeConfig} = require('metro-config');
const fs = require('node:fs');
const path = require('node:path');

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
 * Resolves the root of an NPM or Yarn workspace, by traversing the file tree upwards from a `candidatePath` in the search for
 * - a directory with a package.json
 * - which has a `workspaces` array of strings
 * - which (possibly via a glob) includes the project root
 * @param {string} projectRoot Project root to find a workspace root for
 * @param {string | undefined} candidatePath Current path to search from
 * @returns Path of a workspace root or `undefined`
 */
function getWorkspaceRoot(projectRoot, candidatePath = projectRoot) {
  const packageJsonPath = path.resolve(candidatePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const { workspaces } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (Array.isArray(workspaces)) {
        // If one of the workspaces match the project root, this is the workspace root
        // Note: While NPM workspaces doesn't currently support globs, Yarn does.
        const matches = fastGlob.sync(workspaces, {
          cwd: candidatePath,
          onlyDirectories: true,
          absolute: true,
        });
        if (matches.includes(projectRoot)) {
          return candidatePath;
        }
      }
    } catch (err) {
      console.warn(`Failed reading or parsing ${packageJsonPath}:`, err);
    }
  }
  // Try one level up
  const parentDir = path.dirname(candidatePath);
  if (parentDir !== candidatePath) {
    return getWorkspaceRoot(projectRoot, parentDir);
  } else {
    return undefined;
  }
}

/**
 * Determine the watch folders
 */
function getWatchFolders(projectRoot) {
  const workspaceRoot = getWorkspaceRoot(projectRoot);
  return workspaceRoot ? [workspaceRoot] : [];
}

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
    watchFolders: getWatchFolders(projectRoot),
  };

  // Set global hook so that the CLI can detect when this config has been loaded
  global.__REACT_NATIVE_METRO_CONFIG_LOADED = true;

  return mergeConfig(
    getBaseConfig.getDefaultValues(projectRoot),
    config,
  );
}

module.exports = {getDefaultConfig, mergeConfig};
