/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const mapHeaderSearchPaths = require('./mapHeaderSearchPaths');

/**
 * Given Xcode project and absolute path, it makes sure there are no headers referring to it
 */
module.exports = function addToHeaderSearchPaths(project, path) {
  mapHeaderSearchPaths(project,
    searchPaths => searchPaths.filter(searchPath => searchPath !== path)
  );
};
