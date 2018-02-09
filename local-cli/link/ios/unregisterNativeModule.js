/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const xcode = require('xcode');
const path = require('path');
const fs = require('fs');
const difference = require('lodash').difference;
const isEmpty = require('lodash').isEmpty;

const getGroup = require('./getGroup');
const getProducts = require('./getProducts');
const getTargets = require('./getTargets');
const getHeadersInFolder = require('./getHeadersInFolder');
const getHeaderSearchPath = require('./getHeaderSearchPath');
const removeProjectFromProject = require('./removeProjectFromProject');
const removeProjectFromLibraries = require('./removeProjectFromLibraries');
const removeFromStaticLibraries = require('./removeFromStaticLibraries');
const removeFromHeaderSearchPaths = require('./removeFromHeaderSearchPaths');
const removeSharedLibraries = require('./removeSharedLibraries');

/**
 * Unregister native module IOS
 *
 * If library is already unlinked, this action is a no-op.
 */
module.exports = function unregisterNativeModule(dependencyConfig, projectConfig, iOSDependencies) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const dependencyProject = xcode.project(dependencyConfig.pbxprojPath).parseSync();

  const libraries = getGroup(project, projectConfig.libraryFolder);

  const file = removeProjectFromProject(
    project,
    path.relative(projectConfig.sourceDir, dependencyConfig.projectPath)
  );

  removeProjectFromLibraries(libraries, file);

  getTargets(dependencyProject).forEach(target => {
    removeFromStaticLibraries(project, target.name, {
      target: project.getFirstTarget().uuid,
    });
  });

  const sharedLibraries = difference(
    dependencyConfig.sharedLibraries,
    iOSDependencies.reduce(
      (libs, dependency) => libs.concat(dependency.sharedLibraries),
      projectConfig.sharedLibraries
    )
  );

  removeSharedLibraries(project, sharedLibraries);

  const headers = getHeadersInFolder(dependencyConfig.folder);
  if (!isEmpty(headers)) {
    removeFromHeaderSearchPaths(
      project,
      getHeaderSearchPath(projectConfig.sourceDir, headers)
    );
  }

  fs.writeFileSync(
    projectConfig.pbxprojPath,
    project.writeSync()
  );
};
