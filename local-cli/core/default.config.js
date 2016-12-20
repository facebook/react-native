/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

const getRNPMConfig = (folder) =>
  require(path.join(folder, './package.json')).rnpm || {};

const attachPackage = (command, pkg) => Array.isArray(command)
  ? command.map(cmd => attachPackage(cmd, pkg))
  : { ...command, pkg };

/**
 * Default configuration for the CLI.
 *
 * If you need to override any of this functions do so by defining the file
 * `rn-cli.config.js` on the root of your project with the functions you need
 * to tweak.
 */
const config = {

  /**
   * Returns an array of project commands used by the CLI to load
   */
  getProjectCommands() {
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
  },

  /**
   * Returns project config from the current working directory
   */
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

  /**
   * Returns dependency config from <node_modules>/packageName
   */
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

  /**
   * Specify any additional asset extentions to be used by the packager.
   * For example, if you want to include a .ttf file, you would return ['ttf']
   * from here and use `require('./fonts/example.ttf')` inside your app.
   */
  getAssetExts() {
    return [];
  },

  /**
   * Specify any additional platforms to be used by the packager.
   * For example, if you want to add a "custom" platform, and use modules
   * ending in .custom.js, you would return ['custom'] here.
   */
  getPlatforms() {
    return [];
  },

  /**
   * Returns a regular expression for modules that should be ignored by the
   * packager on a given platform.
   */
  getBlacklistRE() {
    return blacklist();
  },

  /**
   * Returns the path to a custom transformer. This can also be overridden
   * with the --transformer commandline argument.
   */
  getTransformModulePath() {
    return require.resolve('../../packager/transformer');
  },

  getProjectRoots() {
    const root = process.env.REACT_NATIVE_APP_ROOT;
    if (root) {
      return [path.resolve(root)];
    }
    if (__dirname.match(/node_modules[\/\\]react-native[\/\\]local-cli$/)) {
      // Packager is running from node_modules.
      // This is the default case for all projects created using 'react-native init'.
      return [path.resolve(__dirname, '../../../..')];
    } else if (__dirname.match(/Pods[\/\\]React[\/\\]packager$/)) {
      // React Native was installed using CocoaPods.
      return [path.resolve(__dirname, '../../../..')];
    } else {
      return [path.resolve(__dirname, '../..')];
    }
  },

};

module.exports = config;
