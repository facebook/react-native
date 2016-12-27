/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const findWindowsSolution = require('./findWindowsSolution');
const findNamespace = require('./findNamespace');
const findProject = require('./findProject');
const findPackageClassName = require('./findPackageClassName');
const path = require('path');
const generateGUID = require('./generateGUID');

const relativeProjectPath = (fullProjPath) => {
  const windowsPath = fullProjPath
                  .substring(fullProjPath.lastIndexOf("node_modules") - 1, fullProjPath.length)
                  .replace(/\//g, '\\');

  return '..' + windowsPath;
}

const getProjectName = (fullProjPath) => {
  return fullProjPath.split('/').slice(-1)[0].replace(/\.csproj/i, '');
}

/**
 * Gets windows project config by analyzing given folder and taking some
 * defaults specified by user into consideration
 */
exports.projectConfig = function projectConfigWindows(folder, userConfig) {

  const csSolution = userConfig.csSolution || findWindowsSolution(folder);

  if (!csSolution) {
    return null;
  }

  // expects solutions to be named the same as project folders
  const solutionPath = path.join(folder, csSolution);
  const windowsAppFolder = csSolution.substring(0, csSolution.lastIndexOf(".sln"));
  const src = userConfig.sourceDir || windowsAppFolder;
  const sourceDir = path.join(folder, src);
  const mainPage = path.join(sourceDir, 'MainPage.cs');
  const projectPath = userConfig.projectPath || findProject(folder);

  return {
    sourceDir,
    solutionPath,
    projectPath,
    mainPage,
    folder,
    userConfig,
  };
};

/**
 * Same as projectConfigWindows except it returns
 * different config that applies to packages only
 */
exports.dependencyConfig = function dependencyConfigWindows(folder, userConfig) {

  const csSolution = userConfig.csSolution || findWindowsSolution(folder);

  if (!csSolution) {
    return null;
  }

  // expects solutions to be named the same as project folders
  const windowsAppFolder = csSolution.substring(0, csSolution.lastIndexOf(".sln"));
  const src = userConfig.sourceDir || windowsAppFolder;

  if (!src) {
    return null;
  }

  const sourceDir = path.join(folder, src);
  const packageClassName = findPackageClassName(sourceDir);
  const namespace = userConfig.namespace || findNamespace(sourceDir);
  const csProj = userConfig.csProj || findProject(folder);

  /**
   * This module has no package to export or no namespace
   */
  if (!packageClassName || !namespace) {
    return null;
  }

  const packageUsingPath = userConfig.packageUsingPath ||
    `using ${namespace};`;

  const packageInstance = userConfig.packageInstance ||
    `new ${packageClassName}()`;

  const projectGUID = generateGUID();
  const pathGUID = generateGUID();
  const projectName = getProjectName(csProj);
  const relativeProjPath = relativeProjectPath(csProj);

  return {
    sourceDir,
    packageUsingPath,
    packageInstance,
    projectName,
    csProj,
    folder,
    projectGUID,
    pathGUID,
    relativeProjPath,
  };
};
