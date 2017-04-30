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

const path = require('path');
const flatten = require('lodash').flatten;
const blacklist = require('../../packager/blacklist');
const android = require('./android');
const findAssets = require('./findAssets');
const ios = require('./ios');
const windows = require('./windows');
const wrapCommands = require('./wrapCommands');
const findPlugins = require('./findPlugins');
const findSymlinksPaths = require('../util/findSymlinksPaths');

import type {ConfigT} from './index';

function getProjectPath() {
  if (__dirname.match(/node_modules[\/\\]react-native[\/\\]local-cli[\/\\]core$/)) {
    // Packager is running from node_modules.
    // This is the default case for all projects created using 'react-native init'.
    return path.resolve(__dirname, '../../../..');
  } else if (__dirname.match(/Pods[\/\\]React[\/\\]packager$/)) {
    // React Native was installed using CocoaPods.
    return path.resolve(__dirname, '../../../..');
  }
  return path.resolve(__dirname, '../..');
}

const getRNPMConfig = (folder) =>
  // $FlowFixMe non-literal require
  require(path.join(folder, './package.json')).rnpm || {};

const attachPackage = (command, pkg) => Array.isArray(command)
  ? command.map(cmd => attachPackage(cmd, pkg))
  : { ...command, pkg };

const resolveSymlink = (roots) =>
  roots.concat(
    findSymlinksPaths(
      path.join(getProjectPath(), 'node_modules'),
      roots
    )
  );

/**
 * Default configuration for the CLI.
 *
 * If you need to override any of this functions do so by defining the file
 * `rn-cli.config.js` on the root of your project with the functions you need
 * to tweak.
 */
const config: ConfigT = {
  getProjectCommands() {
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
  getProjectConfig() {
    const folder = process.cwd();
    const rnpm = getRNPMConfig(folder);

    return Object.assign({}, rnpm, {
      ios: ios.projectConfig(folder, rnpm.ios || {}),
      android: android.projectConfig(folder, rnpm.android || {}),
      windows: windows.projectConfig(folder, rnpm.windows || {}),
      assets: findAssets(folder, rnpm.assets),
    });
  },
  getDependencyConfig(packageName) {
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
  getAssetExts() {
    return [];
  },
  getPlatforms() {
    return [];
  },
  getBlacklistRE() {
    return blacklist();
  },
  getTransformModulePath() {
    return require.resolve('../../packager/transformer');
  },
  getProjectRoots() {
    const root = process.env.REACT_NATIVE_APP_ROOT;
    if (root) {
      return resolveSymlink([path.resolve(root)]);
    }

    return resolveSymlink([getProjectPath()]);
  },
};

module.exports = config;
