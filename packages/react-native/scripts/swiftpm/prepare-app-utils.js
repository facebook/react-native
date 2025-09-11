/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {execSync} = require('child_process');
const path = require('path');

/**
 * Find the directory containing the Xcode project within the app path
 * @param {string} appPath - The root app path to search in
 * @param {string} xcodeProjectName - The name of the Xcode project file (e.g., 'HelloWorld.xcodeproj')
 * @returns {string} - The path to the directory containing the Xcode project
 */
function findXcodeProjectDirectory(
  appPath /*: string */,
  xcodeProjectName /*: string */,
) /*: string */ {
  try {
    // Use find command to search for the Xcode project
    const findCommand = `find "${appPath}" -name "${xcodeProjectName}" -type d -print`;
    const result = execSync(findCommand, {encoding: 'utf8'}).trim();

    if (!result) {
      throw new Error(
        `Xcode project '${xcodeProjectName}' not found in '${appPath}' or its subdirectories`,
      );
    }

    // Return the directory containing the Xcode project (parent of the .xcodeproj file)
    return path.dirname(result);
  } catch (error) {
    throw new Error(
      `Failed to find Xcode project '${xcodeProjectName}': ${error.message}`,
    );
  }
}

module.exports = {
  findXcodeProjectDirectory,
};
