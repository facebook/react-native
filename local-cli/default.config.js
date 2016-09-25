/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
 'use strict';

var blacklist = require('../packager/blacklist');
var path = require('path');
var rnpmConfig = require('./core/config');

/**
 * Default configuration for the CLI.
 *
 * If you need to override any of this functions do so by defining the file
 * `rn-cli.config.js` on the root of your project with the functions you need
 * to tweak.
 */
var config = {
  getProjectRoots() {
    return getRoots();
  },

  getProjectConfig: rnpmConfig.getProjectConfig,
  getDependencyConfig: rnpmConfig.getDependencyConfig,

  /**
   * Specify where to look for assets that are referenced using
   * `image!<image_name>`. Asset directories for images referenced using
   * `./<image.extension>` don't require any entry in here.
   */
  getAssetRoots() {
    return getRoots();
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
    return require.resolve('../packager/transformer');
  },
};

function getRoots() {
  var root = process.env.REACT_NATIVE_APP_ROOT;
  if (root) {
    return [path.resolve(root)];
  }
  if (__dirname.match(/node_modules[\/\\]react-native[\/\\]local-cli$/)) {
    // Packager is running from node_modules.
    // This is the default case for all projects created using 'react-native init'.
    return [path.resolve(__dirname, '../../..')];
  } else if (__dirname.match(/Pods[\/\\]React[\/\\]packager$/)) {
     // React Native was installed using CocoaPods.
    return [path.resolve(__dirname, '../../..')];
  } else {
    return [path.resolve(__dirname, '..')];
  }
}

module.exports = config;
