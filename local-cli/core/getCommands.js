/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const findPlugins = require('./findPlugins');
const path = require('path');
const flatten = require('lodash').flatten;

const attachPackage = (command, pkg) => Array.isArray(command)
  ? command.map(cmd => attachPackage(cmd, pkg))
  : { ...command, pkg };

/**
 * @return {Array} Array of commands
 */
module.exports = function getCommands() {
  const appRoot = process.cwd();
  const plugins = findPlugins([appRoot])
    .map(pathToCommands => {
      const name = pathToCommands.split(path.sep)[0];

      return attachPackage(
        require(path.join(appRoot, 'node_modules', pathToCommands)),
        require(path.join(appRoot, 'node_modules', name, 'package.json'))
      );
    });

  return flatten(plugins);
};
