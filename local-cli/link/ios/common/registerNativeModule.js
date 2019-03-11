/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const registerDependencyIOS = require('../registerNativeModule');
const registerDependencyPods = require('../../pods/registerNativeModule');

module.exports = function registerNativeModule(
  name,
  dependencyConfig,
  params,
  projectConfig,
) {
  if (projectConfig.podfile && dependencyConfig.podspec) {
    registerDependencyPods(name, dependencyConfig, projectConfig);
  } else {
    registerDependencyIOS(dependencyConfig, projectConfig);
  }
};
