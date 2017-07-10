'use strict';

const fs = require('fs');

/**
 * Unregister native module IOS with CocoaPods
 */
module.exports = function unregisterNativeModule(dependencyConfig, iOSProject) {

  const podContent = fs.readFileSync(iOSProject.podfile, 'utf8');
  // this regex should catch line(s) with full pod definition
  const podRegex = new RegExp("\\n( |\\t)*pod\\s+(\"|')" + dependencyConfig.podspec + "(\"|')(,\\s*:[a-z]+\\s*=>\\s*((\"|').*?(\"|')|\\[[\\s\\S]*?\\]))*\\n", 'g');
  const removed = podContent.replace(podRegex, '\n');
  fs.writeFileSync(iOSProject.podfile, removed);

};
