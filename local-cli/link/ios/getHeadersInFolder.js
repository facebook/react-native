/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const glob = require('glob');
const path = require('path');

const GLOB_EXCLUDE_PATTERN = [
  'node_modules/**',
  'Pods/**',
  'Examples/**',
  'examples/**',
];

/**
 * Given folder, it returns an array of all header files
 * inside it, ignoring node_modules and examples
 */
module.exports = function getHeadersInFolder(folder) {
  return glob
    .sync('**/*.h', {
      cwd: folder,
      nodir: true,
      ignore: GLOB_EXCLUDE_PATTERN,
    })
    .map(file => path.join(folder, file));
};
