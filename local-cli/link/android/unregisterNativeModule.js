/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const toCamelCase = require('lodash').camelCase;

const revokePatch = require('./patches/revokePatch');
const makeSettingsPatch = require('./patches/makeSettingsPatch');
const makeBuildPatch = require('./patches/makeBuildPatch');
const makeStringsPatch = require('./patches/makeStringsPatch');
const makeImportPatch = require('./patches/makeImportPatch');
const makePackagePatch = require('./patches/makePackagePatch');

module.exports = function unregisterNativeAndroidModule(
  name,
  androidConfig,
  projectConfig
) {
  const buildPatch = makeBuildPatch(name);
  const strings = fs.readFileSync(projectConfig.stringsPath, 'utf8');
  var params = {};

  strings.replace(
    /moduleConfig="true" name="(\w+)">(.*)</g,
    (_, param, value) => {
      params[param.slice(toCamelCase(name).length + 1)] = value;
    }
  );

  revokePatch(
    projectConfig.settingsGradlePath,
    makeSettingsPatch(name, androidConfig, projectConfig)
  );

  revokePatch(projectConfig.buildGradlePath, buildPatch);
  revokePatch(projectConfig.stringsPath, makeStringsPatch(params, name));

  revokePatch(
    projectConfig.mainFilePath,
    makePackagePatch(androidConfig.packageInstance, params, name)
  );

  revokePatch(
    projectConfig.mainFilePath,
    makeImportPatch(androidConfig.packageImportPath)
  );
};
