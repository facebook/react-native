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
 * Find an AndroidManifest.xml in the folder.
 *
 * @param {String} folder Name of the folder where to seek
 * @return {String}
 */
module.exports = function findManifest(folder) {
  // Android projects may contain multiple manifest files that are merged
  // during build. Usually we should use the manifest file of the main source
  // set at src/main/AndroidManifest.xml. If for some reason that manifest
  // isn't available (e.g. with a highly customised build setup) we should
  // look for the first manifest we find.
  const globOptions = {
    cwd: folder,
    ignore: ['**/build/**'],
  };

  const mainPattern = path.join('**', 'main', 'AndroidManifest.xml');
  const mainManifestPath = glob.sync(mainPattern, globOptions)[0];

  if (mainManifestPath) {
    return path.join(folder, mainManifestPath);
  }

  // Here it's possible that we might not find the manifest that contains what
  // our caller is looking for but this should be better than returning null.
  const anyPattern = path.join('**', 'AndroidManifest.xml');
  const anyManifestPath = glob.sync(anyPattern, globOptions)[0];

  return anyManifestPath ? path.join(folder, anyManifestPath) : null;
};
