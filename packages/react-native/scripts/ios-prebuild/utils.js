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
const path = require('path');

/**
 * Creates a symbolic link from one path to another
 * @param {string} source - The path to the source file or directory
 * @param {string} target - The path to the destination file or directory
 * @returns {void}
 * @throws {Error} If the source path does not exist or if the link creation fails
 */
function createLink(source /*:string*/, target /*:string*/) {
  if (!fs.existsSync(source)) {
    throw new Error(`Source path does not exist: ${source}`);
  }

  // Check if the destination already exists
  if (fs.existsSync(target)) {
    return;
  }

  // Ensure the parent path of the link path
  createFolderIfNotExists(target);

  // Create links for all header files (*.h, *.hpp) in the source directory
  const entries = fs.readdirSync(source, {
    withFileTypes: true,
    recursive: false,
  });

  entries.forEach(entry => {
    if (entry.isFile() && /\.(h|hpp)$/.test(entry.name)) {
      const sourceFile = path.join(source, entry.name);
      const targetFile = path.join(target, entry.name);
      fs.linkSync(sourceFile, targetFile);
    }
  });

  console.log(`Created symbolic link from ${source} to ${target}`);
}

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
