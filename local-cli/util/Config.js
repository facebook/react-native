/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 * @flow
 */
'use strict';

const findSymlinkedModules = require('./findSymlinkedModules');
const fs = require('fs');
const getPolyfills = require('../../rn-get-polyfills');
const invariant = require('fbjs/lib/invariant');
const path = require('path');

const {Config: MetroConfig} = require('metro');

const RN_CLI_CONFIG = 'rn-cli.config.js';

import type {ConfigT as MetroConfigT} from 'metro';

/**
 * Configuration file of the CLI.
 */
export type ConfigT = MetroConfigT;

function getProjectPath() {
  if (
    __dirname.match(/node_modules[\/\\]react-native[\/\\]local-cli[\/\\]util$/)
  ) {
    // Packager is running from node_modules.
    // This is the default case for all projects created using 'react-native init'.
    return path.resolve(__dirname, '../../../..');
  } else if (__dirname.match(/Pods[\/\\]React[\/\\]packager$/)) {
    // React Native was installed using CocoaPods.
    return path.resolve(__dirname, '../../../..');
  }
  return path.resolve(__dirname, '../..');
}

const resolveSymlinksForRoots = roots =>
  roots.reduce(
    (arr, rootPath) => arr.concat(findSymlinkedModules(rootPath, roots)),
    [...roots],
  );

const getProjectRoots = () => {
  const root = process.env.REACT_NATIVE_APP_ROOT;
  if (root) {
    return resolveSymlinksForRoots([path.resolve(root)]);
  }
  return resolveSymlinksForRoots([getProjectPath()]);
};

/**
 * Module capable of getting the configuration out of a given file.
 *
 * The function will return all the default configuration, as specified by the
 * `DEFAULT` param overriden by those found on `rn-cli.config.js` files, if any. If no
 * default config is provided and no configuration can be found in the directory
 * hierarchy, an error will be thrown.
 */
const Config = {
  DEFAULT: ({
    ...MetroConfig.DEFAULT,
    getProjectRoots,
    getPolyfills,
    getModulesRunBeforeMainModule: () => [
      require.resolve('../../Libraries/Core/InitializeCore'),
    ],
  }: ConfigT),

  find(startDir: string): ConfigT {
    return this.findWithPath(startDir).config;
  },

  findWithPath(startDir: string): {config: ConfigT, projectPath: string} {
    const configPath = findConfigPath(startDir);
    invariant(
      configPath,
      `Can't find "${RN_CLI_CONFIG}" file in any parent folder of "${startDir}"`,
    );
    const projectPath = path.dirname(configPath);
    return {config: this.load(configPath, startDir), projectPath};
  },

  findOptional(startDir: string): ConfigT {
    const configPath = findConfigPath(startDir);
    return configPath ? this.load(configPath, startDir) : {...Config.DEFAULT};
  },

  load(configFile: string): ConfigT {
    return MetroConfig.load(configFile, Config.DEFAULT);
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
  const testDir = parts => {
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
