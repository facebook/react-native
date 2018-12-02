/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const xcode = require('xcode');
const getGroup = require('./getGroup');
const hasLibraryImported = require('./hasLibraryImported');

/**
 * Returns true if `xcodeproj` specified by dependencyConfig is present
 * in a top level `libraryFolder`
 */
module.exports = function isInstalled(projectConfig, dependencyConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const libraries = getGroup(project, projectConfig.libraryFolder);

  if (!libraries) {
    return false;
  }

  return hasLibraryImported(libraries, dependencyConfig.projectName);
};
