/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const android = require('./android');
const Config = require('../util/Config');
const findPlugins = require('./findPlugins');
const findAssets = require('./findAssets');
const ios = require('./ios');
const wrapCommands = require('./wrapCommands');
const {ASSET_REGISTRY_PATH} = require('./Constants');

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const flatten = require('lodash').flatten;
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const minimist = require('minimist');
const path = require('path');

import type {CommandT} from '../commands';
import type {ConfigT} from 'metro-config/src/configTypes.flow';

export type RNConfig = {
  ...ConfigT,
  /**
   * Returns an object with all platform configurations.
   */
  getPlatformConfig(): Object,
  /**
   * Returns project config from the current working directory
   */
  getProjectConfig(): Object,
  /**
   * Returns dependency config from <node_modules>/packageName
   */
  getDependencyConfig(pkgName: string): Object,
};

const getRNPMConfig = folder =>
  // $FlowFixMe non-literal require
  require(path.join(folder, './package.json')).rnpm || {};

const attachPackage = (command, pkg) =>
  Array.isArray(command)
    ? command.map(cmd => attachPackage(cmd, pkg))
    : {...command, pkg};

const appRoot = process.cwd();
const plugins = findPlugins([appRoot]);
const pluginPlatforms = plugins.platforms.reduce((acc, pathToPlatforms) => {
  return Object.assign(
    acc,
    // $FlowFixMe non-literal require
    require(path.join(appRoot, 'node_modules', pathToPlatforms)),
  );
}, {});

const defaultConfig = {
  hasteImplModulePath: require.resolve('../../jest/hasteImpl'),

  getPlatforms(): Array<string> {
    return ['ios', 'android', 'native', ...plugins.haste.platforms];
  },

  getProvidesModuleNodeModules(): Array<string> {
    return ['react-native', ...plugins.haste.providesModuleNodeModules];
  },
};

const defaultRNConfig = {
  getPlatformConfig(): Object {
    return {
      ios,
      android,
      ...pluginPlatforms,
    };
  },

  getProjectConfig(): Object {
    const platforms = this.getPlatformConfig();
    const folder = process.cwd();
    const rnpm = getRNPMConfig(folder);

    let config = Object.assign({}, rnpm, {
      assets: findAssets(folder, rnpm.assets),
    });

    Object.keys(platforms).forEach(key => {
      config[key] = platforms[key].projectConfig(folder, rnpm[key] || {});
    });

    return config;
  },

  getDependencyConfig(packageName: string) {
    const platforms = this.getPlatformConfig();
    const folder = path.join(process.cwd(), 'node_modules', packageName);
    const rnpm = getRNPMConfig(folder);

    let config = Object.assign({}, rnpm, {
      assets: findAssets(folder, rnpm.assets),
      commands: wrapCommands(rnpm.commands),
      params: rnpm.params || [],
    });

    Object.keys(platforms).forEach(key => {
      config[key] = platforms[key].dependencyConfig(folder, rnpm[key] || {});
    });

    return config;
  },
};

/**
 * Loads the CLI configuration
 */
async function getCliConfig(): Promise<RNConfig> {
  const cliArgs = minimist(process.argv.slice(2));
  const config = await Config.load(
    cliArgs.config != null ? path.resolve(__dirname, cliArgs.config) : null,
  );

  // $FlowFixMe Metro configuration is immutable.
  config.transformer.assetRegistryPath = ASSET_REGISTRY_PATH;
  config.resolver.hasteImplModulePath =
    config.resolver.hasteImplModulePath || defaultConfig.hasteImplModulePath;
  config.resolver.platforms = config.resolver.platforms
    ? config.resolver.platforms.concat(defaultConfig.getPlatforms())
    : defaultConfig.getPlatforms();
  config.resolver.providesModuleNodeModules = config.resolver
    .providesModuleNodeModules
    ? config.resolver.providesModuleNodeModules.concat(
        defaultConfig.getProvidesModuleNodeModules(),
      )
    : defaultConfig.getProvidesModuleNodeModules();

  return {...defaultRNConfig, ...config};
}

/**
 * Returns an array of project commands used by the CLI to load
 */
function getProjectCommands(): Array<CommandT> {
  const commands = plugins.commands.map(pathToCommands => {
    const name =
      pathToCommands[0] === '@'
        ? pathToCommands
            .split(path.sep)
            .slice(0, 2)
            .join(path.sep)
        : pathToCommands.split(path.sep)[0];

    return attachPackage(
      require(path.join(appRoot, 'node_modules', pathToCommands)),
      require(path.join(appRoot, 'node_modules', name, 'package.json')),
    );
  });

  return flatten(commands);
}

module.exports.configPromise = getCliConfig();
module.exports.getProjectCommands = getProjectCommands;
