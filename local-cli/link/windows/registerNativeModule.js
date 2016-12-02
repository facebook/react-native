const applyPatch = require('./patches/applyPatch');
// const makeStringsPatch = require('./patches/makeStringsPatch');
// const makeSettingsPatch = require('./patches/makeSettingsPatch');
// const makeBuildPatch = require('./patches/makeBuildPatch');
// const makeImportPatch = require('./patches/makeImportPatch');
// const makePackagePatch = require('./patches/makePackagePatch');

const makeUsingPatch = require('./patches/makeUsingPatch');
const makePackagePatch = require('./patches/makePackagePatch');

module.exports = function registerNativeWindowsModule(
  name,
  windowsConfig,
  params,
  projectConfig
) {

  // console.log('registerNativeWindowsModule', name, windowsConfig, params, projectConfig);
  // const buildPatch = makeBuildPatch(name);

  // applyPatch(
  //   projectConfig.settingsGradlePath,
  //   makeSettingsPatch(name, windowsConfig, projectConfig)
  // );

  // applyPatch(projectConfig.buildGradlePath, buildPatch);
  // applyPatch(projectConfig.stringsPath, makeStringsPatch(params, name));

  applyPatch(
    projectConfig.mainPage,
    makePackagePatch(windowsConfig.packageInstance, params, name)
  );

  applyPatch(
    projectConfig.mainPage,
    makeUsingPatch(windowsConfig.packageUsingPath)
  );
};
