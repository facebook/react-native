/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

module.exports = function findPodTargetLine(podLines, projectName) {
  const targetName = projectName.replace('.xcodeproj', '');
  //match first target definition in file: target 'target_name' do
  const targetRegex = new RegExp('target (\'|\")' + targetName + '(\'|\") do', 'g');
  for (let i = 0, len = podLines.length; i < len; i++) {
    const match = podLines[i].match(targetRegex);
    if (match) {
      return i + 1;
    }
  }
  return null;
};
