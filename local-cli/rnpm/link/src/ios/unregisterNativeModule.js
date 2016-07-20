const xcode = require('xcode');
const path = require('path');
const fs = require('fs');

const getProducts = require('./getProducts');
const getHeadersInFolder = require('./getHeadersInFolder');
const isEmpty = require('lodash').isEmpty;
const getHeaderSearchPath = require('./getHeaderSearchPath');
const removeProjectFromProject = require('./removeProjectFromProject');
const removeProjectFromLibraries = require('./removeProjectFromLibraries');
const removeFromStaticLibraries = require('./removeFromStaticLibraries');
const removeFromHeaderSearchPaths = require('./removeFromHeaderSearchPaths');
const removeSharedLibraries = require('./addSharedLibraries');
const getGroup = require('./getGroup');

/**
 * Unregister native module IOS
 *
 * If library is already unlinked, this action is a no-op.
 */
module.exports = function unregisterNativeModule(dependencyConfig, projectConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const dependencyProject = xcode.project(dependencyConfig.pbxprojPath).parseSync();

  const libraries = getGroup(project, projectConfig.libraryFolder);

  const file = removeProjectFromProject(
    project,
    path.relative(projectConfig.sourceDir, dependencyConfig.projectPath)
  );

  removeProjectFromLibraries(libraries, file);

  getProducts(dependencyProject).forEach(product => {
    removeFromStaticLibraries(project, product, {
      target: project.getFirstTarget().uuid,
    });
  });

  removeSharedLibraries(project, dependencyConfig.sharedLibraries);

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
