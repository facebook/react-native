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
  revokePatch(projectConfig.projectPath, makeProjectPatch(windowsConfig.projectInsert, windowsConfig.projectName));
  revokePatch(projectConfig.solutionPath, makeSolutionPatch(windowsConfig.solutionInsert));

  revokePatch(
    projectConfig.mainPage,
    makePackagePatch(windowsConfig.packageInstance, {}, name)
  );

  revokePatch(
    projectConfig.mainPage,
    makeUsingPatch(windowsConfig.packageUsingPath)
  );
};
