/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const path = require('path');

type ProjectInfo = {
  name: string;
  isWorkspace: boolean;
}

function findXcodeProject(files: Array<string>): ?ProjectInfo {
  const sortedFiles = files.sort();
  for (let i = sortedFiles.length - 1; i >= 0; i--) {
    const fileName = files[i];
    const ext = path.extname(fileName);

    if (ext === '.xcworkspace') {
      return {
        name: fileName,
        isWorkspace: true,
      };
    }
    if (ext === '.xcodeproj') {
      return {
        name: fileName,
        isWorkspace: false,
      };
    }
  }

  return null;
}

module.exports = findXcodeProject;
