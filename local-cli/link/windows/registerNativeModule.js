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
