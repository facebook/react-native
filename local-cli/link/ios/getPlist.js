/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const plistParser = require('plist');
const getPlistPath = require('./getPlistPath');
const fs = require('fs');

/**
 * Returns Info.plist located in the iOS project
 *
 * Returns `null` if INFOPLIST_FILE is not specified.
 */
module.exports = function getPlist(project, sourceDir) {
  const plistPath = getPlistPath(project, sourceDir);

  if (!plistPath || !fs.existsSync(plistPath)) {
    return null;
  }

  return plistParser.parse(fs.readFileSync(plistPath, 'utf-8'));
};
