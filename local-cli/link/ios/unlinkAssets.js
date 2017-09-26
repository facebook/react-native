const fs = require('fs-extra');
const path = require('path');
const xcode = require('xcode');
const log = require('npmlog');
const groupFilesByType = require('../groupFilesByType');
const getPlist = require('./getPlist');
const writePlist = require('./writePlist');
const difference = require('lodash').difference;

/**
 * Unlinks assets from iOS project. Removes references for fonts from `Info.plist`
 * fonts provided by application and from `Resources` group
 */
module.exports = function unlinkAssetsIOS(files, projectConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const assets = groupFilesByType(files);
  const plist = getPlist(project, projectConfig.sourceDir);

  if (!plist) {
    return log.error(
      'ERRPLIST',
      `Could not locate Info.plist file. Check if your project has 'INFOPLIST_FILE' set properly`
    );
  }

  if (!project.pbxGroupByName('Resources')) {
    return log.error(
      'ERRGROUP',
      `Group 'Resources' does not exist in your Xcode project. There is nothing to unlink.`
    );
  }

  const removeResourceFile = function (f) {
    (f || [])
      .map(asset =>
        project.removeResourceFile(
          path.relative(projectConfig.sourceDir, asset),
          { target: project.getFirstTarget().uuid }
        )
      )
      .map(file => file.basename);
  }

  removeResourceFile(assets.image);

  const fonts = removeResourceFile(assets.font);

  plist.UIAppFonts = difference(plist.UIAppFonts || [], fonts);

  fs.writeFileSync(
    projectConfig.pbxprojPath,
    project.writeSync()
  );

  writePlist(project, projectConfig.sourceDir, plist);
};
