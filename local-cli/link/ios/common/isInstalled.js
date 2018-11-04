/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const isInstalledIOS = require('../isInstalled');
const isInstalledPods = require('../../pods/isInstalled');

module.exports = function isInstalled(projectConfig, name, dependencyConfig) {
  return (
    isInstalledIOS(projectConfig, dependencyConfig) ||
    isInstalledPods(projectConfig, dependencyConfig)
  );
};
