/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const applyPatch = require('./patches/applyPatch');
const makeStringsPatch = require('./patches/makeStringsPatch');
const makeSettingsPatch = require('./patches/makeSettingsPatch');
const makeBuildPatch = require('./patches/makeBuildPatch');
const makeImportPatch = require('./patches/makeImportPatch');
const makePackagePatch = require('./patches/makePackagePatch');

module.exports = function registerNativeAndroidModule(
  name,
  androidConfig,
  params,
  projectConfig
) {
  const buildPatch = makeBuildPatch(name);

  applyPatch(
    projectConfig.settingsGradlePath,
    makeSettingsPatch(name, androidConfig, projectConfig)
  );

  applyPatch(projectConfig.buildGradlePath, buildPatch);
  applyPatch(projectConfig.stringsPath, makeStringsPatch(params, name));

  applyPatch(
    projectConfig.mainFilePath,
    makePackagePatch(androidConfig.packageInstance, params, name)
  );

  applyPatch(
    projectConfig.mainFilePath,
    makeImportPatch(androidConfig.packageImportPath)
  );
};
