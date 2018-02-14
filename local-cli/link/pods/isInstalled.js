/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const readPodfile = require('./readPodfile');

module.exports = function isInstalled(iOSProject, dependencyConfig) {
  if (!iOSProject.podfile) {
    return false;
  }
  // match line with pod declaration: pod 'dependencyPodName' (other possible parameters of pod are ignored)
  const dependencyRegExp = new RegExp('pod\\s+(\'|\")' + dependencyConfig.podspec + '(\'|\")', 'g');
  const podLines = readPodfile(iOSProject.podfile);
  for (let i = 0, len = podLines.length; i < len; i++) {
    const match = podLines[i].match(dependencyRegExp);
    if (match) {
      return true;
    }
  }
  return false;
};
