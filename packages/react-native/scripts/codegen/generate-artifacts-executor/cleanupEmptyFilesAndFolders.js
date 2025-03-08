/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const path = require('path');

// It removes all the empty files and empty folders
// it finds, starting from `filepath`, recursively.
//
// This function is needed since, after aligning the codegen between
// iOS and Android, we have to create empty folders in advance and
// we don't know whether they will be populated up until the end of the process.
//
// @parameter filepath: the root path from which we want to remove the empty files and folders.
function cleanupEmptyFilesAndFolders(filepath) {
  const stats = fs.statSync(filepath);

  if (stats.isFile() && stats.size === 0) {
    fs.rmSync(filepath);
    return;
  } else if (stats.isFile()) {
    return;
  }

  const dirContent = fs.readdirSync(filepath);
  dirContent.forEach(contentPath =>
    cleanupEmptyFilesAndFolders(path.join(filepath, contentPath)),
  );

  // The original folder may be filled with empty folders
  // if that the case, we would also like to remove the parent.
  // Hence, we need to read the folder again.
  const newContent = fs.readdirSync(filepath);
  if (newContent.length === 0) {
    fs.rmdirSync(filepath);
    return;
  }
}

module.exports = {
  cleanupEmptyFilesAndFolders,
};
