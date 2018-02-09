/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const PbxFile = require('xcode/lib/pbxFile');
const removeFromPbxReferenceProxySection = require('./removeFromPbxReferenceProxySection');

/**
 * Removes file from static libraries
 *
 * Similar to `node-xcode` addStaticLibrary
 */
module.exports = function removeFromStaticLibraries(project, path, opts) {
  const file = new PbxFile(path);

  file.target = opts ? opts.target : undefined;

  project.removeFromPbxFileReferenceSection(file);
  project.removeFromPbxBuildFileSection(file);
  project.removeFromPbxFrameworksBuildPhase(file);
  project.removeFromLibrarySearchPaths(file);
  removeFromPbxReferenceProxySection(project, file);

  return file;
};
