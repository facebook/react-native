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
