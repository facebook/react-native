/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const fs = require('fs');
const path = require('path');

function setupSymlink(
  sourceFilePath /*: string */,
  destFilePath /*: string */,
) {
  const destFolderPath = path.dirname(destFilePath);
  if (!fs.existsSync(destFolderPath)) {
    fs.mkdirSync(destFolderPath, {recursive: true});
  }

  // Remove existing symlink if it exists
  if (fs.existsSync(destFilePath)) {
    fs.unlinkSync(destFilePath);
  }

  // Create symlink for umbrella header
  if (fs.existsSync(sourceFilePath)) {
    fs.symlinkSync(sourceFilePath, destFilePath);
  }
}

module.exports = {
  setupSymlink,
};
