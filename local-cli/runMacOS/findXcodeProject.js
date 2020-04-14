/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 * @format
 * @ts-check
 */
'use strict';

const path = require('path');

/**
 * @param {string[]} files
 */
function findXcodeProject(files) {
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
