/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const compact = require('lodash').compact;
const isInstalledIOS = require('../isInstalled');
const isInstalledPods = require('../../pods/isInstalled');
const unregisterDependencyIOS = require('../unregisterNativeModule');
const unregisterDependencyPods = require('../../pods/unregisterNativeModule');

module.exports = function unregisterNativeModule(
  name,
  dependencyConfig,
  projectConfig,
  otherDependencies,
) {
  const isIosInstalled = isInstalledIOS(projectConfig, dependencyConfig);
  const isPodInstalled = isInstalledPods(projectConfig, dependencyConfig);
  if (isIosInstalled) {
    const iOSDependencies = compact(otherDependencies.map(d => d.config.ios));
    unregisterDependencyIOS(dependencyConfig, projectConfig, iOSDependencies);
  } else if (isPodInstalled) {
    unregisterDependencyPods(dependencyConfig, projectConfig);
  }
};
