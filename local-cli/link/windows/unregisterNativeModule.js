/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

 const fs = require('fs');
const toCamelCase = require('lodash').camelCase;

const revokePatch = require('./patches/revokePatch');
const makeProjectPatch = require('./patches/makeProjectPatch');
const makeSolutionPatch = require('./patches/makeSolutionPatch');
const makeUsingPatch = require('./patches/makeUsingPatch');
const makePackagePatch = require('./patches/makePackagePatch');

module.exports = function unregisterNativeWindowsModule(
  name,
  windowsConfig,
  projectConfig
) {
  revokePatch(projectConfig.projectPath, makeProjectPatch(windowsConfig));
  revokePatch(projectConfig.solutionPath, makeSolutionPatch(windowsConfig));

  revokePatch(
    projectConfig.mainPage,
    makePackagePatch(windowsConfig.packageInstance, {}, name)
  );

  revokePatch(
    projectConfig.mainPage,
    makeUsingPatch(windowsConfig.packageUsingPath)
  );
};
