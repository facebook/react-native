const path = require('path');
const findProject = require('./findProject');

/**
 * Returns project config by analyzing given folder and applying some user defaults
 * when constructing final object
 */
exports.projectConfig = function projectConfigIOS(folder, userConfig) {
  const project = userConfig.project || findProject(folder);

  /**
   * No iOS config found here
   */
  if (!project) {
    return null;
  }

  const projectPath = path.join(folder, project);

  return {
    sourceDir: path.dirname(projectPath),
    folder: folder,
    pbxprojPath: path.join(projectPath, 'project.pbxproj'),
    projectPath: projectPath,
    projectName: path.basename(projectPath),
    libraryFolder: userConfig.libraryFolder || 'Libraries',
    plist: userConfig.plist || [],
  };
};

exports.dependencyConfig = exports.projectConfig;
