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
 * Find an android application path in the folder
 *
 * @param {String} folder Name of the folder where to seek
 * @return {String}
 */
module.exports = function findManifest(folder) {
  const manifestPath = glob.sync(path.join('**', 'AndroidManifest.xml'), {
    cwd: folder,
    ignore: ['node_modules/**', '**/build/**', 'Examples/**', 'examples/**'],
  })[0];

  return manifestPath ? path.join(folder, manifestPath) : null;
};
