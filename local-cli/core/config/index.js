/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const android = require('./android');
const findAssets = require('./findAssets');
const ios = require('./ios');
const path = require('path');
const wrapCommands = require('./wrapCommands');

const getRNPMConfig = (folder) =>
  require(path.join(folder, './package.json')).rnpm || {};

/**
 * Returns project config from the current working directory
 * @return {Object}
 */
exports.getProjectConfig = function getProjectConfig() {
  const folder = process.cwd();
  const rnpm = getRNPMConfig(folder);

  return Object.assign({}, rnpm, {
    ios: ios.projectConfig(folder, rnpm.ios || {}),
    android: android.projectConfig(folder, rnpm.android || {}),
    assets: findAssets(folder, rnpm.assets),
  });
};

/**
 * Returns a dependency config from node_modules/<package_name>
 * @param {String} packageName Dependency name
 * @return {Object}
 */
exports.getDependencyConfig = function getDependencyConfig(packageName) {
  const folder = path.join(process.cwd(), 'node_modules', packageName);
  const rnpm = getRNPMConfig(
    path.join(process.cwd(), 'node_modules', packageName)
  );

  return Object.assign({}, rnpm, {
    ios: ios.dependencyConfig(folder, rnpm.ios || {}),
    android: android.dependencyConfig(folder, rnpm.android || {}),
    assets: findAssets(folder, rnpm.assets),
    commands: wrapCommands(rnpm.commands),
    params: rnpm.params || [],
  });
};
