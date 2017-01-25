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

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const RN_CLI_CONFIG = 'rn-cli.config.js';

// TODO: @bestander & @grabbou - get rid when internal tests are fixed
export type { ConfigT } from '../core';

/**
 * Module capable of getting the configuration out of a given file.
 *
 * The function will return all the default configuration, as specified by the
 * `defaultConfig` param overriden by those found on `rn-cli.config.js` files, if any. If no
 * default config is provided and no configuration can be found in the directory
 * hierarchy, an error will be thrown.
 */
const Config = {
  get<T>(
    cwd: string,
    defaultConfig?: T | null,
    pathToConfig?: string | null,
  ): T {
    let baseConfig;

    // Handle the legacy code path where pathToConfig is unspecified
    if (pathToConfig === undefined) {
      const configPath = Config.findConfigPath(cwd);
      if (!configPath && !defaultConfig) {
        throw new Error(
          `Can't find "${RN_CLI_CONFIG}" file in any parent folder of "${cwd}"`
        );
      }
      // $FlowFixMe nope
      baseConfig = require(configPath);
    } else if (pathToConfig == null) {
      assert(defaultConfig, 'Must have a default config if config is missing');
    } else {
      baseConfig = path.isAbsolute(pathToConfig) ?
        // $FlowFixMe nope
        require(pathToConfig) :
        // $FlowFixMe nope
        require(path.join(cwd, pathToConfig));
    }

    // $FlowFixMe we return `at least` T + extras
    return {
      ...defaultConfig,
      ...baseConfig,
      cwd,
    };
  },

  findConfigPath(cwd: string): ?string {
    const parentDir = findParentDirectory(cwd, RN_CLI_CONFIG);
    return parentDir ? path.join(parentDir, RN_CLI_CONFIG) : null;
  },
};

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
