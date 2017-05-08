const fs = require('fs-extra');
const path = require('path');
const xcode = require('xcode');
const log = require('npmlog');
const groupFilesByType = require('../groupFilesByType');
const createGroupWithMessage = require('./createGroupWithMessage');
const getPlist = require('./getPlist');
const writePlist = require('./writePlist');
const getPlistPath = require('./getPlistPath');
const getTarget = require('./getTarget');

/**
 * This function works in a similar manner to its Android version,
 * except it does not copy fonts but creates Xcode Group references
 */
module.exports = function linkAssetsIOS(files, projectConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const assets = groupFilesByType(files);
  const plist = getPlist(project, projectConfig.sourceDir, projectConfig);

  createGroupWithMessage(project, 'Resources');

  const fonts = (assets.font || [])
    .map(asset =>
      project.addResourceFile(
        path.relative(projectConfig.sourceDir, asset),
        { target: getTarget(project, projectConfig).uuid }
      )
    )
    .filter(file => file)   // xcode returns false if file is already there
    .map(file => file.basename);

  const existingFonts = (plist.UIAppFonts || []);
  const allFonts = [...existingFonts, ...fonts];
  plist.UIAppFonts = Array.from(new Set(allFonts)); // use Set to dedupe w/existing

  fs.writeFileSync(
    projectConfig.pbxprojPath,
    project.writeSync()
  );

  writePlist(project, projectConfig.sourceDir, plist);
  fs.writeFileSync(
    getPlistPath(project, projectConfig.sourceDir, projectConfig),
    plistParser.build(plist)
  );
};
