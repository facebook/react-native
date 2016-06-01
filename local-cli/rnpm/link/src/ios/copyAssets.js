const fs = require('fs-extra');
const path = require('path');
const xcode = require('xcode');
const log = require('npmlog');
const plistParser = require('plist');
const groupFilesByType = require('../groupFilesByType');
const createGroup = require('./createGroup');
const getPlist = require('./getPlist');
const getPlistPath = require('./getPlistPath');

/**
 * This function works in a similar manner to its Android version,
 * except it does not copy fonts but creates XCode Group references
 */
module.exports = function linkAssetsIOS(files, projectConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const assets = groupFilesByType(files);
  const plist = getPlist(project, projectConfig.sourceDir);

  if (!plist) {
    return log.error(
      'ERRPLIST',
      `Could not locate Info.plist. Check if your project has 'INFOPLIST_FILE' set properly`
    );
  }

  if (!project.pbxGroupByName('Resources')) {
    createGroup(project, 'Resources');

    log.warn(
      'ERRGROUP',
      `Group 'Resources' does not exist in your XCode project. We have created it automatically for you.`
    );
  }

  const fonts = (assets.font || [])
    .map(asset =>
      project.addResourceFile(
        path.relative(projectConfig.sourceDir, asset),
        { target: project.getFirstTarget().uuid }
      )
    )
    .filter(file => file)   // xcode returns false if file is already there
    .map(file => file.basename);

  plist.UIAppFonts = (plist.UIAppFonts || []).concat(fonts);

  fs.writeFileSync(
    projectConfig.pbxprojPath,
    project.writeSync()
  );

  fs.writeFileSync(
    getPlistPath(project, projectConfig.sourceDir),
    plistParser.build(plist)
  );
};
