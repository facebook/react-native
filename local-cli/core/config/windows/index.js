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
const findWindowsAppFolder = require('./findWindowsAppFolder');
const findProject = require('./findProject');
const findPackageClassName = require('./findPackageClassName');
const path = require('path');
const generateGUID = require('./generateGUID');
// const readProject = require('./readProject');

/**
 * Gets windows project config by analyzing given folder and taking some
 * defaults specified by user into consideration
 */
exports.projectConfig = function projectConfigWindows(folder, userConfig) {

  const sourceDir = '';
  const mainReactPage = null;
  const csProj = '';
  const csSolution = '';

  return null;
};


/**
 * Same as projectConfigWindows except it returns
 * different config that applies to packages only
 */
exports.dependencyConfig = function dependencyConfigWindows(folder, userConfig) {

  const csSolution = userConfig.csSolution || findWindowsSolution(folder);
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
  const relativeProj = csProj.substring(csProj.lastIndexOf("node_modules") - 1, csProj.length)
  const solutionEntry = `
Project("{${projectGUID.toUpperCase()}}") = "RNWinGif", "..${relativeProj}", "{${pathGUID.toUpperCase()}}"
EndProject
  `

  return {
    sourceDir,
    packageUsingPath,
    packageInstance,
    solutionEntry,
    csProj,
  }
};
