/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Given an array of xcodeproj libraries and pbxFile,
 * it appends it to that group
 *
 * Important: That function mutates `libraries` and it's not pure.
 * It's mainly due to limitations of `xcode` library.
 */
module.exports = function addProjectToLibraries(libraries, file) {
  return libraries.children.push({
    value: file.fileRef,
    comment: file.basename,
  });
};
