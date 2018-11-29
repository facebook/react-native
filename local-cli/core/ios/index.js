/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const findProject = require('./findProject');
const findPodfilePath = require('./findPodfilePath');
const findPodspecName = require('./findPodspecName');
const path = require('path');

/**
 * For libraries specified without an extension, add '.tbd' for those that
 * start with 'lib' and '.framework' to the rest.
 */
const mapSharedLibaries = libraries => {
  return libraries.map(name => {
    if (path.extname(name)) {
      return name;
    }
    return name + (name.indexOf('lib') === 0 ? '.tbd' : '.framework');
  });
};

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
    podfile: findPodfilePath(projectPath),
    podspec: findPodspecName(folder),
    projectPath: projectPath,
    projectName: path.basename(projectPath),
    libraryFolder: userConfig.libraryFolder || 'Libraries',
    sharedLibraries: mapSharedLibaries(userConfig.sharedLibraries || []),
    plist: userConfig.plist || [],
  };
};

exports.dependencyConfig = exports.projectConfig;

exports.linkConfig = require('../../link/ios');
