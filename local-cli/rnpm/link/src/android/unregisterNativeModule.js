const fs = require('fs');
const toCamelCase = require('lodash').camelCase;

const revokePatch = require('./patches/revokePatch');
const makeSettingsPatch = require('./patches/makeSettingsPatch');
const makeBuildPatch = require('./patches/makeBuildPatch');
const makeStringsPatch = require('./patches/makeStringsPatch');
const makeImportPatch = require('./makeImportPatch');
const makePackagePatch = require('./makePackagePatch');

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
    projectConfig.mainActivityPath,
    makePackagePatch(androidConfig.packageInstance, params, name)
  );

  revokePatch(
    projectConfig.mainActivityPath,
    makeImportPatch(androidConfig.packageImportPath)
  );
};
