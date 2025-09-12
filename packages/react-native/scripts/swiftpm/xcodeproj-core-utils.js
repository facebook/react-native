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

module.exports = {
  generateXcodeObjectId,
};
