/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const mapHeaderSearchPaths = require('./mapHeaderSearchPaths');

/**
 * Given Xcode project and absolute path, it makes sure there are no headers referring to it
 */
module.exports = function addToHeaderSearchPaths(project, path) {
  mapHeaderSearchPaths(project, searchPaths =>
    searchPaths.filter(searchPath => searchPath !== path),
  );
};
