/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const applyPatch = require('./patches/applyPatch');

const makeProjectPatch = require('./patches/makeProjectPatch');
const makeSolutionPatch = require('./patches/makeSolutionPatch');
const makeUsingPatch = require('./patches/makeUsingPatch');
const makePackagePatch = require('./patches/makePackagePatch');

module.exports = function registerNativeWindowsModule(
  name,
  windowsConfig,
  params,
  projectConfig
) {
  applyPatch(projectConfig.projectPath, makeProjectPatch(windowsConfig), true);
  applyPatch(projectConfig.solutionPath, makeSolutionPatch(windowsConfig), true);

  applyPatch(
    projectConfig.mainPage,
    makePackagePatch(windowsConfig.packageInstance, params, name)
  );

  applyPatch(
    projectConfig.mainPage,
    makeUsingPatch(windowsConfig.packageUsingPath)
  );
};
