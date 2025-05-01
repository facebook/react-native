/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const fs = require('fs');

/**
 * Creates a folder if it does not exist
 * @param {string} folderPath - The path to the folder
 * @returns {string} The path to the created or existing folder
 */
function createFolderIfNotExists(folderPath /*:string*/) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {recursive: true});
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Failed to create folder: ${folderPath}`);
    }
  }
  return folderPath;
}

module.exports = {createLink, createFolderIfNotExists};
