/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const glob = require('glob');
const path = require('path');

/**
 * Find the main file for the C# project
 *
 * @param {String} folder Name of the folder where to seek
 * @return {String}
 */
module.exports = function findMainFile(folder) {
  let mainFilePath = glob.sync('MainReactNativeHost.cs', {
    cwd: folder,
    ignore: ['node_modules/**', '**/build/**', 'Examples/**', 'examples/**'],
  });

  if (mainFilePath.length === 0) {
    mainFilePath = glob.sync('MainPage.cs', {
      cwd: folder,
      ignore: ['node_modules/**', '**/build/**', 'Examples/**', 'examples/**'],
    });
  }

  return mainFilePath && mainFilePath.length > 0 ? path.join(folder, mainFilePath) : null;
};
