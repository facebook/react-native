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

function getCliConfig() {
  // Use a lightweight option parser to look up the CLI configuration file,
  // which we need to set up the parser for the other args and options
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
