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

const android = require('./android');
const Config = require('../util/Config');
const findPlugins = require('./findPlugins');
const findAssets = require('./findAssets');
const ios = require('./ios');
const windows = require('./windows');
const wrapCommands = require('./wrapCommands');

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
import type {ConfigT} from 'metro';

export type RNConfig = {
  ...ConfigT,
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
};

const getRNPMConfig = (folder) =>
  // $FlowFixMe non-literal require
  require(path.join(folder, './package.json')).rnpm || {};

const attachPackage = (command, pkg) => Array.isArray(command)
  ? command.map(cmd => attachPackage(cmd, pkg))
  : { ...command, pkg };

const defaultRNConfig = {
  getProjectCommands(): Array<CommandT> {
    const appRoot = process.cwd();
    const plugins = findPlugins([appRoot])
      .map(pathToCommands => {
        const name = pathToCommands.split(path.sep)[0];

        return attachPackage(
          // $FlowFixMe non-literal require
          require(path.join(appRoot, 'node_modules', pathToCommands)),
          // $FlowFixMe non-literal require
          require(path.join(appRoot, 'node_modules', name, 'package.json'))
        );
      });

    return flatten(plugins);
  },

  getProjectConfig(): Object {
    const folder = process.cwd();
    const rnpm = getRNPMConfig(folder);

    return Object.assign({}, rnpm, {
      ios: ios.projectConfig(folder, rnpm.ios || {}),
      android: android.projectConfig(folder, rnpm.android || {}),
      windows: windows.projectConfig(folder, rnpm.windows || {}),
      assets: findAssets(folder, rnpm.assets),
    });
  },

  getDependencyConfig(packageName: string) {
    const folder = path.join(process.cwd(), 'node_modules', packageName);
    const rnpm = getRNPMConfig(
      path.join(process.cwd(), 'node_modules', packageName)
    );

    return Object.assign({}, rnpm, {
      ios: ios.dependencyConfig(folder, rnpm.ios || {}),
      android: android.dependencyConfig(folder, rnpm.android || {}),
      windows: windows.dependencyConfig(folder, rnpm.windows || {}),
      assets: findAssets(folder, rnpm.assets),
      commands: wrapCommands(rnpm.commands),
      params: rnpm.params || [],
    });
  },
};

/**
 * Loads the CLI configuration
 */
function getCliConfig(): RNConfig {
  const cliArgs = minimist(process.argv.slice(2));
  const config = cliArgs.config != null
    ? Config.load(path.resolve(__dirname, cliArgs.config))
    : Config.findOptional(__dirname);

  return {...defaultRNConfig, ...config};
}

module.exports = getCliConfig();
