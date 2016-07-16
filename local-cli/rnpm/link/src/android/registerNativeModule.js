const fs = require('fs');
const getReactVersion = require('../getReactNativeVersion');
const getPrefix = require('./getPrefix');

const applyPatch = require('./patches/applyPatch');
const makeStringsPatch = require('./patches/makeStringsPatch');
const makeSettingsPatch = require(`./patches/makeSettingsPatch`);
const makeBuildPatch = require(`./patches/makeBuildPatch`);

module.exports = function registerNativeAndroidModule(
  name,
  androidConfig,
  params,
  projectConfig
) {
  const buildPatch = makeBuildPatch(name);
  const prefix = getPrefix(getReactVersion(projectConfig.folder));
  const makeImportPatch = require(`./${prefix}/makeImportPatch`);
  const makePackagePatch = require(`./${prefix}/makePackagePatch`);

  applyPatch(
    projectConfig.settingsGradlePath,
    makeSettingsPatch(name, androidConfig, projectConfig)
  );

  applyPatch(projectConfig.buildGradlePath, buildPatch);
  applyPatch(projectConfig.stringsPath, makeStringsPatch(params, name));

  applyPatch(
    projectConfig.mainActivityPath,
    makePackagePatch(androidConfig.packageInstance, params, name)
  );

  applyPatch(
    projectConfig.mainActivityPath,
    makeImportPatch(androidConfig.packageImportPath)
  );
};
