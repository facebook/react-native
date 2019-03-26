/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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
