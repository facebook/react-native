/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {execSync} = require('child_process');
const fs = require('fs');

/**
 * Creates a folder if it does not exist
 * @param {string} folderPath - The path to the folder
 * @returns {string} The path to the created or existing folder
 */
function createFolderIfNotExists(folderPath /*:string*/) /*: string */ {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {recursive: true});
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Failed to create folder: ${folderPath}`);
    }
  }
  return folderPath;
}

function throwIfOnEden() {
  try {
    execSync('eden info', {stdio: 'ignore'});
  } catch (error) {
    // eden info failed, we are not on Eden, do nothing
    return;
  }

  throw new Error('Cannot prepare the iOS prebuilds on an Eden checkout');
}

function prebuildLog(
  message /*: string */,
  level /*: 'info' | 'warning' | 'error' */ = 'warning',
) {
  // Simple log coloring for terminal output
  const prefix = '[Prebuild] ';
  let colorFn = (x /*:string*/) => x;
  if (process.stdout.isTTY) {
    if (level === 'info') colorFn = x => `\x1b[32m${x}\x1b[0m`;
    else if (level === 'error') colorFn = x => `\x1b[31m${x}\x1b[0m`;
    else colorFn = x => `\x1b[33m${x}\x1b[0m`;
  }

  console.log(colorFn(prefix + message));
}

module.exports = {
  createFolderIfNotExists,
  throwIfOnEden,
  prebuildLog,
};
