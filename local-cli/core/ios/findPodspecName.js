/** @format */

'use strict';

const glob = require('glob');
const path = require('path');

module.exports = function findPodspecName(folder) {
  const podspecs = glob.sync('*.podspec', {cwd: folder});
  let podspecFile = null;
  if (podspecs.length === 0) {
    return null;
  } else if (podspecs.length === 1) {
    podspecFile = podspecs[0];
  } else {
    const folderParts = folder.split(path.sep);
    const currentFolder = folderParts[folderParts.length - 1];
    const toSelect = podspecs.indexOf(currentFolder + '.podspec');
    if (toSelect === -1) {
      podspecFile = podspecs[0];
    } else {
      podspecFile = podspecs[toSelect];
    }
  }

  return podspecFile.replace('.podspec', '');
};
