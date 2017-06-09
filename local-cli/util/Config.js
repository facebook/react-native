/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const findSymlinksPaths = require('./findSymlinksPaths');

const blacklist = require('../../packager/blacklist');
const fs = require('fs');
const invariant = require('fbjs/lib/invariant');
const path = require('path');

const {providesModuleNodeModules} = require('../../packager/defaults');

const RN_CLI_CONFIG = 'rn-cli.config.js';

import type {GetTransformOptions, PostMinifyProcess, PostProcessModules} from '../../packager/src/Bundler';
import type {HasteImpl} from '../../packager/src/node-haste/Module';
import type {TransformVariants} from '../../packager/src/ModuleGraph/types.flow';

/**
 * Configuration file of the CLI.
 */
export type ConfigT = {
  extraNodeModules: {[id: string]: string},
  /**
   * Specify any additional asset file extensions to be used by the packager.
   * For example, if you want to include a .ttf file, you would return ['ttf']
   * from here and use `require('./fonts/example.ttf')` inside your app.
   */
  getAssetExts: () => Array<string>,

  /**
   * Returns a regular expression for modules that should be ignored by the
   * packager on a given platform.
   */
  getBlacklistRE(): RegExp,

  /**
   * Specify any additional platforms to be used by the packager.
   * For example, if you want to add a "custom" platform, and use modules
   * ending in .custom.js, you would return ['custom'] here.
   */
  getPlatforms: () => Array<string>,

  getProjectRoots(): Array<string>,

  /**
   * Specify any additional node modules that should be processed for
   * providesModule declarations.
   */
  getProvidesModuleNodeModules?: () => Array<string>,

  /**
   * Specify any additional source file extensions to be used by the packager.
   * For example, if you want to include a .ts file, you would return ['ts']
   * from here and use `require('./module/example')` to require the file with
   * path 'module/example.ts' inside your app.
   */
  getSourceExts: () => Array<string>,

  /**
   * Returns the path to a custom transformer. This can also be overridden
   * with the --transformer commandline argument.
   */
  getTransformModulePath: () => string,
  getTransformOptions: GetTransformOptions,

  /**
   * An optional function that can modify the code and source map of bundle
   * after the minifaction took place.
   */
  postMinifyProcess: PostMinifyProcess,

  /**
   * An optional function that can modify the module array before the bundle is
   * finalized.
   */
  postProcessModules: PostProcessModules,

  /**
   * A module that exports:
   * - a `getHasteName(filePath)` method that returns `hasteName` for module at
   *  `filePath`, or undefined if `filePath` is not a haste module.
   */
  hasteImpl?: HasteImpl,

  transformVariants: () => TransformVariants,
};

function getProjectPath() {
  if (__dirname.match(/node_modules[\/\\]react-native[\/\\]local-cli[\/\\]util$/)) {
    // Packager is running from node_modules.
    // This is the default case for all projects created using 'react-native init'.
    return path.resolve(__dirname, '../../../..');
  } else if (__dirname.match(/Pods[\/\\]React[\/\\]packager$/)) {
    // React Native was installed using CocoaPods.
    return path.resolve(__dirname, '../../../..');
  }
  return path.resolve(__dirname, '../..');
}

const resolveSymlink = (roots) =>
  roots.concat(
    findSymlinksPaths(
      path.join(getProjectPath(), 'node_modules'),
      roots
    )
  );

const defaultConfig: ConfigT = {
  extraNodeModules: Object.create(null),
  getAssetExts: () => [],
  getBlacklistRE: () => blacklist(),
  getPlatforms: () => [],
  getProjectRoots: () => {
    const root = process.env.REACT_NATIVE_APP_ROOT;
    if (root) {
      return resolveSymlink([path.resolve(root)]);
    }
    return resolveSymlink([getProjectPath()]);
  },
  getProvidesModuleNodeModules: () => providesModuleNodeModules.slice(),
  getSourceExts: () => [],
  getTransformModulePath: () => path.resolve(__dirname, '../../packager/transformer'),
  getTransformOptions: async () => ({}),
  postMinifyProcess: x => x,
  postProcessModules: modules => modules,
  transformVariants: () => ({default: {}}),
};

/**
 * Module capable of getting the configuration out of a given file.
 *
 * The function will return all the default configuration, as specified by the
 * `defaultConfig` param overriden by those found on `rn-cli.config.js` files, if any. If no
 * default config is provided and no configuration can be found in the directory
 * hierarchy, an error will be thrown.
 */
const Config = {
  find(startDir: string): ConfigT {
    const configPath = findConfigPath(startDir);
    invariant(
      configPath,
      `Can't find "${RN_CLI_CONFIG}" file in any parent folder of "${startDir}"`,
    );
    return this.loadFile(configPath, startDir);
  },

  findOptional(startDir: string): ConfigT {
    const configPath = findConfigPath(startDir);
    return configPath
      ? this.loadFile(configPath, startDir)
      : {...defaultConfig};
  },

  loadFile(pathToConfig: string): ConfigT {
    //$FlowFixMe: necessary dynamic require
    const config: {} = require(pathToConfig);
    return {...defaultConfig, ...config};
  },
};

function findConfigPath(cwd: string): ?string {
  const parentDir = findParentDirectory(cwd, RN_CLI_CONFIG);
  return parentDir ? path.join(parentDir, RN_CLI_CONFIG) : null;
}

// Finds the most near ancestor starting at `currentFullPath` that has
// a file named `filename`
function findParentDirectory(currentFullPath, filename) {
  const root = path.parse(currentFullPath).root;
  const testDir = (parts) => {
    if (parts.length === 0) {
      return null;
    }

    const fullPath = path.join(root, parts.join(path.sep));

    var exists = fs.existsSync(path.join(fullPath, filename));
    return exists ? fullPath : testDir(parts.slice(0, -1));
  };

  return testDir(currentFullPath.substring(root.length).split(path.sep));
}

module.exports = Config;
