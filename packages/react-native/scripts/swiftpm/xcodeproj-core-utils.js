/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const crypto = require('crypto');

/**
 * Generate a random string of 24 HEX characters (capital letters) for Xcode object IDs
 * @returns {string} A 24-character hexadecimal string in uppercase
 */
function generateXcodeObjectId() /*: string */ {
  return crypto.randomBytes(12).toString('hex').toUpperCase();
}

/**
 * Generates a formatted string representation of a file for a build phase in Xcode project
 *
 * @param {string} objectId - The unique identifier of the Xcode object
 * @param {Object} objectData - The data associated with the Xcode object
 * @param {Object} allObjects - Dictionary of all Xcode objects indexed by their IDs
 * @returns {string} A formatted string representing the file in a build phase
 */
function printFilesForBuildPhase(
  objectId /*: string */,
  objectData /*: XcodeObject */,
  allObjects /*: {[string]: XcodeObject} */,
) /*: string */ {
  // Get the product name from the productRef in the PBXBuildFile
  let productName = 'Unknown';

  if (objectData.productRef) {
    const productRefObject = allObjects[objectData.productRef];
    if (productRefObject && productRefObject.productName) {
      productName = productRefObject.productName;
    }
  } else if (objectData.fileRef) {
    const fileRefObject = allObjects[objectData.fileRef];
    if (fileRefObject) {
      productName = fileRefObject.name || fileRefObject.path || 'Unknown';
    }
  }

  return `\t\t\t\t${objectId} /* ${productName} in Frameworks */,\n`;
}

module.exports = {
  generateXcodeObjectId,
  printFilesForBuildPhase,
};
