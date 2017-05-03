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

import type {CommandT} from '../commands';
import type {ConfigT} from '../util/Config';

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

/**
 * Loads the CLI configuration
 */
function getCliConfig(): RNConfig {
  const cliArgs = minimist(process.argv.slice(2));
  const config = cliArgs.config != null
    ? Config.loadFile(cliArgs.config, __dirname)
    : Config.findOptional(__dirname);

  return {...defaultConfig, ...config};
}

module.exports = getCliConfig();
