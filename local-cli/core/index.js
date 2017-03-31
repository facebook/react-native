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

const Config = require('../util/Config');

const defaultConfig = require('./default.config');
const minimist = require('minimist');

import type {GetTransformOptions} from '../../packager/src/Bundler';
import type {HasteImpl} from '../../packager/src/node-haste/Module';
import type {CommandT} from '../commands';

/**
 * Configuration file of the CLI.
 */
export type ConfigT = {
  extraNodeModules?: { [id: string]: string },
  /**
   * Specify any additional asset extentions to be used by the packager.
   * For example, if you want to include a .ttf file, you would return ['ttf']
   * from here and use `require('./fonts/example.ttf')` inside your app.
   */
  getAssetExts?: () => Array<string>,
  /**
   * Specify any additional platforms to be used by the packager.
   * For example, if you want to add a "custom" platform, and use modules
   * ending in .custom.js, you would return ['custom'] here.
   */
  getPlatforms: () => Array<string>,
  /**
   * Specify any additional node modules that should be processed for
   * providesModule declarations.
   */
  getProvidesModuleNodeModules?: () => Array<string>,
  /**
   * Returns the path to a custom transformer. This can also be overridden
   * with the --transformer commandline argument.
   */
  getTransformModulePath?: () => string,
  getTransformOptions?: GetTransformOptions,
  transformVariants?: () => {[name: string]: Object},
  /**
   * Returns a regular expression for modules that should be ignored by the
   * packager on a given platform.
   */
  getBlacklistRE(): RegExp,
  getProjectRoots(): Array<string>,
  getAssetExts(): Array<string>,
  /**
   * Returns an array of project commands used by the CLI to load
   */
  getProjectCommands(): Array<CommandT>,
  /**
   * Returns project config from the current working directory
   */
  getProjectConfig(): Object,
  /**
   * Returns dependency config from <node_modules>/packageName
   */
  getDependencyConfig(pkgName: string): Object,

  /**
   * A module that exports:
   * - a `getHasteName(filePath)` method that returns `hasteName` for module at
   *  `filePath`, or undefined if `filePath` is not a haste module.
   */
  hasteImpl?: HasteImpl,
};

/**
 * Loads the CLI configuration
 */
function getCliConfig(): ConfigT {
  const cliArgs = minimist(process.argv.slice(2));

  let cwd;
  let configPath;

  if (cliArgs.config != null) {
    cwd = process.cwd();
    configPath = cliArgs.config;
  } else {
    cwd = __dirname;
    configPath = Config.findConfigPath(cwd);
  }

  return Config.get(cwd, defaultConfig, configPath);
}

module.exports = getCliConfig();
