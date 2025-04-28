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
 * @param {string} fromPath - The path to the source file or directory
 * @param {string} toPath - The path to the destination file or directory
 * @returns {void}
 * @throws {Error} If the source path does not exist or if the link creation fails
 */
function createLink(fromPath /*:string*/, toPath /*:string*/) {
  if (!fs.existsSync(fromPath)) {
    throw new Error(`Source path does not exist: ${fromPath}`);
  }

  // Check if the destination already exists
  if (fs.existsSync(toPath)) {
    return;
  }

  // Ensure the parent path of the link path
  createFolderIfNotExists(path.dirname(toPath));

  // Create the symbolic link
  fs.symlinkSync(fromPath, toPath, 'dir');

  // Check if the link was created successfully
  const linkTarget = fs.readlinkSync(toPath);
  if (linkTarget !== fromPath) {
    throw new Error(
      `Failed to create symbolic link: ${toPath} -> ${linkTarget}`,
    );
  }

  console.log(`Created symbolic link from ${fromPath} to ${toPath}`);
}

/**
 * Creates a folder if it does not exist
 * @param {string} folderPath - The path to the folder
 * @returns {string} The path to the created or existing folder
 */
function createFolderIfNotExists(folderPath /*:string*/) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {recursive: true});
  }
  return folderPath;
}

module.exports = {createLink, createFolderIfNotExists};
